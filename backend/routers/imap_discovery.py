from fastapi import APIRouter, HTTPException

from core.logger import get_logger
from schemas.discovery import HostDiscoveryRequest, HostDiscoveryResponse
from services.hostname_discovery import HostnameDiscoveryService

router = APIRouter()
logger = get_logger(__name__)


@router.post("/imap-hosts", response_model=HostDiscoveryResponse)
async def discover_imap_hosts(payload: HostDiscoveryRequest):
    service = HostnameDiscoveryService()
    try:
        return await service.discover_imap_hosts(payload.email)
    except Exception as exc:
        logger.error(f"IMAP discovery failed: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))
