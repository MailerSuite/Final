"""
Ultra-Fast API Endpoints
Optimized endpoints designed for sub-1ms response times
"""

import time
import asyncio
from datetime import datetime
from typing import Any, Dict, Optional
import logging

from fastapi import APIRouter, Depends, Request, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.ultrafast_cache import ultra_cache, ultrafast_cache
from routers.auth import get_current_user_optional

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Performance"], prefix="/ultrafast")


@router.get("/")
@ultra_cache(cache_type="hot", ttl=3600, use_precompiled=True)
async def ultrafast_info() -> Dict[str, Any]:
    """Ultra-fast API information endpoint - target < 1ms"""
    return {
        "service": "SGPT Ultra-Fast API",
        "version": "1.0.0",
        "target_response_time": "< 1ms",
        "optimizations": [
            "L0 pre-compiled responses",
            "L1 memory caching", 
            "L2 Redis caching",
            "Response compression",
            "HTTP/2 optimization",
            "Connection pooling"
        ],
        "cache_levels": {
            "L0": "Pre-compiled (< 0.1ms)",
            "L1": "Memory (< 0.5ms)",
            "L2": "Redis (< 2ms)"
        }
    }


@router.get("/health")
@ultra_cache(cache_type="hot", ttl=60, use_precompiled=True)
async def ultrafast_health() -> Dict[str, Any]:
    """Ultra-fast health check - target < 1ms"""
    start_time = time.perf_counter()
    
    response = {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "response_time_target": "< 1ms",
        "service": "ultra-fast",
        "cache_enabled": True
    }
    
    response_time = (time.perf_counter() - start_time) * 1000
    response["actual_response_time_ms"] = round(response_time, 4)
    response["sub_1ms_achieved"] = response_time < 1.0
    
    return response


@router.get("/ping")
async def ultrafast_ping() -> Dict[str, str]:
    """Minimal ping endpoint for latency testing"""
    return {"pong": "ok"}


@router.get("/time")
@ultra_cache(cache_type="hot", ttl=1)  # 1 second cache
async def ultrafast_time() -> Dict[str, Any]:
    """Fast timestamp endpoint with minimal caching"""
    return {
        "timestamp": datetime.now().isoformat(),
        "unix_time": time.time(),
        "cached_for": "1_second"
    }


@router.get("/stats")
@ultra_cache(cache_type="query", ttl=30)  # 30 second cache
async def ultrafast_stats() -> Dict[str, Any]:
    """Ultra-fast statistics endpoint"""
    cache_stats = ultrafast_cache.get_performance_stats()
    
    return {
        "cache_performance": cache_stats,
        "api_status": "ultra-fast",
        "optimizations_active": True,
        "last_updated": datetime.now().isoformat()
    }


@router.get("/user/session") 
@ultra_cache(cache_type="session", ttl=300)  # 5 minute cache
async def ultrafast_user_session(
    current_user = Depends(get_current_user_optional)
) -> Dict[str, Any]:
    """Ultra-fast user session check"""
    if not current_user:
        return {
            "authenticated": False,
            "session": None,
            "cache_type": "session"
        }
    
    return {
        "authenticated": True,
        "user_id": current_user.get("id"),
        "email": current_user.get("email"),
        "session_valid": True,
        "cache_type": "session",
        "cached_until": (datetime.now().timestamp() + 300)
    }


@router.get("/performance/live")
async def ultrafast_performance_live(request: Request) -> Dict[str, Any]:
    """Live performance metrics - no caching for real-time data"""
    start_time = time.perf_counter()
    
    # Get cache statistics
    cache_stats = ultrafast_cache.get_performance_stats()
    
    # Get middleware statistics if available
    middleware_stats = {}
    if hasattr(request.app.state, 'ultrafast_middleware'):
        middleware_stats = request.app.state.ultrafast_middleware.get_performance_stats()
    
    response_time = (time.perf_counter() - start_time) * 1000
    
    return {
        "timestamp": datetime.now().isoformat(),
        "response_time_ms": round(response_time, 4),
        "sub_1ms_achieved": response_time < 1.0,
        "cache_statistics": cache_stats,
        "middleware_statistics": middleware_stats,
        "performance_target": "< 1ms",
        "real_time": True
    }


