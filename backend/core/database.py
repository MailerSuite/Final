import logging
import time
from datetime import datetime, timedelta

from sqlalchemy import text
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import selectinload

from config.settings import settings

logger = logging.getLogger(__name__)

# Allow SQLite in testing mode to enable fast, isolated tests
is_sqlite = settings.DATABASE_URL.startswith("sqlite")
is_postgres = settings.DATABASE_URL.startswith("postgresql")

if is_sqlite and not getattr(settings, "TESTING", False):
    raise ValueError(
        "CRITICAL POLICY VIOLATION: SQLite is not allowed outside testing. "
        "Set TESTING=true to use SQLite for tests, or use PostgreSQL."
    )

# Engine configuration - conditional per driver
if is_postgres:
    engine = create_async_engine(
        settings.DATABASE_URL,
        echo=settings.DEBUG,
        pool_size=getattr(settings, "DATABASE_POOL_SIZE", 50),  # Increased for high concurrency
        max_overflow=getattr(settings, "DATABASE_MAX_OVERFLOW", 200),  # Increased for high concurrency
        pool_timeout=getattr(settings, "DATABASE_POOL_TIMEOUT", 30),  # Increased for high concurrency
        pool_pre_ping=True,
        pool_recycle=900,
        connect_args={
            "server_settings": {
                "application_name": "SGPT_HighConcurrency",
                "jit": "off",
                "random_page_cost": "1.1",
                # Note: The following settings require server restart and are removed:
                # effective_cache_size, shared_buffers, work_mem, maintenance_work_mem,
                # max_connections, max_worker_processes, max_parallel_workers_per_gather, max_parallel_workers
                # These should be set in postgresql.conf instead
            },
            "command_timeout": getattr(settings, "CONNECTION_TIMEOUT", 30),
        },
        logging_name="sqlalchemy.engine",
    )
else:
    # SQLite (testing): simpler engine without PG-specific args
    engine = create_async_engine(
        settings.DATABASE_URL,
        echo=settings.DEBUG,
        pool_pre_ping=True,
        logging_name="sqlalchemy.engine",
    )

# PERFORMANCE FIX: Optimized async session configuration
async_session = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    # Optimize session handling for performance
    autoflush=False,  # Manual control over flushes
    autocommit=False,  # Explicit transaction control
)

# Import Base from models to ensure all models use the same Base
from models.base import Base


async def test_connection():
    """Test database connection for startup validation"""
    try:
        async with async_session() as session:
            await session.execute(text("SELECT 1"))
            return True
    except Exception as e:
        logger.error(f"Database connection test failed: {e}")
        return False


# PERFORMANCE FIX: Enhanced Query optimization utilities with caching
class QueryOptimizer:
    """Utility class for query optimization and monitoring with intelligent caching"""

    @staticmethod
    def get_campaigns_with_stats(user_id: str):
        """Optimized query for campaigns with statistics"""
        from sqlalchemy import func, select

        from models.base import Campaign, CampaignEmail

        return (
            select(
                Campaign,
                func.count(CampaignEmail.id).label("total_emails"),
                func.sum(
                    func.case((CampaignEmail.status == "sent", 1), else_=0)
                ).label("sent_count"),
                func.sum(
                    func.case(
                        (CampaignEmail.opened_at.isnot(None), 1), else_=0
                    )
                ).label("opened_count"),
                func.sum(
                    func.case(
                        (CampaignEmail.clicked_at.isnot(None), 1), else_=0
                    )
                ).label("clicked_count"),
            )
            .select_from(Campaign)
            .outerjoin(CampaignEmail, Campaign.id == CampaignEmail.campaign_id)
            .where(Campaign.user_id == user_id)
            .group_by(Campaign.id)
            .order_by(Campaign.created_at.desc())
        )

    @staticmethod
    def get_user_with_resources(user_id: str):
        """Optimized query to load user with all related resources"""
        from sqlalchemy import select

        from models.base import User

        return (
            select(User)
            .options(
                selectinload(User.campaigns),
                selectinload(User.smtp_accounts),
                selectinload(User.proxy_servers),
                selectinload(User.templates),
                selectinload(User.lead_bases),
            )
            .where(User.id == user_id)
        )

    @staticmethod
    def get_active_leads_for_campaign(user_id: str, lead_base_ids: list):
        """Optimized query for active leads"""
        from sqlalchemy import select

        from models.base import LeadEntry

        return (
            select(LeadEntry)
            .where(
                LeadEntry.user_id == user_id,
                LeadEntry.lead_base_id.in_(lead_base_ids),
                LeadEntry.is_active == True,
                LeadEntry.is_verified == True,
                LeadEntry.bounce_count < 3,
            )
            .order_by(LeadEntry.last_contacted.asc().nullsfirst())
        )


