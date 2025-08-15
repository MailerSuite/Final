from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timedelta

from core.database import get_db
from routers.auth import get_current_user
from models.plan import Plan
from core.logger import get_logger

logger = get_logger(__name__)
router = APIRouter()

# Minimal in-memory subscription store (user_id -> data)
_SUBSCRIPTIONS: dict[str, dict] = {}
_USAGE: dict[str, dict] = {}


@router.get("/me")
async def get_my_subscription(current_user=Depends(get_current_user)):
    uid = str(current_user.id)
    sub = _SUBSCRIPTIONS.get(uid) or {
        "plan_code": "free",
        "plan_name": "Free",
        "renews_at": None,
        "status": "active",
        "cancel_at_period_end": False,
        "created_at": datetime.utcnow().isoformat(),
    }
    usage = _USAGE.get(uid) or {
        "emails_sent_month": 0,
        "api_calls_day": 0,
        "threads_max": 10,
        "threads_used_peak": 0,
    }
    return {"subscription": sub, "usage": usage}


@router.post("/me/cancel")
async def cancel_at_period_end(current_user=Depends(get_current_user)):
    uid = str(current_user.id)
    sub = _SUBSCRIPTIONS.setdefault(uid, {
        "plan_code": "free",
        "plan_name": "Free",
        "status": "active",
        "created_at": datetime.utcnow().isoformat(),
    })
    if sub.get("plan_code") == "free":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Free plan cannot be cancelled")
    sub["cancel_at_period_end"] = True
    return {"success": True}


@router.post("/me/uncancel")
async def undo_cancel(current_user=Depends(get_current_user)):
    uid = str(current_user.id)
    sub = _SUBSCRIPTIONS.get(uid)
    if not sub:
        raise HTTPException(status_code=404, detail="No subscription")
    sub["cancel_at_period_end"] = False
    return {"success": True}


@router.post("/me/upgrade")
async def upgrade_plan(payload: dict, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    uid = str(current_user.id)
    code = payload.get("plan_code")
    if not code:
        raise HTTPException(status_code=400, detail="plan_code required")
    result = await db.execute(select(Plan).where(Plan.code == code, Plan.is_active == True))
    plan = result.scalar_one_or_none()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    sub = _SUBSCRIPTIONS.setdefault(uid, {})
    sub.update({
        "plan_code": plan.code,
        "plan_name": plan.name,
        "status": "active",
        "renews_at": (datetime.utcnow() + timedelta(days=30)).isoformat(),
        "cancel_at_period_end": False,
        "created_at": sub.get("created_at") or datetime.utcnow().isoformat(),
    })
    return {"success": True, "subscription": sub}
