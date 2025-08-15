"""
Performance Middleware for API Response Optimization
Implements response compression, caching headers, streaming, and performance monitoring
"""

import asyncio
import gzip
import json
import time
from typing import Callable, Optional, Dict, Any
import logging

from fastapi import Request, Response
from fastapi.responses import StreamingResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response as StarletteResponse

from core.enhanced_cache import cache
from prometheus_client import Counter, Histogram

logger = logging.getLogger(__name__)


class PerformanceMiddleware(BaseHTTPMiddleware):
    """
    Comprehensive performance middleware for API optimization:
    - Response compression
    - Performance monitoring
    - Caching headers
    - Request/response timing
    """
    
    def __init__(
        self,
        app,
        compress_responses: bool = True,
        min_compression_size: int = 1000,
        monitor_performance: bool = True,
        cache_control_max_age: int = 300
    ):
        super().__init__(app)
        self.compress_responses = compress_responses
        self.min_compression_size = min_compression_size
        self.monitor_performance = monitor_performance
        self.cache_control_max_age = cache_control_max_age
        
        # Performance tracking
        self.request_times = []
        self.max_request_history = 1000

        # Prometheus metrics
        try:
            self.req_counter = Counter(
                "sgpt_http_requests_total",
                "Total HTTP requests",
                ["method", "path", "status"],
            )
            self.req_latency = Histogram(
                "sgpt_http_request_latency_seconds",
                "HTTP request latency in seconds",
                buckets=(0.05, 0.1, 0.2, 0.5, 1, 2, 5),
            )
        except Exception:
            self.req_counter = None
            self.req_latency = None
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Main middleware processing"""
        start_time = time.time()
        
        # Add performance tracking
        request.state.start_time = start_time
        
        # Process request
        response = await call_next(request)
        
        # Calculate response time
        process_time = time.time() - start_time
        
        # Add performance headers
        response.headers["X-Process-Time"] = str(process_time)
        response.headers["X-Server"] = "SGPT-Optimized"
        
        # Add caching headers for appropriate endpoints
        if self._should_cache_response(request, response):
            response.headers["Cache-Control"] = f"max-age={self.cache_control_max_age}, public"
            try:
                body = getattr(response, "body", None)
                if isinstance(body, (bytes, bytearray)) and len(body) <= 512 * 1024:
                    response.headers["ETag"] = f'W/"{len(body):x}-{response.status_code}"'
            except Exception:
                pass
        
        # Performance monitoring
        if self.monitor_performance:
            await self._track_performance(request, response, process_time)
            # Record Prometheus metrics
            try:
                if self.req_counter is not None and self.req_latency is not None:
                    self.req_counter.labels(request.method, request.url.path, str(response.status_code)).inc()
                    self.req_latency.observe(process_time)
            except Exception:
                pass
        
        # Log slow requests
        if process_time > 1.0:
            logger.warning(
                f"Slow request: {request.method} {request.url.path} "
                f"took {process_time:.3f}s"
            )
        
        return response
    
    def _should_cache_response(self, request: Request, response: Response) -> bool:
        """Determine if response should be cached"""
        # Cache GET requests with successful status codes
        return (
            request.method == "GET" and
            200 <= response.status_code < 300 and
            not request.url.path.startswith("/api/v1/auth") and  # Don't cache auth endpoints
            not "no-cache" in request.headers.get("cache-control", "")
        )
    
    async def _track_performance(self, request: Request, response: Response, process_time: float):
        """Track request performance metrics"""
        try:
            # Keep only recent request times
            self.request_times.append(process_time)
            if len(self.request_times) > self.max_request_history:
                self.request_times = self.request_times[-self.max_request_history:]
            
            # Store performance metrics in cache
            metrics = {
                'method': request.method,
                'path': request.url.path,
                'status_code': response.status_code,
                'process_time': process_time,
                'timestamp': time.time(),
                'user_agent': request.headers.get('user-agent', 'unknown'),
                'ip': request.client.host if request.client else 'unknown'
            }
            
            # Sample metrics to avoid unbounded growth
            if int(time.time() * 10) % 10 == 0:
                await cache.set(
                    f"request_metric_sample:{int(time.time())}",
                    metrics,
                    ttl=600
                )
            
            # Update aggregated metrics every 10 requests
            if len(self.request_times) % 10 == 0:
                await self._update_aggregated_metrics()
                
        except Exception as e:
            logger.error(f"Error tracking performance: {e}")
    
    async def _update_aggregated_metrics(self):
        """Update aggregated performance metrics"""
        try:
            if not self.request_times:
                return
            
            avg_time = sum(self.request_times) / len(self.request_times)
            max_time = max(self.request_times)
            min_time = min(self.request_times)
            
            # Calculate percentiles
            sorted_times = sorted(self.request_times)
            p95_index = int(len(sorted_times) * 0.95)
            p99_index = int(len(sorted_times) * 0.99)
            
            aggregated_metrics = {
                'total_requests': len(self.request_times),
                'avg_response_time': avg_time,
                'max_response_time': max_time,
                'min_response_time': min_time,
                'p95_response_time': sorted_times[p95_index] if sorted_times else 0,
                'p99_response_time': sorted_times[p99_index] if sorted_times else 0,
                'requests_per_second': len(self.request_times) / (time.time() - self.request_times[0] if self.request_times else 1),
                'slow_requests': sum(1 for t in self.request_times if t > 1.0),
                'timestamp': time.time()
            }
            
            await cache.set("api_performance_metrics", aggregated_metrics, ttl=300)
            
        except Exception as e:
            logger.error(f"Error updating aggregated metrics: {e}")


class ResponseCompressionMiddleware(BaseHTTPMiddleware):
    """
    Advanced response compression middleware
    Provides better compression than the built-in GZip middleware
    """
    
    def __init__(
        self,
        app,
        minimum_size: int = 500,
        compression_level: int = 6,
        exclude_media_types: Optional[set] = None
    ):
        super().__init__(app)
        self.minimum_size = minimum_size
        self.compression_level = compression_level
        self.exclude_media_types = exclude_media_types or {
            "image/", "video/", "audio/", "application/zip",
            "application/gzip", "application/brotli"
        }
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Apply compression if appropriate"""
        response = await call_next(request)
        
        # Check if compression should be applied
        if not self._should_compress(request, response):
            return response
        
        # Compress the response
        return await self._compress_response(response)
    
    def _should_compress(self, request: Request, response: Response) -> bool:
        """Determine if response should be compressed"""
        # Check if client accepts gzip
        accept_encoding = request.headers.get("accept-encoding", "")
        if "gzip" not in accept_encoding:
            return False
        
        # Check content type
        content_type = response.headers.get("content-type", "")
        for excluded_type in self.exclude_media_types:
            if excluded_type in content_type:
                return False
        
        # Check if already compressed
        if response.headers.get("content-encoding"):
            return False
        
        # Check response size (if available)
        content_length = response.headers.get("content-length")
        if content_length and int(content_length) < self.minimum_size:
            return False
        
        return True
    
    async def _compress_response(self, response: Response) -> Response:
        """Compress response body"""
        try:
            # Get response body
            if hasattr(response, 'body'):
                body = response.body
                if len(body) < self.minimum_size:
                    return response
                
                # Compress body
                compressed_body = gzip.compress(body, compresslevel=self.compression_level)
                
                # Create new response with compressed body
                compressed_response = Response(
                    content=compressed_body,
                    status_code=response.status_code,
                    headers=dict(response.headers),
                    media_type=response.media_type
                )
                
                # Update headers
                compressed_response.headers["content-encoding"] = "gzip"
                compressed_response.headers["content-length"] = str(len(compressed_body))
                
                # Calculate compression ratio
                compression_ratio = len(compressed_body) / len(body)
                logger.debug(f"Response compressed: {len(body)} -> {len(compressed_body)} bytes "
                           f"(ratio: {compression_ratio:.2f})")
                
                return compressed_response
            
            return response
            
        except Exception as e:
            logger.error(f"Error compressing response: {e}")
            return response


