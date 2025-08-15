# ===== PROXY & INFRASTRUCTURE SCHEMAS =====
from .proxy import ProxyStatus

# ===== AUTHENTICATION SCHEMAS =====
try:
    from .auth import (
        LoginRequest,
        LoginResponse,
        RefreshTokenRequest,
        TokenData,
        UserCreate,
        UserResponse,
        UserUpdate,
    )
except ImportError:
    UserResponse = UserCreate = UserUpdate = None
    LoginRequest = LoginResponse = TokenData = RefreshTokenRequest = None

# ===== BULK MAIL SCHEMAS =====
try:
    from .bulk_mail import (
        BulkMailJobCreate,
        BulkMailJobResponse,
        BulkMailJobUpdate,
        BulkMailSettings,
    )
except ImportError:
    BulkMailJobCreate = BulkMailJobResponse = BulkMailJobUpdate = (
        BulkMailSettings
    ) = None

# ===== CAMPAIGN SCHEMAS =====
try:
    from .campaigns import (
        CampaignCreate,
        CampaignResponse,
        CampaignStatus,
        CampaignUpdate,
    )
except ImportError:
    CampaignCreate = CampaignResponse = CampaignUpdate = CampaignStatus = None

# ===== EMAIL & SMTP SCHEMAS =====
try:
    from .smtp import (
        SMTPAccountCreate,
        SMTPAccountResponse,
        SMTPAccountUpdate,
        SMTPTestResult,
    )
except ImportError:
    SMTPAccountCreate = SMTPAccountResponse = SMTPAccountUpdate = (
        SMTPTestResult
    ) = None

# ===== TEMPLATE SCHEMAS =====
try:
    from .templates import (
        TemplateCreate,
        TemplateResponse,
        TemplateType,
        TemplateUpdate,
    )
except ImportError:
    TemplateCreate = TemplateResponse = TemplateUpdate = TemplateType = None

# ===== DOMAIN SCHEMAS =====
try:
    from .domains import (
        DomainCreate,
        DomainResponse,
        DomainStatus,
        DomainUpdate,
    )
except ImportError:
    DomainCreate = DomainResponse = DomainUpdate = DomainStatus = None

# ===== NEW FEATURE SCHEMAS =====
try:
    from .bounce_management import (
        BounceHistoryEntry,
        BounceProcessRequest,
        BounceProcessResponse,
        BounceStatistics,
        BulkRemoveRequest,
        BulkRemoveResponse,
        DeliverabilityStats,
        DomainReputationResponse,
        SuppressionCheckRequest,
        SuppressionCheckResponse,
        SuppressionListEntry,
        SuppressionListResponse,
    )
except ImportError:
    BounceProcessRequest = BounceProcessResponse = SuppressionListEntry = None
    SuppressionListResponse = BounceStatistics = DeliverabilityStats = None
    BounceHistoryEntry = SuppressionCheckRequest = SuppressionCheckResponse = (
        None
    )
    DomainReputationResponse = BulkRemoveRequest = BulkRemoveResponse = None

try:
    from .unsubscribe import (
        EmailPreferences,
        GlobalUnsubscribeRequest,
        GlobalUnsubscribeResponse,
        PreferenceCenterData,
        PreferenceUpdateRequest,
        PreferenceUpdateResponse,
        ResubscribeRequest,
        ResubscribeResponse,
        TokenVerificationResponse,
        UnsubscribeRequest,
        UnsubscribeResponse,
        UnsubscribeStatistics,
    )
except ImportError:
    UnsubscribeRequest = UnsubscribeResponse = EmailPreferences = None
    PreferenceUpdateRequest = PreferenceUpdateResponse = (
        PreferenceCenterData
    ) = None
    GlobalUnsubscribeRequest = GlobalUnsubscribeResponse = (
        ResubscribeRequest
    ) = None
    ResubscribeResponse = UnsubscribeStatistics = TokenVerificationResponse = (
        None
    )

