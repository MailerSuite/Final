from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, EmailStr


class JobStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class JobMode(str, Enum):
    O2 = "o2"
    O3 = "o3"


class EmailBase(BaseModel):
    email: EmailStr
    first_name: str | None = None
    last_name: str | None = None


class JobCreateRequest(BaseModel):
    mode: JobMode
    template_id: str
    smtp_accounts: list[str]
    email_bases: list[str]
    proxy_servers: list[str] | None = None
    config: dict[str, Any] | None = {}


class Job(BaseModel):
    id: str
    status: JobStatus
    mode: JobMode
    total_emails: int
    sent_emails: int
    failed_emails: int
    progress: float
    created_at: datetime
    started_at: datetime | None = None
    completed_at: datetime | None = None
    error_message: str | None = None
    config: dict[str, Any] | None = {}


class JobProgress(BaseModel):
    job_id: str
    status: JobStatus
    progress: float
    sent_emails: int
    failed_emails: int
    total_emails: int
    current_operation: str | None = None


class JobLog(BaseModel):
    id: str
    job_id: str
    level: str
    message: str
    details: dict[str, Any] | None = None
    created_at: datetime
