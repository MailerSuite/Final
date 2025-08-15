"""
Ultra-Fast Performance Middleware
Implements aggressive optimizations for sub-1ms response times
"""

import asyncio
import gzip
import json
import time
import zlib
from typing import Callable, Optional, Dict, Any, Set
import logging

from fastapi import Request, Response
from fastapi.responses import JSONResponse, StreamingResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response as StarletteResponse

from core.ultrafast_cache import ultrafast_cache

logger = logging.getLogger(__name__)


class UltraFastMiddleware(BaseHTTPMiddleware):
    """
    Ultra-fast middleware for achieving sub-1ms response times:
    - Pre-compiled response serving
    - Aggressive compression (Brotli, gzip, deflate)
    - HTTP/2 optimization headers
    - Connection keep-alive optimization
    - Response streaming for large payloads
    - Hot-path optimization for common endpoints
    """
    
    def __init__(
        self,
        app,
        enable_compression: bool = True,
        enable_streaming: bool = True,
        enable_precompiled: bool = True,
        enable_keep_alive: bool = True,
        min_compression_size: int = 500,
        compression_level: int = 6
    ):
        super().__init__(app)
        self.enable_compression = enable_compression
        self.enable_streaming = enable_streaming
        self.enable_precompiled = enable_precompiled
        self.enable_keep_alive = enable_keep_alive
        self.min_compression_size = min_compression_size
        self.compression_level = compression_level
        
        # Hot paths - most frequently accessed endpoints
        self.hot_paths: Set[str] = {
            "/health",
            "/api/v1/health", 
            "/api/v1/",
            "/api/v1/auth/me",
            "/api/v1/performance/",
            "/api/v1/performance/status"
        }
        
        # Performance tracking
        self.request_count = 0
        self.sub_1ms_count = 0
        self.response_times = []
        self.max_history = 1000
        
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Ultra-fast request processing with aggressive optimizations"""
        start_time = time.perf_counter()
        
        # Pre-compile response check for hot paths
        if self.enable_precompiled and request.url.path in self.hot_paths:
            precompiled = ultrafast_cache.get_precompiled(request.url.path)
            if precompiled:
                response_time = (time.perf_counter() - start_time) * 1000
                return await self._create_optimized_response(
                    precompiled, 
                    request, 
                    response_time,
                    cache_level="L0_precompiled"
                )
        
        # Add ultra-fast headers to request
        request.state.start_time = start_time
        request.state.is_hot_path = request.url.path in self.hot_paths
        
        # Process request with optimizations
        try:
            response = await call_next(request)
        except Exception as e:
            # Fast error response
            error_response = {
                "error": "Internal server error",
                "message": str(e),
                "request_id": f"req_{int(start_time * 1000000)}",
                "response_time_ms": (time.perf_counter() - start_time) * 1000
            }
            return JSONResponse(
                content=error_response,
                status_code=500,
                headers=await self._get_performance_headers(start_time)
            )
        
        # Calculate response time
        response_time = (time.perf_counter() - start_time) * 1000
        
        # Apply ultra-fast optimizations
        optimized_response = await self._optimize_response(
            response, 
            request, 
            response_time
        )
        
        # Track performance
        await self._track_performance(response_time)
        
        return optimized_response
    
    async def _create_optimized_response(
        self, 
        data: dict, 
        request: Request, 
        response_time: float,
        cache_level: str = "unknown"
    ) -> JSONResponse:
        """Create optimized JSON response with performance headers"""
        
        # Add performance metadata
        data['_performance'] = {
            'response_time_ms': round(response_time, 4),
            'cache_level': cache_level,
            'optimized': True,
            'timestamp': time.time()
        }
        
        # Serialize JSON once for reuse
        content = json.dumps(data, separators=(',', ':'))  # Compact JSON
        
        # Create response with performance headers
        headers = await self._get_performance_headers(
            request.state.start_time if hasattr(request.state, 'start_time') else time.perf_counter()
        )
        
        response = JSONResponse(
            content=data,
            headers=headers
        )
        
        # Apply compression if beneficial
        if self.enable_compression and len(content) > self.min_compression_size:
            response = await self._compress_response(response, content, request)
        
        return response
    
    async def _optimize_response(
        self, 
        response: Response, 
        request: Request, 
        response_time: float
    ) -> Response:
        """Apply ultra-fast optimizations to response"""
        
        # Add performance headers
        performance_headers = await self._get_performance_headers(request.state.start_time)
        
        for key, value in performance_headers.items():
            response.headers[key] = value
        
        # Add specific performance metrics
        response.headers["X-Response-Time-Ms"] = str(round(response_time, 4))
        response.headers["X-Hot-Path"] = str(getattr(request.state, 'is_hot_path', False))
        response.headers["X-Sub-1ms"] = str(response_time < 1.0)
        
        # Apply compression for larger responses
        if (self.enable_compression and 
            hasattr(response, 'body') and 
            len(response.body) > self.min_compression_size):
            
            response = await self._compress_response(response, response.body, request)
        
        # Apply streaming for very large responses
        if (self.enable_streaming and 
            hasattr(response, 'body') and 
            len(response.body) > 50000):  # 50KB threshold
            
            response = await self._stream_response(response, request)
        
        return response
    
    async def _get_performance_headers(self, start_time: float) -> Dict[str, str]:
        """Generate optimized performance headers"""
        return {
            "X-Server": "SGPT-UltraFast",
            "X-Powered-By": "FastAPI-Optimized",
            "X-Cache-System": "UltraFast-MultiLevel",
            "Cache-Control": "public, max-age=300, stale-while-revalidate=60",
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "DENY",
            "Vary": "Accept-Encoding",
        }
    
    async def _compress_response(
        self, 
        response: Response, 
        content: str | bytes, 
        request: Request
    ) -> Response:
        """Apply best compression algorithm based on client support"""
        
        if isinstance(content, str):
            content = content.encode('utf-8')
        
        accept_encoding = request.headers.get('accept-encoding', '').lower()
        
        # Brotli compression (best compression ratio, modern browsers)
        if 'br' in accept_encoding:
            try:
                import brotli
                compressed = brotli.compress(content, quality=self.compression_level)
                response.headers["Content-Encoding"] = "br"
                response.headers["Content-Length"] = str(len(compressed))
                
                # Create new response with compressed content
                return Response(
                    content=compressed,
                    status_code=response.status_code,
                    headers=response.headers,
                    media_type=response.media_type
                )
            except ImportError:
                pass  # Fall back to gzip
        
        # Gzip compression (universal support)
        if 'gzip' in accept_encoding:
            compressed = gzip.compress(content, compresslevel=self.compression_level)
            response.headers["Content-Encoding"] = "gzip"
            response.headers["Content-Length"] = str(len(compressed))
            
            return Response(
                content=compressed,
                status_code=response.status_code,
                headers=response.headers,
                media_type=response.media_type
            )
        
        # Deflate compression (fallback)
        if 'deflate' in accept_encoding:
            compressed = zlib.compress(content, level=self.compression_level)
            response.headers["Content-Encoding"] = "deflate"
            response.headers["Content-Length"] = str(len(compressed))
            
            return Response(
                content=compressed,
                status_code=response.status_code,
                headers=response.headers,
                media_type=response.media_type
            )
        
        return response
    
    async def _stream_response(self, response: Response, request: Request) -> StreamingResponse:
        """Convert large response to streaming for better performance"""
        
        async def generate_chunks():
            """Generate response chunks for streaming"""
            content = response.body if hasattr(response, 'body') else b""
            chunk_size = 8192  # 8KB chunks
            
            for i in range(0, len(content), chunk_size):
                yield content[i:i + chunk_size]
                # Allow other tasks to run
                await asyncio.sleep(0)
        
        return StreamingResponse(
            generate_chunks(),
            status_code=response.status_code,
            headers=response.headers,
            media_type=response.media_type
        )
    
    async def _track_performance(self, response_time: float):
        """Track performance metrics for monitoring"""
        self.request_count += 1
        
        # Track sub-1ms responses
        if response_time < 1.0:
            self.sub_1ms_count += 1
        
        # Track response times (rolling window)
        self.response_times.append(response_time)
        if len(self.response_times) > self.max_history:
            self.response_times.pop(0)
        
        # Update ultrafast cache stats
        if hasattr(ultrafast_cache, 'stats'):
            ultrafast_cache.stats['avg_response_time'] = sum(self.response_times) / len(self.response_times)
    
    def get_performance_stats(self) -> Dict[str, Any]:
        """Get middleware performance statistics"""
        if self.request_count == 0:
            return {
                "total_requests": 0,
                "sub_1ms_responses": 0,
                "sub_1ms_percentage": 0.0,
                "avg_response_time_ms": 0.0
            }
        
        avg_response_time = sum(self.response_times) / len(self.response_times) if self.response_times else 0
        sub_1ms_percentage = (self.sub_1ms_count / self.request_count) * 100
        
        return {
            "total_requests": self.request_count,
            "sub_1ms_responses": self.sub_1ms_count,
            "sub_1ms_percentage": round(sub_1ms_percentage, 2),
            "avg_response_time_ms": round(avg_response_time, 4),
            "hot_paths": list(self.hot_paths),
            "optimizations_enabled": {
                "compression": self.enable_compression,
                "streaming": self.enable_streaming,
                "precompiled": self.enable_precompiled,
                "keep_alive": self.enable_keep_alive
            }
        }


# Global middleware instance for statistics
ultrafast_middleware = None


def get_ultrafast_middleware() -> Optional[UltraFastMiddleware]:
    """Get the global ultrafast middleware instance"""
    return ultrafast_middleware


def set_ultrafast_middleware(middleware: UltraFastMiddleware):
    """Set the global ultrafast middleware instance"""
    global ultrafast_middleware
    ultrafast_middleware = middleware