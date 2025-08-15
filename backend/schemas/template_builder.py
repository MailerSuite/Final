"""
Template Builder Schemas
Pydantic models for email template builder and editor
"""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class TemplateBlock(BaseModel):
    id: str
    type: str = Field(
        ..., pattern="^(text|image|button|divider|spacer|social)$"
    )
    content: dict[str, Any]
    styles: dict[str, Any]
    position: int = Field(..., ge=0)


class TemplateLayout(BaseModel):
    id: str
    name: str = Field(..., min_length=1, max_length=100)
    type: str = Field(..., pattern="^(single_column|two_column|three_column)$")
    blocks: list[TemplateBlock]
    global_styles: dict[str, Any]


class TemplateTheme(BaseModel):
    id: str
    name: str = Field(..., min_length=1, max_length=100)
    colors: dict[str, str]
    fonts: dict[str, str]
    spacing: dict[str, int]


class TemplateSession(BaseModel):
    id: str
    template_id: str | None = None
    layout: TemplateLayout
    theme: TemplateTheme
    created_at: datetime
    updated_at: datetime
    is_saved: bool


class CreateSessionRequest(BaseModel):
    template_id: str | None = None


class UpdateSessionRequest(BaseModel):
    layout: TemplateLayout | None = None
    theme: TemplateTheme | None = None


class UpdateSessionResponse(BaseModel):
    success: bool
    session_id: str
    updated_at: datetime
    auto_saved: bool


class BlockType(BaseModel):
    type: str
    name: str
    description: str
    icon: str
    properties: list[str]


class AddBlockRequest(BaseModel):
    session_id: str
    block_data: TemplateBlock


class AddBlockResponse(BaseModel):
    success: bool
    block_id: str
    session_id: str
    position: int


class UpdateBlockResponse(BaseModel):
    success: bool
    block_id: str
    updated_at: datetime


class DeleteBlockResponse(BaseModel):
    success: bool
    block_id: str
    deleted_at: datetime


class PreviewRequest(BaseModel):
    session_id: str
    format: str = Field("html", pattern="^(html|text)$")


class PreviewResponse(BaseModel):
    session_id: str
    format: str
    preview_html: str | None = None
    preview_text: str | None = None
    generated_at: datetime


class SaveTemplateRequest(BaseModel):
    session_id: str
    template_name: str = Field(..., min_length=1, max_length=100)


class SaveTemplateResponse(BaseModel):
    success: bool
    template_id: str
    template_name: str
    session_id: str
    saved_at: datetime


class ExportRequest(BaseModel):
    session_id: str
    format: str = Field("html", pattern="^(html|json)$")


class ExportResponse(BaseModel):
    format: str
    content: Any
    filename: str
