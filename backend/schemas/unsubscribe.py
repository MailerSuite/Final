"""
Unsubscribe Management Schemas
Pydantic models for unsubscribe and preference management API
"""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, EmailStr, Field


class UnsubscribeRequest(BaseModel):
    email_address: EmailStr
    campaign_id: str | None = None
    reason: str | None = Field(None, max_length=500)
    token: str | None = None

    class Config:
        json_schema_extra = {
            "example": {
                "email_address": "user@example.com",
                "campaign_id": "camp_123",
                "reason": "Too many emails",
                "token": "unsubscribe_token_abc123",
            }
        }


class UnsubscribeResponse(BaseModel):
    success: bool
    unsubscribe_id: str
    email_address: EmailStr
    unsubscribed_at: datetime
    confirmation_message: str
    preference_center_url: str


class EmailPreferences(BaseModel):
    email_address: EmailStr
    promotional_emails: bool = True
    transactional_emails: bool = True
    newsletter: bool = True
    product_updates: bool = True
    marketing_emails: bool = True


class PreferenceUpdateRequest(BaseModel):
    email_address: EmailStr
    preferences: dict[str, bool]
    token: str | None = None

    class Config:
        json_schema_extra = {
            "example": {
                "email_address": "user@example.com",
                "preferences": {
                    "promotional_emails": False,
                    "newsletter": True,
                    "product_updates": True,
                },
                "token": "preference_token_xyz789",
            }
        }


class PreferenceUpdateResponse(BaseModel):
    success: bool
    email_address: EmailStr
    updated_preferences: dict[str, bool]
    updated_at: datetime
    message: str


class PreferenceCenterData(BaseModel):
    token: str
    email_address: EmailStr
    current_preferences: dict[str, bool]
    available_categories: list[dict[str, str]]


class PreferenceCategory(BaseModel):
    id: str
    name: str
    description: str


class GlobalUnsubscribeRequest(BaseModel):
    email_address: EmailStr
    reason: str | None = None
    token: str | None = None


class GlobalUnsubscribeResponse(BaseModel):
    success: bool
    email_address: EmailStr
    global_unsubscribe: bool
    unsubscribed_at: datetime
    message: str


class ResubscribeRequest(BaseModel):
    email_address: EmailStr
    preferences: dict[str, bool] | None = None
    token: str | None = None


class ResubscribeResponse(BaseModel):
    success: bool
    email_address: EmailStr
    resubscribed_at: datetime
    preferences: dict[str, bool]
    message: str


class UnsubscribeStatistics(BaseModel):
    period_days: int
    total_unsubscribes: int
    global_unsubscribes: int
    preference_updates: int
    resubscribes: int
    unsubscribe_rate: float = Field(..., ge=0, le=1)
    top_reasons: list[dict[str, Any]]


class UnsubscribeReason(BaseModel):
    reason: str
    count: int


class TokenVerificationResponse(BaseModel):
    valid: bool
    token: str
    email_address: EmailStr | None
    expires_at: datetime | None
    campaign_id: str | None


class SuppressionListEntry(BaseModel):
    email_address: EmailStr
    unsubscribed_at: datetime
    reason: str | None
    campaign_id: str | None


class SuppressionListResponse(BaseModel):
    suppressed_emails: list[SuppressionListEntry]
    total: int
    limit: int
    offset: int
