"""Two-Factor Authentication Schemas"""
from pydantic import BaseModel, Field
from typing import Optional, List
from uuid import UUID


class TwoFactorInitiateRequest(BaseModel):
    """Request to initiate 2FA"""
    user_id: UUID


class TwoFactorInitiateResponse(BaseModel):
    """Response for 2FA initiation"""
    success: bool
    message: str
    expires_in: int  # seconds


class TwoFactorVerifyRequest(BaseModel):
    """Request to verify 2FA code"""
    user_id: UUID
    code: Optional[str] = Field(None, min_length=6, max_length=6)
    backup_code: Optional[str] = Field(None, pattern=r"^[A-Z0-9]{4}-[A-Z0-9]{4}$")


class TwoFactorVerifyResponse(BaseModel):
    """Response for 2FA verification"""
    success: bool
    message: str
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None
    token_type: Optional[str] = "bearer"
    expires_in: Optional[int] = None
    backup_codes: Optional[List[str]] = None


class TwoFactorStatusResponse(BaseModel):
    """Response for 2FA status"""
    enabled: bool
    verified: bool
    backup_codes_count: int


class TwoFactorEnableRequest(BaseModel):
    """Request to enable 2FA"""
    send_code: Optional[bool] = True
    verification_code: Optional[str] = Field(None, min_length=6, max_length=6)


class TwoFactorBackupCodesResponse(BaseModel):
    """Response with backup codes"""
    success: bool
    message: str
    backup_codes: List[str]