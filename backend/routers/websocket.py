"""
WebSocket Router
Handles WebSocket connections and real-time communications
"""

import asyncio
import json
import logging
from datetime import datetime
from typing import Any

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter()
logger = logging.getLogger(__name__)


# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []
        self.user_connections: dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, user_id: str = None):
        await websocket.accept()
        self.active_connections.append(websocket)
        if user_id:
            self.user_connections[user_id] = websocket
        logger.info(
            f"WebSocket connection established. Total: {len(self.active_connections)}"
        )

    def disconnect(self, websocket: WebSocket, user_id: str = None):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        if user_id and user_id in self.user_connections:
            del self.user_connections[user_id]
        logger.info(
            f"WebSocket disconnected. Total: {len(self.active_connections)}"
        )

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def send_to_user(self, message: str, user_id: str):
        if user_id in self.user_connections:
            await self.user_connections[user_id].send_text(message)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except:
                # Remove dead connections
                self.active_connections.remove(connection)


manager = ConnectionManager()


@router.get("/")
async def websocket_info() -> dict[str, Any]:
    """WebSocket API information."""
    return {
        "service": "WebSocket API",
        "version": "1.0.0",
        "description": "Real-time WebSocket communications",
        "endpoints": {
            "connect": "/ws/{user_id}",
            "status": "/status",
            "metrics": "/metrics",
            "broadcast": "/broadcast",
        },
        "active_connections": len(manager.active_connections),
    }


@router.get("/status")
async def get_websocket_status() -> dict[str, Any]:
    """Get WebSocket system status."""
    return {
        "status": "operational",
        "active_connections": len(manager.active_connections),
        "user_connections": len(manager.user_connections),
        "timestamp": datetime.utcnow().isoformat(),
    }


@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    """Main WebSocket endpoint for user connections."""
    await manager.connect(websocket, user_id)
    try:
        # Send welcome message
        await manager.send_personal_message(
            json.dumps(
                {
                    "type": "connection",
                    "message": "Connected to SGPT WebSocket",
                    "user_id": user_id,
                    "timestamp": datetime.utcnow().isoformat(),
                }
            ),
            websocket,
        )

        while True:
            # Receive message from client
            data = await websocket.receive_text()

            try:
                message_data = json.loads(data)
                message_type = message_data.get("type", "message")

                if message_type == "ping":
                    # Respond to ping with pong
                    await manager.send_personal_message(
                        json.dumps(
                            {
                                "type": "pong",
                                "timestamp": datetime.utcnow().isoformat(),
                            }
                        ),
                        websocket,
                    )
                elif message_type == "broadcast":
                    # Broadcast message to all connections
                    await manager.broadcast(
                        json.dumps(
                            {
                                "type": "broadcast",
                                "from_user": user_id,
                                "message": message_data.get("message"),
                                "timestamp": datetime.utcnow().isoformat(),
                            }
                        )
                    )
                else:
                    # Echo message back
                    await manager.send_personal_message(
                        json.dumps(
                            {
                                "type": "echo",
                                "original": message_data,
                                "timestamp": datetime.utcnow().isoformat(),
                            }
                        ),
                        websocket,
                    )

            except json.JSONDecodeError:
                # Handle non-JSON messages
                await manager.send_personal_message(
                    json.dumps(
                        {
                            "type": "error",
                            "message": "Invalid JSON format",
                            "timestamp": datetime.utcnow().isoformat(),
                        }
                    ),
                    websocket,
                )

    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)
        logger.info(f"User {user_id} disconnected")


@router.websocket("/ws/metrics")
async def metrics_websocket(websocket: WebSocket):
    """WebSocket endpoint for real-time metrics."""
    await manager.connect(websocket)
    try:
        while True:
            # Send metrics every 5 seconds
            metrics = {
                "type": "metrics",
                "data": {
                    "active_connections": len(manager.active_connections),
                    "timestamp": datetime.utcnow().isoformat(),
                    "system_status": "healthy",
                },
            }
            await manager.send_personal_message(json.dumps(metrics), websocket)
            await asyncio.sleep(5)
    except WebSocketDisconnect:
        manager.disconnect(websocket)


@router.post("/broadcast")
async def broadcast_message(message: dict[str, Any]) -> dict[str, Any]:
    """Broadcast message to all connected clients."""
    broadcast_data = {
        "type": "admin_broadcast",
        "message": message.get("message", ""),
        "timestamp": datetime.utcnow().isoformat(),
    }

    await manager.broadcast(json.dumps(broadcast_data))

    return {
        "success": True,
        "message": "Message broadcasted",
        "recipients": len(manager.active_connections),
    }


@router.get("/metrics")
async def get_websocket_metrics() -> dict[str, Any]:
    """Get WebSocket connection metrics."""
    return {
        "total_connections": len(manager.active_connections),
        "user_connections": len(manager.user_connections),
        "timestamp": datetime.utcnow().isoformat(),
        "status": "operational",
    }


# Legacy functions for backward compatibility
async def send_job_progress_update(job_id: str, progress: dict[str, Any]):
    """Send job progress update via WebSocket"""
    message = {
        "type": "job_progress",
        "job_id": job_id,
        "progress": progress,
        "timestamp": datetime.utcnow().isoformat(),
    }
    await manager.broadcast(json.dumps(message))
    logger.info(f"Sent job progress update for job {job_id}")


async def send_job_log_update(job_id: str, log_data: dict[str, Any]):
    """Send job log update via WebSocket"""
    message = {
        "type": "job_log",
        "job_id": job_id,
        "log": log_data,
        "timestamp": datetime.utcnow().isoformat(),
    }
    await manager.broadcast(json.dumps(message))
    logger.info(f"Sent job log update for job {job_id}")


async def send_thread_pool_update(update_data: dict[str, Any]):
    """Send thread pool update via WebSocket"""
    message = {
        "type": "thread_pool_update",
        "data": update_data,
        "timestamp": datetime.utcnow().isoformat(),
    }
    await manager.broadcast(json.dumps(message))
    logger.info("Sent thread pool update")
