"""
Trial Plan API Routes
Handles trial plan purchase, management, extension, and monitoring
"""

import logging
from datetime import datetime

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from models.plan import TrialConfiguration
from routers.auth import get_current_user
from services.trial_service import TrialService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/trial", tags=["Plans"])


# Pydantic models for request/response
class TrialPurchaseResponse(BaseModel):
    plan_name: str
    expires_at: str
    status: str
    trial_duration_minutes: int
    max_threads: int
    max_extensions: int


class TrialUsageResponse(BaseModel):
    is_active: bool
    time_remaining_minutes: int
    threads_used: int
    campaigns_sent: int
    extensions_used: int
    extensions_remaining: int
    can_extend: bool
    expires_at: str


class TrialExtensionResponse(BaseModel):
    plan_name: str
    expires_at: str
    status: str
    extension_minutes: int
    extensions_remaining: int


class TrialActivationRequest(BaseModel):
    pass


class TrialExtensionRequest(BaseModel):
    pass


class TrialUsageUpdateRequest(BaseModel):
    threads_used: int | None = None
    campaigns_sent: int | None = None


class TrialConfigurationRequest(BaseModel):
    config_name: str
    is_active: bool = True
    duration_minutes: int = 60
    min_threads: int = 2
    max_threads: int = 5
    max_campaigns: int = 2
    price_usd: float = 1.0
    price_btc: str = "0.00002"
    max_extensions: int = 2
    extension_minutes: int = 30
    extension_price_usd: float = 0.5
    allowed_features: list[str] = []


def get_trial_service(db: AsyncSession = Depends(get_db)) -> TrialService:
    """Dependency to get trial service instance"""
    return TrialService(db)


@router.get("/availability")
async def check_trial_availability(
    current_user: dict = Depends(get_current_user),
    trial_service: TrialService = Depends(get_trial_service),
):
    """Check if user can purchase a trial plan"""
    try:
        user_id = current_user.get("id")
        if not user_id:
            raise HTTPException(
                status_code=401, detail="User not authenticated"
            )

        # Check if user has already used trial
        has_used_trial = await trial_service.has_user_used_trial(user_id)
        active_trial = await trial_service.get_user_active_trial(user_id)

        return {
            "can_purchase_trial": not has_used_trial,
            "has_active_trial": active_trial is not None,
            "has_used_trial": has_used_trial,
            "message": "Trial available"
            if not has_used_trial
            else "Trial already used",
        }
    except Exception as e:
        logger.error(f"Error checking trial availability: {e}")
        raise HTTPException(
            status_code=500, detail="Failed to check trial availability"
        )


@router.post("/purchase", response_model=TrialPurchaseResponse)
async def purchase_trial(
    current_user: dict = Depends(get_current_user),
    trial_service: TrialService = Depends(get_trial_service),
):
    """Create payment request for trial plan"""
    try:
        user_id = current_user.get("id")
        if not user_id:
            raise HTTPException(
                status_code=401, detail="User not authenticated"
            )

        # Directly grant trial (payments removed)
        data = await trial_service.create_trial_payment_request(user_id)
        return TrialPurchaseResponse(**data)

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating trial payment request: {e}")
        raise HTTPException(
            status_code=500, detail="Failed to create trial payment request"
        )


@router.post("/activate")
async def activate_trial(
    activation_request: TrialActivationRequest,
    current_user: dict = Depends(get_current_user),
    trial_service: TrialService = Depends(get_trial_service),
):
    """Activate trial after payment confirmation"""
    try:
        user_id = current_user.get("id")
        if not user_id:
            raise HTTPException(
                status_code=401, detail="User not authenticated"
            )

        trial = await trial_service.activate_trial_after_payment(None, user_id)

        return {
            "message": "Trial activated successfully",
            "trial_id": trial.id,
            "expires_at": trial.expires_at.isoformat(),
            "duration_minutes": trial.time_remaining_minutes,
        }

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error activating trial: {e}")
        raise HTTPException(status_code=500, detail="Failed to activate trial")


