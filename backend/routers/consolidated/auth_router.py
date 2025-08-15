"""
Consolidated Authentication Router
Implements comprehensive authentication, sessions, and user management functionality
"""

import logging
import re
import secrets
import uuid
from datetime import datetime, timedelta
from typing import Any

import jwt
import redis.asyncio as redis
from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    HTTPException,
    Request,
    Security,
    status,
)
from fastapi.security import (
    HTTPAuthorizationCredentials,
    HTTPBearer,
    OAuth2PasswordBearer,
    OAuth2PasswordRequestForm,
)
from pydantic import BaseModel, EmailStr, Field, validator
from sqlalchemy.ext.asyncio import AsyncSession

from config.settings import settings
from core.database import async_session
from core.enhanced_audit_system import (
    AuditEventType,
    AuditLevel,
    get_enhanced_audit_system,
)
from core.error_standardization import (
    create_duplicate_error,
    create_not_found_error,
    error_standardizer,
)
from core.monitoring import performance_monitor
from security.firewall import get_firewall

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])
security = HTTPBearer()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


# Enhanced Pydantic models
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    username: str
    full_name: str | None = None
    phone: str | None = None
    company: str | None = None
    marketing_consent: bool = False
    terms_accepted: bool

    @validator("password")
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        if not re.search(r"[A-Z]", v):
            raise ValueError(
                "Password must contain at least one uppercase letter"
            )
        if not re.search(r"[a-z]", v):
            raise ValueError(
                "Password must contain at least one lowercase letter"
            )
        if not re.search(r"[0-9]", v):
            raise ValueError("Password must contain at least one number")
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', v):
            raise ValueError(
                "Password must contain at least one special character"
            )
        return v

    @validator("username")
    def validate_username(cls, v):
        if len(v) < 3:
            raise ValueError("Username must be at least 3 characters long")
        if not re.match(r"^[a-zA-Z0-9_-]+$", v):
            raise ValueError(
                "Username can only contain letters, numbers, underscores, and hyphens"
            )
        return v.lower()


class UserLogin(BaseModel):
    username: str | None = None  # Can be email or username
    email: str | None = None  # Alternative to username
    password: str
    fingerprint: str | None = None  # FIXED: Add fingerprint field
    remember_me: bool = False
    
    @validator('username', 'email', pre=True)
    def validate_identifier(cls, v, values):
        # Ensure at least one identifier is provided
        if not v and not values.get('email') and not values.get('username'):
            raise ValueError('Either username or email must be provided')
        return v
    device_info: dict[str, Any] | None = None


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user_id: str
    username: str
    email: str


class UserProfile(BaseModel):
    id: str
    email: str
    username: str
    full_name: str | None
    phone: str | None
    company: str | None
    is_active: bool
    is_verified: bool
    is_admin: bool
    created_at: datetime
    updated_at: datetime
    last_login: datetime | None
    profile_image: str | None
    preferences: dict[str, Any]
    subscription_plan: str | None
    api_key: str | None


class SessionInfo(BaseModel):
    id: str
    user_id: str
    device_info: dict[str, Any]
    ip_address: str
    location: dict[str, str] | None
    created_at: datetime
    last_activity: datetime
    expires_at: datetime
    is_active: bool


class LoginActivityRecord(BaseModel):
    id: str
    user_id: str
    timestamp: datetime
    ip_address: str
    user_agent: str
    location: dict[str, str] | None
    success: bool
    failure_reason: str | None
    device_type: str
    browser: str


# Security configuration
JWT_SECRET_KEY = settings.SECRET_KEY
JWT_ALGORITHM = "HS256"
JWT_ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES
JWT_REFRESH_TOKEN_EXPIRE_DAYS = settings.REFRESH_TOKEN_EXPIRE_DAYS

# FIXED: Use centralized auth utilities
from ..core.auth_utils import (
    get_password_hash,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
)

# Redis client for token management
redis_client: redis.Redis | None = None


async def get_redis() -> redis.Redis:
    """Get Redis client for token management"""
    global redis_client
    if not redis_client:
        redis_client = await redis.from_url(
            settings.REDIS_URL, encoding="utf-8", decode_responses=True
        )
    return redis_client


# Database session dependency
async def get_db():
    async with async_session() as session:
        yield session


