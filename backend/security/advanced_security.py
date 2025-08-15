"""
Advanced Security System for SGPT
Implements rate limiting, request signing, enhanced authentication, and security monitoring
"""

import hashlib
import hmac
import ipaddress
import json
import logging
import time
from dataclasses import dataclass
from datetime import datetime, timedelta
from enum import Enum
from typing import Any

import aioredis
from cryptography.fernet import Fernet
from fastapi import Request

from config.settings import settings

logger = logging.getLogger(__name__)


class SecurityLevel(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class RateLimitType(Enum):
    PER_IP = "per_ip"
    PER_USER = "per_user"
    PER_ENDPOINT = "per_endpoint"
    GLOBAL = "global"


@dataclass
class RateLimit:
    requests: int
    window_seconds: int
    burst_allowed: int = 0
    rate_limit_type: RateLimitType = RateLimitType.PER_IP


@dataclass
class SecurityEvent:
    event_type: str
    severity: SecurityLevel
    source_ip: str
    user_id: str | None
    details: dict[str, Any]
    timestamp: datetime


class AdvancedSecurityManager:
    """Advanced security management system"""

    def __init__(self, redis_url: str | None = None):
        self.redis_url = redis_url or settings.REDIS_URL
        self.redis = None
        self.security_events: list[SecurityEvent] = []
        self.blocked_ips: set[str] = set()
        self.suspicious_ips: set[str] = set()

        # Encryption for sensitive data
        self.cipher_suite = Fernet(Fernet.generate_key())

        # Rate limiting configuration
        self.rate_limits = {
            "/api/v1/auth/login": RateLimit(5, 300, 2),  # 5 attempts per 5 min
            "/api/v1/campaigns": RateLimit(100, 3600, 20),  # 100 per hour
            "/api/v1/campaigns/send": RateLimit(10, 60, 2),  # 10 per minute
            "/api/v1/upload": RateLimit(50, 3600, 10),  # 50 uploads per hour
            "global": RateLimit(
                1000, 60, 200
            ),  # 1000 requests per minute globally
        }

        # Suspicious patterns
        self.suspicious_patterns = [
            "admin",
            "test",
            "api",
            "debug",
            "console",
            ".env",
            "config",
            "backup",
            "database",
        ]

        # Blocked countries (example - customize as needed)
        self.blocked_countries = {"CN", "RU", "KP"}  # Example blocking

    async def initialize(self):
        """Initialize security manager"""
        try:
            self.redis = aioredis.from_url(self.redis_url)
            await self.redis.ping()
            logger.info("✅ Security manager initialized")
        except Exception as e:
            logger.error(f"Failed to initialize security manager: {e}")
            self.redis = None

    async def check_rate_limit(
        self, request: Request, endpoint: str, user_id: str | None = None
    ) -> tuple[bool, dict[str, Any]]:
        """Advanced rate limiting with multiple strategies"""
        if not self.redis:
            return True, {}

        client_ip = self.get_client_ip(request)
        current_time = int(time.time())

        # Check endpoint-specific rate limits
        rate_limit = self.rate_limits.get(endpoint, self.rate_limits["global"])

        # Generate rate limit keys
        keys = []
        if rate_limit.rate_limit_type == RateLimitType.PER_IP:
            keys.append(f"rate_limit:ip:{client_ip}:{endpoint}")
        elif rate_limit.rate_limit_type == RateLimitType.PER_USER and user_id:
            keys.append(f"rate_limit:user:{user_id}:{endpoint}")
        elif rate_limit.rate_limit_type == RateLimitType.PER_ENDPOINT:
            keys.append(f"rate_limit:endpoint:{endpoint}")

        # Always check global rate limit
        keys.append(f"rate_limit:global:{client_ip}")

        # Check all rate limits
        for key in keys:
            try:
                current_requests = await self.redis.get(key)
                current_requests = (
                    int(current_requests) if current_requests else 0
                )

                if current_requests >= rate_limit.requests:
                    # Check if burst is allowed
                    burst_key = f"{key}:burst"
                    burst_count = await self.redis.get(burst_key)
                    burst_count = int(burst_count) if burst_count else 0

                    if burst_count >= rate_limit.burst_allowed:
                        await self.log_security_event(
                            "rate_limit_exceeded",
                            SecurityLevel.MEDIUM,
                            client_ip,
                            user_id,
                            {
                                "endpoint": endpoint,
                                "requests": current_requests,
                                "limit": rate_limit.requests,
                                "window": rate_limit.window_seconds,
                            },
                        )
                        return False, {
                            "error": "Rate limit exceeded",
                            "retry_after": rate_limit.window_seconds,
                            "requests_made": current_requests,
                            "limit": rate_limit.requests,
                        }
                    else:
                        # Allow burst
                        await self.redis.incr(burst_key)
                        await self.redis.expire(
                            burst_key, rate_limit.window_seconds
                        )

                # Increment counter
                await self.redis.incr(key)
                await self.redis.expire(key, rate_limit.window_seconds)

            except Exception as e:
                logger.error(f"Rate limit check failed: {e}")
                # Fail open for availability
                return True, {}

        return True, {}

    def get_client_ip(self, request: Request) -> str:
        """Get real client IP considering proxies"""
        # Check X-Forwarded-For header (most common)
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            # Take the first IP in the chain
            return forwarded_for.split(",")[0].strip()

        # Check X-Real-IP header
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip

        # Check Cloudflare headers
        cf_connecting_ip = request.headers.get("CF-Connecting-IP")
        if cf_connecting_ip:
            return cf_connecting_ip

        # Fall back to direct connection IP
        return request.client.host if request.client else "unknown"

    async def validate_request_signature(
        self, request: Request, secret_key: str, timestamp_tolerance: int = 300
    ) -> bool:
        """Validate HMAC request signature for sensitive operations"""
        try:
            # Get signature from header
            signature = request.headers.get("X-SGPT-Signature")
            timestamp = request.headers.get("X-SGPT-Timestamp")

            if not signature or not timestamp:
                return False

            # Check timestamp
            current_time = int(time.time())
            request_time = int(timestamp)

            if abs(current_time - request_time) > timestamp_tolerance:
                await self.log_security_event(
                    "timestamp_validation_failed",
                    SecurityLevel.HIGH,
                    self.get_client_ip(request),
                    None,
                    {"timestamp_diff": abs(current_time - request_time)},
                )
                return False

            # Get request body for signature calculation
            body = await request.body()

            # Calculate expected signature
            message = (
                f"{request.method}{request.url.path}{timestamp}{body.decode()}"
            )
            expected_signature = hmac.new(
                secret_key.encode(), message.encode(), hashlib.sha256
            ).hexdigest()

            # Compare signatures
            if not hmac.compare_digest(signature, expected_signature):
                await self.log_security_event(
                    "signature_validation_failed",
                    SecurityLevel.HIGH,
                    self.get_client_ip(request),
                    None,
                    {"endpoint": request.url.path},
                )
                return False

            return True

        except Exception as e:
            logger.error(f"Signature validation error: {e}")
            return False

    async def check_suspicious_activity(self, request: Request) -> bool:
        """Check for suspicious activity patterns"""
        client_ip = self.get_client_ip(request)
        user_agent = request.headers.get("User-Agent", "").lower()
        path = request.url.path.lower()

        suspicious_score = 0
        reasons = []

        # Check for suspicious paths
        for pattern in self.suspicious_patterns:
            if pattern in path:
                suspicious_score += 10
                reasons.append(f"suspicious_path:{pattern}")

        # Check for bot-like user agents
        bot_indicators = ["bot", "crawler", "spider", "scraper", "automated"]
        for indicator in bot_indicators:
            if indicator in user_agent:
                suspicious_score += 5
                reasons.append(f"bot_indicator:{indicator}")

        # Check for rapid requests from same IP
        if self.redis:
            rapid_key = f"rapid_requests:{client_ip}"
            rapid_count = await self.redis.incr(rapid_key)
            await self.redis.expire(rapid_key, 10)  # 10 second window

            if rapid_count > 20:  # More than 20 requests in 10 seconds
                suspicious_score += 15
                reasons.append("rapid_requests")

        # Check for missing common headers
        common_headers = ["Accept", "Accept-Language", "Accept-Encoding"]
        missing_headers = [
            h for h in common_headers if h not in request.headers
        ]
        if len(missing_headers) >= 2:
            suspicious_score += 5
            reasons.append("missing_headers")

        # Log if suspicious
        if suspicious_score > 15:
            await self.log_security_event(
                "suspicious_activity",
                SecurityLevel.MEDIUM,
                client_ip,
                None,
                {
                    "score": suspicious_score,
                    "reasons": reasons,
                    "user_agent": user_agent,
                    "path": path,
                },
            )

            self.suspicious_ips.add(client_ip)
            return True

        return False

    async def check_ip_reputation(self, ip: str) -> tuple[bool, str]:
        """Check IP reputation against known threat lists"""
        try:
            # Check if IP is in blocked list
            if ip in self.blocked_ips:
                return False, "blocked_ip"

            # Check if IP is in suspicious list
            if ip in self.suspicious_ips:
                return False, "suspicious_ip"

            # Check for private/local IPs (allow for development)
            try:
                ip_obj = ipaddress.ip_address(ip)
                if ip_obj.is_private or ip_obj.is_loopback:
                    return True, "private_ip"
            except ValueError:
                pass

            # Here you would integrate with threat intelligence APIs
            # For now, we'll use a simple local check

            return True, "clean"

        except Exception as e:
            logger.error(f"IP reputation check failed: {e}")
            return True, "error"  # Fail open

    async def log_security_event(
        self,
        event_type: str,
        severity: SecurityLevel,
        source_ip: str,
        user_id: str | None,
        details: dict[str, Any],
    ):
        """Log security events for monitoring and analysis"""
        event = SecurityEvent(
            event_type=event_type,
            severity=severity,
            source_ip=source_ip,
            user_id=user_id,
            details=details,
            timestamp=datetime.now(),
        )

        self.security_events.append(event)

        # Keep only last 1000 events in memory
        if len(self.security_events) > 1000:
            self.security_events = self.security_events[-1000:]

        # Log to file/external system
        logger.warning(
            f"Security Event: {event_type} | "
            f"Severity: {severity.value} | "
            f"IP: {source_ip} | "
            f"User: {user_id} | "
            f"Details: {json.dumps(details)}"
        )

        # Store in Redis for real-time monitoring
        if self.redis:
            try:
                event_data = {
                    "event_type": event_type,
                    "severity": severity.value,
                    "source_ip": source_ip,
                    "user_id": user_id,
                    "details": details,
                    "timestamp": event.timestamp.isoformat(),
                }

                await self.redis.lpush(
                    "security_events", json.dumps(event_data)
                )
                await self.redis.ltrim(
                    "security_events", 0, 999
                )  # Keep last 1000

            except Exception as e:
                logger.error(f"Failed to store security event in Redis: {e}")

    def encrypt_sensitive_data(self, data: str) -> str:
        """Encrypt sensitive data"""
        return self.cipher_suite.encrypt(data.encode()).decode()

    def decrypt_sensitive_data(self, encrypted_data: str) -> str:
        """Decrypt sensitive data"""
        return self.cipher_suite.decrypt(encrypted_data.encode()).decode()

    async def get_security_summary(self) -> dict[str, Any]:
        """Get security summary for monitoring"""
        recent_events = [
            event
            for event in self.security_events
            if event.timestamp > datetime.now() - timedelta(hours=24)
        ]

        severity_counts = {}
        for event in recent_events:
            severity = event.severity.value
            severity_counts[severity] = severity_counts.get(severity, 0) + 1

        return {
            "total_events_24h": len(recent_events),
            "severity_breakdown": severity_counts,
            "blocked_ips_count": len(self.blocked_ips),
            "suspicious_ips_count": len(self.suspicious_ips),
            "last_update": datetime.now().isoformat(),
        }


# Global security manager instance
security_manager = AdvancedSecurityManager()


class SecurityMiddleware:
    """FastAPI middleware for security checks"""

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] == "http":
            request = Request(scope, receive)

            # Get client IP
            client_ip = security_manager.get_client_ip(request)

            # Check IP reputation
            ip_allowed, reason = await security_manager.check_ip_reputation(
                client_ip
            )
            if not ip_allowed:
                response = {
                    "status_code": 403,
                    "headers": [(b"content-type", b"application/json")],
                }
                body = json.dumps(
                    {"error": "Access denied", "reason": reason}
                ).encode()

                await send({"type": "http.response.start", **response})
                await send({"type": "http.response.body", "body": body})
                return

            # Check for suspicious activity
            await security_manager.check_suspicious_activity(request)

            # Check rate limits for sensitive endpoints
            endpoint = request.url.path
            if endpoint in security_manager.rate_limits:
                allowed, rate_info = await security_manager.check_rate_limit(
                    request, endpoint
                )
                if not allowed:
                    response = {
                        "status_code": 429,
                        "headers": [
                            (b"content-type", b"application/json"),
                            (
                                b"retry-after",
                                str(rate_info.get("retry_after", 60)).encode(),
                            ),
                        ],
                    }
                    body = json.dumps(rate_info).encode()

                    await send({"type": "http.response.start", **response})
                    await send({"type": "http.response.body", "body": body})
                    return

        await self.app(scope, receive, send)


async def initialize_security():
    """Initialize security manager"""
    await security_manager.initialize()


def get_security_manager() -> AdvancedSecurityManager:
    """Get global security manager instance"""
    return security_manager
