from datetime import datetime
from enum import Enum
from uuid import UUID, uuid4

from sqlmodel import Field, SQLModel


class InboxResult(str, Enum):
    INBOX = "inbox"
    JUNK = "junk"
    SPAM = "spam"
    UNKNOWN = "unknown"


class EmailStatus(SQLModel, table=True):
    __tablename__ = "email_statuses"
    __table_args__ = {"extend_existing": True}
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    smtp_id: UUID
    proxy_id: UUID | None = None
    template_id: UUID
    domain_id: UUID
    message_id: str | None = None
    inbox_status: InboxResult = Field(default=InboxResult.UNKNOWN)
    error: str | None = None
    retry_count: int = 0
    last_error: str | None = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
