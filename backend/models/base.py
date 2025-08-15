"""Core database models and base classes."""

import uuid

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
    TypeDecorator,
    func,
)
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship


# SQLite-compatible UUID type
class GUID(TypeDecorator):
    """Platform-independent GUID type.
    Uses String(36) for SQLite and UUID for PostgreSQL.
    """

    impl = String
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            # Use PostgreSQL native UUID type
            return dialect.type_descriptor(PG_UUID(as_uuid=True))
        else:
            return dialect.type_descriptor(String(36))

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        # Always store as string for SQLite, UUID for PostgreSQL
        if isinstance(value, uuid.UUID):
            return str(value) if dialect.name != "postgresql" else value
        return (
            str(value)
            if dialect.name != "postgresql"
            else uuid.UUID(value)
            if value
            else None
        )

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        # Return appropriate type based on dialect
        if dialect.name == "postgresql":
            return value  # PostgreSQL returns UUID objects
        else:
            return uuid.UUID(value) if isinstance(value, str) else value

# Cross-database UUID alias
# Use SQLite-compatible GUID type in place of PostgreSQL UUID when running tests
UUID = GUID


def get_uuid_column():
    """Get UUID column that works with both SQLite and PostgreSQL"""
    return Column(UUID(), primary_key=True, default=uuid.uuid4, index=True)


def get_foreign_key_uuid(table_name: str, nullable: bool = False):
    """Get UUID foreign key column with proper referencing"""
    return Column(UUID(), ForeignKey(f"{table_name}.id"), nullable=nullable, index=True)


# Base class for all models
Base = declarative_base()


class TimestampMixin:
    """Mixin for created_at and updated_at timestamps"""

    created_at = Column(DateTime(timezone=True), default=func.now())
    updated_at = Column(
        DateTime(timezone=True), default=func.now(), onupdate=func.now()
    )


class Campaign(Base, TimestampMixin):
    """Enhanced Campaign model with performance optimizations"""

    __tablename__ = "campaigns"

    id = get_uuid_column()
    name = Column(String(255), nullable=False)
    status = Column(String(50), default="draft", nullable=False)
    user_id = Column(UUID(), ForeignKey("users.id"), nullable=False)

    # Email configuration
    subject = Column(String(500), nullable=True)
    message_type = Column(String(10), default="html")

    # Performance settings
    batch_size = Column(Integer, default=100)
    delay_seconds = Column(Integer, default=0)
    retries = Column(Integer, default=3)
    timeout = Column(Integer, default=10000)

    # Concurrency/threading (optional)
    thread_pool_id = Column(UUID(), ForeignKey("thread_pools.id"), nullable=True)

    # Statistics
    total_emails = Column(Integer, default=0)
    sent_emails = Column(Integer, default=0)
    failed_emails = Column(Integer, default=0)

    # Relationships with optimized loading
    user = relationship("User", back_populates="campaigns")
    emails = relationship(
        "CampaignEmail", back_populates="campaign", lazy="dynamic"
    )

    # PERFORMANCE FIX: Add critical indexes for query optimization
    __table_args__ = (
        Index("idx_campaigns_user_id", "user_id"),  # User's campaigns
        Index("idx_campaigns_status", "status"),  # Filter by status
        Index(
            "idx_campaigns_user_status", "user_id", "status"
        ),  # Combined query
        Index("idx_campaigns_created_at", "created_at"),  # Sorting
        Index("idx_campaigns_name", "name"),  # Search by name
        Index(
            "idx_campaigns_user_created", "user_id", "created_at"
        ),  # User's recent campaigns
        Index("idx_campaigns_thread_pool_id", "thread_pool_id"),
    )


