"""
Configuration settings optimized for high concurrency operations
"""


from pydantic import validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(extra="allow")
    """Application settings optimized for high concurrency"""

    # Database settings for high concurrency
    DATABASE_URL: str = "postgresql+asyncpg://user:password@localhost/sgpt"
    DATABASE_POOL_SIZE: int = 50  # Increased for high concurrency
    DATABASE_MAX_OVERFLOW: int = 150  # Support burst connections
    DATABASE_POOL_TIMEOUT: int = 60
    DATABASE_POOL_RECYCLE: int = 3600

    # Async operation limits
    MAX_CONCURRENT_OPERATIONS: int = 1000  # Support 1000 concurrent operations
    DEFAULT_SEMAPHORE_LIMIT: int = (
        100  # Default concurrency per operation type
    )
    BULK_OPERATION_BATCH_SIZE: int = 1000  # Process in batches

    # SMTP/Email settings for high concurrency
    SMTP_MAX_CONCURRENT: int = 200  # Max concurrent SMTP connections
    SMTP_CONNECTION_TIMEOUT: int = 60
    SMTP_RATE_LIMIT_PER_MINUTE: int = (
        6000  # High rate limit for bulk operations
    )

    # IMAP settings for high concurrency
    IMAP_MAX_CONCURRENT: int = 200  # Max concurrent IMAP connections
    IMAP_CONNECTION_TIMEOUT: int = 60

    # File I/O settings
    MAX_FILE_UPLOAD_SIZE: int = 100 * 1024 * 1024  # 100MB
    ASYNC_FILE_CHUNK_SIZE: int = 64 * 1024  # 64KB chunks for async I/O

    # Task and background processing
    BACKGROUND_TASK_CONCURRENCY: int = (
        500  # High concurrency for background tasks
    )
    CELERY_WORKER_CONCURRENCY: int = 100  # Celery worker concurrency

    # Redis/Cache settings for high concurrency
    REDIS_URL: str = "redis://localhost:6379/0"
    REDIS_CONNECTION_POOL_SIZE: int = 100  # Large connection pool
    CACHE_TTL: int = 3600  # 1 hour cache TTL

    # Security settings
    SECRET_KEY: str = "your-secret-key-here"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 240  # Extended to 4 hours for better UX
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS settings for high concurrency
    ALLOWED_ORIGINS: list[str] = ["*"]
    ALLOWED_METHODS: list[str] = ["*"]
    ALLOWED_HEADERS: list[str] = ["*"]

    # Logging settings
    LOG_LEVEL: str = "INFO"
    LOG_FILE: str = "logs/backend.log"
    LOG_MAX_SIZE: int = 100 * 1024 * 1024  # 100MB log files
    LOG_BACKUP_COUNT: int = 5

    # Observability settings
    ENABLE_STRUCTURED_LOGGING: bool = True
    ENABLE_METRICS: bool = True
    ENABLE_TRACING: bool = True
    METRICS_PORT: int = 9090
    HEALTH_CHECK_INTERVAL: int = 30

    # OpenTelemetry settings
    OTEL_SERVICE_NAME: str = "sgpt-backend"
    OTEL_SERVICE_VERSION: str = "2.0.0"
    OTEL_TRACES_EXPORTER: str = "jaeger"  # jaeger, otlp, prometheus
    OTEL_METRICS_EXPORTER: str = "prometheus"
    OTEL_LOGS_EXPORTER: str = "otlp"
    OTEL_EXPORTER_JAEGER_ENDPOINT: str = "http://localhost:14268/api/traces"
    OTEL_EXPORTER_OTLP_ENDPOINT: str = "http://localhost:4317"
    OTEL_EXPORTER_PROMETHEUS_PORT: int = 9090

    # Application settings
    DEBUG: bool = False
    TESTING: bool = False
    ENABLE_EXTENDED_DEBUG: bool = False
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # Admin panel settings
    ADMIN_ENABLED: bool = True
    ADMIN_PATH: str = "/admin"

    # Bitcoin and Payment settings
    XPUB_KEY: str = "zpub6oKjz8iJ9vtCKvnV3ebJBuyrJMTC8xMLxNL36uPcRDhosGmb63ZDkzG1XugAhBTdamohugHPhNJgkpvFSDx1TeviJj1WCmEbas87AnsaL2w"
    XPUB_SIGNATURE: str = ""  # HMAC signature for XPUB validation
    VIP_CUSTOMER_ID: str = ""  # Special VIP customer ID for address reuse
    ADMIN_TOKEN: str = ""  # Token for admin-only XPUB updates

    # Bitcoin network settings
    BITCOIN_NETWORK: str = "mainnet"  # mainnet or testnet
    PAYMENT_EXPIRY_HOURS: int = 24
    REQUIRED_CONFIRMATIONS: int = 3

    # Rate limiting
    PAYMENT_RATE_LIMIT: int = 5  # requests per minute per IP
    DERIVATION_RATE_LIMIT: int = 10  # address derivations per minute per user

    # Config class removed - using model_config instead

    @validator("DATABASE_URL")
    def validate_database_url(cls, v):
        """Ensure database URL uses async driver"""
        if not v.startswith(("postgresql+asyncpg://", "sqlite+aiosqlite://")):
            raise ValueError(
                "Database URL must use async driver (asyncpg or aiosqlite)"
            )
        return v

    @validator("MAX_CONCURRENT_OPERATIONS")
    def validate_concurrency_limits(cls, v):
        """Validate concurrency limits"""
        if v < 1 or v > 10000:
            raise ValueError(
                "MAX_CONCURRENT_OPERATIONS must be between 1 and 10000"
            )
        return v

    @validator("LOG_LEVEL")
    def validate_log_level(cls, v):
        """Validate log level"""
        valid_levels = ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]
        if v.upper() not in valid_levels:
            raise ValueError(f"LOG_LEVEL must be one of {valid_levels}")
        return v.upper()


def get_settings() -> Settings:
    """Get application settings"""
    return Settings()


# Global settings instance
settings = get_settings()

# Connection semaphores for different operation types
CONNECTION_SEMAPHORES = {
    "smtp": settings.SMTP_MAX_CONCURRENT,
    "imap": settings.IMAP_MAX_CONCURRENT,
    "database": settings.DATABASE_POOL_SIZE,
    "file_io": 50,  # File I/O operations
    "api_requests": settings.MAX_CONCURRENT_OPERATIONS,
}

# Rate limiting configuration
RATE_LIMITS = {
    "smtp_send": settings.SMTP_RATE_LIMIT_PER_MINUTE,
    "api_calls": 10000,  # API calls per minute
    "file_upload": 100,  # File uploads per minute
    "bulk_operations": 50,  # Bulk operations per minute
}


def update_smtp_settings(*args, **kwargs):
    """Update SMTP settings dynamically"""
    # Implementation for dynamic SMTP settings update
    pass
