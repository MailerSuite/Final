"""System SMTP Configuration Router"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
import smtplib
import json

from core.database import get_db
from core.dependencies import get_current_user, require_admin
from models.base import User
from models.system_smtp import SystemSMTPConfig
from schemas.system_smtp import (
    SystemSMTPConfigCreate,
    SystemSMTPConfigUpdate,
    SystemSMTPConfigResponse,
    SMTPTestRequest,
    SMTPTestResponse
)
from core.security import encrypt_password, decrypt_password

router = APIRouter(tags=["SMTP"])


@router.get("/", response_model=List[SystemSMTPConfigResponse])
async def get_smtp_configs(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Get all SMTP configurations (admin only)"""
    configs = db.query(SystemSMTPConfig).all()
    return configs


@router.get("/active", response_model=Optional[SystemSMTPConfigResponse])
async def get_active_smtp_config(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Get active SMTP configuration"""
    config = db.query(SystemSMTPConfig).filter(
        SystemSMTPConfig.is_active == True,
        SystemSMTPConfig.is_verified == True
    ).first()
    return config


@router.post("/", response_model=SystemSMTPConfigResponse)
async def create_smtp_config(
    config_data: SystemSMTPConfigCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Create new SMTP configuration"""
    try:
        # Encrypt password before storing
        encrypted_password = encrypt_password(config_data.smtp_password)
        
        # Create new config
        new_config = SystemSMTPConfig(
            name=config_data.name,
            smtp_host=config_data.smtp_host,
            smtp_port=config_data.smtp_port,
            smtp_username=config_data.smtp_username,
            smtp_password=encrypted_password,
            use_tls=config_data.use_tls,
            use_ssl=config_data.use_ssl,
            from_email=config_data.from_email,
            from_name=config_data.from_name,
            reply_to_email=config_data.reply_to_email,
            daily_limit=config_data.daily_limit,
            is_active=False,  # Not active until verified
            is_verified=False
        )
        
        # If this should be the active config, deactivate others
        if config_data.set_as_active:
            db.query(SystemSMTPConfig).update({"is_active": False})
        
        db.add(new_config)
        db.commit()
        db.refresh(new_config)
        
        return new_config
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create SMTP configuration: {str(e)}"
        )


@router.put("/{config_id}", response_model=SystemSMTPConfigResponse)
async def update_smtp_config(
    config_id: str,
    config_data: SystemSMTPConfigUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Update SMTP configuration"""
    config = db.query(SystemSMTPConfig).filter(
        SystemSMTPConfig.id == config_id
    ).first()
    
    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="SMTP configuration not found"
        )
    
    try:
        # Update fields
        update_data = config_data.dict(exclude_unset=True)
        
        # Encrypt password if provided
        if "smtp_password" in update_data and update_data["smtp_password"]:
            update_data["smtp_password"] = encrypt_password(update_data["smtp_password"])
        
        # Handle activation
        if config_data.set_as_active:
            # Deactivate all other configs
            db.query(SystemSMTPConfig).filter(
                SystemSMTPConfig.id != config_id
            ).update({"is_active": False})
            update_data["is_active"] = True
        
        # Update config
        for field, value in update_data.items():
            if field != "set_as_active":
                setattr(config, field, value)
        
        config.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(config)
        
        return config
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to update SMTP configuration: {str(e)}"
        )


@router.delete("/{config_id}")
async def delete_smtp_config(
    config_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Delete SMTP configuration"""
    config = db.query(SystemSMTPConfig).filter(
        SystemSMTPConfig.id == config_id
    ).first()
    
    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="SMTP configuration not found"
        )
    
    if config.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete active SMTP configuration"
        )
    
    db.delete(config)
    db.commit()
    
    return {"message": "SMTP configuration deleted successfully"}


