"""Debug models for storing client-side debug events."""

from sqlalchemy import JSON, Column, String, Text

from .base import GUID, Base, TimestampMixin


class DebugClientEvent(Base, TimestampMixin):
    """Model for storing client-side debug events."""

    __tablename__ = "debug_client_events"

    id = Column(
        GUID(),
        primary_key=True,
        default=lambda: str(__import__("uuid").uuid4()),
    )
    trace_id = Column(String(255), nullable=False, index=True)
    event_type = Column(String(100), nullable=False, index=True)
    user_agent = Column(Text)
    url = Column(Text)
    ip_address = Column(String(45))  # Support IPv6
    data = Column(JSON)  # Store the actual debug data as JSON

    def __repr__(self):
        return f"<DebugClientEvent(id={self.id}, event_type={self.event_type}, trace_id={self.trace_id})>"
