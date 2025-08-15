from datetime import datetime
from enum import Enum
from uuid import UUID, uuid4

from sqlmodel import Field, SQLModel


class CheckerType(str, Enum):
    """Type of check that produced a result."""

    SMTP = "smtp"
    PROXY = "proxy"
    TEMPLATE = "template"
    DOMAIN = "domain"


class CheckStatus(str, Enum):
    """Classification result for a check."""

    INBOX = "inbox"
    JUNK = "junk"
    NOT_ARRIVED = "not_arrived"


class CheckResult(SQLModel, table=True):
    """Persisted result of a deliverability check."""

    __tablename__ = "check_results"
    __table_args__ = {"extend_existing": True}
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    checker_type: CheckerType = Field(index=False)
    ran_at: datetime = Field(default_factory=datetime.utcnow)
    status: CheckStatus | None = Field(default=CheckStatus.NOT_ARRIVED)
