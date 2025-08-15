from datetime import datetime

from sqlalchemy import (
    JSON,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID

from .base import Base


class CheckLog(Base):
    """Generic log entry for checker results."""

    __tablename__ = "check_logs"
    id = Column(Integer, primary_key=True, autoincrement=True)
    check_type = Column(String(50), nullable=False)
    input_params = Column(JSON, nullable=False)
    status = Column(String(20), nullable=False)
    response = Column(JSON)
    error_message = Column(Text)
    checked_at = Column(DateTime, default=datetime.utcnow)
    duration_ms = Column(Float)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    session_id = Column(
        UUID(as_uuid=True), ForeignKey("sessions.id"), nullable=True
    )
