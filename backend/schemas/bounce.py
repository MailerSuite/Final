"""
Pydantic schemas for bounce management
"""

from datetime import datetime

from pydantic import BaseModel, Field


class BounceProcessRequest(BaseModel):
    """Request to process a bounce"""

    email_address: str = Field(..., description="Email address that bounced")
    bounce_message: str = Field(..., description="Bounce message content")
    smtp_response: str | None = Field(
        None, description="SMTP response code/message"
    )
    campaign_id: str | None = Field(
        None, description="Associated campaign ID"
    )


class BounceResponse(BaseModel):
    """Response from bounce processing"""

    email_address: str
    bounce_type: str
    category: str
    reason: str
    should_suppress: bool
    should_retry: bool
    retry_after_hours: float | None
    confidence: float
    processed_at: datetime


class SuppressionListResponse(BaseModel):
    """Suppression list entry response"""

    id: int
    email_address: str
    suppression_type: str
    reason: str
    added_at: datetime
    is_active: bool


class DeliverabilityStatsResponse(BaseModel):
    """Deliverability statistics response"""

    domain: str
    total_sent: int
    total_bounced: int
    hard_bounces: int
    soft_bounces: int
    reputation_issues: int
    bounce_rate: float
    last_updated: datetime


class BounceStatisticsResponse(BaseModel):
    """Bounce statistics response"""

    total_bounces: int
    bounce_types: dict[str, int]
    bounce_categories: dict[str, int]
    period_days: int
    domain: str | None
