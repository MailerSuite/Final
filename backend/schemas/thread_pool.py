from datetime import datetime
from enum import Enum
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ThreadPriority(str, Enum):
    HIGH = "high"
    NORMAL = "normal"
    LOW = "low"


class ThreadPoolBase(BaseModel):
    name: str
    priority: ThreadPriority = ThreadPriority.NORMAL
    max_connections: int = Field(..., ge=1, le=100)
    delay_ms: int = Field(0, ge=0)
    enabled: bool = True


class ThreadPoolCreate(ThreadPoolBase):
    pass


class ThreadPoolUpdate(BaseModel):
    name: str | None = None
    priority: ThreadPriority | None = None
    max_connections: int | None = Field(None, ge=1, le=100)
    delay_ms: int | None = Field(None, ge=0)
    enabled: bool | None = None


class ThreadPoolResponse(ThreadPoolBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)
