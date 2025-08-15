"""
Chat system models for livechat widget functionality
"""

import uuid
from enum import Enum
from typing import Any

from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UUID,
)
from sqlalchemy import (
    Enum as SQLEnum,
)
from sqlalchemy.orm import relationship, backref
from sqlalchemy.sql import func

from models.base import Base, User


class ChatStatus(str, Enum):
    """Chat session status"""

    PENDING = "pending"
    ACTIVE = "active"
    RESOLVED = "resolved"
    CLOSED = "closed"
    ESCALATED = "escalated"


class MessageType(str, Enum):
    """Chat message types"""

    USER = "user"
    ADMIN = "admin"
    BOT = "bot"
    SYSTEM = "system"


class ChatPriority(str, Enum):
    """Chat priority levels"""

    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    URGENT = "urgent"


class Chat(Base):
    """Main chat session model"""

    __tablename__ = "chats"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True)
    session_id = Column(
        String(100),
        unique=True,
        nullable=False,
        default=lambda: str(uuid.uuid4()),
    )

    # User information
    user_id = Column(
        UUID(), ForeignKey("users.id"), nullable=True
    )  # Registered users
    guest_email = Column(String(255), nullable=True)  # Guest users
    guest_name = Column(String(100), nullable=True)

    # Chat metadata
    subject = Column(String(255), nullable=True)
    status = Column(SQLEnum(ChatStatus), default=ChatStatus.PENDING)
    priority = Column(SQLEnum(ChatPriority), default=ChatPriority.NORMAL)

    # Assignment
    assigned_admin_id = Column(UUID(), ForeignKey("users.id"), nullable=True)

    # Chat context
    page_url = Column(String(500), nullable=True)  # Where chat was initiated
    user_agent = Column(Text, nullable=True)
    ip_address = Column(String(45), nullable=True)
    timezone = Column(String(50), nullable=True)

    # Plan context for feature access
    user_plan = Column(String(50), nullable=True)

    # Timestamps
    started_at = Column(DateTime(timezone=True), default=func.now())
    last_activity = Column(DateTime(timezone=True), default=func.now())
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=func.now())
    updated_at = Column(
        DateTime(timezone=True), default=func.now(), onupdate=func.now()
    )

    # Relationships
    # Define backref here to avoid circular string path issues
    user = relationship(
        "User",
        foreign_keys=[user_id],
        backref=backref("chats", lazy="dynamic"),
    )
    assigned_admin = relationship("User", foreign_keys=[assigned_admin_id])
    messages = relationship(
        "ChatMessage", back_populates="chat", cascade="all, delete-orphan"
    )
    bot_sessions = relationship(
        "ChatBotSession", back_populates="chat", cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<Chat {self.session_id}: {self.status}>"


class ChatMessage(Base):
    """Individual chat messages"""

    __tablename__ = "chat_messages"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True)
    chat_id = Column(Integer, ForeignKey("chats.id"), nullable=False)

    # Message content
    message_type = Column(SQLEnum(MessageType), nullable=False)
    content = Column(Text, nullable=False)

    # Sender information
    sender_id = Column(
        UUID(), ForeignKey("users.id"), nullable=True
    )  # For admin/user messages
    sender_name = Column(String(100), nullable=True)  # Display name

    # Message metadata
    is_read = Column(Boolean, default=False)
    is_internal = Column(Boolean, default=False)  # Internal admin notes

    # AI/Bot related
    bot_response_id = Column(
        String(100), nullable=True
    )  # Reference to bot response
    bot_confidence = Column(
        Integer, nullable=True
    )  # AI confidence score 0-100

    # Timestamps
    created_at = Column(DateTime(timezone=True), default=func.now())
    read_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    chat = relationship("Chat", back_populates="messages")
    sender = relationship("User", foreign_keys=[sender_id])

    def __repr__(self):
        return f"<ChatMessage {self.id}: {self.message_type}>"


