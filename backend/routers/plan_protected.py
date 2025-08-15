"""
Plan-Protected Endpoints for SGPT
Demonstrates integration of plan enforcement with existing functionality
"""

from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends, Header, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from routers.auth import get_current_user
from schemas.campaigns import CampaignCreate  # Your existing schemas
from services.plan_service import PlanService, get_plan_service

router = APIRouter(prefix="/api/v1", tags=["Admin"])


# Middleware decorator for plan enforcement
def require_feature(feature_name: str):
    """Decorator to require specific feature access"""

    def decorator(func):
        async def wrapper(*args, **kwargs):
            # Extract plan_service and user from kwargs
            plan_service = kwargs.get("plan_service")
            current_user = kwargs.get("current_user")

            if plan_service and current_user:
                has_feature = await plan_service.user_has_feature(
                    current_user.id, feature_name
                )
                if not has_feature:
                    raise HTTPException(
                        status_code=403,
                        detail={
                            "error": "feature_not_available",
                            "message": "This feature requires a higher plan.",
                            "required_feature": feature_name,
                            "upgrade_url": "/pricing",
                        },
                    )

            return await func(*args, **kwargs)

        return wrapper

    return decorator


@router.post("/campaigns/protected")
async def create_campaign_with_limits(
    campaign_data: CampaignCreate,
    current_user=Depends(get_current_user),
    plan_service: PlanService = Depends(get_plan_service),
    db: AsyncSession = Depends(get_db),
):
    """Create campaign with automatic thread limit enforcement"""

    user_id = current_user.id
    requested_threads = campaign_data.threads_number or 50

    # Check thread limits
    thread_check = await plan_service.check_thread_limit(
        user_id, requested_threads
    )

    if not thread_check["allowed"]:
        raise HTTPException(
            status_code=403,
            detail={
                "error": "thread_limit_exceeded",
                "message": thread_check["message"],
                "limit": thread_check["limit"],
                "requested": thread_check["requested"],
                "upgrade_suggestion": thread_check["upgrade_suggestion"],
                "upgrade_url": "/pricing",
            },
        )

    # Adjust threads to plan limit
    allocated_threads = thread_check["allocated_threads"]
    campaign_data.threads_number = allocated_threads

    # Get database tier for user (all dedicated but labeled appropriately)
    db_tier = await plan_service.get_database_tier_label(user_id)

    # Create campaign using your existing campaign creation logic
    # This would integrate with your existing CampaignService
    campaign_id = f"campaign_{user_id}_{int(datetime.now().timestamp())}"

    return {
        "success": True,
        "campaign_id": campaign_id,
        "threads_allocated": allocated_threads,
        "database_tier": db_tier,
        "message": f"Campaign created with {allocated_threads} threads on {db_tier} infrastructure",
    }


@router.post("/ai/chat/protected")
async def ai_chat_with_quota(
    request: dict[str, Any],
    current_user=Depends(get_current_user),
    plan_service: PlanService = Depends(get_plan_service),
):
    """AI chat endpoint with automatic quota enforcement"""

    user_id = current_user.id
    prompt = request.get("prompt", "")
    estimated_tokens = len(prompt) * 4  # Rough estimate: 4 tokens per word

    # Check AI quota before processing
    quota_check = await plan_service.check_ai_quota(user_id, estimated_tokens)

    if not quota_check["allowed"]:
        if quota_check["reason"] == "daily_limit_exceeded":
            raise HTTPException(
                status_code=429,
                detail={
                    "error": "quota_exceeded",
                    "message": quota_check["message"],
                    "limit": quota_check["limit"],
                    "current": quota_check["current"],
                    "reset_time": quota_check.get("reset_time"),
                    "upgrade_suggestion": quota_check["upgrade_suggestion"],
                    "upgrade_url": "/pricing",
                },
            )
        elif quota_check["reason"] == "token_limit_exceeded":
            raise HTTPException(
                status_code=429,
                detail={
                    "error": "token_quota_exceeded",
                    "message": quota_check["message"],
                    "upgrade_suggestion": quota_check["upgrade_suggestion"],
                    "upgrade_url": "/pricing",
                },
            )

    # Process AI request (integrate with your AI service)
    try:
        # Simulated AI processing - replace with your actual AI service
        ai_response = {
            "content": f"AI response to: {prompt[:50]}...",
            "tokens_used": estimated_tokens,
        }

        # Increment usage after successful request
        await plan_service.increment_ai_usage(
            user_id, ai_response["tokens_used"]
        )

        return {
            "response": ai_response["content"],
            "tokens_used": ai_response["tokens_used"],
            "plan": quota_check["plan_code"],
            "remaining_calls": quota_check.get("remaining_calls"),
        }

    except Exception as e:
        # Don't increment usage on failed requests
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/features/socks-stream")
@require_feature("socks_stream")
async def access_socks_stream(
    current_user=Depends(get_current_user),
    plan_service: PlanService = Depends(get_plan_service),
):
    """Access SOCKS STREAM feature (Premium+ only)"""

    return {
        "socks_enabled": True,
        "socks_endpoints": [
            "socks5://premium1.sgpt.dev:1080",
            "socks5://premium2.sgpt.dev:1080",
        ],
        "message": "SOCKS STREAM access granted",
        "plan_feature": "socks_stream",
    }


@router.get("/features/premium-support")
@require_feature("premium_support")
async def access_premium_support(
    current_user=Depends(get_current_user),
    plan_service: PlanService = Depends(get_plan_service),
):
    """Access premium support features (Deluxe+ only)"""

    return {
        "support_channels": ["priority_email", "live_chat", "phone_support"],
        "sla": "4 hour response time",
        "dedicated_manager": True,
        "message": "Premium support access granted",
    }


