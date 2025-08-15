"""
SMTP Provider Service
Manages provider-specific configurations, rate limiting, and quota enforcement
"""

import asyncio
from datetime import datetime, timedelta
from typing import Any, Optional
from uuid import UUID

from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from core.logger import get_logger
from models.smtp_providers import (
    ProviderLimit,
    SMTPProvider,
    SMTPProviderConfig,
    SMTPProviderUsageLog,
    get_provider_defaults,
)
from services.encryption_service import EncryptionService

logger = get_logger(__name__)


class RateLimiter:
    """Token bucket rate limiter for per-second rate limiting"""
    
    def __init__(self, rate: float, burst: Optional[int] = None):
        self.rate = rate
        self.burst = burst or int(rate)
        self.tokens = float(self.burst)
        self.last_update = asyncio.get_event_loop().time()
        self._lock = asyncio.Lock()
    
    async def acquire(self, tokens: int = 1) -> bool:
        """Acquire tokens from the bucket"""
        async with self._lock:
            now = asyncio.get_event_loop().time()
            elapsed = now - self.last_update
            self.last_update = now
            
            # Add tokens based on elapsed time
            self.tokens = min(self.burst, self.tokens + elapsed * self.rate)
            
            if self.tokens >= tokens:
                self.tokens -= tokens
                return True
            return False
    
    async def wait_and_acquire(self, tokens: int = 1) -> None:
        """Wait until tokens are available and acquire them"""
        while not await self.acquire(tokens):
            wait_time = (tokens - self.tokens) / self.rate
            await asyncio.sleep(wait_time)


