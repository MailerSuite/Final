"""
Admin Notifications Router
Manages system notifications and alerts for administrators
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any, Union
from datetime import datetime
from enum import Enum
import logging
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, insert, update, delete, and_, or_, func

from core.database import async_session
from core.error_standardization import error_standardizer, create_not_found_error
from core.enhanced_audit_system import get_enhanced_audit_system, AuditEventType, AuditLevel
from core.monitoring import performance_monitor
from routers.consolidated.auth_router import get_current_user, UserProfile
from schemas.common import MessageResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/admin", tags=["Admin Extensions"])

# Pydantic models for notifications
class NotificationType(str, Enum):
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    SUCCESS = "success"

class NotificationPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class NotificationCategory(str, Enum):
    SYSTEM = "system"
    SECURITY = "security"
    USER = "user"
    CAMPAIGN = "campaign"
    MAINTENANCE = "maintenance"

class NotificationStatus(str, Enum):
    UNREAD = "unread"
    READ = "read"
    ARCHIVED = "archived"

class NotificationAction(BaseModel):
    label: str
    action: str
    variant: str = "default"

class NotificationCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    message: str = Field(..., min_length=1)
    type: NotificationType
    priority: NotificationPriority
    category: NotificationCategory
    actions: List[NotificationAction] = []
    metadata: Dict[str, Any] = {}

class NotificationUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    message: Optional[str] = None
    type: Optional[NotificationType] = None
    priority: Optional[NotificationPriority] = None
    status: Optional[NotificationStatus] = None
    metadata: Optional[Dict[str, Any]] = None

class NotificationResponse(BaseModel):
    id: str
    title: str
    message: str
    type: NotificationType
    priority: NotificationPriority
    status: NotificationStatus
    category: NotificationCategory
    actions: List[NotificationAction]
    metadata: Dict[str, Any]
    created_at: datetime
    read_at: Optional[datetime]

class NotificationSettings(BaseModel):
    email_notifications: bool = True
    push_notifications: bool = True
    sms_notifications: bool = False
    desktop_notifications: bool = True
    notification_frequency: str = "instant"
    quiet_hours_enabled: bool = False
    quiet_hours_start: str = "22:00"
    quiet_hours_end: str = "07:00"
    categories: Dict[str, bool] = {
        "system": True,
        "security": True,
        "user": True,
        "campaign": True,
        "maintenance": True
    }

class NotificationStatsResponse(BaseModel):
    total_notifications: int
    unread_notifications: int
    critical_notifications: int
    notifications_today: int
    response_rate: float

# Dependency to verify admin access
async def get_current_admin_user(current_user: UserProfile = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user

@router.get("/notifications/stats", response_model=NotificationStatsResponse)
async def get_notification_stats(
    current_admin: UserProfile = Depends(get_current_admin_user),
    db: AsyncSession = Depends(async_session)
):
    """Get notification statistics"""
    try:
        # Mock implementation - replace with actual database queries
        stats = NotificationStatsResponse(
            total_notifications=156,
            unread_notifications=23,
            critical_notifications=3,
            notifications_today=12,
            response_rate=87.5
        )
        
        return stats
        
    except Exception as e:
        logger.error(f"Error fetching notification stats: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch notification statistics"
        )

@router.get("/notifications", response_model=List[NotificationResponse])
async def list_notifications(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    search: Optional[str] = None,
    type_filter: Optional[NotificationType] = None,
    status_filter: Optional[NotificationStatus] = None,
    priority_filter: Optional[NotificationPriority] = None,
    category_filter: Optional[NotificationCategory] = None,
    sort_by: str = Query("created_at", regex="^(created_at|priority|status)$"),
    sort_order: str = Query("desc", regex="^(asc|desc)$"),
    current_admin: UserProfile = Depends(get_current_admin_user),
    db: AsyncSession = Depends(async_session)
):
    """List all notifications with filtering and pagination"""
    try:
        # Mock implementation - replace with actual database queries
        mock_notifications = [
            NotificationResponse(
                id=str(uuid.uuid4()),
                title="System Maintenance Scheduled",
                message="Scheduled maintenance window from 2:00 AM to 4:00 AM UTC on Sunday",
                type=NotificationType.WARNING,
                priority=NotificationPriority.HIGH,
                status=NotificationStatus.UNREAD,
                category=NotificationCategory.MAINTENANCE,
                actions=[
                    NotificationAction(label="View Details", action="view_maintenance", variant="outline"),
                    NotificationAction(label="Acknowledge", action="acknowledge", variant="default")
                ],
                metadata={"maintenance_id": "maint_001", "estimated_downtime": 120},
                created_at=datetime.now(),
                read_at=None
            ),
            NotificationResponse(
                id=str(uuid.uuid4()),
                title="Security Alert: Multiple Failed Login Attempts",
                message="User account admin@example.com has 5 failed login attempts in the last hour",
                type=NotificationType.ERROR,
                priority=NotificationPriority.CRITICAL,
                status=NotificationStatus.UNREAD,
                category=NotificationCategory.SECURITY,
                actions=[
                    NotificationAction(label="Lock Account", action="lock_account", variant="destructive"),
                    NotificationAction(label="View Logs", action="view_logs", variant="outline")
                ],
                metadata={"user_id": "user_123", "failed_attempts": 5, "ip_address": "192.168.1.100"},
                created_at=datetime.now(),
                read_at=None
            ),
            NotificationResponse(
                id=str(uuid.uuid4()),
                title="Campaign Performance Update",
                message="Marketing Campaign Q1-2024 has achieved 95% open rate milestone",
                type=NotificationType.SUCCESS,
                priority=NotificationPriority.MEDIUM,
                status=NotificationStatus.READ,
                category=NotificationCategory.CAMPAIGN,
                actions=[
                    NotificationAction(label="View Campaign", action="view_campaign", variant="default")
                ],
                metadata={"campaign_id": "camp_456", "open_rate": 95.2, "milestone": "95_percent"},
                created_at=datetime.now(),
                read_at=datetime.now()
            )
        ]
        
        # Apply filters
        filtered_notifications = mock_notifications
        if search:
            filtered_notifications = [n for n in filtered_notifications if search.lower() in n.title.lower() or search.lower() in n.message.lower()]
        if type_filter:
            filtered_notifications = [n for n in filtered_notifications if n.type == type_filter]
        if status_filter:
            filtered_notifications = [n for n in filtered_notifications if n.status == status_filter]
        if priority_filter:
            filtered_notifications = [n for n in filtered_notifications if n.priority == priority_filter]
        if category_filter:
            filtered_notifications = [n for n in filtered_notifications if n.category == category_filter]
        
        # Apply pagination
        paginated_notifications = filtered_notifications[skip:skip + limit]
        
        return paginated_notifications
        
    except Exception as e:
        logger.error(f"Error listing notifications: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list notifications"
        )

@router.post("/notifications", response_model=NotificationResponse)
async def create_notification(
    notification_data: NotificationCreate,
    current_admin: UserProfile = Depends(get_current_admin_user),
    db: AsyncSession = Depends(async_session)
):
    """Create a new system notification"""
    try:
        # Mock implementation - replace with actual database insertion
        new_notification = NotificationResponse(
            id=str(uuid.uuid4()),
            title=notification_data.title,
            message=notification_data.message,
            type=notification_data.type,
            priority=notification_data.priority,
            status=NotificationStatus.UNREAD,
            category=notification_data.category,
            actions=notification_data.actions,
            metadata=notification_data.metadata,
            created_at=datetime.now(),
            read_at=None
        )
        
        logger.info(f"Created new notification: {new_notification.title} by {current_admin.email}")
        return new_notification
        
    except Exception as e:
        logger.error(f"Error creating notification: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create notification"
        )

@router.get("/notifications/{notification_id}", response_model=NotificationResponse)
async def get_notification(
    notification_id: str,
    current_admin: UserProfile = Depends(get_current_admin_user),
    db: AsyncSession = Depends(async_session)
):
    """Get a specific notification by ID"""
    try:
        # Mock implementation - replace with actual database query
        notification = NotificationResponse(
            id=notification_id,
            title="System Maintenance Scheduled",
            message="Scheduled maintenance window from 2:00 AM to 4:00 AM UTC on Sunday",
            type=NotificationType.WARNING,
            priority=NotificationPriority.HIGH,
            status=NotificationStatus.UNREAD,
            category=NotificationCategory.MAINTENANCE,
            actions=[
                NotificationAction(label="View Details", action="view_maintenance", variant="outline"),
                NotificationAction(label="Acknowledge", action="acknowledge", variant="default")
            ],
            metadata={"maintenance_id": "maint_001", "estimated_downtime": 120},
            created_at=datetime.now(),
            read_at=None
        )
        
        return notification
        
    except Exception as e:
        logger.error(f"Error fetching notification {notification_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )

@router.patch("/notifications/{notification_id}/read", response_model=NotificationResponse)
async def mark_notification_read(
    notification_id: str,
    current_admin: UserProfile = Depends(get_current_admin_user),
    db: AsyncSession = Depends(async_session)
):
    """Mark a notification as read"""
    try:
        # Mock implementation - replace with actual database update
        updated_notification = NotificationResponse(
            id=notification_id,
            title="System Maintenance Scheduled",
            message="Scheduled maintenance window from 2:00 AM to 4:00 AM UTC on Sunday",
            type=NotificationType.WARNING,
            priority=NotificationPriority.HIGH,
            status=NotificationStatus.READ,
            category=NotificationCategory.MAINTENANCE,
            actions=[],
            metadata={"maintenance_id": "maint_001", "estimated_downtime": 120},
            created_at=datetime.now(),
            read_at=datetime.now()
        )
        
        logger.info(f"Marked notification {notification_id} as read by {current_admin.email}")
        return updated_notification
        
    except Exception as e:
        logger.error(f"Error marking notification {notification_id} as read: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to mark notification as read"
        )

@router.patch("/notifications/bulk-read", response_model=MessageResponse)
async def mark_all_notifications_read(
    notification_ids: List[str] = None,
    current_admin: UserProfile = Depends(get_current_admin_user),
    db: AsyncSession = Depends(async_session)
):
    """Mark multiple notifications as read"""
    try:
        # Mock implementation - replace with actual database update
        if notification_ids:
            count = len(notification_ids)
        else:
            count = 23  # Mock count of all unread notifications
        
        logger.info(f"Marked {count} notifications as read by {current_admin.email}")
        return MessageResponse(message=f"Marked {count} notifications as read")
        
    except Exception as e:
        logger.error(f"Error marking notifications as read: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to mark notifications as read"
        )

@router.delete("/notifications/{notification_id}", response_model=MessageResponse)
async def delete_notification(
    notification_id: str,
    current_admin: UserProfile = Depends(get_current_admin_user),
    db: AsyncSession = Depends(async_session)
):
    """Delete a notification"""
    try:
        # Mock implementation - replace with actual database deletion
        logger.info(f"Deleted notification {notification_id} by {current_admin.email}")
        
        return MessageResponse(message="Notification deleted successfully")
        
    except Exception as e:
        logger.error(f"Error deleting notification {notification_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete notification"
        )

@router.get("/notifications/settings", response_model=NotificationSettings)
async def get_notification_settings(
    current_admin: UserProfile = Depends(get_current_admin_user),
    db: AsyncSession = Depends(async_session)
):
    """Get notification settings for the current admin"""
    try:
        # Mock implementation - replace with actual database query
        settings = NotificationSettings(
            email_notifications=True,
            push_notifications=True,
            sms_notifications=False,
            desktop_notifications=True,
            notification_frequency="instant",
            quiet_hours_enabled=True,
            quiet_hours_start="22:00",
            quiet_hours_end="07:00",
            categories={
                "system": True,
                "security": True,
                "user": True,
                "campaign": True,
                "maintenance": True
            }
        )
        
        return settings
        
    except Exception as e:
        logger.error(f"Error fetching notification settings: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch notification settings"
        )

@router.put("/notifications/settings", response_model=NotificationSettings)
async def update_notification_settings(
    settings_data: NotificationSettings,
    current_admin: UserProfile = Depends(get_current_admin_user),
    db: AsyncSession = Depends(async_session)
):
    """Update notification settings for the current admin"""
    try:
        # Mock implementation - replace with actual database update
        logger.info(f"Updated notification settings by {current_admin.email}")
        
        return settings_data
        
    except Exception as e:
        logger.error(f"Error updating notification settings: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update notification settings"
        )

@router.post("/notifications/test", response_model=MessageResponse)
async def send_test_notification(
    notification_type: NotificationType = NotificationType.INFO,
    current_admin: UserProfile = Depends(get_current_admin_user),
    db: AsyncSession = Depends(async_session)
):
    """Send a test notification"""
    try:
        # Mock implementation - replace with actual notification sending
        logger.info(f"Sent test notification of type {notification_type} by {current_admin.email}")
        
        return MessageResponse(message=f"Test {notification_type} notification sent successfully")
        
    except Exception as e:
        logger.error(f"Error sending test notification: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send test notification"
        )

@router.post("/notifications/{notification_id}/acknowledge", response_model=MessageResponse)
async def acknowledge_notification(
    notification_id: str,
    current_admin: UserProfile = Depends(get_current_admin_user),
    db: AsyncSession = Depends(async_session)
):
    """Acknowledge a notification (for critical alerts)"""
    try:
        # Mock implementation - replace with actual database update
        logger.info(f"Acknowledged notification {notification_id} by {current_admin.email}")
        
        return MessageResponse(message="Notification acknowledged successfully")
        
    except Exception as e:
        logger.error(f"Error acknowledging notification {notification_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to acknowledge notification"
        )