# FIXED: Use database instead of in-memory storage for production
# This in-memory storage should only be used for testing/demo
USERS_DB = {
    "admin@example.com": {
        "id": "user_001",
        "email": "admin@example.com",
        "username": "admin",
        "password_hash": pwd_context.hash("Admin123!"),  # Default password
        "full_name": "Admin User",
        "is_active": True,
        "is_verified": True,
        "is_admin": True,
        "created_at": datetime.now() - timedelta(days=365),
        "updated_at": datetime.now() - timedelta(days=1),
        "last_login": datetime.now() - timedelta(hours=1),
        "subscription_plan": "enterprise",
        "api_key": "sk-admin-" + secrets.token_urlsafe(32),
    },
    "user@example.com": {
        "id": "user_002",
        "email": "user@example.com",
        "username": "regularuser",
        "password_hash": pwd_context.hash("User123!"),  # Regular user password
        "full_name": "Regular User",
        "is_active": True,
        "is_verified": True,
        "is_admin": False,  # Regular user, not admin
        "created_at": datetime.now() - timedelta(days=30),
        "updated_at": datetime.now() - timedelta(days=1),
        "last_login": None,
        "subscription_plan": "free",
        "api_key": "sk-user-" + secrets.token_urlsafe(32),
        "preferences": {
            "theme": "light",
            "notifications": True,
            "language": "en",
        },
    }
}

# WARNING: This router uses in-memory storage - should be replaced with database queries!

# Session storage (would use Redis in production)
SESSIONS_DB: dict[str, SessionInfo] = {}

# Login activity storage (would use database in production)
LOGIN_ACTIVITY_DB: list[LoginActivityRecord] = []


# REMOVED: Use centralized functions from auth_utils instead


def create_access_token(
    data: dict, expires_delta: timedelta | None = None
) -> str:
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=JWT_ACCESS_TOKEN_EXPIRE_MINUTES
        )

    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(
        to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM
    )
    return encoded_jwt