@router.get("/status", response_model=TrialUsageResponse)
async def get_trial_status(
    current_user: dict = Depends(get_current_user),
    trial_service: TrialService = Depends(get_trial_service),
):
    """Get current trial status and usage"""
    try:
        user_id = current_user.get("id")
        if not user_id:
            raise HTTPException(
                status_code=401, detail="User not authenticated"
            )

        usage_stats = await trial_service.get_trial_usage_stats(user_id)

        if "error" in usage_stats:
            raise HTTPException(status_code=404, detail=usage_stats["error"])

        return TrialUsageResponse(**usage_stats)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting trial status: {e}")
        raise HTTPException(
            status_code=500, detail="Failed to get trial status"
        )


@router.post("/extend/preview", response_model=TrialExtensionResponse)
async def preview_extension(
    current_user: dict = Depends(get_current_user),
    trial_service: TrialService = Depends(get_trial_service),
):
    """Preview trial extension details (no payment)."""
    try:
        user_id = current_user.get("id")
        if not user_id:
            raise HTTPException(
                status_code=401, detail="User not authenticated"
            )

        data = await trial_service.create_extension_payment_request(user_id)
        return TrialExtensionResponse(**data)

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error generating extension preview: {e}")
        raise HTTPException(
            status_code=500, detail="Failed to generate extension preview"
        )


@router.post("/extend")
async def extend_trial(
    extension_request: TrialExtensionRequest,
    current_user: dict = Depends(get_current_user),
    trial_service: TrialService = Depends(get_trial_service),
):
    """Extend trial after payment confirmation"""
    try:
        user_id = current_user.get("id")
        if not user_id:
            raise HTTPException(
                status_code=401, detail="User not authenticated"
            )

        trial = await trial_service.extend_trial(user_id, None)

        return {
            "message": "Trial extended successfully",
            "new_expires_at": trial.expires_at.isoformat(),
            "extensions_used": trial.extensions_used,
            "extensions_remaining": trial.max_extensions_allowed
            - trial.extensions_used,
            "time_remaining_minutes": trial.time_remaining_minutes,
        }

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error extending trial: {e}")
        raise HTTPException(status_code=500, detail="Failed to extend trial")


@router.put("/usage")
async def update_trial_usage(
    usage_update: TrialUsageUpdateRequest,
    current_user: dict = Depends(get_current_user),
    trial_service: TrialService = Depends(get_trial_service),
):
    """Update trial usage statistics"""
    try:
        user_id = current_user.get("id")
        if not user_id:
            raise HTTPException(
                status_code=401, detail="User not authenticated"
            )

        success = await trial_service.update_trial_usage(
            user_id, usage_update.threads_used, usage_update.campaigns_sent
        )

        if not success:
            raise HTTPException(
                status_code=404, detail="No active trial found"
            )

        return {"message": "Usage updated successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating trial usage: {e}")
        raise HTTPException(
            status_code=500, detail="Failed to update trial usage"
        )


