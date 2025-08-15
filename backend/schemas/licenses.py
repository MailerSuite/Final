from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class LicenseCreate(BaseModel):
    plan_id: UUID
    is_trial: bool = False


class LicenseResponse(BaseModel):
    id: UUID
    user_id: UUID
    plan_id: UUID
    is_trial: bool
    starts_at: datetime
    expires_at: datetime | None = None
    model_config = ConfigDict(from_attributes=True)
