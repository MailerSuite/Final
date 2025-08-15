import asyncio

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from core.logger import get_logger
from services.websocket_manager import WebSocketManager
from utils.metrics import SMTP_METRICS

router = APIRouter()
logger = get_logger(__name__)
manager = WebSocketManager()


@router.websocket("/smtp/metrics")
async def websocket_smtp_metrics(websocket: WebSocket) -> None:
    await manager.connect(websocket, "smtp_metrics")
    try:
        while True:
            msg = await websocket.receive_text()
            if msg in ("ping", "pong"):
                continue
    except WebSocketDisconnect:
        pass
    finally:
        manager.disconnect(websocket, "smtp_metrics")


@router.get("/smtp/metrics")
async def get_smtp_metrics() -> dict:
    """Return the latest SMTP metrics."""
    return await _gather_metrics()


async def _gather_metrics() -> dict:
    """Return current in-memory SMTP metrics."""
    # expose the latest counters for broadcasting
    return SMTP_METRICS.to_dict()


async def publish_metrics() -> None:
    """Send current metrics to all connected clients."""
    channel = "smtp_metrics"
    if manager.active_connections:
        await manager.send_json(channel, await _gather_metrics())


async def metrics_broadcaster() -> None:
    """Background task broadcasting SMTP metrics."""
    while True:
        try:
            await publish_metrics()
        except Exception as exc:
            logger.error(f"Failed to broadcast SMTP metrics: {exc}")
        await asyncio.sleep(5)
