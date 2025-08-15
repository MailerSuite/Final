# ===== CORE DATABASE MODELS =====
from .base import (
    Base,
    Campaign,
    CampaignEmail,
    Domain,
    EmailBase,
    EmailTemplate,
    IMAPAccount,
    IMAPFolder,
    IMAPMessage,
    ImportLog,
    LeadBase,
    LeadEntry,
    ProxyServer,
    Session,
    SMTPAccount,
    ThreadPool,
    User,
)

# ===== EMAIL LIST MANAGEMENT MODELS =====
from .email_lists import (
    EmailList,
    Subscriber,
    Segment,
    SegmentCondition,
    SubscriberActivity,
    ListImport,
    SubscriberStatus,
    SegmentOperator,
)

# ===== CHAT MODELS =====
from .chat import (
    Chat,
    ChatMessage,
    ChatBotSession,
    ChatTemplate,
    ChatAnalytics,
    ChatStatus,
    ChatPriority,
)

# ===== WEBHOOK MODELS =====
try:
    from .webhooks import (
        WebhookEndpoint,
        WebhookEvent,
        WebhookDelivery,
        WebhookStats,
    )
except ImportError:
    WebhookEndpoint = WebhookEvent = WebhookDelivery = WebhookStats = None

# ===== SYSTEM MODELS =====
from .system_smtp import SystemSMTPConfig

# ===== PLAN & SUBSCRIPTION MODELS =====
from .plan import Plan, SessionDevice, UsageCounter, UserPlan

# ===== AUTHENTICATION & ACTIVITY MODELS =====
try:
    from .login_activity import LoginActivity
except ImportError:
    LoginActivity = None

# ===== DEBUG MODELS =====
try:
    from .debug import DebugClientEvent
except ImportError:
    DebugClientEvent = None

# Bitcoin & payment models removed

# ===== MAILING & JOB MODELS =====
try:
    from .bulk_mail_job import BulkMailJob
except ImportError:
    BulkMailJob = None

# ===== EMAIL STATUS & CHECKING MODELS =====
try:
    from .email_status import EmailStatus, InboxResult
except ImportError:
    EmailStatus = InboxResult = None

# ===== IMAP TEST MODELS =====
try:
    from .imap_test import (
        IMAPTestState,
        IMAPLoginLog,
        IMAPTestMetrics,
        IMAPTestConfig,
        IMAPLoginLogResponse,
        IMAPTestMetricsResponse,
        IMAPTestConfigResponse,
        IMAPTestRequest,
        IMAPTestStatusResponse,
    )
except ImportError:
    IMAPTestState = IMAPLoginLog = IMAPTestMetrics = IMAPTestConfig = None
    IMAPLoginLogResponse = IMAPTestMetricsResponse = IMAPTestConfigResponse = None
    IMAPTestRequest = IMAPTestStatusResponse = None

# ===== SOCKS TEST MODELS =====
try:
    from .socks_test import (
        SocksTestState,
        SocksConnectionLog,
        SocksTestLog,
        SocksTestMetrics,
        SocksTestConfig,
        SocksTestLogResponse,
        SocksTestMetricsResponse,
        SocksTestConfigResponse,
        SocksTestRequest,
        SocksTestStatusResponse,
    )
except ImportError:
    SocksTestState = SocksConnectionLog = SocksTestLog = SocksTestMetrics = SocksTestConfig = None
    SocksTestLogResponse = SocksTestMetricsResponse = SocksTestConfigResponse = None
    SocksTestRequest = SocksTestStatusResponse = None

try:
    from .check_result import CheckerType, CheckResult, CheckStatus
except ImportError:
    CheckResult = CheckerType = CheckStatus = None

try:
    from .check_log import CheckLog
except ImportError:
    CheckLog = None

# ===== ADVANCED FEATURE MODELS =====
# Bounce Management
try:
    from .bounce import (
        BounceRule,
        DeliverabilityStats,
        EmailBounce,
        FeedbackLoop,
        SuppressionList,
    )
except ImportError:
    EmailBounce = SuppressionList = BounceRule = DeliverabilityStats = (
        FeedbackLoop
    ) = None

# Unsubscribe Management
try:
    from .unsubscribe import (
        ConsentLog,
        EmailPreference,
        GlobalSuppressionList,
        PreferenceCenter,
        UnsubscribeReasonCategory,
        UnsubscribeRecord,
        UnsubscribeToken,
    )
