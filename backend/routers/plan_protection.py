"""
Plan Protection Router
Handles subscription protection, billing security, and plan enforcement
"""

import logging
from datetime import datetime, timedelta
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from models import User
from routers.auth import get_current_user

router = APIRouter()
logger = logging.getLogger(__name__)


# Request/Response Models
class PlanLimits(BaseModel):
    emails_per_month: int
    campaigns_per_month: int
    smtp_accounts: int
    domains: int
    templates: int
    users: int


class UsageStats(BaseModel):
    emails_sent: int
    campaigns_created: int
    smtp_accounts_used: int
    domains_used: int
    templates_used: int
    users_count: int


class PlanProtectionStatus(BaseModel):
    plan_id: str
    plan_name: str
    is_active: bool
    usage_percentage: float
    limits: PlanLimits
    current_usage: UsageStats
    expires_at: datetime | None


class LimitCheck(BaseModel):
    resource: str
    allowed: bool
    current_usage: int
    limit: int
    remaining: int


@router.get("/")
async def plan_protection_info() -> dict[str, Any]:
    """Plan Protection API information."""
    return {
        "service": "Plan Protection API",
        "version": "1.0.0",
        "description": "Subscription protection and billing security",
        "endpoints": {
            "status": "/status",
            "limits": "/limits",
            "usage": "/usage",
            "check_limit": "/check-limit/{resource}",
            "upgrade_needed": "/upgrade-needed",
            "billing_protection": "/billing-protection",
            "enforce_limits": "/enforce-limits",
        },
    }


@router.get("/status")
async def get_plan_status(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PlanProtectionStatus:
    """Get current plan protection status."""
    # Mock plan data - in production, get from database
    return PlanProtectionStatus(
        plan_id="starter",
        plan_name="Starter Plan",
        is_active=True,
        usage_percentage=65.5,
        limits=PlanLimits(
            emails_per_month=10000,
            campaigns_per_month=50,
            smtp_accounts=5,
            domains=3,
            templates=20,
            users=2,
        ),
        current_usage=UsageStats(
            emails_sent=6550,
            campaigns_created=32,
            smtp_accounts_used=3,
            domains_used=2,
            templates_used=15,
            users_count=1,
        ),
        expires_at=datetime.utcnow() + timedelta(days=23),
    )


@router.get("/limits")
async def get_plan_limits(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PlanLimits:
    """Get plan limits for current user."""
    # Mock limits - in production, get from user's plan
    return PlanLimits(
        emails_per_month=10000,
        campaigns_per_month=50,
        smtp_accounts=5,
        domains=3,
        templates=20,
        users=2,
    )


@router.get("/usage")
async def get_current_usage(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> UsageStats:
    """Get current usage statistics."""
    # Mock usage - in production, calculate from database
    return UsageStats(
        emails_sent=6550,
        campaigns_created=32,
        smtp_accounts_used=3,
        domains_used=2,
        templates_used=15,
        users_count=1,
    )


@router.get("/check-limit/{resource}")
async def check_resource_limit(
    resource: str,
    requested_amount: int = Query(1),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> LimitCheck:
    """Check if user can use more of a specific resource."""

    # Mock limit checking - in production, check against actual limits
    resource_limits = {
        "emails": {"limit": 10000, "used": 6550},
        "campaigns": {"limit": 50, "used": 32},
        "smtp_accounts": {"limit": 5, "used": 3},
        "domains": {"limit": 3, "used": 2},
        "templates": {"limit": 20, "used": 15},
        "users": {"limit": 2, "used": 1},
    }

    if resource not in resource_limits:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown resource: {resource}",
        )

    limit_info = resource_limits[resource]
    current_usage = limit_info["used"]
    limit = limit_info["limit"]
    remaining = limit - current_usage
    allowed = (current_usage + requested_amount) <= limit

    return LimitCheck(
        resource=resource,
        allowed=allowed,
        current_usage=current_usage,
        limit=limit,
        remaining=remaining,
    )


@router.get("/upgrade-needed")
async def check_upgrade_needed(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """Check if user needs to upgrade their plan."""

    # Mock upgrade check
    usage_percentage = 65.5
    warnings = []

    if usage_percentage > 80:
        warnings.append("Email quota almost exhausted")
    if usage_percentage > 90:
        warnings.append("Immediate upgrade recommended")

    return {
        "upgrade_needed": usage_percentage > 85,
        "usage_percentage": usage_percentage,
        "warnings": warnings,
        "recommended_plan": "Professional" if usage_percentage > 85 else None,
        "days_until_limit": 7 if usage_percentage > 90 else 15,
    }


@router.get("/billing-protection")
async def get_billing_protection_status(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """Get billing protection and fraud prevention status."""

    return {
        "protection_enabled": True,
        "billing_alerts": True,
        "fraud_monitoring": True,
        "usage_caps": {
            "enabled": True,
            "soft_cap_at": 90,  # 90% of limit
            "hard_cap_at": 100,  # 100% of limit
        },
        "billing_history": [
            {
                "date": "2024-01-01",
                "amount": 29.99,
                "status": "paid",
                "plan": "Starter",
            }
        ],
        "next_billing_date": (
            datetime.utcnow() + timedelta(days=23)
        ).isoformat(),
        "payment_method": {
            "type": "credit_card",
            "last_four": "1234",
            "expires": "12/25",
        },
    }


@router.post("/enforce-limits")
async def enforce_plan_limits(
    resource: str,
    action: str,  # "block", "warn", "allow"
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """Enforce plan limits for a specific action."""

    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )

    # Mock enforcement
    return {
        "resource": resource,
        "action": action,
        "enforced": True,
        "message": f"Limit enforcement {action} applied to {resource}",
        "timestamp": datetime.utcnow().isoformat(),
    }


@router.get("/overage-protection")
async def get_overage_protection(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """Get overage protection settings and status."""

    return {
        "overage_protection_enabled": True,
        "soft_limit_actions": ["send_warning_email", "dashboard_notification"],
        "hard_limit_actions": [
            "block_new_campaigns",
            "suspend_email_sending",
            "redirect_to_upgrade",
        ],
        "grace_period_hours": 24,
        "overage_charges": {
            "enabled": False,
            "rate_per_email": 0.001,
            "monthly_cap": 50.0,
        },
    }


@router.post("/reset-usage")
async def reset_usage_counters(
    resource: str | None = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """Reset usage counters (admin only)."""

    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )

    return {
        "success": True,
        "reset_resource": resource or "all",
        "reset_at": datetime.utcnow().isoformat(),
        "message": f"Usage counters reset for {resource or 'all resources'}",
    }


@router.get("/plan-comparison")
async def get_plan_comparison(
    current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    """Get comparison of available plans."""

    return {
        "current_plan": "Starter",
        "available_plans": [
            {
                "id": "starter",
                "name": "Starter",
                "price": 29.99,
                "limits": {
                    "emails_per_month": 10000,
                    "campaigns_per_month": 50,
                    "smtp_accounts": 5,
                },
            },
            {
                "id": "professional",
                "name": "Professional",
                "price": 79.99,
                "limits": {
                    "emails_per_month": 50000,
                    "campaigns_per_month": 200,
                    "smtp_accounts": 20,
                },
            },
            {
                "id": "enterprise",
                "name": "Enterprise",
                "price": 199.99,
                "limits": {
                    "emails_per_month": 200000,
                    "campaigns_per_month": 1000,
                    "smtp_accounts": 100,
                },
            },
        ],
    }
