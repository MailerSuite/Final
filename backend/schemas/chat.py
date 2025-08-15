"""
Pydantic schemas for chat system API operations
"""

from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, EmailStr, Field, validator


# Enums matching the database models
class ChatStatus(str, Enum):
    PENDING = "pending"
    ACTIVE = "active"
    RESOLVED = "resolved"
    CLOSED = "closed"
    ESCALATED = "escalated"


class MessageType(str, Enum):
    USER = "user"
    ADMIN = "admin"
    BOT = "bot"
    SYSTEM = "system"


class ChatPriority(str, Enum):
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    URGENT = "urgent"


# Base schemas
class ChatMessageBase(BaseModel):
    content: str = Field(..., min_length=1, max_length=5000)
    message_type: MessageType
    is_internal: bool = False


class ChatMessageCreate(ChatMessageBase):
    sender_name: str | None = None


class ChatMessageResponse(ChatMessageBase):
    id: int
    chat_id: int
    sender_id: int | None = None
    sender_name: str | None = None
    is_read: bool = False
    bot_response_id: str | None = None
    bot_confidence: int | None = None
    created_at: datetime
    read_at: datetime | None = None

    class Config:
        from_attributes = True


# Chat session schemas
class ChatSessionCreate(BaseModel):
    guest_email: EmailStr | None = None
    guest_name: str | None = Field(None, max_length=100)
    subject: str | None = Field(None, max_length=255)
    page_url: str | None = Field(None, max_length=500)
    user_agent: str | None = None
    timezone: str | None = None
    initial_message: str | None = Field(None, min_length=1, max_length=5000)

    @validator("guest_name")
    def validate_guest_name(cls, v):
        if v and len(v.strip()) == 0:
            return None
        return v


class ChatSessionResponse(BaseModel):
    id: int
    session_id: str
    user_id: int | None = None
    guest_email: str | None = None
    guest_name: str | None = None
    subject: str | None = None
    status: ChatStatus
    priority: ChatPriority
    assigned_admin_id: int | None = None
    page_url: str | None = None
    user_plan: str | None = None
    started_at: datetime
    last_activity: datetime
    resolved_at: datetime | None = None
    message_count: int = 0
    unread_messages: int = 0
    is_online: bool = False  # Admin online status

    class Config:
        from_attributes = True


class ChatSessionUpdate(BaseModel):
    status: ChatStatus | None = None
    priority: ChatPriority | None = None
    assigned_admin_id: int | None = None
    subject: str | None = Field(None, max_length=255)


# Chat widget specific schemas
class ChatWidgetStatus(BaseModel):
    is_available: bool
    admin_online: bool
    estimated_response_time: str | None = None
    queue_position: int | None = None
    bot_enabled: bool = True
    greeting_message: str = "How can we help you today?"


class ChatWidgetConfig(BaseModel):
    title: str = "Live Chat Support"
    subtitle: str = "We're here to help!"
    primary_color: str = "#EF4444"
    bot_name: str = "SGPT Assistant"
    allowed_file_types: list[str] = ["jpg", "jpeg", "png", "pdf", "txt"]
    max_file_size_mb: int = 5
    show_agent_typing: bool = True
    enable_emoji: bool = True
    enable_file_upload: bool = True


# Bot related schemas
class BotResponse(BaseModel):
    content: str
    confidence: int = Field(..., ge=0, le=100)
    suggested_actions: list[str] = []
    requires_escalation: bool = False
    detected_intent: str | None = None
    extracted_data: dict[str, Any] = {}


class BotTrainingData(BaseModel):
    user_message: str
    correct_response: str
    intent: str | None = None
    context: dict[str, Any] = {}


# Template schemas
class ChatTemplateCreate(BaseModel):
    name: str = Field(..., max_length=100)
    category: str = Field(..., max_length=50)
    title: str = Field(..., max_length=255)
    content: str = Field(..., min_length=1)
    trigger_keywords: list[str] = []
    variables: list[str] = []
    user_plans: list[str] = []
    page_urls: list[str] = []
    sort_order: int = 0


