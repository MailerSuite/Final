"""
Admin Database Service - Handles synchronization between main DB and admin DB
Enables independent admin panel deployment with real-time data sync
"""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional

from sqlalchemy import select, func, and_, or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

# Main database imports
from core.database import get_db, async_session
from models.base import User, Campaign
from models.plan import Plan, UserPlan

# Admin database imports
from config.admin_database_config import get_admin_db, admin_async_session
from models.admin_models import (
    AdminUser, 
    AdminPlan, 
    AdminUserPlan, 
    AdminSystemStats,
    AdminSecurityEvent,
    AdminSupportTicket
)

logger = logging.getLogger(__name__)

class AdminDatabaseService:
    """Service for managing admin database operations and synchronization"""
    
    @staticmethod
    async def initialize_admin_database():
        """Initialize admin database tables"""
        try:
            from config.admin_database_config import admin_engine
            from models.admin_models import AdminBase
            
            async with admin_engine.begin() as conn:
                await conn.run_sync(AdminBase.metadata.create_all)
            
            logger.info("✅ Admin database tables created successfully")
            return True
        except Exception as e:
            logger.error(f"❌ Failed to initialize admin database: {e}")
            return False
    
    @staticmethod
    async def sync_user_from_main_db(main_user_id: str) -> Optional[AdminUser]:
        """Sync a single user from main DB to admin DB"""
        try:
            # Get user from main database
            async with async_session() as main_session:
                # Convert string to int for User.id lookup
                user_id_int = int(main_user_id) if isinstance(main_user_id, str) else main_user_id
                stmt = select(User).where(User.id == user_id_int)
                result = await main_session.execute(stmt)
                main_user = result.scalar_one_or_none()
                
                if not main_user:
                    logger.warning(f"User {main_user_id} not found in main database")
                    return None
                
                # Get user plan from main database
                plan_stmt = select(UserPlan).where(UserPlan.user_id == main_user_id)
                plan_result = await main_session.execute(plan_stmt)
                user_plan = plan_result.scalar_one_or_none()
            
            # Sync to admin database
            async with admin_async_session() as admin_session:
                # Check if user already exists
                existing_stmt = select(AdminUser).where(AdminUser.main_user_id == str(main_user_id))
                existing_result = await admin_session.execute(existing_stmt)
                admin_user = existing_result.scalar_one_or_none()
                
                if admin_user:
                    # Update existing user
                    admin_user.email = main_user.email
                    admin_user.username = getattr(main_user, 'username', None)
                    admin_user.is_active = main_user.is_active
                    admin_user.is_admin = getattr(main_user, 'is_admin', False)
                    admin_user.is_verified = getattr(main_user, 'is_verified', False)
                    admin_user.updated_at = datetime.utcnow()
                else:
                    # Create new admin user
                    admin_user = AdminUser(
                        main_user_id=str(main_user_id),
                        email=main_user.email,
                        username=getattr(main_user, 'username', None),
                        is_active=main_user.is_active,
                        is_admin=getattr(main_user, 'is_admin', False),
                        is_verified=getattr(main_user, 'is_verified', False),
                    )
                    admin_session.add(admin_user)
                
                # Handle plan assignment
                if user_plan:
                    await AdminDatabaseService._sync_user_plan(admin_session, admin_user, user_plan)
                
                await admin_session.commit()
                await admin_session.refresh(admin_user)
                
                logger.info(f"✅ Synced user {main_user.email} to admin database")
                return admin_user
                
        except Exception as e:
            logger.error(f"❌ Failed to sync user {main_user_id}: {e}")
            return None
    
    @staticmethod
    async def _sync_user_plan(admin_session: AsyncSession, admin_user: AdminUser, user_plan: UserPlan):
        """Sync user plan information"""
        try:
            # Ensure plan exists in admin database
            admin_plan = await AdminDatabaseService._ensure_admin_plan(admin_session, user_plan.plan_id)
            
            if admin_plan:
                # Check if user plan assignment exists
                existing_user_plan_stmt = select(AdminUserPlan).where(
                    and_(
                        AdminUserPlan.user_id == admin_user.id,
                        AdminUserPlan.plan_id == admin_plan.id
                    )
                )
                existing_user_plan = await admin_session.execute(existing_user_plan_stmt)
                admin_user_plan = existing_user_plan.scalar_one_or_none()
                
                if not admin_user_plan:
                    # Create new user plan assignment
                    admin_user_plan = AdminUserPlan(
                        user_id=admin_user.id,
                        plan_id=admin_plan.id,
                        is_active=user_plan.is_active,
                        starts_at=user_plan.assigned_at,
                        expires_at=user_plan.expires_at,
                        is_trial=getattr(user_plan, 'is_trial', False),
                        payment_status='active' if user_plan.is_active else 'inactive'
                    )
                    admin_session.add(admin_user_plan)
                
                # Update user's plan_id for direct access
                admin_user.plan_id = admin_plan.id
                
        except Exception as e:
            logger.error(f"Failed to sync user plan: {e}")
    
    @staticmethod
    async def _ensure_admin_plan(admin_session: AsyncSession, main_plan_id: int) -> Optional[AdminPlan]:
        """Ensure plan exists in admin database, create if missing"""
        try:
            # Check if admin plan exists
            stmt = select(AdminPlan).where(AdminPlan.main_plan_id == main_plan_id)
            result = await admin_session.execute(stmt)
            admin_plan = result.scalar_one_or_none()
            
            if admin_plan:
                return admin_plan
            
            # Get plan from main database
            async with async_session() as main_session:
                main_plan_stmt = select(Plan).where(Plan.id == main_plan_id)
                main_plan_result = await main_session.execute(main_plan_stmt)
                main_plan = main_plan_result.scalar_one_or_none()
                
                if not main_plan:
                    logger.warning(f"Plan {main_plan_id} not found in main database")
                    return None
            
            # Create admin plan
            admin_plan = AdminPlan(
                main_plan_id=main_plan_id,
                name=main_plan.name,
                code=main_plan.code,
                price_per_month=main_plan.price_per_month,
                is_active=main_plan.is_active,
                max_campaigns=getattr(main_plan, 'max_concurrent_campaigns', None),
                max_emails_daily=getattr(main_plan, 'max_ai_calls_daily', None),
                features=main_plan.features or []
            )
            admin_session.add(admin_plan)
            await admin_session.flush()
            
            logger.info(f"✅ Created admin plan: {main_plan.name}")
            return admin_plan
            
        except Exception as e:
            logger.error(f"Failed to ensure admin plan {main_plan_id}: {e}")
            return None
    
    @staticmethod
    async def sync_all_users():
        """Sync all users from main database to admin database"""
        try:
            async with async_session() as main_session:
                # Get all users from main database
                stmt = select(User.id)
                result = await main_session.execute(stmt)
                user_ids = [row[0] for row in result.fetchall()]
            
            logger.info(f"📥 Syncing {len(user_ids)} users to admin database...")
            
            synced_count = 0
            for user_id in user_ids:
                admin_user = await AdminDatabaseService.sync_user_from_main_db(str(user_id))
                if admin_user:
                    synced_count += 1
            
            logger.info(f"✅ Synced {synced_count}/{len(user_ids)} users successfully")
            return synced_count
            
        except Exception as e:
            logger.error(f"❌ Failed to sync all users: {e}")
            return 0
    
    @staticmethod
    async def update_system_stats():
        """Update system statistics in admin database"""
        try:
            async with admin_async_session() as admin_session:
                # Calculate current stats
                now = datetime.utcnow()
                today = now.date()
                
                # User stats
                total_users_stmt = select(func.count(AdminUser.id))
                total_users_result = await admin_session.execute(total_users_stmt)
                total_users = total_users_result.scalar() or 0
                
                active_users_today_stmt = select(func.count(AdminUser.id)).where(
                    func.date(AdminUser.last_activity_at) == today
                )
                active_today_result = await admin_session.execute(active_users_today_stmt)
                active_users_today = active_today_result.scalar() or 0
                
                # Create or update stats record
                stats = AdminSystemStats(
                    total_users=total_users,
                    active_users_today=active_users_today,
                    active_users_week=total_users,  # Simplified for now
                    active_users_month=total_users,  # Simplified for now
                    snapshot_at=now
                )
                
                admin_session.add(stats)
                await admin_session.commit()
                
                logger.info(f"✅ Updated system stats: {total_users} total users, {active_users_today} active today")
                return stats
                
        except Exception as e:
            logger.error(f"❌ Failed to update system stats: {e}")
            return None
    
    @staticmethod
    async def get_admin_dashboard_stats() -> Dict:
        """Get comprehensive dashboard statistics"""
        try:
            async with admin_async_session() as admin_session:
                # User counts
                total_users_stmt = select(func.count(AdminUser.id))
                total_users = await admin_session.execute(total_users_stmt)
                
                active_users_stmt = select(func.count(AdminUser.id)).where(AdminUser.is_active == True)
                active_users = await admin_session.execute(active_users_stmt)
                
                # Recent activity
                today = datetime.utcnow().date()
                users_today_stmt = select(func.count(AdminUser.id)).where(
                    func.date(AdminUser.created_at) == today
                )
                users_today = await admin_session.execute(users_today_stmt)
                
                # Support tickets
                open_tickets_stmt = select(func.count(AdminSupportTicket.id)).where(
                    AdminSupportTicket.status.in_(['open', 'in_progress'])
                )
                open_tickets = await admin_session.execute(open_tickets_stmt)
                
                return {
                    'total_users': total_users.scalar() or 0,
                    'active_users': active_users.scalar() or 0,
                    'users_created_today': users_today.scalar() or 0,
                    'open_support_tickets': open_tickets.scalar() or 0,
                    'last_updated': datetime.utcnow().isoformat()
                }
                
        except Exception as e:
            logger.error(f"❌ Failed to get dashboard stats: {e}")
            return {
                'total_users': 0,
                'active_users': 0, 
                'users_created_today': 0,
                'open_support_tickets': 0,
                'last_updated': datetime.utcnow().isoformat(),
                'error': str(e)
            }

# Export service
__all__ = ["AdminDatabaseService"]