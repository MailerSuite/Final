"""
Admin Schemas
Pydantic models for admin API endpoints
"""

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, EmailStr


class UserStatus(str, Enum):
    """User status enumeration"""

    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"


class TicketStatus(str, Enum):
    """Support ticket status enumeration"""

    OPEN = "open"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CLOSED = "closed"


class TicketPriority(str, Enum):
    """Support ticket priority enumeration"""

    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class AdminUser(BaseModel):
    """Admin user model"""

    id: str  # UUID string, not int
    username: str
    email: EmailStr
    is_active: bool
    is_admin: bool
    plan: str = "PLAN1"  # Updated to use simple plan string
    created_at: datetime


class AdminUserCreate(BaseModel):
    """Admin user creation model"""

    username: str
    email: EmailStr
    password: str
    is_admin: bool = False
    plan_id: int | None = None


class AdminUserUpdate(BaseModel):
    """Admin user update model"""

    username: str | None = None
    email: EmailStr | None = None
    is_active: bool | None = None
    is_admin: bool | None = None
    status: UserStatus | None = None
    plan: str | None = None  # Updated to use simple plan string


class AdminPlan(BaseModel):
    """Admin plan model"""

    id: int
    name: str
    description: str
    price: float
    features: list[str]
    max_emails: int | None = None
    max_sessions: int | None = None
    is_active: bool
    created_at: datetime
    updated_at: datetime | None = None


class AdminPlanCreate(BaseModel):
    """Admin plan creation model"""

    name: str
    description: str
    price: float
    features: list[str]
    max_emails: int | None = None
    max_sessions: int | None = None


class AdminPlanUpdate(BaseModel):
    """Admin plan update model"""

    name: str | None = None
    description: str | None = None
    price: float | None = None
    features: list[str] | None = None
    max_emails: int | None = None
    max_sessions: int | None = None
    is_active: bool | None = None


class SupportTicket(BaseModel):
    """Support ticket model"""

    id: int
    user_id: int | None = None
    subject: str
    message: str
    status: TicketStatus
    priority: TicketPriority
    created_at: datetime
    updated_at: datetime | None = None
    assigned_to: int | None = None
    resolution: str | None = None


class SupportTicketUpdate(BaseModel):
    """Support ticket update model"""

    status: TicketStatus | None = None
    priority: TicketPriority | None = None
    assigned_to: int | None = None
    resolution: str | None = None


class AdminStats(BaseModel):
    """Admin statistics model"""

    total_users: int
    active_users: int
    total_campaigns: int
    total_revenue: float
    system_health: str
    last_updated: datetime


class SystemOverview(BaseModel):
    """System overview model"""

    database_status: str
    redis_status: str
    celery_status: str
    storage_usage: float
    memory_usage: float
    cpu_usage: float
    last_updated: datetime
