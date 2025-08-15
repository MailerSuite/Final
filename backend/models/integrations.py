"""
Integration Framework Models
Handles connections to external platforms (CRM, E-commerce, Analytics)
"""

import uuid

from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from .base import Base


class IntegrationProvider(Base):
    """Available integration providers/platforms"""

    __tablename__ = "integration_providers"

    id = Column(
        UUID(), primary_key=True, default=uuid.uuid4
    )

    # Provider details
    name = Column(
        String(100), nullable=False, unique=True
    )  # "Salesforce", "HubSpot", "Shopify", etc.
    display_name = Column(
        String(100), nullable=False
    )  # "Salesforce CRM", "HubSpot Marketing"
    description = Column(Text, nullable=True)
    category = Column(
        String(50), nullable=False
    )  # "crm", "ecommerce", "analytics", "marketing"

    # Integration configuration
    auth_type = Column(
        String(30), nullable=False
    )  # "oauth2", "api_key", "basic_auth", "webhook"
    auth_config = Column(
        JSON, nullable=False, default={}
    )  # Provider-specific auth configuration
    api_base_url = Column(String(255), nullable=True)
    api_version = Column(String(20), nullable=True)

    # Capabilities
    supported_actions = Column(
        JSON, nullable=False, default=[]
    )  # ["sync_contacts", "create_lead", "track_event"]
    supported_data_types = Column(
        JSON, nullable=False, default=[]
    )  # ["contacts", "leads", "orders", "events"]
    webhook_support = Column(Boolean, default=False)
    real_time_sync = Column(Boolean, default=False)

    # Configuration schema
    config_schema = Column(
        JSON, nullable=False, default={}
    )  # JSON schema for validation
    required_fields = Column(
        JSON, nullable=False, default=[]
    )  # Required configuration fields

    # Metadata
    logo_url = Column(String(255), nullable=True)
    documentation_url = Column(String(255), nullable=True)
    setup_instructions = Column(Text, nullable=True)

    # Availability
    is_active = Column(Boolean, default=True)
    is_premium = Column(Boolean, default=False)  # Requires premium plan
    plan_requirements = Column(
        JSON, nullable=True
    )  # Plan codes that can use this integration

    # Usage tracking
    usage_count = Column(Integer, default=0)

    # Timestamps
    created_at = Column(DateTime(timezone=True), default=func.now())
    updated_at = Column(
        DateTime(timezone=True), default=func.now(), onupdate=func.now()
    )

    # Relationships
    integrations = relationship(
        "Integration", back_populates="provider", cascade="all, delete-orphan"
    )


class Integration(Base):
    """User's configured integrations"""

    __tablename__ = "integrations"

    id = Column(
        UUID(), primary_key=True, default=uuid.uuid4
    )
    session_id = Column(
        UUID(),
        ForeignKey("sessions.id", ondelete="CASCADE"),
        nullable=False,
    )
    provider_id = Column(
        UUID(),
        ForeignKey("integration_providers.id", ondelete="CASCADE"),
        nullable=False,
    )

    # Integration details
    name = Column(String(255), nullable=False)  # User-defined name
    description = Column(Text, nullable=True)

    # Authentication
    auth_data = Column(
        JSON, nullable=False, default={}
    )  # Encrypted auth tokens/keys
    auth_expires_at = Column(DateTime(timezone=True), nullable=True)
    refresh_token = Column(Text, nullable=True)  # For OAuth2

    # Configuration
    config = Column(
        JSON, nullable=False, default={}
    )  # Integration-specific configuration
    field_mappings = Column(
        JSON, nullable=False, default={}
    )  # Field mapping configuration
    sync_settings = Column(
        JSON, nullable=False, default={}
    )  # Sync frequency, filters, etc.

    # Status
    status = Column(
        String(20), nullable=False, default="active"
    )  # "active", "paused", "error", "disconnected"
    last_sync_at = Column(DateTime(timezone=True), nullable=True)
    last_error = Column(Text, nullable=True)
    sync_frequency = Column(
        String(20), nullable=False, default="manual"
    )  # "manual", "hourly", "daily", "weekly"

    # Statistics
    total_syncs = Column(Integer, default=0)
    successful_syncs = Column(Integer, default=0)
    failed_syncs = Column(Integer, default=0)
    last_sync_duration = Column(Float, nullable=True)  # Duration in seconds
    records_synced = Column(Integer, default=0)

    # Webhook configuration
    webhook_url = Column(String(255), nullable=True)
    webhook_secret = Column(String(255), nullable=True)
    webhook_events = Column(JSON, nullable=True)  # Events to listen for

    # Metadata
    tags = Column(JSON, nullable=True)  # User-defined tags
    notes = Column(Text, nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), default=func.now())
    updated_at = Column(
        DateTime(timezone=True), default=func.now(), onupdate=func.now()
    )

    # Relationships
    provider = relationship(
        "IntegrationProvider", back_populates="integrations"
    )
    sync_logs = relationship(
        "IntegrationSyncLog",
        back_populates="integration",
        cascade="all, delete-orphan",
    )
    field_maps = relationship(
        "IntegrationFieldMap",
        back_populates="integration",
        cascade="all, delete-orphan",
    )