class ChatBotSession(Base):
    """AI chatbot session for automated responses"""

    __tablename__ = "chat_bot_sessions"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True)
    chat_id = Column(Integer, ForeignKey("chats.id"), nullable=False)

    # Bot configuration
    bot_name = Column(String(100), default="MailerSuite Assistant")
    bot_model = Column(String(50), default="gpt-4o-mini")  # AI model used

    # Session state
    is_active = Column(Boolean, default=True)
    context_messages = Column(
        JSON, default=lambda: []
    )  # Conversation context for AI
    user_data = Column(JSON, default=lambda: {})  # Extracted user information
    intent_analysis = Column(JSON, default=lambda: {})  # Detected user intents

    # Learning data
    conversation_summary = Column(Text, nullable=True)
    resolved_issues = Column(JSON, default=lambda: [])
    escalation_triggers = Column(JSON, default=lambda: [])

    # Performance metrics
    total_responses = Column(Integer, default=0)
    successful_responses = Column(Integer, default=0)
    escalations = Column(Integer, default=0)

    # Timestamps
    created_at = Column(DateTime(timezone=True), default=func.now())
    updated_at = Column(
        DateTime(timezone=True), default=func.now(), onupdate=func.now()
    )
    last_response_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    chat = relationship("Chat", back_populates="bot_sessions")

    def get_context_messages(self) -> list[dict[str, Any]]:
        """Safely get context messages as list"""
        return self.context_messages or []

    def add_context_message(self, message: dict[str, Any]) -> None:
        """Add a message to context"""
        messages = self.get_context_messages()
        messages.append(message)
        self.context_messages = messages

    def get_user_data(self) -> dict[str, Any]:
        """Safely get user data as dict"""
        return self.user_data or {}

    def update_user_data(self, data: dict[str, Any]) -> None:
        """Update user data"""
        current_data = self.get_user_data()
        current_data.update(data)
        self.user_data = current_data

    def get_intent_analysis(self) -> dict[str, int]:
        """Safely get intent analysis as dict"""
        return self.intent_analysis or {}

    def increment_intent(self, intent: str) -> None:
        """Increment intent counter"""
        analysis = self.get_intent_analysis()
        analysis[intent] = analysis.get(intent, 0) + 1
        self.intent_analysis = analysis

    def get_resolved_issues(self) -> list[dict[str, Any]]:
        """Safely get resolved issues as list"""
        return self.resolved_issues or []

    def add_resolved_issue(self, issue: dict[str, Any]) -> None:
        """Add a resolved issue"""
        issues = self.get_resolved_issues()
        issues.append(issue)
        self.resolved_issues = issues

    def get_escalation_triggers(self) -> list[dict[str, Any]]:
        """Safely get escalation triggers as list"""
        return self.escalation_triggers or []

    def add_escalation_trigger(self, trigger: dict[str, Any]) -> None:
        """Add an escalation trigger"""
        triggers = self.get_escalation_triggers()
        triggers.append(trigger)
        self.escalation_triggers = triggers

    def increment_responses(self) -> None:
        """Increment total responses counter"""
        self.total_responses = (self.total_responses or 0) + 1

    def increment_successful_responses(self) -> None:
        """Increment successful responses counter"""
        self.successful_responses = (self.successful_responses or 0) + 1

    def increment_escalations(self) -> None:
        """Increment escalations counter"""
        self.escalations = (self.escalations or 0) + 1

    def trim_context_messages(self, max_messages: int = 20) -> None:
        """Keep only the most recent context messages"""
        messages = self.get_context_messages()
        if len(messages) > max_messages:
            self.context_messages = messages[-max_messages:]

    def __repr__(self):
        return f"<ChatBotSession {self.id}: {self.bot_name}>"


class ChatTemplate(Base):
    """Predefined chat response templates"""

    __tablename__ = "chat_templates"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True)

    # Template information
    name = Column(String(100), nullable=False)
    category = Column(
        String(50), nullable=False
    )  # "greeting", "support", "sales", etc.
    trigger_keywords = Column(
        JSON, default=list
    )  # Keywords that trigger this template

    # Content
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    variables = Column(
        JSON, default=list
    )  # Template variables like {user_name}

    # Conditions
    user_plans = Column(
        JSON, default=list
    )  # Which plans can see this template
    page_urls = Column(
        JSON, default=list
    )  # URL patterns where template applies

    # Metadata
    is_active = Column(Boolean, default=True)
    sort_order = Column(Integer, default=0)
    usage_count = Column(Integer, default=0)

    # Timestamps
    created_at = Column(DateTime(timezone=True), default=func.now())
    updated_at = Column(
        DateTime(timezone=True), default=func.now(), onupdate=func.now()
    )

    def __repr__(self):
        return f"<ChatTemplate {self.name}: {self.category}>"


class ChatAnalytics(Base):
    """Chat analytics and metrics"""

    __tablename__ = "chat_analytics"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True)

    # Time period
    date = Column(DateTime(timezone=True), nullable=False)
    period_type = Column(String(20), default="daily")  # daily, weekly, monthly

    # Chat metrics
    total_chats = Column(Integer, default=0)
    resolved_chats = Column(Integer, default=0)
    escalated_chats = Column(Integer, default=0)
    abandoned_chats = Column(Integer, default=0)

    # Response metrics
    avg_response_time = Column(Integer, default=0)  # Seconds
    avg_resolution_time = Column(Integer, default=0)  # Seconds
    bot_response_rate = Column(Integer, default=0)  # Percentage
    bot_success_rate = Column(Integer, default=0)  # Percentage

    # User metrics
    new_users = Column(Integer, default=0)
    returning_users = Column(Integer, default=0)
    guest_users = Column(Integer, default=0)

    # Plan breakdown
    plan_breakdown = Column(JSON, default=dict)  # Chat counts by plan

    # Timestamps
    created_at = Column(DateTime(timezone=True), default=func.now())
    updated_at = Column(
        DateTime(timezone=True), default=func.now(), onupdate=func.now()
    )

    def __repr__(self):
        return f"<ChatAnalytics {self.date}: {self.total_chats} chats>"
