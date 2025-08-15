"""
Enhanced Authentication System for SGPT
Implements OAuth2 + PKCE, multi-factor authentication, and advanced session management
"""

import base64
import hashlib
import json
import logging
import secrets
import urllib.parse
from dataclasses import dataclass
from datetime import datetime, timedelta
from enum import Enum
from io import BytesIO
from typing import Any

import aioredis
import jwt
import pyotp
import qrcode
from fastapi import HTTPException, Request
from passlib.context import CryptContext

from config.settings import settings

logger = logging.getLogger(__name__)


class AuthMethod(Enum):
    PASSWORD = "password"
    OAUTH2 = "oauth2"
    MFA = "mfa"
    API_KEY = "api_key"


class SessionStatus(Enum):
    ACTIVE = "active"
    EXPIRED = "expired"
    REVOKED = "revoked"
    SUSPICIOUS = "suspicious"


@dataclass
class AuthSession:
    session_id: str
    user_id: str
    auth_method: AuthMethod
    ip_address: str
    user_agent: str
    created_at: datetime
    last_activity: datetime
    expires_at: datetime
    status: SessionStatus
    permissions: list[str]
    mfa_verified: bool = False


@dataclass
class OAuth2State:
    state: str
    code_verifier: str
    code_challenge: str
    redirect_uri: str
    client_id: str
    scope: list[str]
    created_at: datetime


