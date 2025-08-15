"""
Unsubscribe Management Models
Handles email unsubscribes, preference centers, and consent management
"""

import enum
from datetime import datetime

from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy import (
    UUID as SQLAlchemyUUID,
)
from sqlalchemy.orm import relationship

from models.base import Base, TimestampMixin, get_uuid_column


class UnsubscribeMethod(enum.Enum):
    """How the user unsubscribed"""

    ONE_CLICK = "one_click"  # List-Unsubscribe header
    LINK_CLICK = "link_click"  # Click on unsubscribe link
    EMAIL_REPLY = "email_reply"  # Reply with unsubscribe request
    MANUAL = "manual"  # Manually added by admin
    API = "api"  # Via API call
    COMPLAINT = "complaint"  # Spam complaint
    BOUNCE = "bounce"  # Hard bounce


class ConsentType(enum.Enum):
    """Types of email consent"""

    MARKETING = "marketing"  # Marketing emails
    TRANSACTIONAL = "transactional"  # Order confirmations, etc.
    NEWSLETTER = "newsletter"  # Newsletter subscriptions
    PROMOTIONAL = "promotional"  # Promotional offers
    UPDATES = "updates"  # Product updates
    NOTIFICATIONS = "notifications"  # System notifications


class UnsubscribeRecord(Base, TimestampMixin):
    """Records when users unsubscribe from emails"""

    __tablename__ = "unsubscribe_records"
    __table_args__ = {"extend_existing": True}

    id = get_uuid_column()

    # Email details
    email_address = Column(String(255), nullable=False, index=True)
    domain = Column(String(255), nullable=False, index=True)

    # Unsubscribe details
    method = Column(String(20), nullable=False)  # UnsubscribeMethod enum
    source_campaign_id = Column(
        SQLAlchemyUUID(as_uuid=True), ForeignKey("campaigns.id"), nullable=True
    )
    source_email_id = Column(String(255), nullable=True)  # Message-ID of email

    # User agent and tracking
    user_agent = Column(String(500), nullable=True)
    ip_address = Column(String(45), nullable=True)
    referer = Column(String(500), nullable=True)

    # Timing
    unsubscribed_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Processing
    processed = Column(Boolean, default=False, nullable=False)
    confirmed = Column(
        Boolean, default=True, nullable=False
    )  # One-click = auto-confirmed

    # Reason (optional feedback)
    reason_category = Column(
        String(50), nullable=True
    )  # 'too_frequent', 'not_relevant', etc.
    reason_text = Column(Text, nullable=True)  # Free-form feedback

    # Additional data
    record_metadata = Column(JSON, nullable=True)

    # Relationships
    source_campaign = relationship(
        "Campaign", foreign_keys=[source_campaign_id]
    )


class EmailPreference(Base, TimestampMixin):
    """User email preferences and consent management"""

    __tablename__ = "email_preferences"
    __table_args__ = {"extend_existing": True}

    id = get_uuid_column()

    # User identification
    email_address = Column(
        String(255), nullable=False, unique=True, index=True
    )
    domain = Column(String(255), nullable=False, index=True)

    # Global preferences
    is_subscribed = Column(Boolean, default=True, nullable=False)
    is_suppressed = Column(
        Boolean, default=False, nullable=False
    )  # Hard suppression

    # Consent types (JSON for flexibility)
    consent_preferences = Column(JSON, nullable=True, default={})

    # Frequency preferences
    max_emails_per_week = Column(Integer, nullable=True)
    preferred_send_time = Column(
        String(20), nullable=True
    )  # "morning", "afternoon", "evening"
    preferred_send_days = Column(
        JSON, nullable=True
    )  # ["monday", "wednesday", "friday"]

    # Personalization preferences
    language_preference = Column(
        String(10), nullable=True
    )  # "en", "es", "fr", etc.
    timezone = Column(String(50), nullable=True)

    # Tracking preferences
    allow_tracking = Column(Boolean, default=True, nullable=False)
    allow_personalization = Column(Boolean, default=True, nullable=False)

    # History tracking
    last_engagement_date = Column(DateTime, nullable=True)
    engagement_score = Column(Integer, default=50, nullable=False)  # 0-100

    # Source tracking
    subscription_source = Column(
        String(100), nullable=True
    )  # "website", "api", "import"
    subscription_date = Column(DateTime, nullable=True)

    # Additional data
    custom_fields = Column(JSON, nullable=True)
    notes = Column(Text, nullable=True)


