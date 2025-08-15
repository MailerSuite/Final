"""
Enhanced Authentication Service with comprehensive error handling and security.
"""

import logging
import secrets
from datetime import datetime, timedelta
from uuid import UUID, uuid4

import jwt
from fastapi import HTTPException, status
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session

from config.settings import settings
from models import LoginActivity, User
from schemas.auth import TokenResponse, UserRegister, UserResponse

logger = logging.getLogger(__name__)

# Enhanced password context with stronger settings
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__rounds=12,  # Increased rounds for better security
)


class AuthenticationError(Exception):
    """Custom authentication error."""

    pass


class AuthService:
    """Enhanced Authentication Service with comprehensive error handling."""

    def __init__(self, db: Session | AsyncSession | None = None, **_: dict):
        # Optional DB handle for compatibility with tests
        self.db = db
        self.failed_attempts = {}  # In production, use Redis
        self.blacklisted_tokens = set()  # In production, use Redis
        self.refresh_tokens = {}  # In production, use Redis
        self.password_reset_tokens = {}  # In production, use Redis with expiration

    def verify_password(
        self, plain_password: str, hashed_password: str
    ) -> bool:
        """Verify password with enhanced error handling."""
        try:
            return pwd_context.verify(plain_password, hashed_password)
        except Exception as e:
            logger.error(f"Password verification error: {e}")
            return False

    def get_password_hash(self, password: str) -> str:
        """Hash password with enhanced error handling."""
        try:
            return pwd_context.hash(password)
        except Exception as e:
            logger.error(f"Password hashing error: {e}")
            raise AuthenticationError("Password hashing failed")
    
    def create_user(self, db: Session, email: str, password: str, enable_2fa: bool = False):
        """Create a new user with optional 2FA"""
        try:
            from models.base import User
            
            # Hash password
            password_hash = self.get_password_hash(password)
            
            # Create user
            user = User(
                email=email,
                password_hash=password_hash,
                is_active=True,
                is_admin=False,
                two_factor_enabled=enable_2fa
            )
            
            db.add(user)
            db.commit()
            db.refresh(user)
            
            return user
            
        except Exception as e:
            db.rollback()
            logger.error(f"User creation error: {e}")
            return None

    def create_access_token(
        self, data: dict, expires_delta: timedelta | None = None
    ) -> str:
        """Create JWT access token with enhanced security."""
        try:
            to_encode = data.copy()
            if expires_delta:
                expire = datetime.utcnow() + expires_delta
            else:
                expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

            to_encode.update(
                {
                    "exp": expire,
                    "iat": datetime.utcnow(),
                    "jti": secrets.token_urlsafe(32),
                    "type": "access",
                }
            )

            return jwt.encode(
                to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM
            )
        except Exception as e:
            logger.error(f"Token creation error: {e}")
            raise AuthenticationError("Token creation failed")

    def create_refresh_token(self, user_id: str) -> str:
        """Create secure refresh token."""
        try:
            token_data = {
                "sub": user_id,
                "type": "refresh",
                "exp": datetime.utcnow()
                + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
                "iat": datetime.utcnow(),
                "jti": secrets.token_urlsafe(32),
            }

            refresh_token = jwt.encode(
                token_data, settings.SECRET_KEY, algorithm=settings.ALGORITHM
            )
            self.refresh_tokens[token_data["jti"]] = user_id
            return refresh_token
        except Exception as e:
            logger.error(f"Refresh token creation error: {e}")
            raise AuthenticationError("Refresh token creation failed")

    def check_brute_force(self, ip_address: str) -> bool:
        """Enhanced brute force protection."""
        if ip_address not in self.failed_attempts:
            return False

        attempt_data = self.failed_attempts[ip_address]

        # Check if lockout period has expired
        if (
            attempt_data.get("lockout_until")
            and datetime.utcnow() < attempt_data["lockout_until"]
        ):
            return True

        # Reset if lockout expired
        if (
            attempt_data.get("lockout_until")
            and datetime.utcnow() >= attempt_data["lockout_until"]
        ):
            self.failed_attempts.pop(ip_address, None)
            return False

        return False

    def record_failed_attempt(self, ip_address: str):
        """Record failed login attempt with progressive lockout."""
        if ip_address not in self.failed_attempts:
            self.failed_attempts[ip_address] = {
                "count": 0,
                "last_attempt": None,
            }

        self.failed_attempts[ip_address]["count"] += 1
        self.failed_attempts[ip_address]["last_attempt"] = datetime.utcnow()

        # Progressive lockout
        count = self.failed_attempts[ip_address]["count"]
        if count >= 15:
            lockout_duration = timedelta(hours=24)
        elif count >= 10:
            lockout_duration = timedelta(hours=1)
        elif count >= 5:
            lockout_duration = timedelta(minutes=15)
        else:
            return

        self.failed_attempts[ip_address]["lockout_until"] = (
            datetime.utcnow() + lockout_duration
        )
        logger.warning(
            f"IP {ip_address} locked out for {lockout_duration} after {count} failed attempts"
        )

    async def authenticate_user(
        self, email: str, password: str, db: AsyncSession
    ) -> User:
        """Enhanced user authentication with comprehensive error handling."""
        try:
            # Find user by email
            result = await db.execute(select(User).where(User.email == email))
            user = result.scalar_one_or_none()

            if not user:
                logger.warning(
                    f"Authentication failed: User not found for email {email}"
                )
                raise AuthenticationError("Invalid credentials")

            # Verify password
            if not self.verify_password(
                password, user.password_hash
            ):
                logger.warning(
                    f"Authentication failed: Invalid password for email {email}"
                )
                raise AuthenticationError("Invalid credentials")

            # Check if user is active
            if not getattr(user, "is_active", True):
                logger.warning(
                    f"Authentication failed: User inactive for email {email}"
                )
                raise AuthenticationError("Account disabled")

            logger.info(f"Successful authentication for email {email}")
            return user

        except AuthenticationError:
            raise
        except SQLAlchemyError as e:
            logger.error(f"Database error during authentication: {e}")
            raise AuthenticationError("Authentication service unavailable")
        except Exception as e:
            logger.error(f"Unexpected error during authentication: {e}")
            raise AuthenticationError("Authentication failed")

    async def create_user(
        self, user_data: UserRegister, db: AsyncSession
    ) -> User:
        """Create new user with comprehensive error handling."""
        try:
            # Check if user already exists
            result = await db.execute(
                select(User).where(User.email == user_data.email)
            )
            existing_user = result.scalar_one_or_none()

            if existing_user:
                raise AuthenticationError("Email already registered")

            # Hash password
            hashed_password = self.get_password_hash(user_data.password)

            # Create user
            db_user = User(
                id=uuid4(),
                email=user_data.email,
                password_hash=hashed_password,
                is_active=True,
                is_admin=False,
                created_at=datetime.utcnow(),
            )

            db.add(db_user)
            await db.commit()
            await db.refresh(db_user)

            logger.info(f"Successfully created user: {user_data.email}")
            return db_user

        except AuthenticationError:
            raise
        except IntegrityError as e:
            await db.rollback()
            logger.error(f"Integrity error creating user: {e}")
            raise AuthenticationError("Email already registered")
        except SQLAlchemyError as e:
            await db.rollback()
            logger.error(f"Database error creating user: {e}")
            raise AuthenticationError("User creation failed")
        except Exception as e:
            await db.rollback()
            logger.error(f"Unexpected error creating user: {e}")
            raise AuthenticationError("User creation failed")

    async def log_login_activity(
        self,
        user_id: UUID | None,
        fingerprint: str,
        success: bool,
        ip_address: str,
        db: AsyncSession,
    ):
        """Log login activity with error handling."""
        try:
            login_activity = LoginActivity(
                user_id=user_id,
                fingerprint=fingerprint,
                success=success,
                ip_address=ip_address,
                created_at=datetime.utcnow(),
            )
            db.add(login_activity)
            await db.commit()
        except Exception as e:
            logger.error(f"Failed to log login activity: {e}")
            # Don't raise exception here as login should succeed even if logging fails

    def create_token_response(self, user: User) -> TokenResponse:
        """Create standardized token response."""
        try:
            # Create tokens
            access_token_expires = timedelta(
                minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
            )
            access_token = self.create_access_token(
                data={"sub": str(user.id)},
                expires_delta=access_token_expires,
            )

            refresh_token = self.create_refresh_token(str(user.id))

            return TokenResponse(
                access_token=access_token,
                refresh_token=refresh_token,
                token_type="bearer",
                expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
                user=UserResponse(
                    id=str(user.id),
                    email=user.email,
                    is_active=getattr(user, "is_active", True),
                    is_admin=getattr(user, "is_admin", False),
                    created_at=user.created_at,
                ),
            )
        except Exception as e:
            logger.error(f"Token response creation error: {e}")
            raise AuthenticationError("Token generation failed")

    def create_password_reset_token(self, user_id: str) -> str:
        """Create a secure password reset token."""
        try:
            # Generate a secure random token
            reset_token = secrets.token_urlsafe(32)
            
            # Store with expiration (15 minutes)
            expires_at = datetime.utcnow() + timedelta(minutes=15)
            self.password_reset_tokens[reset_token] = {
                "user_id": user_id,
                "expires_at": expires_at
            }
            
            logger.info(f"Password reset token created for user: {user_id}")
            return reset_token
            
        except Exception as e:
            logger.error(f"Password reset token creation error: {e}")
            raise AuthenticationError("Password reset token creation failed")

    def verify_password_reset_token(self, token: str) -> str | None:
        """Verify password reset token and return user_id if valid."""
        try:
            if token not in self.password_reset_tokens:
                logger.warning(f"Invalid password reset token attempted: {token[:10]}...")
                return None
            
            token_data = self.password_reset_tokens[token]
            
            # Check if token has expired
            if datetime.utcnow() > token_data["expires_at"]:
                logger.info(f"Expired password reset token attempted: {token[:10]}...")
                # Clean up expired token
                del self.password_reset_tokens[token]
                return None
            
            logger.info(f"Valid password reset token verified for user: {token_data['user_id']}")
            return token_data["user_id"]
            
        except Exception as e:
            logger.error(f"Password reset token verification error: {e}")
            return None

    def invalidate_password_reset_token(self, token: str):
        """Invalidate a password reset token after use."""
        try:
            if token in self.password_reset_tokens:
                user_id = self.password_reset_tokens[token]["user_id"]
                del self.password_reset_tokens[token]
                logger.info(f"Password reset token invalidated for user: {user_id}")
        except Exception as e:
            logger.error(f"Token invalidation error: {e}")

    async def request_password_reset(self, email: str, db: AsyncSession) -> bool:
        """Request password reset for a user by email."""
        try:
            # Find user by email
            result = await db.execute(select(User).where(User.email == email))
            user = result.scalar_one_or_none()
            
            if not user:
                logger.warning(f"Password reset requested for non-existent email: {email}")
                # Return False but don't reveal that email doesn't exist for security
                return False
            
            # Check if user is active
            if not getattr(user, "is_active", True):
                logger.warning(f"Password reset requested for inactive user: {email}")
                return False
            
            # Create reset token
            reset_token = self.create_password_reset_token(str(user.id))
            
            # In a real application, you would send an email here
            # For now, we'll just log the token (remove in production!)
            logger.info(f"Password reset token for {email}: {reset_token}")
            
            # TODO: Implement email service
            # await email_service.send_password_reset_email(email, reset_token)
            
            return True
            
        except Exception as e:
            logger.error(f"Password reset request error: {e}")
            return False

    async def reset_password(self, token: str, new_password: str, db: AsyncSession) -> bool:
        """Reset user password using reset token."""
        try:
            # Verify reset token
            user_id = self.verify_password_reset_token(token)
            if not user_id:
                logger.warning("Invalid or expired password reset token used")
                return False
            
            # Find user
            result = await db.execute(select(User).where(User.id == user_id))
            user = result.scalar_one_or_none()
            
            if not user:
                logger.error(f"User not found for password reset: {user_id}")
                self.invalidate_password_reset_token(token)
                return False
            
            # Hash new password
            new_password_hash = self.get_password_hash(new_password)
            
            # Update password
            user.password_hash = new_password_hash
            
            # Commit changes
            await db.commit()
            await db.refresh(user)
            
            # Invalidate the reset token
            self.invalidate_password_reset_token(token)
            
            logger.info(f"Password successfully reset for user: {user.email}")
            return True
            
        except SQLAlchemyError as e:
            await db.rollback()
            logger.error(f"Database error during password reset: {e}")
            return False
        except Exception as e:
            await db.rollback()
            logger.error(f"Unexpected error during password reset: {e}")
            return False


