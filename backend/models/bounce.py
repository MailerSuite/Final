"""
Bounce Processing Models
Handles email bounces, suppressions, and deliverability tracking
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


class BounceType(enum.Enum):
    """Types of email bounces"""

    HARD = "hard"  # Permanent failure
    SOFT = "soft"  # Temporary failure
    BLOCK = "block"  # Blocked by recipient
    COMPLAINT = "complaint"  # Spam complaint
    UNKNOWN = "unknown"  # Could not determine type


class BounceReason(enum.Enum):
    """Specific bounce reasons"""

    MAILBOX_FULL = "mailbox_full"
    INVALID_ADDRESS = "invalid_address"
    DOMAIN_NOT_FOUND = "domain_not_found"
    MAILBOX_NOT_FOUND = "mailbox_not_found"
    MESSAGE_TOO_LARGE = "message_too_large"
    CONTENT_REJECTED = "content_rejected"
    POLICY_VIOLATION = "policy_violation"
    SPAM_DETECTED = "spam_detected"
    REPUTATION_ISSUES = "reputation_issues"
    RATE_LIMITED = "rate_limited"
    AUTH_FAILED = "auth_failed"
    OTHER = "other"


class EmailBounce(Base, TimestampMixin):
    """Records individual email bounces"""

    __tablename__ = "email_bounces"
    __table_args__ = {"extend_existing": True}

    id = get_uuid_column()

    # Email details
    email_address = Column(String(255), nullable=False, index=True)
    campaign_id = Column(
        SQLAlchemyUUID(as_uuid=True), ForeignKey("campaigns.id"), nullable=True
    )
    message_id = Column(String(255), nullable=True)

    # Bounce details
    bounce_type = Column(String(20), nullable=False)  # BounceType enum
    bounce_reason = Column(String(50), nullable=True)  # BounceReason enum
    bounce_code = Column(String(10), nullable=True)  # SMTP status code
    bounce_message = Column(Text, nullable=True)  # Full bounce message

    # Timing
    sent_at = Column(DateTime, nullable=True)
    bounced_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Source tracking
    smtp_account_id = Column(
        SQLAlchemyUUID(as_uuid=True),
        ForeignKey("smtp_accounts.id"),
        nullable=True,
    )
    sending_ip = Column(String(45), nullable=True)  # IPv4/IPv6

    # Processing
    processed = Column(Boolean, default=False, nullable=False)
    suppressed = Column(Boolean, default=False, nullable=False)

    # Raw data
    raw_bounce_data = Column(JSON, nullable=True)

    # Relationships
    campaign = relationship("Campaign", foreign_keys=[campaign_id])
    smtp_account = relationship("SMTPAccount", foreign_keys=[smtp_account_id])


class SuppressionList(Base, TimestampMixin):
    """Global suppression list for bounced/unsubscribed emails"""

    __tablename__ = "suppression_list"
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
    )  # 'bounce', 'unsubscribe', 'complaint', 'manual'
    suppression_type = Column(
        String(20), nullable=False
    )  # 'permanent', 'temporary', 'complaint'

    # Source tracking
    source_campaign_id = Column(
        SQLAlchemyUUID(as_uuid=True), ForeignKey("campaigns.id"), nullable=True
    )
    source_bounce_id = Column(
        SQLAlchemyUUID(as_uuid=True),
        ForeignKey("email_bounces.id"),
        nullable=True,
    )

    # Bounce specific data
    bounce_count = Column(Integer, default=0, nullable=False)
    hard_bounce_count = Column(Integer, default=0, nullable=False)
    soft_bounce_count = Column(Integer, default=0, nullable=False)
    last_bounce_date = Column(DateTime, nullable=True)

    # Unsubscribe specific data
    unsubscribed_at = Column(DateTime, nullable=True)
    unsubscribe_method = Column(
        String(50), nullable=True
    )  # 'link', 'reply', 'manual', 'api'

    # Status
    is_active = Column(Boolean, default=True, nullable=False)
    expires_at = Column(DateTime, nullable=True)  # For temporary suppressions

    # Additional data
    notes = Column(Text, nullable=True)
    bounce_metadata = Column(JSON, nullable=True)

    # Relationships
    source_campaign = relationship(
        "Campaign", foreign_keys=[source_campaign_id]
    )
    source_bounce = relationship(
        "EmailBounce", foreign_keys=[source_bounce_id]
    )


class BounceRule(Base, TimestampMixin):
    """Rules for automatic bounce processing"""

    __tablename__ = "bounce_rules"
    __table_args__ = {"extend_existing": True}

    id = get_uuid_column()

    # Rule identification
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    # Matching criteria
    smtp_code_pattern = Column(
        String(50), nullable=True
    )  # e.g., "5.*", "4.2.*"
    message_pattern = Column(String(255), nullable=True)  # Regex pattern
    domain_pattern = Column(String(255), nullable=True)  # Domain regex

    # Classification
    bounce_type = Column(String(20), nullable=False)  # BounceType enum
    bounce_reason = Column(String(50), nullable=True)  # BounceReason enum

    # Actions
    auto_suppress = Column(Boolean, default=False, nullable=False)
    suppress_after_count = Column(
        Integer, nullable=True
    )  # Suppress after N bounces
    suppression_duration_days = Column(
        Integer, nullable=True
    )  # Days to suppress (null = permanent)

    # Priority and metadata
    priority = Column(
        Integer, default=100, nullable=False
    )  # Lower = higher priority
    rule_metadata = Column(JSON, nullable=True)


class DeliverabilityStats(Base, TimestampMixin):
    """Aggregate deliverability statistics"""

    __tablename__ = "deliverability_stats"
    __table_args__ = {"extend_existing": True}

    id = get_uuid_column()

    # Time period
    date = Column(DateTime, nullable=False, index=True)
    period_type = Column(
        String(20), nullable=False
    )  # 'hour', 'day', 'week', 'month'

    # Scope
    campaign_id = Column(
        SQLAlchemyUUID(as_uuid=True), ForeignKey("campaigns.id"), nullable=True
    )
    smtp_account_id = Column(
        SQLAlchemyUUID(as_uuid=True),
        ForeignKey("smtp_accounts.id"),
        nullable=True,
    )
    domain = Column(String(255), nullable=True)

    # Sending stats
    emails_sent = Column(Integer, default=0, nullable=False)
    emails_delivered = Column(Integer, default=0, nullable=False)

    # Bounce stats
    total_bounces = Column(Integer, default=0, nullable=False)
    hard_bounces = Column(Integer, default=0, nullable=False)
    soft_bounces = Column(Integer, default=0, nullable=False)
    complaint_bounces = Column(Integer, default=0, nullable=False)

    # Engagement stats
    emails_opened = Column(Integer, default=0, nullable=False)
    emails_clicked = Column(Integer, default=0, nullable=False)
    unsubscribes = Column(Integer, default=0, nullable=False)

    # Calculated rates
    delivery_rate = Column(String(10), nullable=True)  # Percentage as string
    bounce_rate = Column(String(10), nullable=True)
    hard_bounce_rate = Column(String(10), nullable=True)
    complaint_rate = Column(String(10), nullable=True)
    open_rate = Column(String(10), nullable=True)
    click_rate = Column(String(10), nullable=True)
    unsubscribe_rate = Column(String(10), nullable=True)

    # Additional metrics
    stats_metadata = Column(JSON, nullable=True)

    # Relationships
    campaign = relationship("Campaign", foreign_keys=[campaign_id])
    smtp_account = relationship("SMTPAccount", foreign_keys=[smtp_account_id])


class FeedbackLoop(Base, TimestampMixin):
    """ISP Feedback Loop processing"""

    __tablename__ = "feedback_loops"
    __table_args__ = {"extend_existing": True}

    id = get_uuid_column()

    # ISP details
    isp_name = Column(
        String(100), nullable=False
    )  # 'gmail', 'yahoo', 'outlook', etc.
    feedback_type = Column(
        String(50), nullable=False
    )  # 'abuse', 'fraud', 'other'

    # Email details
    original_message_id = Column(String(255), nullable=True)
    reported_email = Column(String(255), nullable=False, index=True)
    campaign_id = Column(
        SQLAlchemyUUID(as_uuid=True), ForeignKey("campaigns.id"), nullable=True
    )

    # Timing
    sent_at = Column(DateTime, nullable=True)
    reported_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Processing
    processed = Column(Boolean, default=False, nullable=False)
    action_taken = Column(
        String(100), nullable=True
    )  # 'suppressed', 'investigated', 'ignored'

    # Raw data
    raw_feedback_data = Column(JSON, nullable=True)

    # Relationships
    campaign = relationship("Campaign", foreign_keys=[campaign_id])


# Add relationships to existing models
def add_bounce_relationships():
    """Add bounce-related relationships to existing models"""
    # This would be called in the main models/__init__.py

    # Campaign.bounces = relationship("EmailBounce", back_populates="campaign")
    # SMTPAccount.bounces = relationship("EmailBounce", back_populates="smtp_account")
    pass
