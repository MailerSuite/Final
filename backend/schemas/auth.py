"""
Pydantic schemas for authentication.
"""

from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class UserLogin(BaseModel):
    """User login request schema."""

    email: EmailStr = Field(..., description="User email address")
    password: str = Field(
        ..., min_length=1, max_length=128, description="User password"
    )
    fingerprint: str | None = Field(
        None,
        min_length=10,
        max_length=200,
        description="Device fingerprint (optional)",
    )

    class Config:
        json_schema_extra = {
            "example": {
                "email": "user@example.com",
                "password": "securepassword123",
                "fingerprint": "device_fingerprint_hash_here",
            }
        }





class UserRegister(BaseModel):
    """User registration request schema."""

    email: EmailStr = Field(..., description="User email")
    password: str = Field(
        ...,
        min_length=8,
        max_length=128,
        description="User password (min 8 characters)",
    )
    enable_2fa: bool = Field(False, description="Enable 2FA during registration")
    fingerprint: str | None = Field(
        None,
        min_length=10,
        max_length=200,
        description="Device fingerprint (optional)",
    )

    class Config:
        json_schema_extra = {
            "example": {
                "email": "user@example.com",
                "password": "securepassword123",
                "fingerprint": "device_fingerprint_hash_here",
            }
        }


class UserResponse(BaseModel):
    id: str
    email: str
    is_active: bool
    is_admin: bool
    created_at: datetime

    class Config:
        from_attributes = True


class RefreshTokenRequest(BaseModel):
    """Request schema for token refresh."""

    refresh_token: str = Field(
        ..., description="Refresh token for generating new access token"
    )


class TokenResponse(BaseModel):
    """Enhanced token response with refresh token."""

    access_token: str
    refresh_token: str = Field(
        ..., description="Refresh token for obtaining new access tokens"
    )
    token_type: str = "bearer"
    expires_in: int = Field(
        ..., description="Access token expiration time in seconds"
    )
    user: UserResponse = None
    requires_2fa: bool = Field(False, description="Whether 2FA verification is required")
    user_id: str = Field(None, description="User ID for 2FA verification")
    message: str = Field(None, description="Additional message for 2FA flow")


class LoginActivityResponse(BaseModel):
    """Login activity response schema."""

    id: int
    user_id: str | None  # FIX: Changed from int to str to match UUID type
    fingerprint: str
    success: bool
    ip_address: str
    created_at: datetime

    class Config:
        from_attributes = True


class PasswordChange(BaseModel):
    """Password change request schema."""

    current_password: str = Field(..., description="Current password")
    new_password: str = Field(
        ..., min_length=8, description="New password (min 8 characters)"
    )


class PasswordResetRequest(BaseModel):
    """Password reset request schema."""
    
    email: EmailStr = Field(..., description="User email address")
    
    class Config:
        json_schema_extra = {
            "example": {
                "email": "user@example.com"
            }
        }


class PasswordResetConfirm(BaseModel):
    """Password reset confirmation schema."""
    
    token: str = Field(..., min_length=10, description="Password reset token")
    new_password: str = Field(
        ..., min_length=8, description="New password (min 8 characters)"
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "token": "reset_token_here",
                "new_password": "newsecurepassword123"
            }
        }


class PasswordResetResponse(BaseModel):
    """Password reset response schema."""
    
    message: str = Field(..., description="Response message")
    success: bool = Field(..., description="Whether the operation succeeded")


class ProfileUpdate(BaseModel):
    """Profile update request schema."""

    email: EmailStr | None = Field(None, description="New email")

    class Config:
        json_schema_extra = {"example": {"email": "newemail@example.com"}}