class UnsubscribeToken(Base, TimestampMixin):
    """Secure tokens for unsubscribe links"""

    __tablename__ = "unsubscribe_tokens"
    __table_args__ = {"extend_existing": True}

    id = get_uuid_column()

    # Token details
    token = Column(String(255), nullable=False, unique=True, index=True)
    email_address = Column(String(255), nullable=False, index=True)

    # Source tracking
    campaign_id = Column(
        SQLAlchemyUUID(as_uuid=True), ForeignKey("campaigns.id"), nullable=True
    )
    message_id = Column(String(255), nullable=True)

    # Security
    is_used = Column(Boolean, default=False, nullable=False)
    used_at = Column(DateTime, nullable=True)
    used_ip = Column(String(45), nullable=True)

    # Expiration
    expires_at = Column(DateTime, nullable=False)

    # Type of unsubscribe
    unsubscribe_type = Column(
        String(20), default="all", nullable=False
    )  # "all", "campaign_type", "specific"
    unsubscribe_scope = Column(JSON, nullable=True)  # Additional scope data

    # Additional data
    token_metadata = Column(JSON, nullable=True)

    # Relationships
    campaign = relationship("Campaign", foreign_keys=[campaign_id])


class PreferenceCenter(Base, TimestampMixin):
    """Preference center configuration"""

    __tablename__ = "preference_centers"
    __table_args__ = {"extend_existing": True}

    id = get_uuid_column()

    # Configuration
    name = Column(String(100), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_default = Column(Boolean, default=False, nullable=False)

    # Appearance
    title = Column(String(200), nullable=True)
    description = Column(Text, nullable=True)
    brand_color = Column(String(7), nullable=True)  # Hex color
    logo_url = Column(String(500), nullable=True)

    # Available options
    available_consent_types = Column(
        JSON, nullable=True
    )  # List of ConsentType values
    allow_frequency_control = Column(Boolean, default=True, nullable=False)
    allow_time_preferences = Column(Boolean, default=True, nullable=False)
    allow_complete_unsubscribe = Column(Boolean, default=True, nullable=False)

    # Custom fields
    custom_questions = Column(
        JSON, nullable=True
    )  # Custom preference questions

    # Legal text
    privacy_policy_url = Column(String(500), nullable=True)
    terms_url = Column(String(500), nullable=True)
    company_address = Column(Text, nullable=True)

    # Configuration
    config = Column(JSON, nullable=True)


class ConsentLog(Base, TimestampMixin):
    """Audit log for consent changes"""

    __tablename__ = "consent_logs"
    __table_args__ = {"extend_existing": True}

    id = get_uuid_column()

    # User identification
    email_address = Column(String(255), nullable=False, index=True)

    # Change details
    action = Column(
        String(50), nullable=False
    )  # 'granted', 'revoked', 'updated'
    consent_type = Column(String(50), nullable=True)  # ConsentType enum
    old_value = Column(JSON, nullable=True)  # Previous consent state
    new_value = Column(JSON, nullable=True)  # New consent state

    # Source tracking
    source = Column(
        String(50), nullable=False
    )  # 'preference_center', 'unsubscribe_link', 'api'
    source_campaign_id = Column(
        SQLAlchemyUUID(as_uuid=True), ForeignKey("campaigns.id"), nullable=True
    )
    source_url = Column(String(500), nullable=True)

    # Technical details
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(500), nullable=True)

    # Processing
    processed_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Additional data
    consent_metadata = Column(JSON, nullable=True)

    # Relationships
    source_campaign = relationship(
        "Campaign", foreign_keys=[source_campaign_id]
    )


class UnsubscribeReasonCategory(Base, TimestampMixin):
    """Predefined unsubscribe reason categories"""

    __tablename__ = "unsubscribe_reason_categories"
    __table_args__ = {"extend_existing": True}

    id = get_uuid_column()

    # Category details
    name = Column(String(100), nullable=False, unique=True)
    display_name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)

    # Ordering and grouping
    sort_order = Column(Integer, default=100, nullable=False)
    category_group = Column(
        String(50), nullable=True
    )  # "frequency", "content", "privacy", etc.

    # Status
    is_active = Column(Boolean, default=True, nullable=False)

    # Usage tracking
    usage_count = Column(Integer, default=0, nullable=False)

    # Configuration
    requires_text_input = Column(Boolean, default=False, nullable=False)
    is_feedback_request = Column(Boolean, default=False, nullable=False)


class GlobalSuppressionList(Base, TimestampMixin):
    """Global suppression list (inherits from bounce suppression)"""

    __tablename__ = "global_suppression_list"
    __table_args__ = {"extend_existing": True}

    id = get_uuid_column()

    # Email details
    email_address = Column(
        String(255), nullable=False, unique=True, index=True
    )
    domain = Column(String(255), nullable=False, index=True)

    # Suppression details
    reason = Column(
        String(50), nullable=False
    )  # 'unsubscribe', 'bounce', 'complaint', 'manual'
    source_type = Column(
        String(50), nullable=False
    )  # 'unsubscribe_record', 'bounce', 'manual'
    source_id = Column(SQLAlchemyUUID(), nullable=True)  # ID of source record

    # Status
    is_active = Column(Boolean, default=True, nullable=False)

    # Additional data
    notes = Column(Text, nullable=True)
    list_metadata = Column(JSON, nullable=True)
