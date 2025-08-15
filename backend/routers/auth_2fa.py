"""Authentication router with 2FA support"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional, Dict

from core.database import get_db
from core.security import verify_password
from core.dependencies import create_access_token, get_current_user
from models.base import User
from schemas.auth import UserLogin, UserRegister, TokenResponse
from schemas.two_factor import (
    TwoFactorInitiateRequest,
    TwoFactorInitiateResponse,
    TwoFactorVerifyRequest,
    TwoFactorVerifyResponse,
    TwoFactorStatusResponse,
    TwoFactorEnableRequest,
    TwoFactorBackupCodesResponse
)
from services.two_factor_service import TwoFactorService
from services.auth_service import AuthService
from core.error_handlers import StandardErrorResponse

router = APIRouter(tags=["Security"])


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="User login",
    description="Authenticate user and return access and refresh tokens.",
    responses={
        401: {"model": StandardErrorResponse, "description": "Unauthorized"},
        422: {"description": "Validation Error"},
    },
)
async def login(
    user_data: UserLogin,
    request: Request,
    db: Session = Depends(get_db)
):
    """Login with 2FA support"""
    # Find user
    user = db.query(User).filter(User.email == user_data.email).first()
    
    if not user or not verify_password(user_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is disabled"
        )
    
    # Check if 2FA is enabled - TEMPORARILY DISABLED
    # if user.two_factor_enabled:
    #     # If 2FA is enabled, don't return token yet
    #     # Instead, initiate 2FA process
    #     two_fa_service = TwoFactorService(db)
    #     result = await two_fa_service.initiate_2fa(user)
    #     
    #     if not result["success"]:
    #         raise HTTPException(
    #             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
    #             detail=result["message"]
    #         )
    #     
    #     # Return partial success with 2FA required flag
    #     return TokenResponse(
    #         access_token="",  # No token yet
    #         refresh_token="",
    #         token_type="bearer",
    #         expires_in=0,
    #         requires_2fa=True,
    #         user_id=str(user.id),
    #         message="2FA verification required. Check your email for the verification code."
    #     )
    
    # No 2FA, proceed with normal login
    access_token = create_access_token(
        data={"sub": user.email, "user_id": str(user.id)}
    )
    refresh_token = create_access_token(
        data={"sub": user.email, "user_id": str(user.id), "type": "refresh"},
        expires_delta=timedelta(days=7)
    )
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=3600,
        requires_2fa=False,
        user_id=str(user.id)
    )


@router.post("/register", response_model=Dict[str, str])
async def register(
    user_data: UserRegister,
    db: Session = Depends(get_db)
):
    """Register new user with optional 2FA"""
    # Check if user exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    auth_service = AuthService(db)
    user = auth_service.create_user(
        email=user_data.email,
        password=user_data.password,
        enable_2fa=user_data.enable_2fa if hasattr(user_data, 'enable_2fa') else False
    )
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create user"
        )
    
    # If 2FA is requested, initiate it
    if user_data.enable_2fa:
        two_fa_service = TwoFactorService(db)
        result = await two_fa_service.initiate_2fa(user)
        
        if result["success"]:
            return {
                "message": "Registration successful. Check your email for 2FA setup code.",
                "requires_2fa_setup": True,
                "user_id": str(user.id)
            }
    
    return {
        "message": "Registration successful",
        "requires_2fa_setup": False,
        "user_id": str(user.id)
    }


@router.post("/2fa/verify", response_model=TwoFactorVerifyResponse)
async def verify_2fa(
    verify_data: TwoFactorVerifyRequest,
    db: Session = Depends(get_db)
):
    """Verify 2FA code and complete login"""
    # Find user
    user = db.query(User).filter(User.id == verify_data.user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    two_fa_service = TwoFactorService(db)
    
    # Try regular code first
    if verify_data.code:
        result = two_fa_service.verify_2fa_code(user, verify_data.code)
    # Try backup code if provided
    elif verify_data.backup_code:
        result = two_fa_service.verify_backup_code(user, verify_data.backup_code)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either code or backup_code must be provided"
        )
    
    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=result["message"]
        )
    
    # Generate tokens after successful 2FA
    access_token = create_access_token(
        data={"sub": user.email, "user_id": str(user.id)}
    )
    refresh_token = create_access_token(
        data={"sub": user.email, "user_id": str(user.id), "type": "refresh"},
        expires_delta=timedelta(days=7)
    )
    
    return TwoFactorVerifyResponse(
        success=True,
        message="2FA verification successful",
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=3600,
        backup_codes=result.get("backup_codes")
    )


@router.post("/2fa/resend")
async def resend_2fa_code(
    request: TwoFactorInitiateRequest,
    db: Session = Depends(get_db)
):
    """Resend 2FA code"""
    user = db.query(User).filter(User.id == request.user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    two_fa_service = TwoFactorService(db)
    result = await two_fa_service.initiate_2fa(user)
    
    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=result["message"]
        )
    
    return TwoFactorInitiateResponse(
        success=True,
        message=result["message"],
        expires_in=result["expires_in"]
    )


@router.get("/2fa/status", response_model=TwoFactorStatusResponse)
async def get_2fa_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get 2FA status for current user"""
    backup_codes_count = 0
    if current_user.two_factor_backup_codes:
        import json
        codes = json.loads(current_user.two_factor_backup_codes)
        backup_codes_count = len(codes)
    
    return TwoFactorStatusResponse(
        enabled=current_user.two_factor_enabled,
        verified=current_user.two_factor_verified,
        backup_codes_count=backup_codes_count
    )


