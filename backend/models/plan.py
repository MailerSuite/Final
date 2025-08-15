"""
Plan models for SGPT - integrates with existing SQLAlchemy models
"""

from datetime import datetime

from sqlalchemy import (
    JSON,
    BigInteger,
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from config.settings import settings
from models.base import Base, UUID


# Use String for SQLite, UUID for PostgreSQL
def get_uuid_column():
    if settings.DATABASE_URL.startswith("sqlite"):
        return String(36)  # UUID string length
    else:
        return UUID(as_uuid=True)


class Plan(Base):
    """Plan configuration model"""

    __tablename__ = "plans"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True)
    name = Column(String(50), unique=True, nullable=False)
    code = Column(
        String(20), unique=True, nullable=False
    )  # basic, premium, deluxe, team, lifetime, trial
    price_per_month = Column(
        Float, nullable=True
    )  # Price in USD, None for free plans
    features = Column(JSON, default=list)  # List of feature names/descriptions
    is_active = Column(Boolean, default=True)

    # Trial plan specific fields
    is_trial_plan = Column(Boolean, default=False)
    trial_duration_minutes = Column(
        Integer, nullable=True
    )  # Duration in minutes for trial plans
    trial_price_usd = Column(
        Float, nullable=True
    )  # One-off trial price in USD
    trial_price_btc = Column(
        String(20), nullable=True
    )  # One-off trial price in BTC
    trial_min_threads = Column(
        Integer, nullable=True
    )  # Minimum threads for trial
    trial_max_extensions = Column(
        Integer, default=2
    )  # How many times trial can be extended
    trial_extension_minutes = Column(
        Integer, default=30
    )  # Extension duration in minutes

    # Thread and concurrency limits
    max_threads = Column(Integer, nullable=True)  # None = unlimited
    max_concurrent_campaigns = Column(Integer, default=5)

    # AI limits
    max_ai_calls_daily = Column(
        Integer, nullable=True
    )  # 150, 500, None for unlimited
    max_ai_tokens_monthly = Column(BigInteger, nullable=True)
    allowed_ai_models = Column(
        JSON, default=list
    )  # ["gpt-4o-mini", "gpt-4o", "claude-3-5"]

    # Feature access
    allowed_functions = Column(
        JSON, default=list
    )  # ["socks_stream", "advanced_ai", etc.]
    has_premium_support = Column(Boolean, default=False)
    update_frequency = Column(
        String(20), default="monthly"
    )  # "monthly", "weekly"

    # Plan duration
    duration_days = Column(
        Integer, nullable=True
    )  # 30 for monthly, None for lifetime
    max_workspaces = Column(Integer, default=1)
    max_concurrent_sessions = Column(Integer, default=1)  # fingerprint limit

    # Database tier (all dedicated but labeled as shared for basic)
    database_tier_label = Column(
        String(20), default="shared"
    )  # "shared", "premium", "dedicated"

    # Display and marketing
    marketing_blurb = Column(Text, default="")
    sort_order = Column(Integer, default=0)

    created_at = Column(DateTime(timezone=True), default=func.now())
    updated_at = Column(
        DateTime(timezone=True), default=func.now(), onupdate=func.now()
    )


class UserPlan(Base):
    """User plan assignment"""

    __tablename__ = "user_plans"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True)
    user_id = Column(UUID(), ForeignKey("users.id"), nullable=False)
    plan_id = Column(Integer, ForeignKey("plans.id"), nullable=False)

    assigned_at = Column(DateTime(timezone=True), default=func.now())
    expires_at = Column(
        DateTime(timezone=True), nullable=True
    )  # None for lifetime
    is_active = Column(Boolean, default=True)

    # Relationships
    plan = relationship("Plan")

    created_at = Column(DateTime(timezone=True), default=func.now())


class TeamPlan(Base):
    """Team plan for collaboration features"""

    __tablename__ = "team_plans"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True)
    team_name = Column(String(100), nullable=False)
    owner_user_id = Column(UUID(), ForeignKey("users.id"), nullable=False)
    plan_id = Column(Integer, ForeignKey("plans.id"), nullable=False)

    max_seats = Column(Integer, default=2)
    current_seats = Column(Integer, default=1)
    price_per_seat = Column(Float, default=1249.0)

    created_at = Column(DateTime(timezone=True), default=func.now())
    updated_at = Column(
        DateTime(timezone=True), default=func.now(), onupdate=func.now()
    )

    # Relationships
    plan = relationship("Plan")
    members = relationship("TeamMember", back_populates="team_plan")


class TeamMember(Base):
    """Team member association"""

    __tablename__ = "team_members"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True)
    team_plan_id = Column(Integer, ForeignKey("team_plans.id"), nullable=False)
    user_id = Column(UUID(), ForeignKey("users.id"), nullable=False)
    role = Column(String(20), default="member")  # owner, admin, member

    invited_at = Column(DateTime(timezone=True), default=func.now())
    joined_at = Column(DateTime(timezone=True), nullable=True)
    is_active = Column(Boolean, default=True)

    # Relationships
    team_plan = relationship("TeamPlan", back_populates="members")


