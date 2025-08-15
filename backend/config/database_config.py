"""
Advanced Database Configuration with PostgreSQL Enforcement
Handles PostgreSQL-only configuration with optimization for production
"""

import asyncio
import logging
from typing import Any
from urllib.parse import urlparse

from sqlalchemy import text
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from config.settings import settings

logger = logging.getLogger(__name__)


class DatabaseConfig:
    """Advanced database configuration with PostgreSQL enforcement"""

    def __init__(self):
        self.database_url = settings.DATABASE_URL
        self.db_type = self._detect_database_type()
        self.engine = None
        self.session_factory = None

    def _detect_database_type(self) -> str:
        """Detect database type from URL - POSTGRESQL ONLY"""
        parsed = urlparse(self.database_url)
        if parsed.scheme.startswith("postgresql"):
            return "postgresql"
        else:
            # CRITICAL: Reject non-PostgreSQL databases
            raise ValueError(
                f"CRITICAL POLICY VIOLATION: Database type '{parsed.scheme}' is not allowed. "
                "This project requires PostgreSQL only. Please set DATABASE_URL to a PostgreSQL connection string."
            )

    def get_engine_config(self) -> dict[str, Any]:
        """Get optimized engine configuration for PostgreSQL"""
        base_config = {
            "echo": settings.DEBUG,
            "pool_pre_ping": True,
            "pool_size": 20,
            "max_overflow": 30,
            "pool_timeout": 30,
            "pool_recycle": 3600,  # 1 hour
            "connect_args": {
                "server_settings": {
                    "jit": "off",  # Disable JIT for faster small queries
                    "application_name": "SGPT_Backend",
                }
            },
        }

        return base_config

    async def create_engine(self):
        """Create optimized database engine (PostgreSQL only)"""
        engine_config = self.get_engine_config()

        try:
            self.engine = create_async_engine(
                self.database_url, **engine_config
            )

            # Test connection with PostgreSQL query
            async with self.engine.begin() as conn:
                await conn.execute(text("SELECT version()"))

            logger.info("PostgreSQL engine created successfully")

            # Create session factory
            self.session_factory = async_sessionmaker(
                self.engine, class_=AsyncSession, expire_on_commit=False
            )

            return self.engine

        except Exception as e:
            logger.error(f"Failed to create PostgreSQL engine: {e}")
            raise

    async def get_db_session(self) -> AsyncSession:
        """Get database session"""
        if not self.session_factory:
            await self.create_engine()

        async with self.session_factory() as session:
            try:
                yield session
            finally:
                await session.close()

    async def check_performance(self) -> dict[str, Any]:
        """Check database performance metrics"""
        if not self.engine:
            await self.create_engine()

        try:
            async with self.engine.begin() as conn:
                # Basic performance check
                start_time = asyncio.get_event_loop().time()
                await conn.execute(text("SELECT 1"))
                query_time = (
                    asyncio.get_event_loop().time() - start_time
                ) * 1000

                # Get PostgreSQL-specific metrics
                result = await conn.execute(
                    text("""
                    SELECT 
                        pg_database_size(current_database()) as db_size,
                        (SELECT count(*) FROM pg_stat_activity WHERE state = 'active') as active_connections
                """)
                )
                row = result.fetchone()
                db_size = row[0] if row else 0
                active_connections = row[1] if row else 0

                return {
                    "database_type": "postgresql",
                    "query_response_time_ms": round(query_time, 2),
                    "database_size_bytes": db_size,
                    "active_connections": active_connections,
                    "pool_size": self.engine.pool.size()
                    if hasattr(self.engine.pool, "size")
                    else "N/A",
                    "checked_out_connections": self.engine.pool.checkedout()
                    if hasattr(self.engine.pool, "checkedout")
                    else "N/A",
                }

        except Exception as e:
            logger.error(f"Performance check failed: {e}")
            return {"error": str(e)}

    def get_production_recommendations(self) -> dict[str, Any]:
        """Get production optimization recommendations"""
        recommendations = []

        if "localhost" in self.database_url and not settings.DEBUG:
            recommendations.append(
                {
                    "type": "warning",
                    "issue": "Database Location",
                    "recommendation": "Use dedicated database server in production",
                    "impact": "Medium - Improves reliability and performance",
                }
            )

        recommendations.append(
            {
                "type": "optimization",
                "issue": "Connection Pooling",
                "recommendation": "Consider using PgBouncer for connection pooling",
                "impact": "Medium - Reduces connection overhead",
            }
        )

        return {
            "database_type": "postgresql",
            "recommendations": recommendations,
            "current_config": self.get_engine_config(),
        }


# Global database configuration instance
db_config = DatabaseConfig()


async def get_optimized_db():
    """Get optimized database session"""
    async for session in db_config.get_db_session():
        yield session


async def init_database():
    """Initialize database with optimizations"""
    await db_config.create_engine()
    return db_config.engine
