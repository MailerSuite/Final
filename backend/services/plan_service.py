"""
Plan Enforcement Service for SGPT
Handles all plan limits, quotas, and feature access
"""

import logging
from datetime import datetime, timedelta
from typing import Any

from sqlalchemy import and_, func, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from config.settings import settings
from models.plan import Plan, SessionDevice, UsageCounter, UserPlan

logger = logging.getLogger(__name__)


class PlanService:
    """Service to enforce plan limits across SGPT"""

    def __init__(self, db_session: AsyncSession):
        self.db = db_session

    async def get_user_plan(self, user_id: str) -> Plan | None:
        """Get current active plan for user"""
        result = await self.db.execute(
            select(Plan)
            .join(UserPlan)
            .where(
                and_(
                    UserPlan.user_id == user_id,
                    UserPlan.is_active == True,
                    or_(
                        UserPlan.expires_at.is_(None),  # Lifetime
                        UserPlan.expires_at > func.now(),  # Not expired
                    ),
                )
            )
            .order_by(UserPlan.assigned_at.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def check_ai_quota(
        self, user_id: str, tokens_requested: int = 0
    ) -> dict[str, Any]:
        """Check if user can make AI request - returns user-friendly messages"""
        plan = await self.get_user_plan(user_id)
        if not plan:
            # Assign default plan if none exists
            await self.assign_default_plan(user_id)
            plan = await self.get_user_plan(user_id)

        # Check daily AI calls limit
        max_ai_calls = getattr(plan, "max_ai_calls_daily", None)
        if max_ai_calls and int(max_ai_calls) > 0:
            daily_usage = await self._get_usage_count(
                user_id, "ai_calls_daily"
            )
            if daily_usage >= int(max_ai_calls):
                reset_time = await self._get_reset_time(
                    user_id, "ai_calls_daily"
                )
                return {
                    "allowed": False,
                    "reason": "daily_limit_exceeded",
                    "message": "You've hit your AI limit for this period.",
                    "limit": int(max_ai_calls),
                    "current": daily_usage,
                    "reset_time": reset_time,
                    "upgrade_suggestion": self._get_upgrade_suggestion(
                        str(plan.code) if plan else "basic"
                    ),
                }

        # Check monthly token limit
        max_ai_tokens = getattr(plan, "max_ai_tokens_monthly", None)
        if max_ai_tokens and int(max_ai_tokens) > 0 and tokens_requested > 0:
            monthly_usage = await self._get_usage_count(
                user_id, "ai_tokens_monthly"
            )
            if monthly_usage + tokens_requested > int(max_ai_tokens):
                return {
                    "allowed": False,
                    "reason": "token_limit_exceeded",
                    "message": "You've hit your AI token limit for this period.",
                    "limit": int(max_ai_tokens),
                    "current": monthly_usage,
                    "upgrade_suggestion": self._get_upgrade_suggestion(
                        str(plan.code) if plan else "basic"
                    ),
                }

        return {
            "allowed": True,
            "plan_code": str(plan.code) if plan else "basic",
        }

    async def increment_ai_usage(self, user_id: str, tokens_used: int = 0):
        """Increment AI usage counters after successful request"""
        await self._increment_counter(user_id, "ai_calls_daily", 1)
        if tokens_used > 0:
            await self._increment_counter(
                user_id, "ai_tokens_monthly", tokens_used
            )

    async def check_thread_limit(
        self, user_id: str, requested_threads: int
    ) -> dict[str, Any]:
        """Check if user can use requested number of threads"""
        plan = await self.get_user_plan(user_id)
        if not plan:
            await self.assign_default_plan(user_id)
            plan = await self.get_user_plan(user_id)

        max_threads = getattr(plan, "max_threads", None)
        if (
            max_threads
            and int(max_threads) > 0
            and requested_threads > int(max_threads)
        ):
            return {
                "allowed": False,
                "reason": "thread_limit_exceeded",
                "message": f"Your {plan.name} plan allows up to {max_threads} threads. Upgrade for more capacity.",
                "limit": int(max_threads),
                "requested": requested_threads,
                "upgrade_suggestion": self._get_upgrade_suggestion(
                    str(plan.code)
                ),
            }

        allocated_threads = min(
            requested_threads,
            int(max_threads) if max_threads else requested_threads,
        )
        return {"allowed": True, "allocated_threads": allocated_threads}

    async def check_concurrent_sessions(
        self,
        user_id: str,
        fingerprint: str,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> dict[str, Any]:
        """Check and enforce concurrent session limits"""
        plan = await self.get_user_plan(user_id)
        if not plan:
            await self.assign_default_plan(user_id)
            plan = await self.get_user_plan(user_id)

        # Count active sessions (active in last 2 hours)
        cutoff_time = func.now() - timedelta(hours=2)
        active_sessions = await self.db.scalar(
            select(func.count(SessionDevice.id)).where(
                and_(
                    SessionDevice.user_id == user_id,
                    SessionDevice.is_active == True,
                    SessionDevice.last_activity > cutoff_time,
                )
            )
        )

        # Check if this fingerprint is already registered
        existing_session = await self.db.scalar(
            select(SessionDevice.id).where(
                and_(
                    SessionDevice.user_id == user_id,
                    SessionDevice.fingerprint == fingerprint,
                    SessionDevice.is_active == True,
                )
            )
        )

        if existing_session:
            # Update existing session activity
            await self.db.execute(
                update(SessionDevice)
                .where(SessionDevice.id == existing_session)
                .values(
                    last_activity=func.now(),
                    last_ip=ip_address,
                    user_agent=user_agent,
                )
            )
            await self.db.commit()
            return {"allowed": True, "session_type": "existing"}

        # Check limit for new session
        max_concurrent = getattr(plan, "max_concurrent_sessions", 1)
        if active_sessions >= int(max_concurrent):
            return {
                "allowed": False,
                "reason": "session_limit_exceeded",
                "message": f"Your {plan.name} plan allows {max_concurrent} concurrent session(s). Please close other sessions or upgrade.",
                "limit": int(max_concurrent),
                "current": active_sessions,
                "upgrade_suggestion": self._get_upgrade_suggestion(
                    str(plan.code)
                ),
            }

        # Register new session
        new_session = SessionDevice(
            user_id=user_id,
            fingerprint=fingerprint,
            last_ip=ip_address,
            user_agent=user_agent,
            first_seen=func.now(),
            last_activity=func.now(),
        )
        self.db.add(new_session)
        await self.db.commit()

        return {"allowed": True, "session_type": "new"}

    async def user_has_feature(self, user_id: str, feature_name: str) -> bool:
        """Check if user has access to specific feature"""
        plan = await self.get_user_plan(user_id)
        if not plan:
            return False

        return feature_name in (plan.allowed_functions or [])

    async def get_database_tier_label(self, user_id: str) -> str:
        """Get database tier label for user (all dedicated but labeled appropriately)"""
        plan = await self.get_user_plan(user_id)
        if not plan:
            return "shared"

        return str(getattr(plan, "database_tier_label", "shared"))

    async def get_user_usage_stats(self, user_id: str) -> dict[str, Any]:
        """Get comprehensive usage statistics for user"""
        plan = await self.get_user_plan(user_id)
        if not plan:
            return {"error": "No active plan"}

        # Get current usage
        ai_calls_daily = await self._get_usage_count(user_id, "ai_calls_daily")
        ai_tokens_monthly = await self._get_usage_count(
            user_id, "ai_tokens_monthly"
        )

        # Get reset times
        ai_calls_reset = await self._get_reset_time(user_id, "ai_calls_daily")
        ai_tokens_reset = await self._get_reset_time(
            user_id, "ai_tokens_monthly"
        )

        max_ai_calls = getattr(plan, "max_ai_calls_daily", None)
        ai_calls_remaining = None
        if max_ai_calls and int(max_ai_calls) > 0:
            ai_calls_remaining = int(max_ai_calls) - ai_calls_daily

        return {
            "plan": {
                "name": str(plan.name),
                "code": str(plan.code),
                "database_tier": str(
                    getattr(plan, "database_tier_label", "shared")
                ),
            },
            "limits": {
                "max_threads": int(getattr(plan, "max_threads", 0)) or None,
                "max_ai_calls_daily": int(max_ai_calls)
                if max_ai_calls
                else None,
                "max_ai_tokens_monthly": int(
                    getattr(plan, "max_ai_tokens_monthly", 0)
                )
                or None,
                "max_concurrent_sessions": int(
                    getattr(plan, "max_concurrent_sessions", 1)
                ),
            },
            "current_usage": {
                "ai_calls_daily": ai_calls_daily,
                "ai_tokens_monthly": ai_tokens_monthly,
                "ai_calls_remaining": ai_calls_remaining,
            },
            "reset_times": {
                "ai_calls_reset": ai_calls_reset,
                "ai_tokens_reset": ai_tokens_reset,
            },
            "features": getattr(plan, "allowed_functions", []) or [],
            "has_premium_support": bool(
                getattr(plan, "has_premium_support", False)
            ),
        }

    async def assign_default_plan(self, user_id: str):
        """Assign default plan to user"""
        default_plan_code = getattr(settings, "DEFAULT_PLAN_CODE", "basic")

        # Get default plan
        plan = await self.db.scalar(
            select(Plan).where(
                and_(Plan.code == default_plan_code, Plan.is_active == True)
            )
        )

        if not plan:
            logger.error(f"Default plan '{default_plan_code}' not found")
            return

        # Create user plan assignment
        duration_days = getattr(plan, "duration_days", None)
        expires_at = None
        if duration_days and int(duration_days) > 0:
            expires_at = datetime.utcnow() + timedelta(days=int(duration_days))

        user_plan = UserPlan(
            user_id=user_id,
            plan_id=str(plan.id),
            assigned_at=datetime.utcnow(),
            expires_at=expires_at,
            is_active=True,
        )

        self.db.add(user_plan)
        await self.db.commit()
        logger.info(
            f"Assigned default plan '{default_plan_code}' to user {user_id}"
        )

    async def _get_usage_count(self, user_id: str, counter_type: str) -> int:
        """Get current usage count for specific counter"""
        now = datetime.utcnow()

        counter = await self.db.scalar(
            select(UsageCounter.current_count).where(
                and_(
                    UsageCounter.user_id == user_id,
                    UsageCounter.counter_type == counter_type,
                    UsageCounter.reset_at > now,
                )
            )
        )

        return counter or 0

    async def _increment_counter(
        self, user_id: str, counter_type: str, amount: int
    ):
        """Increment usage counter"""
        now = datetime.utcnow()

        # Determine reset period
        if "daily" in counter_type:
            reset_at = now.replace(
                hour=0, minute=0, second=0, microsecond=0
            ) + timedelta(days=1)
        else:  # monthly
            if now.month == 12:
                reset_at = now.replace(
                    year=now.year + 1,
                    month=1,
                    day=1,
                    hour=0,
                    minute=0,
                    second=0,
                    microsecond=0,
                )
            else:
                reset_at = now.replace(
                    month=now.month + 1,
                    day=1,
                    hour=0,
                    minute=0,
                    second=0,
                    microsecond=0,
                )

        # Get existing counter
        existing_counter = await self.db.scalar(
            select(UsageCounter).where(
                and_(
                    UsageCounter.user_id == user_id,
                    UsageCounter.counter_type == counter_type,
                    UsageCounter.reset_at > now,
                )
            )
        )

        if existing_counter:
            # Update existing counter
            await self.db.execute(
                update(UsageCounter)
                .where(UsageCounter.id == existing_counter.id)
                .values(
                    current_count=UsageCounter.current_count + amount,
                    updated_at=func.now(),
                )
            )
        else:
            # Create new counter
            new_counter = UsageCounter(
                user_id=user_id,
                counter_type=counter_type,
                current_count=amount,
                reset_at=reset_at,
                period_start=now,
            )
            self.db.add(new_counter)

        await self.db.commit()

    async def _get_reset_time(
        self, user_id: str, counter_type: str
    ) -> datetime | None:
        """Get when counter resets"""
        counter = await self.db.scalar(
            select(UsageCounter.reset_at)
            .where(
                and_(
                    UsageCounter.user_id == user_id,
                    UsageCounter.counter_type == counter_type,
                )
            )
            .order_by(UsageCounter.created_at.desc())
            .limit(1)
        )
        return counter

    def _get_upgrade_suggestion(
        self, current_plan_code: str
    ) -> dict[str, str]:
        """Get upgrade suggestion based on current plan"""
        upgrade_map = {
            "basic": {
                "suggested_plan": "Premium",
                "benefit": "3.3x more AI calls (500 daily) + All AI models + SOCKS STREAM",
                "price": "$899/month",
            },
            "premium": {
                "suggested_plan": "Deluxe",
                "benefit": "Unlimited AI + Unlimited threads + Premium support",
                "price": "$1,799/month",
            },
        }

        return upgrade_map.get(
            current_plan_code,
            {
                "suggested_plan": "Contact Sales",
                "benefit": "Custom enterprise solution",
                "price": "Custom pricing",
            },
        )


# FastAPI dependency
async def get_plan_service(db: AsyncSession) -> PlanService:
    """FastAPI dependency to get plan service"""
    return PlanService(db)
