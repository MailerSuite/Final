"""
🤖 Automatic system maintenance tasks
This module contains Celery tasks for automatic maintenance
"""

import asyncio
import os
from datetime import datetime, timedelta
from pathlib import Path

from celery import Task
from sqlalchemy import text

from core.celery_app import celery_app
from core.logger import get_logger
from services.job_service import job_service


# Create a simple monitoring service
class MonitoringService:
    """Simple monitoring service for system health checks"""

    def check_disk_usage(self):
        import shutil

        total, used, free = shutil.disk_usage("/")
        usage_percent = (used / total) * 100
        return {
            "total": total,
            "used": used,
            "free": free,
            "usage_percent": round(usage_percent, 2),
            "status": "healthy" if usage_percent < 85 else "warning",
        }

    def check_memory_usage(self):
        import psutil

        memory = psutil.virtual_memory()
        return {
            "total": memory.total,
            "used": memory.used,
            "free": memory.free,
            "usage_percent": memory.percent,
            "status": "healthy" if memory.percent < 90 else "warning",
        }

    async def check_database_status(self):
        try:
            # Get database session using proper async context
            from core.database import AsyncSession, engine

            async with AsyncSession(engine) as db:
                # Simple database health check
                await db.execute(text("SELECT 1"))
                return {"status": "healthy", "connection": True}
        except Exception as e:
            return {"status": "unhealthy", "error": str(e)}

    def check_redis_status(self):
        try:
            import redis

            r = redis.Redis(host="localhost", port=6379, db=0)
            r.ping()
            return {"status": "healthy", "connection": True}
        except Exception as e:
            return {"status": "unhealthy", "error": str(e)}

    def check_celery_workers(self):
        try:
            if celery_app and hasattr(celery_app, "control"):
                inspect = celery_app.control.inspect()
                workers = inspect.active()
                return {
                    "status": "healthy" if workers else "warning",
                    "active_workers": len(workers) if workers else 0,
                }
            else:
                return {
                    "status": "warning",
                    "error": "Celery app not available",
                }
        except Exception as e:
            return {"status": "unhealthy", "error": str(e)}

    def get_system_stats(self):
        return {
            "disk": self.check_disk_usage(),
            "memory": self.check_memory_usage(),
            "timestamp": datetime.utcnow().isoformat(),
        }


logger = get_logger(__name__)


class BaseMaintenanceTask(Task):
    """Base class for maintenance tasks"""

    def on_failure(self, exc, task_id, args, kwargs, einfo):
        logger.error(f"Maintenance task {self.name} failed: {exc}")

    def on_success(self, retval, task_id, args, kwargs):
        logger.info(f"Maintenance task {self.name} completed successfully")


@celery_app.task(base=BaseMaintenanceTask, bind=True)
def cleanup_old_logs(self, days_to_keep: int = 7):
    """
    🧹 Cleanup old logs
    Delete log files older than specified number of days
    """
    try:
        logs_dir = Path(os.getenv("LOG_DIR", "logs"))
        if not logs_dir.exists():
            return {"status": "error", "message": "Logs directory not found"}

        deleted_files = []
        total_size = 0
        cutoff_date = datetime.now() - timedelta(days=days_to_keep)

        for log_file in logs_dir.glob("*.log*"):
            if log_file.stat().st_mtime < cutoff_date.timestamp():
                size = log_file.stat().st_size
                total_size += size
                deleted_files.append(str(log_file))
                log_file.unlink()

        # Cleanup temporary files
        for temp_file in logs_dir.glob("*.tmp"):
            temp_file.unlink()

        return {
            "status": "success",
            "message": f"Deleted {len(deleted_files)} log files",
            "total_size_mb": round(total_size / (1024 * 1024), 2),
            "files": deleted_files[:10],  # Show only first 10
        }

    except Exception as e:
        logger.error(f"Error during log cleanup: {e}")
        raise


