"""Two-Factor Authentication Service"""
import random
import string
from datetime import datetime, timedelta
from typing import Optional, List, Dict
import json
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from sqlalchemy.orm import Session
from sqlalchemy import and_

from models.base import User
from models.system_smtp import SystemSMTPConfig
from core.security import hash_password, verify_password
from config.settings import settings


class TwoFactorService:
    """Service for handling 2FA operations"""
    
    def __init__(self, db: Session):
        self.db = db
        self.code_length = 6
        self.code_expiry_minutes = 10
        self.max_attempts = 3
        
    def generate_code(self) -> str:
        """Generate a random 6-digit code"""
        return ''.join(random.choices(string.digits, k=self.code_length))
    
    def generate_backup_codes(self, count: int = 8) -> List[str]:
        """Generate backup codes for recovery"""
        codes = []
        for _ in range(count):
            code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
            codes.append(f"{code[:4]}-{code[4:]}")
        return codes
    
    async def send_2fa_code(self, user: User, code: str) -> bool:
        """Send 2FA code via email"""
        try:
            # Get active SMTP configuration
            smtp_config = self.db.query(SystemSMTPConfig).filter(
                SystemSMTPConfig.is_active == True,
                SystemSMTPConfig.is_verified == True
            ).first()
            
            if not smtp_config:
                raise Exception("No active SMTP configuration found")
            
            # Create email message
            msg = MIMEMultipart('alternative')
            msg['Subject'] = 'Your SGPT Verification Code'
            msg['From'] = f"{smtp_config.from_name} <{smtp_config.from_email}>"
            msg['To'] = user.email
            
            # Create the HTML content
            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {{
                        font-family: Arial, sans-serif;
                        background-color: #f4f4f4;
                        margin: 0;
                        padding: 0;
                    }}
                    .container {{
                        max-width: 600px;
                        margin: 50px auto;
                        background-color: #ffffff;
                        padding: 40px;
                        border-radius: 10px;
                        box-shadow: 0 0 20px rgba(0,0,0,0.1);
                    }}
                    .header {{
                        text-align: center;
                        margin-bottom: 30px;
                    }}
                    .logo {{
                        font-size: 32px;
                        font-weight: bold;
                        color: #333;
                    }}
                    .code-box {{
                        background-color: #f8f9fa;
                        border: 2px solid #e9ecef;
                        border-radius: 8px;
                        padding: 20px;
                        text-align: center;
                        margin: 30px 0;
                    }}
                    .code {{
                        font-size: 36px;
                        font-weight: bold;
                        color: #007bff;
                        letter-spacing: 8px;
                        margin: 10px 0;
                    }}
                    .message {{
                        color: #666;
                        line-height: 1.6;
                        margin-bottom: 20px;
                    }}
                    .warning {{
                        color: #dc3545;
                        font-size: 14px;
                        margin-top: 20px;
                    }}
                    .footer {{
                        text-align: center;
                        color: #999;
                        font-size: 12px;
                        margin-top: 40px;
                        padding-top: 20px;
                        border-top: 1px solid #eee;
                    }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div class="logo">SGPT</div>
                    </div>
                    
                    <h2 style="color: #333; text-align: center;">Verification Code</h2>
                    
                    <p class="message">
                        Hello,<br><br>
                        You requested a verification code to access your SGPT account. 
                        Please use the following code to complete your login:
                    </p>
                    
                    <div class="code-box">
                        <div class="code">{code}</div>
                        <p style="color: #666; margin: 10px 0 0 0; font-size: 14px;">
                            This code will expire in {self.code_expiry_minutes} minutes
                        </p>
                    </div>
                    
                    <p class="message">
                        If you didn't request this code, please ignore this email. 
                        Your account remains secure.
                    </p>
                    
                    <p class="warning">
                        ⚠️ Never share this code with anyone. SGPT staff will never ask for your verification code.
                    </p>
                    
                    <div class="footer">
                        <p>This is an automated message from SGPT.<br>
                        Please do not reply to this email.</p>
                        <p>&copy; 2025 SGPT. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            # Create plain text version
            text_content = f"""
SGPT Verification Code

Hello,

You requested a verification code to access your SGPT account.
Please use the following code to complete your login:

{code}

This code will expire in {self.code_expiry_minutes} minutes.

If you didn't request this code, please ignore this email.
Your account remains secure.

Never share this code with anyone. SGPT staff will never ask for your verification code.

This is an automated message from SGPT.
Please do not reply to this email.

© 2025 SGPT. All rights reserved.
            """
            
            # Attach parts
            part1 = MIMEText(text_content, 'plain')
            part2 = MIMEText(html_content, 'html')
            msg.attach(part1)
            msg.attach(part2)
            
            # Send email
            if smtp_config.use_ssl:
                server = smtplib.SMTP_SSL(smtp_config.smtp_host, smtp_config.smtp_port)
            else:
                server = smtplib.SMTP(smtp_config.smtp_host, smtp_config.smtp_port)
                if smtp_config.use_tls:
                    server.starttls()
            
            server.login(smtp_config.smtp_username, smtp_config.smtp_password)
            server.send_message(msg)
            server.quit()
            
            return True
            
        except Exception as e:
            print(f"Error sending 2FA email: {str(e)}")
            return False
    
    async def initiate_2fa(self, user: User) -> Dict[str, any]:
        """Initiate 2FA process for user"""
        try:
            # Generate new code
            code = self.generate_code()
            
            # Store code with expiry
            user.two_factor_secret = code
            user.two_factor_secret_expires = datetime.utcnow() + timedelta(minutes=self.code_expiry_minutes)
            user.two_factor_verified = False
            
            self.db.commit()
            
            # Send code via email
            sent = await self.send_2fa_code(user, code)
            
            if not sent:
                raise Exception("Failed to send verification code")
            
            return {
                "success": True,
                "message": f"Verification code sent to {user.email}",
                "expires_in": self.code_expiry_minutes * 60  # seconds
            }
            
        except Exception as e:
            self.db.rollback()
            return {
                "success": False,
                "message": str(e)
            }
    
    def verify_2fa_code(self, user: User, code: str) -> Dict[str, any]:
        """Verify 2FA code"""
        try:
            # Check if code exists and not expired
            if not user.two_factor_secret:
                return {
                    "success": False,
                    "message": "No verification code found"
                }
            
            if user.two_factor_secret_expires < datetime.utcnow():
                return {
                    "success": False,
                    "message": "Verification code has expired"
                }
            
            # Verify code
            if user.two_factor_secret != code:
                return {
                    "success": False,
                    "message": "Invalid verification code"
                }
            
            # Mark as verified
            user.two_factor_verified = True
            user.two_factor_secret = None
            user.two_factor_secret_expires = None
            
            # Generate backup codes if 2FA is being enabled for first time
            if user.two_factor_enabled and not user.two_factor_backup_codes:
                backup_codes = self.generate_backup_codes()
                user.two_factor_backup_codes = json.dumps(backup_codes)
            
            self.db.commit()
            
            return {
                "success": True,
                "message": "Verification successful",
                "backup_codes": json.loads(user.two_factor_backup_codes) if user.two_factor_backup_codes else None
            }
            
        except Exception as e:
            self.db.rollback()
            return {
                "success": False,
                "message": str(e)
            }
    
    def enable_2fa(self, user: User) -> Dict[str, any]:
        """Enable 2FA for user"""
        try:
            user.two_factor_enabled = True
            
            # Generate backup codes
            backup_codes = self.generate_backup_codes()
            user.two_factor_backup_codes = json.dumps(backup_codes)
            
            self.db.commit()
            
            return {
                "success": True,
                "message": "Two-factor authentication enabled",
                "backup_codes": backup_codes
            }
            
        except Exception as e:
            self.db.rollback()
            return {
                "success": False,
                "message": str(e)
            }
    
    def disable_2fa(self, user: User) -> Dict[str, any]:
        """Disable 2FA for user"""
        try:
            user.two_factor_enabled = False
            user.two_factor_secret = None
            user.two_factor_secret_expires = None
            user.two_factor_verified = False
            user.two_factor_backup_codes = None
            
            self.db.commit()
            
            return {
                "success": True,
                "message": "Two-factor authentication disabled"
            }
            
        except Exception as e:
            self.db.rollback()
            return {
                "success": False,
                "message": str(e)
            }
    
    def verify_backup_code(self, user: User, code: str) -> Dict[str, any]:
        """Verify and consume a backup code"""
        try:
            if not user.two_factor_backup_codes:
                return {
                    "success": False,
                    "message": "No backup codes found"
                }
            
            backup_codes = json.loads(user.two_factor_backup_codes)
            
            if code not in backup_codes:
                return {
                    "success": False,
                    "message": "Invalid backup code"
                }
            
            # Remove used code
            backup_codes.remove(code)
            user.two_factor_backup_codes = json.dumps(backup_codes) if backup_codes else None
            user.two_factor_verified = True
            
            self.db.commit()
            
            return {
                "success": True,
                "message": "Backup code verified",
                "remaining_codes": len(backup_codes)
            }
            
        except Exception as e:
            self.db.rollback()
            return {
                "success": False,
                "message": str(e)
            }