class SMTPProviderService:
    """Service for managing SMTP provider configurations and quotas"""
    
    def __init__(self, db_session: AsyncSession):
        self.db = db_session
        self.encryption = EncryptionService()
        self._rate_limiters = {}
        self._quota_cache = {}
        self._cache_ttl = 60  # Cache TTL in seconds
    
    async def create_provider_config(
        self,
        user_id: str,
        provider: SMTPProvider,
        name: str,
        credentials: dict[str, str],
        custom_limits: Optional[dict[str, Any]] = None,
    ) -> SMTPProviderConfig:
        """Create a new provider configuration"""
        
        # Get provider defaults
        defaults = get_provider_defaults(provider)
        
        # Create config
        config = SMTPProviderConfig(
            user_id=user_id,
            provider=provider,
            name=name,
            **defaults,
        )
        
        # Set credentials based on provider
        if provider == SMTPProvider.AWS_SES:
            config.access_key_id = self.encryption.encrypt(credentials.get("access_key_id", ""))
            config.secret_access_key = self.encryption.encrypt(credentials.get("secret_access_key", ""))
            config.region = credentials.get("region", "us-east-1")
            config.smtp_host = f"email-smtp.{config.region}.amazonaws.com"
            config.smtp_username = credentials.get("access_key_id", "")
            config.smtp_password = self.encryption.encrypt(
                self._generate_aws_smtp_password(
                    credentials.get("secret_access_key", ""),
                    config.region
                )
            )
        
        elif provider == SMTPProvider.SENDGRID:
            config.api_key = self.encryption.encrypt(credentials.get("api_key", ""))
            config.smtp_username = "apikey"
            config.smtp_password = self.encryption.encrypt(credentials.get("api_key", ""))
        
        elif provider == SMTPProvider.MAILGUN:
            config.api_key = self.encryption.encrypt(credentials.get("api_key", ""))
            config.smtp_host = f"smtp.{credentials.get('domain', 'mailgun.org')}"
            config.smtp_username = credentials.get("smtp_username", "")
            config.smtp_password = self.encryption.encrypt(credentials.get("smtp_password", ""))
        
        else:
            # Custom provider
            config.smtp_host = credentials.get("smtp_host", "")
            config.smtp_port = int(credentials.get("smtp_port", 587))
            config.smtp_username = credentials.get("smtp_username", "")
            config.smtp_password = self.encryption.encrypt(credentials.get("smtp_password", ""))
        
        # Apply custom limits if provided
        if custom_limits:
            for key, value in custom_limits.items():
                if hasattr(config, key):
                    setattr(config, key, value)
        
        self.db.add(config)
        await self.db.commit()
        await self.db.refresh(config)
        
        logger.info(f"Created {provider} configuration '{name}' for user {user_id}")
        return config
    
    async def get_provider_configs(
        self,
        user_id: str,
        provider: Optional[SMTPProvider] = None,
        active_only: bool = True,
    ) -> list[SMTPProviderConfig]:
        """Get provider configurations for a user"""
        query = select(SMTPProviderConfig).where(
            SMTPProviderConfig.user_id == user_id
        )
        
        if provider:
            query = query.where(SMTPProviderConfig.provider == provider)
        
        if active_only:
            query = query.where(SMTPProviderConfig.is_active == True)
        
        result = await self.db.execute(query)
        return list(result.scalars().all())
    
    async def check_quota(
        self,
        config_id: str,
        emails_to_send: int = 1,
    ) -> dict[str, Any]:
        """Check if sending is allowed within quota limits"""
        
        # Check cache first
        cache_key = f"quota_{config_id}"
        if cache_key in self._quota_cache:
            cached = self._quota_cache[cache_key]
            if datetime.utcnow() < cached["expires"]:
                return cached["data"]
        
        # Get config
        config = await self.db.get(SMTPProviderConfig, config_id)
        if not config:
            return {"allowed": False, "reason": "Configuration not found"}
        
        if not config.is_active:
            return {"allowed": False, "reason": "Configuration is inactive"}
        
        # Reset counters if needed
        await self._reset_counters_if_needed(config)
        
        # Check limits
        checks = {
            "daily": config.get_remaining_quota(ProviderLimit.DAILY) >= emails_to_send,
            "hourly": config.get_remaining_quota(ProviderLimit.HOURLY) >= emails_to_send,
        }
        
        allowed = all(checks.values())
        
        result = {
            "allowed": allowed,
            "checks": checks,
            "quotas": {
                "daily": {
                    "limit": config.get_current_limit(ProviderLimit.DAILY),
                    "used": config.daily_sent_count,
                    "remaining": config.get_remaining_quota(ProviderLimit.DAILY),
                },
                "hourly": {
                    "limit": config.get_current_limit(ProviderLimit.HOURLY),
                    "used": config.hourly_sent_count,
                    "remaining": config.get_remaining_quota(ProviderLimit.HOURLY),
                },
                "per_second": config.sending_rate_per_second,
            },
        }
        
        # Cache result
        self._quota_cache[cache_key] = {
            "data": result,
            "expires": datetime.utcnow() + timedelta(seconds=self._cache_ttl),
        }
        
        return result
    
    async def acquire_send_tokens(
        self,
        config_id: str,
        emails: int = 1,
        wait: bool = True,
    ) -> bool:
        """Acquire tokens for sending (rate limiting)"""
        
        # Get or create rate limiter
        if config_id not in self._rate_limiters:
            config = await self.db.get(SMTPProviderConfig, config_id)
            if not config:
                return False
            
            self._rate_limiters[config_id] = RateLimiter(
                rate=config.sending_rate_per_second,
                burst=int(config.sending_rate_per_second * 2),
            )
        
        limiter = self._rate_limiters[config_id]
        
        if wait:
            await limiter.wait_and_acquire(emails)
            return True
        else:
            return await limiter.acquire(emails)
    
    async def record_usage(
        self,
        config_id: str,
        emails_sent: int = 0,
        emails_bounced: int = 0,
        emails_complained: int = 0,
        send_time_ms: Optional[float] = None,
        error: Optional[str] = None,
    ) -> None:
        """Record usage for quota tracking"""
        
        config = await self.db.get(SMTPProviderConfig, config_id)
        if not config:
            return
        
        # Update counters
        config.daily_sent_count += emails_sent
        config.hourly_sent_count += emails_sent
        config.monthly_sent_count += emails_sent
        
        if error:
            config.error_count += 1
            config.last_error = error[:500]  # Truncate error message
        
        # Update rates
        if emails_sent > 0:
            total_sent = config.daily_sent_count or 1
            config.bounce_rate = (
                (config.bounce_rate * (total_sent - emails_sent) + emails_bounced) 
                / total_sent
            )
            config.complaint_rate = (
                (config.complaint_rate * (total_sent - emails_sent) + emails_complained)
                / total_sent
            )
        
        # Create usage log
        now = datetime.utcnow()
        usage_log = SMTPProviderUsageLog(
            provider_config_id=config_id,
            timestamp=now,
            hour_bucket=now.replace(minute=0, second=0, microsecond=0),
            day_bucket=now.replace(hour=0, minute=0, second=0, microsecond=0),
            emails_sent=emails_sent,
            emails_bounced=emails_bounced,
            emails_complained=emails_complained,
            average_send_time_ms=send_time_ms,
            error_count=1 if error else 0,
        )
        
        self.db.add(usage_log)
        
        # Clear quota cache
        cache_key = f"quota_{config_id}"
        if cache_key in self._quota_cache:
            del self._quota_cache[cache_key]
        
        await self.db.commit()
    
    async def update_warmup_status(
        self,
        config_id: str,
    ) -> None:
        """Update warmup limits if in warmup mode"""
        
        config = await self.db.get(SMTPProviderConfig, config_id)
        if not config or not config.is_warming_up:
            return
        
        if not config.warmup_start_date:
            config.warmup_start_date = datetime.utcnow()
            config.warmup_current_limit = config.warmup_daily_increment
        else:
            days_elapsed = (datetime.utcnow() - config.warmup_start_date).days
            new_limit = min(
                config.warmup_daily_increment * (days_elapsed + 1),
                config.sending_quota_daily,
            )
            
            if new_limit >= config.sending_quota_daily:
                # Warmup complete
                config.is_warming_up = False
                config.warmup_current_limit = None
                logger.info(f"Warmup completed for config {config_id}")
            else:
                config.warmup_current_limit = new_limit
        
        await self.db.commit()
    
    async def get_best_provider_for_bulk(
        self,
        user_id: str,
        emails_count: int,
        prefer_provider: Optional[SMTPProvider] = None,
    ) -> Optional[SMTPProviderConfig]:
        """Get the best provider configuration for bulk sending"""
        
        configs = await self.get_provider_configs(user_id, active_only=True)
        
        if not configs:
            return None
        
        # Filter by quota availability
        available_configs = []
        for config in configs:
            quota_check = await self.check_quota(config.id, emails_count)
            if quota_check["allowed"]:
                available_configs.append(config)
        
        if not available_configs:
            return None
        
        # Sort by criteria
        def score_config(c: SMTPProviderConfig) -> float:
            score = 0.0
            
            # Prefer requested provider
            if prefer_provider and c.provider == prefer_provider:
                score += 100
            
            # Higher reputation is better
            score += c.reputation_score
            
            # Lower error rate is better
            score -= c.error_count * 0.1
            
            # Higher rate limit is better
            score += c.sending_rate_per_second
            
            # More remaining quota is better
            score += c.get_remaining_quota(ProviderLimit.DAILY) / 1000
            
            return score
        
        available_configs.sort(key=score_config, reverse=True)
        return available_configs[0]
    
    async def _reset_counters_if_needed(self, config: SMTPProviderConfig) -> None:
        """Reset usage counters if time period has elapsed"""
        
        now = datetime.utcnow()
        
        # Reset hourly counter
        if now - config.last_reset_hourly >= timedelta(hours=1):
            config.hourly_sent_count = 0
            config.last_reset_hourly = now.replace(minute=0, second=0, microsecond=0)
        
        # Reset daily counter
        if now - config.last_reset_daily >= timedelta(days=1):
            config.daily_sent_count = 0
            config.last_reset_daily = now.replace(hour=0, minute=0, second=0, microsecond=0)
            
            # Update warmup if needed
            await self.update_warmup_status(config.id)
        
        # Reset monthly counter
        if now.month != config.last_reset_monthly.month:
            config.monthly_sent_count = 0
            config.last_reset_monthly = now.replace(
                day=1, hour=0, minute=0, second=0, microsecond=0
            )
    
    def _generate_aws_smtp_password(self, secret_key: str, region: str) -> str:
        """Generate AWS SMTP password from IAM credentials"""
        import hashlib
        import hmac
        import base64
        
        message = "SendRawEmail"
        version = b"\x04"
        
        signature = hmac.new(
            (f"AWS4{secret_key}").encode("utf-8"),
            message.encode("utf-8"),
            hashlib.sha256,
        ).digest()
        
        signature_and_version = version + signature
        smtp_password = base64.b64encode(signature_and_version).decode("utf-8")
        
        return smtp_password