except ImportError:
    UnsubscribeRecord = EmailPreference = UnsubscribeToken = None
    PreferenceCenter = ConsentLog = UnsubscribeReasonCategory = (
        GlobalSuppressionList
    ) = None

# Automation & Workflows
try:
    from .automation import (
        AutomationMetrics,
        AutomationRule,
        AutomationTemplate,
        AutomationWorkflow,
        ContactJourney,
        WorkflowAction,
        WorkflowExecution,
        WorkflowTrigger,
    )
except ImportError:
    AutomationWorkflow = WorkflowAction = WorkflowExecution = (
        WorkflowTrigger
    ) = None
    AutomationTemplate = ContactJourney = AutomationMetrics = (
        AutomationRule
    ) = None

# Analytics & Reporting
try:
    from .analytics import (
        ABTestResult,
        AnalyticsReport,
        CampaignAnalytics,
        ContactEngagement,
        EmailEvent,
        LinkClick,
        PerformanceBenchmark,
        RevenueAttribution,
    )
except ImportError:
    EmailEvent = ContactEngagement = CampaignAnalytics = LinkClick = None
    RevenueAttribution = AnalyticsReport = PerformanceBenchmark = (
        ABTestResult
    ) = None

# Template Builder
try:
    from .template_builder import (
        TemplateBlock,
        TemplateBlockType,
        TemplateBuilderSession,
        TemplateLayout,
        TemplateTheme,
    )
except ImportError:
    TemplateLayout = TemplateBlock = TemplateBlockType = TemplateTheme = (
        TemplateBuilderSession
    ) = None

# Integrations
try:
    from .integrations import (
        Integration,
        IntegrationFieldMap,
        IntegrationProvider,
        IntegrationSyncLog,
        IntegrationTemplate,
        IntegrationUsage,
        IntegrationWebhook,
        IntegrationWebhookLog,
    )
except ImportError:
    IntegrationProvider = Integration = IntegrationSyncLog = (
        IntegrationFieldMap
    ) = None
    IntegrationWebhook = IntegrationWebhookLog = IntegrationTemplate = (
        IntegrationUsage
    ) = None

# ===== OPERATIONAL MODELS =====
# These models should be moved to proper modules in the future
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID
from .base import UUID as SGPT_UUID
from sqlalchemy.sql import func


class BlacklistCheck(Base):
    """Model for tracking blacklist checks on emails/domains."""

    __tablename__ = "blacklist_checks"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), nullable=False)
    domain = Column(String(255), nullable=False)
    target = Column(String(255), nullable=False)
    target_type = Column(String(50), nullable=False)
    is_blacklisted = Column(Boolean)
    result = Column(String(50), nullable=False)
    checked_at = Column(DateTime, server_default=func.now())
    expires_at = Column(DateTime)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )


class CampaignMetric(Base):
    """Campaign metrics model with corrected foreign key type"""

    __tablename__ = "campaign_metrics"
    __table_args__ = {"extend_existing": True}  # Allow table redefinition
    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(
        UUID, ForeignKey("campaigns.id")
    )  # Fixed: UUID instead of Integer
    metric_name = Column(String(100), nullable=False)
    metric_value = Column(String(255))
    timestamp = Column(DateTime, server_default=func.now())
    sent_count = Column(Integer, default=0)
    delivered_count = Column(Integer, default=0)
    opened_count = Column(Integer, default=0)
    clicked_count = Column(Integer, default=0)
    bounced_count = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )


class FailedSend(Base):
    """Temporary model for failed sends - should be moved to mailing module"""

    __tablename__ = "failed_sends"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), nullable=False)
    lead_email = Column(String(255), nullable=False)
    message = Column(Text)
    error_message = Column(Text)
    campaign_id = Column(UUID, ForeignKey("campaigns.id"))
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )


