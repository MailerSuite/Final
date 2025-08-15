from fastapi import WebSocket
from starlette.websockets import WebSocketState

from core.logger import get_logger

logger = get_logger(__name__)


async def safe_close(
    websocket: WebSocket, code: int = 1000, reason: str | None = None
) -> None:
    """Close WebSocket connection if still open and log the result."""
    if websocket.client_state == WebSocketState.CONNECTED:
        try:
            await websocket.close(code=code, reason=reason)
            logger.info("WebSocket closed code=%s reason=%s", code, reason)
        except Exception as exc:
            logger.error(
                "WebSocket close failed code=%s reason=%s error=%s",
                code,
                reason,
                exc,
            )
