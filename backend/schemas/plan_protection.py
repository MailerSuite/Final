"""
Plan Protection Schemas
Pydantic models for subscription protection and billing security
"""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class PlanLimits(BaseModel):
    emails_per_month: int = Field(..., ge=0)
    campaigns_per_month: int = Field(..., ge=0)
    smtp_accounts: int = Field(..., ge=0)
    domains: int = Field(..., ge=0)
    templates: int = Field(..., ge=0)
    users: int = Field(..., ge=0)


class UsageStats(BaseModel):
    emails_sent: int = Field(..., ge=0)
    campaigns_created: int = Field(..., ge=0)
    smtp_accounts_used: int = Field(..., ge=0)
    domains_used: int = Field(..., ge=0)
    templates_used: int = Field(..., ge=0)
    users_count: int = Field(..., ge=0)


class PlanProtectionStatus(BaseModel):
    plan_id: str
    plan_name: str
    is_active: bool
    usage_percentage: float = Field(..., ge=0, le=100)
    limits: PlanLimits
    current_usage: UsageStats
    expires_at: datetime | None


class LimitCheck(BaseModel):
    resource: str
    allowed: bool
    current_usage: int = Field(..., ge=0)
    limit: int = Field(..., ge=0)
    remaining: int = Field(..., ge=0)


class UpgradeRecommendation(BaseModel):
    upgrade_needed: bool
    usage_percentage: float = Field(..., ge=0, le=100)
    warnings: list[str]
    recommended_plan: str | None
    days_until_limit: int | None


class BillingProtectionStatus(BaseModel):
    protection_enabled: bool
    billing_alerts: bool
    fraud_monitoring: bool
    usage_caps: dict[str, Any]
    billing_history: list[dict[str, Any]]
    next_billing_date: str
    payment_method: dict[str, str]


class OverageProtectionSettings(BaseModel):
    overage_protection_enabled: bool
    soft_limit_actions: list[str]
    hard_limit_actions: list[str]
    grace_period_hours: int = Field(..., ge=0)
    overage_charges: dict[str, Any]


class PlanInfo(BaseModel):
    id: str
    name: str
    price: float = Field(..., ge=0)
    limits: dict[str, int]


class PlanComparison(BaseModel):
    current_plan: str
    available_plans: list[PlanInfo]


class UsageResetResponse(BaseModel):
    success: bool
    reset_resource: str
    reset_at: datetime
    message: str


class LimitEnforcementRequest(BaseModel):
    resource: str
    action: str = Field(..., pattern="^(block|warn|allow)$")


class LimitEnforcementResponse(BaseModel):
    resource: str
    action: str
    enforced: bool
    message: str
    timestamp: datetime
