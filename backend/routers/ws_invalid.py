from fastapi import APIRouter, WebSocket

router = APIRouter()


@router.websocket("/{path:path}")
async def invalid_ws(websocket: WebSocket, path: str) -> None:
    """Return an error message for unsupported WebSocket paths."""
    await websocket.accept()
    await websocket.send_json(
        {"detail": "Invalid WebSocket path", "path": path}
    )
    await websocket.close(code=4000)
