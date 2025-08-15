"""
Standardized Error Handling System for SGPT API
Phase 2 Enhancement: Consistent error responses across all endpoints
"""

import logging
import time
from typing import Any, Dict, List, Optional, Union
from uuid import uuid4

from fastapi import HTTPException, Request, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ValidationError
from sqlalchemy.exc import (
    IntegrityError,
    NoResultFound,
    SQLAlchemyError,
)

logger = logging.getLogger(__name__)


# ============================================================================
# STANDARDIZED ERROR RESPONSE SCHEMAS
# ============================================================================

class ErrorDetail(BaseModel):
    """Individual error detail"""
    field: Optional[str] = None
    message: str
    code: Optional[str] = None


class StandardErrorResponse(BaseModel):
    """Standardized error response format"""
    success: bool = False
    error: str
    message: str
    details: Optional[List[ErrorDetail]] = None
    error_id: str
    timestamp: float
    path: Optional[str] = None
    status_code: int


# ============================================================================
# ERROR CODE CONSTANTS
# ============================================================================

class ErrorCodes:
    """Standardized error codes"""
    # Authentication & Authorization
    UNAUTHORIZED = "AUTH_UNAUTHORIZED"
    FORBIDDEN = "AUTH_FORBIDDEN"
    TOKEN_EXPIRED = "AUTH_TOKEN_EXPIRED"
    TOKEN_INVALID = "AUTH_TOKEN_INVALID"
    
    # Validation
    VALIDATION_ERROR = "VALIDATION_ERROR"
    MISSING_FIELD = "VALIDATION_MISSING_FIELD"
    INVALID_FORMAT = "VALIDATION_INVALID_FORMAT"
    
    # Database
    NOT_FOUND = "DB_NOT_FOUND"
    DUPLICATE_ENTRY = "DB_DUPLICATE_ENTRY"
    CONSTRAINT_VIOLATION = "DB_CONSTRAINT_VIOLATION"
    DATABASE_ERROR = "DB_ERROR"
    
    # Business Logic
    BUSINESS_RULE_VIOLATION = "BUSINESS_RULE_VIOLATION"
    INSUFFICIENT_PERMISSIONS = "BUSINESS_INSUFFICIENT_PERMISSIONS"
    QUOTA_EXCEEDED = "BUSINESS_QUOTA_EXCEEDED"
    
    # External Services
    EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR"
    RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED"
    
    # System
    INTERNAL_ERROR = "INTERNAL_ERROR"
    SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE"


# ============================================================================
# STANDARDIZED ERROR HANDLERS
# ============================================================================

class StandardErrorHandler:
    """Centralized error handling with consistent responses"""
    
    @staticmethod
    def create_error_response(
        error_code: str,
        message: str,
        status_code: int = 500,
        details: Optional[List[ErrorDetail]] = None,
        path: Optional[str] = None,
    ) -> StandardErrorResponse:
        """Create a standardized error response"""
        error_id = f"err_{uuid4().hex[:12]}"
        
        return StandardErrorResponse(
            error=error_code,
            message=message,
            details=details or [],
            error_id=error_id,
            timestamp=time.time(),
            path=path,
            status_code=status_code,
        )
    
    @staticmethod
    def validation_error(
        message: str = "Validation failed",
        details: Optional[List[ErrorDetail]] = None,
        path: Optional[str] = None,
    ) -> HTTPException:
        """Create validation error response"""
        error_response = StandardErrorHandler.create_error_response(
            error_code=ErrorCodes.VALIDATION_ERROR,
            message=message,
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            details=details,
            path=path,
        )
        return HTTPException(
            status_code=error_response.status_code,
            detail=error_response.dict(),
        )
    
    @staticmethod
    def not_found_error(
        resource: str,
        resource_id: Optional[str] = None,
        path: Optional[str] = None,
    ) -> HTTPException:
        """Create not found error response"""
        message = f"{resource} not found"
        if resource_id:
            message += f" (ID: {resource_id})"
            
        error_response = StandardErrorHandler.create_error_response(
            error_code=ErrorCodes.NOT_FOUND,
            message=message,
            status_code=status.HTTP_404_NOT_FOUND,
            path=path,
        )
        return HTTPException(
            status_code=error_response.status_code,
            detail=error_response.dict(),
        )
    
    @staticmethod
    def duplicate_error(
        resource: str,
        field: str,
        value: str,
        path: Optional[str] = None,
    ) -> HTTPException:
        """Create duplicate entry error response"""
        message = f"{resource} with {field} '{value}' already exists"
        details = [ErrorDetail(field=field, message=f"Value '{value}' is already in use")]
        
        error_response = StandardErrorHandler.create_error_response(
            error_code=ErrorCodes.DUPLICATE_ENTRY,
            message=message,
            status_code=status.HTTP_409_CONFLICT,
            details=details,
            path=path,
        )
        return HTTPException(
            status_code=error_response.status_code,
            detail=error_response.dict(),
        )
    
    @staticmethod
    def unauthorized_error(
        message: str = "Authentication required",
        path: Optional[str] = None,
    ) -> HTTPException:
        """Create unauthorized error response"""
        error_response = StandardErrorHandler.create_error_response(
            error_code=ErrorCodes.UNAUTHORIZED,
            message=message,
            status_code=status.HTTP_401_UNAUTHORIZED,
            path=path,
        )
        return HTTPException(
            status_code=error_response.status_code,
            detail=error_response.dict(),
        )
    
    @staticmethod
    def forbidden_error(
        message: str = "Insufficient permissions",
        path: Optional[str] = None,
    ) -> HTTPException:
        """Create forbidden error response"""
        error_response = StandardErrorHandler.create_error_response(
            error_code=ErrorCodes.FORBIDDEN,
            message=message,
            status_code=status.HTTP_403_FORBIDDEN,
            path=path,
        )
        return HTTPException(
            status_code=error_response.status_code,
            detail=error_response.dict(),
        )
    
    @staticmethod
    def database_error(
        message: str = "Database operation failed",
        path: Optional[str] = None,
    ) -> HTTPException:
        """Create database error response"""
        error_response = StandardErrorHandler.create_error_response(
            error_code=ErrorCodes.DATABASE_ERROR,
            message=message,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            path=path,
        )
        return HTTPException(
            status_code=error_response.status_code,
            detail=error_response.dict(),
        )
    
    @staticmethod
    def business_rule_error(
        message: str,
        path: Optional[str] = None,
    ) -> HTTPException:
        """Create business rule violation error response"""
        error_response = StandardErrorHandler.create_error_response(
            error_code=ErrorCodes.BUSINESS_RULE_VIOLATION,
            message=message,
            status_code=status.HTTP_400_BAD_REQUEST,
            path=path,
        )
        return HTTPException(
            status_code=error_response.status_code,
            detail=error_response.dict(),
        )


