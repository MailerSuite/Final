"""
Trial Plan Service for SGPT
Handles trial plan creation, management, expiration, and extensions
"""

import logging
from datetime import datetime, timedelta
from typing import Any

from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from models.plan import Plan, TrialConfiguration, TrialPlan
# Payment system removed

logger = logging.getLogger(__name__)


class TrialService:
    """Service to manage trial plans"""

    def __init__(self, db_session: AsyncSession):
        self.db = db_session
        self.bitcoin_service = None

    async def get_active_trial_configuration(
        self, config_name: str = "default"
    ) -> TrialConfiguration | None:
        """Get active trial configuration"""
        result = await self.db.execute(
            select(TrialConfiguration).where(
                and_(
                    TrialConfiguration.config_name == config_name,
                    TrialConfiguration.is_active == True,
                )
            )
        )
        return result.scalar_one_or_none()

    async def get_trial_plan(self) -> Plan | None:
        """Get the trial plan configuration"""
        result = await self.db.execute(
            select(Plan).where(
                and_(Plan.is_trial_plan == True, Plan.is_active == True)
            )
        )
        return result.scalar_one_or_none()

    async def get_user_active_trial(self, user_id: str) -> TrialPlan | None:
        """Get user's current active trial"""
        result = await self.db.execute(
            select(TrialPlan)
            .options(joinedload(TrialPlan.plan))
            .where(
                and_(
                    TrialPlan.user_id == user_id,
                    TrialPlan.is_active == True,
                    TrialPlan.is_expired == False,
                )
            )
            .order_by(TrialPlan.created_at.desc())
        )
        return result.scalar_one_or_none()

    async def has_user_used_trial(self, user_id: str) -> bool:
        """Check if user has already used a trial"""
        result = await self.db.execute(
            select(func.count(TrialPlan.id)).where(
                TrialPlan.user_id == user_id
            )
        )
        count = result.scalar_one()
        return count > 0

    async def create_trial_payment_request(
        self, user_id: str, config_name: str = "default"
    ) -> dict[str, Any]:
        """Create a payment request for trial plan"""

        # Check if user already has a trial
        if await self.has_user_used_trial(user_id):
            raise ValueError("User has already used a trial plan")

        # Get trial configuration
        config = await self.get_active_trial_configuration(config_name)
        if not config:
            raise ValueError("Trial configuration not found")

        # Get trial plan
        trial_plan = await self.get_trial_plan()
        if not trial_plan:
            raise ValueError("Trial plan not found")

        # Payment removed: directly grant trial
        return {
            "payment_request_id": None,
            "plan_name": f"Trial Plan ({config.duration_minutes} minutes)",
            "amount_btc": "0",
            "amount_usd": 0,
            "btc_address": None,
            "expires_at": (datetime.utcnow() + timedelta(minutes=config.duration_minutes)).isoformat(),
            "status": "granted",
            "qr_data": None,
            "trial_duration_minutes": config.duration_minutes,
            "max_threads": config.max_threads,
            "max_extensions": config.max_extensions,
        }

    async def activate_trial_after_payment(
        self, payment_request_id: str, user_id: str
    ) -> TrialPlan:
        """Activate trial plan after payment confirmation"""

        # Payment removed: proceed without payment verification

        # Get trial plan and configuration
        trial_plan = await self.get_trial_plan()
        config = await self.get_active_trial_configuration()

        if not trial_plan or not config:
            raise ValueError("Trial configuration not found")

        # Calculate expiration time
        expires_at = datetime.utcnow() + timedelta(
            minutes=config.duration_minutes
        )

        # Create trial instance
        trial_instance = TrialPlan(
            user_id=user_id,
            plan_id=trial_plan.id,
            expires_at=expires_at,
            max_extensions_allowed=config.max_extensions,
            payment_request_id=payment_request_id,
            is_paid=True,
            payment_confirmed_at=datetime.utcnow(),
        )

        self.db.add(trial_instance)
        await self.db.commit()
        await self.db.refresh(trial_instance)

        logger.info(
            f"Activated trial plan for user {user_id}, expires at {expires_at}"
        )
        return trial_instance

    async def extend_trial(
        self, user_id: str, payment_request_id: str | None = None
    ) -> TrialPlan:
        """Extend an active trial plan"""

        # Get active trial
        trial = await self.get_user_active_trial(user_id)
        if not trial:
            raise ValueError("No active trial found")

        if not trial.can_extend:
            raise ValueError("Trial cannot be extended")

        # Get configuration for extension duration
        config = await self.get_active_trial_configuration()
        if not config:
            raise ValueError("Trial configuration not found")

        # If payment_request_id provided, verify payment
        # Payment removed: extension proceeds without payment

        # Extend the trial
        extension_minutes = config.extension_minutes
        trial.expires_at = trial.expires_at + timedelta(
            minutes=extension_minutes
        )
        trial.extensions_used += 1
        trial.updated_at = datetime.utcnow()

        await self.db.commit()
        await self.db.refresh(trial)

        logger.info(
            f"Extended trial for user {user_id} by {extension_minutes} minutes"
        )
        return trial

    async def create_extension_payment_request(
        self, user_id: str
    ) -> dict[str, Any]:
        """Create payment request for trial extension"""

        # Check if user has active trial that can be extended
        trial = await self.get_user_active_trial(user_id)
        if not trial or not trial.can_extend:
            raise ValueError("No extendable trial found")

        # Get extension pricing
        config = await self.get_active_trial_configuration()
        if not config:
            raise ValueError("Trial configuration not found")

        # Payment removed: return info for extension without payment
        return {
            "payment_request_id": None,
            "plan_name": f"Trial Extension ({config.extension_minutes} minutes)",
            "amount_btc": "0",
            "amount_usd": 0,
            "btc_address": None,
            "expires_at": (datetime.utcnow() + timedelta(minutes=config.extension_minutes)).isoformat(),
            "status": "granted",
            "qr_data": None,
            "extension_minutes": config.extension_minutes,
            "extensions_remaining": trial.max_extensions_allowed - trial.extensions_used - 1,
        }

    async def check_and_expire_trials(self) -> int:
        """Background task to check and expire trials"""
        expired_count = 0

        # Get all active trials that should be expired
        result = await self.db.execute(
            select(TrialPlan).where(
                and_(
                    TrialPlan.is_active == True,
                    TrialPlan.is_expired == False,
                    TrialPlan.expires_at <= datetime.utcnow(),
                )
            )
        )
        expired_trials = result.scalars().all()

        for trial in expired_trials:
            trial.is_expired = True
            trial.is_active = False
            trial.updated_at = datetime.utcnow()
            expired_count += 1

            logger.info(f"Expired trial for user {trial.user_id}")

        if expired_count > 0:
            await self.db.commit()

        return expired_count

    async def get_trial_usage_stats(self, user_id: str) -> dict[str, Any]:
        """Get trial usage statistics for user"""

        trial = await self.get_user_active_trial(user_id)
        if not trial:
            return {"error": "No active trial found"}

        return {
            "is_active": trial.is_active and not trial.is_expired,
            "time_remaining_minutes": trial.time_remaining_minutes,
            "threads_used": trial.threads_used,
            "campaigns_sent": trial.campaigns_sent,
            "extensions_used": trial.extensions_used,
            "extensions_remaining": trial.max_extensions_allowed
            - trial.extensions_used,
            "can_extend": trial.can_extend,
            "expires_at": trial.expires_at.isoformat(),
        }

    async def update_trial_usage(
        self,
        user_id: str,
        threads_used: int | None = None,
        campaigns_sent: int | None = None,
    ) -> bool:
        """Update trial usage statistics"""

        trial = await self.get_user_active_trial(user_id)
        if not trial:
            return False

        if threads_used is not None:
            trial.threads_used = threads_used

        if campaigns_sent is not None:
            trial.campaigns_sent = campaigns_sent

        trial.updated_at = datetime.utcnow()
        await self.db.commit()

        return True
