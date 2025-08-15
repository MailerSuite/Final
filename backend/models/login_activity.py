"""
LoginActivity model for tracking user login attempts and sessions.
"""

import uuid

from sqlalchemy import Boolean, Column, DateTime, String, Text
from sqlalchemy.sql import func

from core.database import Base


class LoginActivity(Base):
    """Model for tracking user login activity and security events."""

    __tablename__ = "login_activity"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, nullable=True)  # Nullable for failed attempts
    fingerprint = Column(String(255), nullable=True)
    success = Column(Boolean, default=False)
    ip_address = Column(String(45), nullable=True)  # IPv6 compatible
    user_agent = Column(Text, nullable=True)
    location = Column(String(255), nullable=True)
    device_type = Column(String(50), nullable=True)
    browser = Column(String(100), nullable=True)
    os = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return f"<LoginActivity(id={self.id}, user_id={self.user_id}, success={self.success})>"
