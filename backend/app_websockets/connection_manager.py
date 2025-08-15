"""
Connection manager module for WebSocket functionality.
This module re-exports the correct classes from their actual locations.
"""

# Import MessageType from models
from models.chat import MessageType

# Import ConnectionManager from routers
from routers.websocket import ConnectionManager

# Create a global connection manager instance
connection_manager = ConnectionManager()

# Export the classes and instance
__all__ = ['MessageType', 'ConnectionManager', 'connection_manager']
