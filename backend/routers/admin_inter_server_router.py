"""
Admin Inter-Server Communication Router
Endpoints for admin panel to communicate with main server and manage cached data
"""
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Dict, Optional

from ..config.admin_database_config import get_admin_db
from ..services.main_server_client import get_main_server_client
from ..services.admin_cache_service import (
    cache_service, get_cached_system_metrics, get_cached_user_metrics, 
    get_cached_users, refresh_all_cache
)
from ..core.auth_utils import get_current_admin_user

router = APIRouter()

# User Management through Inter-Server Communication

@router.get("/users")
async def get_users_from_main_server(
    page: int = 1,
    limit: int = 50,
    search: Optional[str] = None,
    use_cache: bool = True,
    current_admin = Depends(get_current_admin_user),
    admin_db: Session = Depends(get_admin_db)
):
    """
    Get users from main server with caching support
    """
    try:
        if use_cache:
            # Try to get from cache first
            cached_data = await get_cached_users(page, limit, search)
            if cached_data.get("users"):
                return {
                    "source": "cache",
                    "data": cached_data,
                    "cache_info": cached_data.get("cache_info", {})
                }
        
        # Fallback to main server
        client = await get_main_server_client()
        fresh_data = await client.get_users(page, limit, search)
        
        return {
            "source": "main_server",
            "data": fresh_data
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get users: {str(e)}")

@router.get("/users/{user_id}")
async def get_user_details_from_main_server(
    user_id: str,
    current_admin = Depends(get_current_admin_user)
):
    """
    Get detailed user information from main server
    """
    try:
        client = await get_main_server_client()
        user_data = await client.get_user(user_id)
        return user_data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get user details: {str(e)}")

@router.post("/users")
async def create_user_on_main_server(
    user_data: dict,
    background_tasks: BackgroundTasks,
    current_admin = Depends(get_current_admin_user),
    admin_db: Session = Depends(get_admin_db)
):
    """
    Create new user account on main server
    """
    try:
        client = await get_main_server_client()
        result = await client.create_user(user_data)
        
        # Invalidate user cache after creation
        background_tasks.add_task(cache_service.invalidate_cache, "user_list")
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create user: {str(e)}")

@router.put("/users/{user_id}/plan")
async def update_user_plan_on_main_server(
    user_id: str,
    plan_data: dict,
    background_tasks: BackgroundTasks,
    current_admin = Depends(get_current_admin_user)
):
    """
    Update user plan on main server
    """
    try:
        client = await get_main_server_client()
        result = await client.update_user_plan(user_id, plan_data.get("plan_id"))
        
        # Invalidate cache after plan change
        background_tasks.add_task(cache_service.invalidate_cache, "user_list")
        background_tasks.add_task(cache_service.invalidate_cache, "user_metrics")
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update user plan: {str(e)}")

@router.put("/users/{user_id}/status")
async def update_user_status_on_main_server(
    user_id: str,
    status_data: dict,
    background_tasks: BackgroundTasks,
    current_admin = Depends(get_current_admin_user)
):
    """
    Update user status on main server
    """
    try:
        client = await get_main_server_client()
        result = await client.update_user_status(user_id, status_data.get("status"))
        
        # Invalidate cache after status change
        background_tasks.add_task(cache_service.invalidate_cache, "user_list")
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update user status: {str(e)}")

# Metrics and Analytics

@router.get("/metrics/overview")
async def get_overview_metrics_cached(
    force_refresh: bool = False,
    current_admin = Depends(get_current_admin_user)
):
    """
    Get system overview metrics with caching
    """
    try:
        metrics = await get_cached_system_metrics(force_refresh)
        
        if not metrics:
            # Fallback to direct API call
            client = await get_main_server_client()
            metrics = await client.get_overview_metrics()
        
        return {
            "metrics": metrics,
            "cached": not force_refresh,
            "timestamp": metrics.get("generated_at") if metrics else None
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get overview metrics: {str(e)}")

@router.get("/metrics/users")
async def get_user_metrics_cached(
    timeframe: str = "24h",
    force_refresh: bool = False,
    current_admin = Depends(get_current_admin_user)
):
    """
    Get user metrics with caching
    """
    try:
        metrics = await get_cached_user_metrics(force_refresh)
        
        if not metrics or force_refresh:
            # Get fresh data from main server
            client = await get_main_server_client()
            metrics = await client.get_user_metrics(timeframe)
        
        return {
            "metrics": metrics,
            "timeframe": timeframe,
            "cached": not force_refresh
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get user metrics: {str(e)}")

@router.get("/metrics/campaigns")
async def get_campaign_metrics_from_main_server(
    timeframe: str = "24h",
    current_admin = Depends(get_current_admin_user)
):
    """
    Get campaign metrics from main server
    """
    try:
        client = await get_main_server_client()
        metrics = await client.get_campaign_metrics(timeframe)
        return metrics
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get campaign metrics: {str(e)}")

@router.get("/metrics/emails")
async def get_email_metrics_from_main_server(
    timeframe: str = "24h",
    current_admin = Depends(get_current_admin_user)
):
    """
    Get email metrics from main server
    """
    try:
        client = await get_main_server_client()
        metrics = await client.get_email_metrics(timeframe)
        return metrics
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get email metrics: {str(e)}")

# System Operations

@router.get("/system/health")
async def get_system_health_from_main_server(
    current_admin = Depends(get_current_admin_user)
):
    """
    Get system health from main server
    """
    try:
        client = await get_main_server_client()
        health = await client.get_system_health()
        return health
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get system health: {str(e)}")

@router.get("/system/stats")
async def get_system_stats_from_main_server(
    current_admin = Depends(get_current_admin_user)
):
    """
    Get system statistics from main server
    """
    try:
        client = await get_main_server_client()
        stats = await client.get_system_stats()
        return stats
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get system stats: {str(e)}")

@router.post("/system/maintenance")
async def trigger_maintenance_on_main_server(
    maintenance_data: dict,
    current_admin = Depends(get_current_admin_user)
):
    """
    Trigger maintenance tasks on main server
    """
    try:
        client = await get_main_server_client()
        result = await client.trigger_maintenance(maintenance_data.get("maintenance_type"))
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to trigger maintenance: {str(e)}")

# Cache Management

@router.post("/cache/refresh")
async def refresh_cache(
    background_tasks: BackgroundTasks,
    cache_type: Optional[str] = None,
    current_admin = Depends(get_current_admin_user)
):
    """
    Refresh cache data from main server
    """
    try:
        if cache_type:
            if cache_type == "users":
                success = await cache_service.refresh_user_cache()
            elif cache_type in ["system_metrics", "user_metrics"]:
                await cache_service.get_cached_metrics(cache_type, force_refresh=True)
                success = True
            else:
                raise HTTPException(status_code=400, detail="Invalid cache type")
        else:
            # Refresh all cache
            background_tasks.add_task(refresh_all_cache)
            success = True
        
        return {
            "message": f"Cache refresh {'initiated' if not cache_type else 'completed'}",
            "cache_type": cache_type or "all",
            "success": success
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to refresh cache: {str(e)}")

@router.get("/cache/status")
async def get_cache_status(
    current_admin = Depends(get_current_admin_user)
):
    """
    Get cache status and statistics
    """
    try:
        status = await cache_service.get_cache_status()
        return status
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get cache status: {str(e)}")

@router.delete("/cache/clear")
async def clear_cache(
    cache_type: Optional[str] = None,
    current_admin = Depends(get_current_admin_user)
):
    """
    Clear cache data
    """
    try:
        await cache_service.invalidate_cache(cache_type)
        
        return {
            "message": "Cache cleared successfully",
            "cache_type": cache_type or "all"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to clear cache: {str(e)}")

# Communication Health

@router.get("/communication/health")
async def check_communication_health(
    current_admin = Depends(get_current_admin_user)
):
    """
    Check health of communication with main server
    """
    try:
        client = await get_main_server_client()
        
        # Test connection
        is_healthy = await client.ping()
        
        # Get communication logs
        admin_db = AdminSessionLocal()
        try:
            from ..models.admin_models import AdminCommunicationLog
            from datetime import datetime, timedelta
            
            # Get recent communication stats
            one_hour_ago = datetime.utcnow() - timedelta(hours=1)
            recent_logs = admin_db.query(AdminCommunicationLog).filter(
                AdminCommunicationLog.created_at >= one_hour_ago
            ).all()
            
            total_calls = len(recent_logs)
            successful_calls = len([log for log in recent_logs if log.success])
            success_rate = (successful_calls / total_calls * 100) if total_calls > 0 else 0
            
            avg_response_time = sum([log.response_time_ms for log in recent_logs if log.response_time_ms]) / total_calls if total_calls > 0 else 0
            
        finally:
            admin_db.close()
        
        return {
            "main_server_reachable": is_healthy,
            "communication_stats": {
                "total_calls_last_hour": total_calls,
                "success_rate": round(success_rate, 2),
                "average_response_time_ms": round(avg_response_time, 2)
            },
            "cache_status": await cache_service.get_cache_status(),
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        return {
            "main_server_reachable": False,
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }

@router.get("/communication/logs")
async def get_communication_logs(
    limit: int = 50,
    operation: Optional[str] = None,
    current_admin = Depends(get_current_admin_user),
    admin_db: Session = Depends(get_admin_db)
):
    """
    Get recent communication logs
    """
    try:
        from ..models.admin_models import AdminCommunicationLog
        
        query = admin_db.query(AdminCommunicationLog)
        
        if operation:
            query = query.filter(AdminCommunicationLog.operation.contains(operation))
        
        logs = query.order_by(AdminCommunicationLog.created_at.desc()).limit(limit).all()
        
        log_list = []
        for log in logs:
            log_data = {
                "id": log.id,
                "operation": log.operation,
                "endpoint": log.endpoint,
                "status_code": log.status_code,
                "success": log.success,
                "response_time_ms": log.response_time_ms,
                "error_message": log.error_message,
                "created_at": log.created_at.isoformat()
            }
            log_list.append(log_data)
        
        return {
            "logs": log_list,
            "total": len(log_list)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get communication logs: {str(e)}")

# Plan Management

@router.get("/plans")
async def get_plans_from_main_server(
    current_admin = Depends(get_current_admin_user)
):
    """
    Get all plans from main server
    """
    try:
        client = await get_main_server_client()
        plans = await client.get_plans()
        return plans
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get plans: {str(e)}")

# Bulk Operations

@router.post("/users/bulk-update")
async def bulk_update_users_on_main_server(
    updates_data: dict,
    background_tasks: BackgroundTasks,
    current_admin = Depends(get_current_admin_user)
):
    """
    Bulk update users on main server
    """
    try:
        client = await get_main_server_client()
        result = await client.bulk_update_users(updates_data.get("updates", []))
        
        # Invalidate cache after bulk update
        background_tasks.add_task(cache_service.invalidate_cache, "user_list")
        background_tasks.add_task(cache_service.invalidate_cache, "user_metrics")
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to bulk update users: {str(e)}")

# Helper function for database sessions
from ..config.admin_database_config import AdminSessionLocal