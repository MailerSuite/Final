from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class EmailAttachment(BaseModel):
    filename: str = Field(..., description="Attachment file name.")
    content_type: str = Field(..., description="MIME content type.")
    size: int = Field(..., description="File size in bytes.")
    path: str = Field(..., description="Storage path.")


class EmailTemplateBase(BaseModel):
    """Common template fields."""

    name: str = Field(..., description="Template name.")
    subject: str = Field(..., description="Email subject.")
    html_content: str | None = Field(
        None, description="HTML body content."
    )
    text_content: str | None = Field(
        None, description="Plain text content."
    )
    macros: dict[str, Any] | None = Field(
        default_factory=dict,
        description="Macro variables.",
    )


class EmailTemplateCreate(EmailTemplateBase):
    """Data for creating a template."""

    html_content: str | None = None
    variants_count: int = Field(
        1,
        alias="variantsCount",
        ge=1,
        description="Number of HTML variants to generate.",
    )
    table_layout: str = Field(
        "simple",
        alias="tableLayout",
        pattern="^(simple|complex)$",
        description="Random table layout mode.",
    )
    split_invert_text: bool = Field(
        False,
        alias="splitInvertText",
        description="Invert portions of text randomly.",
    )
    model_config = dict(populate_by_name=True)


class EmailTemplateUpdate(EmailTemplateBase):
    """Data for updating a template."""


class EmailTemplate(EmailTemplateBase):
    """Full template data."""

    id: str = Field(..., description="Template ID. / ID шаблона.")
    attachments: list[EmailAttachment] = Field(
        default_factory=list, description="Attached files."
    )
    created_at: datetime = Field(
        ..., description="Creation time."
    )
    updated_at: datetime = Field(
        ..., description="Update time."
    )


class EmailTemplateList(BaseModel):
    """List of templates."""

    templates: list[EmailTemplate] = Field(
        ..., description="Templates."
    )
    total: int = Field(..., description="Total count.")


class HTMLRandomizeRequest(BaseModel):
    """Request body for HTML randomization."""

    html_content: str = Field(
        ...,
        description="HTML content to randomize.",
    )


class HTMLRandomizeResponse(BaseModel):
    """Randomized HTML response."""

    html_content: str = Field(
        ..., description="Randomized HTML."
    )


class TemplateFileSchema(BaseModel):
    """Schema for a single template file."""

    name: str
    subject: str
    html_content: str | None = None
    text_content: str | None = None
    macros: dict[str, Any] | None = Field(default_factory=dict)


class TemplateImportResult(BaseModel):
    """Result of a single file import."""

    file: str
    success: bool
    template_id: str | None = None
    error: str | None = None


class TemplateImportResponse(BaseModel):
    """Response returned after importing templates."""

    success: bool
    results: list[TemplateImportResult]
