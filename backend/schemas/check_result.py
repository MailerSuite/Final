from datetime import datetime
from enum import Enum
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class CheckerType(str, Enum):
    SMTP = "smtp"
    PROXY = "proxy"
    TEMPLATE = "template"
    DOMAIN = "domain"


class CheckStatus(str, Enum):
    INBOX = "inbox"
    JUNK = "junk"
    NOT_ARRIVED = "not_arrived"


class CheckResultRead(BaseModel):
    id: UUID
    checker_type: CheckerType
    ran_at: datetime
    status: CheckStatus | None = None
    model_config = ConfigDict(from_attributes=True)


class CheckResultUpdate(BaseModel):
    status: CheckStatus
