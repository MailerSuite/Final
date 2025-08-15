"""
Plan-based feature access control decorators
Enforces plan limits and feature access across the application
"""

from collections.abc import Callable
from functools import wraps

from fastapi import HTTPException

from services.plan_service import PlanService


def require_plan_feature(feature_name: str):
    """
    Decorator to enforce plan-based feature access

    Usage:
        @require_plan_feature("ai_subject_generation")
        async def generate_subject_lines(...):
            # Implementation protected by plan check
    """

    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Extract current_user and plan_service from dependencies
            current_user = None
            plan_service = None

            # Look for dependencies in kwargs (FastAPI dependency injection)
            for key, value in kwargs.items():
                if (
                    key == "current_user"
                    and isinstance(value, dict)
                    and "id" in value
                ):
                    current_user = value
                elif key == "plan_service" and isinstance(value, PlanService):
                    plan_service = value

            # If not found in kwargs, try to find in function signature
            if not current_user or not plan_service:
                import inspect

                sig = inspect.signature(func)
                bound_args = sig.bind(*args, **kwargs)
                bound_args.apply_defaults()

                for param_name, param_value in bound_args.arguments.items():
                    if (
                        param_name == "current_user"
                        and isinstance(param_value, dict)
                        and "id" in param_value
                    ):
                        current_user = param_value
                    elif param_name == "plan_service" and isinstance(
                        param_value, PlanService
                    ):
                        plan_service = param_value

            if not current_user:
                raise HTTPException(
                    status_code=401, detail="Authentication required"
                )

            if not plan_service:
                raise HTTPException(
                    status_code=500, detail="Plan service not available"
                )

            user_id = current_user.id
            has_feature = await plan_service.user_has_feature(
                user_id, feature_name
            )

            if not has_feature:
                plan = await plan_service.get_user_plan(user_id)
                upgrade_suggestion = plan_service._get_upgrade_suggestion(
                    plan.code if plan else "basic"
                )

                raise HTTPException(
                    status_code=402,
                    detail={
                        "error": "feature_not_available",
                        "message": "This feature requires a higher plan",
                        "required_feature": feature_name,
                        "current_plan": plan.name if plan else "No plan",
                        "upgrade_suggestion": upgrade_suggestion,
                        "upgrade_url": "/pricing",
                    },
                )

            return await func(*args, **kwargs)

        return wrapper

    return decorator


def require_plan_tier(minimum_tier: str):
    """
    Decorator to enforce minimum plan tier

    Usage:
        @require_plan_tier("premium")
        async def premium_feature(...):
            # Implementation requires premium or higher
    """
    tier_hierarchy = ["basic", "premium", "deluxe", "enterprise"]

    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Extract dependencies similar to require_plan_feature
            current_user = None
            plan_service = None

            for key, value in kwargs.items():
                if (
                    key == "current_user"
                    and isinstance(value, dict)
                    and "id" in value
                ):
                    current_user = value
                elif key == "plan_service" and isinstance(value, PlanService):
                    plan_service = value

            if not current_user or not plan_service:
                import inspect

                sig = inspect.signature(func)
                bound_args = sig.bind(*args, **kwargs)
                bound_args.apply_defaults()

                for param_name, param_value in bound_args.arguments.items():
                    if (
                        param_name == "current_user"
                        and isinstance(param_value, dict)
                        and "id" in param_value
                    ):
                        current_user = param_value
                    elif param_name == "plan_service" and isinstance(
                        param_value, PlanService
                    ):
                        plan_service = param_value

            if not current_user:
                raise HTTPException(
                    status_code=401, detail="Authentication required"
                )

            if not plan_service:
                raise HTTPException(
                    status_code=500, detail="Plan service not available"
                )

            user_id = current_user.id
            plan = await plan_service.get_user_plan(user_id)

            if not plan:
                raise HTTPException(
                    status_code=402,
                    detail={
                        "error": "no_active_plan",
                        "message": "No active plan found",
                        "upgrade_url": "/pricing",
                    },
                )

            current_tier_index = (
                tier_hierarchy.index(plan.code)
                if plan.code in tier_hierarchy
                else -1
            )
            required_tier_index = (
                tier_hierarchy.index(minimum_tier)
                if minimum_tier in tier_hierarchy
                else len(tier_hierarchy)
            )

            if current_tier_index < required_tier_index:
                upgrade_suggestion = plan_service._get_upgrade_suggestion(
                    plan.code
                )
                raise HTTPException(
                    status_code=402,
                    detail={
                        "error": "insufficient_plan",
                        "message": f"This feature requires {minimum_tier} plan or higher",
                        "current_plan": plan.name,
                        "required_plan": minimum_tier,
                        "upgrade_suggestion": upgrade_suggestion,
                        "upgrade_url": "/pricing",
                    },
                )

            return await func(*args, **kwargs)

        return wrapper

    return decorator


def require_quota(quota_type: str, amount: int = 1):
    """
    Decorator to enforce quota limits (AI calls, API requests, etc.)

    Usage:
        @require_quota("ai_calls_daily", 1)
        async def ai_feature(...):
            # Implementation consumes 1 AI call
    """

    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            current_user = None
            plan_service = None

            for key, value in kwargs.items():
                if (
                    key == "current_user"
                    and isinstance(value, dict)
                    and "id" in value
                ):
                    current_user = value
                elif key == "plan_service" and isinstance(value, PlanService):
                    plan_service = value

            if not current_user or not plan_service:
                import inspect

                sig = inspect.signature(func)
                bound_args = sig.bind(*args, **kwargs)
                bound_args.apply_defaults()

                for param_name, param_value in bound_args.arguments.items():
                    if (
                        param_name == "current_user"
                        and isinstance(param_value, dict)
                        and "id" in param_value
                    ):
                        current_user = param_value
                    elif param_name == "plan_service" and isinstance(
                        param_value, PlanService
                    ):
                        plan_service = param_value

            if not current_user:
                raise HTTPException(
                    status_code=401, detail="Authentication required"
                )

            if not plan_service:
                raise HTTPException(
                    status_code=500, detail="Plan service not available"
                )

            user_id = current_user.id

            # Check quota based on type
            if quota_type == "ai_calls_daily":
                quota_check = await plan_service.check_ai_quota(
                    user_id, tokens_requested=0
                )
                if not quota_check["allowed"]:
                    raise HTTPException(
                        status_code=429,
                        detail={
                            "error": "quota_exceeded",
                            "message": quota_check["message"],
                            "quota_type": quota_type,
                            "upgrade_url": "/pricing",
                        },
                    )

            # Execute the function
            result = await func(*args, **kwargs)

            # Increment usage after successful execution
            if quota_type == "ai_calls_daily":
                await plan_service.increment_ai_usage(
                    user_id, 0
                )  # Just increment call count

            return result

        return wrapper

    return decorator


# Convenience decorators for common features
def require_ai_features(func: Callable) -> Callable:
    """Shorthand for requiring any AI features"""
    return require_plan_tier("premium")(func)


def require_automation_features(func: Callable) -> Callable:
    """Shorthand for requiring automation features"""
    return require_plan_feature("automation_workflows")(func)


def require_performance_testing(func: Callable) -> Callable:
    """Shorthand for requiring performance testing features"""
    return require_plan_feature("performance_testing")(func)


def require_admin_access(func: Callable) -> Callable:
    """Shorthand for requiring admin/enterprise features"""
    return require_plan_tier("enterprise")(func)