class EnhancedAuthManager:
    """Enhanced authentication with OAuth2 + PKCE and MFA"""

    def __init__(self, redis_url: str | None = None):
        self.redis_url = redis_url or settings.REDIS_URL
        self.redis = None
        self.pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

        # OAuth2 configuration
        self.oauth2_providers = {
            "google": {
                "client_id": settings.GOOGLE_CLIENT_ID
                if hasattr(settings, "GOOGLE_CLIENT_ID")
                else "",
                "client_secret": settings.GOOGLE_CLIENT_SECRET
                if hasattr(settings, "GOOGLE_CLIENT_SECRET")
                else "",
                "auth_url": "https://accounts.google.com/o/oauth2/auth",
                "token_url": "https://oauth2.googleapis.com/token",
                "userinfo_url": "https://www.googleapis.com/oauth2/v2/userinfo",
            },
            "microsoft": {
                "client_id": settings.MICROSOFT_CLIENT_ID
                if hasattr(settings, "MICROSOFT_CLIENT_ID")
                else "",
                "client_secret": settings.MICROSOFT_CLIENT_SECRET
                if hasattr(settings, "MICROSOFT_CLIENT_SECRET")
                else "",
                "auth_url": "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
                "token_url": "https://login.microsoftonline.com/common/oauth2/v2.0/token",
                "userinfo_url": "https://graph.microsoft.com/v1.0/me",
            },
        }

        # Session settings
        self.session_timeout = timedelta(hours=24)
        self.max_sessions_per_user = 5

    async def initialize(self):
        """Initialize authentication manager"""
        try:
            self.redis = aioredis.from_url(self.redis_url)
            await self.redis.ping()
            logger.info("✅ Enhanced auth manager initialized")
        except Exception as e:
            logger.error(f"Failed to initialize auth manager: {e}")
            self.redis = None

    def generate_pkce_pair(self) -> tuple[str, str]:
        """Generate PKCE code verifier and challenge"""
        code_verifier = (
            base64.urlsafe_b64encode(secrets.token_bytes(32))
            .decode("utf-8")
            .rstrip("=")
        )
        code_challenge = (
            base64.urlsafe_b64encode(
                hashlib.sha256(code_verifier.encode("utf-8")).digest()
            )
            .decode("utf-8")
            .rstrip("=")
        )
        return code_verifier, code_challenge

    async def create_oauth2_state(
        self, provider: str, redirect_uri: str, scope: list[str]
    ) -> OAuth2State:
        """Create OAuth2 state with PKCE"""
        if provider not in self.oauth2_providers:
            raise ValueError(f"Unsupported OAuth2 provider: {provider}")

        code_verifier, code_challenge = self.generate_pkce_pair()
        state = secrets.token_urlsafe(32)

        oauth2_state = OAuth2State(
            state=state,
            code_verifier=code_verifier,
            code_challenge=code_challenge,
            redirect_uri=redirect_uri,
            client_id=self.oauth2_providers[provider]["client_id"],
            scope=scope,
            created_at=datetime.now(),
        )

        # Store state in Redis
        if self.redis:
            await self.redis.setex(
                f"oauth2_state:{state}",
                300,  # 5 minutes
                json.dumps(
                    {
                        "code_verifier": code_verifier,
                        "redirect_uri": redirect_uri,
                        "client_id": oauth2_state.client_id,
                        "scope": scope,
                        "provider": provider,
                    }
                ),
            )

        return oauth2_state

    def get_oauth2_auth_url(
        self, provider: str, oauth2_state: OAuth2State
    ) -> str:
        """Generate OAuth2 authorization URL with PKCE"""
        if provider not in self.oauth2_providers:
            raise ValueError(f"Unsupported OAuth2 provider: {provider}")

        config = self.oauth2_providers[provider]

        params = {
            "client_id": oauth2_state.client_id,
            "response_type": "code",
            "redirect_uri": oauth2_state.redirect_uri,
            "scope": " ".join(oauth2_state.scope),
            "state": oauth2_state.state,
            "code_challenge": oauth2_state.code_challenge,
            "code_challenge_method": "S256",
        }

        return f"{config['auth_url']}?{urllib.parse.urlencode(params)}"

    async def verify_oauth2_callback(
        self, provider: str, code: str, state: str
    ) -> dict[str, Any]:
        """Verify OAuth2 callback and exchange code for token"""
        if not self.redis:
            raise HTTPException(status_code=500, detail="Redis not available")

        # Retrieve and verify state
        state_data = await self.redis.get(f"oauth2_state:{state}")
        if not state_data:
            raise HTTPException(
                status_code=400, detail="Invalid or expired state"
            )

        state_info = json.loads(state_data)
        await self.redis.delete(f"oauth2_state:{state}")

        # Exchange code for token
        config = self.oauth2_providers[provider]

        token_data = {
            "client_id": state_info["client_id"],
            "code": code,
            "redirect_uri": state_info["redirect_uri"],
            "grant_type": "authorization_code",
            "code_verifier": state_info["code_verifier"],
        }

        # Here you would make the actual HTTP request to exchange the code
        # For now, we'll return a placeholder
        return {
            "access_token": "placeholder_token",
            "token_type": "bearer",
            "expires_in": 3600,
            "userinfo": {"email": "user@example.com", "name": "OAuth User"},
        }

    def generate_mfa_secret(self) -> str:
        """Generate MFA secret for TOTP"""
        return pyotp.random_base32()

    def generate_mfa_qr_code(self, user_email: str, secret: str) -> str:
        """Generate QR code for MFA setup"""
        totp_uri = pyotp.totp.TOTP(secret).provisioning_uri(
            name=user_email, issuer_name="SGPT Email Platform"
        )

        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(totp_uri)
        qr.make(fit=True)

        img = qr.make_image(fill_color="black", back_color="white")
        buffer = BytesIO()
        img.save(buffer, format="PNG")

        return base64.b64encode(buffer.getvalue()).decode()

    def verify_mfa_token(self, secret: str, token: str) -> bool:
        """Verify MFA TOTP token"""
        totp = pyotp.TOTP(secret)
        return totp.verify(token, valid_window=1)

    async def create_session(
        self,
        user_id: str,
        auth_method: AuthMethod,
        request: Request,
        permissions: list[str],
        mfa_verified: bool = False,
    ) -> AuthSession:
        """Create new authentication session"""
        session_id = secrets.token_urlsafe(32)
        now = datetime.now()

        session = AuthSession(
            session_id=session_id,
            user_id=user_id,
            auth_method=auth_method,
            ip_address=request.client.host if request.client else "unknown",
            user_agent=request.headers.get("user-agent", ""),
            created_at=now,
            last_activity=now,
            expires_at=now + self.session_timeout,
            status=SessionStatus.ACTIVE,
            permissions=permissions,
            mfa_verified=mfa_verified,
        )

        # Store session in Redis
        if self.redis:
            session_data = {
                "user_id": user_id,
                "auth_method": auth_method.value,
                "ip_address": session.ip_address,
                "user_agent": session.user_agent,
                "created_at": session.created_at.isoformat(),
                "last_activity": session.last_activity.isoformat(),
                "expires_at": session.expires_at.isoformat(),
                "status": session.status.value,
                "permissions": permissions,
                "mfa_verified": mfa_verified,
            }

            await self.redis.setex(
                f"session:{session_id}",
                int(self.session_timeout.total_seconds()),
                json.dumps(session_data),
            )

            # Track user sessions
            await self.redis.sadd(f"user_sessions:{user_id}", session_id)
            await self.redis.expire(
                f"user_sessions:{user_id}",
                int(self.session_timeout.total_seconds()),
            )

        return session

    async def get_session(self, session_id: str) -> AuthSession | None:
        """Get session by ID"""
        if not self.redis:
            return None

        session_data = await self.redis.get(f"session:{session_id}")
        if not session_data:
            return None

        data = json.loads(session_data)

        return AuthSession(
            session_id=session_id,
            user_id=data["user_id"],
            auth_method=AuthMethod(data["auth_method"]),
            ip_address=data["ip_address"],
            user_agent=data["user_agent"],
            created_at=datetime.fromisoformat(data["created_at"]),
            last_activity=datetime.fromisoformat(data["last_activity"]),
            expires_at=datetime.fromisoformat(data["expires_at"]),
            status=SessionStatus(data["status"]),
            permissions=data["permissions"],
            mfa_verified=data.get("mfa_verified", False),
        )

    async def update_session_activity(self, session_id: str):
        """Update session last activity"""
        if not self.redis:
            return

        session = await self.get_session(session_id)
        if session:
            session.last_activity = datetime.now()

            session_data = {
                "user_id": session.user_id,
                "auth_method": session.auth_method.value,
                "ip_address": session.ip_address,
                "user_agent": session.user_agent,
                "created_at": session.created_at.isoformat(),
                "last_activity": session.last_activity.isoformat(),
                "expires_at": session.expires_at.isoformat(),
                "status": session.status.value,
                "permissions": session.permissions,
                "mfa_verified": session.mfa_verified,
            }

            await self.redis.setex(
                f"session:{session_id}",
                int(self.session_timeout.total_seconds()),
                json.dumps(session_data),
            )

    async def revoke_session(self, session_id: str):
        """Revoke a session"""
        if not self.redis:
            return

        session = await self.get_session(session_id)
        if session:
            # Remove from user sessions
            await self.redis.srem(
                f"user_sessions:{session.user_id}", session_id
            )

            # Delete session
            await self.redis.delete(f"session:{session_id}")

    async def revoke_all_user_sessions(self, user_id: str):
        """Revoke all sessions for a user"""
        if not self.redis:
            return

        session_ids = await self.redis.smembers(f"user_sessions:{user_id}")
        for session_id in session_ids:
            await self.redis.delete(f"session:{session_id.decode()}")

        await self.redis.delete(f"user_sessions:{user_id}")

    async def get_user_sessions(self, user_id: str) -> list[AuthSession]:
        """Get all active sessions for a user"""
        if not self.redis:
            return []

        session_ids = await self.redis.smembers(f"user_sessions:{user_id}")
        sessions = []

        for session_id in session_ids:
            session = await self.get_session(session_id.decode())
            if session and session.status == SessionStatus.ACTIVE:
                sessions.append(session)

        return sessions

    def create_access_token(
        self,
        user_id: str,
        session_id: str,
        permissions: list[str],
        expires_delta: timedelta | None = None,
    ) -> str:
        """Create JWT access token"""
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

        to_encode = {
            "sub": user_id,
            "session_id": session_id,
            "permissions": permissions,
            "exp": expire,
            "iat": datetime.utcnow(),
            "jti": secrets.token_urlsafe(16),
            "type": "access",
        }

        return jwt.encode(to_encode, settings.SECRET_KEY, algorithm="HS256")

    def create_refresh_token(self, user_id: str, session_id: str) -> str:
        """Create JWT refresh token"""
        expire = datetime.utcnow() + timedelta(days=7)

        to_encode = {
            "sub": user_id,
            "session_id": session_id,
            "exp": expire,
            "iat": datetime.utcnow(),
            "jti": secrets.token_urlsafe(16),
            "type": "refresh",
        }

        return jwt.encode(to_encode, settings.SECRET_KEY, algorithm="HS256")


# Global enhanced auth manager
enhanced_auth = EnhancedAuthManager()


async def initialize_enhanced_auth():
    """Initialize enhanced authentication"""
    await enhanced_auth.initialize()


def get_enhanced_auth() -> EnhancedAuthManager:
    """Get enhanced auth manager"""
    return enhanced_auth
