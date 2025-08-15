"""
Fixed Admin Router - Uses separate admin database with proper relationships
Resolves all integration issues and enables independent deployment
"""

import logging
import psutil
from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func, and_, or_, desc
from sqlalchemy.ext.asyncio import AsyncSession

# Admin database imports
from config.admin_database_config import get_admin_db
from models.admin_models import (
    AdminUser, 
    AdminPlan, 
    AdminUserPlan,
    AdminSupportTicket,
    AdminSystemStats,
    AdminSecurityEvent,
    AdminUserActivity
)
from services.admin_database_service import AdminDatabaseService

# Authentication (still uses main auth system)
from routers.auth import get_current_admin_user
from schemas.common import MessageResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/admin", tags=["Admin"])

# ==================== DASHBOARD & OVERVIEW ====================

@router.get("/")
async def admin_info():
    """Admin API information with fixed endpoints"""
    return {
        "service": "SGPT Admin Panel - Fixed Version",
        "version": "2.1.0",
        "database": "Separate Admin Database",
        "description": "Fixed admin panel with proper database separation",
        "endpoints": {
            "dashboard": "/dashboard - Real dashboard stats",
            "users": "/users - Fixed user management with plan relationships", 
            "plans": "/plans - Complete plan management",
            "tickets": "/tickets - Support ticket system",
            "stats": "/stats - System statistics",
            "security": "/security/events - Security monitoring"
        },
        "status": "All endpoints functional",
        "deployment": "Ready for independent hosting"
    }

@router.get("/dashboard")
async def get_admin_dashboard(
    db: AsyncSession = Depends(get_admin_db),
    current_admin=Depends(get_current_admin_user)
):
    """Get comprehensive admin dashboard data - FIXED"""
    try:
        # Get real dashboard stats from admin database service
        stats = await AdminDatabaseService.get_admin_dashboard_stats()
        
        # Add system metrics
        system_metrics = {
            'cpu_percent': psutil.cpu_percent(interval=1),
            'memory_percent': psutil.virtual_memory().percent,
            'disk_percent': psutil.disk_usage('/').percent,
            'system_load_avg': psutil.getloadavg()[0] if hasattr(psutil, 'getloadavg') else 0.0
        }
        
        # Combine stats
        dashboard_data = {
            **stats,
            'system_metrics': system_metrics,
            'status': 'healthy',
            'timestamp': datetime.utcnow().isoformat()
        }
        
        logger.info(f"✅ Admin dashboard accessed by {current_admin.email}")
        return dashboard_data
        
    except Exception as e:
        logger.error(f"❌ Failed to get admin dashboard: {e}")
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to load dashboard: {str(e)}"
        )

# ==================== USER MANAGEMENT - FIXED ====================

@router.get("/users/count")
async def get_user_count(
    db: AsyncSession = Depends(get_admin_db),
    current_admin=Depends(get_current_admin_user)
):
    """Get user count - FIXED with admin database"""
    try:
        # Total users
        total_result = await db.execute(select(func.count(AdminUser.id)))
        total_users = total_result.scalar() or 0
        
        # Active users
        active_result = await db.execute(
            select(func.count(AdminUser.id)).where(AdminUser.is_active == True)
        )
        active_users = active_result.scalar() or 0
        
        # Users created today
        today = datetime.utcnow().date()
        today_result = await db.execute(
            select(func.count(AdminUser.id)).where(
                func.date(AdminUser.created_at) == today
            )
        )
        users_today = today_result.scalar() or 0
        
        return {
            "total_users": total_users,
            "active_users": active_users,
            "inactive_users": total_users - active_users,
            "users_created_today": users_today,
            "last_updated": datetime.utcnow().isoformat(),
        }
        
    except Exception as e:
        logger.error(f"❌ Error getting user count: {e}")
        raise HTTPException(status_code=500, detail="Failed to get user count")