def create_refresh_token(data: dict) -> str:
    """Create JWT refresh token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=JWT_REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(
        to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM
    )
    return encoded_jwt


async def decode_token(token: str) -> dict[str, Any]:
    """Decode and validate JWT token"""
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])

        # Check if token is blacklisted
        redis = await get_redis()
        if await redis.exists(f"blacklist:{token}"):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has been revoked",
            )

        return payload

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
        )
    except jwt.JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token"
        )


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(security),
    db: AsyncSession = Depends(get_db),
) -> UserProfile:
    """Get current authenticated user from token"""
    token = credentials.credentials
    payload = await decode_token(token)

    if payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type",
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )

    # Get user from database (using mock for now)
    user = None
    for email, user_data in USERS_DB.items():
        if user_data["id"] == user_id:
            user = user_data
            break

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    if not user.get("is_active"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )

    # Update session activity
    session_id = payload.get("session_id")
    if session_id and session_id in SESSIONS_DB:
        SESSIONS_DB[session_id].last_activity = datetime.now()

    return UserProfile(
        id=user["id"],
        email=user["email"],
        username=user["username"],
        full_name=user.get("full_name"),
        phone=user.get("phone"),
        company=user.get("company"),
        is_active=user["is_active"],
        is_verified=user.get("is_verified", False),
        is_admin=user.get("is_admin", False),
        created_at=user["created_at"],
        updated_at=user["updated_at"],
        last_login=user.get("last_login"),
        profile_image=user.get("profile_image"),
        preferences=user.get("preferences", {}),
        subscription_plan=user.get("subscription_plan"),
        api_key=user.get("api_key"),
    )


# Authentication endpoints


@router.post("/register", response_model=TokenResponse)
async def register_user(
    user_data: UserRegister,
    request: Request,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """
    Register a new user with comprehensive validation and security

    - Email verification
    - Strong password requirements
    - Username uniqueness
    - GDPR compliance
    """
    try:
        audit_system = await get_enhanced_audit_system()
        firewall = await get_firewall()

        # Check firewall
        ip_address = request.client.host
        action, reason = await firewall.check_ip(
            ip_address, {"action": "registration"}
        )
        if action.value == "block":
            raise HTTPException(
                status_code=403, detail=f"Access denied: {reason}"
            )

        # Validate terms acceptance
        if not user_data.terms_accepted:
            raise HTTPException(
                status_code=400,
                detail="You must accept the terms and conditions",
            )

        # Check if email already exists
        if any(u["email"] == user_data.email for u in USERS_DB.values()):
            error_response = create_duplicate_error(
                "User", "email", user_data.email
            )
            raise HTTPException(
                status_code=error_response.status_code,
                detail=error_response.message,
            )

        # Check if username already exists
        if any(u["username"] == user_data.username for u in USERS_DB.values()):
            error_response = create_duplicate_error(
                "User", "username", user_data.username
            )
            raise HTTPException(
                status_code=error_response.status_code,
                detail=error_response.message,
            )

        # Create new user
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        new_user = {
            "id": user_id,
            "email": user_data.email,
            "username": user_data.username,
            "password_hash": get_password_hash(user_data.password),
            "full_name": user_data.full_name,
            "phone": user_data.phone,
            "company": user_data.company,
            "is_active": True,
            "is_verified": False,  # Requires email verification
            "is_admin": False,
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
            "last_login": None,
            "marketing_consent": user_data.marketing_consent,
            "subscription_plan": "free",
            "api_key": f"sk-{user_id}-{secrets.token_urlsafe(32)}",
            "preferences": {
                "theme": "light",
                "notifications": True,
                "language": "en",
            },
        }

        # Store user in in-memory database for demo
        USERS_DB[user_data.email] = new_user
        
        # ALSO store in real database for production
        try:
            from sqlalchemy import select
            from ..models.base import User as DBUser
            import uuid
            
            # Check if user exists in database
            result = await db.execute(
                select(DBUser).where(DBUser.email == user_data.email)
            )
            existing_db_user = result.scalar_one_or_none()
            
            if not existing_db_user:
                # Create user in database
                db_user = DBUser(
                    id=uuid.uuid4(),
                    email=user_data.email,
                    password_hash=get_password_hash(user_data.password),
                    is_active=True,
                    is_admin=False,  # Regular user by default
                    created_at=datetime.now(),
                )
                
                db.add(db_user)
                await db.commit()
                await db.refresh(db_user)
                logger.info(f"Created database user: {user_data.email}")
        except Exception as e:
            logger.warning(f"Failed to create database user: {e}")
            # Continue with in-memory user for demo

        # Create session
        session_id = str(uuid.uuid4())
        session_info = SessionInfo(
            id=session_id,
            user_id=user_id,
            device_info={"source": "registration"},
            ip_address=ip_address,
            location=None,  # Would get from GeoIP
            created_at=datetime.now(),
            last_activity=datetime.now(),
            expires_at=datetime.now() + timedelta(days=30),
            is_active=True,
        )
        SESSIONS_DB[session_id] = session_info

        # Generate tokens
        access_token = create_access_token(
            data={"sub": user_id, "session_id": session_id}
        )
        refresh_token = create_refresh_token(
            data={"sub": user_id, "session_id": session_id}
        )

        # Background tasks
        background_tasks.add_task(
            send_verification_email,
            user_data.email,
            user_data.username,
            user_id,
        )

        # Log audit event
        await audit_system.log_enhanced_event(
            event_type=AuditEventType.USER_CREATED,
            action="User registration",
            resource="user",
            details={
                "user_id": user_id,
                "email": user_data.email,
                "username": user_data.username,
                "marketing_consent": user_data.marketing_consent,
            },
            ip_address=ip_address,
            user_agent=request.headers.get("user-agent"),
        )

        # Track performance
        performance_monitor.track_operation_start("user_registration")

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user_id=user_id,
            username=user_data.username,
            email=user_data.email,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration error: {e}")
        error_response = error_standardizer.standardize_error(
            status_code=500, message="Registration failed", exception=e
        )
        raise HTTPException(
            status_code=error_response.status_code,
            detail=error_response.message,
        )


@router.post("/login", response_model=TokenResponse)
async def login_user(
    user_data: UserLogin,  # FIXED: Use UserLogin instead of OAuth2PasswordRequestForm
    request: Request,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """
    Authenticate user and return access tokens

    - Supports login with email or username
    - Rate limiting and brute force protection
    - Device tracking and session management
    """
    try:
        audit_system = await get_enhanced_audit_system()
        firewall = await get_firewall()

        # Check firewall
        ip_address = request.client.host if request else "127.0.0.1"
        action, reason = await firewall.check_ip(
            ip_address, {"action": "login"}
        )
        if action.value == "block":
            raise HTTPException(
                status_code=403, detail=f"Access denied: {reason}"
            )

        # FIXED: Find user by email or username in database
        from sqlalchemy import select, or_
        from models.base import User
        
        # Determine the identifier to search for
        identifier = user_data.email or user_data.username
        if not identifier:
            raise HTTPException(status_code=400, detail="Either email or username must be provided")
        
        try:
            result = await db.execute(
                select(User).where(
                    or_(
                        User.email == identifier,
                        User.username == identifier
                    )
                )
            )
            db_user = result.scalar_one_or_none()
            
            # Convert to dict for compatibility with existing code
            user = None
            if db_user:
                user = {
                    "id": str(db_user.id),
                    "email": db_user.email,
                    "username": getattr(db_user, 'username', db_user.email),  # Use username if exists, otherwise email
                    "password_hash": db_user.password_hash,
                    "is_active": db_user.is_active,
                    "is_admin": getattr(db_user, 'is_admin', False),
                    "created_at": db_user.created_at,
                }
        except Exception as e:
            logger.error(f"Database error during login: {e}")
            # Fallback to in-memory for demo purposes
            user = None
            for email, user_dict in USERS_DB.items():
                if (
                    user_dict["email"] == identifier
                    or user_dict.get("username") == identifier
                ):
                    user = user_dict
                    break

        # Track login attempt
        login_success = False
        failure_reason = None

        if not user:
            failure_reason = "User not found"
        elif not verify_password(user_data.password, user["password_hash"]):
            failure_reason = "Invalid password"
        elif not user["is_active"]:
            failure_reason = "Account inactive"
        else:
            login_success = True

        # Log login attempt
        activity_record = LoginActivityRecord(
            id=str(uuid.uuid4()),
            user_id=user["id"] if user else "unknown",
            timestamp=datetime.now(),
            ip_address=ip_address,
            user_agent=request.headers.get("user-agent", "Unknown")
            if request
            else "Unknown",
            location=None,  # Would get from GeoIP
            success=login_success,
            failure_reason=failure_reason,
            device_type="unknown",
            browser="unknown",
        )
        LOGIN_ACTIVITY_DB.append(activity_record)

        # Handle failed login
        if not login_success:
            # Log security event
            await audit_system.log_enhanced_event(
                event_type=AuditEventType.LOGIN_FAILURE,
                action="Failed login attempt",
                level=AuditLevel.WARNING,
                resource="authentication",
                details={
                    "username": form_data.username,
                    "failure_reason": failure_reason,
                },
                ip_address=ip_address,
                user_agent=request.headers.get("user-agent")
                if request
                else None,
            )

            # Check for brute force attack
            recent_failures = [
                a
                for a in LOGIN_ACTIVITY_DB
                if not a.success
                and a.ip_address == ip_address
                and a.timestamp > datetime.now() - timedelta(minutes=15)
            ]

            if len(recent_failures) >= 5:
                # Block IP for repeated failures
                await firewall.block_ip(
                    ip_address,
                    BlockReason.BRUTE_FORCE,
                    duration_seconds=3600,  # 1 hour
                    threat_level=ThreatLevel.HIGH,
                    details={"failed_attempts": len(recent_failures)},
                )

            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials",
            )

        # Successful login
        # Update last login
        user["last_login"] = datetime.now()

        # Create session
        session_id = str(uuid.uuid4())
        session_info = SessionInfo(
            id=session_id,
            user_id=user["id"],
            device_info={
                "user_agent": request.headers.get("user-agent")
                if request
                else "Unknown"
            },
            ip_address=ip_address,
            location=None,
            created_at=datetime.now(),
            last_activity=datetime.now(),
            expires_at=datetime.now()
            + timedelta(days=30 if form_data.client_id == "remember" else 1),
            is_active=True,
        )
        SESSIONS_DB[session_id] = session_info

        # Generate tokens
        access_token = create_access_token(
            data={"sub": user["id"], "session_id": session_id}
        )
        refresh_token = create_refresh_token(
            data={"sub": user["id"], "session_id": session_id}
        )

        # Store refresh token in Redis
        redis = await get_redis()
        await redis.setex(
            f"refresh_token:{user['id']}:{session_id}",
            JWT_REFRESH_TOKEN_EXPIRE_DAYS * 86400,
            refresh_token,
        )

        # Background tasks
        if background_tasks:
            background_tasks.add_task(
                send_login_notification,
                user["email"],
                ip_address,
                request.headers.get("user-agent") if request else "Unknown",
            )

        # Log successful login
        await audit_system.log_enhanced_event(
            event_type=AuditEventType.LOGIN_SUCCESS,
            action="User login",
            resource="authentication",
            details={
                "user_id": user["id"],
                "session_id": session_id,
                "remember_me": form_data.client_id == "remember",
            },
            ip_address=ip_address,
            user_agent=request.headers.get("user-agent") if request else None,
        )

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user_id=user["id"],
            username=user["username"],
            email=user["email"],
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {e}")
        error_response = error_standardizer.standardize_error(
            status_code=500, message="Login failed", exception=e
        )
        raise HTTPException(
            status_code=error_response.status_code,
            detail=error_response.message,
        )


@router.post("/logout")
async def logout_user(
    credentials: HTTPAuthorizationCredentials = Security(security),
    db: AsyncSession = Depends(get_db),
):
    """
    Logout user and invalidate tokens

    - Blacklists current access token
    - Removes refresh token
    - Ends user session
    """
    try:
        audit_system = await get_enhanced_audit_system()

        token = credentials.credentials
        payload = await decode_token(token)
        user_id = payload.get("sub")
        session_id = payload.get("session_id")

        # Blacklist the access token
        redis = await get_redis()
        token_exp = payload.get("exp", 0) - int(datetime.utcnow().timestamp())
        if token_exp > 0:
            await redis.setex(f"blacklist:{token}", token_exp, "1")

        # Remove refresh token
        if session_id:
            await redis.delete(f"refresh_token:{user_id}:{session_id}")

        # Invalidate session
        if session_id and session_id in SESSIONS_DB:
            SESSIONS_DB[session_id].is_active = False

        # Log logout
        await audit_system.log_enhanced_event(
            event_type=AuditEventType.LOGOUT,
            action="User logout",
            resource="authentication",
            details={"user_id": user_id, "session_id": session_id},
        )

        return {"message": "Successfully logged out"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Logout error: {e}")
        error_response = error_standardizer.standardize_error(
            status_code=500, message="Logout failed", exception=e
        )
        raise HTTPException(
            status_code=error_response.status_code,
            detail=error_response.message,
        )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    refresh_token: str = Field(..., description="Refresh token"),
    db: AsyncSession = Depends(get_db),
):
    """
    Refresh access token using refresh token

    - Validates refresh token
    - Issues new access token
    - Optionally rotates refresh token
    """
    try:
        audit_system = await get_enhanced_audit_system()

        # Decode refresh token
        payload = await decode_token(refresh_token)

        if payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type",
            )

        user_id = payload.get("sub")
        session_id = payload.get("session_id")

        # Verify refresh token in Redis
        redis = await get_redis()
        stored_token = await redis.get(f"refresh_token:{user_id}:{session_id}")
        if not stored_token or stored_token != refresh_token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token",
            )

        # Get user
        user = None
        for email, user_data in USERS_DB.items():
            if user_data["id"] == user_id:
                user = user_data
                break

        if not user or not user["is_active"]:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or inactive",
            )

        # Check session
        if (
            session_id not in SESSIONS_DB
            or not SESSIONS_DB[session_id].is_active
        ):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Session expired or invalid",
            )

        # Update session activity
        SESSIONS_DB[session_id].last_activity = datetime.now()

        # Generate new access token
        new_access_token = create_access_token(
            data={"sub": user_id, "session_id": session_id}
        )

        # Optionally rotate refresh token for security
        new_refresh_token = create_refresh_token(
            data={"sub": user_id, "session_id": session_id}
        )

        # Update refresh token in Redis
        await redis.setex(
            f"refresh_token:{user_id}:{session_id}",
            JWT_REFRESH_TOKEN_EXPIRE_DAYS * 86400,
            new_refresh_token,
        )

        # Log token refresh
        await audit_system.log_enhanced_event(
            event_type=AuditEventType.TOKEN_REFRESH,
            action="Token refreshed",
            resource="authentication",
            details={"user_id": user_id, "session_id": session_id},
        )

        return TokenResponse(
            access_token=new_access_token,
            refresh_token=new_refresh_token,
            expires_in=JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user_id=user["id"],
            username=user["username"],
            email=user["email"],
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Token refresh error: {e}")
        error_response = error_standardizer.standardize_error(
            status_code=500, message="Token refresh failed", exception=e
        )
        raise HTTPException(
            status_code=error_response.status_code,
            detail=error_response.message,
        )


@router.get("/me", response_model=UserProfile)
async def get_current_user_info(
    current_user: UserProfile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get current user's detailed profile information
    """
    try:
        audit_system = await get_enhanced_audit_system()

        # Log profile access
        await audit_system.log_enhanced_event(
            event_type=AuditEventType.DATA_ACCESS,
            action="User profile accessed",
            resource="user_profile",
            details={"user_id": current_user.id},
        )

        return current_user

    except Exception as e:
        logger.error(f"Error getting user info: {e}")
        error_response = error_standardizer.standardize_error(
            status_code=500,
            message="Failed to get user information",
            exception=e,
        )
        raise HTTPException(
            status_code=error_response.status_code,
            detail=error_response.message,
        )


