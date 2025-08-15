"""Core dependencies for the application"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from sqlalchemy import select
import jwt
from datetime import datetime

from .database import get_db
from config.settings import settings
from models.base import User

# Use non-failing bearer so we can return 401 consistently from our dependency
security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Get current user from JWT token"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # If no credentials provided, return 401 Unauthorized (not 403)
    if credentials is None:
        raise credentials_exception

    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        sub: str | None = payload.get("sub")
        if not sub:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception

    # Resolve subject flexibly: UUID, int, or email
    try:
        query = None
        try:
            from uuid import UUID
            user_uuid = UUID(sub)  # type: ignore[arg-type]
            query = select(User).where(User.id == user_uuid)
        except (ValueError, TypeError):
            if sub.isdigit():  # type: ignore[union-attr]
                query = select(User).where(User.id == int(sub))
            else:
                query = select(User).where(User.email == sub)

        # Prefer SQLAlchemy 2.0 style select for compatibility with AsyncSession
        result = await db.execute(query)  # type: ignore[attr-defined]
        user = result.scalar_one_or_none()
    except AttributeError:
        # Fallback for sync Session
        try:
            from uuid import UUID
            user_uuid = UUID(sub)  # type: ignore[arg-type]
            user = db.query(User).filter(User.id == user_uuid).first()
        except (ValueError, TypeError):
            if sub.isdigit():  # type: ignore[union-attr]
                user = db.query(User).filter(User.id == int(sub)).first()
            else:
                user = db.query(User).filter(User.email == sub).first()
    
    if user is None:
        raise credentials_exception
        
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )
    
    return user


async def require_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    """Require admin privileges"""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    return current_user


def create_access_token(data: dict, expires_delta=None):
    """Create JWT access token"""
    import jwt
    from datetime import datetime, timedelta
    
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt