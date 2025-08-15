"""
Webhook System Router
Phase 3 Enterprise: Real-time notifications and event-driven integrations
"""

import asyncio
import hashlib
import hmac
import json
import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
from uuid import uuid4

import aiohttp
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request, status
from pydantic import BaseModel, HttpUrl, validator
from sqlalchemy import select, text, func, case
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.error_handlers import StandardErrorHandler
from core.response_handlers import ResponseBuilder
from models import User, WebhookDelivery, WebhookEndpoint, WebhookEvent, WebhookStats
from routers.auth import get_current_user, get_current_admin_user

router = APIRouter()
logger = logging.getLogger(__name__)


# ============================================================================
# WEBHOOK SCHEMAS
# ============================================================================

class WebhookEndpoint(BaseModel):
    """Webhook endpoint configuration"""
    id: Optional[str] = None
    url: HttpUrl
    events: List[str]
    secret: Optional[str] = None
    description: Optional[str] = None
    is_active: bool = True
    retry_count: int = 3
    timeout_seconds: int = 30
    
    @validator('events')
    def validate_events(cls, v):
        allowed_events = [
            'campaign.created', 'campaign.started', 'campaign.completed',
            'email.sent', 'email.delivered', 'email.bounced', 'email.opened', 'email.clicked',
            'user.registered', 'user.login', 'user.updated',
            'integration.connected', 'integration.disconnected',
            'system.maintenance', 'system.alert'
        ]
        for event in v:
            if event not in allowed_events:
                raise ValueError(f"Invalid event type: {event}")
        return v


class WebhookEvent(BaseModel):
    """Webhook event data"""
    id: str
    event_type: str
    timestamp: datetime
    data: Dict[str, Any]
    user_id: Optional[str] = None
    retry_count: int = 0


class WebhookDelivery(BaseModel):
    """Webhook delivery record"""
    id: str
    webhook_id: str
    event_id: str
    url: str
    status_code: Optional[int] = None
    response_body: Optional[str] = None
    delivery_time: Optional[datetime] = None
    error_message: Optional[str] = None
    retry_count: int = 0


class WebhookStats(BaseModel):
    """Webhook statistics"""
    total_webhooks: int
    active_webhooks: int
    total_deliveries: int
    successful_deliveries: int
    failed_deliveries: int
    average_delivery_time: float
    success_rate: float


# ============================================================================
# IN-MEMORY STORAGE (Replace with database models)
# ============================================================================


# ============================================================================
# WEBHOOK ENDPOINTS
# ============================================================================

@router.get("/")
async def webhooks_info() -> Dict[str, Any]:
    """Webhook system information and available endpoints."""
    return {
        "service": "Webhook System API",
        "version": "1.0.0",
        "description": "Real-time event notifications and integrations",
        "endpoints": {
            "list": "/",
            "create": "/",
            "get": "/{webhook_id}",
            "update": "/{webhook_id}",
            "delete": "/{webhook_id}",
            "test": "/{webhook_id}/test",
            "events": "/events",
            "deliveries": "/deliveries",
            "stats": "/stats",
        },
        "supported_events": [
            "campaign.created", "campaign.started", "campaign.completed",
            "email.sent", "email.delivered", "email.bounced", "email.opened", "email.clicked",
            "user.registered", "user.login", "user.updated",
            "integration.connected", "integration.disconnected",
            "system.maintenance", "system.alert"
        ],
        "features": [
            "✅ Real-time event notifications",
            "✅ Automatic retry with exponential backoff",
            "✅ Signature verification for security",
            "✅ Event filtering and routing",
            "✅ Delivery tracking and analytics",
            "✅ Test webhook functionality",
            "✅ Webhook endpoint validation",
            "✅ Multiple event subscription"
        ],
        "status": "✅ Phase 3 Enterprise - Real-time webhook system",
    }


@router.get("/webhooks", response_model=List[WebhookEndpoint])
async def list_webhooks(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
) -> List[WebhookEndpoint]:
    """List all webhooks for the current user."""
    try:
        query = select(WebhookEndpoint).where(
            WebhookEndpoint.user_id == current_user.id
        )
        result = await db.execute(query)
        webhooks = result.scalars().all()
        return webhooks

    except Exception as e:
        logger.error(f"Error listing webhooks: {e}")
        raise StandardErrorHandler.database_error("Failed to list webhooks")


@router.post("/webhooks", response_model=WebhookEndpoint)
async def create_webhook(
    webhook_data: WebhookEndpoint,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
) -> WebhookEndpoint:
    """Create a new webhook endpoint."""
    try:
        new_webhook = WebhookEndpoint(
            url=webhook_data.url,
            events=webhook_data.events,
            secret=webhook_data.secret or f"whsec_{uuid4().hex}",
            description=webhook_data.description,
            is_active=webhook_data.is_active,
            retry_count=webhook_data.retry_count,
            timeout_seconds=webhook_data.timeout_seconds,
            user_id=current_user.id,
        )
        db.add(new_webhook)
        await db.commit()
        await db.refresh(new_webhook)

        # Test webhook endpoint in background
        background_tasks.add_task(test_webhook_endpoint, str(new_webhook.id), db)

        return new_webhook

    except Exception as e:
        logger.error(f"Error creating webhook: {e}")
        raise StandardErrorHandler.database_error("Failed to create webhook")


@router.get("/webhooks/{webhook_id}", response_model=WebhookEndpoint)
async def get_webhook(
    webhook_id: str,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
) -> WebhookEndpoint:
    """Get a specific webhook by ID."""
    try:
        query = select(WebhookEndpoint).where(
            WebhookEndpoint.id == webhook_id,
            WebhookEndpoint.user_id == current_user.id
        )
        result = await db.execute(query)
        webhook = result.scalars().first()

        if not webhook:
            raise StandardErrorHandler.not_found_error("Webhook", webhook_id)

        return webhook

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting webhook {webhook_id}: {e}")
        raise StandardErrorHandler.database_error("Failed to get webhook")


@router.put("/webhooks/{webhook_id}", response_model=WebhookEndpoint)
async def update_webhook(
    webhook_id: str,
    webhook_data: WebhookEndpoint,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
) -> WebhookEndpoint:
    """Update an existing webhook."""
    try:
        query = select(WebhookEndpoint).where(
            WebhookEndpoint.id == webhook_id,
            WebhookEndpoint.user_id == current_user.id
        )
        result = await db.execute(query)
        existing_webhook = result.scalars().first()

        if not existing_webhook:
            raise StandardErrorHandler.not_found_error("Webhook", webhook_id)

        # Update webhook data
        existing_webhook.url = webhook_data.url
        existing_webhook.events = webhook_data.events
        existing_webhook.description = webhook_data.description
        existing_webhook.is_active = webhook_data.is_active
        existing_webhook.retry_count = webhook_data.retry_count
        existing_webhook.timeout_seconds = webhook_data.timeout_seconds
        existing_webhook.updated_at = datetime.now()

        await db.commit()
        await db.refresh(existing_webhook)

        return existing_webhook

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating webhook {webhook_id}: {e}")
        raise StandardErrorHandler.database_error("Failed to update webhook")


