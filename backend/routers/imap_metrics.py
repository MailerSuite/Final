import asyncio

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from starlette.websockets import WebSocketState

from core.logger import get_logger
from services.websocket_manager import WebSocketManager
from utils.metrics import IMAP_METRICS

router = APIRouter()
logger = get_logger(__name__)
manager = WebSocketManager()


@router.websocket("/imap/metrics")
async def websocket_imap_metrics(websocket: WebSocket) -> None:
    """WebSocket endpoint streaming IMAP connection metrics."""
    await websocket.accept()

    async def metrics_generator():
        try:
            while True:
                yield (await _gather_metrics())
                await asyncio.sleep(5)
        except asyncio.CancelledError:
            pass

    gen = metrics_generator()
    try:
        async for metric in gen:
            await websocket.send_json(metric)
    except WebSocketDisconnect as exc:
        logger.info("IMAP metrics disconnect code=%s", exc.code)
    except Exception as exc:
        logger.error(f"IMAP metrics streaming error: {exc}")
        if websocket.application_state == WebSocketState.CONNECTED:
            await websocket.send_json({"type": "error", "message": str(exc)})
            await websocket.close(code=1011)
    else:
        await websocket.send_json({"type": "complete"})
        await websocket.close(code=1000)
    finally:
        await gen.aclose()


async def _gather_metrics() -> dict:
    """Return current in-memory IMAP metrics."""
    return IMAP_METRICS.to_dict()


async def publish_metrics() -> None:
    """Send current metrics to all connected clients."""
    channel = "imap_metrics"
    if manager.active_connections:
        await manager.send_json(channel, await _gather_metrics())


async def metrics_broadcaster() -> None:
    """Background task broadcasting IMAP metrics."""
    while True:
        try:
            await publish_metrics()
        except Exception as e:
            logger.error(f"Failed to broadcast IMAP metrics: {e}")
        await asyncio.sleep(5)