@router.post("/auth/session/protected")
async def create_session_with_fingerprint(
    request: Request,
    fingerprint: str = Header(None, alias="X-Device-Fingerprint"),
    current_user=Depends(get_current_user),
    plan_service: PlanService = Depends(get_plan_service),
):
    """Create session with device fingerprint enforcement - DISABLED"""

    user_id = current_user.id
    ip_address = request.client.host
    user_agent = request.headers.get("user-agent")

    # Fingerprint checking disabled - always allow session
    fingerprint_value = fingerprint or "no-fingerprint"

    # Session created successfully (no limits enforced)
    return {
        "message": "Session created (fingerprint checking disabled)",
        "fingerprint": fingerprint_value,
        "ip_address": ip_address,
        "session_type": "created",
    }


@router.get("/user/plan-status")
async def get_plan_status(
    current_user=Depends(get_current_user),
    plan_service: PlanService = Depends(get_plan_service),
):
    """Get comprehensive plan status and usage for user"""

    user_id = current_user.id
    usage_stats = await plan_service.get_user_usage_stats(user_id)

    if "error" in usage_stats:
        # User has no plan - assign default
        await plan_service.assign_default_plan(user_id)
        usage_stats = await plan_service.get_user_usage_stats(user_id)

    return {
        "user_id": user_id,
        "plan_info": usage_stats["plan"],
        "limits": usage_stats["limits"],
        "current_usage": usage_stats["current_usage"],
        "reset_times": usage_stats["reset_times"],
        "features": usage_stats["features"],
        "has_premium_support": usage_stats["has_premium_support"],
        "database_tier": usage_stats["plan"]["database_tier"],
    }


@router.get("/user/database-info")
async def get_database_info(
    current_user=Depends(get_current_user),
    plan_service: PlanService = Depends(get_plan_service),
):
    """Get user's database tier information"""

    user_id = current_user.id
    plan = await plan_service.get_user_plan(user_id)
    db_tier = await plan_service.get_database_tier_label(user_id)

    # Performance characteristics by tier
    tier_info = {
        "shared": {
            "performance": "Standard",
            "description": "Shared infrastructure with excellent performance",
            "features": [
                "Automatic backups",
                "99.9% uptime",
                "Standard support",
            ],
        },
        "premium": {
            "performance": "Enhanced",
            "description": "Premium infrastructure with faster response times",
            "features": [
                "Priority backups",
                "99.95% uptime",
                "Enhanced support",
                "SOCKS STREAM",
            ],
        },
        "dedicated": {
            "performance": "Maximum",
            "description": "Dedicated infrastructure for enterprise performance",
            "features": [
                "Real-time backups",
                "99.99% uptime",
                "Premium support",
                "All features",
            ],
        },
    }

    return {
        "database_tier": db_tier,
        "plan_name": plan.name if plan else "No Plan",
        "tier_info": tier_info.get(db_tier, tier_info["shared"]),
        "note": "All customers receive dedicated resources for optimal performance",
    }


# Admin endpoints for plan management
@router.get("/admin/plans", tags=["Admin"])
async def list_plans(
    current_user=Depends(get_current_user),
    plan_service: PlanService = Depends(get_plan_service),
    db: AsyncSession = Depends(get_db),
):
    """Admin endpoint to list all plans"""

    # Check if user is admin (implement your admin check logic)
    if not current_user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Admin access required")

    from sqlalchemy import select

    from models.plan import Plan

    result = await db.execute(
        select(Plan).where(Plan.is_active == True).order_by(Plan.sort_order)
    )
    plans = result.scalars().all()

    return {
        "plans": [
            {
                "id": plan.id,
                "name": plan.name,
                "code": plan.code,
                "max_threads": plan.max_threads,
                "max_ai_calls_daily": plan.max_ai_calls_daily,
                "database_tier_label": plan.database_tier_label,
                "features": plan.allowed_functions,
                "marketing_blurb": plan.marketing_blurb,
            }
            for plan in plans
        ]
    }


@router.post("/admin/user/{user_id}/assign-plan", tags=["Admin"])
async def assign_plan_to_user(
    user_id: str,
    plan_code: str,
    current_user=Depends(get_current_user),
    plan_service: PlanService = Depends(get_plan_service),
    db: AsyncSession = Depends(get_db),
):
    """Admin endpoint to assign plan to user"""

    # Check if user is admin
    if not current_user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Admin access required")

    from datetime import datetime, timedelta

    from sqlalchemy import select

    from models.plan import Plan, UserPlan

    # Get plan
    plan = await db.scalar(
        select(Plan).where(Plan.code == plan_code, Plan.is_active == True)
    )

    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")

    # Deactivate existing plans
    await db.execute(
        UserPlan.__table__.update()
        .where(UserPlan.user_id == user_id)
        .values(is_active=False)
    )

    # Create new plan assignment
    new_assignment = UserPlan(
        user_id=user_id,
        plan_id=plan.id,
        assigned_at=datetime.utcnow(),
        expires_at=datetime.utcnow() + timedelta(days=plan.duration_days)
        if plan.duration_days
        else None,
        is_active=True,
    )

    db.add(new_assignment)
    await db.commit()

    return {
        "message": f"Assigned {plan.name} plan to user {user_id}",
        "plan": plan.name,
        "expires_at": new_assignment.expires_at,
    }
