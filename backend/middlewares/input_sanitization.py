"""
Input Sanitization Middleware
Automatically sanitizes all incoming request data to prevent XSS and injection attacks
"""

import json
import logging
from collections.abc import Callable
from typing import Any

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from services.input_sanitizer import input_sanitizer

logger = logging.getLogger(__name__)


class InputSanitizationMiddleware(BaseHTTPMiddleware):
    """
    Middleware that automatically sanitizes incoming request data
    Provides comprehensive XSS and injection protection
    """

    def __init__(self, app):
        super().__init__(app)

        # Endpoints that should skip sanitization (like file uploads)
        self.skip_sanitization = [
            "/api/v1/upload",
            "/api/v1/download",
            "/api/v1/health",
            "/docs",
            "/openapi.json",
            "/redoc",
        ]

        # Endpoints that allow HTML content
        self.allow_html_endpoints = [
            "/api/v1/templates",
            "/api/v1/campaigns",
            "/api/v1/compose",
        ]

        # Fields that should not be sanitized (like passwords)
        self.skip_fields = [
            "password",
            "password_hash",
            "secret",
            "token",
            "api_key",
            "private_key",
        ]

    def should_skip_sanitization(self, path: str) -> bool:
        """Check if path should skip sanitization"""
        return any(skip_path in path for skip_path in self.skip_sanitization)

    def should_allow_html(self, path: str) -> bool:
        """Check if path should allow HTML content"""
        return any(
            html_path in path for html_path in self.allow_html_endpoints
        )

    def sanitize_request_data(
        self, data: dict[str, Any], allow_html: bool = False
    ) -> dict[str, Any]:
        """
        Sanitize request data while preserving important fields

        Args:
            data: Request data to sanitize
            allow_html: Whether to allow HTML in string fields

        Returns:
            Dict: Sanitized data
        """
        if not isinstance(data, dict):
            return data

        sanitized = {}

        for key, value in data.items():
            # Skip sensitive fields
            if key.lower() in self.skip_fields:
                sanitized[key] = value
                continue

            # Sanitize based on field type
            if isinstance(value, str):
                # Special handling for specific field types
                if key.lower() in ["email", "email_address"]:
                    sanitized_value = input_sanitizer.sanitize_email(value)
                    if sanitized_value is None:
                        logger.warning(f"Invalid email rejected: {value}")
                        continue  # Skip invalid emails
                    sanitized[key] = sanitized_value
                elif key.lower() in ["url", "website", "link"]:
                    sanitized_value = input_sanitizer.sanitize_url(value)
                    if sanitized_value is None:
                        logger.warning(f"Invalid URL rejected: {value}")
                        continue  # Skip invalid URLs
                    sanitized[key] = sanitized_value
                elif key.lower() in ["filename", "file_name"]:
                    sanitized[key] = input_sanitizer.sanitize_filename(value)
                else:
                    # General text sanitization
                    sanitized[key] = input_sanitizer.sanitize_text(
                        value, allow_html=allow_html
                    )

            elif isinstance(value, dict):
                sanitized[key] = self.sanitize_request_data(value, allow_html)

            elif isinstance(value, list):
                sanitized[key] = self.sanitize_list_data(value, allow_html)

            else:
                # Keep other types as-is (numbers, booleans, etc.)
                sanitized[key] = value

        return sanitized

    def sanitize_list_data(self, data: list, allow_html: bool = False) -> list:
        """Sanitize list data"""
        sanitized = []

        for item in data:
            if isinstance(item, str):
                sanitized.append(
                    input_sanitizer.sanitize_text(item, allow_html=allow_html)
                )
            elif isinstance(item, dict):
                sanitized.append(self.sanitize_request_data(item, allow_html))
            elif isinstance(item, list):
                sanitized.append(self.sanitize_list_data(item, allow_html))
            else:
                sanitized.append(item)

        return sanitized

    async def sanitize_request_body(self, request: Request) -> dict[str, Any]:
        """
        Extract and sanitize request body

        Args:
            request: FastAPI request object

        Returns:
            Dict: Sanitized request data
        """
        try:
            # Check content type
            content_type = request.headers.get("content-type", "")

            if "application/json" in content_type:
                # Handle JSON data
                body = await request.body()
                if body:
                    data = json.loads(body)
                    allow_html = self.should_allow_html(request.url.path)
                    return self.sanitize_request_data(data, allow_html)

            elif "application/x-www-form-urlencoded" in content_type:
                # Handle form data
                form_data = await request.form()
                data = dict(form_data)
                allow_html = self.should_allow_html(request.url.path)
                return self.sanitize_request_data(data, allow_html)

            elif "multipart/form-data" in content_type:
                # Handle multipart form data (careful with file uploads)
                form_data = await request.form()
                sanitized_data = {}

                for key, value in form_data.items():
                    # Skip file uploads
                    if hasattr(value, "read"):  # File-like object
                        sanitized_data[key] = value
                    else:
                        # Sanitize text fields
                        if key.lower() not in self.skip_fields:
                            allow_html = self.should_allow_html(
                                request.url.path
                            )
                            sanitized_data[key] = (
                                input_sanitizer.sanitize_text(
                                    str(value), allow_html
                                )
                            )
                        else:
                            sanitized_data[key] = value

                return sanitized_data

            return {}

        except Exception as e:
            logger.error(f"Error sanitizing request body: {e}")
            return {}

    async def create_sanitized_request(
        self, request: Request, sanitized_data: dict[str, Any]
    ) -> Request:
        """
        Create a new request object with sanitized data

        Args:
            request: Original request
            sanitized_data: Sanitized data

        Returns:
            Request: New request with sanitized data
        """
        try:
            # For JSON requests, replace the body
            if sanitized_data and "application/json" in request.headers.get(
                "content-type", ""
            ):
                # Store sanitized data in request state for the endpoint to use
                request.state.sanitized_data = sanitized_data

            return request

        except Exception as e:
            logger.error(f"Error creating sanitized request: {e}")
            return request

    async def log_security_threats(
        self, request: Request, data: dict[str, Any]
    ):
        """Log detected security threats"""
        try:
            # Generate security report
            report = input_sanitizer.create_security_report(data)

            if report["potential_threats"]:
                client_ip = (
                    request.client.host if request.client else "unknown"
                )
                user_agent = request.headers.get("user-agent", "unknown")

                logger.warning(
                    f"Security threats detected: IP={client_ip}, "
                    f"Path={request.url.path}, Threats={len(report['potential_threats'])}, "
                    f"Risk={report['risk_level']}, UserAgent={user_agent}"
                )

                # Log individual threats
                for threat in report["potential_threats"]:
                    logger.warning(
                        f"Security threat: Field={threat['field']}, "
                        f"Type={threat['type']}, Severity={threat['severity']}"
                    )

                # Integrate with audit logging system
                try:
                    from core.audit_logger import audit_logger
                    await audit_logger.log_security_event(
                        event_type="input_sanitization_threat",
                        severity="HIGH" if any(t["severity"] == "HIGH" for t in report["potential_threats"]) else "MEDIUM",
                        details={
                            "path": str(request.url.path),
                            "method": request.method,
                            "threats": report["potential_threats"],
                            "client_ip": getattr(request.client, 'host', 'unknown') if request.client else 'unknown',
                            "user_agent": request.headers.get("user-agent", "unknown")
                        },
                        user_id=getattr(request.state, 'user_id', None),
                        ip_address=getattr(request.client, 'host', 'unknown') if request.client else 'unknown',
                        user_agent=request.headers.get("user-agent", "unknown")
                    )
                except Exception as audit_error:
                    logger.error(f"Failed to log security event to audit system: {audit_error}")

        except Exception as e:
            logger.error(f"Error logging security threats: {e}")

    async def dispatch(
        self, request: Request, call_next: Callable
    ) -> Response:
        """Main middleware logic"""
        try:
            # Skip sanitization for certain endpoints
            if self.should_skip_sanitization(request.url.path):
                return await call_next(request)

            # Skip for GET requests (no body to sanitize)
            if request.method == "GET":
                return await call_next(request)

            # Extract and sanitize request data
            original_data = await self.sanitize_request_body(request)

            if original_data:
                # Log security threats before sanitization
                await self.log_security_threats(request, original_data)

                # Create sanitized request
                request = await self.create_sanitized_request(
                    request, original_data
                )

            # Process request
            response = await call_next(request)

            # Add security headers to response
            response.headers.update(
                {
                    "X-Content-Type-Options": "nosniff",
                    "X-Frame-Options": "DENY",
                    "X-XSS-Protection": "1; mode=block",
                    "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';",
                    "Referrer-Policy": "strict-origin-when-cross-origin",
                    "X-Input-Sanitized": "true",
                }
            )

            return response

        except Exception as e:
            logger.error(f"Input sanitization middleware error: {e}")

            # Return error response for security issues
            if "potential" in str(e).lower() or "threat" in str(e).lower():
                return JSONResponse(
                    status_code=400,
                    content={
                        "error": "Invalid input data",
                        "message": "Request contains potentially harmful content",
                        "code": "INPUT_VALIDATION_ERROR",
                    },
                )

            # For other errors, continue with original request
            return await call_next(request)

    def get_stats(self) -> dict[str, Any]:
        """Get middleware statistics"""
        return {
            "middleware": "InputSanitizationMiddleware",
            "skip_endpoints": len(self.skip_sanitization),
            "html_allowed_endpoints": len(self.allow_html_endpoints),
            "protected_fields": len(self.skip_fields),
        }
