from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict, EmailStr, Field, validator

from services.smtp_service import SMTPTestMode


class SMTPStatus(str, Enum):
    PENDING = "pending"
    VALID = "valid"
    INVALID = "invalid"
    ERROR = "error"
    NONE = "none"
    DEAD = "dead"
    CHECKED = "checked"


class SMTPAccountBase(BaseModel):
    server: str | None = None
    port: int | None = None
    email: EmailStr
    password: str
    country: str | None = None


class SMTPAccountCreate(SMTPAccountBase):
    pass


class SMTPAccountUpdate(BaseModel):
    """Fields for updating an SMTP account."""

    server: str | None = None
    port: int | None = None
    email: EmailStr | None = None
    password: str | None = None
    status: SMTPStatus | None = None
    last_checked: datetime | None = None
    response_time: float | None = None
    error_message: str | None = None
    country: str | None = None


class DiscoveryStatus(str, Enum):
    PENDING = "pending"
    VALID = "valid"
    INVALID = "invalid"


class SMTPAccount(SMTPAccountBase):
    id: str
    session_id: str
    status: SMTPStatus
    discovery_status: DiscoveryStatus = DiscoveryStatus.PENDING
    last_checked: datetime | None = None
    response_time: float | None = None
    error_message: str | None = None
    created_at: datetime


class SMTPBulkUpload(BaseModel):
    data: str


class SMTPTestConfig(BaseModel):
    """Configuration for running an SMTP handshake test."""

    server: str
    port: int


class SMTPTestRequest(BaseModel):
    server: str
    port: int | str
    secure: bool | str = True
    email: EmailStr
    password: str
    timeout: int | None = 30

    @validator("port", pre=True)
    def _coerce_port(cls, v):
        if isinstance(v, str):
            if v.isdigit():
                return int(v)
            raise ValueError("invalid port")
        return v

    @validator("secure", pre=True)
    def _coerce_secure(cls, v):
        if isinstance(v, str):
            return v.lower() in {"1", "true", "yes", "t"}
        return bool(v)


class SMTPTestResult(BaseModel):
    email: str
    status: SMTPStatus
    response_time: float | None = None
    error_message: str | None = None


class SMTPBulkTestResponse(BaseModel):
    total: int
    valid: int
    invalid: int
    errors: int
    results: list[SMTPTestResult]


class CheckProgress(BaseModel):
    checked: int
    failed: int
    progress: int
    total: int


class SMTPCustomHandshake(BaseModel):
    """Request payload for the custom SMTP handshake endpoint."""

    hostname: str
    timeout: int
    message: str


class SMTPCustomHandshakeResponse(BaseModel):
    """Response returned after executing the custom SMTP handshake."""

    code: int
    response: str


class SMTPCheckRequest(BaseModel):
    host: str | None = None
    port: int
    email: EmailStr
    password: str
    timeout: int = 30


class SMTPToolRequest(BaseModel):
    host: str | None = None
    email: EmailStr
    password: str
    timeout: int = 30


class SMTPCred(BaseModel):
    host: str | None = None
    port: int
    user: EmailStr
    pass_: str = Field(alias="pass")
    mode: SMTPTestMode = SMTPTestMode.AUTO
    model_config = ConfigDict(populate_by_name=True)


class SMTPCredResult(BaseModel):
    hostResolved: str | None = None
    port: int
    modeUsed: SMTPTestMode
    result: bool
    error: str | None = None
    response_time: float | None = None


class SMTPImportRequest(BaseModel):
    data: str


class SMTPImportResponse(BaseModel):
    email: str
    server: str
    port: int
    security: str


class SMTPCredBulkResponse(BaseModel):
    """Response model for bulk SMTP credential tests."""

    results: list[SMTPCredResult]
