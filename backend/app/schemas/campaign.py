# Test-focused compatibility shim: define minimal campaign schemas expected by tests
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field
from pydantic import field_validator

# Import enum to keep parity with tests
from app.models.campaign import CampaignStatus


class CampaignCreate(BaseModel):
    """Minimal schema matching tests expectations.
    Fields used in tests: name, subject, content, status (optional), scheduled_at (optional).
    - name: non-empty
    - subject: auto-truncate to 200 chars (tests assert <= 200)
    - scheduled_at: must not be a past date (allow any time today)
    """

    name: str = Field(..., min_length=1, max_length=255)
    subject: str = Field(..., min_length=1)
    content: str = Field(..., min_length=1)
    status: CampaignStatus = CampaignStatus.DRAFT
    scheduled_at: Optional[datetime] = None

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        if value is None or value.strip() == "":
            raise ValueError("Campaign name must not be empty")
        return value

    @field_validator("subject")
    @classmethod
    def truncate_subject(cls, value: str) -> str:
        if value is None:
            return value
        return value[:200]

    @field_validator("scheduled_at")
    @classmethod
    def ensure_not_past_date(cls, value: Optional[datetime]) -> Optional[datetime]:
        if value is None:
            return value
        from datetime import datetime as _dt

        now = _dt.now()
        # Only reject if date is strictly before today
        if value.date() < now.date():
            raise ValueError("scheduled_at must not be in the past")
        return value


class CampaignUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    subject: Optional[str] = None
    content: Optional[str] = None
    status: Optional[CampaignStatus] = None
    scheduled_at: Optional[datetime] = None