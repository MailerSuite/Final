"""
Analytics Cache Service
Redis-based caching for analytics endpoints with intelligent cache invalidation
"""

import json
import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Union
from functools import wraps

import redis.asyncio as aioredis
from sqlalchemy.ext.asyncio import AsyncSession

from config.redis_config import get_redis_client
from config.settings import settings
from core.enhanced_cache import EnhancedCache

logger = logging.getLogger(__name__)


class AnalyticsCacheService:
    """
    Redis-based caching service for analytics endpoints
    Provides intelligent caching with automatic invalidation
    """
    
    def __init__(self):
        self.redis_client: Optional[aioredis.Redis] = None
        self.enhanced_cache = EnhancedCache()
        
        # Cache configuration
        self.default_ttl = 3600  # 1 hour
        self.short_ttl = 300     # 5 minutes for real-time data
        self.long_ttl = 86400    # 24 hours for historical data
        
        # Cache key prefixes
        self.prefixes = {
            "campaign_stats": "analytics:campaign:",
            "user_stats": "analytics:user:",
            "email_stats": "analytics:email:",
            "webhook_stats": "analytics:webhook:",
            "system_stats": "analytics:system:",
            "performance": "analytics:performance:",
            "realtime": "analytics:realtime:",
        }
        
        # Cache invalidation patterns
        self.invalidation_patterns = {
            "campaign_created": ["campaign_stats", "user_stats"],
            "campaign_updated": ["campaign_stats"],
            "email_sent": ["email_stats", "campaign_stats", "realtime"],
            "webhook_delivered": ["webhook_stats", "realtime"],
            "user_activity": ["user_stats", "realtime"],
        }
    
    async def init_client(self):
        """Initialize Redis client"""
        if not self.redis_client:
            try:
                self.redis_client = await get_redis_client()
                await self.enhanced_cache.init_redis()
                logger.info("Analytics cache service initialized successfully")
            except Exception as e:
                logger.warning(f"Redis unavailable for analytics caching: {e}")
                self.redis_client = None
    
    def _generate_key(self, prefix: str, **kwargs) -> str:
        """Generate cache key from prefix and parameters"""
        if not kwargs:
            return prefix
        
        # Sort parameters for consistent key generation
        sorted_params = sorted(kwargs.items())
        param_str = ":".join(f"{k}={v}" for k, v in sorted_params)
        return f"{prefix}{param_str}"
    
    async def get_cached_analytics(
        self, 
        cache_key: str, 
        ttl: Optional[int] = None
    ) -> Optional[Dict[str, Any]]:
        """Get cached analytics data"""
        if not self.redis_client:
            return None
        
        try:
            cached_data = await self.redis_client.get(cache_key)
            if cached_data:
                return json.loads(cached_data)
        except Exception as e:
            logger.error(f"Error retrieving cached analytics: {e}")
        
        return None
    
    async def set_cached_analytics(
        self, 
        cache_key: str, 
        data: Dict[str, Any], 
        ttl: Optional[int] = None
    ) -> bool:
        """Cache analytics data"""
        if not self.redis_client:
            return False
        
        try:
            ttl = ttl or self.default_ttl
            await self.redis_client.setex(
                cache_key,
                ttl,
                json.dumps(data, default=str)
            )
            return True
        except Exception as e:
            logger.error(f"Error caching analytics data: {e}")
            return False
    
    async def invalidate_analytics_cache(self, event_type: str, **kwargs):
        """Invalidate cache based on event type"""
        if not self.redis_client:
            return
        
        try:
            patterns = self.invalidation_patterns.get(event_type, [])
            for pattern in patterns:
                prefix = self.prefixes.get(pattern, "")
                if prefix:
                    # Find and delete all keys matching the pattern
                    pattern_keys = await self.redis_client.keys(f"{prefix}*")
                    if pattern_keys:
                        await self.redis_client.delete(*pattern_keys)
                        logger.info(f"Invalidated {len(pattern_keys)} cache keys for {pattern}")
        except Exception as e:
            logger.error(f"Error invalidating analytics cache: {e}")
    
    async def get_campaign_analytics(
        self, 
        user_id: str, 
        campaign_id: Optional[str] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None
    ) -> Optional[Dict[str, Any]]:
        """Get cached campaign analytics"""
        cache_key = self._generate_key(
            self.prefixes["campaign_stats"],
            user_id=user_id,
            campaign_id=campaign_id,
            date_from=date_from.isoformat() if date_from else None,
            date_to=date_to.isoformat() if date_to else None
        )
        
        return await self.get_cached_analytics(cache_key, self.default_ttl)
    
    async def cache_campaign_analytics(
        self, 
        user_id: str, 
        data: Dict[str, Any],
        campaign_id: Optional[str] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None
    ) -> bool:
        """Cache campaign analytics data"""
        cache_key = self._generate_key(
            self.prefixes["campaign_stats"],
            user_id=user_id,
            campaign_id=campaign_id,
            date_from=date_from.isoformat() if date_from else None,
            date_to=date_to.isoformat() if date_to else None
        )
        
        return await self.set_cached_analytics(cache_key, data, self.default_ttl)
    
    async def get_user_analytics(
        self, 
        user_id: str,
        period: str = "30d"
    ) -> Optional[Dict[str, Any]]:
        """Get cached user analytics"""
        cache_key = self._generate_key(
            self.prefixes["user_stats"],
            user_id=user_id,
            period=period
        )
        
        return await self.get_cached_analytics(cache_key, self.long_ttl)
    
    async def cache_user_analytics(
        self, 
        user_id: str, 
        data: Dict[str, Any],
        period: str = "30d"
    ) -> bool:
        """Cache user analytics data"""
        cache_key = self._generate_key(
            self.prefixes["user_stats"],
            user_id=user_id,
            period=period
        )
        
        return await self.set_cached_analytics(cache_key, data, self.long_ttl)
    
    async def get_email_analytics(
        self, 
        user_id: str,
        email_type: str = "all",
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None
    ) -> Optional[Dict[str, Any]]:
        """Get cached email analytics"""
        cache_key = self._generate_key(
            self.prefixes["email_stats"],
            user_id=user_id,
            email_type=email_type,
            date_from=date_from.isoformat() if date_from else None,
            date_to=date_to.isoformat() if date_to else None
        )
        
        return await self.get_cached_analytics(cache_key, self.short_ttl)
    
    async def cache_email_analytics(
        self, 
        user_id: str, 
        data: Dict[str, Any],
        email_type: str = "all",
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None
    ) -> bool:
        """Cache email analytics data"""
        cache_key = self._generate_key(
            self.prefixes["email_stats"],
            user_id=user_id,
            email_type=email_type,
            date_from=date_from.isoformat() if date_from else None,
            date_to=date_to.isoformat() if date_to else None
        )
        
        return await self.set_cached_analytics(cache_key, data, self.short_ttl)
    
    async def get_webhook_analytics(
        self, 
        user_id: str,
        webhook_id: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """Get cached webhook analytics"""
        cache_key = self._generate_key(
            self.prefixes["webhook_stats"],
            user_id=user_id,
            webhook_id=webhook_id
        )
        
        return await self.get_cached_analytics(cache_key, self.default_ttl)
    
    async def cache_webhook_analytics(
        self, 
        user_id: str, 
        data: Dict[str, Any],
        webhook_id: Optional[str] = None
    ) -> bool:
        """Cache webhook analytics data"""
        cache_key = self._generate_key(
            self.prefixes["webhook_stats"],
            user_id=user_id,
            webhook_id=webhook_id
        )
        
        return await self.set_cached_analytics(cache_key, data, self.default_ttl)
    
    async def get_system_analytics(self) -> Optional[Dict[str, Any]]:
        """Get cached system analytics"""
        cache_key = self.prefixes["system_stats"]
        return await self.get_cached_analytics(cache_key, self.short_ttl)
    
    async def cache_system_analytics(self, data: Dict[str, Any]) -> bool:
        """Cache system analytics data"""
        cache_key = self.prefixes["system_stats"]
        return await self.set_cached_analytics(cache_key, data, self.short_ttl)
    
    async def get_realtime_analytics(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get cached real-time analytics"""
        cache_key = self._generate_key(
            self.prefixes["realtime"],
            user_id=user_id
        )
        return await self.get_cached_analytics(cache_key, self.short_ttl)
    
    async def cache_realtime_analytics(self, user_id: str, data: Dict[str, Any]) -> bool:
        """Cache real-time analytics data"""
        cache_key = self._generate_key(
            self.prefixes["realtime"],
            user_id=user_id
        )
        return await self.set_cached_analytics(cache_key, data, self.short_ttl)
    
    async def get_cache_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        if not self.redis_client:
            return {"status": "redis_unavailable"}
        
        try:
            info = await self.redis_client.info()
            return {
                "status": "active",
                "redis_version": info.get("redis_version"),
                "used_memory_human": info.get("used_memory_human"),
                "connected_clients": info.get("connected_clients"),
                "total_commands_processed": info.get("total_commands_processed"),
                "keyspace_hits": info.get("keyspace_hits"),
                "keyspace_misses": info.get("keyspace_misses"),
                "hit_rate": self._calculate_hit_rate(info),
            }
        except Exception as e:
            logger.error(f"Error getting cache stats: {e}")
            return {"status": "error", "message": str(e)}
    
    def _calculate_hit_rate(self, info: Dict[str, Any]) -> float:
        """Calculate cache hit rate"""
        hits = info.get("keyspace_hits", 0)
        misses = info.get("keyspace_misses", 0)
        total = hits + misses
        return (hits / total * 100) if total > 0 else 0.0


# Global analytics cache service instance
analytics_cache = AnalyticsCacheService()


def cache_analytics_result(ttl: Optional[int] = None, cache_key_func: Optional[callable] = None):
    """
    Decorator to cache analytics function results
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Generate cache key
            if cache_key_func:
                cache_key = cache_key_func(*args, **kwargs)
            else:
                cache_key = f"analytics:{func.__name__}:{hash(str(args) + str(sorted(kwargs.items())))}"
            
            # Try to get from cache first
            cached_result = await analytics_cache.get_cached_analytics(cache_key, ttl)
            if cached_result is not None:
                return cached_result
            
            # Execute function and cache result
            result = await func(*args, **kwargs)
            await analytics_cache.set_cached_analytics(cache_key, result, ttl)
            
            return result
        return wrapper
    return decorator 