"""
SMTP Provider Configuration API Routes
"""

from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from core.auth import get_current_user
from core.database import get_db
from core.logger import get_logger
from models.smtp_providers import SMTPProvider, SMTPProviderConfig
from models.user import User
from schemas.smtp_providers import (
    ProviderConfigCreate,
    ProviderConfigResponse,
    ProviderConfigUpdate,
    ProviderQuotaResponse,
    ProviderUsageStats,
)
from services.smtp_provider_service import SMTPProviderService

logger = get_logger(__name__)
router = APIRouter(prefix="/api/smtp-providers", tags=["SMTP Providers"])


@router.get("/available", response_model=list[dict[str, str]])
async def get_available_providers():
    """Get list of available SMTP providers"""
    return [
        {
            "value": provider.value,
            "label": provider.value.replace("_", " ").title(),
            "description": _get_provider_description(provider),
        }
        for provider in SMTPProvider
    ]


@router.post("/configs", response_model=ProviderConfigResponse)
async def create_provider_config(
    config_data: ProviderConfigCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new SMTP provider configuration"""
    service = SMTPProviderService(db)
    
    try:
        config = await service.create_provider_config(
            user_id=current_user.id,
            provider=config_data.provider,
            name=config_data.name,
            credentials=config_data.credentials,
            custom_limits=config_data.custom_limits,
        )
        
        return ProviderConfigResponse.from_orm(config)
    except Exception as e:
        logger.error(f"Failed to create provider config: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/configs", response_model=list[ProviderConfigResponse])
async def get_provider_configs(
    provider: Optional[SMTPProvider] = Query(None),
    active_only: bool = Query(True),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get user's SMTP provider configurations"""
    service = SMTPProviderService(db)
    
    configs = await service.get_provider_configs(
        user_id=current_user.id,
        provider=provider,
        active_only=active_only,
    )
    
    return [ProviderConfigResponse.from_orm(config) for config in configs]


@router.get("/configs/{config_id}", response_model=ProviderConfigResponse)
async def get_provider_config(
    config_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific provider configuration"""
    config = await db.get(SMTPProviderConfig, config_id)
    
    if not config:
        raise HTTPException(status_code=404, detail="Configuration not found")
    
    if config.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return ProviderConfigResponse.from_orm(config)


@router.put("/configs/{config_id}", response_model=ProviderConfigResponse)
async def update_provider_config(
    config_id: str,
    update_data: ProviderConfigUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a provider configuration"""
    config = await db.get(SMTPProviderConfig, config_id)
    
    if not config:
        raise HTTPException(status_code=404, detail="Configuration not found")
    
    if config.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Update fields
    update_dict = update_data.dict(exclude_unset=True)
    for field, value in update_dict.items():
        if hasattr(config, field):
            setattr(config, field, value)
    
    await db.commit()
    await db.refresh(config)
    
    return ProviderConfigResponse.from_orm(config)


@router.delete("/configs/{config_id}")
async def delete_provider_config(
    config_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a provider configuration"""
    config = await db.get(SMTPProviderConfig, config_id)
    
    if not config:
        raise HTTPException(status_code=404, detail="Configuration not found")
    
    if config.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    await db.delete(config)
    await db.commit()
    
    return {"message": "Configuration deleted successfully"}


@router.get("/configs/{config_id}/quota", response_model=ProviderQuotaResponse)
async def check_provider_quota(
    config_id: str,
    emails_to_send: int = Query(1, ge=1),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Check quota availability for a provider configuration"""
    config = await db.get(SMTPProviderConfig, config_id)
    
    if not config:
        raise HTTPException(status_code=404, detail="Configuration not found")
    
    if config.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    service = SMTPProviderService(db)
    quota_check = await service.check_quota(config_id, emails_to_send)
    
    return ProviderQuotaResponse(**quota_check)


@router.get("/configs/{config_id}/usage", response_model=ProviderUsageStats)
async def get_provider_usage_stats(
    config_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get usage statistics for a provider configuration"""
    config = await db.get(SMTPProviderConfig, config_id)
    
    if not config:
        raise HTTPException(status_code=404, detail="Configuration not found")
    
    if config.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get usage logs from the last 24 hours
    from datetime import datetime, timedelta
    from sqlalchemy import select
    from models.smtp_providers import SMTPProviderUsageLog
    
    since = datetime.utcnow() - timedelta(hours=24)
    
    query = select(SMTPProviderUsageLog).where(
        SMTPProviderUsageLog.provider_config_id == config_id,
        SMTPProviderUsageLog.timestamp >= since,
    )
    
    result = await db.execute(query)
    usage_logs = result.scalars().all()
    
    # Calculate statistics
    total_sent = sum(log.emails_sent for log in usage_logs)
    total_bounced = sum(log.emails_bounced for log in usage_logs)
    total_complained = sum(log.emails_complained for log in usage_logs)
    total_errors = sum(log.error_count for log in usage_logs)
    
    avg_send_time = None
    send_times = [log.average_send_time_ms for log in usage_logs if log.average_send_time_ms]
    if send_times:
        avg_send_time = sum(send_times) / len(send_times)
    
    return ProviderUsageStats(
        config_id=config_id,
        provider=config.provider,
        name=config.name,
        period_hours=24,
        total_sent=total_sent,
        total_bounced=total_bounced,
        total_complained=total_complained,
        total_errors=total_errors,
        bounce_rate=config.bounce_rate,
        complaint_rate=config.complaint_rate,
        average_send_time_ms=avg_send_time,
        reputation_score=config.reputation_score,
        health_status=config.health_status,
    )


@router.post("/configs/{config_id}/test")
async def test_provider_config(
    config_id: str,
    test_email: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Test a provider configuration by sending a test email"""
    config = await db.get(SMTPProviderConfig, config_id)
    
    if not config:
        raise HTTPException(status_code=404, detail="Configuration not found")
    
    if config.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # TODO: Implement test email sending
    # For now, return a mock response
    return {
        "success": True,
        "message": f"Test email would be sent to {test_email}",
        "provider": config.provider,
        "config_name": config.name,
    }


@router.post("/configs/{config_id}/warmup/start")
async def start_warmup(
    config_id: str,
    daily_increment: int = Query(50, ge=10, le=1000),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Start warmup process for a provider configuration"""
    config = await db.get(SMTPProviderConfig, config_id)
    
    if not config:
        raise HTTPException(status_code=404, detail="Configuration not found")
    
    if config.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    if config.is_warming_up:
        raise HTTPException(status_code=400, detail="Warmup already in progress")
    
    config.is_warming_up = True
    config.warmup_daily_increment = daily_increment
    config.warmup_start_date = datetime.utcnow()
    config.warmup_current_limit = daily_increment
    
    await db.commit()
    
    return {
        "message": "Warmup started successfully",
        "daily_increment": daily_increment,
        "current_limit": daily_increment,
    }


@router.post("/configs/{config_id}/warmup/stop")
async def stop_warmup(
    config_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Stop warmup process for a provider configuration"""
    config = await db.get(SMTPProviderConfig, config_id)
    
    if not config:
        raise HTTPException(status_code=404, detail="Configuration not found")
    
    if config.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    if not config.is_warming_up:
        raise HTTPException(status_code=400, detail="No warmup in progress")
    
    config.is_warming_up = False
    config.warmup_current_limit = None
    
    await db.commit()
    
    return {"message": "Warmup stopped successfully"}


def _get_provider_description(provider: SMTPProvider) -> str:
    """Get description for a provider"""
    descriptions = {
        SMTPProvider.AWS_SES: "Amazon Simple Email Service - Reliable and scalable",
        SMTPProvider.SENDGRID: "SendGrid - Developer-friendly email platform",
        SMTPProvider.MAILGUN: "Mailgun - Powerful APIs for developers",
        SMTPProvider.POSTMARK: "Postmark - Fast and reliable transactional email",
        SMTPProvider.SPARKPOST: "SparkPost - Email delivery and analytics",
        SMTPProvider.SENDINBLUE: "Sendinblue - All-in-one marketing platform",
        SMTPProvider.MAILJET: "Mailjet - Email delivery service",
        SMTPProvider.ELASTIC_EMAIL: "Elastic Email - Email delivery platform",
        SMTPProvider.CUSTOM: "Custom SMTP server configuration",
    }
    return descriptions.get(provider, "Email service provider")