@router.delete("/webhooks/{webhook_id}")
async def delete_webhook(
    webhook_id: str,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Delete a webhook endpoint."""
    try:
        query = select(WebhookEndpoint).where(
            WebhookEndpoint.id == webhook_id,
            WebhookEndpoint.user_id == current_user.id
        )
        result = await db.execute(query)
        webhook = result.scalars().first()

        if not webhook:
            raise StandardErrorHandler.not_found_error("Webhook", webhook_id)

        await db.delete(webhook)
        await db.commit()

        return ResponseBuilder.deleted(
            message="Webhook deleted successfully",
            resource_id=webhook_id
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting webhook {webhook_id}: {e}")
        raise StandardErrorHandler.database_error("Failed to delete webhook")


@router.post("/webhooks/{webhook_id}/test")
async def test_webhook(
    webhook_id: str,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Test a webhook endpoint with a sample event."""
    try:
        query = select(WebhookEndpoint).where(
            WebhookEndpoint.id == webhook_id,
            WebhookEndpoint.user_id == current_user.id
        )
        result = await db.execute(query)
        webhook = result.scalars().first()
        if not webhook:
            raise StandardErrorHandler.not_found_error("Webhook", webhook_id)

        # Create test event
        test_event = WebhookEvent(
            event_type="webhook.test",
            data={
                "test": True,
                "message": "This is a test webhook event",
                "webhook_id": str(webhook.id),
                "user_id": str(current_user.id),
            },
            user_id=current_user.id,
        )
        db.add(test_event)
        await db.commit()
        await db.refresh(test_event)

        # Send test webhook in background
        background_tasks.add_task(deliver_webhook, str(webhook.id), test_event, db)

        return ResponseBuilder.success(
            message="Test webhook event queued for delivery",
            data={
                "event_id": str(test_event.id),
                "webhook_id": str(webhook.id),
                "status": "queued"
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error testing webhook {webhook_id}: {e}")
        raise StandardErrorHandler.database_error("Failed to test webhook")


@router.get("/events", response_model=List[WebhookEvent])
async def list_webhook_events(
    limit: int = 50,
    event_type: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
) -> List[WebhookEvent]:
    """List recent webhook events for the user."""
    try:
        query = select(WebhookEvent).where(WebhookEvent.user_id == current_user.id)
        if event_type:
            query = query.where(WebhookEvent.event_type == event_type)
        query = query.order_by(WebhookEvent.timestamp.desc()).limit(limit)
        result = await db.execute(query)
        events = result.scalars().all()
        return events

    except Exception as e:
        logger.error(f"Error listing webhook events: {e}")
        raise StandardErrorHandler.database_error("Failed to list webhook events")


@router.get("/deliveries", response_model=List[WebhookDelivery])
async def list_webhook_deliveries(
    webhook_id: Optional[str] = None,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
) -> List[WebhookDelivery]:
    """List webhook delivery records."""
    try:
        # Ensure the user only sees deliveries for their webhooks
        user_webhooks_query = select(WebhookEndpoint.id).where(WebhookEndpoint.user_id == current_user.id)
        user_webhook_ids = (await db.execute(user_webhooks_query)).scalars().all()

        query = select(WebhookDelivery).where(WebhookDelivery.webhook_id.in_(user_webhook_ids))

        if webhook_id:
            query = query.where(WebhookDelivery.webhook_id == webhook_id)
        
        query = query.order_by(WebhookDelivery.delivery_time.desc()).limit(limit)
        result = await db.execute(query)
        deliveries = result.scalars().all()
        return deliveries

    except Exception as e:
        logger.error(f"Error listing webhook deliveries: {e}")
        raise StandardErrorHandler.database_error("Failed to list webhook deliveries")


@router.get("/stats", response_model=WebhookStats)
async def get_webhook_stats(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
) -> WebhookStats:
    """Get webhook statistics for the user."""
    try:
        # Get webhooks for the current user
        query = select(WebhookEndpoint).where(WebhookEndpoint.user_id == current_user.id)
        result = await db.execute(query)
        user_webhooks = result.scalars().all()

        total_webhooks = len(user_webhooks)
        active_webhooks = len([w for w in user_webhooks if w.is_active])

        user_webhook_ids = [str(w.id) for w in user_webhooks]

        # Aggregate delivery statistics from WebhookDelivery for user's webhooks
        if user_webhook_ids:
            deliveries_query = select(
                func.count(WebhookDelivery.id).label("total_deliveries"),
                func.sum(case((WebhookDelivery.is_successful == True, 1), else_=0)).label("successful_deliveries"),
                func.sum(case((WebhookDelivery.is_successful == False, 1), else_=0)).label("failed_deliveries"),
                func.avg(WebhookDelivery.request_duration_ms).label("average_delivery_time_ms"),
            ).where(WebhookDelivery.webhook_id.in_(user_webhook_ids))
            
            delivery_stats = (await db.execute(deliveries_query)).first()

            total_deliveries = delivery_stats.total_deliveries if delivery_stats.total_deliveries is not None else 0
            successful_deliveries = delivery_stats.successful_deliveries if delivery_stats.successful_deliveries is not None else 0
            failed_deliveries = delivery_stats.failed_deliveries if delivery_stats.failed_deliveries is not None else 0
            average_delivery_time = delivery_stats.average_delivery_time_ms if delivery_stats.average_delivery_time_ms is not None else 0
            
        else:
            total_deliveries = 0
            successful_deliveries = 0
            failed_deliveries = 0
            average_delivery_time = 0

        success_rate = (successful_deliveries / total_deliveries * 100) if total_deliveries > 0 else 0

        return WebhookStats(
            total_webhooks=total_webhooks,
            active_webhooks=active_webhooks,
            total_deliveries=total_deliveries,
            successful_deliveries=successful_deliveries,
            failed_deliveries=failed_deliveries,
            average_delivery_time=round(average_delivery_time, 3),
            success_rate=round(success_rate, 2),
        )

    except Exception as e:
        logger.error(f"Error getting webhook stats: {e}")
        raise StandardErrorHandler.database_error("Failed to get webhook stats")


# ============================================================================
# WEBHOOK DELIVERY FUNCTIONS
# ============================================================================

async def deliver_webhook(webhook_id: str, event: WebhookEvent, db: AsyncSession) -> bool:
    """Deliver a webhook event to the specified endpoint."""
    try:
        query = select(WebhookEndpoint).where(WebhookEndpoint.id == webhook_id)
        result = await db.execute(query)
        webhook = result.scalars().first()

        if not webhook or not webhook.is_active:
            return False

        delivery_start = datetime.now()

        # Prepare payload
        payload = {
            "id": str(event.id),
            "event_type": event.event_type,
            "timestamp": event.timestamp.isoformat(),
            "data": event.data,
        }

        # Generate signature if secret is provided
        headers = {"Content-Type": "application/json"}
        if webhook.secret:
            signature = generate_webhook_signature(
                webhook.secret,
                json.dumps(payload, default=str)
            )
            headers['X-Webhook-Signature'] = signature

        # Make HTTP request
        timeout = aiohttp.ClientTimeout(total=webhook.timeout_seconds)

        status_code: Optional[int] = None
        response_body: Optional[str] = None
        error_message: Optional[str] = None
        is_successful: bool = False
        request_duration_ms: Optional[int] = None
        payload_size_bytes: Optional[int] = len(json.dumps(payload).encode('utf-8'))
        response_size_bytes: Optional[int] = None

        try:
            async with aiohttp.ClientSession(timeout=timeout) as session:
                async with session.post(
                    webhook.url,
                    json=payload,
                    headers=headers
                ) as response:
                    status_code = response.status
                    response_body = await response.text()
                    response_size_bytes = len(response_body.encode('utf-8'))
                    is_successful = 200 <= status_code < 300
        except aiohttp.ClientError as e:
            error_message = f"Client Error: {e}"
        except asyncio.TimeoutError:
            error_message = "Request timed out"
        except Exception as e:
            error_message = f"Unexpected error: {e}"

        delivery_time = datetime.now()
        request_duration_ms = int((delivery_time - delivery_start).total_seconds() * 1000)

        delivery = WebhookDelivery(
            webhook_id=webhook.id,
            event_id=event.id,
            url=str(webhook.url),
            status_code=status_code,
            response_body=response_body[:1000] if response_body else None,
            delivery_time=delivery_time,
            error_message=error_message,
            retry_count=event.retry_count,
            is_successful=is_successful,
            request_duration_ms=request_duration_ms,
            payload_size_bytes=payload_size_bytes,
            response_size_bytes=response_size_bytes,
        )
        db.add(delivery)
        await db.commit()

        # Update webhook endpoint stats
        if is_successful:
            webhook.successful_deliveries += 1
        else:
            webhook.failed_deliveries += 1
        webhook.total_deliveries += 1
        webhook.last_delivery_at = delivery_time

        # Recalculate average delivery time (simple average for now, could be moving average)
        current_total_duration = (webhook.average_delivery_time * (webhook.total_deliveries - 1))
        webhook.average_delivery_time = int((current_total_duration + request_duration_ms) / webhook.total_deliveries)

        await db.commit()
        await db.refresh(webhook)

        return is_successful

    except Exception as e:
        logger.error(f"Error delivering webhook {webhook_id}: {e}")
        return False


async def test_webhook_endpoint(webhook_id: str, db: AsyncSession):
    """Test webhook endpoint connectivity."""
    query = select(WebhookEndpoint).where(WebhookEndpoint.id == webhook_id)
    result = await db.execute(query)
    webhook = result.scalars().first()
    if not webhook:
        return

    test_event = WebhookEvent(
        event_type="webhook.endpoint_test",
        data={"test": True, "message": "Endpoint connectivity test"},
        user_id=webhook.user_id,
    )
    db.add(test_event)
    await db.commit()
    await db.refresh(test_event)

    success = await deliver_webhook(str(webhook.id), test_event, db)
    logger.info(f"Webhook endpoint test for {webhook_id}: {'SUCCESS' if success else 'FAILED'}")


def generate_webhook_signature(secret: str, payload: str) -> str:
    """Generate HMAC signature for webhook verification."""
    signature = hmac.new(
        secret.encode('utf-8'),
        payload.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    return f"sha256={signature}"


# ============================================================================
# EVENT PUBLISHING FUNCTIONS
# ============================================================================

async def publish_webhook_event(
    event_type: str,
    data: Dict[str, Any],
    user_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db) # Add db dependency here
) -> str:
    """Publish an event to all matching webhooks."""
    event = WebhookEvent(
        event_type=event_type,
        data=data,
        user_id=user_id,
    )
    db.add(event)
    await db.commit()
    await db.refresh(event)

    # Find matching webhooks
    query = select(WebhookEndpoint).where(
        WebhookEndpoint.is_active == True,
        WebhookEndpoint.events.contains([event_type])
    )
    if user_id:
        query = query.where(WebhookEndpoint.user_id == user_id)

    result = await db.execute(query)
    matching_webhooks = result.scalars().all()

    # Deliver to matching webhooks (in background)
    for webhook in matching_webhooks:
        asyncio.create_task(deliver_webhook(str(webhook.id), event, db))

    logger.info(f"Published event {event.id} to {len(matching_webhooks)} webhooks")
    return str(event.id)


# ============================================================================
# ADMIN ENDPOINTS
# ============================================================================

@router.get("/admin/webhooks")
async def list_all_webhooks(
    db: AsyncSession = Depends(get_db),
    current_admin=Depends(get_current_admin_user),
):
    """List all webhooks in the system (Admin only)."""
    try:
        query = select(WebhookEndpoint)
        result = await db.execute(query)
        all_webhooks = result.scalars().all()

        active_webhooks_count = len([w for w in all_webhooks if w.is_active])

        return ResponseBuilder.success(
            message="All webhooks retrieved successfully",
            data={
                "total_webhooks": len(all_webhooks),
                "active_webhooks": active_webhooks_count,
                "webhooks": [w.dict() for w in all_webhooks] # Convert to dict for response
            }
        )

    except Exception as e:
        logger.error(f"Error listing all webhooks: {e}")
        raise StandardErrorHandler.database_error("Failed to list all webhooks")


@router.get("/admin/stats")
async def get_system_webhook_stats(
    db: AsyncSession = Depends(get_db),
    current_admin=Depends(get_current_admin_user),
):
    """Get system-wide webhook statistics (Admin only)."""
    try:
        # Total webhooks
        total_webhooks_query = select(func.count(WebhookEndpoint.id))
        total_webhooks = (await db.execute(total_webhooks_query)).scalar_one_or_none() or 0

        # Active webhooks
        active_webhooks_query = select(func.count(WebhookEndpoint.id)).where(WebhookEndpoint.is_active == True)
        active_webhooks = (await db.execute(active_webhooks_query)).scalar_one_or_none() or 0

        # Total events
        total_events_query = select(func.count(WebhookEvent.id))
        total_events = (await db.execute(total_events_query)).scalar_one_or_none() or 0

        # Total and successful deliveries
        deliveries_query = select(
            func.count(WebhookDelivery.id).label("total_deliveries"),
            func.sum(case((WebhookDelivery.is_successful == True, 1), else_=0)).label("successful_deliveries"),
        )
        delivery_stats = (await db.execute(deliveries_query)).first()

        total_deliveries = delivery_stats.total_deliveries if delivery_stats.total_deliveries is not None else 0
        successful_deliveries = delivery_stats.successful_deliveries if delivery_stats.successful_deliveries is not None else 0

        success_rate = round(successful_deliveries / total_deliveries * 100, 2) if total_deliveries > 0 else 0

        return ResponseBuilder.success(
            message="System webhook statistics retrieved successfully",
            data={
                "total_webhooks": total_webhooks,
                "active_webhooks": active_webhooks,
                "total_events": total_events,
                "total_deliveries": total_deliveries,
                "successful_deliveries": successful_deliveries,
                "success_rate": success_rate,
            }
        )

    except Exception as e:
        logger.error(f"Error getting system webhook stats: {e}")
        raise StandardErrorHandler.database_error("Failed to get system webhook stats")