class PlanStatus(Base):
    """Track plan availability for scarcity features"""

    __tablename__ = "plan_status"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True)
    plan_code = Column(String(20), unique=True, nullable=False)
    total_seats = Column(Integer, default=50)
    sold_seats = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    last_updated = Column(DateTime(timezone=True), default=func.now())


class UsageCounter(Base):
    """Track usage against plan limits"""

    __tablename__ = "usage_counters"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True)
    user_id = Column(UUID(), ForeignKey("users.id"), nullable=False)
    counter_type = Column(
        String(50), nullable=False
    )  # "ai_calls_daily", "ai_tokens_monthly"

    current_count = Column(BigInteger, default=0)
    reset_at = Column(DateTime(timezone=True), nullable=False)
    period_start = Column(DateTime(timezone=True), default=func.now())

    created_at = Column(DateTime(timezone=True), default=func.now())
    updated_at = Column(
        DateTime(timezone=True), default=func.now(), onupdate=func.now()
    )


class SessionDevice(Base):
    """Track device fingerprints for concurrent session limits"""

    __tablename__ = "session_devices"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True)
    user_id = Column(UUID(), ForeignKey("users.id"), nullable=False)
    fingerprint = Column(String(128), nullable=False)

    first_seen = Column(DateTime(timezone=True), default=func.now())
    last_activity = Column(DateTime(timezone=True), default=func.now())
    last_ip = Column(String(45))  # Support IPv6
    user_agent = Column(String(500))
    is_active = Column(Boolean, default=True)

    created_at = Column(DateTime(timezone=True), default=func.now())


# Plan feature definitions
PLAN_FEATURES = {
    "trial": [
        "basic_campaigns",
        "basic_smtp_imap",
        "basic_templates",
        "basic_analytics",
    ],
    "basic": [
        "basic_campaigns",
        "basic_smtp_imap",
        "basic_templates",
        "basic_analytics",
        "basic_upload",
        "blacklist_checking",
        "basic_proxy",
    ],
    "premium": [
        "basic_campaigns",
        "basic_smtp_imap",
        "basic_templates",
        "basic_analytics",
        "basic_upload",
        "blacklist_checking",
        "basic_proxy",
        "socks_stream",
        "ai_subject_generation",
        "ai_content_optimization",
        "advanced_security",
        "bounce_management",
        "leads_management",
        "advanced_analytics",
    ],
    "deluxe": [
        "basic_campaigns",
        "basic_smtp_imap",
        "basic_templates",
        "basic_analytics",
        "basic_upload",
        "blacklist_checking",
        "basic_proxy",
        "socks_stream",
        "ai_subject_generation",
        "ai_content_optimization",
        "ai_campaign_analysis",
        "ai_send_optimization",
        "ai_template_generation",
        "ai_segmentation",
        "ai_deliverability",
        "ai_automation_suggestions",
        "advanced_security",
        "bounce_management",
        "unsubscribe_management",
        "automation_workflows",
        "performance_testing",
        "bulk_operations",
        "leads_management",
        "advanced_analytics",
        "premium_support",
    ],
    "enterprise": [
        "basic_campaigns",
        "basic_smtp_imap",
        "basic_templates",
        "basic_analytics",
        "basic_upload",
        "blacklist_checking",
        "basic_proxy",
        "socks_stream",
        "ai_subject_generation",
        "ai_content_optimization",
        "ai_campaign_analysis",
        "ai_send_optimization",
        "ai_template_generation",
        "ai_segmentation",
        "ai_deliverability",
        "ai_automation_suggestions",
        "advanced_security",
        "bounce_management",
        "unsubscribe_management",
        "automation_workflows",
        "performance_testing",
        "bulk_operations",
        "leads_management",
        "advanced_analytics",
        "premium_support",
        "admin_functions",
        "plan_management",
        "system_administration",
        "custom_integrations",
        "white_label_access",
    ],
}


def get_plan_features(plan_code: str) -> list:
    """Get features for a specific plan"""
    return PLAN_FEATURES.get(plan_code, PLAN_FEATURES["basic"])


