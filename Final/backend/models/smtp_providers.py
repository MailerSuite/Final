"""
SMTP Provider Configuration Models
Supports AWS SES, SendGrid, Mailgun, Postmark, and other major providers
"""

from datetime import datetime
from enum import Enum
from typing import Any, Optional
from uuid import UUID

from sqlalchemy import JSON, Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from models.base import Base


class SMTPProvider(str, Enum):
    """Supported SMTP providers with their specific configurations"""
    AWS_SES = "aws_ses"
    SENDGRID = "sendgrid"
    MAILGUN = "mailgun"
    POSTMARK = "postmark"
    SPARKPOST = "sparkpost"
    SENDINBLUE = "sendinblue"
    MAILJET = "mailjet"
    ELASTIC_EMAIL = "elastic_email"
    CUSTOM = "custom"


class ProviderLimit(str, Enum):
    """Types of provider limits"""
    HOURLY = "hourly"
    DAILY = "daily"
    MONTHLY = "monthly"
    PER_SECOND = "per_second"
    CONCURRENT = "concurrent"


class SMTPProviderConfig(Base):
    """Provider-specific SMTP configuration with limits and quotas"""
    __tablename__ = "smtp_provider_configs"

    id = Column(String(36), primary_key=True, default=lambda: str(UUID.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    provider = Column(String(50), nullable=False, default=SMTPProvider.CUSTOM)
    name = Column(String(255), nullable=False)
    
    # Provider credentials
    api_key = Column(Text)  # Encrypted
    api_secret = Column(Text)  # Encrypted
    access_key_id = Column(Text)  # For AWS
    secret_access_key = Column(Text)  # For AWS
    region = Column(String(50))  # For AWS/regional providers
    
    # SMTP settings
    smtp_host = Column(String(255), nullable=False)
    smtp_port = Column(Integer, default=587)
    smtp_username = Column(String(255))
    smtp_password = Column(Text)  # Encrypted
    use_tls = Column(Boolean, default=True)
    use_ssl = Column(Boolean, default=False)
    
    # Provider-specific limits
    sending_quota_daily = Column(Integer, default=50000)  # AWS SES default
    sending_quota_hourly = Column(Integer)
    sending_rate_per_second = Column(Float, default=14)  # AWS SES default
    max_concurrent_connections = Column(Integer, default=10)
    max_message_size_mb = Column(Integer, default=10)
    max_recipients_per_message = Column(Integer, default=50)
    
    # Current usage tracking
    daily_sent_count = Column(Integer, default=0)
    hourly_sent_count = Column(Integer, default=0)
    monthly_sent_count = Column(Integer, default=0)
    last_reset_daily = Column(DateTime, default=datetime.utcnow)
    last_reset_hourly = Column(DateTime, default=datetime.utcnow)
    last_reset_monthly = Column(DateTime, default=datetime.utcnow)
    
    # Reputation and health
    reputation_score = Column(Float, default=100.0)
    bounce_rate = Column(Float, default=0.0)
    complaint_rate = Column(Float, default=0.0)
    
    # Provider-specific settings (JSON)
    provider_settings = Column(JSON, default=dict)
    
    # Warmup configuration
    is_warming_up = Column(Boolean, default=False)
    warmup_start_date = Column(DateTime)
    warmup_daily_increment = Column(Integer, default=50)
    warmup_current_limit = Column(Integer)
    
    # Status and monitoring
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    last_health_check = Column(DateTime)
    health_status = Column(String(50), default="healthy")
    error_count = Column(Integer, default=0)
    last_error = Column(Text)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="smtp_providers")
    usage_logs = relationship("SMTPProviderUsageLog", back_populates="provider_config")
    
    def get_current_limit(self, limit_type: ProviderLimit) -> int:
        """Get current sending limit based on provider and limit type"""
        if self.is_warming_up and self.warmup_current_limit:
            return min(self.warmup_current_limit, self._get_base_limit(limit_type))
        return self._get_base_limit(limit_type)
    
    def _get_base_limit(self, limit_type: ProviderLimit) -> int:
        """Get base limit for the provider"""
        limits_map = {
            ProviderLimit.DAILY: self.sending_quota_daily,
            ProviderLimit.HOURLY: self.sending_quota_hourly or (self.sending_quota_daily // 24),
            ProviderLimit.PER_SECOND: int(self.sending_rate_per_second),
            ProviderLimit.CONCURRENT: self.max_concurrent_connections,
        }
        return limits_map.get(limit_type, 0)
    
    def get_remaining_quota(self, limit_type: ProviderLimit) -> int:
        """Calculate remaining quota for the limit type"""
        current_limit = self.get_current_limit(limit_type)
        
        if limit_type == ProviderLimit.DAILY:
            return max(0, current_limit - self.daily_sent_count)
        elif limit_type == ProviderLimit.HOURLY:
            return max(0, current_limit - self.hourly_sent_count)
        elif limit_type == ProviderLimit.MONTHLY:
            monthly_limit = self.sending_quota_daily * 30  # Approximate
            return max(0, monthly_limit - self.monthly_sent_count)
        
        return current_limit
    
    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary with calculated fields"""
        return {
            "id": self.id,
            "provider": self.provider,
            "name": self.name,
            "smtp_host": self.smtp_host,
            "smtp_port": self.smtp_port,
            "is_active": self.is_active,
            "is_verified": self.is_verified,
            "health_status": self.health_status,
            "reputation_score": self.reputation_score,
            "limits": {
                "daily": {
                    "limit": self.get_current_limit(ProviderLimit.DAILY),
                    "used": self.daily_sent_count,
                    "remaining": self.get_remaining_quota(ProviderLimit.DAILY),
                },
                "hourly": {
                    "limit": self.get_current_limit(ProviderLimit.HOURLY),
                    "used": self.hourly_sent_count,
                    "remaining": self.get_remaining_quota(ProviderLimit.HOURLY),
                },
                "per_second": self.sending_rate_per_second,
                "concurrent_connections": self.max_concurrent_connections,
            },
            "warmup": {
                "is_warming_up": self.is_warming_up,
                "current_limit": self.warmup_current_limit,
                "start_date": self.warmup_start_date.isoformat() if self.warmup_start_date else None,
            },
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }


class SMTPProviderUsageLog(Base):
    """Track usage history for provider quota management"""
    __tablename__ = "smtp_provider_usage_logs"
    
    id = Column(String(36), primary_key=True, default=lambda: str(UUID.uuid4()))
    provider_config_id = Column(String(36), ForeignKey("smtp_provider_configs.id"), nullable=False)
    
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    hour_bucket = Column(DateTime, nullable=False)  # Rounded to hour
    day_bucket = Column(DateTime, nullable=False)   # Rounded to day
    
    emails_sent = Column(Integer, default=0)
    emails_bounced = Column(Integer, default=0)
    emails_complained = Column(Integer, default=0)
    
    average_send_time_ms = Column(Float)
    error_count = Column(Integer, default=0)
    
    # Relationships
    provider_config = relationship("SMTPProviderConfig", back_populates="usage_logs")


# Provider-specific default configurations
PROVIDER_DEFAULTS = {
    SMTPProvider.AWS_SES: {
        "smtp_port": 587,
        "use_tls": True,
        "sending_quota_daily": 50000,
        "sending_rate_per_second": 14,
        "max_message_size_mb": 10,
        "max_recipients_per_message": 50,
        "warmup_daily_increment": 50,
    },
    SMTPProvider.SENDGRID: {
        "smtp_host": "smtp.sendgrid.net",
        "smtp_port": 587,
        "use_tls": True,
        "sending_quota_daily": 100000,
        "sending_rate_per_second": 100,
        "max_message_size_mb": 30,
        "max_recipients_per_message": 1000,
        "max_concurrent_connections": 10,
    },
    SMTPProvider.MAILGUN: {
        "smtp_port": 587,
        "use_tls": True,
        "sending_quota_daily": 100000,
        "sending_rate_per_second": 100,
        "max_message_size_mb": 25,
        "max_recipients_per_message": 1000,
        "max_concurrent_connections": 10,
    },
    SMTPProvider.POSTMARK: {
        "smtp_host": "smtp.postmarkapp.com",
        "smtp_port": 587,
        "use_tls": True,
        "sending_quota_daily": 10000,
        "sending_rate_per_second": 10,
        "max_message_size_mb": 10,
        "max_recipients_per_message": 50,
    },
    SMTPProvider.SPARKPOST: {
        "smtp_host": "smtp.sparkpostmail.com",
        "smtp_port": 587,
        "use_tls": True,
        "sending_quota_daily": 100000,
        "sending_rate_per_second": 100,
        "max_message_size_mb": 20,
        "max_recipients_per_message": 10000,
    },
}


def get_provider_defaults(provider: SMTPProvider) -> dict[str, Any]:
    """Get default configuration for a provider"""
    return PROVIDER_DEFAULTS.get(provider, {})