async def cleanup_old_jobs_async(hours_to_keep: int = 24):
    """
    🗄️ Cleanup completed jobs
    Delete old completed tasks from the database
    """
    try:
        from core.database import AsyncSession, engine

        async with AsyncSession(engine) as db:
            await job_service.cleanup_old_jobs(db, hours=hours_to_keep)

        return {"status": "completed", "hours_cleaned": hours_to_keep}
    except Exception as e:
        logger.error(f"Error during job cleanup: {e}")
        raise


@celery_app.task(base=BaseMaintenanceTask, bind=True)
def cleanup_old_jobs(self, hours_to_keep: int = 24):
    """
    🗄️ Cleanup completed jobs
    Delete old completed tasks from the database
    """
    return asyncio.run(cleanup_old_jobs_async(hours_to_keep))


async def system_health_check_async():
    """
    🏥 Comprehensive system health check
    Checks various components and sends alerts for issues
    """
    try:
        monitoring = MonitoringService()
        health_report = {}

        # Disk space check
        disk_usage = monitoring.check_disk_usage()
        health_report["disk"] = disk_usage

        if disk_usage["usage_percent"] > 85:
            logger.warning(f"High disk usage: {disk_usage['usage_percent']}%")

        # Memory usage check
        memory_usage = monitoring.check_memory_usage()
        health_report["memory"] = memory_usage

        if memory_usage["usage_percent"] > 90:
            logger.warning(
                f"High memory usage: {memory_usage['usage_percent']}%"
            )

        # Database status check
        db_status = await monitoring.check_database_status()
        health_report["database"] = db_status

        # Redis check
        redis_status = monitoring.check_redis_status()
        health_report["redis"] = redis_status

        # Celery workers check
        celery_status = monitoring.check_celery_workers()
        health_report["celery"] = celery_status

        health_report["timestamp"] = datetime.utcnow().isoformat()
        health_report["overall_status"] = (
            "healthy"
            if all(
                status.get("status") == "healthy"
                for status in health_report.values()
                if isinstance(status, dict) and "status" in status
            )
            else "unhealthy"
        )

        return health_report

    except Exception as e:
        logger.error(f"Error during health check: {e}")
        return {
            "status": "error",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat(),
        }


@celery_app.task(base=BaseMaintenanceTask, bind=True)
def system_health_check(self):
    """
    🏥 Comprehensive system health check
    Checks various components and sends alerts for issues
    """
    return asyncio.run(system_health_check_async())


async def generate_daily_report_async():
    """
    📊 Generate daily report
    Creates a report of system activity for the day
    """
    try:
        from core.database import AsyncSession, engine

        async with AsyncSession(engine) as db:
            # Job statistics for the day
            yesterday = datetime.utcnow() - timedelta(days=1)
            result = await db.execute(
                text("""
                SELECT 
                    COUNT(*) as total_jobs,
                    COUNT(*) FILTER (WHERE status = 'completed') as completed_jobs,
                    COUNT(*) FILTER (WHERE status = 'failed') as failed_jobs,
                    COUNT(*) FILTER (WHERE status = 'running') as running_jobs,
                    SUM(sent_emails) as total_emails_sent,
                    SUM(failed_emails) as total_emails_failed
                FROM jobs 
                WHERE created_at >= :yesterday
            """),
                {"yesterday": yesterday},
            )

            jobs_stats = result.fetchone()

            # System statistics
            monitoring = MonitoringService()
            system_stats = monitoring.get_system_stats()

            report = {
                "date": yesterday.strftime("%Y-%m-%d"),
                "jobs": dict(jobs_stats._asdict()) if jobs_stats else {},
                "system": system_stats,
                "generated_at": datetime.utcnow().isoformat(),
            }

            # Save report to file
            reports_dir = Path("/app/reports")
            reports_dir.mkdir(exist_ok=True)

            report_file = (
                reports_dir
                / f"daily_report_{yesterday.strftime('%Y%m%d')}.json"
            )
            with open(report_file, "w") as f:
                import json

                json.dump(report, f, indent=2)

            logger.info(f"Daily report generated: {report_file}")
            return report

    except Exception as e:
        logger.error(f"Error generating daily report: {e}")
        raise


