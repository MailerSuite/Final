from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Dict, Any
import secrets
import time

from core.database import get_db
from routers.auth import get_current_user
from core.logger import get_logger

logger = get_logger(__name__)
router = APIRouter()

# Minimal in-memory store (replace with Redis/DB in production)
_API_KEYS_STORE: Dict[str, Dict[str, Dict[str, Any]]] = {}


def _now() -> float:
    return time.time()


@router.get("/", response_model=List[Dict[str, Any]])
async def list_api_keys(current_user=Depends(get_current_user)):
    user_id = str(current_user.id)
    user_keys = _API_KEYS_STORE.get(user_id, {})
    # Do not return secrets
    return [
        {"id": kid, "name": meta.get("name", ""), "created_at": meta.get("created_at")}
        for kid, meta in user_keys.items()
    ]


@router.post("/", response_model=Dict[str, Any])
async def create_api_key(payload: Dict[str, Any], current_user=Depends(get_current_user)):
    user_id = str(current_user.id)
    key_id = secrets.token_urlsafe(8)
    secret = secrets.token_urlsafe(24)
    _API_KEYS_STORE.setdefault(user_id, {})[key_id] = {
        "name": payload.get("name") or "Personal Token",
        "secret": secret,  # In production store a hash only
        "created_at": _now(),
    }
    return {"id": key_id, "name": _API_KEYS_STORE[user_id][key_id]["name"], "secret": secret}


@router.delete("/{key_id}")
async def delete_api_key(key_id: str, current_user=Depends(get_current_user)):
    user_id = str(current_user.id)
    user_keys = _API_KEYS_STORE.get(user_id, {})
    if key_id not in user_keys:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="API key not found")
    user_keys.pop(key_id, None)
    return {"success": True}
