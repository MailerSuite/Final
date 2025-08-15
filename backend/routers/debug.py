"""
Debug router for receiving client-side debug events and providing debug utilities.
"""

import json
import logging
from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from config.settings import settings
from core.database import get_db
from models.debug import DebugClientEvent

logger = logging.getLogger(__name__)

router = APIRouter()


class ClientDebugEvent(BaseModel):
    """Schema for client debug events."""

    event_type: str = Field(..., description="Type of debug event")
    timestamp: str = Field(..., description="ISO timestamp of the event")
    data: dict[str, Any] = Field(
        default_factory=dict, description="Event data"
    )
    user_agent: str = Field(default="", description="Client user agent")
    url: str = Field(default="", description="Current page URL")
    trace_id: str = Field(default="", description="Client-side trace ID")


@router.post("/client")
async def receive_client_debug_event(
    event: ClientDebugEvent,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    Receive debug events from the frontend client.
    Only processes events when ENABLE_EXTENDED_DEBUG is true.
    """

    # Check if debug mode is enabled
    if not getattr(settings, "ENABLE_EXTENDED_DEBUG", False):
        return {
            "status": "debug_disabled",
            "message": "Extended debug mode is disabled",
        }

    try:
        # Extract client IP
        client_ip = request.client.host if request.client else "unknown"

        # Create debug event record
        debug_event = DebugClientEvent(
            trace_id=event.trace_id
            or f"client-{datetime.utcnow().timestamp()}",
            event_type=event.event_type,
            user_agent=event.user_agent
            or request.headers.get("user-agent", "unknown"),
            url=event.url,
            ip_address=client_ip,
            data=event.data,
        )

        db.add(debug_event)
        await db.commit()

        # Log for CURSOR:DEBUG: memory
        log_data = {
            "event_type": event.event_type,
            "trace_id": debug_event.trace_id,
            "ip": client_ip,
            "url": event.url,
            "data_size": len(json.dumps(event.data)) if event.data else 0,
        }

        logger.info(f"CURSOR:DEBUG: 📱 CLIENT EVENT - {json.dumps(log_data)}")

        return {
            "status": "received",
            "trace_id": debug_event.trace_id,
            "timestamp": datetime.utcnow().isoformat(),
        }

    except Exception as exc:
        logger.exception(f"CURSOR:DEBUG: ❌ CLIENT DEBUG EVENT ERROR - {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process debug event",
        )


@router.get("/status")
async def debug_status():
    """Get debug system status."""
    is_enabled = getattr(settings, "ENABLE_EXTENDED_DEBUG", False)

    return {
        "debug_enabled": is_enabled,
        "timestamp": datetime.utcnow().isoformat(),
        "endpoints": {
            "client_events": "/api/v1/debug/client",
            "status": "/api/v1/debug/status",
        },
    }


@router.get("/client/recent")
async def get_recent_client_events(
    request: Request,
    db: AsyncSession = Depends(get_db),
    limit: int = 50,
    event_type: str = None,
):
    """
    Get recent client debug events.
    Only available when debug mode is enabled.
    """

    if not getattr(settings, "ENABLE_EXTENDED_DEBUG", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Debug mode is disabled",
        )

    try:
        from sqlalchemy import desc, select

        query = (
            select(DebugClientEvent)
            .order_by(desc(DebugClientEvent.created_at))
            .limit(limit)
        )

        if event_type:
            query = query.where(DebugClientEvent.event_type == event_type)

        result = await db.execute(query)
        events = result.scalars().all()

        return {
            "events": [
                {
                    "id": str(event.id),
                    "trace_id": event.trace_id,
                    "event_type": event.event_type,
                    "ip_address": event.ip_address,
                    "url": event.url,
                    "data": event.data,
                    "created_at": event.created_at.isoformat()
                    if event.created_at
                    else None,
                }
                for event in events
            ],
            "count": len(events),
            "limit": limit,
        }

    except Exception as exc:
        logger.exception(
            f"CURSOR:DEBUG: ❌ FAILED TO RETRIEVE CLIENT EVENTS - {exc}"
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve debug events",
        )


@router.delete("/client/cleanup")
async def cleanup_old_debug_events(
    request: Request, db: AsyncSession = Depends(get_db), days_old: int = 7
):
    """
    Clean up debug events older than specified days.
    Only available when debug mode is enabled.
    """

    if not getattr(settings, "ENABLE_EXTENDED_DEBUG", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Debug mode is disabled",
        )

    try:
        from datetime import timedelta

        from sqlalchemy import delete

        cutoff_date = datetime.utcnow() - timedelta(days=days_old)

        delete_query = delete(DebugClientEvent).where(
            DebugClientEvent.created_at < cutoff_date
        )
        result = await db.execute(delete_query)
        await db.commit()

        deleted_count = result.rowcount

        logger.info(
            f"CURSOR:DEBUG: 🧹 CLEANUP - Deleted {deleted_count} debug events older than {days_old} days"
        )

        return {
            "status": "completed",
            "deleted_count": deleted_count,
            "cutoff_date": cutoff_date.isoformat(),
        }

    except Exception as exc:
        logger.exception(f"CURSOR:DEBUG: ❌ CLEANUP FAILED - {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to cleanup debug events",
        )
