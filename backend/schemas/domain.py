from datetime import datetime
from enum import Enum
from uuid import UUID

from pydantic import BaseModel


class DomainStatus(str, Enum):
    NONE = "none"
    CHECKED = "checked"
    DEAD = "dead"


class DomainBase(BaseModel):
    url: str
    domain_type: str | None = None
    country: str | None = None


class DomainCreate(DomainBase):
    pass


class DomainUpdate(BaseModel):
    url: str | None = None
    domain_type: str | None = None
    status: DomainStatus | None = None
    auth_status: bool | None = None
    last_checked: datetime | None = None
    response_time: float | None = None
    error_message: str | None = None
    country: str | None = None


class Domain(DomainBase):
    id: UUID
    status: DomainStatus = DomainStatus.NONE
    auth_status: bool = False
    last_checked: datetime | None = None
    response_time: float | None = None
    error_message: str | None = None
    created_at: datetime
    updated_at: datetime | None = None
