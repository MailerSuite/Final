from celery import Celery
from kombu import Queue

from config.settings import settings

# Optional Sentry instrumentation (Celery)
try:
    import os
    import sentry_sdk
    from sentry_sdk.integrations.celery import CeleryIntegration

    if os.getenv("SENTRY_DSN"):
        sentry_sdk.init(
            dsn=os.getenv("SENTRY_DSN"),
            integrations=[CeleryIntegration()],
            enable_tracing=True,
            traces_sample_rate=float(os.getenv("SENTRY_TRACES_SAMPLE_RATE", "0.0")),
            profiles_sample_rate=float(os.getenv("SENTRY_PROFILES_SAMPLE_RATE", "0.0")),
            environment=settings.ENVIRONMENT,
        )
except Exception:
    pass

# Advanced Celery configuration with load balancing
celery_app = Celery(
    "mailersuite",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=[
        "tasks.campaign_tasks",
        "tasks.imap_tasks",
        "tasks.lead_validation",
        "tasks.mailer",
        "tasks.status_refresh",
        "tasks.load_balancer_tasks",
    ],
)

# High-concurrency configuration for 1000+ threads per client
celery_app.conf.update(
    # Task serialization
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    # Load balancing and routing
    task_routes={
        "tasks.campaign_tasks.send_campaign_batch": {"queue": "high_priority"},
        "tasks.mailer.send_bulk_mail": {"queue": "bulk_mail"},
        "tasks.lead_validation.*": {"queue": "validation"},
        "tasks.imap_tasks.*": {"queue": "imap_processing"},
        "tasks.status_refresh.*": {"queue": "monitoring"},
    },
    # Queue definitions with priority and resource allocation
    task_queues=(
        Queue("high_priority", routing_key="high_priority", priority=10),
        Queue("bulk_mail", routing_key="bulk_mail", priority=8),
        Queue("validation", routing_key="validation", priority=6),
        Queue("imap_processing", routing_key="imap_processing", priority=5),
        Queue("monitoring", routing_key="monitoring", priority=3),
        Queue("celery", routing_key="celery", priority=1),  # Default queue
    ),
    # Worker configuration for high concurrency (1000+ threads)
    worker_concurrency=getattr(settings, "WORKER_CONCURRENCY", 50),  # 50 threads per worker
    worker_max_tasks_per_child=2000,  # Increased for high concurrency
    worker_prefetch_multiplier=8,  # Increased prefetch for efficiency
    # Task execution settings
    task_acks_late=True,  # Acknowledge after task completion
    task_reject_on_worker_lost=True,  # Re-queue if worker crashes
    task_always_eager=False,  # Disable for production
    # Result backend optimization
    result_expires=1800,  # 30 minutes result retention (reduced for memory)
    result_compression="gzip",
    # Advanced load balancing
    task_soft_time_limit=600,  # 10 minutes soft limit
    task_time_limit=1200,  # 20 minutes hard limit
    # Connection pooling for Redis
    broker_pool_limit=getattr(settings, "REDIS_POOL_SIZE", 100),
    broker_connection_retry_on_startup=True,
    broker_connection_max_retries=15,
    # High concurrency optimizations
    worker_disable_rate_limits=True,  # Disable rate limits for high throughput
    worker_max_memory_per_child=300000,  # 300MB per worker (optimized for 6GB RAM)
    task_ignore_result=True,  # Ignore results for memory efficiency
    task_store_errors_even_if_ignored=False,  # Don't store ignored errors
)

# Dynamic worker scaling configuration for VPS (5 vCPU, 6GB RAM)
WORKER_SCALING_CONFIG = {
    "min_workers": 5,
    "max_workers": getattr(settings, "MAX_WORKERS", 20),  # 20 workers max for VPS
    "scale_up_threshold": 0.7,  # Scale up when 70% utilized
    "scale_down_threshold": 0.2,  # Scale down when 20% utilized
    "client_thread_multiplier": {
        "low": 2,      # 1-100 threads: 2x workers
        "medium": 4,   # 101-300 threads: 4x workers
        "high": 6,     # 301-600 threads: 6x workers
        "extreme": 8,  # 600+ threads: 8x workers
    },
    "memory_threshold": getattr(settings, "MAX_MEMORY_USAGE_PERCENT", 80),  # 80% RAM usage
    "cpu_threshold": 85,  # 85% CPU usage
}
