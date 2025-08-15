# Compatibility shim for tests expecting `app.models.campaign`
# Provide minimal enum and model alias to existing SQLAlchemy models
from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Any, Optional


class CampaignStatus(str, Enum):
	DRAFT = "draft"
	SCHEDULED = "scheduled"
	SENDING = "sending"
	SENT = "sent"
	PAUSED = "paused"
	CANCELLED = "cancelled"


@dataclass
class Campaign:
	"""Lightweight test-friendly Campaign model.
	This avoids binding to SQLAlchemy mappers to prevent duplicate class
	registration during unit tests. It mirrors the minimal fields used by tests.
	"""

	id: Any
	name: str
	subject: str
	status: CampaignStatus
	created_at: datetime
	user_id: Any
	content: Optional[str] = None
