
from pydantic import BaseModel, Field


class SMTPSettingsResponse(BaseModel):
    """Current SMTP operational settings."""

    SMTP_DEFAULT_TIMEOUT: int = Field(..., ge=1)
    SMTP_RATE_LIMIT_PER_HOUR: int = Field(..., ge=1)
    SMTP_MAX_RETRIES: int = Field(..., ge=0)
    SMTP_MAX_DELAY: int = Field(..., ge=0)
    # Optional throttling extensions
    PER_DOMAIN_LIMITS: dict[str, int] | None = None  # domain -> msgs/hour
    WARMUP_PLAN: dict | None = None  # plan definition


class SMTPSettingsUpdate(BaseModel):
    """Payload for updating SMTP settings."""

    SMTP_DEFAULT_TIMEOUT: int | None = Field(None, ge=1)
    SMTP_RATE_LIMIT_PER_HOUR: int | None = Field(None, ge=1)
    SMTP_MAX_RETRIES: int | None = Field(None, ge=0)
    SMTP_MAX_DELAY: int | None = Field(None, ge=0)
    # Optional throttling extensions (applied if provided)
    PER_DOMAIN_LIMITS: dict[str, int] | None = None
    WARMUP_PLAN: dict | None = None