class EmailTemplate(Base, TimestampMixin):
    """Enhanced Email Template model with performance optimizations"""

    __tablename__ = "email_templates"

    id = get_uuid_column()
    name = Column(String(255), nullable=False)
    subject = Column(String(500), nullable=True)
    content = Column(Text, nullable=False)
    user_id = Column(UUID(), ForeignKey("users.id"), nullable=False)
    # FIX: Add missing layout_id column for TemplateLayout relationship
    layout_id = Column(UUID(), ForeignKey("template_layouts.id"), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    # Relationships
    user = relationship("User", back_populates="templates")
    # FIX: Add layout relationship with overlaps parameter
    layout = relationship(
        "TemplateLayout", foreign_keys=[layout_id], overlaps="templates"
    )

    # PERFORMANCE FIX: Add indexes for template queries
    __table_args__ = (
        Index("idx_templates_user_id", "user_id"),  # User's templates
        Index("idx_templates_active", "is_active"),  # Active templates
        Index(
            "idx_templates_user_active", "user_id", "is_active"
        ),  # User's active templates
        Index("idx_templates_name", "name"),  # Search by name
        Index("idx_templates_layout_id", "layout_id"),  # FIX: Add layout index
    )


class SMTPAccount(Base, TimestampMixin):
    """Enhanced SMTP Account model with performance optimizations"""

    __tablename__ = "smtp_accounts"

    id = get_uuid_column()
    name = Column(String(255), nullable=False)
    host = Column(String(255), nullable=False)
    port = Column(Integer, nullable=False)
    username = Column(String(255), nullable=False)
    password = Column(Text, nullable=False)  # Encrypted
    use_tls = Column(Boolean, default=True)
    use_ssl = Column(Boolean, default=False)
    user_id = Column(UUID(), ForeignKey("users.id"), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    # Performance tracking
    emails_sent = Column(Integer, default=0)
    last_used = Column(DateTime(timezone=True), nullable=True)

    # Defaults
    thread_pool_id = Column(UUID(), ForeignKey("thread_pools.id"), nullable=True)

    # Relationships
    user = relationship("User", back_populates="smtp_accounts")

    # PERFORMANCE FIX: Add indexes for SMTP account queries
    __table_args__ = (
        Index("idx_smtp_user_id", "user_id"),  # User's SMTP accounts
        Index("idx_smtp_active", "is_active"),  # Active accounts
        Index(
            "idx_smtp_user_active", "user_id", "is_active"
        ),  # User's active accounts
        Index("idx_smtp_host", "host"),  # Group by provider
        Index("idx_smtp_last_used", "last_used"),  # Recently used accounts
        Index("idx_smtp_thread_pool_id", "thread_pool_id"),
    )


class ProxyServer(Base, TimestampMixin):
    """Enhanced Proxy Server model with performance optimizations"""

    __tablename__ = "proxy_servers"

    id = get_uuid_column()
    name = Column(String(255), nullable=False)
    host = Column(String(255), nullable=False)
    port = Column(Integer, nullable=False)
    username = Column(String(255), nullable=True)
    password = Column(Text, nullable=True)
    proxy_type = Column(String(20), default="socks5")
    user_id = Column(UUID(), ForeignKey("users.id"), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    # Performance tracking
    usage_count = Column(Integer, default=0)
    last_used = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    user = relationship("User", back_populates="proxy_servers")

    # PERFORMANCE FIX: Add indexes for proxy queries
    __table_args__ = (
        Index("idx_proxy_user_id", "user_id"),  # User's proxies
        Index("idx_proxy_active", "is_active"),  # Active proxies
        Index(
            "idx_proxy_user_active", "user_id", "is_active"
        ),  # User's active proxies
        Index("idx_proxy_type", "proxy_type"),  # Filter by type
        Index("idx_proxy_usage", "usage_count"),  # Most used proxies
    )


class LeadEntry(Base, TimestampMixin):
    """Enhanced Lead Entry model with performance optimizations"""

    __tablename__ = "lead_entries"

    id = get_uuid_column()
    email = Column(String(255), nullable=False)
    first_name = Column(String(100), nullable=True)
    last_name = Column(String(100), nullable=True)
    company = Column(String(255), nullable=True)
    user_id = Column(UUID(), ForeignKey("users.id"), nullable=False)
    lead_base_id = Column(UUID(), ForeignKey("lead_bases.id"), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    # Email status tracking
    is_verified = Column(Boolean, default=False)
    bounce_count = Column(Integer, default=0)
    last_contacted = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    user = relationship("User", back_populates="leads")
    lead_base = relationship("LeadBase", back_populates="entries")

    # PERFORMANCE FIX: Add critical indexes for lead queries
    __table_args__ = (
        Index("idx_leads_email", "email"),  # Email lookup
        Index("idx_leads_user_id", "user_id"),  # User's leads
        Index("idx_leads_base_id", "lead_base_id"),  # Leads in database
        Index("idx_leads_active", "is_active"),  # Active leads
        Index("idx_leads_verified", "is_verified"),  # Verified emails
        Index(
            "idx_leads_user_base", "user_id", "lead_base_id"
        ),  # User's database leads
        Index(
            "idx_leads_email_active", "email", "is_active"
        ),  # Active email lookup
        Index("idx_leads_company", "company"),  # Company-based filtering
        Index(
            "idx_leads_last_contacted", "last_contacted"
        ),  # Recently contacted
    )


class CampaignEmail(Base, TimestampMixin):
    """Enhanced Campaign Email model with performance optimizations"""

    __tablename__ = "campaign_emails"

    id = get_uuid_column()
    campaign_id = Column(UUID(), ForeignKey("campaigns.id"), nullable=False)
    email = Column(String(255), nullable=False)
    status = Column(
        String(50), default="pending", nullable=False
    )  # pending, sent, failed, bounced

    # Tracking information
    sent_at = Column(DateTime(timezone=True), nullable=True)
    opened_at = Column(DateTime(timezone=True), nullable=True)
    clicked_at = Column(DateTime(timezone=True), nullable=True)
    bounced_at = Column(DateTime(timezone=True), nullable=True)

    # Error tracking
    error_message = Column(Text, nullable=True)
    retry_count = Column(Integer, default=0)

    # SMTP and proxy used
    smtp_account_id = Column(UUID(), ForeignKey("smtp_accounts.id"), nullable=True)
    proxy_server_id = Column(UUID(), ForeignKey("proxy_servers.id"), nullable=True)

    # Relationships
    campaign = relationship("Campaign", back_populates="emails")
    smtp_account = relationship("SMTPAccount")
    proxy_server = relationship("ProxyServer")

    # PERFORMANCE FIX: Add critical indexes for email tracking
    __table_args__ = (
        Index(
            "idx_campaign_emails_campaign", "campaign_id"
        ),  # Campaign's emails
        Index("idx_campaign_emails_status", "status"),  # Filter by status
        Index(
            "idx_campaign_emails_campaign_status", "campaign_id", "status"
        ),  # Campaign status
        Index("idx_campaign_emails_email", "email"),  # Email lookup
        Index("idx_campaign_emails_sent_at", "sent_at"),  # Sent emails by time
        Index("idx_campaign_emails_opened", "opened_at"),  # Opened emails
        Index("idx_campaign_emails_clicked", "clicked_at"),  # Clicked emails
        Index(
            "idx_campaign_emails_smtp", "smtp_account_id"
        ),  # SMTP performance
        Index(
            "idx_campaign_emails_proxy", "proxy_server_id"
        ),  # Proxy performance
    )


class LeadBase(Base, TimestampMixin):
    """Enhanced Lead Base model with performance optimizations"""

    __tablename__ = "lead_bases"

    id = get_uuid_column()
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    user_id = Column(UUID(), ForeignKey("users.id"), nullable=False)

    # Statistics
    total_leads = Column(Integer, default=0)
    verified_leads = Column(Integer, default=0)
    last_updated = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    user = relationship("User", back_populates="lead_bases")
    entries = relationship(
        "LeadEntry", back_populates="lead_base", lazy="dynamic"
    )

    # PERFORMANCE FIX: Add indexes for lead base queries
    __table_args__ = (
        Index("idx_lead_bases_user_id", "user_id"),  # User's databases
        Index("idx_lead_bases_name", "name"),  # Search by name
        Index("idx_lead_bases_updated", "last_updated"),  # Recently updated
    )


# PERFORMANCE FIX: Add relationships to User model
# Relationships moved to User model class definition above

# Import models that exist
try:
    from .login_activity import LoginActivity
except ImportError:
    pass
try:
    from .bulk_mail_job import BulkMailJob
except ImportError:
    pass


# User model
class User(Base):
    __tablename__ = "users"

    id = Column(UUID(), primary_key=True, default=uuid.uuid4, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(255), nullable=True, index=True)  # Add username field

    password_hash = Column(Text, nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)
    is_admin = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), default=func.now())
    updated_at = Column(DateTime(timezone=True), default=func.now(), onupdate=func.now())
    
    # DISABLED: These columns don't exist in the current database schema
    # plan = Column(String(50), nullable=True, default="PLAN1", index=True)  # Direct plan column for admin management
    # two_factor_enabled = Column(Boolean, default=False, nullable=False)
    # two_factor_secret = Column(String(6), nullable=True)  # For storing temporary 2FA codes
    # two_factor_secret_expires = Column(DateTime(timezone=True), nullable=True)
    # two_factor_verified = Column(Boolean, default=False, nullable=False)
    # two_factor_backup_codes = Column(JSON, nullable=True)  # Backup codes for recovery

    # Relationships
    campaigns = relationship("Campaign", back_populates="user", lazy="dynamic")
    templates = relationship(
        "EmailTemplate", back_populates="user", lazy="dynamic"
    )
    smtp_accounts = relationship(
        "SMTPAccount", back_populates="user", lazy="dynamic"
    )
    proxy_servers = relationship(
        "ProxyServer", back_populates="user", lazy="dynamic"
    )
    leads = relationship("LeadEntry", back_populates="user", lazy="dynamic")
    lead_bases = relationship(
        "LeadBase", back_populates="user", lazy="dynamic"
    )
    # Chat relationship provided via backref from Chat.user
    # (kept for clarity: no explicit relationship here)
    webhook_endpoints = relationship("WebhookEndpoint", back_populates="user", lazy="dynamic")
    webhook_events = relationship("WebhookEvent", back_populates="user", lazy="dynamic")
    
    # Enhanced Email Management Relationships
    email_lists = relationship("EmailList", back_populates="user", lazy="dynamic")
    subscribers = relationship("Subscriber", back_populates="user", lazy="dynamic")
    segments = relationship("Segment", back_populates="user", lazy="dynamic")



# Session model
class Session(Base):
    __tablename__ = "sessions"

    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    user_id = Column(UUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    active_proxy_id = Column(
        UUID(), ForeignKey("proxy_servers.id"), nullable=True
    )
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=func.now())
    updated_at = Column(
        DateTime(timezone=True), default=func.now(), onupdate=func.now()
    )


# Workspace model
class Workspace(Base, TimestampMixin):
    __tablename__ = "workspaces"

    id = get_uuid_column()
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    user_id = Column(UUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    # Optional default proxy or other defaults per workspace
    active_proxy_id = Column(UUID(), ForeignKey("proxy_servers.id"), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    # Indexes for fast lookup
    __table_args__ = (
        Index("idx_workspaces_user_id", "user_id"),
        Index("idx_workspaces_active", "is_active"),
        Index("idx_workspaces_name", "name"),
    )


# IMAP Account model
class IMAPAccount(Base):
    __tablename__ = "imap_accounts"

    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), nullable=False)
    password = Column(String(255), nullable=False)
    server = Column(String(255), nullable=False)
    port = Column(Integer, default=993)
    use_ssl = Column(Boolean, default=True)
    user_id = Column(UUID(), ForeignKey("users.id"), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=func.now())
    updated_at = Column(
        DateTime(timezone=True), default=func.now(), onupdate=func.now()
    )
    # Defaults
    thread_pool_id = Column(UUID(), ForeignKey("thread_pools.id"), nullable=True)


# Email Base model
class EmailBase(Base):
    __tablename__ = "email_bases"

    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    user_id = Column(UUID(), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), default=func.now())
    updated_at = Column(
        DateTime(timezone=True), default=func.now(), onupdate=func.now()
    )


# Thread Pool model
class ThreadPool(Base):
    __tablename__ = "thread_pools"

    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    max_workers = Column(Integer, default=10)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=func.now())
    updated_at = Column(
        DateTime(timezone=True), default=func.now(), onupdate=func.now()
    )