def create_default_plans():
    """Create default plans with proper feature sets"""
    # This function should be called from an async context or migration
    # For now, just return the plan data for use in migrations
    return [
        {
            "name": "Trial",
            "code": "trial",
            "is_trial_plan": True,
            "trial_duration_minutes": 60,
            "trial_price_usd": 1.0,
            "trial_price_btc": "0.00002",
            "trial_min_threads": 2,
            "trial_max_extensions": 2,
            "trial_extension_minutes": 30,
            "max_threads": 5,
            "max_ai_calls_daily": 10,
            "max_ai_tokens_monthly": 5000,
            "max_concurrent_sessions": 1,
            "allowed_functions": get_plan_features("trial"),
            "has_premium_support": False,
            "database_tier_label": "shared",
            "duration_days": None,  # Handled by trial_duration_minutes
            "marketing_blurb": "60-minute trial with essential features - extendable and affordable",
            "sort_order": 0,
        },
        {
            "name": "Basic",
            "code": "basic",
            "max_threads": 5,
            "max_ai_calls_daily": 0,
            "max_ai_tokens_monthly": 0,
            "max_concurrent_sessions": 1,
            "allowed_functions": get_plan_features("basic"),
            "has_premium_support": False,
            "database_tier_label": "shared",
            "duration_days": None,  # Unlimited
            "marketing_blurb": "Perfect for getting started with email marketing",
            "sort_order": 1,
        },
        {
            "name": "Premium",
            "code": "premium",
            "max_threads": 25,
            "max_ai_calls_daily": 500,
            "max_ai_tokens_monthly": 200000,
            "max_concurrent_sessions": 3,
            "allowed_functions": get_plan_features("premium"),
            "has_premium_support": False,
            "database_tier_label": "premium",
            "duration_days": 30,
            "marketing_blurb": "AI-powered email marketing for growing businesses",
            "sort_order": 2,
        },
        {
            "name": "Deluxe",
            "code": "deluxe",
            "max_threads": None,  # Unlimited
            "max_ai_calls_daily": None,  # Unlimited
            "max_ai_tokens_monthly": None,  # Unlimited
            "max_concurrent_sessions": 10,
            "allowed_functions": get_plan_features("deluxe"),
            "has_premium_support": True,
            "database_tier_label": "dedicated",
            "duration_days": 30,
            "marketing_blurb": "Complete automation and performance tools for agencies",
            "sort_order": 3,
        },
        {
            "name": "Enterprise",
            "code": "enterprise",
            "max_threads": None,  # Unlimited
            "max_ai_calls_daily": None,  # Unlimited
            "max_ai_tokens_monthly": None,  # Unlimited
            "max_concurrent_sessions": None,  # Unlimited
            "allowed_functions": get_plan_features("enterprise"),
            "has_premium_support": True,
            "database_tier_label": "enterprise",
            "duration_days": 30,
            "marketing_blurb": "Full enterprise features with admin access and custom integrations",
            "sort_order": 4,
        },
    ]


class TrialPlan(Base):
    """Active trial plan instances for users"""

    __tablename__ = "trial_plans"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True)
    user_id = Column(UUID(), ForeignKey("users.id"), nullable=False)
    plan_id = Column(Integer, ForeignKey("plans.id"), nullable=False)

    # Trial timing
    started_at = Column(DateTime(timezone=True), default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=False)
    is_active = Column(Boolean, default=True)
    is_expired = Column(Boolean, default=False)

    # Extension tracking
    extensions_used = Column(Integer, default=0)
    max_extensions_allowed = Column(Integer, default=2)

    # Usage tracking
    threads_used = Column(Integer, default=0)
    campaigns_sent = Column(Integer, default=0)

    # Payment tracking
    payment_request_id = Column(
        String(36), nullable=True
    )  # Link to payment request
    is_paid = Column(Boolean, default=False)
    payment_confirmed_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), default=func.now())
    updated_at = Column(
        DateTime(timezone=True), default=func.now(), onupdate=func.now()
    )

    # Relationships
    plan = relationship("Plan")

    @property
    def time_remaining_minutes(self) -> int:
        """Get remaining time in minutes"""
        if self.is_expired:
            return 0
        remaining = self.expires_at - datetime.utcnow().replace(
            tzinfo=self.expires_at.tzinfo
        )
        return max(0, int(remaining.total_seconds() / 60))

    @property
    def can_extend(self) -> bool:
        """Check if trial can be extended"""
        return (
            self.is_active
            and not self.is_expired
            and self.extensions_used < self.max_extensions_allowed
            and self.time_remaining_minutes > 0
        )


class TrialConfiguration(Base):
    """Admin configuration for trial plans"""

    __tablename__ = "trial_configurations"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True)
    config_name = Column(
        String(50), unique=True, nullable=False
    )  # "default", "promo", etc.
    is_active = Column(Boolean, default=True)

    # Trial settings
    duration_minutes = Column(Integer, default=60)  # Default 60 minutes
    min_threads = Column(Integer, default=2)  # Minimum thread allowance
    max_threads = Column(
        Integer, default=5
    )  # Maximum thread allowance for trial
    max_campaigns = Column(Integer, default=2)  # Max campaigns during trial

    # Pricing
    price_usd = Column(Float, default=1.0)  # $1 default
    price_btc = Column(String(20), default="0.00002")  # BTC equivalent

    # Extension settings
    max_extensions = Column(Integer, default=2)  # How many times can extend
    extension_minutes = Column(Integer, default=30)  # Extension duration
    extension_price_usd = Column(Float, default=0.5)  # Extension price

    # Feature access during trial
    allowed_features = Column(
        JSON, default=list
    )  # Limited feature set for trial

    # Admin settings
    created_by_admin_id = Column(UUID(), nullable=True)

    created_at = Column(DateTime(timezone=True), default=func.now())
    updated_at = Column(
        DateTime(timezone=True), default=func.now(), onupdate=func.now()
    )
