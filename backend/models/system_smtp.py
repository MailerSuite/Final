"""System SMTP Configuration for 2FA emails"""
from sqlalchemy import Column, String, Integer, Boolean, DateTime, Text
from sqlalchemy.sql import func
from .base import Base, get_uuid_column


class SystemSMTPConfig(Base):
    """System-wide SMTP configuration for sending 2FA and system emails"""
    
    __tablename__ = "system_smtp_config"
    
    id = get_uuid_column()
    name = Column(String(100), nullable=False, default="System SMTP")
    
    # SMTP Server Settings
    smtp_host = Column(String(255), nullable=False)
    smtp_port = Column(Integer, nullable=False, default=587)
    smtp_username = Column(String(255), nullable=False)
    smtp_password = Column(Text, nullable=False)  # Will be encrypted
    
    # Security Settings
    use_tls = Column(Boolean, default=True, nullable=False)
    use_ssl = Column(Boolean, default=False, nullable=False)
    
    # Email Settings
    from_email = Column(String(255), nullable=False)
    from_name = Column(String(100), nullable=True, default="SGPT System")
    
    # Status
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    last_verified_at = Column(DateTime(timezone=True), nullable=True)
    
    # Limits
    daily_limit = Column(Integer, default=1000, nullable=False)
    emails_sent_today = Column(Integer, default=0, nullable=False)
    last_reset_date = Column(DateTime(timezone=True), default=func.now())
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=func.now())
    updated_at = Column(DateTime(timezone=True), default=func.now(), onupdate=func.now())
    
    # Additional settings
    reply_to_email = Column(String(255), nullable=True)
    custom_headers = Column(Text, nullable=True)  # JSON string
    
    def __repr__(self):
        return f"<SystemSMTPConfig(name={self.name}, host={self.smtp_host})>"