@router.post("/2fa/enable")
async def enable_2fa(
    request: TwoFactorEnableRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Enable 2FA for current user"""
    if current_user.two_factor_enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="2FA is already enabled"
        )
    
    two_fa_service = TwoFactorService(db)
    
    # First initiate 2FA to send code
    if request.send_code:
        result = await two_fa_service.initiate_2fa(current_user)
        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=result["message"]
            )
        
        return {
            "success": True,
            "message": "Verification code sent. Please verify to enable 2FA.",
            "expires_in": result["expires_in"]
        }
    
    # If code provided, verify and enable
    if request.verification_code:
        verify_result = two_fa_service.verify_2fa_code(current_user, request.verification_code)
        if not verify_result["success"]:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=verify_result["message"]
            )
        
        # Enable 2FA
        enable_result = two_fa_service.enable_2fa(current_user)
        if not enable_result["success"]:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=enable_result["message"]
            )
        
        return TwoFactorBackupCodesResponse(
            success=True,
            message="2FA enabled successfully",
            backup_codes=enable_result["backup_codes"]
        )
    
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Either send_code or verification_code must be provided"
    )


@router.post("/2fa/disable")
async def disable_2fa(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Disable 2FA for current user"""
    if not current_user.two_factor_enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="2FA is not enabled"
        )
    
    two_fa_service = TwoFactorService(db)
    result = two_fa_service.disable_2fa(current_user)
    
    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=result["message"]
        )
    
    return {
        "success": True,
        "message": "2FA disabled successfully"
    }


@router.get("/2fa/backup-codes", response_model=TwoFactorBackupCodesResponse)
async def get_backup_codes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get backup codes for current user"""
    if not current_user.two_factor_enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="2FA is not enabled"
        )
    
    if not current_user.two_factor_backup_codes:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No backup codes found"
        )
    
    import json
    backup_codes = json.loads(current_user.two_factor_backup_codes)
    
    return TwoFactorBackupCodesResponse(
        success=True,
        message="Backup codes retrieved",
        backup_codes=backup_codes
    )


@router.post("/2fa/regenerate-backup-codes")
async def regenerate_backup_codes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Regenerate backup codes"""
    if not current_user.two_factor_enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="2FA is not enabled"
        )
    
    two_fa_service = TwoFactorService(db)
    backup_codes = two_fa_service.generate_backup_codes()
    
    import json
    current_user.two_factor_backup_codes = json.dumps(backup_codes)
    db.commit()
    
    return TwoFactorBackupCodesResponse(
        success=True,
        message="New backup codes generated",
        backup_codes=backup_codes
    )