@router.post("/test", response_model=SMTPTestResponse)
async def test_smtp_config(
    test_data: SMTPTestRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Test SMTP configuration"""
    try:
        # Get config if ID provided, otherwise use provided data
        if test_data.config_id:
            config = db.query(SystemSMTPConfig).filter(
                SystemSMTPConfig.id == test_data.config_id
            ).first()
            
            if not config:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="SMTP configuration not found"
                )
            
            smtp_host = config.smtp_host
            smtp_port = config.smtp_port
            smtp_username = config.smtp_username
            smtp_password = decrypt_password(config.smtp_password)
            use_tls = config.use_tls
            use_ssl = config.use_ssl
            from_email = config.from_email
            from_name = config.from_name
        else:
            # Use provided test data
            smtp_host = test_data.smtp_host
            smtp_port = test_data.smtp_port
            smtp_username = test_data.smtp_username
            smtp_password = test_data.smtp_password
            use_tls = test_data.use_tls
            use_ssl = test_data.use_ssl
            from_email = test_data.from_email
            from_name = test_data.from_name
        
        # Test connection
        if use_ssl:
            server = smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=10)
        else:
            server = smtplib.SMTP(smtp_host, smtp_port, timeout=10)
            if use_tls:
                server.starttls()
        
        # Try to login
        server.login(smtp_username, smtp_password)
        
        # Send test email if requested
        if test_data.send_test_email and test_data.test_email_to:
            from email.mime.text import MIMEText
            from email.mime.multipart import MIMEMultipart
            
            msg = MIMEMultipart()
            msg['Subject'] = 'SGPT SMTP Test Email'
            msg['From'] = f"{from_name} <{from_email}>"
            msg['To'] = test_data.test_email_to
            
            body = """
This is a test email from SGPT to verify SMTP configuration.

If you received this email, your SMTP settings are configured correctly.

Configuration tested:
- Host: {}
- Port: {}
- Security: {}

Best regards,
SGPT Team
            """.format(
                smtp_host,
                smtp_port,
                "SSL" if use_ssl else ("TLS" if use_tls else "None")
            )
            
            msg.attach(MIMEText(body, 'plain'))
            server.send_message(msg)
        
        server.quit()
        
        # Update verification status if testing existing config
        if test_data.config_id and config:
            config.is_verified = True
            config.last_verified_at = datetime.utcnow()
            db.commit()
        
        return SMTPTestResponse(
            success=True,
            message="SMTP configuration is valid and working",
            details={
                "host": smtp_host,
                "port": smtp_port,
                "security": "SSL" if use_ssl else ("TLS" if use_tls else "None"),
                "test_email_sent": bool(test_data.send_test_email and test_data.test_email_to)
            }
        )
        
    except smtplib.SMTPAuthenticationError:
        return SMTPTestResponse(
            success=False,
            message="Authentication failed. Please check username and password.",
            error="SMTP_AUTH_ERROR"
        )
    except smtplib.SMTPConnectError:
        return SMTPTestResponse(
            success=False,
            message="Failed to connect to SMTP server. Please check host and port.",
            error="SMTP_CONNECT_ERROR"
        )
    except smtplib.SMTPServerDisconnected:
        return SMTPTestResponse(
            success=False,
            message="Server unexpectedly disconnected. Please check security settings.",
            error="SMTP_DISCONNECT_ERROR"
        )
    except Exception as e:
        return SMTPTestResponse(
            success=False,
            message=f"SMTP test failed: {str(e)}",
            error="SMTP_GENERAL_ERROR"
        )


@router.post("/{config_id}/activate")
async def activate_smtp_config(
    config_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Activate SMTP configuration"""
    config = db.query(SystemSMTPConfig).filter(
        SystemSMTPConfig.id == config_id
    ).first()
    
    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="SMTP configuration not found"
        )
    
    if not config.is_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="SMTP configuration must be verified before activation"
        )
    
    # Deactivate all other configs
    db.query(SystemSMTPConfig).filter(
        SystemSMTPConfig.id != config_id
    ).update({"is_active": False})
    
    # Activate this config
    config.is_active = True
    db.commit()
    
    return {"message": "SMTP configuration activated successfully"}