# Import Log model
class ImportLog(Base):
    __tablename__ = "import_logs"

    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    filename = Column(String(255), nullable=False)
    status = Column(String(50), default="pending")
    total_records = Column(Integer, default=0)
    processed_records = Column(Integer, default=0)
    failed_records = Column(Integer, default=0)
    error_message = Column(Text)
    user_id = Column(UUID(), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), default=func.now())
    updated_at = Column(
        DateTime(timezone=True), default=func.now(), onupdate=func.now()
    )


# Domain model
class Domain(Base):
    __tablename__ = "domains"

    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), unique=True, nullable=False)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=func.now())
    updated_at = Column(
        DateTime(timezone=True), default=func.now(), onupdate=func.now()
    )


# IMAP Folder model
class IMAPFolder(Base):
    __tablename__ = "imap_folders"

    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    account_id = Column(UUID(), ForeignKey("imap_accounts.id"), nullable=False)
    total_count = Column(Integer, default=0)
    unread_count = Column(Integer, default=0)
    last_sync = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), default=func.now())
    updated_at = Column(
        DateTime(timezone=True), default=func.now(), onupdate=func.now()
    )


# IMAP Message model
class IMAPMessage(Base):
    __tablename__ = "imap_messages"

    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    folder_id = Column(UUID(), ForeignKey("imap_folders.id"), nullable=False)
    uid = Column(String(50), nullable=False)
    message_id = Column(String(255))
    subject = Column(String(500))
    sender = Column(String(255))
    sender_name = Column(String(255))
    preview = Column(Text)
    content = Column(Text)
    is_read = Column(Boolean, default=False)
    is_starred = Column(Boolean, default=False)
    priority = Column(Integer, default=5)
    received_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), default=func.now())
    updated_at = Column(
        DateTime(timezone=True), default=func.now(), onupdate=func.now()
    )