# PERFORMANCE FIX: Database session with monitoring
async def get_db():
    """Enhanced database session with performance monitoring"""
    start_time = time.time()
    async with async_session() as session:
        try:
            yield session
        except Exception as e:
            await session.rollback()
            logger.error(f"Database error: {e}")
            raise
        finally:
            await session.close()
            duration = time.time() - start_time
            if duration > 1.0:  # Log slow database operations
                logger.warning(f"Slow database operation: {duration:.2f}s")


# PERFORMANCE FIX: Bulk operations utility
class BulkOperations:
    """Optimized bulk database operations"""

    @staticmethod
    async def bulk_insert_emails(session: AsyncSession, emails_data: list):
        """Bulk insert campaign emails efficiently"""
        from models.base import CampaignEmail

        # Use bulk_insert_mappings for better performance
        await session.execute(CampaignEmail.__table__.insert(), emails_data)
        await session.commit()

    @staticmethod
    async def bulk_update_email_status(
        session: AsyncSession, email_updates: list
    ):
        """Bulk update email statuses efficiently"""
        from sqlalchemy import update

        from models.base import CampaignEmail

        for update_data in email_updates:
            stmt = (
                update(CampaignEmail)
                .where(CampaignEmail.id == update_data["id"])
                .values(**{k: v for k, v in update_data.items() if k != "id"})
            )
            await session.execute(stmt)

        await session.commit()

    @staticmethod
    async def bulk_insert_leads(session: AsyncSession, leads_data: list):
        """Bulk insert leads efficiently"""
        from models.base import LeadEntry

        await session.execute(LeadEntry.__table__.insert(), leads_data)
        await session.commit()


# PERFORMANCE FIX: Connection health check
async def check_database_health():
    """Check database connection and performance"""
    try:
        start_time = time.time()
        async with async_session() as session:
            result = await session.execute(text("SELECT 1"))
            connection_time = time.time() - start_time

            return {
                "status": "healthy",
                "connection_time": connection_time,
                "pool_size": getattr(engine.pool, "size", lambda: 0)(),
                "checked_out": getattr(engine.pool, "checkedout", lambda: 0)(),
                "checked_in": getattr(engine.pool, "checkedin", lambda: 0)(),
            }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "connection_time": None,
        }


# PERFORMANCE FIX: Database cleanup utilities
async def cleanup_old_data():
    """Clean up old campaign emails and logs"""
    async with async_session() as session:
        # Clean up old campaign emails (older than 90 days)
        cleanup_date = datetime.utcnow() - timedelta(days=90)

        # Delete old bounced emails
        await session.execute(
            text("""
                DELETE FROM campaign_emails 
                WHERE status = 'bounced' 
                AND created_at < :cleanup_date
                LIMIT 1000
            """),
            {"cleanup_date": cleanup_date},
        )

        # Delete old login activities (older than 30 days)
        await session.execute(
            text("""
                DELETE FROM login_activity 
                WHERE created_at < :cleanup_date
                LIMIT 1000
            """),
            {"cleanup_date": datetime.utcnow() - timedelta(days=30)},
        )

        await session.commit()


# Export optimized components
__all__ = [
    "get_db",
    "engine",
    "async_session",
    "Base",
    "QueryOptimizer",
    "BulkOperations",
    "check_database_health",
    "cleanup_old_data",
]