class IntegrationSyncLog(Base):
    """Logs of integration sync operations"""

    __tablename__ = "integration_sync_logs"

    id = Column(
        UUID(), primary_key=True, default=uuid.uuid4
    )
    integration_id = Column(
        UUID(),
        ForeignKey("integrations.id", ondelete="CASCADE"),
        nullable=False,
    )

    # Sync details
    sync_type = Column(
        String(50), nullable=False
    )  # "manual", "scheduled", "webhook", "real_time"
    sync_direction = Column(
        String(20), nullable=False
    )  # "inbound", "outbound", "bidirectional"
    data_type = Column(
        String(50), nullable=False
    )  # "contacts", "leads", "orders", "events", etc.

    # Status and timing
    status = Column(
        String(20), nullable=False
    )  # "started", "running", "completed", "failed", "cancelled"
    started_at = Column(DateTime(timezone=True), default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    duration = Column(Float, nullable=True)  # Duration in seconds

    # Results
    records_processed = Column(Integer, default=0)
    records_created = Column(Integer, default=0)
    records_updated = Column(Integer, default=0)
    records_deleted = Column(Integer, default=0)
    records_failed = Column(Integer, default=0)

    # Error handling
    error_message = Column(Text, nullable=True)
    error_details = Column(JSON, nullable=True)
    retry_count = Column(Integer, default=0)

    # Data
    sync_summary = Column(JSON, nullable=True)  # Summary of sync operation
    processed_data = Column(
        JSON, nullable=True
    )  # Sample of processed data (for debugging)

    # Timestamps
    created_at = Column(DateTime(timezone=True), default=func.now())

    # Relationships
    integration = relationship("Integration", back_populates="sync_logs")


class IntegrationFieldMap(Base):
    """Field mappings between SGPT and external platforms"""

    __tablename__ = "integration_field_maps"

    id = Column(
        UUID(), primary_key=True, default=uuid.uuid4
    )
    integration_id = Column(
        UUID(),
        ForeignKey("integrations.id", ondelete="CASCADE"),
        nullable=False,
    )

    # Mapping details
    source_field = Column(String(255), nullable=False)  # SGPT field name
    target_field = Column(
        String(255), nullable=False
    )  # External platform field name
    field_type = Column(
        String(50), nullable=False
    )  # "string", "email", "phone", "date", "number", "boolean"

    # Mapping configuration
    sync_direction = Column(
        String(20), nullable=False, default="bidirectional"
    )  # "inbound", "outbound", "bidirectional"
    is_required = Column(Boolean, default=False)
    is_unique = Column(Boolean, default=False)

    # Transformation rules
    transform_rules = Column(JSON, nullable=True)  # Data transformation rules
    default_value = Column(String(255), nullable=True)
    validation_rules = Column(JSON, nullable=True)  # Validation rules

    # Status
    is_active = Column(Boolean, default=True)
    last_used_at = Column(DateTime(timezone=True), nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), default=func.now())
    updated_at = Column(
        DateTime(timezone=True), default=func.now(), onupdate=func.now()
    )

    # Relationships
    integration = relationship("Integration", back_populates="field_maps")


class IntegrationWebhook(Base):
    """Webhook endpoints for real-time integration updates"""

    __tablename__ = "integration_webhooks"

    id = Column(
        UUID(), primary_key=True, default=uuid.uuid4
    )
    integration_id = Column(
        UUID(),
        ForeignKey("integrations.id", ondelete="CASCADE"),
        nullable=False,
    )

    # Webhook details
    endpoint_url = Column(String(255), nullable=False)
    secret_key = Column(String(255), nullable=False)
    events = Column(
        JSON, nullable=False, default=[]
    )  # Events this webhook listens for

    # Configuration
    http_method = Column(String(10), nullable=False, default="POST")
    headers = Column(JSON, nullable=True)  # Custom headers
    payload_format = Column(
        String(20), nullable=False, default="json"
    )  # "json", "form", "xml"

    # Security
    verify_ssl = Column(Boolean, default=True)
    ip_whitelist = Column(JSON, nullable=True)  # Allowed IP addresses

    # Status and monitoring
    is_active = Column(Boolean, default=True)
    last_triggered_at = Column(DateTime(timezone=True), nullable=True)
    total_triggers = Column(Integer, default=0)
    successful_triggers = Column(Integer, default=0)
    failed_triggers = Column(Integer, default=0)

    # Error handling
    max_retries = Column(Integer, default=3)
    retry_delay = Column(Integer, default=60)  # Seconds between retries
    timeout = Column(Integer, default=30)  # Request timeout in seconds

    # Timestamps
    created_at = Column(DateTime(timezone=True), default=func.now())
    updated_at = Column(
        DateTime(timezone=True), default=func.now(), onupdate=func.now()
    )

    # Relationships
    integration = relationship("Integration")
    webhook_logs = relationship(
        "IntegrationWebhookLog",
        back_populates="webhook",
        cascade="all, delete-orphan",
    )