# ============================================================================
# EXCEPTION MAPPERS
# ============================================================================

def map_sqlalchemy_exception(exc: SQLAlchemyError, path: Optional[str] = None) -> HTTPException:
    """Map SQLAlchemy exceptions to standardized responses"""
    if isinstance(exc, IntegrityError):
        # Check if it's a duplicate key error
        error_msg = str(exc.orig) if hasattr(exc, 'orig') else str(exc)
        if "duplicate key" in error_msg.lower() or "unique constraint" in error_msg.lower():
            return StandardErrorHandler.duplicate_error("Resource", "field", "unknown", path)
        else:
            return StandardErrorHandler.database_error("Data integrity constraint violated", path)
    
    elif isinstance(exc, NoResultFound):
        return StandardErrorHandler.not_found_error("Resource", path=path)
    
    else:
        logger.error(f"Unhandled SQLAlchemy exception: {exc}")
        return StandardErrorHandler.database_error("Database operation failed", path)


def map_validation_exception(exc: ValidationError, path: Optional[str] = None) -> HTTPException:
    """Map Pydantic validation exceptions to standardized responses"""
    details = []
    for error in exc.errors():
        field = ".".join(str(x) for x in error["loc"]) if error["loc"] else None
        details.append(ErrorDetail(
            field=field,
            message=error["msg"],
            code=error["type"]
        ))
    
    return StandardErrorHandler.validation_error(
        message="Request validation failed",
        details=details,
        path=path,
    )


# ============================================================================
# DECORATORS FOR STANDARDIZED ERROR HANDLING
# ============================================================================

def standardize_errors(func):
    """Decorator to standardize error handling in endpoints"""
    import functools
    
    @functools.wraps(func)
    async def wrapper(*args, **kwargs):
        try:
            return await func(*args, **kwargs)
        except HTTPException:
            # Re-raise HTTP exceptions as they're already formatted
            raise
        except ValidationError as e:
            raise map_validation_exception(e)
        except SQLAlchemyError as e:
            raise map_sqlalchemy_exception(e)
        except Exception as e:
            logger.error(f"Unhandled exception in {func.__name__}: {e}")
            raise StandardErrorHandler.create_error_response(
                error_code=ErrorCodes.INTERNAL_ERROR,
                message="An unexpected error occurred",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
    
    return wrapper


# ============================================================================
# GLOBAL ERROR HANDLERS
# ============================================================================

async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Global exception handler for unhandled errors"""
    error_id = f"err_{uuid4().hex[:12]}"

    logger.error(f"Unhandled exception {error_id}: {exc}", exc_info=True)

    # Temporarily always include debug details to diagnose 500s in local dev
    include_debug = True

    message = "An unexpected error occurred"
    if include_debug:
        message = f"{message}: {exc.__class__.__name__}: {exc}"

    error_response = StandardErrorResponse(
        error=ErrorCodes.INTERNAL_ERROR,
        message=message,
        error_id=error_id,
        timestamp=time.time(),
        path=request.url.path,
        status_code=500,
    )

    return JSONResponse(
        status_code=500,
        content=error_response.dict(),
    )


async def validation_exception_handler(request: Request, exc: ValidationError) -> JSONResponse:
    """Global validation exception handler"""
    mapped_exception = map_validation_exception(exc, request.url.path)
    return JSONResponse(
        status_code=mapped_exception.status_code,
        content=mapped_exception.detail,
    )


# ============================================================================
# USAGE EXAMPLES AND HELPERS
# ============================================================================

# Example usage in endpoints:
"""
@router.post("/example")
@standardize_errors
async def example_endpoint(data: SomeSchema):
    # Your endpoint logic here
    if not some_condition:
        raise StandardErrorHandler.business_rule_error("Business rule violated")
    
    return {"success": True}
"""