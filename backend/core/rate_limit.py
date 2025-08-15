"""
Redis-based Rate Limiting for High-Concurrency Load Balancing
Handles rate limiting for clients with variable thread counts (20-1000+ threads)
"""

import logging
import time
from typing import Any

from redis import asyncio as aioredis

from config.settings import settings

logger = logging.getLogger(__name__)


class RateLimiter:
    """Redis-based rate limiter with dynamic scaling for high-concurrency clients"""

    def __init__(self, redis_client: aioredis.Redis):
        self.redis = redis_client
        self.default_limit = settings.RATE_LIMIT_PER_MINUTE

        # Dynamic rate limits based on client tier
        self.tier_limits = {
            "low": 60,  # 60 requests per minute
            "medium": 150,  # 150 requests per minute
            "high": 300,  # 300 requests per minute
            "extreme": 600,  # 600 requests per minute for 500+ threads
        }

    async def is_allowed(
        self, key: str, limit: int | None = None, window: int = 60
    ) -> tuple[bool, int]:
        """
        Check if request is allowed under rate limit

        Args:
            key: Unique identifier for rate limiting (e.g., "session:123" or "ip:192.168.1.1")
            limit: Optional custom limit (uses default if None)
            window: Time window in seconds (default 60)

        Returns:
            Tuple of (is_allowed, remaining_requests)
        """
        if not self.redis:
            return True, 999  # Allow all if Redis unavailable

        limit = limit or self.default_limit
        current_time = int(time.time())
        pipe = self.redis.pipeline()

        try:
            # Use sliding window log approach for accuracy
            window_start = current_time - window

            # Remove old entries
            await pipe.zremrangebyscore(f"rate_limit:{key}", 0, window_start)

            # Count current requests
            current_requests = await pipe.zcard(f"rate_limit:{key}")

            if current_requests < limit:
                # Add current request
                await pipe.zadd(
                    f"rate_limit:{key}", {str(current_time): current_time}
                )
                await pipe.expire(
                    f"rate_limit:{key}", window + 10
                )  # Extra TTL buffer

                remaining = limit - current_requests - 1
                return True, max(0, remaining)
            else:
                remaining = 0
                return False, remaining

        except Exception as e:
            logger.error(f"Rate limiting error for key {key}: {e}")
            return True, 999  # Allow on error to prevent blocking

    async def get_client_tier_limit(self, session_id: str) -> int:
        """Get rate limit based on client session tier"""
        try:
            session_data = await self.redis.hgetall(
                f"client_session:{session_id}"
            )
            if session_data and "tier" in session_data:
                tier = session_data["tier"]
                return self.tier_limits.get(tier, self.default_limit)
        except Exception as e:
            logger.warning(f"Could not get tier for session {session_id}: {e}")

        return self.default_limit

    async def set_custom_limit(
        self, key: str, limit: int, duration: int = 3600
    ):
        """Set custom rate limit for specific key"""
        try:
            await self.redis.setex(f"custom_limit:{key}", duration, limit)
            logger.info(f"Set custom rate limit {limit} for {key}")
        except Exception as e:
            logger.error(f"Failed to set custom limit: {e}")

    async def get_custom_limit(self, key: str) -> int | None:
        """Get custom rate limit for key"""
        try:
            limit = await self.redis.get(f"custom_limit:{key}")
            return int(limit) if limit else None
        except Exception as e:
            logger.warning(f"Could not get custom limit for {key}: {e}")
            return None

    async def get_usage_stats(
        self, key: str, window: int = 60
    ) -> dict[str, Any]:
        """Get current usage statistics for a key"""
        try:
            current_time = int(time.time())
            window_start = current_time - window

            # Get requests in current window
            requests = await self.redis.zrangebyscore(
                f"rate_limit:{key}",
                window_start,
                current_time,
                withscores=True,
            )

            return {
                "current_requests": len(requests),
                "window_start": window_start,
                "window_end": current_time,
                "requests_per_second": len(requests) / window
                if requests
                else 0,
                "last_request": max([score for _, score in requests])
                if requests
                else None,
            }
        except Exception as e:
            logger.error(f"Error getting usage stats for {key}: {e}")
            return {"current_requests": 0, "requests_per_second": 0}

    async def reset_limit(self, key: str):
        """Reset rate limit for a key"""
        try:
            await self.redis.delete(f"rate_limit:{key}")
            await self.redis.delete(f"custom_limit:{key}")
            logger.info(f"Reset rate limit for {key}")
        except Exception as e:
            logger.error(f"Failed to reset rate limit for {key}: {e}")

    async def bulk_check(
        self, keys: list, limit: int | None = None
    ) -> dict[str, tuple[bool, int]]:
        """Check rate limits for multiple keys efficiently"""
        results = {}

        # Use pipeline for efficiency
        pipe = self.redis.pipeline()

        try:
            for key in keys:
                results[key] = await self.is_allowed(key, limit)

            return results

        except Exception as e:
            logger.error(f"Bulk rate limit check failed: {e}")
            # Return permissive results on error
            return dict.fromkeys(keys, (True, 999))


class CircuitBreaker:
    """Circuit breaker for Redis connection failures"""

    def __init__(self, failure_threshold: int = 5, recovery_timeout: int = 60):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.failure_count = 0
        self.last_failure_time = None
        self.state = "closed"  # closed, open, half-open

    async def call(self, func, *args, **kwargs):
        """Execute function with circuit breaker protection"""
        if self.state == "open":
            if time.time() - self.last_failure_time > self.recovery_timeout:
                self.state = "half-open"
            else:
                raise Exception("Circuit breaker is open")

        try:
            result = await func(*args, **kwargs)
            if self.state == "half-open":
                self.state = "closed"
                self.failure_count = 0
            return result

        except Exception as e:
            self.failure_count += 1
            self.last_failure_time = time.time()

            if self.failure_count >= self.failure_threshold:
                self.state = "open"
                logger.warning(
                    f"Circuit breaker opened after {self.failure_count} failures"
                )

            raise e


# Global rate limiter instance
_rate_limiter = None


def get_rate_limiter(redis_client: aioredis.Redis = None) -> RateLimiter:
    """Get or create rate limiter instance"""
    global _rate_limiter
    if _rate_limiter is None and redis_client:
        _rate_limiter = RateLimiter(redis_client)
    return _rate_limiter
