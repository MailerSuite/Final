"""
Comprehensive Rate Limiting Middleware
Implements consistent rate limiting across all API endpoints with Redis backend
"""

import logging
import time
from collections.abc import Callable
from typing import Any

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from config.redis_config import get_redis_client
from config.settings import settings
from core.rate_limit import get_rate_limiter

logger = logging.getLogger(__name__)


class EnhancedRateLimitingMiddleware(BaseHTTPMiddleware):
    """
    Production-ready rate limiting middleware with Redis backend
    Supports per-endpoint, per-IP, and per-user rate limiting
    """

    def __init__(self, app):
        super().__init__(app)
        self.rate_limiter = None
        self.fallback_enabled = True

        # Endpoint-specific rate limits (requests per minute)
        self.endpoint_limits = {
            # Authentication endpoints
            "/api/v1/auth/login": 10,  # Login attempts
            "/api/v1/auth/register": 5,  # Registration attempts
            "/api/v1/auth/logout": 20,  # Logout requests
            "/api/v1/auth/refresh": 30,  # Token refresh
            "/api/v1/auth/verify-token": 60,  # Token verification
            # API endpoints by category
            "/api/v1/smtp": 100,  # SMTP operations
            "/api/v1/imap": 100,  # IMAP operations
            "/api/v1/campaigns": 50,  # Campaign management
            "/api/v1/templates": 60,  # Template operations
            "/api/v1/leads": 80,  # Lead management
            "/api/v1/blacklist": 120,  # Blacklist checking
            # File operations
            "/api/v1/upload": 10,  # File uploads
            "/api/v1/download": 30,  # File downloads
            # Admin endpoints
            "/api/v1/admin": 20,  # Admin operations
            "/api/v1/health": 300,  # Health checks (higher limit)
            # AI/ML endpoints
            "/api/v1/ai": 30,  # AI processing
            "/api/v1/analytics": 100,  # Analytics queries
            # Webhook endpoints
            "/api/v1/webhooks": 50,  # General webhook operations
            "/api/v1/webhooks/events": 80, # Listing events
            "/api/v1/webhooks/deliveries": 80, # Listing deliveries
            "/api/v1/webhooks/stats": 60, # Webhook statistics
            "/api/v1/webhooks/{webhook_id}/test": 5, # Testing a specific webhook
            # Default for unspecified endpoints
            "default": 60,  # General API calls
        }

        # IP-based global limits (requests per minute)
        self.ip_limits = {
            "default": 300,  # 300 requests per minute per IP
            "authenticated": 500,  # Higher limit for authenticated users
            "admin": 1000,  # Highest limit for admin users
        }

        # Fallback limits (when Redis is unavailable)
        self.fallback_limits = {}
        self.fallback_window = 60  # seconds

    async def init_rate_limiter(self):
        """Initialize Redis-based rate limiter"""
        if not self.rate_limiter:
            try:
                redis_client = await get_redis_client()
                self.rate_limiter = get_rate_limiter(redis_client)
                logger.info("Redis-based rate limiter initialized")
            except Exception as e:
                logger.warning(f"Failed to initialize Redis rate limiter: {e}")
                self.rate_limiter = None

    def get_client_identifier(self, request: Request) -> str:
        """Extract client identifier for rate limiting"""
        # Try to get IP from headers (for proxy scenarios)
        client_ip = (
            request.headers.get("X-Forwarded-For", "").split(",")[0].strip()
            or request.headers.get("X-Real-IP", "").strip()
            or request.client.host
            if request.client
            else "unknown"
        )

        # Clean up IPv6 localhost
        if client_ip == "::1":
            client_ip = "127.0.0.1"

        return client_ip

    def get_endpoint_pattern(self, path: str) -> str:
        """Map request path to rate limit pattern"""
        # Remove query parameters
        path = path.split("?")[0]

        # Check for exact matches first
        if path in self.endpoint_limits:
            return path

        # Check for pattern matches
        for pattern in self.endpoint_limits:
            if pattern != "default" and path.startswith(pattern):
                return pattern

        # Return default pattern
        return "default"

    def get_rate_limit_for_endpoint(
        self, endpoint_pattern: str, user_type: str = "default"
    ) -> int:
        """Get rate limit for specific endpoint and user type"""
        base_limit = self.endpoint_limits.get(
            endpoint_pattern, self.endpoint_limits["default"]
        )

        # Apply user type multipliers
        multipliers = {
            "admin": 2.0,  # Admins get 2x limit
            "authenticated": 1.5,  # Authenticated users get 1.5x limit
            "default": 1.0,  # Default users get base limit
        }

        multiplier = multipliers.get(user_type, 1.0)
        return int(base_limit * multiplier)

    def get_user_type(self, request: Request) -> str:
        """Determine user type from request"""
        # Check for admin token/header
        auth_header = request.headers.get("Authorization", "")
        if "admin" in auth_header.lower():
            return "admin"

        # Check for any authentication
        if auth_header.startswith("Bearer "):
            return "authenticated"

        return "default"

    async def check_rate_limit_redis(
        self, key: str, limit: int, window: int = 60
    ) -> tuple[bool, int, dict[str, Any]]:
        """Check rate limit using Redis backend"""
        try:
            await self.init_rate_limiter()

            if self.rate_limiter:
                allowed, remaining = await self.rate_limiter.is_allowed(
                    key, limit, window
                )

                headers = {
                    "X-RateLimit-Limit": str(limit),
                    "X-RateLimit-Remaining": str(remaining),
                    "X-RateLimit-Window": str(window),
                }

                return allowed, remaining, headers
            else:
                # Fallback to in-memory limiting
                return await self.check_rate_limit_fallback(key, limit, window)

        except Exception as e:
            logger.error(f"Redis rate limiting error: {e}")
            return await self.check_rate_limit_fallback(key, limit, window)

    async def check_rate_limit_fallback(
        self, key: str, limit: int, window: int = 60
    ) -> tuple[bool, int, dict[str, Any]]:
        """Fallback in-memory rate limiting when Redis is unavailable"""
        current_time = time.time()

        if key not in self.fallback_limits:
            self.fallback_limits[key] = []

        # Clean old entries
        self.fallback_limits[key] = [
            req_time
            for req_time in self.fallback_limits[key]
            if current_time - req_time < window
        ]

        requests = self.fallback_limits[key]
        remaining = max(0, limit - len(requests))

        if len(requests) < limit:
            self.fallback_limits[key].append(current_time)

            headers = {
                "X-RateLimit-Limit": str(limit),
                "X-RateLimit-Remaining": str(remaining - 1),
                "X-RateLimit-Window": str(window),
                "X-RateLimit-Backend": "fallback",
            }

            return True, remaining - 1, headers
        else:
            headers = {
                "X-RateLimit-Limit": str(limit),
                "X-RateLimit-Remaining": "0",
                "X-RateLimit-Window": str(window),
                "X-RateLimit-Backend": "fallback",
                "Retry-After": str(window),
            }

            return False, 0, headers

    async def log_rate_limit_violation(
        self, request: Request, client_ip: str, endpoint: str, limit: int
    ):
        """Log rate limit violations for monitoring"""
        try:
            logger.warning(
                f"Rate limit exceeded: IP={client_ip}, endpoint={endpoint}, "
                f"limit={limit}, user_agent={request.headers.get('User-Agent', 'unknown')}"
            )

            # Integrate with audit logging system
            try:
                from core.audit_logger import audit_logger
                await audit_logger.log_security_event(
                    event_type="rate_limit_exceeded",
                    severity="MEDIUM",
                    details={
                        "endpoint": endpoint,
                        "limit": limit,
                        "requests_made": self.get_request_count(client_ip, endpoint),
                        "time_window": "60 seconds",
                        "client_ip": client_ip,
                        "user_agent": request.headers.get("User-Agent", "unknown")
                    },
                    user_id=getattr(request.state, 'user_id', None),
                    ip_address=client_ip,
                    user_agent=request.headers.get("User-Agent", "unknown")
                )
            except Exception as audit_error:
                logger.error(f"Failed to log rate limit event: {audit_error}")

        except Exception as e:
            logger.error(f"Failed to log rate limit violation: {e}")

    async def dispatch(
        self, request: Request, call_next: Callable
    ) -> Response:
        """Main middleware logic"""
        # Skip rate limiting for health checks in debug mode
        if settings.DEBUG and request.url.path == "/health":
            return await call_next(request)

        # Extract request information
        client_ip = self.get_client_identifier(request)
        endpoint_pattern = self.get_endpoint_pattern(request.url.path)
        user_type = self.get_user_type(request)

        # Get rate limits
        endpoint_limit = self.get_rate_limit_for_endpoint(
            endpoint_pattern, user_type
        )
        ip_limit = self.ip_limits.get(user_type, self.ip_limits["default"])

        # Create rate limiting keys
        endpoint_key = f"endpoint:{client_ip}:{endpoint_pattern}"
        ip_key = f"ip:{client_ip}"

        # Check endpoint-specific rate limit
        (
            endpoint_allowed,
            endpoint_remaining,
            endpoint_headers,
        ) = await self.check_rate_limit_redis(endpoint_key, endpoint_limit)

        # Check IP-based rate limit
        (
            ip_allowed,
            ip_remaining,
            ip_headers,
        ) = await self.check_rate_limit_redis(ip_key, ip_limit)

        # Determine if request should be allowed
        if not endpoint_allowed:
            await self.log_rate_limit_violation(
                request, client_ip, endpoint_pattern, endpoint_limit
            )

            return JSONResponse(
                status_code=429,
                content={
                    "error": "Rate limit exceeded",
                    "message": f"Too many requests to {endpoint_pattern}",
                    "limit": endpoint_limit,
                    "window": 60,
                    "retry_after": 60,
                },
                headers=endpoint_headers,
            )

        if not ip_allowed:
            await self.log_rate_limit_violation(
                request, client_ip, "ip_limit", ip_limit
            )

            return JSONResponse(
                status_code=429,
                content={
                    "error": "Rate limit exceeded",
                    "message": "Too many requests from your IP address",
                    "limit": ip_limit,
                    "window": 60,
                    "retry_after": 60,
                },
                headers=ip_headers,
            )

        # Process request
        response = await call_next(request)

        # Add rate limit headers to response
        min_remaining = min(endpoint_remaining, ip_remaining)
        response.headers.update(
            {
                "X-RateLimit-Limit-Endpoint": str(endpoint_limit),
                "X-RateLimit-Remaining-Endpoint": str(endpoint_remaining),
                "X-RateLimit-Limit-IP": str(ip_limit),
                "X-RateLimit-Remaining-IP": str(ip_remaining),
                "X-RateLimit-Remaining": str(min_remaining),
            }
        )

        return response

    def get_stats(self) -> dict[str, Any]:
        """Get rate limiting statistics"""
        return {
            "middleware": "EnhancedRateLimitingMiddleware",
            "backend": "redis" if self.rate_limiter else "fallback",
            "endpoint_patterns": len(self.endpoint_limits),
            "fallback_cache_size": len(self.fallback_limits),
            "ip_limit_tiers": len(self.ip_limits),
        }