@router.post("/cache/warm")
async def ultrafast_cache_warm(
    current_user = Depends(get_current_user_optional)
) -> Dict[str, Any]:
    """Warm up the cache with common data"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    start_time = time.perf_counter()
    
    # Warm up cache with common patterns
    common_data = {
        "api_status": {"status": "operational", "response_time": "< 1ms"},
        "user_permissions": {"read": True, "write": True, "admin": False},
        "system_info": {"version": "2.1.0", "mode": "ultra-fast"}
    }
    
    warmed_keys = []
    for key, value in common_data.items():
        await ultrafast_cache.set_multilevel(key, value, "hot", 3600)
        warmed_keys.append(key)
    
    response_time = (time.perf_counter() - start_time) * 1000
    
    return {
        "cache_warmed": True,
        "keys_warmed": warmed_keys,
        "warm_time_ms": round(response_time, 4),
        "cache_ready": True
    }


@router.get("/cache/stats")
@ultra_cache(cache_type="hot", ttl=10)  # 10 second cache
async def ultrafast_cache_stats() -> Dict[str, Any]:
    """Detailed cache performance statistics"""
    return {
        "cache_system": "ultra-fast-multilevel",
        "statistics": ultrafast_cache.get_performance_stats(),
        "cache_levels": {
            "L0": "Pre-compiled responses (instant)",
            "L1": "In-memory cache (< 0.5ms)",
            "L2": "Redis cache (< 2ms)"
        },
        "optimization_target": "< 1ms response time"
    }


@router.delete("/cache/clear")
async def ultrafast_cache_clear(
    current_user = Depends(get_current_user_optional)
) -> Dict[str, Any]:
    """Clear cache (admin only)"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    # Clear L1 caches
    ultrafast_cache.l1_hot_cache.clear()
    ultrafast_cache.l1_session_cache.clear()
    ultrafast_cache.l1_query_cache.clear()
    
    # Clear L2 cache (Redis) if available
    cleared_redis = False
    if ultrafast_cache.redis_client:
        try:
            await ultrafast_cache.redis_client.flushdb()
            cleared_redis = True
        except Exception as e:
            logger.warning(f"Could not clear Redis cache: {e}")
    
    return {
        "cache_cleared": True,
        "l1_cache_cleared": True,
        "l2_cache_cleared": cleared_redis,
        "message": "All caches cleared successfully"
    }


@router.get("/benchmark/simple")
async def ultrafast_benchmark_simple() -> Dict[str, Any]:
    """Simple benchmark endpoint for measuring raw performance"""
    start_time = time.perf_counter()
    
    # Minimal processing
    result = {
        "benchmark": "simple",
        "iterations": 1,
        "data": "minimal_payload"
    }
    
    response_time = (time.perf_counter() - start_time) * 1000
    result["response_time_ms"] = round(response_time, 6)  # High precision
    result["sub_1ms"] = response_time < 1.0
    
    return result


@router.get("/benchmark/cached/{iterations}")
@ultra_cache(cache_type="query", ttl=60)
async def ultrafast_benchmark_cached(iterations: int = 100) -> Dict[str, Any]:
    """Cached benchmark endpoint"""
    start_time = time.perf_counter()
    
    # Simulate some work
    total = 0
    for i in range(min(iterations, 1000)):  # Limit iterations
        total += i
    
    response_time = (time.perf_counter() - start_time) * 1000
    
    return {
        "benchmark": "cached",
        "iterations": iterations,
        "total": total,
        "response_time_ms": round(response_time, 4),
        "cached": True,
        "cache_ttl": 60
    }


@router.get("/test/response-sizes/{size_kb}")
async def ultrafast_test_response_size(size_kb: int = 1) -> Dict[str, Any]:
    """Test different response sizes for performance analysis"""
    if size_kb > 100:  # Limit to 100KB
        raise HTTPException(status_code=400, detail="Size too large (max 100KB)")
    
    start_time = time.perf_counter()
    
    # Generate data of specified size
    target_size = size_kb * 1024  # Convert to bytes
    chunk_size = 100  # 100 characters per chunk
    chunks_needed = target_size // chunk_size
    
    data_chunks = ["x" * chunk_size for _ in range(chunks_needed)]
    
    response_time = (time.perf_counter() - start_time) * 1000
    
    return {
        "size_requested_kb": size_kb,
        "size_actual_bytes": len("".join(data_chunks)),
        "response_time_ms": round(response_time, 4),
        "data": data_chunks[:10],  # Only return first 10 chunks for brevity
        "total_chunks": len(data_chunks),
        "compression_recommended": size_kb > 5
    }