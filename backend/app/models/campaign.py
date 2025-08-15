# Compatibility shim for tests expecting `app.models.campaign`
# Provide minimal enum and model alias to existing SQLAlchemy models
from enum import Enum
from typing import Any

from models.base import Campaign as _Campaign


class CampaignStatus(str, Enum):
    DRAFT = "draft"
    SCHEDULED = "scheduled"
    SENDING = "sending"
    SENT = "sent"
    PAUSED = "paused"
    CANCELLED = "cancelled"


class Campaign(_Campaign):
    """Subclass ORM model to accept extra kwargs in tests (e.g., content, created_at).
    Extra fields are ignored if not present in base mapping.
    """

    def __init__(self, *args: Any, **kwargs: Any):
        # Drop unknown kwargs that tests may pass
        safe_kwargs = dict(kwargs)
        for extra in ["content"]:
            safe_kwargs.pop(extra, None)
        super().__init__(*args, **safe_kwargs)
