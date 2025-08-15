"""
Error Response Standardization System
Provides consistent error formats across all API endpoints
"""

import logging
import sys
import time
import uuid
from dataclasses import asdict, dataclass
from enum import Enum
from typing import Any

from fastapi import HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

logger = logging.getLogger(__name__)


class ErrorCategory(Enum):
    VALIDATION = "validation"
    AUTHENTICATION = "authentication"
    AUTHORIZATION = "authorization"
    NOT_FOUND = "not_found"
    CONFLICT = "conflict"
    RATE_LIMIT = "rate_limit"
    SERVER_ERROR = "server_error"
    DATABASE_ERROR = "database_error"
    EXTERNAL_SERVICE = "external_service"
    BUSINESS_LOGIC = "business_logic"


class ErrorSeverity(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


@dataclass
class ErrorDetail:
    field: str | None = None
    code: str | None = None
    message: str | None = None
    value: Any | None = None


@dataclass
class StandardErrorResponse:
    error_id: str
    status_code: int
    category: str
    severity: str
    message: str
    details: list[ErrorDetail] | None = None
    timestamp: float = None
    path: str | None = None
    method: str | None = None
    user_id: str | None = None
    correlation_id: str | None = None

    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = time.time()


class ErrorStandardizer:
    """Centralized error response standardization"""

    def __init__(self):
        self.error_mappings = self._initialize_error_mappings()
        self.error_templates = self._initialize_error_templates()

    def _initialize_error_mappings(self) -> dict[int, dict[str, Any]]:
        """Initialize HTTP status code to error category mappings"""
        return {
            400: {
                "category": ErrorCategory.VALIDATION,
                "severity": ErrorSeverity.LOW,
                "default_message": "Bad request - please check your input",
            },
            401: {
                "category": ErrorCategory.AUTHENTICATION,
                "severity": ErrorSeverity.MEDIUM,
                "default_message": "Authentication required",
            },
            403: {
                "category": ErrorCategory.AUTHORIZATION,
                "severity": ErrorSeverity.MEDIUM,
                "default_message": "Access denied",
            },
            404: {
                "category": ErrorCategory.NOT_FOUND,
                "severity": ErrorSeverity.LOW,
                "default_message": "Resource not found",
            },
            409: {
                "category": ErrorCategory.CONFLICT,
                "severity": ErrorSeverity.MEDIUM,
                "default_message": "Conflict with existing resource",
            },
            422: {
                "category": ErrorCategory.VALIDATION,
                "severity": ErrorSeverity.LOW,
                "default_message": "Validation error",
            },
            429: {
                "category": ErrorCategory.RATE_LIMIT,
                "severity": ErrorSeverity.MEDIUM,
                "default_message": "Rate limit exceeded",
            },
            500: {
                "category": ErrorCategory.SERVER_ERROR,
                "severity": ErrorSeverity.HIGH,
                "default_message": "Internal server error",
            },
            502: {
                "category": ErrorCategory.EXTERNAL_SERVICE,
                "severity": ErrorSeverity.HIGH,
                "default_message": "External service unavailable",
            },
            503: {
                "category": ErrorCategory.SERVER_ERROR,
                "severity": ErrorSeverity.CRITICAL,
                "default_message": "Service unavailable",
            },
        }

    def _initialize_error_templates(self) -> dict[str, str]:
        """Initialize user-friendly error message templates"""
        return {
            "validation.required_field": "The field '{field}' is required",
            "validation.invalid_format": "The field '{field}' has an invalid format",
            "validation.out_of_range": "The field '{field}' is out of allowed range",
            "validation.too_short": "The field '{field}' is too short (minimum: {min_length})",
            "validation.too_long": "The field '{field}' is too long (maximum: {max_length})",
            "authentication.invalid_credentials": "Invalid username or password",
            "authentication.token_expired": "Your session has expired, please log in again",
            "authentication.token_invalid": "Invalid authentication token",
            "authorization.insufficient_permissions": "You don't have permission to perform this action",
            "authorization.resource_access_denied": "Access denied to the requested resource",
            "not_found.resource": "The requested {resource_type} was not found",
            "not_found.endpoint": "The requested endpoint does not exist",
            "conflict.duplicate_resource": "A {resource_type} with this {field} already exists",
            "conflict.invalid_state": "Operation cannot be performed in the current state",
            "rate_limit.exceeded": "Too many requests. Please try again in {retry_after} seconds",
            "server_error.database": "Database operation failed",
            "server_error.external_service": "External service is temporarily unavailable",
            "server_error.unexpected": "An unexpected error occurred",
        }

    def standardize_error(
        self,
        status_code: int,
        message: str | None = None,
        details: list[ErrorDetail] | None = None,
        category: ErrorCategory | None = None,
        severity: ErrorSeverity | None = None,
        request: Request | None = None,
        exception: Exception | None = None,
    ) -> StandardErrorResponse:
        """Standardize an error into consistent format"""

        # Generate unique error ID
        error_id = str(uuid.uuid4())

        # Get error mapping for status code
        error_mapping = self.error_mappings.get(
            status_code,
            {
                "category": ErrorCategory.SERVER_ERROR,
                "severity": ErrorSeverity.HIGH,
                "default_message": "Unknown error occurred",
            },
        )

        # Use provided values or fall back to mappings
        final_category = category or error_mapping["category"]
        final_severity = severity or error_mapping["severity"]
        final_message = message or error_mapping["default_message"]

        # Extract request information
        path = request.url.path if request else None
        method = request.method if request else None
        user_id = getattr(request.state, "user_id", None) if request else None
        correlation_id = (
            request.headers.get("X-Correlation-ID") if request else None
        )

        # Create standardized response
        error_response = StandardErrorResponse(
            error_id=error_id,
            status_code=status_code,
            category=final_category.value,
            severity=final_severity.value,
            message=final_message,
            details=details,
            path=path,
            method=method,
            user_id=user_id,
            correlation_id=correlation_id,
        )

        # Log error for monitoring
        self._log_error(error_response, exception)

        return error_response

    def format_validation_errors(
        self, validation_errors: list[dict[str, Any]]
    ) -> list[ErrorDetail]:
        """Format FastAPI validation errors into standard format"""
        details = []

        for error in validation_errors:
            field_path = ".".join(str(loc) for loc in error.get("loc", []))
            error_type = error.get("type", "validation_error")
            error_msg = error.get("msg", "Validation failed")
            error_input = error.get("input")

            # Map common validation errors to user-friendly messages
            if error_type == "missing":
                message = self.error_templates.get(
                    "validation.required_field", error_msg
                ).format(field=field_path)
            elif error_type == "string_too_short":
                min_length = error.get("ctx", {}).get("limit_value", "unknown")
                message = self.error_templates.get(
                    "validation.too_short", error_msg
                ).format(field=field_path, min_length=min_length)
            elif error_type == "string_too_long":
                max_length = error.get("ctx", {}).get("limit_value", "unknown")
                message = self.error_templates.get(
                    "validation.too_long", error_msg
                ).format(field=field_path, max_length=max_length)
            elif error_type in ["value_error", "type_error"]:
                message = self.error_templates.get(
                    "validation.invalid_format", error_msg
                ).format(field=field_path)
            else:
                message = error_msg

            details.append(
                ErrorDetail(
                    field=field_path,
                    code=error_type,
                    message=message,
                    value=error_input,
                )
            )

        return details

    def create_business_logic_error(
        self,
        message: str,
        code: str,
        status_code: int = 400,
        field: str | None = None,
        request: Request | None = None,
    ) -> StandardErrorResponse:
        """Create a business logic error with standard format"""

        details = [ErrorDetail(field=field, code=code, message=message)]

        return self.standardize_error(
            status_code=status_code,
            message=message,
            details=details,
            category=ErrorCategory.BUSINESS_LOGIC,
            severity=ErrorSeverity.MEDIUM,
            request=request,
        )

    def _log_error(
        self,
        error_response: StandardErrorResponse,
        exception: Exception | None = None,
    ):
        """Log error for monitoring and debugging"""

        log_data = {
            "error_id": error_response.error_id,
            "status_code": error_response.status_code,
            "category": error_response.category,
            "severity": error_response.severity,
            "message": error_response.message,
            "path": error_response.path,
            "method": error_response.method,
            "user_id": error_response.user_id,
            "correlation_id": error_response.correlation_id,
        }

        # Choose log level based on severity
        if error_response.severity == ErrorSeverity.CRITICAL.value:
            log_level = logging.CRITICAL
        elif error_response.severity == ErrorSeverity.HIGH.value:
            log_level = logging.ERROR
        elif error_response.severity == ErrorSeverity.MEDIUM.value:
            log_level = logging.WARNING
        else:
            log_level = logging.INFO

        # Log with appropriate level
        logger.log(
            log_level, f"API Error: {error_response.message}", extra=log_data
        )

        # Log exception traceback for server errors
        if exception and error_response.status_code >= 500:
            logger.error(
                f"Exception for error {error_response.error_id}:",
                exc_info=exception,
            )


# Global error standardizer instance
error_standardizer = ErrorStandardizer()


# Exception handlers
def validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    """Handle FastAPI validation errors"""
    details = error_standardizer.format_validation_errors(exc.errors())

    error_response = error_standardizer.standardize_error(
        status_code=422,
        message="Request validation failed",
        details=details,
        category=ErrorCategory.VALIDATION,
        severity=ErrorSeverity.LOW,
        request=request,
    )

    return JSONResponse(
        status_code=error_response.status_code, content=asdict(error_response)
    )


def http_exception_handler(
    request: Request, exc: HTTPException
) -> JSONResponse:
    """Handle FastAPI HTTP exceptions"""
    error_response = error_standardizer.standardize_error(
        status_code=exc.status_code,
        message=exc.detail,
        request=request,
        exception=exc,
    )

    return JSONResponse(
        status_code=error_response.status_code, content=asdict(error_response)
    )


def starlette_http_exception_handler(
    request: Request, exc: StarletteHTTPException
) -> JSONResponse:
    """Handle Starlette HTTP exceptions"""
    error_response = error_standardizer.standardize_error(
        status_code=exc.status_code,
        message=exc.detail,
        request=request,
        exception=exc,
    )

    return JSONResponse(
        status_code=error_response.status_code, content=asdict(error_response)
    )


def general_exception_handler(
    request: Request, exc: Exception
) -> JSONResponse:
    """Handle all other exceptions"""

    # Don't expose internal errors in production
    is_development = (
        getattr(sys, "_called_from_test", False)
        or logging.getLogger().level == logging.DEBUG
    )

    if is_development:
        message = f"{type(exc).__name__}: {str(exc)}"
    else:
        message = "An internal error occurred"

    error_response = error_standardizer.standardize_error(
        status_code=500,
        message=message,
        category=ErrorCategory.SERVER_ERROR,
        severity=ErrorSeverity.HIGH,
        request=request,
        exception=exc,
    )

    return JSONResponse(
        status_code=error_response.status_code, content=asdict(error_response)
    )


# Utility functions for common error patterns
def create_not_found_error(
    resource_type: str,
    resource_id: str | int,
    request: Request | None = None,
) -> StandardErrorResponse:
    """Create a standardized not found error"""
    message = f"{resource_type.title()} with ID '{resource_id}' not found"

    return error_standardizer.standardize_error(
        status_code=404,
        message=message,
        category=ErrorCategory.NOT_FOUND,
        severity=ErrorSeverity.LOW,
        request=request,
    )


def create_duplicate_error(
    resource_type: str,
    field: str,
    value: str,
    request: Request | None = None,
) -> StandardErrorResponse:
    """Create a standardized duplicate resource error"""
    message = f"A {resource_type} with {field} '{value}' already exists"

    details = [
        ErrorDetail(
            field=field, code="duplicate_value", message=message, value=value
        )
    ]

    return error_standardizer.standardize_error(
        status_code=409,
        message=message,
        details=details,
        category=ErrorCategory.CONFLICT,
        severity=ErrorSeverity.MEDIUM,
        request=request,
    )


def create_unauthorized_error(
    message: str = "Authentication required", request: Request | None = None
) -> StandardErrorResponse:
    """Create a standardized unauthorized error"""
    return error_standardizer.standardize_error(
        status_code=401,
        message=message,
        category=ErrorCategory.AUTHENTICATION,
        severity=ErrorSeverity.MEDIUM,
        request=request,
    )


def create_forbidden_error(
    message: str = "Access denied", request: Request | None = None
) -> StandardErrorResponse:
    """Create a standardized forbidden error"""
    return error_standardizer.standardize_error(
        status_code=403,
        message=message,
        category=ErrorCategory.AUTHORIZATION,
        severity=ErrorSeverity.MEDIUM,
        request=request,
    )


def create_rate_limit_error(
    retry_after: int, request: Request | None = None
) -> StandardErrorResponse:
    """Create a standardized rate limit error"""
    message = f"Rate limit exceeded. Try again in {retry_after} seconds"

    return error_standardizer.standardize_error(
        status_code=429,
        message=message,
        category=ErrorCategory.RATE_LIMIT,
        severity=ErrorSeverity.MEDIUM,
        request=request,
    )


# Decorator for automatic error handling
def handle_errors(func):
    """Decorator to automatically handle and standardize errors"""
    import functools
    import inspect

    @functools.wraps(func)
    async def async_wrapper(*args, **kwargs):
        try:
            return await func(*args, **kwargs)
        except HTTPException:
            raise  # Let FastAPI handle these
        except Exception as e:
            # Try to get request from args
            request = None
            for arg in args:
                if isinstance(arg, Request):
                    request = arg
                    break

            error_response = error_standardizer.standardize_error(
                status_code=500,
                message="An internal error occurred",
                request=request,
                exception=e,
            )

            raise HTTPException(
                status_code=error_response.status_code,
                detail=asdict(error_response),
            )

    @functools.wraps(func)
    def sync_wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except HTTPException:
            raise  # Let FastAPI handle these
        except Exception as e:
            # Try to get request from args
            request = None
            for arg in args:
                if isinstance(arg, Request):
                    request = arg
                    break

            error_response = error_standardizer.standardize_error(
                status_code=500,
                message="An internal error occurred",
                request=request,
                exception=e,
            )

            raise HTTPException(
                status_code=error_response.status_code,
                detail=asdict(error_response),
            )

    return async_wrapper if inspect.iscoroutinefunction(func) else sync_wrapper
