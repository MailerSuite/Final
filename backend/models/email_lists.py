"""
Email List Management Models
Enhanced models for list management, subscribers, and segmentation
"""

from sqlalchemy import Column, String, Integer, Boolean, DateTime, Text, ForeignKey, Table, JSON, Float
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
import enum
from typing import Dict, Any, List

from .base import Base, get_uuid_column, TimestampMixin, UUID


class SubscriberStatus(enum.Enum):
    ACTIVE = "active"
    UNSUBSCRIBED = "unsubscribed"
    BOUNCED = "bounced"
    PENDING = "pending"
    COMPLAINT = "complaint"


class SegmentOperator(enum.Enum):
    EQUALS = "equals"
    CONTAINS = "contains"
    STARTS_WITH = "starts_with"
    ENDS_WITH = "ends_with"
    GREATER_THAN = "greater_than"
    LESS_THAN = "less_than"
    IN = "in"
    NOT_IN = "not_in"
    IS_NULL = "is_null"
    IS_NOT_NULL = "is_not_null"


# Association table for many-to-many relationship between lists and subscribers
list_subscriber_association = Table(
    'list_subscriber_association',
    Base.metadata,
    Column('list_id', UUID(), ForeignKey('email_lists.id'), primary_key=True),
    Column('subscriber_id', UUID(), ForeignKey('subscribers.id'), primary_key=True),
    Column('joined_at', DateTime(timezone=True), default=func.now()),
    Column('status', String(20), default=SubscriberStatus.ACTIVE.value)
)


