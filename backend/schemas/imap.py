from datetime import datetime
from enum import Enum
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class IMAPStatus(str, Enum):
    PENDING = "pending"
    VALID = "valid"
    INVALID = "invalid"
    ERROR = "error"
    DEAD = "dead"
    CHECKED = "checked"


class IMAPAccountBase(BaseModel):
    server: str = Field(alias="imap_server")
    port: int = Field(alias="imap_port")
    email: EmailStr
    password: str
    use_oauth: bool | None = False
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class IMAPAccountCreate(IMAPAccountBase):
    session_id: str | None = None
    timeout: int | None = 15
    retries: int | None = 1


class IMAPAccountUpdate(BaseModel):
    server: str | None = None
    port: int | None = None
    email: EmailStr | None = None
    password: str | None = None
    status: IMAPStatus | None = None
    last_check: datetime | None = None
    response_time: float | None = None
    inbox_count: int | None = None
    error_message: str | None = None
    use_oauth: bool | None = None
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class IMAPAccountResponse(IMAPAccountBase):
    id: UUID
    session_id: UUID | None = None
    status: IMAPStatus | None = None
    last_check: datetime | None = None
    response_time: float | None = None
    inbox_count: int | None = 0
    error_message: str | None = None
    created_at: datetime | None = None
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class IMAPTestRequest(BaseModel):
    imap_accounts: list[IMAPAccountCreate]
    timeout: int | None = 30


class IMAPTestResult(BaseModel):
    email: str
    status: IMAPStatus
    inbox_count: int | None = 0
    response_time: float | None = None
    error_message: str | None = None
    tls_verified: bool | None = None
    login_latency: float | None = None
    error_type: str | None = None


class IMAPBulkTestResponse(BaseModel):
    total: int
    valid: int
    invalid: int
    errors: int
    results: list[IMAPTestResult]


class IMAPTestConfig(BaseModel):
    """Configuration for running an IMAP login test."""

    server: str
    port: int
    email: EmailStr
    password: str


class IMAPCheckRequest(IMAPTestConfig):
    """Payload for single IMAP connection checks."""

    timeout: int | None = 15


class IMAPFolderResponse(BaseModel):
    name: str
    messages_count: int | None = 0
    unseen_count: int | None = None


class IMAPMessageResponse(BaseModel):
    id: UUID
    uid: int
    subject: str | None = None
    sender: EmailStr | None = None
    recipients: list[EmailStr] | None = None
    date: datetime | None = None
    body_preview: str | None = None
    is_read: bool
    has_attachments: bool = False
    folder: str
    account_id: UUID
    body_html: str | None = None
    body_plain: str | None = None
    attachments: list[dict[str, Any]] | None = None

    @classmethod
    def from_dict(cls, data: dict[str, Any]):
        data["id"] = (
            UUID(data["id"])
            if isinstance(data.get("id"), str)
            else data.get("id")
        )
        data["account_id"] = (
            UUID(data["account_id"])
            if isinstance(data.get("account_id"), str)
            else data.get("account_id")
        )
        return cls(**data)


class IMAPSettingsUpdate(BaseModel):
    server: str | None = None
    port: int | None = None
    timeout: int | None = None
    encryption: str | None = None
    use_oauth: bool | None = None
    max_connections: int | None = None


class IMAPRetrieveMessage(BaseModel):
    uid: int
    subject: str | None = None
    sender: str | None = None
    received_at: str | None = None
    preview: str | None = None


class IMAPFolderInfo(BaseModel):
    """Basic folder info with message counts."""

    name: str
    total_count: int
    unread_count: int


class IMAPRetrieveResponse(BaseModel):
    status: str
    messages: list[IMAPRetrieveMessage]
    folders: list[IMAPFolderInfo] = []


class IMAPSendTestEmailRequest(BaseModel):
    template_id: UUID
    imap_account_id: UUID | None = None
    recipient_override: EmailStr | None = None
    emails_per_item: int = Field(1, ge=1)


class IMAPSendTestEmailResponse(BaseModel):
    id: UUID
    status: str


class IMAPAccountSelector(BaseModel):
    """Simplified account info for dropdown selectors."""

    id: str
    email: str
    server: str | None = None
    port: int | None = None


class FolderListResponse(BaseModel):
    """List of folders returned from an IMAP session."""

    folders: list[str]
