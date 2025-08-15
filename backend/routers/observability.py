"""
Observability router for SGPT backend
Provides metrics, health checks, and observability status endpoints
"""

import time

import psutil
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse, Response
from prometheus_client import CONTENT_TYPE_LATEST, REGISTRY, generate_latest
from prometheus_client.metrics import Counter, Gauge, Histogram

from config.settings import settings
from core.database import check_database_health
from core.observability import (
    get_logger,
    get_tracer,
    observability_manager,
)

router = APIRouter(prefix="/observability", tags=["Health"])
logger = get_logger()

# Prometheus metrics
REQUEST_COUNT = Counter(
    "sgpt_http_requests_total",
    "Total HTTP requests",
    ["method", "endpoint", "status"],
)

REQUEST_DURATION = Histogram(
    "sgpt_http_request_duration_seconds",
    "HTTP request duration in seconds",
    ["method", "endpoint"],
)

ACTIVE_CONNECTIONS = Gauge(
    "sgpt_active_connections", "Number of active connections"
)

SYSTEM_MEMORY_USAGE = Gauge(
    "sgpt_system_memory_bytes", "System memory usage in bytes"
)

SYSTEM_CPU_USAGE = Gauge(
    "sgpt_system_cpu_percent", "System CPU usage percentage"
)

DATABASE_CONNECTIONS = Gauge(
    "sgpt_database_connections", "Number of database connections"
)


@router.get("/metrics")
async def get_metrics():
    """Expose Prometheus metrics"""
    if not settings.ENABLE_METRICS:
        return JSONResponse(
            status_code=503, content={"error": "Metrics are disabled"}
        )

    try:
        # Update system metrics
        memory = psutil.virtual_memory()
        SYSTEM_MEMORY_USAGE.set(memory.used)
        SYSTEM_CPU_USAGE.set(psutil.cpu_percent())

        # Update database connection metrics
        try:
            db_health = await check_database_health()
            if db_health.get("status") == "healthy":
                DATABASE_CONNECTIONS.set(1)
            else:
                DATABASE_CONNECTIONS.set(0)
        except Exception:
            DATABASE_CONNECTIONS.set(0)

        # Generate Prometheus metrics
        metrics_data = generate_latest(REGISTRY)
        return Response(content=metrics_data, media_type=CONTENT_TYPE_LATEST)
    except Exception as e:
        logger.error("Failed to generate metrics", error=str(e))
        return JSONResponse(
            status_code=500, content={"error": "Failed to generate metrics"}
        )


# Middleware to track requests
@router.middleware("http")
async def track_requests(request: Request, call_next):
    """Middleware to track HTTP requests for metrics"""
    start_time = time.time()

    # Process request
    response = await call_next(request)

    # Calculate duration
    duration = time.time() - start_time

    # Update metrics if enabled
    if settings.ENABLE_METRICS:
        REQUEST_COUNT.labels(
            method=request.method,
            endpoint=request.url.path,
            status=response.status_code,
        ).inc()

        REQUEST_DURATION.labels(
            method=request.method, endpoint=request.url.path
        ).observe(duration)

    # Log request with trace context
    logger.info(
        "HTTP request processed",
        method=request.method,
        path=request.url.path,
        status_code=response.status_code,
        duration_ms=round(duration * 1000, 2),
        user_agent=request.headers.get("user-agent", ""),
        client_ip=request.client.host if request.client else None,
    )

    return response