class IMAPAttachment(Base):
    """Temporary model for IMAP attachments - should be moved to IMAP module"""

    __tablename__ = "imap_attachments"
    id = Column(Integer, primary_key=True, index=True)
    message_id = Column(UUID, ForeignKey("imap_messages.id"))
    filename = Column(String(255))
    content_type = Column(String(100))
    size = Column(Integer)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class License(Base):
    """Temporary model for licenses - should be moved to licensing module"""

    __tablename__ = "licenses"
    id = Column(Integer, primary_key=True, index=True)
    license_key = Column(String(255), unique=True, nullable=False)
    user_id = Column(SGPT_UUID(), ForeignKey("users.id"))
    plan_id = Column(Integer, ForeignKey("plans.id"))
    is_active = Column(Boolean, default=True)
    is_trial = Column(Boolean, default=False)
    starts_at = Column(DateTime, server_default=func.now())
    expires_at = Column(DateTime)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class OAuthToken(Base):
    """Temporary model for OAuth tokens - should be moved to auth module"""

    __tablename__ = "oauth_tokens"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(SGPT_UUID(), ForeignKey("users.id"))
    provider = Column(String(50), nullable=False)
    access_token = Column(Text, nullable=False)
    refresh_token = Column(Text)
    scope = Column(String(500))
    expires_at = Column(DateTime)
    token_expires_at = Column(DateTime)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class ServerPerformanceLog(Base):
    """Temporary model for server performance - should be moved to monitoring module"""

    __tablename__ = "server_performance_logs"
    id = Column(Integer, primary_key=True, index=True)
    server = Column(String(255))
    cpu_usage = Column(String(10))
    memory_usage = Column(String(10))
    disk_usage = Column(String(10))
    timestamp = Column(DateTime, server_default=func.now())
    created_at = Column(DateTime, server_default=func.now())


# ===== EXPORTS =====
__all__ = [
    # Core Models
    "Base",
    "User",
    "Session",
    "ProxyServer",
    "SMTPAccount",
    "IMAPAccount",
    "Campaign",
    "EmailTemplate",
    "EmailBase",
    "LeadBase",
    "LeadEntry",
    "ThreadPool",
    "ImportLog",
    "Domain",
    "CampaignEmail",
    "IMAPFolder",
    "IMAPMessage",
    # Email List Management
    "EmailList",
    "Subscriber",
    "Segment",
    "SegmentCondition",
    "SubscriberActivity",
    "ListImport",
    "SubscriberStatus",
    "SegmentOperator",
    # Chat Models
    "Chat",
    "ChatMessage",
    "ChatBotSession",
    "ChatTemplate",
    "ChatAnalytics",
    "ChatStatus",
    "ChatPriority",
    # Plan & Subscription
    "Plan",
    "UserPlan",
    "UsageCounter",
    "SessionDevice",
    # Authentication & Activity
    "LoginActivity",
    # Debug
    "DebugClientEvent",
    # (Bitcoin & Payment models removed)
    # Mailing & Jobs
    "BulkMailJob",
    # Email Status & Checking
    "EmailStatus",
    "InboxResult",
    "CheckResult",
    "CheckerType",
    "CheckStatus",
    "CheckLog",
    # Advanced Features (Conditional)
    "EmailBounce",
    "SuppressionList",
    "BounceRule",
    "DeliverabilityStats",
    "FeedbackLoop",
    "UnsubscribeRecord",
    "EmailPreference",
    "UnsubscribeToken",
    "PreferenceCenter",
    "ConsentLog",
    "UnsubscribeReasonCategory",
    "GlobalSuppressionList",
    "AutomationWorkflow",
    "WorkflowAction",
    "WorkflowExecution",
    "WorkflowTrigger",
    "AutomationTemplate",
    "ContactJourney",
    "AutomationMetrics",
    "AutomationRule",
    "EmailEvent",
    "ContactEngagement",
    "CampaignAnalytics",
    "LinkClick",
    "RevenueAttribution",
    "AnalyticsReport",
    "PerformanceBenchmark",
    "ABTestResult",
    "TemplateLayout",
    "TemplateBlock",
    "TemplateBlockType",
    "TemplateTheme",
    "TemplateBuilderSession",
    "IntegrationProvider",
    "Integration",
    "IntegrationSyncLog",
    "IntegrationFieldMap",
    "IntegrationWebhook",
    "IntegrationWebhookLog",
    "IntegrationTemplate",
    "IntegrationUsage",
    # Temporary Models (To be refactored)
    "BlacklistCheck",
    "CampaignMetric",
    "FailedSend",
    "IMAPAttachment",
    "License",
    "OAuthToken",
    "ServerPerformanceLog",
]