class ChatTemplateResponse(ChatTemplateCreate):
    id: int
    is_active: bool
    usage_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ChatTemplateUpdate(BaseModel):
    name: str | None = Field(None, max_length=100)
    category: str | None = Field(None, max_length=50)
    title: str | None = Field(None, max_length=255)
    content: str | None = Field(None, min_length=1)
    trigger_keywords: list[str] | None = None
    variables: list[str] | None = None
    user_plans: list[str] | None = None
    page_urls: list[str] | None = None
    is_active: bool | None = None
    sort_order: int | None = None


# Analytics schemas
class ChatAnalyticsResponse(BaseModel):
    date: datetime
    period_type: str
    total_chats: int
    resolved_chats: int
    escalated_chats: int
    abandoned_chats: int
    avg_response_time: int
    avg_resolution_time: int
    bot_response_rate: int
    bot_success_rate: int
    new_users: int
    returning_users: int
    guest_users: int
    plan_breakdown: dict[str, int]

    class Config:
        from_attributes = True


class ChatAnalyticsRequest(BaseModel):
    start_date: datetime
    end_date: datetime
    period_type: str = Field("daily", pattern="^(daily|weekly|monthly)$")
    group_by_plan: bool = False


# Admin management schemas
class AdminChatListResponse(BaseModel):
    chats: list[ChatSessionResponse]
    total: int
    page: int
    size: int
    has_next: bool
    has_previous: bool


class AdminChatFilters(BaseModel):
    status: list[ChatStatus] | None = None
    priority: list[ChatPriority] | None = None
    assigned_admin_id: int | None = None
    user_plan: list[str] | None = None
    start_date: datetime | None = None
    end_date: datetime | None = None
    search_query: str | None = None


class AdminActionRequest(BaseModel):
    action: str = Field(
        ..., pattern="^(assign|resolve|escalate|close|transfer)$"
    )
    admin_id: int | None = None
    note: str | None = None


# Real-time event schemas
class ChatEvent(BaseModel):
    event_type: str
    chat_id: int
    session_id: str
    data: dict[str, Any] = {}
    timestamp: datetime = Field(default_factory=datetime.now)


class TypingIndicator(BaseModel):
    is_typing: bool
    user_type: str = Field(..., pattern="^(user|admin|bot)$")
    session_id: str


class OnlineStatus(BaseModel):
    is_online: bool
    user_id: int | None = None
    user_type: str = Field(..., pattern="^(admin|user)$")
    last_seen: datetime | None = None


# Plan-based feature schemas
class ChatFeatureAccess(BaseModel):
    can_initiate_chat: bool = True
    can_upload_files: bool = False
    priority_support: bool = False
    dedicated_agent: bool = False
    chat_history_retention_days: int = 30
    max_concurrent_chats: int = 1
    estimated_response_time: str = "Within 24 hours"


class PlanChatLimits(BaseModel):
    plan_code: str
    max_monthly_chats: int | None = None
    current_month_chats: int = 0
    feature_access: ChatFeatureAccess
    upgrade_required_for: list[str] = []


# Error schemas
class ChatErrorResponse(BaseModel):
    error: str
    code: str
    message: str
    details: dict[str, Any] | None = None


# Batch operation schemas
class BatchMessageSend(BaseModel):
    chat_ids: list[int]
    message: str
    message_type: MessageType = MessageType.ADMIN
    is_internal: bool = False


class BatchChatUpdate(BaseModel):
    chat_ids: list[int]
    updates: ChatSessionUpdate


# Integration schemas for existing user context
class UserContextData(BaseModel):
    user_id: int | None = None
    email: str | None = None
    username: str | None = None
    plan_code: str | None = None
    is_admin: bool = False
    timezone: str | None = None
    registration_date: datetime | None = None
    last_login: datetime | None = None


# Webhook schemas for external integrations
class ChatWebhookPayload(BaseModel):
    event: str
    chat_session: ChatSessionResponse
    message: ChatMessageResponse | None = None
    metadata: dict[str, Any] = {}
    timestamp: datetime = Field(default_factory=datetime.now)
