from enum import Enum

from pydantic import BaseModel, EmailStr, Field


class BulkMailJobStatus(str, Enum):
    pending = "pending"
    in_progress = "in_progress"
    completed = "completed"
    failed = "failed"


class BulkMailRequest(BaseModel):
    subject: str = Field(..., example="Promo")
    body_html: str = Field(..., example="<b>Hello</b>")
    recipients: list[EmailStr] = Field(..., example=["user@example.com"])
    attachments: list[str] | None = Field(
        default=None, example=["https://s3/presigned"]
    )


class BulkMailJobRead(BaseModel):
    id: str
    status: BulkMailJobStatus
    sent: int
    failed: int
    total: int
    partial_failures: list[EmailStr] | None = None
