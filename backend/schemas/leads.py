from datetime import datetime
from enum import Enum
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class BaseSchema(BaseModel):
    """Base model with ORM mode enabled."""

    model_config = ConfigDict(from_attributes=True)


class LeadBaseStatus(str, Enum):
    """Possible statuses for lead bases."""

    pending = "pending"
    processing = "processing"
    completed = "completed"
    failed = "failed"


class LeadBaseCreate(BaseSchema):
    """Payload for creating a lead base."""

    name: str = Field(..., min_length=1, max_length=255)
    session_id: UUID = Field(
        ..., description="Session ID to which the database belongs"
    )
    country: str | None = Field(None, max_length=100)
    comment: str | None = None


class LeadBaseUpdate(BaseSchema):
    """Fields allowed for updating a lead base."""

    name: str | None = Field(None, min_length=1, max_length=255)
    country: str | None = Field(None, max_length=100)
    comment: str | None = None
    status: LeadBaseStatus | None = None


class LeadBaseResponse(BaseSchema):
    """Lead base information returned in responses."""

    id: UUID
    name: str
    session_id: UUID
    owner_id: UUID
    country: str | None = None
    upload_date: datetime | None = None
    comment: str | None = None
    status: LeadBaseStatus
    leads_count: int
    valid_count: int
    invalid_count: int
    duplicate_count: int
    bounced_count: int
    junk_count: int
    created_at: datetime
    updated_at: datetime


class LeadBaseStats(BaseSchema):
    """Aggregate statistics about lead bases."""

    total_bases: int
    total_leads: int
    status_breakdown: dict
    country_breakdown: dict


class LeadEntryCreate(BaseSchema):
    """Payload for creating a lead entry."""

    email: EmailStr
    first_name: str | None = Field(None, max_length=100)
    last_name: str | None = Field(None, max_length=100)
    lead_base_id: UUID


class LeadEntryUpdate(BaseSchema):
    """Fields allowed for updating a lead entry."""

    first_name: str | None = Field(None, max_length=100)
    last_name: str | None = Field(None, max_length=100)
    email: EmailStr | None = None
    email_verified: bool | None = None


class LeadEntryCreateInBase(BaseSchema):
    """Create lead within a base path; base id comes from path."""

    email: EmailStr
    first_name: str | None = Field(None, max_length=100)
    last_name: str | None = Field(None, max_length=100)


class LeadEntryResponse(BaseSchema):
    """Lead entry information returned in responses."""

    id: UUID
    email: EmailStr
    first_name: str | None
    last_name: str | None
    base_id: UUID = Field(..., alias="lead_base_id")
    email_verified: bool
    created_at: datetime


class LeadEntryList(BaseSchema):
    """Paginated list of lead entries."""

    leads: list[LeadEntryResponse]
    total: int


class LeadEntrySimple(BaseSchema):
    """Compact lead entry for fast listing."""

    id: UUID
    email: EmailStr
    first_name: str | None = None
    last_name: str | None = None
    lead_base_id: UUID
    created_at: datetime


class LeadEntryCursorPage(BaseSchema):
    """Cursor-based page for fast lead listing."""

    items: list[LeadEntrySimple]
    next_cursor: str | None = None


class UploadResult(BaseSchema):
    message: str
    total_processed: int
    successful_imports: int
    duplicates_skipped: int
    invalid_emails: int
    errors: list[str]


class ValidationResult(BaseSchema):
    lead_id: UUID
    email: EmailStr
    is_valid: bool
    error_message: str | None
