from datetime import datetime
from typing import Any

from pydantic import BaseModel


class PlanResponse(BaseModel):
    id: int
    name: str
    code: str
    price_per_month: float | None = None
    features: list[str] = []
    is_active: bool = True
    max_threads: int | None = None
    max_concurrent_campaigns: int = 5
    max_ai_calls_daily: int | None = None
    max_ai_tokens_monthly: int | None = None
    allowed_ai_models: list[str] = []
    allowed_functions: list[str] = []
    has_premium_support: bool = False
    update_frequency: str = "monthly"
    duration_days: int | None = None
    max_workspaces: int = 1
    max_concurrent_sessions: int = 1
    database_tier_label: str = "shared"
    marketing_blurb: str = ""
    sort_order: int = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class LifetimeStatusResponse(BaseModel):
    """Response model for lifetime plan availability"""

    available_seats: int
    total_seats: int
    sold_seats: int
    percentage_sold: float


class TeamPlanResponse(BaseModel):
    """Response model for team plan details"""

    id: int
    team_name: str
    current_seats: int
    max_seats: int
    price_per_seat: float
    total_cost: float


class PlanFeaturesResponse(BaseModel):
    """Detailed plan features response"""

    code: str
    name: str
    price: float | None
    features: list[str]
    allowed_functions: list[str]
    limits: dict[str, Any]
    support: dict[str, Any]
    marketing_blurb: str


class PlanCreateRequest(BaseModel):
    """Request model for creating a new plan"""

    name: str
    code: str
    price_per_month: float | None = None
    features: list[str] = []
    max_threads: int | None = None
    max_ai_calls_daily: int | None = None
    max_ai_tokens_monthly: int | None = None
    allowed_functions: list[str] = []
    has_premium_support: bool = False
    marketing_blurb: str = ""


class TeamPlanCreateRequest(BaseModel):
    """Request model for creating a team plan"""

    team_name: str
    plan_code: str
    initial_seats: int = 2
