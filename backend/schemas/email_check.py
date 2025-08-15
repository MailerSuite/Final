from enum import Enum
from uuid import UUID

from pydantic import BaseModel


class InboxStatus(str, Enum):
    INBOX = "inbox"
    JUNK = "junk"
    SPAM = "spam"
    UNKNOWN = "unknown"


class EmailCheckRequest(BaseModel):
    smtp_id: UUID
    proxy_id: UUID | None = None
    template_id: UUID
    domain_id: UUID


class EmailCheckResponse(BaseModel):
    success: bool
    inbox_status: InboxStatus
    message_id: str | None = None
    error: str | None = None
