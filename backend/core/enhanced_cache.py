"""
Enhanced Multi-Layer Caching System
Implements L1 (memory) + L2 (Redis) caching for optimal performance
"""

import asyncio
import json
import logging
import time
from datetime import datetime, timedelta
from typing import Any, Dict, Optional, Union
from functools import wraps

import redis.asyncio as aioredis
from cachetools import TTLCache

from config.settings import settings

logger = logging.getLogger(__name__)


class EnhancedCache:
    """
    Multi-layer caching system:
    L1: In-memory cache (hot data, sub-millisecond access)
    L2: Redis cache (shared data, millisecond access)
    L3: Database (cold data, ~50ms access)
    """
    
    def __init__(self):
        # L1 Cache: In-memory for hot data (max 1000 items, 5 min TTL)
        self.l1_cache = TTLCache(maxsize=1000, ttl=300)  # 5 minutes
        
        # L2 Cache: Redis for shared data
        self.redis_client: Optional[aioredis.Redis] = None
        self.default_ttl = 3600  # 1 hour
        
        # Cache statistics
        self.stats = {
            'l1_hits': 0,
            'l1_misses': 0,
            'l2_hits': 0,
            'l2_misses': 0,
            'total_requests': 0
        }
        
    async def init_redis(self):
        """Initialize Redis connection for L2 cache"""
        try:
            self.redis_client = aioredis.from_url(
                settings.REDIS_URL,
                encoding="utf-8",
                decode_responses=True,
                max_connections=20
            )
            await self.redis_client.ping()
            logger.info("Enhanced cache Redis connection established")
        except Exception as e:
            logger.warning(f"Redis unavailable for caching: {e}")
            self.redis_client = None
    
    def _generate_key(self, prefix: str, **kwargs) -> str:
        """Generate cache key from prefix and parameters"""
        key_parts = [prefix]
        for k, v in sorted(kwargs.items()):
            key_parts.append(f"{k}:{v}")
        return ":".join(key_parts)
    
    async def get(self, key: str) -> Optional[Any]:
        """Get value from cache (L1 -> L2 -> None)"""
        self.stats['total_requests'] += 1
        
        # Try L1 cache first
        if key in self.l1_cache:
            self.stats['l1_hits'] += 1
            logger.debug(f"L1 cache HIT: {key}")
            return self.l1_cache[key]
        
        self.stats['l1_misses'] += 1
        
        # Try L2 cache (Redis)
        if self.redis_client:
            try:
                value = await self.redis_client.get(key)
                if value:
                    self.stats['l2_hits'] += 1
                    logger.debug(f"L2 cache HIT: {key}")
                    # Promote to L1 cache
                    deserialized = json.loads(value)
                    self.l1_cache[key] = deserialized
                    return deserialized
            except Exception as e:
                logger.error(f"Redis cache error: {e}")
        
        self.stats['l2_misses'] += 1
        logger.debug(f"Cache MISS: {key}")
        return None
    
    async def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        """Set value in both L1 and L2 caches"""
        ttl = ttl or self.default_ttl
        
        # Set in L1 cache (limited TTL for memory management)
        l1_ttl = min(ttl, 300)  # Max 5 minutes in L1
        self.l1_cache[key] = value
        
        # Set in L2 cache (Redis)
        if self.redis_client:
            try:
                serialized = json.dumps(value, default=str)
                await self.redis_client.setex(key, ttl, serialized)
                logger.debug(f"Cache SET: {key} (TTL: {ttl}s)")
            except Exception as e:
                logger.error(f"Redis cache set error: {e}")
    
    async def delete(self, key: str) -> None:
        """Delete from both caches"""
        # Remove from L1
        self.l1_cache.pop(key, None)
        
        # Remove from L2
        if self.redis_client:
            try:
                await self.redis_client.delete(key)
                logger.debug(f"Cache DELETE: {key}")
            except Exception as e:
                logger.error(f"Redis cache delete error: {e}")
    
    async def clear_pattern(self, pattern: str) -> None:
        """Clear all keys matching pattern (L2 only, L1 expires naturally)"""
        if self.redis_client:
            try:
                keys = await self.redis_client.keys(pattern)
                if keys:
                    await self.redis_client.delete(*keys)
                    logger.info(f"Cleared {len(keys)} cache keys matching: {pattern}")
            except Exception as e:
                logger.error(f"Cache pattern clear error: {e}")
    
    def get_stats(self) -> Dict[str, Any]:
        """Get cache performance statistics"""
        total = self.stats['total_requests']
        if total == 0:
            return self.stats
        
        l1_hit_rate = (self.stats['l1_hits'] / total) * 100
        l2_hit_rate = (self.stats['l2_hits'] / total) * 100
        overall_hit_rate = ((self.stats['l1_hits'] + self.stats['l2_hits']) / total) * 100
        
        return {
            **self.stats,
            'l1_hit_rate': f"{l1_hit_rate:.1f}%",
            'l2_hit_rate': f"{l2_hit_rate:.1f}%",
            'overall_hit_rate': f"{overall_hit_rate:.1f}%",
            'l1_size': len(self.l1_cache)
        }