try:
    from .plan_protection import (
        BillingProtectionStatus,
        LimitCheck,
        LimitEnforcementRequest,
        LimitEnforcementResponse,
        OverageProtectionSettings,
        PlanComparison,
        PlanLimits,
        PlanProtectionStatus,
        UpgradeRecommendation,
        UsageResetResponse,
        UsageStats,
    )
except ImportError:
    PlanLimits = UsageStats = PlanProtectionStatus = LimitCheck = None
    UpgradeRecommendation = BillingProtectionStatus = (
        OverageProtectionSettings
    ) = None
    PlanComparison = UsageResetResponse = LimitEnforcementRequest = None
    LimitEnforcementResponse = None

try:
    from .template_builder import (
        AddBlockRequest,
        AddBlockResponse,
        BlockType,
        CreateSessionRequest,
        DeleteBlockResponse,
        ExportRequest,
        ExportResponse,
        PreviewRequest,
        PreviewResponse,
        SaveTemplateRequest,
        SaveTemplateResponse,
        TemplateBlock,
        TemplateLayout,
        TemplateSession,
        TemplateTheme,
        UpdateBlockResponse,
        UpdateSessionRequest,
        UpdateSessionResponse,
    )
except ImportError:
    TemplateBlock = TemplateLayout = TemplateTheme = TemplateSession = None
    CreateSessionRequest = UpdateSessionRequest = UpdateSessionResponse = None
    BlockType = AddBlockRequest = AddBlockResponse = UpdateBlockResponse = None
    DeleteBlockResponse = PreviewRequest = PreviewResponse = None
    SaveTemplateRequest = SaveTemplateResponse = ExportRequest = (
        ExportResponse
    ) = None

try:
    from .deliverability import (
        AuthenticationCheckResponse,
        BlacklistCheckRequest,
        BlacklistCheckResponse,
        CompetitiveAnalysis,
        DeliverabilityAnalysis,
        DeliverabilityMetrics,
        DomainReputation,
        InboxPlacementData,
        RecommendationsResponse,
        WarmupPlanRequest,
        WarmupPlanResponse,
    )
except ImportError:
    DeliverabilityAnalysis = DomainReputation = DeliverabilityMetrics = None
    BlacklistCheckRequest = BlacklistCheckResponse = (
        AuthenticationCheckResponse
    ) = None
    RecommendationsResponse = WarmupPlanRequest = WarmupPlanResponse = None
    InboxPlacementData = CompetitiveAnalysis = None

# ===== LEAD SCHEMAS =====
try:
    from .leads import LeadCreate, LeadImportResult, LeadResponse, LeadUpdate
except ImportError:
    LeadCreate = LeadResponse = LeadUpdate = LeadImportResult = None

__all__ = [
    # Proxy & Infrastructure
    "ProxyStatus",
    # Authentication
    "UserResponse",
    "UserCreate",
    "UserUpdate",
    "LoginRequest",
    "LoginResponse",
    "TokenData",
    "RefreshTokenRequest",
    # Bulk Mail
    "BulkMailJobCreate",
    "BulkMailJobResponse",
    "BulkMailJobUpdate",
    "BulkMailSettings",
    # Campaigns
    "CampaignCreate",
    "CampaignResponse",
    "CampaignUpdate",
    "CampaignStatus",
    # SMTP & Email
    "SMTPAccountCreate",
    "SMTPAccountResponse",
    "SMTPAccountUpdate",
    "SMTPTestResult",
    # Templates
    "TemplateCreate",
    "TemplateResponse",
    "TemplateUpdate",
    "TemplateType",
    # Domains
    "DomainCreate",
    "DomainResponse",
    "DomainUpdate",
    "DomainStatus",
    # Leads
    "LeadCreate",
    "LeadResponse",
    "LeadUpdate",
    "LeadImportResult",
]