@router.post("/expire-check")
async def manual_expire_check(
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
    trial_service: TrialService = Depends(get_trial_service),
):
    """Manually trigger trial expiration check (admin only)"""
    try:
        # Check if user is admin
        if not current_user.get("is_admin"):
            raise HTTPException(
                status_code=403, detail="Admin access required"
            )

        # Run expiration check in background
        background_tasks.add_task(trial_service.check_and_expire_trials)

        return {"message": "Trial expiration check initiated"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error triggering trial expiration check: {e}")
        raise HTTPException(
            status_code=500, detail="Failed to trigger expiration check"
        )


# Admin endpoints for trial configuration
@router.get("/admin/configurations")
async def list_trial_configurations(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Admin endpoint to list trial configurations"""
    try:
        if not current_user.get("is_admin"):
            raise HTTPException(
                status_code=403, detail="Admin access required"
            )

        result = await db.execute(
            select(TrialConfiguration).order_by(
                TrialConfiguration.created_at.desc()
            )
        )
        configs = result.scalars().all()

        return {
            "configurations": [
                {
                    "id": config.id,
                    "config_name": config.config_name,
                    "is_active": config.is_active,
                    "duration_minutes": config.duration_minutes,
                    "min_threads": config.min_threads,
                    "max_threads": config.max_threads,
                    "price_usd": config.price_usd,
                    "price_btc": config.price_btc,
                    "max_extensions": config.max_extensions,
                    "extension_minutes": config.extension_minutes,
                    "extension_price_usd": config.extension_price_usd,
                    "allowed_features": config.allowed_features,
                    "created_at": config.created_at.isoformat(),
                }
                for config in configs
            ]
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listing trial configurations: {e}")
        raise HTTPException(
            status_code=500, detail="Failed to list configurations"
        )


@router.post("/admin/configurations")
async def create_trial_configuration(
    config_request: TrialConfigurationRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Admin endpoint to create trial configuration"""
    try:
        if not current_user.get("is_admin"):
            raise HTTPException(
                status_code=403, detail="Admin access required"
            )

        # Create new configuration
        new_config = TrialConfiguration(
            config_name=config_request.config_name,
            is_active=config_request.is_active,
            duration_minutes=config_request.duration_minutes,
            min_threads=config_request.min_threads,
            max_threads=config_request.max_threads,
            max_campaigns=config_request.max_campaigns,
            price_usd=config_request.price_usd,
            price_btc=config_request.price_btc,
            max_extensions=config_request.max_extensions,
            extension_minutes=config_request.extension_minutes,
            extension_price_usd=config_request.extension_price_usd,
            allowed_features=config_request.allowed_features,
            created_by_admin_id=current_user.get("id"),
        )

        db.add(new_config)
        await db.commit()
        await db.refresh(new_config)

        return {
            "message": "Configuration created successfully",
            "config_id": new_config.id,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating trial configuration: {e}")
        raise HTTPException(
            status_code=500, detail="Failed to create configuration"
        )


@router.put("/admin/configurations/{config_id}")
async def update_trial_configuration(
    config_id: int,
    config_request: TrialConfigurationRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Admin endpoint to update trial configuration"""
    try:
        if not current_user.get("is_admin"):
            raise HTTPException(
                status_code=403, detail="Admin access required"
            )

        # Update configuration
        result = await db.execute(
            update(TrialConfiguration)
            .where(TrialConfiguration.id == config_id)
            .values(
                config_name=config_request.config_name,
                is_active=config_request.is_active,
                duration_minutes=config_request.duration_minutes,
                min_threads=config_request.min_threads,
                max_threads=config_request.max_threads,
                max_campaigns=config_request.max_campaigns,
                price_usd=config_request.price_usd,
                price_btc=config_request.price_btc,
                max_extensions=config_request.max_extensions,
                extension_minutes=config_request.extension_minutes,
                extension_price_usd=config_request.extension_price_usd,
                allowed_features=config_request.allowed_features,
                updated_at=datetime.utcnow(),
            )
        )

        if result.rowcount == 0:
            raise HTTPException(
                status_code=404, detail="Configuration not found"
            )

        await db.commit()

        return {"message": "Configuration updated successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating trial configuration: {e}")
        raise HTTPException(
            status_code=500, detail="Failed to update configuration"
        )


@router.delete("/admin/configurations/{config_id}")
async def delete_trial_configuration(
    config_id: int,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Admin endpoint to delete trial configuration"""
    try:
        if not current_user.get("is_admin"):
            raise HTTPException(
                status_code=403, detail="Admin access required"
            )

        # Check if configuration exists
        result = await db.execute(
            select(TrialConfiguration).where(
                TrialConfiguration.id == config_id
            )
        )
        config = result.scalar_one_or_none()

        if not config:
            raise HTTPException(
                status_code=404, detail="Configuration not found"
            )

        # Delete configuration
        await db.delete(config)
        await db.commit()

        return {"message": "Configuration deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting trial configuration: {e}")
        raise HTTPException(
            status_code=500, detail="Failed to delete configuration"
        )
