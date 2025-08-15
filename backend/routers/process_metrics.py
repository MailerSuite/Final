import asyncio

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from core.logger import get_logger
from services.process_manager import process_manager
from services.websocket_manager import WebSocketManager

router = APIRouter()
logger = get_logger(__name__)
manager = WebSocketManager()


@router.websocket("/process.metrics")
async def websocket_process_metrics(websocket: WebSocket) -> None:
    """WebSocket endpoint streaming process metrics."""
    channel = "process_metrics"
    await manager.connect(websocket, channel)
    try:
        while True:
            try:
                data = await websocket.receive_text()
                if data == "pong":
                    continue
            except WebSocketDisconnect as exc:
                logger.info("Process metrics disconnect code=%s", exc.code)
                break
            except Exception as exc:
                logger.error("Process metrics receive error: %s", exc)
                break
    finally:
        manager.disconnect(websocket, channel)


async def metrics_broadcaster() -> None:
    """Background task broadcasting process metrics."""
    channel = "process_metrics"
    while True:
        try:
            data = [
                p.model_dump() for p in await process_manager.list_processes()
            ]
            if manager.active_connections:
                await manager.send_json(channel, data)
        except Exception as exc:
            logger.error(f"Failed to broadcast process metrics: {exc}")
        await asyncio.sleep(2)
