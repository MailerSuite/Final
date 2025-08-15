"""
Webhook Database Models
Persistent storage for webhook endpoints, events, and deliveries
"""

import uuid
from datetime import datetime
from typing import Any, Dict

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    JSON,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from models.base import Base, TimestampMixin, get_uuid_column, get_foreign_key_uuid


class WebhookEndpoint(Base, TimestampMixin):
    """Webhook endpoint configuration with persistent storage"""
    
    __tablename__ = "webhook_endpoints"
    __table_args__ = {"extend_existing": True}
    
    id = get_uuid_column()
    url = Column(String(500), nullable=False)
    events = Column(JSON, nullable=False)  # List of event types
    secret = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    retry_count = Column(Integer, default=3, nullable=False)
    timeout_seconds = Column(Integer, default=30, nullable=False)
    user_id = get_foreign_key_uuid("users", nullable=False)
    
    # Performance tracking
    total_deliveries = Column(Integer, default=0)
    successful_deliveries = Column(Integer, default=0)
    failed_deliveries = Column(Integer, default=0)
    last_delivery_at = Column(DateTime(timezone=True), nullable=True)
    average_delivery_time = Column(Integer, default=0)  # milliseconds
    
    # Relationships
    user = relationship("User", back_populates="webhook_endpoints")
    deliveries = relationship("WebhookDelivery", back_populates="endpoint", lazy="dynamic")
    
    # Performance indexes
    __table_args__ = (
        Index("idx_webhook_user_active", "user_id", "is_active"),
        # Avoid GIN on JSON without operator class; fall back to btree on created_at
        Index("idx_webhook_created_at", "created_at"),
        Index("idx_webhook_last_delivery", "last_delivery_at"),
        {"extend_existing": True},
    )


class WebhookEvent(Base, TimestampMixin):
    """Webhook event data with persistent storage"""
    
    __tablename__ = "webhook_events"
    __table_args__ = {"extend_existing": True}
    
    id = get_uuid_column()
    event_type = Column(String(100), nullable=False, index=True)
    timestamp = Column(DateTime(timezone=True), nullable=False, index=True)
    data = Column(JSON, nullable=False)
    user_id = get_foreign_key_uuid("users", nullable=True)
    retry_count = Column(Integer, default=0, nullable=False)
    
    # Event processing status
    is_processed = Column(Boolean, default=False, nullable=False)
    processing_started_at = Column(DateTime(timezone=True), nullable=True)
    processing_completed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="webhook_events")
    deliveries = relationship("WebhookDelivery", back_populates="event", lazy="dynamic")
    
    # Performance indexes
    __table_args__ = (
        Index("idx_webhook_event_type_timestamp", "event_type", "timestamp"),
        Index("idx_webhook_event_user", "user_id", "timestamp"),
        Index("idx_webhook_event_processed", "is_processed", "timestamp"),
        {"extend_existing": True},
    )


class WebhookDelivery(Base, TimestampMixin):
    """Webhook delivery record with persistent storage"""
    
    __tablename__ = "webhook_deliveries"
    __table_args__ = {"extend_existing": True}
    
    id = get_uuid_column()
    webhook_id = get_foreign_key_uuid("webhook_endpoints", nullable=False)
    event_id = get_foreign_key_uuid("webhook_events", nullable=False)
    url = Column(String(500), nullable=False)
    status_code = Column(Integer, nullable=True)
    response_body = Column(Text, nullable=True)
    delivery_time = Column(DateTime(timezone=True), nullable=True)
    error_message = Column(Text, nullable=True)
    retry_count = Column(Integer, default=0, nullable=False)
    
    # Performance metrics
    request_duration_ms = Column(Integer, nullable=True)  # Time taken for HTTP request
    payload_size_bytes = Column(Integer, nullable=True)   # Size of payload sent
    response_size_bytes = Column(Integer, nullable=True)  # Size of response received
    
    # Delivery status
    is_successful = Column(Boolean, default=False, nullable=False)
    next_retry_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    endpoint = relationship("WebhookEndpoint", back_populates="deliveries")
    event = relationship("WebhookEvent", back_populates="deliveries")
    
    # Performance indexes
    __table_args__ = (
        Index("idx_webhook_delivery_webhook", "webhook_id", "created_at"),
        Index("idx_webhook_delivery_event", "event_id", "created_at"),
        Index("idx_webhook_delivery_status", "is_successful", "created_at"),
        Index("idx_webhook_delivery_retry", "next_retry_at", "retry_count"),
        Index("idx_webhook_delivery_status_code", "status_code", "created_at"),
        {"extend_existing": True},
    )


class WebhookStats(Base, TimestampMixin):
    """Aggregated webhook statistics for performance optimization"""
    
    __tablename__ = "webhook_stats"
    __table_args__ = {"extend_existing": True}
    
    id = get_uuid_column()
    user_id = get_foreign_key_uuid("users", nullable=False)
    webhook_id = get_foreign_key_uuid("webhook_endpoints", nullable=True)
    
    # Time period
    period_start = Column(DateTime(timezone=True), nullable=False, index=True)
    period_end = Column(DateTime(timezone=True), nullable=False, index=True)
    period_type = Column(String(20), nullable=False)  # hourly, daily, weekly, monthly
    
    # Aggregated metrics
    total_deliveries = Column(Integer, default=0, nullable=False)
    successful_deliveries = Column(Integer, default=0, nullable=False)
    failed_deliveries = Column(Integer, default=0, nullable=False)
    average_delivery_time_ms = Column(Integer, default=0, nullable=False)
    success_rate = Column(Integer, default=0, nullable=False)  # Percentage
    
    # Error breakdown
    error_counts = Column(JSON, nullable=True)  # {"timeout": 5, "connection_error": 3}
    
    # Performance indexes
    __table_args__ = (
        Index("idx_webhook_stats_user_period", "user_id", "period_start", "period_end"),
        Index("idx_webhook_stats_webhook_period", "webhook_id", "period_start", "period_end"),
        Index("idx_webhook_stats_period_type", "period_type", "period_start"),
        {"extend_existing": True},
    )