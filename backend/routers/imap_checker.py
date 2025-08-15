import asyncio
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status

from core.database import get_db
from core.logger import get_logger
from schemas.imap import IMAPCheckRequest
from services.imap_test_service import imap_test_service
from utils.check_logging import log_check_result

router = APIRouter()
logger = get_logger(__name__)


@router.post("/test")
async def test_imap_connection(
    payload: IMAPCheckRequest, session=Depends(get_db)
) -> dict[str, Any]:
    """Run a simple IMAP login/capability test."""
    start = asyncio.get_event_loop().time()
    try:
        success, resp = await imap_test_service.run_imap_test(
            payload.server, payload.port, payload.email, payload.password
        )
        await log_check_result(
            session,
            check_type="imap",
            input_params=payload.model_dump(),
            status="success" if success else "error",
            response={"response": resp},
            duration=asyncio.get_event_loop().time() - start,
        )
        return {"status": "success" if success else "error", "response": resp}
    except Exception as exc:
        await log_check_result(
            session,
            check_type="imap",
            input_params=payload.model_dump(),
            status="error",
            response={"error": str(exc)},
            duration=asyncio.get_event_loop().time() - start,
        )
        logger.error(f"IMAP test failed: {exc}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)
        )
