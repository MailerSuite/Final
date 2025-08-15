"""
Bootstrap Router
Consolidated bootstrap endpoint to accelerate initial frontend load.
Returns current user (if authenticated), feature flags, navigation, and common config in one call.
"""
from __future__ import annotations

import hashlib
import logging
from datetime import datetime
from typing import Any, Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Response, status
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.auth_utils import decode_token
from config.settings import settings
from models import User

router = APIRouter()
logger = logging.getLogger(__name__)


async def _get_optional_user(
    authorization: Optional[str] = Header(default=None),
    db: AsyncSession = Depends(get_db),
) -> Optional[User]:
    if not authorization:
        return None
    try:
        scheme, token = authorization.split(" ", 1)
        if scheme.lower() != "bearer":
            return None
        payload = decode_token(token)
        if payload.get("type") != "access":
            return None
        user_id_str = payload.get("sub")
        if not user_id_str:
            return None
        try:
            user_id_int = int(user_id_str)
        except (TypeError, ValueError):
            return None
        result = await db.execute(select(User).where(User.id == user_id_int))
        user = result.scalar_one_or_none()
        return user
    except Exception as exc:
        logger.debug(f"Optional auth parse failed: {exc}")
        return None


@router.get("/")
async def bootstrap(
    response: Response,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(_get_optional_user),
    if_none_match: Optional[str] = Header(default=None),
    include: Optional[str] = None,
) -> dict[str, Any]:
    """Return initial data required by the frontend in one call.

    Includes:
    - currentUser (if authenticated), otherwise guest
    - featureFlags (server-driven)
    - navigation (primary/secondary links)
    - environment/config (api base, websocket url, version)
    """
    user_key = str(current_user.id) if current_user else "guest"

    # Assemble payload
    current_user_payload: Optional[dict[str, Any]] = None
    if current_user:
        current_user_payload = {
            "id": str(current_user.id),
            "email": current_user.email,
            "isActive": bool(getattr(current_user, "is_active", True)),
            "isAdmin": bool(getattr(current_user, "is_admin", False)),
            # ISO datetime strings if available
            "createdAt": getattr(current_user, "created_at", None),
        }

    feature_flags = {
        "aiEnabled": True,
        "realtimeEnabled": settings.WEBSOCKET_ENABLED,
        "bulkMail": settings.ENABLE_BULK_MAIL,
        "metrics": settings.ENABLE_METRICS,
    }

    navigation = {
        "primary": [
            {"label": "Dashboard", "path": "/client/dashboard"},
            {"label": "Campaigns", "path": "/client/campaigns"},
            {"label": "Templates", "path": "/client/templates"},
            {"label": "Analytics", "path": "/client/analytics"},
        ],
        "secondary": [
            {"label": "Settings", "path": "/client/settings"},
            {"label": "Showcase", "path": "/showcase/hub"},
        ],
    }

    env = {
        "apiBase": "/api/v1",
        "wsEnabled": settings.WEBSOCKET_ENABLED,
        "version": "2.1.0",
    }

    payload: dict[str, Any] = {"serverTime": datetime.utcnow().isoformat() + "Z"}

    # Include selection: comma-separated keys (user,flags,nav,env)
    requested = set((include or "user,flags,nav,env,workspaces").split(","))
    if "user" in requested:
        payload.update({
            "currentUser": current_user_payload,
            "isAuthenticated": bool(current_user),
        })
    if "flags" in requested:
        payload["featureFlags"] = feature_flags
    if "nav" in requested:
        payload["navigation"] = navigation
    if "env" in requested:
        payload["env"] = env
    if "workspaces" in requested:
        # Workspaces are aliased to Session rows for now
        if current_user:
            # For now, return empty workspaces to avoid the database query issue
            ws_list = []
            active_ws = None
        else:
            ws_list = []
            active_ws = None
        payload["workspaces"] = {"items": ws_list, "activeWorkspaceId": active_ws.get("id") if active_ws else None}

    # ETag for conditional GETs
    version = env["version"]
    active_ws_id = payload.get("workspaces", {}).get("activeWorkspaceId") if "workspaces" in requested else None
    hash_input = f"bootstrap-v1:{user_key}:{version}:{sorted(requested)}:{active_ws_id}".encode()
    etag = 'W/"' + hashlib.md5(hash_input).hexdigest()[:12] + '"'
    if if_none_match == etag:
        response.status_code = status.HTTP_304_NOT_MODIFIED
        return {}
    response.headers["ETag"] = etag

    return payload
