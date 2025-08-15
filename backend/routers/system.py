from fastapi import APIRouter

from config.settings import get_settings
from schemas.common import FirewallStatusResponse

router = APIRouter()


@router.get(
    "/system/firewall-status",
    response_model=FirewallStatusResponse,
    summary="Get firewall status",
    description="Return current firewall status and configuration.",
)
async def firewall_status() -> FirewallStatusResponse:
    """Return current firewall status and configuration."""
    settings = get_settings()
    label = "ON" if settings.FIREWALL_ENABLED else "OFF"
    return FirewallStatusResponse(
        enabled=settings.FIREWALL_ENABLED, label=label
    )
