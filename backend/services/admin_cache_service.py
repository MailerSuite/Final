"""
Admin Cache Service
Manages caching of data from main server in admin database
"""
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from sqlalchemy.orm import Session

from ..config.admin_database_config import AdminSessionLocal
from ..models.admin_models import AdminCachedMetrics, AdminCachedUsers
from .main_server_client import get_main_server_client

logger = logging.getLogger(__name__)

class AdminCacheService:
    """Service for managing cached data from main server"""
    
    def __init__(self):
        self.cache_ttl = {
            "user_list": 300,      # 5 minutes
            "user_metrics": 180,   # 3 minutes
            "system_metrics": 60,  # 1 minute
            "campaign_metrics": 300, # 5 minutes
            "email_metrics": 300,  # 5 minutes
            "plan_data": 1800,     # 30 minutes
        }
    
    async def get_cached_metrics(self, metric_type: str, force_refresh: bool = False) -> Optional[Dict]:
        """
        Get cached metrics, refresh if expired or force_refresh is True
        """
        admin_db = AdminSessionLocal()
        try:
            # Check if cached data exists and is valid
            cached_metric = admin_db.query(AdminCachedMetrics).filter(
                AdminCachedMetrics.metric_type == metric_type,
                AdminCachedMetrics.is_valid == True
            ).first()
            
            if cached_metric and not force_refresh:
                # Check if cache is still valid
                if datetime.utcnow() < cached_metric.expires_at:
                    logger.info(f"Using cached data for {metric_type}")
                    return json.loads(cached_metric.metric_data)
                else:
                    # Mark as invalid
                    cached_metric.is_valid = False
                    admin_db.commit()
            
            # Cache miss or expired - fetch from main server
            logger.info(f"Refreshing cache for {metric_type}")
            fresh_data = await self._fetch_from_main_server(metric_type)
            
            if fresh_data:
                # Update cache
                await self._update_cache(admin_db, metric_type, fresh_data)
                return fresh_data
            else:
                # If fresh data failed, try to return stale cache as fallback
                if cached_metric:
                    logger.warning(f"Using stale cache for {metric_type}")
                    return json.loads(cached_metric.metric_data)
                return None
                
        except Exception as e:
            logger.error(f"Error getting cached metrics {metric_type}: {e}")
            return None
        finally:
            admin_db.close()
    
    async def _fetch_from_main_server(self, metric_type: str) -> Optional[Dict]:
        """
        Fetch data from main server based on metric type
        """
        try:
            client = await get_main_server_client()
            
            if metric_type == "user_metrics":
                return await client.get_user_metrics()
            elif metric_type == "system_metrics":
                return await client.get_overview_metrics()
            elif metric_type == "campaign_metrics":
                return await client.get_campaign_metrics()
            elif metric_type == "email_metrics":
                return await client.get_email_metrics()
            elif metric_type == "system_health":
                return await client.get_system_health()
            elif metric_type == "system_stats":
                return await client.get_system_stats()
            elif metric_type == "plan_data":
                return await client.get_plans()
            else:
                logger.warning(f"Unknown metric type: {metric_type}")
                return None
                
        except Exception as e:
            logger.error(f"Failed to fetch {metric_type} from main server: {e}")
            return None
    
    async def _update_cache(self, admin_db: Session, metric_type: str, data: Dict):
        """
        Update cache entry in admin database
        """
        try:
            ttl = self.cache_ttl.get(metric_type, 300)
            expires_at = datetime.utcnow() + timedelta(seconds=ttl)
            
            # Delete old cache entries for this metric type
            admin_db.query(AdminCachedMetrics).filter(
                AdminCachedMetrics.metric_type == metric_type
            ).delete()
            
            # Create new cache entry
            cache_entry = AdminCachedMetrics(
                metric_type=metric_type,
                metric_data=json.dumps(data),
                expires_at=expires_at,
                is_valid=True
            )
            
            admin_db.add(cache_entry)
            admin_db.commit()
            
            logger.info(f"Updated cache for {metric_type}, expires at {expires_at}")
            
        except Exception as e:
            logger.error(f"Failed to update cache for {metric_type}: {e}")
            admin_db.rollback()
    
    async def refresh_user_cache(self, force: bool = False) -> bool:
        """
        Refresh user cache from main server
        """
        try:
            client = await get_main_server_client()
            
            # Get users from main server
            users_response = await client.get_users(limit=1000)  # Adjust limit as needed
            users = users_response.get("users", [])
            
            admin_db = AdminSessionLocal()
            try:
                if force:
                    # Clear existing cache
                    admin_db.query(AdminCachedUsers).delete()
                
                # Update user cache
                for user_data in users:
                    existing_user = admin_db.query(AdminCachedUsers).filter(
                        AdminCachedUsers.user_id == user_data["id"]
                    ).first()
                    
                    if existing_user:
                        # Update existing
                        existing_user.email = user_data.get("email")
                        existing_user.plan_id = user_data.get("plan_id")
                        existing_user.status = "active" if user_data.get("is_active") else "inactive"
                        existing_user.cached_at = datetime.utcnow()
                        existing_user.needs_sync = False
                    else:
                        # Create new
                        cached_user = AdminCachedUsers(
                            user_id=user_data["id"],
                            email=user_data.get("email"),
                            plan_id=user_data.get("plan_id"),
                            status="active" if user_data.get("is_active") else "inactive",
                            created_at=datetime.fromisoformat(user_data["created_at"]) if user_data.get("created_at") else None,
                            last_login=datetime.fromisoformat(user_data["last_login"]) if user_data.get("last_login") else None,
                            needs_sync=False
                        )
                        admin_db.add(cached_user)
                
                admin_db.commit()
                logger.info(f"Refreshed user cache with {len(users)} users")
                return True
                
            except Exception as e:
                logger.error(f"Failed to update user cache: {e}")
                admin_db.rollback()
                return False
            finally:
                admin_db.close()
                
        except Exception as e:
            logger.error(f"Failed to refresh user cache: {e}")
            return False
    
    async def get_cached_users(self, page: int = 1, limit: int = 50, search: str = None) -> Dict:
        """
        Get cached users with pagination and search
        """
        admin_db = AdminSessionLocal()
        try:
            query = admin_db.query(AdminCachedUsers)
            
            # Apply search filter
            if search:
                query = query.filter(AdminCachedUsers.email.ilike(f"%{search}%"))
            
            # Get total count
            total = query.count()
            
            # Apply pagination
            offset = (page - 1) * limit
            users = query.offset(offset).limit(limit).all()
            
            # Format response
            user_list = []
            for user in users:
                user_data = {
                    "id": user.user_id,
                    "email": user.email,
                    "plan_id": user.plan_id,
                    "status": user.status,
                    "created_at": user.created_at.isoformat() if user.created_at else None,
                    "last_login": user.last_login.isoformat() if user.last_login else None,
                    "cached_at": user.cached_at.isoformat(),
                    "needs_sync": user.needs_sync
                }
                user_list.append(user_data)
            
            return {
                "users": user_list,
                "pagination": {
                    "page": page,
                    "limit": limit,
                    "total": total,
                    "pages": (total + limit - 1) // limit
                },
                "cache_info": {
                    "last_refresh": max([u.cached_at for u in users]).isoformat() if users else None,
                    "needs_sync_count": admin_db.query(AdminCachedUsers).filter(AdminCachedUsers.needs_sync == True).count()
                }
            }
            
        except Exception as e:
            logger.error(f"Failed to get cached users: {e}")
            return {"users": [], "pagination": {"page": page, "limit": limit, "total": 0, "pages": 0}}
        finally:
            admin_db.close()
    
    async def invalidate_cache(self, metric_type: str = None):
        """
        Invalidate cache entries
        """
        admin_db = AdminSessionLocal()
        try:
            if metric_type:
                # Invalidate specific metric type
                admin_db.query(AdminCachedMetrics).filter(
                    AdminCachedMetrics.metric_type == metric_type
                ).update({"is_valid": False})
            else:
                # Invalidate all cache
                admin_db.query(AdminCachedMetrics).update({"is_valid": False})
            
            admin_db.commit()
            logger.info(f"Invalidated cache for {metric_type or 'all metrics'}")
            
        except Exception as e:
            logger.error(f"Failed to invalidate cache: {e}")
            admin_db.rollback()
        finally:
            admin_db.close()
    
    async def get_cache_status(self) -> Dict:
        """
        Get cache status and statistics
        """
        admin_db = AdminSessionLocal()
        try:
            # Get metrics cache status
            metrics_cache = admin_db.query(AdminCachedMetrics).all()
            
            cache_status = {}
            for cache_entry in metrics_cache:
                cache_status[cache_entry.metric_type] = {
                    "cached_at": cache_entry.cached_at.isoformat(),
                    "expires_at": cache_entry.expires_at.isoformat(),
                    "is_valid": cache_entry.is_valid,
                    "is_expired": datetime.utcnow() > cache_entry.expires_at
                }
            
            # Get user cache status
            user_cache_count = admin_db.query(AdminCachedUsers).count()
            needs_sync_count = admin_db.query(AdminCachedUsers).filter(AdminCachedUsers.needs_sync == True).count()
            
            return {
                "metrics_cache": cache_status,
                "user_cache": {
                    "total_users": user_cache_count,
                    "needs_sync": needs_sync_count,
                    "last_refresh": None  # Could add this to track
                },
                "cache_health": {
                    "total_entries": len(metrics_cache) + user_cache_count,
                    "valid_entries": len([c for c in metrics_cache if c.is_valid]) + (user_cache_count - needs_sync_count),
                    "expired_entries": len([c for c in metrics_cache if datetime.utcnow() > c.expires_at])
                }
            }
            
        except Exception as e:
            logger.error(f"Failed to get cache status: {e}")
            return {"error": str(e)}
        finally:
            admin_db.close()
    
    async def cleanup_expired_cache(self):
        """
        Clean up expired cache entries
        """
        admin_db = AdminSessionLocal()
        try:
            # Delete expired metrics cache
            deleted_metrics = admin_db.query(AdminCachedMetrics).filter(
                AdminCachedMetrics.expires_at < datetime.utcnow()
            ).delete()
            
            # Clean up old user cache (older than 24 hours)
            day_ago = datetime.utcnow() - timedelta(hours=24)
            deleted_users = admin_db.query(AdminCachedUsers).filter(
                AdminCachedUsers.cached_at < day_ago,
                AdminCachedUsers.needs_sync == False
            ).delete()
            
            admin_db.commit()
            
            logger.info(f"Cleaned up {deleted_metrics} expired metrics and {deleted_users} old user cache entries")
            
        except Exception as e:
            logger.error(f"Failed to cleanup cache: {e}")
            admin_db.rollback()
        finally:
            admin_db.close()

# Convenience functions for common operations
cache_service = AdminCacheService()

async def get_cached_system_metrics(force_refresh: bool = False) -> Dict:
    """Get cached system metrics"""
    return await cache_service.get_cached_metrics("system_metrics", force_refresh)

async def get_cached_user_metrics(force_refresh: bool = False) -> Dict:
    """Get cached user metrics"""
    return await cache_service.get_cached_metrics("user_metrics", force_refresh)

async def get_cached_users(page: int = 1, limit: int = 50, search: str = None) -> Dict:
    """Get cached users"""
    return await cache_service.get_cached_users(page, limit, search)

async def refresh_all_cache():
    """Refresh all cache data"""
    await cache_service.refresh_user_cache()
    await cache_service.get_cached_metrics("system_metrics", force_refresh=True)
    await cache_service.get_cached_metrics("user_metrics", force_refresh=True)