class IntegrationWebhookLog(Base):
    """Logs of webhook triggers and responses"""

    __tablename__ = "integration_webhook_logs"

    id = Column(
        UUID(), primary_key=True, default=uuid.uuid4
    )
    webhook_id = Column(
        UUID(),
        ForeignKey("integration_webhooks.id", ondelete="CASCADE"),
        nullable=False,
    )

    # Request details
    event_type = Column(String(100), nullable=False)
    payload = Column(JSON, nullable=True)
    headers = Column(JSON, nullable=True)
    source_ip = Column(String(45), nullable=True)

    # Response details
    status_code = Column(Integer, nullable=True)
    response_time = Column(
        Float, nullable=True
    )  # Response time in milliseconds
    response_body = Column(Text, nullable=True)

    # Status
    status = Column(
        String(20), nullable=False
    )  # "success", "failed", "timeout", "retry"
    error_message = Column(Text, nullable=True)

    # Processing
    processed = Column(Boolean, default=False)
    processing_notes = Column(Text, nullable=True)

    # Timestamps
    triggered_at = Column(DateTime(timezone=True), default=func.now())
    processed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    webhook = relationship("IntegrationWebhook", back_populates="webhook_logs")


class IntegrationTemplate(Base):
    """Pre-configured integration templates for common use cases"""

    __tablename__ = "integration_templates"

    id = Column(
        UUID(), primary_key=True, default=uuid.uuid4
    )

    # Template details
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(
        String(50), nullable=False
    )  # "lead_generation", "ecommerce_sync", "analytics_tracking"
    use_case = Column(
        String(100), nullable=False
    )  # "Shopify to SGPT", "Salesforce Lead Sync"

    # Configuration
    provider_requirements = Column(
        JSON, nullable=False, default=[]
    )  # Required providers
    field_mappings = Column(
        JSON, nullable=False, default={}
    )  # Default field mappings
    sync_settings = Column(
        JSON, nullable=False, default={}
    )  # Default sync settings
    webhook_events = Column(JSON, nullable=True)  # Recommended webhook events

    # Template metadata
    difficulty_level = Column(
        String(20), nullable=False, default="beginner"
    )  # "beginner", "intermediate", "advanced"
    estimated_setup_time = Column(Integer, nullable=True)  # Minutes
    tags = Column(JSON, nullable=True)

    # Assets
    icon = Column(String(255), nullable=True)
    documentation_url = Column(String(255), nullable=True)
    tutorial_url = Column(String(255), nullable=True)

    # Usage tracking
    usage_count = Column(Integer, default=0)
    rating = Column(Float, nullable=True)  # Average user rating

    # Status
    is_active = Column(Boolean, default=True)
    is_featured = Column(Boolean, default=False)
    is_premium = Column(Boolean, default=False)

    # Timestamps
    created_at = Column(DateTime(timezone=True), default=func.now())
    updated_at = Column(
        DateTime(timezone=True), default=func.now(), onupdate=func.now()
    )


class IntegrationUsage(Base):
    """Tracks integration usage and performance metrics"""

    __tablename__ = "integration_usage"

    id = Column(
        UUID(), primary_key=True, default=uuid.uuid4
    )
    integration_id = Column(
        UUID(),
        ForeignKey("integrations.id", ondelete="CASCADE"),
        nullable=False,
    )

    # Usage metrics
    date = Column(DateTime(timezone=True), nullable=False)
    api_calls = Column(Integer, default=0)
    data_transferred = Column(Integer, default=0)  # Bytes
    records_processed = Column(Integer, default=0)
    sync_duration = Column(Float, default=0)  # Total sync time in seconds

    # Performance metrics
    avg_response_time = Column(
        Float, nullable=True
    )  # Average API response time
    error_rate = Column(Float, default=0)  # Percentage of failed requests
    success_rate = Column(
        Float, default=100
    )  # Percentage of successful requests

    # Timestamps
    created_at = Column(DateTime(timezone=True), default=func.now())

    # Relationships
    integration = relationship("Integration")