@router.get("/users")
async def list_users(
    db: AsyncSession = Depends(get_admin_db),
    current_admin=Depends(get_current_admin_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: str = Query(None),
    status_filter: str = Query(None),
    plan_filter: str = Query(None)
):
    """List users with plan information - FIXED"""
    try:
        # Build query with proper joins
        query = select(AdminUser).join(AdminPlan, AdminUser.plan_id == AdminPlan.id, isouter=True)
        
        # Apply filters
        if search:
            query = query.where(
                or_(
                    AdminUser.email.ilike(f"%{search}%"),
                    AdminUser.username.ilike(f"%{search}%")
                )
            )
        
        if status_filter == "active":
            query = query.where(AdminUser.is_active == True)
        elif status_filter == "inactive":
            query = query.where(AdminUser.is_active == False)
        
        if plan_filter:
            query = query.where(AdminPlan.code == plan_filter)
        
        # Add pagination and ordering
        query = query.order_by(desc(AdminUser.created_at)).offset(skip).limit(limit)
        
        # Execute query
        result = await db.execute(query)
        users = result.scalars().all()
        
        # Format response with plan information
        users_data = []
        for user in users:
            user_data = {
                "id": user.id,
                "email": user.email,
                "username": user.username,
                "is_active": user.is_active,
                "is_admin": user.is_admin,
                "is_verified": user.is_verified,
                "created_at": user.created_at.isoformat() if user.created_at else None,
                "last_login_at": user.last_login_at.isoformat() if user.last_login_at else None,
                "total_campaigns": user.total_campaigns,
                "total_emails_sent": user.total_emails_sent,
                # FIXED: Include plan information
                "plan": {
                    "id": user.plan.id if user.plan else None,
                    "name": user.plan.name if user.plan else "No Plan",
                    "code": user.plan.code if user.plan else None,
                    "price_per_month": user.plan.price_per_month if user.plan else None
                } if user.plan else None
            }
            users_data.append(user_data)
        
        logger.info(f"✅ Listed {len(users_data)} users for admin {current_admin.email}")
        return {
            "users": users_data,
            "total": len(users_data),
            "skip": skip,
            "limit": limit
        }
        
    except Exception as e:
        logger.error(f"❌ Error listing users: {e}")
        raise HTTPException(status_code=500, detail="Failed to list users")

# ==================== PLAN MANAGEMENT - FIXED ====================

@router.get("/plans")
async def list_plans(
    db: AsyncSession = Depends(get_admin_db),
    current_admin=Depends(get_current_admin_user)
):
    """List all plans with user statistics - FIXED"""
    try:
        # Get plans with user counts
        query = select(AdminPlan)
        result = await db.execute(query)
        plans = result.scalars().all()
        
        plans_data = []
        for plan in plans:
            # Count users for this plan
            user_count_result = await db.execute(
                select(func.count(AdminUser.id)).where(AdminUser.plan_id == plan.id)
            )
            user_count = user_count_result.scalar() or 0
            
            plan_data = {
                "id": plan.id,
                "name": plan.name,
                "code": plan.code,
                "price_per_month": plan.price_per_month,
                "is_active": plan.is_active,
                "total_users": user_count,
                "active_users": plan.active_users,
                "revenue_monthly": plan.revenue_monthly,
                "features": plan.features,
                "created_at": plan.created_at.isoformat() if plan.created_at else None
            }
            plans_data.append(plan_data)
        
        logger.info(f"✅ Listed {len(plans_data)} plans for admin {current_admin.email}")
        return {"plans": plans_data}
        
    except Exception as e:
        logger.error(f"❌ Error listing plans: {e}")
        raise HTTPException(status_code=500, detail="Failed to list plans")

# ==================== SUPPORT TICKETS - FIXED ====================

@router.get("/tickets")
async def list_support_tickets(
    db: AsyncSession = Depends(get_admin_db),
    current_admin=Depends(get_current_admin_user),
    status_filter: str = Query(None),
    priority_filter: str = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200)
):
    """List support tickets - FIXED"""
    try:
        query = select(AdminSupportTicket).join(
            AdminUser, AdminSupportTicket.user_id == AdminUser.id
        )
        
        # Apply filters
        if status_filter:
            query = query.where(AdminSupportTicket.status == status_filter)
        if priority_filter:
            query = query.where(AdminSupportTicket.priority == priority_filter)
        
        # Order by creation date (newest first) and paginate
        query = query.order_by(desc(AdminSupportTicket.created_at)).offset(skip).limit(limit)
        
        result = await db.execute(query)
        tickets = result.scalars().all()
        
        tickets_data = []
        for ticket in tickets:
            ticket_data = {
                "id": ticket.id,
                "title": ticket.title,
                "description": ticket.description,
                "status": ticket.status,
                "priority": ticket.priority,
                "category": ticket.category,
                "user_email": ticket.user.email if ticket.user else "Unknown",
                "created_at": ticket.created_at.isoformat() if ticket.created_at else None,
                "resolved_at": ticket.resolved_at.isoformat() if ticket.resolved_at else None
            }
            tickets_data.append(ticket_data)
        
        logger.info(f"✅ Listed {len(tickets_data)} support tickets")
        return {
            "tickets": tickets_data,
            "total": len(tickets_data),
            "skip": skip,
            "limit": limit
        }
        
    except Exception as e:
        logger.error(f"❌ Error listing support tickets: {e}")
        raise HTTPException(status_code=500, detail="Failed to list support tickets")

