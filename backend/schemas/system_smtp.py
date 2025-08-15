"""System SMTP Configuration Schemas"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Dict, Any
from datetime import datetime
from uuid import UUID


class SystemSMTPConfigBase(BaseModel):
    """Base SMTP configuration schema"""
    name: str = Field(..., min_length=1, max_length=100)
    smtp_host: str = Field(..., min_length=1, max_length=255)
    smtp_port: int = Field(..., ge=1, le=65535)
    smtp_username: str = Field(..., min_length=1, max_length=255)
    use_tls: bool = True
    use_ssl: bool = False
    from_email: EmailStr
    from_name: Optional[str] = Field(None, max_length=100)
    reply_to_email: Optional[EmailStr] = None
    daily_limit: int = Field(1000, ge=0)


class SystemSMTPConfigCreate(SystemSMTPConfigBase):
    """Schema for creating SMTP configuration"""
    smtp_password: str = Field(..., min_length=1)
    set_as_active: bool = False


class SystemSMTPConfigUpdate(BaseModel):
    """Schema for updating SMTP configuration"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    smtp_host: Optional[str] = Field(None, min_length=1, max_length=255)
    smtp_port: Optional[int] = Field(None, ge=1, le=65535)
    smtp_username: Optional[str] = Field(None, min_length=1, max_length=255)
    smtp_password: Optional[str] = Field(None, min_length=1)
    use_tls: Optional[bool] = None
    use_ssl: Optional[bool] = None
    from_email: Optional[EmailStr] = None
    from_name: Optional[str] = Field(None, max_length=100)
    reply_to_email: Optional[EmailStr] = None
    daily_limit: Optional[int] = Field(None, ge=0)
    set_as_active: Optional[bool] = False


class SystemSMTPConfigResponse(SystemSMTPConfigBase):
    """Schema for SMTP configuration response"""
    id: UUID
    is_active: bool
    is_verified: bool
    last_verified_at: Optional[datetime]
    emails_sent_today: int
    last_reset_date: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class SMTPTestRequest(BaseModel):
    """Schema for testing SMTP configuration"""
    # Either provide config_id to test existing config
    config_id: Optional[UUID] = None
    
    # Or provide full SMTP details for testing
    smtp_host: Optional[str] = None
    smtp_port: Optional[int] = None
    smtp_username: Optional[str] = None
    smtp_password: Optional[str] = None
    use_tls: Optional[bool] = True
    use_ssl: Optional[bool] = False
    from_email: Optional[EmailStr] = None
    from_name: Optional[str] = None
    
    # Test email options
    send_test_email: bool = False
    test_email_to: Optional[EmailStr] = None


class SMTPTestResponse(BaseModel):
    """Schema for SMTP test response"""
    success: bool
    message: str
    error: Optional[str] = None
    details: Optional[Dict[str, Any]] = None