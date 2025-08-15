"""
Debug middleware for FastAPI application
Provides comprehensive request/response logging and exception handling with trace IDs
"""

import json
import logging
import time
import traceback
from collections.abc import Callable
from uuid import uuid4

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from config.settings import settings

logger = logging.getLogger(__name__)


class DebugMiddleware(BaseHTTPMiddleware):
    """
    Enhanced debug middleware that provides:
    - Request/response logging with timing
    - Exception handling with trace IDs
    - CURSOR:DEBUG: prefixed logs for Cursor memory
    - Configurable via ENABLE_EXTENDED_DEBUG environment variable
    """

    def __init__(self, app):
        super().__init__(app)
        self.enabled = getattr(settings, "ENABLE_EXTENDED_DEBUG", False)

        if self.enabled:
            logger.info(
                "CURSOR:DEBUG: 🔧 Extended Debug Middleware initialized"
            )

    async def dispatch(
        self, request: Request, call_next: Callable
    ) -> Response:
        if not self.enabled:
            return await call_next(request)

        # Generate trace ID for this request
        trace_id = str(uuid4())
        request.state.trace_id = trace_id

        # Record request start time
        start_time = time.time()

        # Extract client info
        client_ip = request.client.host if request.client else "unknown"

        # Log incoming request
        request_data = {
            "trace_id": trace_id,
            "method": request.method,
            "path": request.url.path,
            "query_params": str(request.query_params),
            "ip": client_ip,
            "user_agent": request.headers.get("user-agent", "unknown"),
            "content_type": request.headers.get("content-type"),
            "content_length": request.headers.get("content-length"),
        }

        logger.info(
            f"CURSOR:DEBUG: 🌐 REQUEST START - {json.dumps(request_data)}"
        )

        try:
            # Process the request
            response = await call_next(request)

            # Calculate duration
            duration_ms = (time.time() - start_time) * 1000

            # Log successful response
            response_data = {
                "trace_id": trace_id,
                "path": request.url.path,
                "method": request.method,
                "status": response.status_code,
                "duration_ms": round(duration_ms, 2),
                "ip": client_ip,
            }

            logger.info(
                f"CURSOR:DEBUG: ✅ RESPONSE SUCCESS - {json.dumps(response_data)}"
            )

            # Add trace ID to response headers for client correlation
            response.headers["X-Trace-ID"] = trace_id
            response.headers["X-Duration-Ms"] = str(round(duration_ms, 2))

            return response

        except Exception as exc:
            # Calculate duration for failed requests
            duration_ms = (time.time() - start_time) * 1000

            # Generate error trace ID
            error_trace_id = str(uuid4())

            # Log the full exception with traceback
            error_data = {
                "trace_id": trace_id,
                "error_trace_id": error_trace_id,
                "path": request.url.path,
                "method": request.method,
                "duration_ms": round(duration_ms, 2),
                "ip": client_ip,
                "exception_type": type(exc).__name__,
                "exception_message": str(exc),
                "traceback": traceback.format_exc(),
            }

            # Log with full traceback for debugging
            logger.exception(
                f"CURSOR:DEBUG: ❌ UNHANDLED EXCEPTION - {json.dumps(error_data)}"
            )

            # Return structured error response
            error_response = {
                "detail": "Internal Server Error",
                "trace_id": error_trace_id,
                "timestamp": time.time(),
                "path": request.url.path,
                "method": request.method,
            }

            # Add debug info in development
            if getattr(settings, "DEBUG", False):
                error_response.update(
                    {
                        "exception_type": type(exc).__name__,
                        "exception_message": str(exc),
                        "request_trace_id": trace_id,
                    }
                )

            response = JSONResponse(status_code=500, content=error_response)

            # Add trace headers
            response.headers["X-Trace-ID"] = trace_id
            response.headers["X-Error-Trace-ID"] = error_trace_id
            response.headers["X-Duration-Ms"] = str(round(duration_ms, 2))

            return response


class PerformanceMiddleware(BaseHTTPMiddleware):
    """
    Performance monitoring middleware that tracks slow requests
    """

    def __init__(self, app, slow_request_threshold: float = 1.0):
        super().__init__(app)
        self.slow_request_threshold = slow_request_threshold  # seconds
        self.enabled = getattr(settings, "ENABLE_EXTENDED_DEBUG", False)

    async def dispatch(
        self, request: Request, call_next: Callable
    ) -> Response:
        if not self.enabled:
            return await call_next(request)

        start_time = time.time()

        response = await call_next(request)

        duration = time.time() - start_time

        if duration > self.slow_request_threshold:
            slow_request_data = {
                "path": request.url.path,
                "method": request.method,
                "duration_seconds": round(duration, 3),
                "status": response.status_code,
                "threshold": self.slow_request_threshold,
                "ip": request.client.host if request.client else "unknown",
            }

            logger.warning(
                f"CURSOR:DEBUG: 🐌 SLOW REQUEST - {json.dumps(slow_request_data)}"
            )

        return response


# Helper function to add debug info to existing responses
def add_debug_headers(response: Response, request: Request) -> Response:
    """Add debug headers to any response"""
    if hasattr(request.state, "trace_id"):
        response.headers["X-Trace-ID"] = request.state.trace_id
    return response
