from datetime import datetime
from enum import Enum
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class CampaignStatus(str, Enum):
    DRAFT = "draft"
    SCHEDULED = "scheduled"
    SENDING = "sending"
    SENT = "sent"
    PAUSED = "paused"
    CANCELLED = "cancelled"


class EmailStatus(str, Enum):
    PENDING = "pending"
    SENT = "sent"
    DELIVERED = "delivered"
    OPENED = "opened"
    CLICKED = "clicked"
    BOUNCED = "bounced"
    FAILED = "failed"


class CampaignBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    subject: str = Field(..., min_length=1, max_length=255)
    preview_text: str | None = Field(None, max_length=255)
    from_name: str = Field(..., min_length=1, max_length=100)
    from_email: EmailStr
    reply_to: EmailStr | None = None
    html_content: str = Field(..., min_length=1)
    text_content: str | None = None


class CampaignCreate(CampaignBase):
    template_id: int | None = None
    recipient_lists: list[int] | None = []
    recipients: list[EmailStr] | None = []
    send_immediately: bool = False
    scheduled_at: datetime | None = None
    tracking_enabled: bool = True
    open_tracking: bool = True
    click_tracking: bool = True
    unsubscribe_tracking: bool = True


class CampaignUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    subject: str | None = Field(None, min_length=1, max_length=255)
    preview_text: str | None = Field(None, max_length=255)
    from_name: str | None = Field(None, min_length=1, max_length=100)
    from_email: EmailStr | None = None
    reply_to: EmailStr | None = None
    html_content: str | None = Field(None, min_length=1)
    text_content: str | None = None
    scheduled_at: datetime | None = None
    tracking_enabled: bool | None = None
    open_tracking: bool | None = None
    click_tracking: bool | None = None
    unsubscribe_tracking: bool | None = None


class CampaignResponse(CampaignBase):
    id: int
    user_id: int
    status: CampaignStatus
    created_at: datetime
    updated_at: datetime
    scheduled_at: datetime | None = None
    sent_at: datetime | None = None
    total_recipients: int = 0
    emails_sent: int = 0
    opens: int = 0
    clicks: int = 0
    bounces: int = 0
    unsubscribes: int = 0

    model_config = ConfigDict(from_attributes=True)


class CampaignDetailResponse(CampaignResponse):
    template_id: int | None = None
    recipient_lists: list[dict[str, Any]] = []
    tracking_enabled: bool = True
    open_tracking: bool = True
    click_tracking: bool = True
    unsubscribe_tracking: bool = True


class CampaignStatsResponse(BaseModel):
    campaign_id: int
    total_recipients: int
    emails_sent: int
    emails_pending: int
    emails_failed: int
    opens: int
    unique_opens: int
    clicks: int
    unique_clicks: int
    bounces: int
    unsubscribes: int
    open_rate: float
    click_rate: float
    bounce_rate: float
    unsubscribe_rate: float


class EmailResponse(BaseModel):
    id: int
    campaign_id: int
    recipient_email: str
    status: EmailStatus
    sent_at: datetime | None = None
    opened_at: datetime | None = None
    clicked_at: datetime | None = None
    bounced_at: datetime | None = None
    error_message: str | None = None

    model_config = ConfigDict(from_attributes=True)


class TestEmailRequest(BaseModel):
    test_email: EmailStr


from schemas.domain import Domain
from schemas.proxy import ProxyServer
from schemas.smtp import SMTPAccount
from schemas.templates import EmailTemplate


class CampaignStatus(str, Enum):
    DRAFT = "draft"
    RUNNING = "running"
    PAUSED = "paused"
    COMPLETED = "completed"
    FAILED = "failed"
    STOPPED = "stopped"


class BaseSchema(BaseModel):
    """Base model with ORM configuration."""

    model_config = ConfigDict(from_attributes=True)


