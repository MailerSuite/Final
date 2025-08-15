from fastapi import APIRouter, Depends, HTTPException, status

from config.settings import get_settings
from core.config import update_smtp_settings
from routers.auth import get_current_user
from schemas.smtp_settings import SMTPSettingsResponse, SMTPSettingsUpdate

router = APIRouter()


def verify_admin(current_user: dict | None) -> None:
    """Ensure the authenticated user has admin privileges."""
    if current_user is None:
        raise HTTPException(status_code=400, detail="Missing user data")
    if not current_user.get("is_admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )


@router.get(
    "/settings",
    response_model=SMTPSettingsResponse,
    summary="Get SMTP settings",
)
async def read_smtp_settings() -> SMTPSettingsResponse:
    """Return current SMTP operational settings."""
    settings = get_settings()
    return SMTPSettingsResponse(
        SMTP_DEFAULT_TIMEOUT=settings.SMTP_DEFAULT_TIMEOUT,
        SMTP_RATE_LIMIT_PER_HOUR=settings.SMTP_RATE_LIMIT_PER_HOUR,
        SMTP_MAX_RETRIES=settings.SMTP_MAX_RETRIES,
        SMTP_MAX_DELAY=settings.SMTP_MAX_DELAY,
        PER_DOMAIN_LIMITS=getattr(settings, "PER_DOMAIN_LIMITS", None),
        WARMUP_PLAN=getattr(settings, "WARMUP_PLAN", None),
    )


@router.put(
    "/settings",
    response_model=SMTPSettingsResponse,
    summary="Update SMTP settings",
)
async def update_smtp_settings_endpoint(
    payload: SMTPSettingsUpdate, current_user=Depends(get_current_user)
) -> SMTPSettingsResponse:
    """Update SMTP operational settings."""
    verify_admin(current_user)
    updates: dict[str, int] = {}
    if payload.SMTP_DEFAULT_TIMEOUT is not None:
        if payload.SMTP_DEFAULT_TIMEOUT <= 0:
            raise HTTPException(
                status_code=400, detail="SMTP_DEFAULT_TIMEOUT must be positive"
            )
        updates["SMTP_DEFAULT_TIMEOUT"] = payload.SMTP_DEFAULT_TIMEOUT
    if payload.SMTP_RATE_LIMIT_PER_HOUR is not None:
        if payload.SMTP_RATE_LIMIT_PER_HOUR <= 0:
            raise HTTPException(
                status_code=400,
                detail="SMTP_RATE_LIMIT_PER_HOUR must be positive",
            )
        updates["SMTP_RATE_LIMIT_PER_HOUR"] = payload.SMTP_RATE_LIMIT_PER_HOUR
    if payload.SMTP_MAX_RETRIES is not None:
        if payload.SMTP_MAX_RETRIES < 0:
            raise HTTPException(
                status_code=400, detail="SMTP_MAX_RETRIES must be non-negative"
            )
        updates["SMTP_MAX_RETRIES"] = payload.SMTP_MAX_RETRIES
    if payload.SMTP_MAX_DELAY is not None:
        if payload.SMTP_MAX_DELAY < 0:
            raise HTTPException(
                status_code=400, detail="SMTP_MAX_DELAY must be non-negative"
            )
        updates["SMTP_MAX_DELAY"] = payload.SMTP_MAX_DELAY
    # Optional throttle extensions
    if payload.PER_DOMAIN_LIMITS is not None:
        updates["PER_DOMAIN_LIMITS"] = payload.PER_DOMAIN_LIMITS
    if payload.WARMUP_PLAN is not None:
        updates["WARMUP_PLAN"] = payload.WARMUP_PLAN
    if updates:
        update_smtp_settings(updates)
    else:
        raise HTTPException(status_code=400, detail="No settings provided")
    settings = get_settings()
    return SMTPSettingsResponse(
        SMTP_DEFAULT_TIMEOUT=settings.SMTP_DEFAULT_TIMEOUT,
        SMTP_RATE_LIMIT_PER_HOUR=settings.SMTP_RATE_LIMIT_PER_HOUR,
        SMTP_MAX_RETRIES=settings.SMTP_MAX_RETRIES,
        SMTP_MAX_DELAY=settings.SMTP_MAX_DELAY,
        PER_DOMAIN_LIMITS=getattr(settings, "PER_DOMAIN_LIMITS", None),
        WARMUP_PLAN=getattr(settings, "WARMUP_PLAN", None),
    )
