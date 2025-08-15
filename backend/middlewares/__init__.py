"""
Middleware modules for FastAPI application
Enhanced middleware system with factory pattern and unified functionality
"""

import asyncio
import time
from collections.abc import Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

# Import enhanced middleware components
from .enhanced_middleware import UnifiedMiddleware
from .middleware_factory import (
    middleware_factory,
    setup_middleware,
    get_middleware_stats,
    MIDDLEWARE_PRESETS
)
from .input_sanitization import InputSanitizationMiddleware
from .debug import DebugMiddleware, PerformanceMiddleware
from .rate_limiting import EnhancedRateLimitingMiddleware

# Export main components
__all__ = [
    "UnifiedMiddleware",
    "middleware_factory", 
    "setup_middleware",
    "get_middleware_stats",
    "MIDDLEWARE_PRESETS",
    "InputSanitizationMiddleware",
    "DebugMiddleware",
    "PerformanceMiddleware",
    "EnhancedRateLimitingMiddleware",
    # Legacy middleware (deprecated)
    "RequestTimeoutMiddleware",
    "RequestLoggingMiddleware", 
    "SecurityHeadersMiddleware",
    "RateLimitingMiddleware",
    "ConnectionPoolMiddleware"
]


class RequestTimeoutMiddleware(BaseHTTPMiddleware):
    """Middleware to handle request timeouts"""

    def __init__(self, app, timeout: int = 60):
        super().__init__(app)
        self.timeout = timeout

    async def dispatch(
        self, request: Request, call_next: Callable
    ) -> Response:
        try:
            return await asyncio.wait_for(
                call_next(request), timeout=self.timeout
            )
        except TimeoutError:
            return JSONResponse(
                status_code=408, content={"detail": "Request timeout"}
            )


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Middleware to log all requests"""

    async def dispatch(
        self, request: Request, call_next: Callable
    ) -> Response:
        start_time = time.time()

        # Add request ID
        request.state.request_id = f"{int(start_time * 1000)}"

        response = await call_next(request)

        process_time = time.time() - start_time
        response.headers["X-Process-Time"] = str(process_time)

        return response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Middleware to add security headers"""

    async def dispatch(
        self, request: Request, call_next: Callable
    ) -> Response:
        response = await call_next(request)

        # Add security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        return response


class RateLimitingMiddleware(BaseHTTPMiddleware):
    """Basic rate limiting middleware"""

    def __init__(self, app, requests_per_minute: int = 60):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self.client_requests = {}

    async def dispatch(
        self, request: Request, call_next: Callable
    ) -> Response:
        client_ip = request.client.host if request.client else "unknown"
        current_time = time.time()

        # Simple rate limiting logic
        if client_ip in self.client_requests:
            requests = self.client_requests[client_ip]
            # Clean old requests
            requests = [
                req_time
                for req_time in requests
                if current_time - req_time < 60
            ]

            if len(requests) >= self.requests_per_minute:
                return JSONResponse(
                    status_code=429, content={"detail": "Rate limit exceeded"}
                )

            requests.append(current_time)
            self.client_requests[client_ip] = requests
        else:
            self.client_requests[client_ip] = [current_time]

        return await call_next(request)


class ConnectionPoolMiddleware(BaseHTTPMiddleware):
    """Middleware to manage connection pooling"""

    async def dispatch(
        self, request: Request, call_next: Callable
    ) -> Response:
        # Connection pool management logic here
        return await call_next(request)
