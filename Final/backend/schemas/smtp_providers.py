"""
SMTP Provider Configuration Schemas
"""

from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field, validator

from models.smtp_providers import SMTPProvider


class ProviderConfigBase(BaseModel):
    """Base schema for provider configuration"""
    provider: SMTPProvider
    name: str = Field(..., min_length=1, max_length=255)
    is_active: bool = True


class ProviderConfigCreate(ProviderConfigBase):
    """Schema for creating a provider configuration"""
    credentials: dict[str, str]
    custom_limits: Optional[dict[str, Any]] = None
    
    @validator("credentials")
    def validate_credentials(cls, v, values):
        provider = values.get("provider")
        
        if provider == SMTPProvider.AWS_SES:
            required = ["access_key_id", "secret_access_key", "region"]
            if not all(field in v for field in required):
                raise ValueError(f"AWS SES requires: {', '.join(required)}")
        
        elif provider == SMTPProvider.SENDGRID:
            if "api_key" not in v:
                raise ValueError("SendGrid requires api_key")
        
        elif provider == SMTPProvider.MAILGUN:
            required = ["api_key", "domain"]
            if not all(field in v for field in required):
                raise ValueError(f"Mailgun requires: {', '.join(required)}")
        
        elif provider == SMTPProvider.CUSTOM:
            required = ["smtp_host", "smtp_port", "smtp_username", "smtp_password"]
            if not all(field in v for field in required):
                raise ValueError(f"Custom SMTP requires: {', '.join(required)}")
        
        return v


class ProviderConfigUpdate(BaseModel):
    """Schema for updating a provider configuration"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    is_active: Optional[bool] = None
    
    # Limit updates
    sending_quota_daily: Optional[int] = Field(None, ge=0)
    sending_quota_hourly: Optional[int] = Field(None, ge=0)
    sending_rate_per_second: Optional[float] = Field(None, ge=0)
    max_concurrent_connections: Optional[int] = Field(None, ge=1)
    max_message_size_mb: Optional[int] = Field(None, ge=1)
    max_recipients_per_message: Optional[int] = Field(None, ge=1)
    
    # Warmup configuration
    is_warming_up: Optional[bool] = None
    warmup_daily_increment: Optional[int] = Field(None, ge=10, le=1000)


class ProviderLimits(BaseModel):
    """Provider limit information"""
    daily: dict[str, int]
    hourly: dict[str, int]
    per_second: float
    concurrent_connections: int


class ProviderWarmupInfo(BaseModel):
    """Warmup information"""
    is_warming_up: bool
    current_limit: Optional[int]
    start_date: Optional[datetime]


class ProviderConfigResponse(ProviderConfigBase):
    """Response schema for provider configuration"""
    id: str
    smtp_host: str
    smtp_port: int
    is_verified: bool
    health_status: str
    reputation_score: float
    limits: ProviderLimits
    warmup: ProviderWarmupInfo
    created_at: datetime
    updated_at: datetime
    
    class Config:
        orm_mode = True
        
    @classmethod
    def from_orm(cls, obj):
        """Create from ORM model"""
        return cls(
            id=obj.id,
            provider=obj.provider,
            name=obj.name,
            is_active=obj.is_active,
            smtp_host=obj.smtp_host,
            smtp_port=obj.smtp_port,
            is_verified=obj.is_verified,
            health_status=obj.health_status,
            reputation_score=obj.reputation_score,
            limits=ProviderLimits(
                daily={
                    "limit": obj.get_current_limit("daily"),
                    "used": obj.daily_sent_count,
                    "remaining": obj.get_remaining_quota("daily"),
                },
                hourly={
                    "limit": obj.get_current_limit("hourly"),
                    "used": obj.hourly_sent_count,
                    "remaining": obj.get_remaining_quota("hourly"),
                },
                per_second=obj.sending_rate_per_second,
                concurrent_connections=obj.max_concurrent_connections,
            ),
            warmup=ProviderWarmupInfo(
                is_warming_up=obj.is_warming_up,
                current_limit=obj.warmup_current_limit,
                start_date=obj.warmup_start_date,
            ),
            created_at=obj.created_at,
            updated_at=obj.updated_at,
        )


class ProviderQuotaResponse(BaseModel):
    """Response for quota check"""
    allowed: bool
    checks: dict[str, bool]
    quotas: dict[str, Any]
    reason: Optional[str] = None


class ProviderUsageStats(BaseModel):
    """Provider usage statistics"""
    config_id: str
    provider: SMTPProvider
    name: str
    period_hours: int
    total_sent: int
    total_bounced: int
    total_complained: int
    total_errors: int
    bounce_rate: float
    complaint_rate: float
    average_send_time_ms: Optional[float]
    reputation_score: float
    health_status: str
