from typing import Any

from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    """Health check response."""

    status: str
    version: str
    database: str
    redis: str | None = None


class ErrorResponse(BaseModel):
    """Error response payload."""

    error: str
    message: str
    details: dict[str, Any] | None = None


class SuccessResponse(BaseModel):
    """Generic success response."""

    success: bool
    message: str
    data: Any | None = None


class MessageResponse(BaseModel):
    """Simple message response."""

    message: str


class CheckProgress(BaseModel):
    """Progress information for background tasks."""

    checked: int
    failed: int
    progress: int
    total: int


class SMTPBulkUpload(BaseModel):
    """Bulk upload request for SMTP accounts."""

    data: str


class FileUploadResponse(BaseModel):
    """Metadata about an uploaded file."""

    message: str
    import_log_id: str
    filename: str
    upload_type: str
    initial_status: str


class FirewallStatusResponse(BaseModel):
    """Firewall status payload."""

    enabled: bool
    label: str


class CountResponse(BaseModel):
    """Count response for various resources."""

    count: int


class EmailBaseCreate(BaseModel):
    """Base model for email creation."""

    email: str
    name: str | None = None


class EmailBase(BaseModel):
    """Base model for email data."""

    id: int
    email: str
    name: str | None = None


class DomainCreate(BaseModel):
    """Domain creation model."""

    domain: str


class Domain(BaseModel):
    """Domain model."""

    id: int
    domain: str


class SidebarCountsResponse(BaseModel):
    """Response model for sidebar counts."""

    total_campaigns: int = Field(
        default=0, description="Total number of campaigns"
    )
    active_campaigns: int = Field(
        default=0, description="Number of active campaigns"
    )
    total_leads: int = Field(default=0, description="Total number of leads")
    total_templates: int = Field(
        default=0, description="Total number of templates"
    )
    smtp_accounts: int = Field(
        default=0, description="Number of SMTP accounts"
    )
    imap_accounts: int = Field(
        default=0, description="Number of IMAP accounts"
    )
    proxy_count: int = Field(default=0, description="Number of proxies")

    class Config:
        from_attributes = True
