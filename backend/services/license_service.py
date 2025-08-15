"""
License Service - Manages user licenses and plan assignments
"""

import logging
from datetime import datetime, timedelta
from typing import Any

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.base import User
from models.plan import Plan, UserPlan

logger = logging.getLogger(__name__)


class LicenseService:
    """Service for managing user licenses and plan assignments"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def assign_plan(
        self, user_id: str, plan_id: str, is_trial: bool = False
    ) -> dict[str, Any]:
        """Assign a plan to a user"""
        try:
            # Check if plan exists
            plan_result = await self.db.execute(
                select(Plan).where(Plan.id == plan_id)
            )
            plan = plan_result.scalar_one_or_none()

            if not plan:
                raise HTTPException(status_code=404, detail="Plan not found")

            # Check if user exists
            user_result = await self.db.execute(
                select(User).where(User.id == user_id)
            )
            user = user_result.scalar_one_or_none()

            if not user:
                raise HTTPException(status_code=404, detail="User not found")

            # Check if user already has this plan
            existing_result = await self.db.execute(
                select(UserPlan).where(
                    UserPlan.user_id == user_id, UserPlan.plan_id == plan_id
                )
            )
            existing_user_plan = existing_result.scalar_one_or_none()

            if existing_user_plan:
                # Update existing plan
                existing_user_plan.is_trial = is_trial
                existing_user_plan.trial_end_date = (
                    datetime.now() + timedelta(days=30) if is_trial else None
                )
                existing_user_plan.updated_at = datetime.now()

                await self.db.commit()
                logger.info(f"Updated plan {plan_id} for user {user_id}")

                return {
                    "user_plan_id": existing_user_plan.id,
                    "status": "updated",
                    "is_trial": is_trial,
                    "trial_end_date": existing_user_plan.trial_end_date,
                }
            else:
                # Create new user plan
                user_plan = UserPlan(
                    user_id=user_id,
                    plan_id=plan_id,
                    is_trial=is_trial,
                    trial_end_date=datetime.now() + timedelta(days=30)
                    if is_trial
                    else None,
                    created_at=datetime.now(),
                    updated_at=datetime.now(),
                )

                self.db.add(user_plan)
                await self.db.commit()
                logger.info(f"Assigned plan {plan_id} to user {user_id}")

                return {
                    "user_plan_id": user_plan.id,
                    "status": "created",
                    "is_trial": is_trial,
                    "trial_end_date": user_plan.trial_end_date,
                }

        except Exception as e:
            await self.db.rollback()
            logger.error(
                f"Failed to assign plan {plan_id} to user {user_id}: {e}"
            )
            raise HTTPException(
                status_code=500, detail="Failed to assign plan"
            )

    async def get_user_license(self, user_id: str) -> dict[str, Any] | None:
        """Get user's current license information"""
        try:
            # Get user's active plans
            result = await self.db.execute(
                select(UserPlan, Plan)
                .join(Plan, UserPlan.plan_id == Plan.id)
                .where(UserPlan.user_id == user_id)
                .order_by(UserPlan.created_at.desc())
            )

            user_plans = result.fetchall()

            if not user_plans:
                return None

            # Get the most recent plan
            user_plan, plan = user_plans[0]

            # Check if trial is expired
            trial_expired = False
            if user_plan.is_trial and user_plan.trial_end_date:
                trial_expired = datetime.now() > user_plan.trial_end_date

            return {
                "user_plan_id": user_plan.id,
                "plan_id": plan.id,
                "plan_name": plan.name,
                "plan_type": plan.plan_type,
                "is_trial": user_plan.is_trial,
                "trial_end_date": user_plan.trial_end_date,
                "trial_expired": trial_expired,
                "email_limit": plan.email_limit,
                "campaign_limit": plan.campaign_limit,
                "features": plan.features,
                "created_at": user_plan.created_at,
                "updated_at": user_plan.updated_at,
            }

        except Exception as e:
            logger.error(f"Failed to get license for user {user_id}: {e}")
            return None

    async def check_feature_access(
        self, user_id: str, feature_name: str
    ) -> bool:
        """Check if user has access to a specific feature"""
        license_info = await self.get_user_license(user_id)

        if not license_info:
            return False

        # Check if trial is expired
        if license_info["trial_expired"]:
            return False

        # Check if feature is included in plan
        features = license_info.get("features", {})
        return features.get(feature_name, False)

    async def get_usage_limits(self, user_id: str) -> dict[str, Any]:
        """Get user's usage limits based on their plan"""
        license_info = await self.get_user_license(user_id)

        if not license_info:
            return {"email_limit": 0, "campaign_limit": 0, "features": {}}

        return {
            "email_limit": license_info["email_limit"],
            "campaign_limit": license_info["campaign_limit"],
            "features": license_info["features"],
        }

    async def revoke_plan(self, user_id: str, plan_id: str) -> bool:
        """Revoke a plan from a user"""
        try:
            result = await self.db.execute(
                select(UserPlan).where(
                    UserPlan.user_id == user_id, UserPlan.plan_id == plan_id
                )
            )
            user_plan = result.scalar_one_or_none()

            if not user_plan:
                return False

            await self.db.delete(user_plan)
            await self.db.commit()

            logger.info(f"Revoked plan {plan_id} from user {user_id}")
            return True

        except Exception as e:
            await self.db.rollback()
            logger.error(
                f"Failed to revoke plan {plan_id} from user {user_id}: {e}"
            )
            return False