# Global cache instance
cache = EnhancedCache()


def cached(prefix: str, ttl: int = 3600, key_params: list = None):
    """
    Decorator for caching function results
    
    Args:
        prefix: Cache key prefix
        ttl: Time to live in seconds
        key_params: List of parameter names to include in cache key
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Generate cache key
            if key_params:
                key_data = {k: kwargs.get(k) for k in key_params if k in kwargs}
            else:
                key_data = kwargs
            
            cache_key = cache._generate_key(prefix, **key_data)
            
            # Try to get from cache
            cached_result = await cache.get(cache_key)
            if cached_result is not None:
                return cached_result
            
            # Execute function and cache result
            start_time = time.time()
            result = await func(*args, **kwargs)
            execution_time = time.time() - start_time
            
            # Cache the result
            await cache.set(cache_key, result, ttl)
            
            logger.debug(f"Function {func.__name__} executed in {execution_time:.3f}s, result cached")
            return result
            
        return wrapper
    return decorator


# Specific cache utilities for common SGPT operations
class SGPTCache:
    """SGPT-specific caching utilities"""
    
    @staticmethod
    async def cache_user_data(user_id: str, data: dict, ttl: int = 1800):
        """Cache user data (30 min TTL)"""
        key = cache._generate_key("user", id=user_id)
        await cache.set(key, data, ttl)
    
    @staticmethod
    async def get_user_data(user_id: str) -> Optional[dict]:
        """Get cached user data"""
        key = cache._generate_key("user", id=user_id)
        return await cache.get(key)
    
    @staticmethod
    async def cache_campaign_stats(campaign_id: str, stats: dict, ttl: int = 600):
        """Cache campaign statistics (10 min TTL)"""
        key = cache._generate_key("campaign_stats", id=campaign_id)
        await cache.set(key, stats, ttl)
    
    @staticmethod
    async def get_campaign_stats(campaign_id: str) -> Optional[dict]:
        """Get cached campaign statistics"""
        key = cache._generate_key("campaign_stats", id=campaign_id)
        return await cache.get(key)
    
    @staticmethod
    async def invalidate_user_cache(user_id: str):
        """Invalidate all cache entries for a user"""
        await cache.clear_pattern(f"user:id:{user_id}*")
        await cache.clear_pattern(f"*:user_id:{user_id}*")
    
    @staticmethod
    async def invalidate_campaign_cache(campaign_id: str):
        """Invalidate all cache entries for a campaign"""
        await cache.clear_pattern(f"campaign*:id:{campaign_id}*")


# Initialize cache on startup
async def init_cache():
    """Initialize the cache system"""
    await cache.init_redis()
    logger.info("Enhanced cache system initialized")


# Cache warming functions
async def warm_cache():
    """Warm up cache with frequently accessed data"""
    try:
        # Add cache warming logic here based on your most common queries
        logger.info("Cache warming started...")
        
        # Example: Pre-load active user data, popular campaigns, etc.
        # This would be populated based on your actual usage patterns
        
        logger.info("Cache warming completed")
    except Exception as e:
        logger.error(f"Cache warming error: {e}")


# Export main components
__all__ = ['cache', 'cached', 'SGPTCache', 'init_cache', 'warm_cache'] 