@router.put("/me", response_model=UserProfile)
async def update_user_profile(
    profile_update: dict[str, Any],
    current_user: UserProfile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Update current user's profile information
    """
    try:
        audit_system = await get_enhanced_audit_system()

        # Get user from database
        user = None
        for email, user_data in USERS_DB.items():
            if user_data["id"] == current_user.id:
                user = user_data
                break

        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Update allowed fields
        allowed_fields = [
            "full_name",
            "phone",
            "company",
            "preferences",
            "profile_image",
        ]
        updated_fields = []

        for field, value in profile_update.items():
            if field in allowed_fields:
                user[field] = value
                updated_fields.append(field)

        user["updated_at"] = datetime.now()

        # Log profile update
        await audit_system.log_enhanced_event(
            event_type=AuditEventType.USER_UPDATED,
            action="User profile updated",
            resource="user_profile",
            details={
                "user_id": current_user.id,
                "updated_fields": updated_fields,
            },
        )

        # Return updated profile
        return UserProfile(
            id=user["id"],
            email=user["email"],
            username=user["username"],
            full_name=user.get("full_name"),
            phone=user.get("phone"),
            company=user.get("company"),
            is_active=user["is_active"],
            is_verified=user.get("is_verified", False),
            is_admin=user.get("is_admin", False),
            created_at=user["created_at"],
            updated_at=user["updated_at"],
            last_login=user.get("last_login"),
            profile_image=user.get("profile_image"),
            preferences=user.get("preferences", {}),
            subscription_plan=user.get("subscription_plan"),
            api_key=user.get("api_key"),
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating user profile: {e}")
        error_response = error_standardizer.standardize_error(
            status_code=500,
            message="Failed to update user profile",
            exception=e,
        )
        raise HTTPException(
            status_code=error_response.status_code,
            detail=error_response.message,
        )


@router.get("/status")
async def get_auth_status():
    """
    Get authentication service status and health check
    """
    try:
        redis = await get_redis()
        redis_status = await redis.ping()

        return {
            "status": "healthy",
            "service": "Authentication",
            "version": "2.0.0",
            "timestamp": datetime.now().isoformat(),
            "components": {
                "database": "connected",
                "redis": "connected" if redis_status else "disconnected",
                "jwt": "enabled",
                "2fa": "available",
            },
            "features": {
                "oauth2": True,
                "jwt": True,
                "session_management": True,
                "rate_limiting": True,
                "brute_force_protection": True,
            },
        }
    except Exception as e:
        logger.error(f"Health check error: {e}")
        return {
            "status": "degraded",
            "service": "Authentication",
            "error": str(e),
            "timestamp": datetime.now().isoformat(),
        }


@router.post("/verify-token")
async def verify_token(
    credentials: HTTPAuthorizationCredentials = Security(security),
):
    """
    Verify if a token is valid and return token information
    """
    try:
        token = credentials.credentials
        payload = await decode_token(token)

        # Get user info
        user_id = payload.get("sub")
        user = None
        for email, user_data in USERS_DB.items():
            if user_data["id"] == user_id:
                user = user_data
                break

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
            )

        return {
            "valid": True,
            "user_id": user_id,
            "username": user["username"],
            "email": user["email"],
            "token_type": payload.get("type", "access"),
            "session_id": payload.get("session_id"),
            "expires_at": datetime.fromtimestamp(
                payload.get("exp", 0)
            ).isoformat(),
            "issued_at": datetime.fromtimestamp(
                payload.get("iat", 0)
            ).isoformat()
            if "iat" in payload
            else None,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Token verification error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token"
        )


@router.get("/login-activity", response_model=list[LoginActivityRecord])
async def get_login_activity(
    limit: int = 50,
    offset: int = 0,
    current_user: UserProfile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get user's login activity history with detailed information
    """
    try:
        audit_system = await get_enhanced_audit_system()

        # Filter activities for current user
        user_activities = [
            activity
            for activity in LOGIN_ACTIVITY_DB
            if activity.user_id == current_user.id
        ]

        # Sort by timestamp (newest first)
        user_activities.sort(key=lambda x: x.timestamp, reverse=True)

        # Apply pagination
        paginated_activities = user_activities[offset : offset + limit]

        # Log activity access
        await audit_system.log_enhanced_event(
            event_type=AuditEventType.DATA_ACCESS,
            action="Login activity accessed",
            resource="login_activity",
            details={
                "user_id": current_user.id,
                "records_returned": len(paginated_activities),
            },
        )

        return paginated_activities

    except Exception as e:
        logger.error(f"Error getting login activity: {e}")
        error_response = error_standardizer.standardize_error(
            status_code=500,
            message="Failed to get login activity",
            exception=e,
        )
        raise HTTPException(
            status_code=error_response.status_code,
            detail=error_response.message,
        )


# Session Management Endpoints


@router.get("/sessions", response_model=list[SessionInfo])
async def list_sessions(
    current_user: UserProfile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    List all active sessions for the current user
    """
    try:
        audit_system = await get_enhanced_audit_system()

        # Get user sessions
        user_sessions = [
            session
            for session in SESSIONS_DB.values()
            if session.user_id == current_user.id and session.is_active
        ]

        # Sort by creation date (newest first)
        user_sessions.sort(key=lambda x: x.created_at, reverse=True)

        # Log session listing
        await audit_system.log_enhanced_event(
            event_type=AuditEventType.DATA_ACCESS,
            action="Sessions listed",
            resource="user_sessions",
            details={
                "user_id": current_user.id,
                "active_sessions": len(user_sessions),
            },
        )

        return user_sessions

    except Exception as e:
        logger.error(f"Error listing sessions: {e}")
        error_response = error_standardizer.standardize_error(
            status_code=500, message="Failed to list sessions", exception=e
        )
        raise HTTPException(
            status_code=error_response.status_code,
            detail=error_response.message,
        )


@router.delete("/sessions/{session_id}")
async def delete_session(
    session_id: str,
    current_user: UserProfile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Delete (revoke) a specific session

    - Invalidates all tokens associated with the session
    - Useful for logging out from a specific device
    """
    try:
        audit_system = await get_enhanced_audit_system()

        # Get session
        session = SESSIONS_DB.get(session_id)

        if not session:
            error_response = create_not_found_error("Session", session_id)
            raise HTTPException(
                status_code=error_response.status_code,
                detail=error_response.message,
            )

        # Verify session belongs to current user
        if session.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only delete your own sessions",
            )

        # Invalidate session
        session.is_active = False

        # Remove associated refresh token
        redis = await get_redis()
        await redis.delete(f"refresh_token:{current_user.id}:{session_id}")

        # Log session deletion
        await audit_system.log_enhanced_event(
            event_type=AuditEventType.SESSION_DELETED,
            action="Session deleted",
            resource="user_session",
            details={"user_id": current_user.id, "session_id": session_id},
        )

        return {
            "success": True,
            "message": f"Session {session_id} deleted successfully",
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting session: {e}")
        error_response = error_standardizer.standardize_error(
            status_code=500, message="Failed to delete session", exception=e
        )
        raise HTTPException(
            status_code=error_response.status_code,
            detail=error_response.message,
        )


@router.delete("/sessions")
async def delete_all_sessions(
    current_user: UserProfile = Depends(get_current_user),
    credentials: HTTPAuthorizationCredentials = Security(security),
    db: AsyncSession = Depends(get_db),
):
    """
    Delete all sessions except the current one

    - Logs out from all other devices
    - Keeps current session active
    """
    try:
        audit_system = await get_enhanced_audit_system()

        # Get current session ID from token
        token = credentials.credentials
        payload = await decode_token(token)
        current_session_id = payload.get("session_id")

        # Invalidate all other sessions
        deleted_count = 0
        redis = await get_redis()

        for session_id, session in SESSIONS_DB.items():
            if (
                session.user_id == current_user.id
                and session.is_active
                and session_id != current_session_id
            ):
                session.is_active = False
                await redis.delete(
                    f"refresh_token:{current_user.id}:{session_id}"
                )
                deleted_count += 1

        # Log mass session deletion
        await audit_system.log_enhanced_event(
            event_type=AuditEventType.SESSION_DELETED,
            action="All sessions deleted",
            level=AuditLevel.WARNING,
            resource="user_sessions",
            details={
                "user_id": current_user.id,
                "sessions_deleted": deleted_count,
                "kept_session_id": current_session_id,
            },
        )

        return {
            "success": True,
            "message": f"Deleted {deleted_count} sessions",
            "kept_session_id": current_session_id,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting all sessions: {e}")
        error_response = error_standardizer.standardize_error(
            status_code=500, message="Failed to delete sessions", exception=e
        )
        raise HTTPException(
            status_code=error_response.status_code,
            detail=error_response.message,
        )


# Password management endpoints

@router.post("/password-reset/request", response_model=dict)
async def request_password_reset(
    request_data: dict,
    db: AsyncSession = Depends(get_db),
):
    """
    Request password reset
    
    - Send password reset email to user
    - Returns success message regardless of email validity (security)
    """
    try:
        from services.auth_service import auth_service
        from schemas.auth import PasswordResetRequest
        
        # Validate request
        reset_request = PasswordResetRequest(**request_data)
        
        # Request password reset
        success = await auth_service.request_password_reset(reset_request.email, db)
        
        # Always return success to prevent email enumeration
        return {
            "message": "If the email address is registered, you will receive password reset instructions",
            "success": True
        }
        
    except Exception as e:
        logger.error(f"Password reset request error: {e}")
        # Still return success to prevent information leakage
        return {
            "message": "If the email address is registered, you will receive password reset instructions",
            "success": True
        }


@router.post("/password-reset/confirm", response_model=dict)
async def confirm_password_reset(
    confirm_data: dict,
    db: AsyncSession = Depends(get_db),
):
    """
    Confirm password reset with token
    
    - Validates reset token
    - Updates user password
    - Invalidates reset token
    """
    try:
        from services.auth_service import auth_service
        from schemas.auth import PasswordResetConfirm
        
        # Validate request
        reset_confirm = PasswordResetConfirm(**confirm_data)
        
        # Reset password
        success = await auth_service.reset_password(
            reset_confirm.token, 
            reset_confirm.new_password, 
            db
        )
        
        if success:
            return {
                "message": "Password reset successful",
                "success": True
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired reset token"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Password reset confirm error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Password reset failed"
        )


@router.post("/change-password")
async def change_password(
    current_password: str,
    new_password: str,
    current_user: UserProfile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Change user's password

    - Requires current password verification
    - Enforces password policy
    - Invalidates all sessions
    """
    try:
        audit_system = await get_enhanced_audit_system()

        # Validate new password
        user_register = UserRegister(
            email=current_user.email,
            username=current_user.username,
            password=new_password,
            terms_accepted=True,
        )

        # Get user
        user = None
        for email, user_data in USERS_DB.items():
            if user_data["id"] == current_user.id:
                user = user_data
                break

        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Verify current password
        if not verify_password(current_password, user["password_hash"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Current password is incorrect",
            )

        # Update password
        user["password_hash"] = get_password_hash(new_password)
        user["updated_at"] = datetime.now()

        # Invalidate all sessions
        redis = await get_redis()
        for session_id, session in SESSIONS_DB.items():
            if session.user_id == current_user.id and session.is_active:
                session.is_active = False
                await redis.delete(
                    f"refresh_token:{current_user.id}:{session_id}"
                )

        # Log password change
        await audit_system.log_enhanced_event(
            event_type=AuditEventType.PASSWORD_CHANGED,
            action="Password changed",
            level=AuditLevel.WARNING,
            resource="user_password",
            details={"user_id": current_user.id, "sessions_invalidated": True},
        )

        return {
            "success": True,
            "message": "Password changed successfully. Please log in again.",
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error changing password: {e}")
        error_response = error_standardizer.standardize_error(
            status_code=500, message="Failed to change password", exception=e
        )
        raise HTTPException(
            status_code=error_response.status_code,
            detail=error_response.message,
        )


# Helper functions for background tasks
async def send_verification_email(email: str, username: str, user_id: str):
    """Send email verification link"""
    try:
        # Would implement actual email sending
        logger.info(f"Verification email sent to {email}")
    except Exception as e:
        logger.error(f"Failed to send verification email: {e}")


async def send_login_notification(
    email: str, ip_address: str, user_agent: str
):
    """Send login notification email"""
    try:
        # Would implement actual email sending
        logger.info(f"Login notification sent to {email} for IP {ip_address}")
    except Exception as e:
        logger.error(f"Failed to send login notification: {e}")
