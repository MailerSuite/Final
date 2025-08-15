"""
Redis-based Token Management Service
Secure token blacklisting and refresh token management using Redis
"""

import json
import logging
from datetime import datetime
from typing import Any

from redis import asyncio as aioredis

from config.redis_config import get_redis_client
from config.settings import settings

logger = logging.getLogger(__name__)


class RedisTokenService:
    """
    Redis-based token management for scalable authentication
    Replaces in-memory storage with distributed Redis storage
    """

    def __init__(self):
        self.redis_client: aioredis.Redis | None = None

        # Redis key prefixes for organization
        self.BLACKLIST_PREFIX = "auth:blacklist:"
        self.REFRESH_PREFIX = "auth:refresh:"
        self.USER_SESSIONS_PREFIX = "auth:sessions:"
        self.LOGIN_ATTEMPTS_PREFIX = "auth:attempts:"

        # Default TTL values (in seconds)
        self.ACCESS_TOKEN_TTL = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        self.REFRESH_TOKEN_TTL = (
            settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60
        )
        self.SESSION_TTL = 7 * 24 * 60 * 60  # 7 days
        self.LOGIN_ATTEMPTS_TTL = 15 * 60  # 15 minutes

    async def init_client(self):
        """Initialize Redis client if not already connected"""
        if not self.redis_client:
            try:
                self.redis_client = await get_redis_client()
                logger.info("Redis token service initialized successfully")
            except Exception as e:
                logger.warning(
                    f"Redis unavailable - running without token blacklisting: {e}"
                )
                # Don't raise - allow app to continue without Redis
                self.redis_client = None

    async def blacklist_token(
        self, token: str, ttl: int | None = None
    ) -> bool:
        """
        Add token to blacklist with automatic expiration

        Args:
            token: JWT token to blacklist
            ttl: Time to live in seconds (defaults to ACCESS_TOKEN_TTL)

        Returns:
            bool: True if successfully blacklisted
        """
        await self.init_client()

        try:
            key = f"{self.BLACKLIST_PREFIX}{token}"
            ttl = ttl or self.ACCESS_TOKEN_TTL

            # Store with current timestamp for audit purposes
            value = {
                "blacklisted_at": datetime.utcnow().isoformat(),
                "reason": "manual_logout",
            }

            await self.redis_client.setex(key, ttl, json.dumps(value))
            logger.info(f"Token blacklisted successfully, expires in {ttl}s")
            return True

        except Exception as e:
            logger.error(f"Failed to blacklist token: {e}")
            return False

    async def is_token_blacklisted(self, token: str) -> bool:
        """
        Check if token is blacklisted

        Args:
            token: JWT token to check

        Returns:
            bool: True if token is blacklisted
        """
        try:
            await self.init_client()

            key = f"{self.BLACKLIST_PREFIX}{token}"
            result = await self.redis_client.exists(key)
            return bool(result)

        except Exception as e:
            logger.warning(f"Redis unavailable for token blacklist check: {e}")
            # For development: allow tokens when Redis is unavailable
            # In production: you might want to fail securely (return True)
            return False

    async def store_refresh_token(
        self,
        user_id: str,
        refresh_token: str,
        device_info: dict[str, Any] | None = None,
    ) -> bool:
        """
        Store refresh token with user association

        Args:
            user_id: User identifier
            refresh_token: JWT refresh token
            device_info: Optional device/session information

        Returns:
            bool: True if successfully stored
        """
        await self.init_client()

        try:
            key = f"{self.REFRESH_PREFIX}{refresh_token}"

            value = {
                "user_id": user_id,
                "created_at": datetime.utcnow().isoformat(),
                "device_info": device_info or {},
                "last_used": datetime.utcnow().isoformat(),
            }

            await self.redis_client.setex(
                key, self.REFRESH_TOKEN_TTL, json.dumps(value)
            )

            # Also maintain user -> tokens mapping for session management
            user_tokens_key = f"{self.USER_SESSIONS_PREFIX}{user_id}"
            await self.redis_client.sadd(user_tokens_key, refresh_token)
            await self.redis_client.expire(user_tokens_key, self.SESSION_TTL)

            logger.info(f"Refresh token stored for user {user_id}")
            return True

        except Exception as e:
            logger.error(f"Failed to store refresh token: {e}")
            return False

    async def get_refresh_token_info(
        self, refresh_token: str
    ) -> dict[str, Any] | None:
        """
        Get refresh token information

        Args:
            refresh_token: JWT refresh token

        Returns:
            Dict containing token info or None if not found
        """
        await self.init_client()

        try:
            key = f"{self.REFRESH_PREFIX}{refresh_token}"
            data = await self.redis_client.get(key)

            if data:
                token_info = json.loads(data)
                # Update last used timestamp
                token_info["last_used"] = datetime.utcnow().isoformat()
                await self.redis_client.setex(
                    key, self.REFRESH_TOKEN_TTL, json.dumps(token_info)
                )
                return token_info

            return None

        except Exception as e:
            logger.error(f"Failed to get refresh token info: {e}")
            return None

    async def revoke_refresh_token(self, refresh_token: str) -> bool:
        """
        Revoke a specific refresh token

        Args:
            refresh_token: JWT refresh token to revoke

        Returns:
            bool: True if successfully revoked
        """
        await self.init_client()

        try:
            # Get token info to find user_id
            token_info = await self.get_refresh_token_info(refresh_token)

            # Remove from token storage
            key = f"{self.REFRESH_PREFIX}{refresh_token}"
            await self.redis_client.delete(key)

            # Remove from user's token set
            if token_info:
                user_id = token_info.get("user_id")
                user_tokens_key = f"{self.USER_SESSIONS_PREFIX}{user_id}"
                await self.redis_client.srem(user_tokens_key, refresh_token)

            logger.info("Refresh token revoked successfully")
            return True

        except Exception as e:
            logger.error(f"Failed to revoke refresh token: {e}")
            return False

    async def revoke_user_sessions(self, user_id: str) -> int:
        """
        Revoke all refresh tokens for a user (logout from all devices)

        Args:
            user_id: User identifier

        Returns:
            int: Number of tokens revoked
        """
        await self.init_client()

        try:
            user_tokens_key = f"{self.USER_SESSIONS_PREFIX}{user_id}"

            # Get all refresh tokens for user
            tokens = await self.redis_client.smembers(user_tokens_key)

            revoked_count = 0
            for token in tokens:
                token_key = f"{self.REFRESH_PREFIX}{token}"
                if await self.redis_client.delete(token_key):
                    revoked_count += 1

            # Clear user's token set
            await self.redis_client.delete(user_tokens_key)

            logger.info(f"Revoked {revoked_count} sessions for user {user_id}")
            return revoked_count

        except Exception as e:
            logger.error(f"Failed to revoke user sessions: {e}")
            return 0

    async def track_login_attempt(
        self, identifier: str, success: bool = False
    ) -> dict[str, Any]:
        """
        Track login attempts for brute force protection

        Args:
            identifier: IP address or email to track
            success: Whether the login attempt was successful

        Returns:
            Dict with attempt info and current status
        """
        await self.init_client()

        try:
            key = f"{self.LOGIN_ATTEMPTS_PREFIX}{identifier}"

            # Get current attempts
            data = await self.redis_client.get(key)
            attempts = (
                json.loads(data)
                if data
                else {"count": 0, "first_attempt": None, "last_attempt": None}
            )

            # Update attempts
            current_time = datetime.utcnow().isoformat()

            if success:
                # Reset attempts on successful login
                await self.redis_client.delete(key)
                return {"attempts": 0, "locked": False, "reset": True}
            else:
                # Increment failed attempts
                attempts["count"] += 1
                attempts["last_attempt"] = current_time
                if not attempts["first_attempt"]:
                    attempts["first_attempt"] = current_time

                # Store updated attempts
                await self.redis_client.setex(
                    key, self.LOGIN_ATTEMPTS_TTL, json.dumps(attempts)
                )

                # Check if locked (configurable threshold)
                max_attempts = getattr(settings, "MAX_LOGIN_ATTEMPTS", 5)
                locked = attempts["count"] >= max_attempts

                return {
                    "attempts": attempts["count"],
                    "max_attempts": max_attempts,
                    "locked": locked,
                    "lockout_expires_in": self.LOGIN_ATTEMPTS_TTL
                    if locked
                    else None,
                }

        except Exception as e:
            logger.error(f"Failed to track login attempt: {e}")
            return {"attempts": 0, "locked": False, "error": str(e)}

    async def is_login_locked(self, identifier: str) -> bool:
        """
        Check if login is locked due to too many failed attempts

        Args:
            identifier: IP address or email to check

        Returns:
            bool: True if login is locked
        """
        await self.init_client()

        try:
            key = f"{self.LOGIN_ATTEMPTS_PREFIX}{identifier}"
            data = await self.redis_client.get(key)

            if data:
                attempts = json.loads(data)
                max_attempts = getattr(settings, "MAX_LOGIN_ATTEMPTS", 5)
                return attempts.get("count", 0) >= max_attempts

            return False

        except Exception as e:
            logger.error(f"Failed to check login lock status: {e}")
            # Fail securely - if we can't check, don't lock
            return False

    async def get_system_stats(self) -> dict[str, Any]:
        """
        Get system statistics for monitoring

        Returns:
            Dict with current system stats
        """
        await self.init_client()

        try:
            # Count keys by prefix
            blacklisted_tokens = len(
                await self.redis_client.keys(f"{self.BLACKLIST_PREFIX}*")
            )
            active_refresh_tokens = len(
                await self.redis_client.keys(f"{self.REFRESH_PREFIX}*")
            )
            active_user_sessions = len(
                await self.redis_client.keys(f"{self.USER_SESSIONS_PREFIX}*")
            )
            login_attempts = len(
                await self.redis_client.keys(f"{self.LOGIN_ATTEMPTS_PREFIX}*")
            )

            return {
                "blacklisted_tokens": blacklisted_tokens,
                "active_refresh_tokens": active_refresh_tokens,
                "active_user_sessions": active_user_sessions,
                "tracked_login_attempts": login_attempts,
                "timestamp": datetime.utcnow().isoformat(),
            }

        except Exception as e:
            logger.error(f"Failed to get system stats: {e}")
            return {"error": str(e)}

    async def cleanup_expired(self) -> dict[str, int]:
        """
        Manual cleanup of expired keys (Redis handles this automatically, but useful for stats)

        Returns:
            Dict with cleanup statistics
        """
        await self.init_client()

        try:
            # Redis handles TTL automatically, but we can provide stats
            stats = await self.get_system_stats()
            logger.info(
                "Token cleanup check completed - Redis handles expiration automatically"
            )
            return {
                "message": "Redis handles automatic cleanup",
                "current_stats": stats,
            }

        except Exception as e:
            logger.error(f"Failed to perform cleanup check: {e}")
            return {"error": str(e)}


# Global instance
redis_token_service = RedisTokenService()