class StreamingResponseOptimizer:
    """
    Utility for creating optimized streaming responses for large datasets
    """
    
    @staticmethod
    async def stream_json_array(
        data_generator,
        chunk_size: int = 100,
        compress: bool = True
    ) -> StreamingResponse:
        """
        Stream JSON array data in chunks for better performance
        
        Args:
            data_generator: Async generator yielding data items
            chunk_size: Number of items per chunk
            compress: Whether to compress the stream
        """
        
        async def generate_chunks():
            """Generate JSON chunks"""
            yield b'["'  # Start array
            
            chunk = []
            first_item = True
            
            async for item in data_generator:
                chunk.append(item)
                
                if len(chunk) >= chunk_size:
                    # Yield chunk
                    if not first_item:
                        yield b','
                    
                    chunk_json = json.dumps(chunk)[1:-1]  # Remove outer brackets
                    yield chunk_json.encode('utf-8')
                    
                    chunk = []
                    first_item = False
            
            # Yield remaining items
            if chunk:
                if not first_item:
                    yield b','
                chunk_json = json.dumps(chunk)[1:-1]  # Remove outer brackets
                yield chunk_json.encode('utf-8')
            
            yield b']'  # End array
        
        # Create streaming response
        headers = {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive"
        }
        
        if compress:
            headers["Content-Encoding"] = "gzip"
            
            async def compressed_generator():
                compressor = gzip.GzipFile(mode='wb', fileobj=None, compresslevel=6)
                async for chunk in generate_chunks():
                    compressed_chunk = gzip.compress(chunk, compresslevel=6)
                    yield compressed_chunk
            
            return StreamingResponse(compressed_generator(), headers=headers)
        else:
            return StreamingResponse(generate_chunks(), headers=headers)
    
    @staticmethod
    async def stream_csv_data(
        data_generator,
        headers: list,
        chunk_size: int = 1000
    ) -> StreamingResponse:
        """Stream CSV data efficiently"""
        
        async def generate_csv():
            # Yield CSV headers
            header_line = ','.join(headers) + '\n'
            yield header_line.encode('utf-8')
            
            # Yield data rows in chunks
            chunk_lines = []
            async for row in data_generator:
                csv_line = ','.join(str(cell) for cell in row) + '\n'
                chunk_lines.append(csv_line)
                
                if len(chunk_lines) >= chunk_size:
                    chunk_data = ''.join(chunk_lines)
                    yield chunk_data.encode('utf-8')
                    chunk_lines = []
            
            # Yield remaining lines
            if chunk_lines:
                chunk_data = ''.join(chunk_lines)
                yield chunk_data.encode('utf-8')
        
        headers = {
            "Content-Type": "text/csv",
            "Content-Disposition": "attachment; filename=export.csv"
        }
        
        return StreamingResponse(generate_csv(), headers=headers)


# Performance monitoring utilities
async def get_api_performance_stats() -> Dict[str, Any]:
    """Get current API performance statistics"""
    stats = await cache.get("api_performance_metrics")
    
    if not stats:
        return {
            'status': 'no_data',
            'message': 'No performance data available yet'
        }
    
    return stats


async def get_slow_endpoints(limit: int = 10) -> list:
    """Get list of slowest endpoints"""
    # This would typically query a database or log aggregator
    # For now, return cached data
    slow_endpoints = await cache.get("slow_endpoints")
    
    if not slow_endpoints:
        return []
    
    return slow_endpoints[:limit]


# Export main components
__all__ = [
    'PerformanceMiddleware',
    'ResponseCompressionMiddleware', 
    'StreamingResponseOptimizer',
    'get_api_performance_stats',
    'get_slow_endpoints'
] 