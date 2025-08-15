"""
Bounce Management Schemas
Pydantic models for bounce management API requests and responses
"""

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, EmailStr, Field


class BounceType(str, Enum):
    HARD = "hard"
    SOFT = "soft"
    COMPLAINT = "complaint"


class SuppressionType(str, Enum):
    HARD_BOUNCE = "hard_bounce"
    SOFT_BOUNCE = "soft_bounce"
    COMPLAINT = "complaint"
    UNSUBSCRIBE = "unsubscribe"
    MANUAL = "manual"


class BounceProcessRequest(BaseModel):
    email_address: EmailStr
    bounce_type: BounceType
    bounce_reason: str = Field(..., min_length=1, max_length=500)
    campaign_id: str | None = None
    smtp_response: str | None = None

    class Config:
        json_schema_extra = {
            "example": {
                "email_address": "user@example.com",
                "bounce_type": "hard",
                "bounce_reason": "Mailbox does not exist",
                "campaign_id": "camp_123",
                "smtp_response": "550 5.1.1 User unknown",
            }
        }


class BounceProcessResponse(BaseModel):
    success: bool
    email_address: EmailStr
    bounce_type: BounceType
    action_taken: str
    suppression_duration: str
    processed_at: datetime


class SuppressionListEntry(BaseModel):
    email_address: EmailStr
    suppression_type: SuppressionType
    reason: str
    created_at: datetime
    expires_at: datetime | None = None


class SuppressionListResponse(BaseModel):
    entries: list[SuppressionListEntry]
    total: int
    limit: int
    offset: int


class BounceStatistics(BaseModel):
    total_bounces: int
    hard_bounces: int
    soft_bounces: int
    complaints: int
    suppressed_emails: int
    bounce_rate: float = Field(..., ge=0, le=1)


class DeliverabilityStats(BaseModel):
    delivered: int
    bounced: int
    complained: int
    opened: int
    clicked: int
    deliverability_rate: float = Field(..., ge=0, le=1)
    bounce_rate: float = Field(..., ge=0, le=1)
    complaint_rate: float = Field(..., ge=0, le=1)


class BounceHistoryEntry(BaseModel):
    timestamp: datetime
    bounce_type: BounceType
    reason: str
    campaign_id: str | None
    smtp_response: str | None


class SuppressionCheckRequest(BaseModel):
    email_addresses: list[EmailStr] = Field(..., max_items=1000)


class SuppressionCheckResult(BaseModel):
    is_suppressed: bool
    suppression_type: SuppressionType | None
    suppression_date: datetime | None


class SuppressionCheckResponse(BaseModel):
    checked_count: int
    suppressed_count: int
    results: dict[str, SuppressionCheckResult]


class DomainReputationResponse(BaseModel):
    domain: str
    reputation_score: float = Field(..., ge=0, le=1)
    total_emails_sent: int
    bounce_rate: float = Field(..., ge=0, le=1)
    complaint_rate: float = Field(..., ge=0, le=1)
    last_updated: datetime
    recommendations: list[str]


class BulkRemoveRequest(BaseModel):
    email_addresses: list[EmailStr] = Field(..., max_items=100)
    reason: str = Field(..., min_length=1, max_length=200)


class BulkRemoveResponse(BaseModel):
    success: bool
    removed_count: int
    processed_at: datetime
    reason: str
