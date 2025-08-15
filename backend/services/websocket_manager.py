"""
WebSocket Manager - Basic implementation for real-time communication
"""

import logging
from typing import Any

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class WebSocketManager:
    """Basic WebSocket connection manager"""

    def __init__(self):
        self.active_connections: dict[str, list[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, client_id: str):
        """Accept a WebSocket connection"""
        await websocket.accept()
        if client_id not in self.active_connections:
            self.active_connections[client_id] = []
        self.active_connections[client_id].append(websocket)
        logger.info(f"WebSocket connected for client: {client_id}")

    def disconnect(self, websocket: WebSocket, client_id: str):
        """Remove a WebSocket connection"""
        if client_id in self.active_connections:
            if websocket in self.active_connections[client_id]:
                self.active_connections[client_id].remove(websocket)
            if not self.active_connections[client_id]:
                del self.active_connections[client_id]
        logger.info(f"WebSocket disconnected for client: {client_id}")

    async def send_personal_message(self, message: Any, client_id: str):
        """Send a message to a specific client"""
        if client_id in self.active_connections:
            for connection in self.active_connections[client_id]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.error(f"Error sending message to {client_id}: {e}")

    async def broadcast(self, message: Any):
        """Broadcast a message to all connected clients"""
        for client_id in self.active_connections:
            await self.send_personal_message(message, client_id)


# Global instance
websocket_manager = WebSocketManager()