# Create global auth service instance
auth_service = AuthService()


# Legacy functions for backward compatibility
async def authenticate_user(
    email: str, password: str, db: AsyncSession
) -> User:
    """Legacy function - use auth_service.authenticate_user instead."""
    return await auth_service.authenticate_user(email, password, db)


async def get_current_user_optional(
    token: str | None = None,
) -> User | None:
    """Get current user from token, return None if invalid (optional authentication)."""
    if not token:
        return None

    try:
        # This is a simplified version - you may need to implement proper token validation
        # and database lookup based on your existing auth flow
        return None  # Placeholder - implement based on your auth requirements
    except Exception:
        return None


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Legacy function - use auth_service.verify_password instead."""
    return auth_service.verify_password(plain_password, hashed_password)


def issue_tokens(user: User) -> dict:
    """Legacy function - use auth_service.create_token_response instead."""
    token_response = auth_service.create_token_response(user)
    return {
        "access_token": token_response.access_token,
        "refresh_token": token_response.refresh_token,
        "token_type": token_response.token_type,
        "expires_in": token_response.expires_in,
        "user": token_response.user.dict(),
    }


async def login(
    email: str, password: str, fingerprint: str | None, db: AsyncSession
) -> dict:
    """Legacy login function."""
    try:
        user = await auth_service.authenticate_user(email, password, db)
        await auth_service.log_login_activity(
            user_id=user.id,
            fingerprint=fingerprint or "no-fingerprint",
            success=True,
            ip_address="unknown",
            db=db,
        )
        return issue_tokens(user)
    except AuthenticationError as e:
        await auth_service.log_login_activity(
            user_id=None,
            fingerprint=fingerprint or "no-fingerprint",
            success=False,
            ip_address="unknown",
            db=db,
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e)
        )
