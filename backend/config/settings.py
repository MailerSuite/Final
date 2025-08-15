"""
Application settings and configuration.
"""

import os

from pydantic_settings import BaseSettings
from pydantic import field_validator


class Settings(BaseSettings):
    """Application settings."""

    # Basic settings
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    # Auto-enable DEBUG for development environment
    DEBUG: bool = (
        os.getenv("DEBUG", "auto").lower() == "true" 
        if os.getenv("DEBUG", "auto").lower() != "auto"
        else ENVIRONMENT == "development"
    )
    # Testing mode flag (must be present for test-only behaviors like SQLite)
    TESTING: bool = os.getenv("TESTING", "False").lower() == "true"
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))

    # Database settings - POSTGRESQL ONLY (async support)
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql+asyncpg://postgres:postgres@localhost:5432/sgpt_dev",
    )

    @property
    def SYNC_DATABASE_URL(self) -> str:
        """Get synchronous database URL for migrations"""
        if self.DATABASE_URL.startswith("postgresql+asyncpg"):
            # Convert async PostgreSQL URL to sync
            return self.DATABASE_URL.replace("+asyncpg", "")
        if self.DATABASE_URL.startswith("sqlite+aiosqlite"):
            # Convert async SQLite URL to sync for Alembic/CLI tools
            return self.DATABASE_URL.replace("+aiosqlite", "")
        else:
            return self.DATABASE_URL

    # Security settings - CRITICAL: Must be set in production
    # JWT_SECRET_KEY for JWT tokens, SECRET_KEY for general app security
    SECRET_KEY: str = os.getenv("SECRET_KEY") or os.getenv("JWT_SECRET_KEY") or "generated-secure-key-change-in-production"
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY") or os.getenv("SECRET_KEY") or "generated-secure-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(
        os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "240")  # Extended to 4 hours for better UX
    )
    REFRESH_TOKEN_EXPIRE_DAYS: int = int(
        os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7")
    )

    @property
    def secret_key_safe(self) -> str:
        """Get a safe secret key, generating one if needed"""
        if self.SECRET_IS_DEFAULT:
            # In development/testing we allow a generated key but do not print it
            import secrets
            key = secrets.token_urlsafe(32)
            return key
        return self.SECRET_KEY

    @property
    def IS_PRODUCTION(self) -> bool:
        return self.ENVIRONMENT.lower() == "production"

    @property
    def SECRET_IS_DEFAULT(self) -> bool:
        return self.SECRET_KEY == "generated-secure-key-change-in-production"

    # CORS settings
    ALLOWED_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://localhost:5173",  # Vite default port
        "http://localhost:5174",  # Vite alternative ports
        "http://localhost:5175",
        "http://localhost:5176",
        "http://localhost:5177",
        "http://localhost:5178",
        "http://localhost:5179",
        "http://localhost:8080",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:3002",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:5175",
        "http://127.0.0.1:8080",
        "https://sgpt.dev",
        "https://www.sgpt.dev",
        "https://app.sgpt.dev",
    ]
    ALLOWED_HOSTS: list[str] | None = None

    # Coerce ALLOWED_ORIGINS from comma-separated string or JSON string to list
    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def _coerce_allowed_origins(cls, v):
        if v is None or isinstance(v, list):
            return v
        if isinstance(v, str):
            s = v.strip()
            if not s:
                return None
            if s.startswith("["):
                try:
                    import json
                    parsed = json.loads(s)
                    if isinstance(parsed, list):
                        return [str(item).strip() for item in parsed if str(item).strip()]
                except Exception:
                    # Fall back to comma split
                    pass
            return [item.strip() for item in s.split(",") if item.strip()]
        return v

    # Admin settings
    ADMIN_ENABLED: bool = os.getenv("ADMIN_ENABLED", "True").lower() == "true"
    ADMIN_PATH: str = os.getenv("ADMIN_PATH", "/admin")
    ADMIN_USER: str = os.getenv("ADMIN_USER", "admin")
    ADMIN_PASS: str = os.getenv("ADMIN_PASS", "admin")

    # Email settings
    SMTP_HOST: str = os.getenv("SMTP_HOST", "localhost")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER: str = os.getenv("SMTP_USER", "")
    SMTP_PASS: str = os.getenv("SMTP_PASS", "")
    SMTP_USE_TLS: bool = os.getenv("SMTP_USE_TLS", "True").lower() == "true"

    # Redis settings
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379")

    # Rate limiting
    RATE_LIMIT_PER_MINUTE: int = int(os.getenv("RATE_LIMIT_PER_MINUTE", "60"))

    # File upload settings
    MAX_UPLOAD_SIZE: int = int(os.getenv("MAX_UPLOAD_SIZE", "10"))  # MB
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "./uploads")

    # Logging
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")

    # Database startup controls
    DB_AUTO_MIGRATE: bool = os.getenv("DB_AUTO_MIGRATE", "True").lower() == "true"
    DB_AUTO_OPTIMIZE: bool = os.getenv("DB_AUTO_OPTIMIZE", "False").lower() == "true"

    # WebSocket settings
    WEBSOCKET_ENABLED: bool = (
        os.getenv("WEBSOCKET_ENABLED", "True").lower() == "true"
    )
    WEBSOCKET_HEARTBEAT_INTERVAL: int = int(
        os.getenv("WEBSOCKET_HEARTBEAT_INTERVAL", "30")
    )

    # Feature flags
    ENABLE_BULK_MAIL: bool = (
        os.getenv("ENABLE_BULK_MAIL", "True").lower() == "true"
    )
    ENABLE_METRICS: bool = (
        os.getenv("ENABLE_METRICS", "True").lower() == "true"
    )
    SMTP_SELECTION_ENABLED: bool = (
        os.getenv("SMTP_SELECTION_ENABLED", "False").lower() == "true"
    )

    # SMTP/IMAP settings (security enforced)
    SMTP_PROXY_FORCE: bool = (
        os.getenv("SMTP_PROXY_FORCE", "True").lower() == "true"
    )
    IMAP_PROXY_FORCE: bool = (
        os.getenv("IMAP_PROXY_FORCE", "True").lower() == "true"
    )
    
    # Enhanced proxy security settings
    PROXY_ENFORCEMENT_STRICT: bool = (
        os.getenv("PROXY_ENFORCEMENT_STRICT", "True").lower() == "true"
    )
    PROXY_IP_LEAK_PREVENTION: bool = (
        os.getenv("PROXY_IP_LEAK_PREVENTION", "True").lower() == "true"
    )
    PROXY_FALLBACK_DISABLED: bool = (
        os.getenv("PROXY_FALLBACK_DISABLED", "True").lower() == "true"
    )
    PROXY_VALIDATION_TIMEOUT: int = int(
        os.getenv("PROXY_VALIDATION_TIMEOUT", "15")
    )
    PROXY_HEALTH_CHECK_INTERVAL: int = int(
        os.getenv("PROXY_HEALTH_CHECK_INTERVAL", "300")
    )

    # IMAP path prefix
    IMAP_PATH_PREFIX_DEFAULT: str = os.getenv("IMAP_PATH_PREFIX_DEFAULT", "")

    # SMTP retry settings
    SMTP_MAX_RETRIES: int = int(os.getenv("SMTP_MAX_RETRIES", "3"))
    SMTP_MAX_CONCURRENT: int = int(os.getenv("SMTP_MAX_CONCURRENT", "10"))
    SMTP_CHECK_TIMEOUT: int = int(os.getenv("SMTP_CHECK_TIMEOUT", "60"))

    # IMAP settings
    IMAP_MAX_CONCURRENT: int = int(os.getenv("IMAP_MAX_CONCURRENT", "5"))

    # SOCKS settings
    SOCKS_MAX_CONCURRENT: int = int(os.getenv("SOCKS_MAX_CONCURRENT", "5"))

    # Bulk mail settings
    BULK_MAIL_RETRY_ATTEMPTS: int = int(
        os.getenv("BULK_MAIL_RETRY_ATTEMPTS", "3")
    )

    # Enhanced security settings
    MAX_LOGIN_ATTEMPTS: int = int(os.getenv("MAX_LOGIN_ATTEMPTS", "5"))
    LOGIN_BLOCK_DURATION: int = int(
        os.getenv("LOGIN_BLOCK_DURATION", "300")
    )  # 5 minutes
    SESSION_TIMEOUT: int = int(os.getenv("SESSION_TIMEOUT", "3600"))  # 1 hour

    # Enhanced monitoring settings
    ENABLE_DETAILED_LOGGING: bool = (
        os.getenv("ENABLE_DETAILED_LOGGING", "True").lower() == "true"
    )
    LOG_SLOW_QUERIES: bool = (
        os.getenv("LOG_SLOW_QUERIES", "True").lower() == "true"
    )
    SLOW_QUERY_THRESHOLD: float = float(
        os.getenv("SLOW_QUERY_THRESHOLD", "1.0")
    )  # seconds

    # Plan configuration settings
    DEFAULT_PLAN_CODE: str = os.getenv("DEFAULT_PLAN_CODE", "basic")

    # Plan limits configuration (from .env)
    BASIC_MAX_THREADS: int = int(os.getenv("BASIC_MAX_THREADS", "50"))
    BASIC_AI_CALLS_DAILY: int = int(os.getenv("BASIC_AI_CALLS_DAILY", "150"))
    BASIC_CONCURRENT_SESSIONS: int = int(
        os.getenv("BASIC_CONCURRENT_SESSIONS", "1")
    )

    PREMIUM_MAX_THREADS: int = int(os.getenv("PREMIUM_MAX_THREADS", "500"))
    PREMIUM_AI_CALLS_DAILY: int = int(
        os.getenv("PREMIUM_AI_CALLS_DAILY", "500")
    )
    PREMIUM_CONCURRENT_SESSIONS: int = int(
        os.getenv("PREMIUM_CONCURRENT_SESSIONS", "2")
    )

    DELUXE_MAX_THREADS: int | None = None  # Unlimited
    DELUXE_AI_CALLS_DAILY: int | None = None  # Unlimited
    DELUXE_CONCURRENT_SESSIONS: int = int(
        os.getenv("DELUXE_CONCURRENT_SESSIONS", "5")
    )

    TEAM_CONCURRENT_SESSIONS: int = int(
        os.getenv("TEAM_CONCURRENT_SESSIONS", "10")
    )
    LIFETIME_CONCURRENT_SESSIONS: int = int(
        os.getenv("LIFETIME_CONCURRENT_SESSIONS", "10")
    )

    # Enhanced security settings (non-compliance focused)
    SPF_VALIDATION_ENABLED: bool = (
        os.getenv("SPF_VALIDATION_ENABLED", "True").lower() == "true"
    )
    CONTENT_SCANNING_ENABLED: bool = (
        os.getenv("CONTENT_SCANNING_ENABLED", "True").lower() == "true"
    )
    REPUTATION_MONITORING: bool = (
        os.getenv("REPUTATION_MONITORING", "True").lower() == "true"
    )

    # Enhanced header settings
    REQUIRE_UNSUBSCRIBE_HEADER: bool = (
        os.getenv("REQUIRE_UNSUBSCRIBE_HEADER", "True").lower() == "true"
    )
    CUSTOM_MESSAGE_ID: bool = (
        os.getenv("CUSTOM_MESSAGE_ID", "True").lower() == "true"
    )

    # DNSBL settings
    DNSBL_SERVERS: list[str] = [
        "zen.spamhaus.org",
        "bl.spamcop.net",
        "dnsbl.sorbs.net",
    ]
    DNSBL_TIMEOUT: int = 5

    # SMTP rate limiting enhancements
    SMTP_RATE_LIMIT_PER_HOUR: int = int(
        os.getenv("SMTP_RATE_LIMIT_PER_HOUR", "3600")
    )
    SMTP_DEFAULT_TIMEOUT: int = int(os.getenv("SMTP_DEFAULT_TIMEOUT", "60"))

    # Bulk mail performance settings
    BULK_MAIL_MAX_WORKERS: int = int(os.getenv("BULK_MAIL_MAX_WORKERS", "20"))
    BULK_MAIL_RATE_LIMIT: int = int(os.getenv("BULK_MAIL_RATE_LIMIT", "100"))
    BULK_MAIL_POOL_MAX_USES: int = int(
        os.getenv("BULK_MAIL_POOL_MAX_USES", "100")
    )
    BULK_MAIL_POOL_TTL: int = int(os.getenv("BULK_MAIL_POOL_TTL", "300"))
    BULK_MAIL_RETRY_BACKOFF: float = float(
        os.getenv("BULK_MAIL_RETRY_BACKOFF", "1.5")
    )

    # High-Concurrency VPS Optimization Settings
    # Optimized for: 5 vCPU, 6GB RAM, 50GB NVMe, 1000+ threads
    VPS_CPU_CORES: int = int(os.getenv("VPS_CPU_CORES", "5"))
    VPS_RAM_GB: int = int(os.getenv("VPS_RAM_GB", "6"))
    
    # Worker scaling for high concurrency
    MAX_WORKERS: int = int(os.getenv("MAX_WORKERS", "20"))  # 2 per CPU core
    WORKER_CONCURRENCY: int = int(os.getenv("WORKER_CONCURRENCY", "50"))  # 50 threads per worker
    MAX_CONCURRENT_CONNECTIONS: int = int(os.getenv("MAX_CONCURRENT_CONNECTIONS", "1000"))
    
    # Database connection pool optimization for high concurrency
    DATABASE_POOL_SIZE: int = int(os.getenv("DATABASE_POOL_SIZE", "50"))  # Increased from 30
    DATABASE_MAX_OVERFLOW: int = int(os.getenv("DATABASE_MAX_OVERFLOW", "200"))  # Increased from 120
    DATABASE_POOL_TIMEOUT: int = int(os.getenv("DATABASE_POOL_TIMEOUT", "30"))  # Increased from 15
    
    # Redis connection pool for high concurrency
    REDIS_POOL_SIZE: int = int(os.getenv("REDIS_POOL_SIZE", "100"))
    REDIS_MAX_CONNECTIONS: int = int(os.getenv("REDIS_MAX_CONNECTIONS", "200"))
    
    # Async task optimization
    ASYNC_SEMAPHORE_LIMIT: int = int(os.getenv("ASYNC_SEMAPHORE_LIMIT", "200"))
    TASK_QUEUE_SIZE: int = int(os.getenv("TASK_QUEUE_SIZE", "1000"))
    
    # Memory management for high concurrency
    MAX_MEMORY_USAGE_PERCENT: int = int(os.getenv("MAX_MEMORY_USAGE_PERCENT", "80"))
    MEMORY_CLEANUP_INTERVAL: int = int(os.getenv("MEMORY_CLEANUP_INTERVAL", "300"))  # 5 minutes
    
    # Connection pooling and timeouts
    CONNECTION_TIMEOUT: int = int(os.getenv("CONNECTION_TIMEOUT", "30"))
    REQUEST_TIMEOUT: int = int(os.getenv("REQUEST_TIMEOUT", "60"))
    KEEP_ALIVE_TIMEOUT: int = int(os.getenv("KEEP_ALIVE_TIMEOUT", "30"))

    # Firewall and security
    FIREWALL_ENABLED: bool = (
        os.getenv("FIREWALL_ENABLED", "True").lower() == "true"
    )

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "allow"


# Create settings instance
settings = Settings()


def get_settings() -> Settings:
    """Get application settings instance."""
    return settings
