"""
Background tasks for trial plan management
"""

import asyncio
import logging
from datetime import datetime, timedelta

from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from config.settings import settings
from services.trial_service import TrialService

logger = logging.getLogger(__name__)

# Create async engine for background tasks
engine = create_async_engine(settings.DATABASE_URL, echo=False)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)


async def check_expired_trials():
    """Background task to check and expire trials"""
    try:
        async with AsyncSessionLocal() as db:
            trial_service = TrialService(db)
            expired_count = await trial_service.check_and_expire_trials()

            if expired_count > 0:
                logger.info(f"Expired {expired_count} trials")

            return expired_count

    except Exception as e:
        logger.error(f"Error checking expired trials: {e}")
        return 0


async def send_trial_expiration_warnings():
    """Send warnings to users whose trials are about to expire"""
    try:
        async with AsyncSessionLocal() as db:
            from sqlalchemy import and_, select

            from models.plan import TrialPlan

            # Get trials expiring in next 15 minutes
            warning_time = datetime.utcnow() + timedelta(minutes=15)

            result = await db.execute(
                select(TrialPlan).where(
                    and_(
                        TrialPlan.is_active == True,
                        TrialPlan.is_expired == False,
                        TrialPlan.expires_at <= warning_time,
                        TrialPlan.expires_at > datetime.utcnow(),
                    )
                )
            )

            expiring_trials = result.scalars().all()

            # Here you would typically send email notifications or push notifications
            # For now, just log the warnings
            for trial in expiring_trials:
                time_remaining = trial.expires_at - datetime.utcnow()
                minutes_remaining = int(time_remaining.total_seconds() / 60)

                logger.info(
                    f"Trial for user {trial.user_id} expires in {minutes_remaining} minutes. "
                    f"Extensions remaining: {trial.max_extensions_allowed - trial.extensions_used}"
                )

            return len(expiring_trials)

    except Exception as e:
        logger.error(f"Error sending trial expiration warnings: {e}")
        return 0


# Schedule these tasks to run periodically
# This would typically be called from a Celery worker or similar task queue


class TrialTaskScheduler:
    """Scheduler for trial-related background tasks"""

    def __init__(self):
        self.running = False

    async def start_scheduler(self):
        """Start the trial task scheduler"""
        self.running = True
        logger.info("Starting trial task scheduler")

        try:
            while self.running:
                # Check for expired trials every 5 minutes
                await check_expired_trials()

                # Send expiration warnings every 10 minutes
                await send_trial_expiration_warnings()

                # Wait 5 minutes before next check
                await asyncio.sleep(300)  # 5 minutes

        except Exception as e:
            logger.error(f"Error in trial task scheduler: {e}")
        finally:
            logger.info("Trial task scheduler stopped")

    def stop_scheduler(self):
        """Stop the trial task scheduler"""
        self.running = False
        logger.info("Stopping trial task scheduler")


# Initialize scheduler instance
trial_scheduler = TrialTaskScheduler()

# Celery tasks (if using Celery)
# Uncomment these if you have Celery configured

# from celery import current_app as celery_app

# @celery_app.task
# def check_expired_trials_task():
#     """Celery task to check expired trials"""
#     return asyncio.run(check_expired_trials())

# @celery_app.task
# def send_trial_warnings_task():
#     """Celery task to send trial expiration warnings"""
#     return asyncio.run(send_trial_expiration_warnings())


# Manual task triggers for testing/admin use
async def manual_expire_check():
    """Manually trigger trial expiration check"""
    return await check_expired_trials()


async def manual_warning_check():
    """Manually trigger trial warning check"""
    return await send_trial_expiration_warnings()
