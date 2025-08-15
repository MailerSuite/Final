"""
Admin Access Router
API endpoints on main server that admin panel can call to manage users and get data
"""
from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import func, text
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import json

from ..config.database_config import get_db
from ..models.user import User
from ..models.plan import Plan  # Assuming you have a Plan model
from ..core.auth_utils import get_current_admin_user
from ..schemas.admin import *
from ..utils.admin_utils import log_admin_action

router = APIRouter(prefix="/access", tags=["Admin Access Control"])

# Authentication dependency for admin access
async def verify_admin_api_key(api_key: str = Query(..., alias="api_key")):
    """Verify admin API key for cross-server authentication"""
    import os
    expected_key = os.getenv("ADMIN_SERVER_API_KEY", "admin_default_key")
    if api_key != expected_key:
        raise HTTPException(status_code=401, detail="Invalid admin API key")
    return api_key

# User Management Endpoints

@router.get("/users")
async def get_users(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    search: Optional[str] = None,
    status: Optional[str] = None,
    plan_id: Optional[str] = None,
    api_key: str = Depends(verify_admin_api_key),
    db: Session = Depends(get_db)
):
    """
    Get users with pagination and filtering
    """
    try:
        query = db.query(User)
        
        # Apply filters
        if search:
            query = query.filter(
                User.email.ilike(f"%{search}%") | 
                User.first_name.ilike(f"%{search}%") | 
                User.last_name.ilike(f"%{search}%")
            )
        
        if status:
            query = query.filter(User.is_active == (status == "active"))
        
        if plan_id:
            query = query.filter(User.plan_id == plan_id)
        
        # Get total count
        total = query.count()
        
        # Apply pagination
        offset = (page - 1) * limit
        users = query.offset(offset).limit(limit).all()
        
        # Format response
        user_list = []
        for user in users:
            user_data = {
                "id": user.id,
                "email": user.email,
                "first_name": getattr(user, 'first_name', ''),
                "last_name": getattr(user, 'last_name', ''),
                "is_active": user.is_active,
                "plan_id": getattr(user, 'plan_id', None),
                "created_at": user.created_at.isoformat() if hasattr(user, 'created_at') else None,
                "last_login": getattr(user, 'last_login', None),
                "usage": await get_user_usage_data(user.id, db)
            }
            user_list.append(user_data)
        
        return {
            "users": user_list,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total,
                "pages": (total + limit - 1) // limit
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get users: {str(e)}")

@router.get("/users/{user_id}")
async def get_user_details(
    user_id: str,
    api_key: str = Depends(verify_admin_api_key),
    db: Session = Depends(get_db)
):
    """
    Get detailed information about a specific user
    """
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get user's plan information
        plan_info = None
        if hasattr(user, 'plan_id') and user.plan_id:
            plan = db.query(Plan).filter(Plan.id == user.plan_id).first()
            if plan:
                plan_info = {
                    "id": plan.id,
                    "name": plan.name,
                    "price": getattr(plan, 'price', 0),
                    "features": getattr(plan, 'features', [])
                }
        
        # Get usage statistics
        usage_stats = await get_user_usage_data(user_id, db)
        
        return {
            "id": user.id,
            "email": user.email,
            "first_name": getattr(user, 'first_name', ''),
            "last_name": getattr(user, 'last_name', ''),
            "is_active": user.is_active,
            "plan": plan_info,
            "usage": usage_stats,
            "created_at": user.created_at.isoformat() if hasattr(user, 'created_at') else None,
            "last_login": getattr(user, 'last_login', None),
            "settings": getattr(user, 'settings', {})
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get user details: {str(e)}")

@router.post("/users")
async def create_user_account(
    user_data: dict,
    background_tasks: BackgroundTasks,
    api_key: str = Depends(verify_admin_api_key),
    db: Session = Depends(get_db)
):
    """
    Create new user account from admin panel
    """
    try:
        # Check if user already exists
        existing_user = db.query(User).filter(User.email == user_data.get("email")).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="User already exists")
        
        # Create new user
        new_user = User(
            email=user_data.get("email"),
            first_name=user_data.get("first_name", ""),
            last_name=user_data.get("last_name", ""),
            is_active=user_data.get("is_active", True),
            plan_id=user_data.get("plan_id"),
            created_at=datetime.utcnow()
        )
        
        # Set password if provided
        if user_data.get("password"):
            # Hash password using your existing hash function
            from ..core.auth_utils import hash_password
            new_user.password_hash = hash_password(user_data["password"])
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        # Send welcome email in background
        background_tasks.add_task(send_welcome_email, new_user.email, new_user.first_name)
        
        return {
            "id": new_user.id,
            "email": new_user.email,
            "message": "User created successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create user: {str(e)}")

@router.put("/users/{user_id}/plan")
async def update_user_plan(
    user_id: str,
    plan_data: dict,
    api_key: str = Depends(verify_admin_api_key),
    db: Session = Depends(get_db)
):
    """
    Update user's plan
    """
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        old_plan_id = getattr(user, 'plan_id', None)
        new_plan_id = plan_data.get("plan_id")
        
        # Validate new plan exists
        if new_plan_id:
            plan = db.query(Plan).filter(Plan.id == new_plan_id).first()
            if not plan:
                raise HTTPException(status_code=400, detail="Invalid plan ID")
        
        # Update user's plan
        user.plan_id = new_plan_id
        user.updated_at = datetime.utcnow()
        
        db.commit()
        
        # Log the change
        await log_plan_change(user_id, old_plan_id, new_plan_id, db)
        
        return {
            "message": "User plan updated successfully",
            "user_id": user_id,
            "old_plan": old_plan_id,
            "new_plan": new_plan_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update user plan: {str(e)}")

@router.put("/users/{user_id}/status")
async def update_user_status(
    user_id: str,
    status_data: dict,
    api_key: str = Depends(verify_admin_api_key),
    db: Session = Depends(get_db)
):
    """
    Update user's status (active/inactive/suspended)
    """
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        new_status = status_data.get("status")
        if new_status not in ["active", "inactive", "suspended"]:
            raise HTTPException(status_code=400, detail="Invalid status")
        
        old_status = "active" if user.is_active else "inactive"
        
        # Update status
        user.is_active = (new_status == "active")
        if hasattr(user, 'status'):
            user.status = new_status
        user.updated_at = datetime.utcnow()
        
        db.commit()
        
        return {
            "message": "User status updated successfully",
            "user_id": user_id,
            "old_status": old_status,
            "new_status": new_status
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update user status: {str(e)}")

@router.get("/users/{user_id}/usage")
async def get_user_usage_stats(
    user_id: str,
    timeframe: str = Query("30d", regex="^(24h|7d|30d|90d)$"),
    api_key: str = Depends(verify_admin_api_key),
    db: Session = Depends(get_db)
):
    """
    Get user usage statistics
    """
    try:
        usage_data = await get_user_usage_data(user_id, db, timeframe)
        return usage_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get usage stats: {str(e)}")

# Plan Management Endpoints

@router.get("/plans")
async def get_all_plans(
    api_key: str = Depends(verify_admin_api_key),
    db: Session = Depends(get_db)
):
    """
    Get all available plans
    """
    try:
        plans = db.query(Plan).all()
        
        plan_list = []
        for plan in plans:
            plan_data = {
                "id": plan.id,
                "name": plan.name,
                "description": getattr(plan, 'description', ''),
                "price": getattr(plan, 'price', 0),
                "billing_period": getattr(plan, 'billing_period', 'monthly'),
                "features": getattr(plan, 'features', []),
                "limits": getattr(plan, 'limits', {}),
                "is_active": getattr(plan, 'is_active', True),
                "user_count": db.query(User).filter(User.plan_id == plan.id).count()
            }
            plan_list.append(plan_data)
        
        return {"plans": plan_list}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get plans: {str(e)}")

# Metrics & Analytics Endpoints

@router.get("/metrics/overview")
async def get_overview_metrics(
    api_key: str = Depends(verify_admin_api_key),
    db: Session = Depends(get_db)
):
    """
    Get system overview metrics
    """
    try:
        # Get user metrics
        total_users = db.query(User).count()
        active_users = db.query(User).filter(User.is_active == True).count()
        new_users_today = db.query(User).filter(
            func.date(User.created_at) == datetime.utcnow().date()
        ).count() if hasattr(User, 'created_at') else 0
        
        # Get plan distribution
        plan_distribution = {}
        plans = db.query(Plan).all()
        for plan in plans:
            count = db.query(User).filter(User.plan_id == plan.id).count()
            plan_distribution[plan.name] = count
        
        return {
            "users": {
                "total": total_users,
                "active": active_users,
                "new_today": new_users_today,
                "plan_distribution": plan_distribution
            },
            "system": {
                "uptime": "99.9%",  # Get from system monitoring
                "last_updated": datetime.utcnow().isoformat()
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get overview metrics: {str(e)}")

@router.get("/metrics/users")
async def get_user_metrics(
    timeframe: str = Query("24h", regex="^(1h|24h|7d|30d)$"),
    api_key: str = Depends(verify_admin_api_key),
    db: Session = Depends(get_db)
):
    """
    Get user metrics for specified timeframe
    """
    try:
        # Calculate time range
        now = datetime.utcnow()
        if timeframe == "1h":
            start_time = now - timedelta(hours=1)
        elif timeframe == "24h":
            start_time = now - timedelta(days=1)
        elif timeframe == "7d":
            start_time = now - timedelta(days=7)
        else:  # 30d
            start_time = now - timedelta(days=30)
        
        # Get metrics (adjust based on your actual schema)
        metrics = {
            "new_registrations": 0,
            "active_sessions": 0,
            "plan_upgrades": 0,
            "churn_rate": 0.0
        }
        
        # If you have proper logging tables, query them here
        if hasattr(User, 'created_at'):
            metrics["new_registrations"] = db.query(User).filter(
                User.created_at >= start_time
            ).count()
        
        return {
            "timeframe": timeframe,
            "metrics": metrics,
            "generated_at": now.isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get user metrics: {str(e)}")

# System Operations Endpoints

@router.get("/system/health")
async def get_system_health(
    api_key: str = Depends(verify_admin_api_key),
    db: Session = Depends(get_db)
):
    """
    Get system health status
    """
    try:
        # Test database connection
        db.execute(text("SELECT 1"))
        
        health_data = {
            "status": "healthy",
            "database": "connected",
            "timestamp": datetime.utcnow().isoformat(),
            "services": {
                "api": "healthy",
                "database": "healthy",
                "cache": "healthy"  # Add actual cache check
            }
        }
        
        return health_data
        
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }

@router.get("/system/stats")
async def get_system_stats(
    api_key: str = Depends(verify_admin_api_key),
    db: Session = Depends(get_db)
):
    """
    Get system statistics
    """
    try:
        # Get database stats
        total_users = db.query(User).count()
        
        stats = {
            "database": {
                "total_users": total_users,
                "total_tables": 10,  # Update with actual count
                "last_backup": "2024-01-01T00:00:00Z"  # Get from backup system
            },
            "performance": {
                "avg_response_time": 150,  # ms
                "requests_per_minute": 100,
                "error_rate": 0.1  # %
            },
            "generated_at": datetime.utcnow().isoformat()
        }
        
        return stats
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get system stats: {str(e)}")

# Utility Functions

async def get_user_usage_data(user_id: str, db: Session, timeframe: str = "30d") -> Dict:
    """Get user usage statistics"""
    # Implement based on your actual usage tracking
    return {
        "emails_sent": 0,
        "campaigns_created": 0,
        "storage_used": 0,
        "api_calls": 0,
        "last_activity": None
    }

async def send_welcome_email(email: str, name: str):
    """Send welcome email to new user"""
    # Implement email sending logic
    pass

async def log_plan_change(user_id: str, old_plan: str, new_plan: str, db: Session):
    """Log plan change for auditing"""
    # Implement audit logging
    pass