# ==================== SYSTEM STATISTICS - FIXED ====================

@router.get("/stats")
async def get_admin_statistics(
    db: AsyncSession = Depends(get_admin_db),
    current_admin=Depends(get_current_admin_user)
):
    """Get comprehensive admin statistics - FIXED"""
    try:
        # Get dashboard stats
        stats = await AdminDatabaseService.get_admin_dashboard_stats()
        
        # Add plan distribution
        plan_stats_query = select(
            AdminPlan.name,
            AdminPlan.code,
            func.count(AdminUser.id).label('user_count')
        ).select_from(
            AdminPlan
        ).outerjoin(
            AdminUser, AdminPlan.id == AdminUser.plan_id
        ).group_by(AdminPlan.id, AdminPlan.name, AdminPlan.code)
        
        plan_result = await db.execute(plan_stats_query)
        plan_distribution = [
            {
                "plan_name": row.name,
                "plan_code": row.code,
                "user_count": row.user_count
            }
            for row in plan_result.fetchall()
        ]
        
        # System health
        system_health = {
            'cpu_percent': psutil.cpu_percent(interval=1),
            'memory_percent': psutil.virtual_memory().percent,
            'disk_percent': psutil.disk_usage('/').percent,
            'uptime_hours': (datetime.utcnow() - datetime.fromtimestamp(psutil.boot_time())).total_seconds() / 3600
        }
        
        comprehensive_stats = {
            **stats,
            'plan_distribution': plan_distribution,
            'system_health': system_health,
            'database': 'admin_database_active',
            'last_sync': datetime.utcnow().isoformat()
        }
        
        logger.info(f"✅ Generated comprehensive stats for admin {current_admin.email}")
        return comprehensive_stats
        
    except Exception as e:
        logger.error(f"❌ Error getting admin statistics: {e}")
        raise HTTPException(status_code=500, detail="Failed to get admin statistics")

# ==================== SECURITY MONITORING ====================

@router.get("/security/events")
async def get_security_events(
    db: AsyncSession = Depends(get_admin_db),
    current_admin=Depends(get_current_admin_user),
    severity: str = Query(None),
    limit: int = Query(100, ge=1, le=500)
):
    """Get security events - NEW FUNCTIONALITY"""
    try:
        query = select(AdminSecurityEvent)
        
        if severity:
            query = query.where(AdminSecurityEvent.severity == severity)
        
        query = query.order_by(desc(AdminSecurityEvent.created_at)).limit(limit)
        
        result = await db.execute(query)
        events = result.scalars().all()
        
        events_data = [
            {
                "id": event.id,
                "event_type": event.event_type,
                "severity": event.severity,
                "description": event.description,
                "ip_address": event.ip_address,
                "user_id": event.user_id,
                "resolved": event.resolved,
                "created_at": event.created_at.isoformat() if event.created_at else None
            }
            for event in events
        ]
        
        return {"events": events_data, "total": len(events_data)}
        
    except Exception as e:
        logger.error(f"❌ Error getting security events: {e}")
        raise HTTPException(status_code=500, detail="Failed to get security events")

# ==================== SYSTEM MAINTENANCE ====================

@router.post("/sync")
async def sync_from_main_database(
    db: AsyncSession = Depends(get_admin_db),
    current_admin=Depends(get_current_admin_user)
):
    """Sync data from main database - ADMIN UTILITY"""
    try:
        logger.info(f"🔄 Starting database sync requested by {current_admin.email}")
        
        # Sync all users
        synced_count = await AdminDatabaseService.sync_all_users()
        
        # Update system stats
        await AdminDatabaseService.update_system_stats()
        
        return {
            "message": "Database sync completed successfully",
            "synced_users": synced_count,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"❌ Database sync failed: {e}")
        raise HTTPException(status_code=500, detail=f"Sync failed: {str(e)}")

# ==================== HEALTH CHECK ====================

@router.get("/health")
async def admin_health_check(
    db: AsyncSession = Depends(get_admin_db)
):
    """Admin database health check"""
    try:
        # Test admin database
        await db.execute(select(func.count(AdminUser.id)))
        
        return {
            "status": "healthy",
            "database": "admin_database_connected",
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        return {
            "status": "unhealthy", 
            "error": str(e),
            "database": "admin_database_error",
            "timestamp": datetime.utcnow().isoformat()
        }

# Export router
__all__ = ["router"]