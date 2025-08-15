import uuid
from datetime import datetime

from sqlalchemy import JSON, Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from .base import Base


class BulkMailJob(Base):
    __tablename__ = "bulk_mail_jobs"
    id = Column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    status = Column(String(20), default="pending")
    total = Column(Integer, default=0)
    sent = Column(Integer, default=0)
    failed = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    started_at = Column(DateTime)
    completed_at = Column(DateTime)
    paused_at = Column(DateTime)
    retry_count = Column(Integer, default=0)
    last_error = Column(String)
    partial_failures = Column(JSON, nullable=True)
    user = relationship("User")