class CampaignCreate(BaseSchema):
    name: str = Field(
        ...,
        min_length=1,
        max_length=255,
        description="Campaign Name. The unique name of the email campaign.",
    )
    template_id: UUID = Field(
        ...,
        description="Email Template ID. The unique identifier of the email template to use.",
    )
    subject: str | None = Field(
        None,
        description="Subject line of the email. If different from the template's subject.",
    )
    lead_base_ids: list[UUID] = Field(
        default_factory=list,
        description="List of Lead Base IDs. UUIDs of recipient lead databases for this campaign.",
    )
    batch_size: int = Field(
        default=100,
        ge=1,
        le=1000,
        description="Batch Size. Number of emails to send in each batch. Range: 1–1000. Default: 100.",
    )
    delay_between_batches: int = Field(
        default=60,
        ge=1,
        le=3600,
        description="Delay Between Batches (seconds). How many seconds to wait between sending batches. Range: 1–3600. Default: 60.",
    )
    threads_count: int = Field(
        default=5,
        ge=1,
        le=20,
        description="Number of sending threads to use. Range: 1–20. Default: 5.",
    )
    autostart: bool = Field(
        default=False,
        description="Automatically start the campaign after creation.",
    )
    proxy_type: str | None = Field(
        default="none",
        description="Proxy type for sending: none, http or socks5.",
    )
    proxy_host: str | None = Field(
        default=None,
        description="Proxy host name or IP address.",
    )
    proxy_port: int | None = Field(
        default=None, description="Proxy port number."
    )
    proxy_username: str | None = Field(
        default=None,
        description="Proxy username if required.",
    )
    proxy_password: str | None = Field(
        default=None, description="Proxy password if required."
    )
    smtps: list[str] = Field(
        default_factory=list,
        description="List of SMTP IDs to use for sending.",
    )
    proxies: list[str] = Field(
        default_factory=list,
        description="List of proxy IDs for rotation.",
    )
    subjects: list[str] = Field(
        default_factory=list,
        description="Subject pool to randomly choose from.",
    )
    templates: list[str] = Field(
        default_factory=list,
        description="Template pool to randomly choose from.",
    )
    content_blocks: list[dict[str, Any]] | None = Field(
        default_factory=list,
        description="Dynamic content blocks.",
    )
    retry_limit: int = Field(
        default=3,
        ge=1,
        le=10,
        description="Retry limit for failed emails. Range: 1–10. Default: 3.",
    )
    sender: EmailStr
    cc: list[EmailStr] = []
    bcc: list[EmailStr] = []


class CampaignUpdate(BaseSchema):
    name: str | None = Field(None, min_length=1, max_length=255)
    subject: str | None = Field(None)
    batch_size: int | None = Field(None, ge=1, le=1000)
    delay_between_batches: int | None = Field(None, ge=1, le=3600)
    threads_count: int | None = Field(None, ge=1, le=20)
    proxy_type: str | None = None
    proxy_host: str | None = None
    proxy_port: int | None = None
    proxy_username: str | None = None
    proxy_password: str | None = None
    sender: EmailStr | None
    cc: list[EmailStr] | None
    bcc: list[EmailStr] | None


class CampaignResponse(BaseSchema):
    id: UUID
    name: str
    template_id: UUID
    subject: str
    status: CampaignStatus
    sender: EmailStr
    cc: list[EmailStr]
    bcc: list[EmailStr]
    total_recipients: int
    sent_count: int
    delivered_count: int
    opened_count: int
    clicked_count: int
    bounced_count: int
    batch_size: int
    delay_between_batches: int
    threads_count: int
    proxy_type: str | None = None
    proxy_host: str | None = None
    proxy_port: int | None = None
    proxy_username: str | None = None
    proxy_password: str | None = None
    created_at: datetime
    started_at: datetime | None
    completed_at: datetime | None

    @property
    def open_rate(self) -> float:
        """Open rate percentage."""
        if self.delivered_count == 0:
            return 0.0
        return round(self.opened_count / self.delivered_count * 100, 2)

    @property
    def click_rate(self) -> float:
        """Click rate percentage."""
        if self.delivered_count == 0:
            return 0.0
        return round(self.clicked_count / self.delivered_count * 100, 2)

    @property
    def bounce_rate(self) -> float:
        """Bounce rate percentage."""
        if self.sent_count == 0:
            return 0.0
        return round(self.bounced_count / self.sent_count * 100, 2)


class CampaignProgress(BaseSchema):
    campaign_id: str
    status: CampaignStatus
    progress_percentage: float
    sent_count: int
    delivered_count: int
    opened_count: int
    clicked_count: int
    bounced_count: int
    total_recipients: int
    estimated_completion: datetime | None
    current_batch: int | None
    total_batches: int | None


class CampaignStats(BaseSchema):
    total_campaigns: int
    active_campaigns: int
    completed_campaigns: int
    total_emails_sent: int
    average_open_rate: float
    average_click_rate: float
    average_bounce_rate: float


class CampaignResources(BaseSchema):
    campaign: CampaignResponse
    template: EmailTemplate
    smtp_accounts: list[SMTPAccount]
    proxies: list[ProxyServer]
    domains: list[Domain]


class MockTestError(BaseModel):
    step: str
    message: str


class CampaignMockTestResponse(BaseModel):
    campaign_id: UUID
    errors: list[MockTestError] = Field(default_factory=list)


class CampaignSummary(BaseModel):
    total_templates_loaded: int
    total_smtp_servers_configured: int


class MailerConfigOut(BaseModel):
    """Configuration for a standard SMTP provider."""

    name: str
    host: str
    port: int
    encryption: str
    username: str
    password: str
    tls_verify: bool


class SchedulingOption(BaseModel):
    label: str
    batch_size: int
    delay_between_batches: int
    threads_count: int


class CampaignOptions(BaseModel):
    templates: list[EmailTemplate]
    mailers: list[MailerConfigOut]
    schedulingOptions: list[SchedulingOption]