class EmailList(Base, TimestampMixin):
    """Enhanced Email List model for subscriber management"""
    
    __tablename__ = "email_lists"
    
    id = get_uuid_column()
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    user_id = Column(UUID(), ForeignKey("users.id"), nullable=False)
    
    # List settings
    is_active = Column(Boolean, default=True, nullable=False)
    is_public = Column(Boolean, default=False, nullable=False)
    
    # Metadata
    # Use JSON for cross-database compatibility (SQLite/PostgreSQL)
    tags = Column(JSON, default=list, nullable=True)
    custom_fields = Column(JSON, default=dict, nullable=True)
    
    # Statistics (cached for performance)
    subscriber_count = Column(Integer, default=0, nullable=False)
    active_subscribers = Column(Integer, default=0, nullable=False)
    unsubscribed_count = Column(Integer, default=0, nullable=False)
    bounced_count = Column(Integer, default=0, nullable=False)
    
    # Performance metrics
    growth_rate = Column(Float, default=0.0, nullable=False)  # Percentage
    engagement_rate = Column(Float, default=0.0, nullable=False)  # Percentage
    
    # List settings
    double_optin_required = Column(Boolean, default=True, nullable=False)
    send_welcome_email = Column(Boolean, default=False, nullable=False)
    welcome_email_template_id = Column(UUID(), nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="email_lists")
    subscribers = relationship(
        "Subscriber", 
        secondary=list_subscriber_association, 
        back_populates="lists",
        lazy="dynamic"
    )
    segments = relationship("Segment", back_populates="email_list", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<EmailList(name={self.name}, subscribers={self.subscriber_count})>"


class Subscriber(Base, TimestampMixin):
    """Enhanced Subscriber model with engagement tracking"""
    
    __tablename__ = "subscribers"
    
    id = get_uuid_column()
    email = Column(String(255), nullable=False, unique=True, index=True)
    user_id = Column(UUID(), ForeignKey("users.id"), nullable=False)
    
    # Personal information
    first_name = Column(String(100), nullable=True)
    last_name = Column(String(100), nullable=True)
    phone = Column(String(20), nullable=True)
    
    # Status and preferences
    status = Column(String(20), default=SubscriberStatus.ACTIVE.value, nullable=False)
    email_verified = Column(Boolean, default=False, nullable=False)
    verified_at = Column(DateTime(timezone=True), nullable=True)
    
    # Engagement tracking
    engagement_score = Column(Float, default=0.0, nullable=False)  # 0-100
    last_activity = Column(DateTime(timezone=True), nullable=True)
    total_opens = Column(Integer, default=0, nullable=False)
    total_clicks = Column(Integer, default=0, nullable=False)
    total_complaints = Column(Integer, default=0, nullable=False)
    
    # Metadata
    # Use JSON for cross-database compatibility (SQLite/PostgreSQL)
    tags = Column(JSON, default=list, nullable=True)
    custom_fields = Column(JSON, default=dict, nullable=True)
    source = Column(String(100), nullable=True)  # Where they subscribed from
    
    # Geographic data
    country = Column(String(2), nullable=True)  # ISO country code
    region = Column(String(100), nullable=True)
    city = Column(String(100), nullable=True)
    timezone = Column(String(50), nullable=True)
    
    # Unsubscribe tracking
    unsubscribed_at = Column(DateTime(timezone=True), nullable=True)
    unsubscribe_reason = Column(String(255), nullable=True)
    bounce_count = Column(Integer, default=0, nullable=False)
    last_bounce_date = Column(DateTime(timezone=True), nullable=True)
    bounce_type = Column(String(20), nullable=True)  # hard, soft, complaint
    
    # Relationships
    user = relationship("User", back_populates="subscribers")
    lists = relationship(
        "EmailList", 
        secondary=list_subscriber_association, 
        back_populates="subscribers",
        lazy="dynamic"
    )
    
    def __repr__(self):
        return f"<Subscriber(email={self.email}, status={self.status})>"


class Segment(Base, TimestampMixin):
    """Advanced segmentation model for targeted campaigns"""
    
    __tablename__ = "segments"
    
    id = get_uuid_column()
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    user_id = Column(UUID(), ForeignKey("users.id"), nullable=False)
    email_list_id = Column(UUID(), ForeignKey("email_lists.id"), nullable=True)  # Can be global
    
    # Segment configuration
    is_active = Column(Boolean, default=True, nullable=False)
    is_dynamic = Column(Boolean, default=True, nullable=False)  # Auto-update based on conditions
    
    # Segment conditions (stored as JSON)
    conditions = Column(JSON, default=list, nullable=False)
    # Example: [
    #   {"field": "engagement_score", "operator": "greater_than", "value": 50},
    #   {"field": "tags", "operator": "contains", "value": "vip"}
    # ]
    
    # Statistics (cached for performance)
    subscriber_count = Column(Integer, default=0, nullable=False)
    last_calculated = Column(DateTime(timezone=True), nullable=True)
    
    # Performance tracking
    avg_engagement = Column(Float, default=0.0, nullable=False)
    conversion_rate = Column(Float, default=0.0, nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="segments")
    email_list = relationship("EmailList", back_populates="segments")
    
    def __repr__(self):
        return f"<Segment(name={self.name}, subscribers={self.subscriber_count})>"


class SegmentCondition(Base, TimestampMixin):
    """Individual conditions for advanced segmentation"""
    
    __tablename__ = "segment_conditions"
    
    id = get_uuid_column()
    segment_id = Column(UUID(), ForeignKey("segments.id", ondelete="CASCADE"), nullable=False)
    
    # Condition configuration
    field = Column(String(100), nullable=False)  # subscriber field name
    operator = Column(String(20), nullable=False)  # comparison operator
    value = Column(JSON, nullable=True)  # value to compare against
    
    # Logical operators
    logical_operator = Column(String(10), default="AND", nullable=False)  # AND, OR
    condition_group = Column(Integer, default=0, nullable=False)  # For grouping conditions
    
    # Relationships
    segment = relationship("Segment", backref="segment_conditions")
    
    def __repr__(self):
        return f"<SegmentCondition(field={self.field}, operator={self.operator})>"


class SubscriberActivity(Base, TimestampMixin):
    """Track subscriber activities for engagement scoring"""
    
    __tablename__ = "subscriber_activities"
    
    id = get_uuid_column()
    subscriber_id = Column(UUID(), ForeignKey("subscribers.id", ondelete="CASCADE"), nullable=False)
    campaign_id = Column(UUID(), ForeignKey("campaigns.id", ondelete="SET NULL"), nullable=True)
    
    # Activity details
    activity_type = Column(String(50), nullable=False)  # open, click, unsubscribe, complaint, etc.
    activity_data = Column(JSON, default=dict, nullable=True)  # Additional data
    
    # Context
    email_client = Column(String(100), nullable=True)
    device_type = Column(String(50), nullable=True)  # mobile, desktop, tablet
    location = Column(JSON, nullable=True)  # Geographic data
    
    # Relationships
    subscriber = relationship("Subscriber", backref="activities")
    
    def __repr__(self):
        return f"<SubscriberActivity(type={self.activity_type}, subscriber={self.subscriber_id})>"


class ListImport(Base, TimestampMixin):
    """Track bulk imports for audit and rollback"""
    
    __tablename__ = "list_imports"
    
    id = get_uuid_column()
    user_id = Column(UUID(), ForeignKey("users.id"), nullable=False)
    email_list_id = Column(UUID(), ForeignKey("email_lists.id"), nullable=False)
    
    # Import details
    filename = Column(String(255), nullable=True)
    total_records = Column(Integer, default=0, nullable=False)
    successful_imports = Column(Integer, default=0, nullable=False)
    failed_imports = Column(Integer, default=0, nullable=False)
    duplicate_count = Column(Integer, default=0, nullable=False)
    
    # Status
    status = Column(String(20), default="pending", nullable=False)  # pending, processing, completed, failed
    error_message = Column(Text, nullable=True)
    
    # File processing
    file_path = Column(String(500), nullable=True)
    mapping_config = Column(JSON, default=dict, nullable=True)  # Field mapping configuration
    
    # Relationships
    user = relationship("User")
    email_list = relationship("EmailList")
    
    def __repr__(self):
        return f"<ListImport(status={self.status}, records={self.total_records})>"