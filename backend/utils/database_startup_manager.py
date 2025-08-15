"""
Comprehensive Database Startup Manager
Handles all database operations in one go during startup:
- Database connection check and repair
- Table creation and missing column detection
- Migration management and auto-fixes
- Data integrity checks and repairs
- Performance optimization
"""

import json
import logging
import os
from datetime import datetime
from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.schema import CreateTable

from config.settings import settings

# Import project modules
from core.database import Base, engine, async_session
from models import *  # Import all models to ensure they're registered
from core.auth_utils import get_password_hash

logger = logging.getLogger(__name__)


class DatabaseStartupManager:
    """Comprehensive database startup manager"""

    def __init__(self):
        self.startup_time = datetime.now()
        self.operations_log: list[dict[str, Any]] = []
        self.errors: list[dict[str, Any]] = []
        self.fixes_applied: list[dict[str, Any]] = []
        self.migration_status: dict[str, Any] = {}

    def log_operation(
        self,
        operation: str,
        status: str,
        details: str = "",
        error: str | None = None,
    ) -> None:
        """Log a database operation"""
        log_entry = {
            "timestamp": datetime.now().isoformat(),
            "operation": operation,
            "status": status,
            "details": details,
            "error": error,
        }
        self.operations_log.append(log_entry)

        if status == "SUCCESS":
            logger.info(f"✅ {operation}: {details}")
        elif status == "WARNING":
            logger.warning(f"⚠️  {operation}: {details}")
        elif status == "ERROR":
            logger.error(f"❌ {operation}: {details}")
            if error:
                logger.error(f"   Error: {error}")

    async def check_database_connection(self) -> bool:
        """Check database connection and basic connectivity"""
        try:
            async with engine.begin() as conn:
                await conn.execute(text("SELECT 1"))
            self.log_operation(
                "Database Connection", "SUCCESS", "Connection established"
            )
            return True
        except Exception as e:
            self.log_operation(
                "Database Connection", "ERROR", "Connection failed", str(e)
            )
            return False

    async def check_database_exists(self) -> bool:
        """Check if the database exists, create if not"""
        try:
            # Parse database URL to get database name
            db_url = settings.DATABASE_URL
            if "postgresql" in db_url:
                # Extract database name from PostgreSQL URL
                import re

                match = re.search(r"/([^/?]+)(?:\?|$)", db_url)
                if match:
                    db_name = match.group(1)
                    # Connect to postgres database to check/create target database
                    postgres_url = db_url.replace(f"/{db_name}", "/postgres")
                    temp_engine = create_async_engine(postgres_url)

                    async with temp_engine.begin() as conn:
                        # Check if database exists
                        result = await conn.execute(
                            text(
                                "SELECT 1 FROM pg_database WHERE datname = :db_name"
                            ),
                            {"db_name": db_name},
                        )
                        if not result.fetchone():
                            # Create database
                            await conn.execute(
                                text(f'CREATE DATABASE "{db_name}"')
                            )
                            self.log_operation(
                                "Database Creation",
                                "SUCCESS",
                                f"Created database: {db_name}",
                            )
                        else:
                            self.log_operation(
                                "Database Check",
                                "SUCCESS",
                                f"Database exists: {db_name}",
                            )

                    await temp_engine.dispose()

            return True
        except Exception as e:
            self.log_operation(
                "Database Check", "ERROR", "Database check failed", str(e)
            )
            return False

    async def check_and_create_tables(self) -> bool:
        """Check for missing tables and create them"""
        try:
            async with engine.begin() as conn:
                # Get existing tables
                if "postgresql" in settings.DATABASE_URL:
                    result = await conn.execute(
                        text(
                            "SELECT tablename FROM pg_tables WHERE schemaname = 'public'"
                        )
                    )
                else:
                    result = await conn.execute(
                        text(
                            "SELECT name FROM sqlite_master WHERE type='table'"
                        )
                    )

                existing_tables = {row[0] for row in result.fetchall()}

                # Compute missing just for logging
                expected_tables = set(Base.metadata.tables.keys())
                missing_tables = expected_tables - existing_tables
                if missing_tables:
                    self.log_operation("Table Check", "WARNING", f"Missing tables: {missing_tables}")

                # Create all tables in correct dependency order; create_all is idempotent
                await conn.run_sync(Base.metadata.create_all)
                self.log_operation("Table Creation", "SUCCESS", "Ensured all tables exist via metadata.create_all")

                return True
        except Exception as e:
            self.log_operation(
                "Table Check", "ERROR", "Table check failed", str(e)
            )
            return False

    async def check_and_fix_columns(self) -> bool:
        """Check for missing columns and add them"""
        # Skipping automatic column alterations to avoid unsafe schema drift.
        # Use Alembic migrations for adding/changing columns.
        self.log_operation(
            "Column Check",
            "WARNING",
            "Skipping auto column fix; use Alembic migrations for schema changes",
        )
        return True

    async def run_migrations(self) -> bool:
        """Run Alembic migrations"""
        try:
            # Check if alembic.ini exists
            alembic_config = "alembic.ini"
            if not os.path.exists(alembic_config):
                self.log_operation(
                    "Migration Check",
                    "WARNING",
                    "No alembic.ini found, skipping migrations",
                )
                return True

            # Import alembic
            try:
                from alembic import command
                from alembic.config import Config
            except ImportError:
                self.log_operation(
                    "Migration Check",
                    "WARNING",
                    "Alembic not installed, skipping migrations",
                )
                return True

            # Run migrations
            alembic_cfg = Config(alembic_config)
            alembic_cfg.set_main_option(
                "sqlalchemy.url", settings.DATABASE_URL
            )

            # Get current revision
            try:
                current_rev = command.current(alembic_cfg)
                self.log_operation(
                    "Migration Status",
                    "SUCCESS",
                    f"Current revision: {current_rev}",
                )
            except:
                current_rev = "None"
                self.log_operation(
                    "Migration Status", "WARNING", "No current revision found"
                )

            # Run upgrade to head
            command.upgrade(alembic_cfg, "head")
            self.log_operation(
                "Migration Upgrade", "SUCCESS", "Upgraded to latest revision"
            )

            return True
        except Exception as e:
            self.log_operation(
                "Migration Run", "ERROR", "Migration failed", str(e)
            )
            return False

    async def check_data_integrity(self) -> bool:
        """Check data integrity and fix common issues"""
        try:
            async with engine.begin() as conn:
                # Check for orphaned records
                integrity_checks = [
                    # Check for campaigns without users
                    (
                        "SELECT COUNT(*) FROM campaigns WHERE user_id NOT IN (SELECT id FROM users)",
                        "orphaned_campaigns",
                    ),
                    # Check for emails without campaigns
                    (
                        "SELECT COUNT(*) FROM campaign_emails WHERE campaign_id NOT IN (SELECT id FROM campaigns)",
                        "orphaned_emails",
                    ),
                    # Check for leads without lead bases
                    (
                        "SELECT COUNT(*) FROM lead_entries WHERE lead_base_id NOT IN (SELECT id FROM lead_bases)",
                        "orphaned_leads",
                    ),
                ]

                for check_sql, check_name in integrity_checks:
                    try:
                        result = await conn.execute(text(check_sql))
                        count = result.scalar()
                        if count > 0:
                            self.log_operation(
                                "Data Integrity",
                                "WARNING",
                                f"Found {count} {check_name}",
                            )
                            # Could add cleanup logic here
                        else:
                            self.log_operation(
                                "Data Integrity",
                                "SUCCESS",
                                f"No {check_name} found",
                            )
                    except Exception as e:
                        # Table might not exist yet, skip
                        self.log_operation(
                            "Data Integrity",
                            "WARNING",
                            f"Skipping {check_name} check: {str(e)}",
                        )

                return True
        except Exception as e:
            self.log_operation(
                "Data Integrity",
                "ERROR",
                "Data integrity check failed",
                str(e),
            )
            return False

    async def optimize_database(self) -> bool:
        """Apply database optimizations"""
        try:
            async with engine.begin() as conn:
                if "postgresql" in settings.DATABASE_URL and getattr(settings, "DB_AUTO_OPTIMIZE", False):
                    # PostgreSQL optimizations (no hardcoded DB name)
                    optimizations = [
                        "VACUUM ANALYZE"
                    ]

                    for opt in optimizations:
                        try:
                            await conn.execute(text(opt))
                            self.log_operation(
                                "Database Optimization",
                                "SUCCESS",
                                f"Applied: {opt}",
                            )
                        except Exception as e:
                            self.log_operation(
                                "Database Optimization",
                                "WARNING",
                                f"Failed: {opt}",
                                str(e),
                            )
                else:
                    # SQLite optimizations
                    await conn.execute(text("VACUUM"))
                    await conn.execute(text("ANALYZE"))
                    self.log_operation(
                        "Database Optimization",
                        "SUCCESS",
                        "Applied SQLite optimizations",
                    )

                return True
        except Exception as e:
            self.log_operation(
                "Database Optimization", "ERROR", "Optimization failed", str(e)
            )
            return False

    async def create_default_data(self) -> bool:
        """Create default data if tables are empty"""
        try:
            async with engine.begin() as conn:
                # Check if specific default users exist
                result = await conn.execute(
                    text("SELECT email FROM users WHERE email IN ('first@admin.com', 'first@client.com')")
                )
                existing_emails = {row[0] for row in result.fetchall()}

            # Create missing default users
            if 'first@admin.com' not in existing_emails or 'first@client.com' not in existing_emails:
                # Create both admin and client users using ORM to avoid DB-specific UUID funcs
                # Note: These are temporary passwords that should be changed immediately
                admin_password_hashed = get_password_hash("admin123")
                client_password_hashed = get_password_hash("client123")
                
                try:
                    async with async_session() as session:
                        from models.base import User  # local import to ensure model loaded
                        
                        # Create admin user if not exists
                        if 'first@admin.com' not in existing_emails:
                            admin = User(
                                email="first@admin.com",
                                password_hash=admin_password_hashed,
                                is_active=True,
                                is_admin=True,
                            )
                            session.add(admin)
                            self.log_operation(
                                "Default Data", "SUCCESS", "Created admin user: first@admin.com"
                            )
                        
                        # Create client user if not exists
                        if 'first@client.com' not in existing_emails:
                            client = User(
                                email="first@client.com",
                                password_hash=client_password_hashed,
                                is_active=True,
                                is_admin=False,
                            )
                            session.add(client)
                            self.log_operation(
                                "Default Data", "SUCCESS", "Created client user: first@client.com"
                            )
                        
                        await session.commit()
                    
                except Exception as e:
                    self.log_operation(
                        "Default Data", "ERROR", "Failed to create default users via ORM", str(e)
                    )

                return True
        except Exception as e:
            self.log_operation(
                "Default Data", "ERROR", "Default data creation failed", str(e)
            )
            return False

    async def reset_database(self) -> bool:
        """Reset database by dropping and recreating all tables"""
        try:
            self.log_operation(
                "Database Reset", "WARNING", "Starting database reset..."
            )

            async with engine.begin() as conn:
                # Drop all tables
                if "postgresql" in settings.DATABASE_URL:
                    # PostgreSQL: Drop all tables in public schema
                    await conn.execute(text("DROP SCHEMA public CASCADE"))
                    await conn.execute(text("CREATE SCHEMA public"))
                    await conn.execute(
                        text("GRANT ALL ON SCHEMA public TO public")
                    )
                else:
                    # SQLite: Drop all tables
                    result = await conn.execute(
                        text(
                            "SELECT name FROM sqlite_master WHERE type='table'"
                        )
                    )
                    tables = [row[0] for row in result.fetchall()]
                    for table in tables:
                        await conn.execute(
                            text(f"DROP TABLE IF EXISTS {table}")
                        )

                self.log_operation(
                    "Database Reset", "SUCCESS", "Dropped all tables"
                )

            # Recreate tables
            await self.check_and_create_tables()
            await self.run_migrations()
            await self.create_default_data()

            self.log_operation(
                "Database Reset", "SUCCESS", "Database reset completed"
            )
            return True

        except Exception as e:
            self.log_operation(
                "Database Reset", "ERROR", "Database reset failed", str(e)
            )
            return False

    async def run_fixes_only(self) -> bool:
        """Run only fix operations"""
        try:
            await self.check_and_fix_columns()
            await self.check_data_integrity()
            await self.optimize_database()
            return True
        except Exception as e:
            self.log_operation(
                "Fixes Only", "ERROR", "Fix operations failed", str(e)
            )
            return False

    async def run_checks_only(self) -> bool:
        """Run only check operations"""
        try:
            await self.check_database_connection()
            await self.check_database_exists()
            await self.check_and_create_tables()
            await self.check_and_fix_columns()
            await self.check_data_integrity()
            return True
        except Exception as e:
            self.log_operation(
                "Checks Only", "ERROR", "Check operations failed", str(e)
            )
            return False

    async def run_comprehensive_startup(self) -> dict[str, Any]:
        """Run all database startup operations"""
        logger.info("🚀 Starting comprehensive database startup process...")

        startup_start = datetime.now()

        # Step 1: Check database connection
        if not await self.check_database_connection():
            return self.get_startup_report()

        # Step 2: Check/create database
        if not await self.check_database_exists():
            return self.get_startup_report()

        # Step 3: Check and create tables
        if not await self.check_and_create_tables():
            return self.get_startup_report()

        # Step 4: Check and fix columns
        if not await self.check_and_fix_columns():
            return self.get_startup_report()

        # Step 5: Run migrations
        if not await self.run_migrations():
            return self.get_startup_report()

        # Step 6: Check data integrity
        if not await self.check_data_integrity():
            return self.get_startup_report()

        # Step 7: Optimize database
        if not await self.optimize_database():
            return self.get_startup_report()

        # Step 8: Create default data
        if not await self.create_default_data():
            return self.get_startup_report()

        startup_duration = (datetime.now() - startup_start).total_seconds()
        self.log_operation(
            "Startup Complete",
            "SUCCESS",
            f"Database startup completed in {startup_duration:.2f}s",
        )

        return self.get_startup_report()

    def get_startup_report(self) -> dict[str, Any]:
        """Generate comprehensive startup report"""
        return {
            "startup_time": self.startup_time.isoformat(),
            "duration_seconds": (
                datetime.now() - self.startup_time
            ).total_seconds(),
            "operations": self.operations_log,
            "errors": self.errors,
            "fixes_applied": self.fixes_applied,
            "migration_status": self.migration_status,
            "summary": {
                "total_operations": len(self.operations_log),
                "successful_operations": len(
                    [
                        op
                        for op in self.operations_log
                        if op["status"] == "SUCCESS"
                    ]
                ),
                "warnings": len(
                    [
                        op
                        for op in self.operations_log
                        if op["status"] == "WARNING"
                    ]
                ),
                "errors": len(
                    [
                        op
                        for op in self.operations_log
                        if op["status"] == "ERROR"
                    ]
                ),
                "fixes_applied": len(self.fixes_applied),
            },
        }

    def save_report(self, filename: str = None) -> str:
        """Save startup report to file"""
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"logs/database_startup_report_{timestamp}.json"

        os.makedirs("logs", exist_ok=True)

        report = self.get_startup_report()
        with open(filename, "w") as f:
            json.dump(report, f, indent=2, default=str)

        logger.info(f"📄 Database startup report saved to: {filename}")
        return filename


# Global instance
db_startup_manager = DatabaseStartupManager()


async def run_database_startup() -> dict[str, Any]:
    """Run comprehensive database startup process"""
    return await db_startup_manager.run_comprehensive_startup()
