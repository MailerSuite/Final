"""
Models schemas module.
"""

from pydantic import BaseModel, Field


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
