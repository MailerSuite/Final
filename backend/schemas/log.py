from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class SessionLog(BaseModel):
    """Log entry tied to a session."""

    id: UUID
    created_at: datetime
    level: str
    message: str