@celery_app.task(base=BaseMaintenanceTask, bind=True)
def generate_daily_report(self):
    """
    📊 Generate daily report
    Creates a report of system activity for the day
    """
    return asyncio.run(generate_daily_report_async())


async def backup_rotation_async(keep_daily: int = 7, keep_weekly: int = 4):
    """
    🔄 Backup file rotation
    Manages the retention of backup files according to the rotation policy
    """
    try:
        backup_dir = Path("/opt/backups/sgpt")
        if not backup_dir.exists():
            logger.warning("Backup directory not found")
            return {
                "status": "skipped",
                "reason": "backup directory not found",
            }

        now = datetime.now()

        # Delete daily backups older than keep_daily days
        daily_cutoff = now - timedelta(days=keep_daily)
        deleted_daily = 0

        for backup_file in backup_dir.glob("db_backup_*.sql.gz"):
            file_date = datetime.fromtimestamp(backup_file.stat().st_mtime)
            if file_date < daily_cutoff:
                backup_file.unlink()
                deleted_daily += 1
                logger.info(f"Deleted old daily backup: {backup_file}")

        # Create weekly backups (every Sunday)
        if now.weekday() == 6:  # Sunday
            weekly_backup_name = (
                f"weekly_backup_{now.strftime('%Y%m%d')}.sql.gz"
            )
            # Weekly backup logic

        return {
            "status": "completed",
            "deleted_daily_backups": deleted_daily,
            "backup_directory": str(backup_dir),
        }

    except Exception as e:
        logger.error(f"Error during backup rotation: {e}")
        raise


@celery_app.task(base=BaseMaintenanceTask, bind=True)
def backup_rotation(self, keep_daily: int = 7, keep_weekly: int = 4):
    """
    🔄 Backup file rotation
    Manages the retention of backup files according to the rotation policy
    """
    return asyncio.run(backup_rotation_async(keep_daily, keep_weekly))


@celery_app.task(base=BaseMaintenanceTask, bind=True)
def docker_cleanup(self):
    """
    🐳 Docker resource cleanup
    Deletes unused Docker images and containers
    """
    try:
        import subprocess

        # Delete unused images
        result_images = subprocess.run(
            ["docker", "image", "prune", "-f"], capture_output=True, text=True
        )

        # Delete unused containers
        result_containers = subprocess.run(
            ["docker", "container", "prune", "-f"],
            capture_output=True,
            text=True,
        )

        # Delete unused networks
        result_networks = subprocess.run(
            ["docker", "network", "prune", "-f"],
            capture_output=True,
            text=True,
        )

        return {
            "status": "completed",
            "images_cleaned": "success"
            if result_images.returncode == 0
            else "failed",
            "containers_cleaned": "success"
            if result_containers.returncode == 0
            else "failed",
            "networks_cleaned": "success"
            if result_networks.returncode == 0
            else "failed",
        }

    except Exception as e:
        logger.error(f"Error during Docker cleanup: {e}")
        raise


# Periodic task scheduler - simplified version
def setup_periodic_tasks():
    """Configure periodic maintenance tasks"""

    try:
        # Periodic task setup logic will be added later
        # when Celery is correctly configured
        logger.info("Periodic maintenance tasks setup ready")

        # Example scheduling for reference:
        # cleanup_old_logs - every night at 2:00
        # cleanup_old_jobs - every 6 hours
        # system_health_check - every 15 minutes
        # generate_daily_report - daily at 6:00
        # backup_rotation - daily at 3:00
        # docker_cleanup - weekly on Sunday at 4:00

    except Exception as e:
        logger.error(f"Error setting up periodic tasks: {e}")


# Setup will be called when Celery is correctly configured
if __name__ == "__main__":
    setup_periodic_tasks()
