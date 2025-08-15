"""
Admin Database Configuration - Separate Database for Admin Panel
Enables independent deployment of admin panel with dedicated database
"""

import logging
import os
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

logger = logging.getLogger(__name__)

# Admin Database Configuration
ADMIN_DATABASE_URL = os.getenv(
    "ADMIN_DATABASE_URL", 
    "postgresql+asyncpg://postgres:postgres@localhost:5432/sgpt_admin"
)

# Ensure PostgreSQL only for admin database
if ADMIN_DATABASE_URL.startswith("sqlite"):
    raise ValueError(
        "CRITICAL: Admin database must use PostgreSQL for production deployment. "
        "SQLite is not supported for admin operations."
    )

# Admin database engine with optimized settings
admin_engine = create_async_engine(
    ADMIN_DATABASE_URL,
    echo=bool(os.getenv("DEBUG_ADMIN_DB", False)),
    # Optimized for admin operations
    pool_size=10,  # Smaller pool for admin operations
    max_overflow=20,  # Total: 30 connections max
    pool_timeout=20,
    pool_pre_ping=True,
    pool_recycle=1800,  # 30 minutes
    connect_args={
        "server_settings": {
            "application_name": "SGPT_Admin_Panel",
            "jit": "off",
            "random_page_cost": "1.1",
            "effective_cache_size": "512MB",
        },
        "command_timeout": 60,  # Longer timeout for admin queries
    },
    logging_name="sqlalchemy.admin_engine",
)

# Admin async session
admin_async_session = async_sessionmaker(
    admin_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)

async def get_admin_db():
    """Get admin database session"""
    async with admin_async_session() as session:
        try:
            yield session
        except Exception as e:
            await session.rollback()
            logger.error(f"Admin database error: {e}")
            raise
        finally:
            await session.close()

async def test_admin_connection():
    """Test admin database connection"""
    try:
        from sqlalchemy import text
        async with admin_async_session() as session:
            await session.execute(text("SELECT 1"))
            return True
    except Exception as e:
        logger.error(f"Admin database connection test failed: {e}")
        return False

# Export admin database components
__all__ = [
    "admin_engine",
    "admin_async_session", 
    "get_admin_db",
    "test_admin_connection",
    "ADMIN_DATABASE_URL"
]