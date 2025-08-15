"""
Admin Database Management Router
Endpoints for managing the separate admin database
"""
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
import os
from datetime import datetime

from ..config.admin_database_config import get_admin_db, backup_admin_database, restore_admin_database, get_admin_db_info
from ..models.admin_models import AdminBackup, AdminAuditLog
from ..utils.admin_utils import log_admin_action, get_admin_dashboard_summary, format_file_size
from ..core.auth_utils import get_current_admin_user

router = APIRouter(prefix="/database", tags=["Admin Database Management"])

@router.get("/info")
async def get_database_info(
    admin_db: Session = Depends(get_admin_db),
    current_admin = Depends(get_current_admin_user)
):
    """
    Get admin database information
    """
    try:
        db_info = get_admin_db_info()
        
        # Add table counts
        from ..models.admin_models import (
            AdminUser, AdminNews, AdminTrialConfig, 
            AdminApiKey, AdminChatSession, AdminAuditLog
        )
        
        table_counts = {
            "admin_users": admin_db.query(AdminUser).count(),
            "news_items": admin_db.query(AdminNews).count(),
            "trial_configs": admin_db.query(AdminTrialConfig).count(),
            "api_keys": admin_db.query(AdminApiKey).count(),
            "chat_sessions": admin_db.query(AdminChatSession).count(),
            "audit_logs": admin_db.query(AdminAuditLog).count(),
        }
        
        db_info["table_counts"] = table_counts
        db_info["total_records"] = sum(table_counts.values())
        
        return {
            "status": "success",
            "database_info": db_info
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get database info: {str(e)}")

@router.post("/backup")
async def create_database_backup(
    background_tasks: BackgroundTasks,
    backup_name: Optional[str] = None,
    admin_db: Session = Depends(get_admin_db),
    current_admin = Depends(get_current_admin_user)
):
    """
    Create database backup
    """
    try:
        # Create backup
        backup_path = backup_admin_database(backup_name)
        
        if backup_path:
            # Get backup file size
            file_size_mb = 0
            if os.path.exists(backup_path):
                file_size_mb = os.path.getsize(backup_path) / (1024 * 1024)
            
            # Record backup in database
            backup_record = AdminBackup(
                backup_type="database",
                file_path=backup_path,
                file_size_mb=file_size_mb,
                status="completed",
                created_by=current_admin.id
            )
            admin_db.add(backup_record)
            admin_db.commit()
            
            # Log action
            log_admin_action(
                admin_db, 
                current_admin.id, 
                "database_backup_created",
                "backup",
                str(backup_record.id)
            )
            
            return {
                "status": "success",
                "message": "Database backup created successfully",
                "backup_path": backup_path,
                "file_size": format_file_size(int(file_size_mb * 1024 * 1024)),
                "backup_id": backup_record.id
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to create backup")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create backup: {str(e)}")

@router.get("/backups")
async def list_database_backups(
    admin_db: Session = Depends(get_admin_db),
    current_admin = Depends(get_current_admin_user)
):
    """
    List all database backups
    """
    try:
        backups = admin_db.query(AdminBackup).order_by(AdminBackup.created_at.desc()).limit(20).all()
        
        backup_list = []
        for backup in backups:
            backup_info = {
                "id": backup.id,
                "backup_type": backup.backup_type,
                "file_path": backup.file_path,
                "file_size_mb": backup.file_size_mb,
                "status": backup.status,
                "created_at": backup.created_at.isoformat(),
                "file_exists": os.path.exists(backup.file_path) if backup.file_path else False
            }
            backup_list.append(backup_info)
        
        return {
            "status": "success",
            "backups": backup_list,
            "total_backups": len(backup_list)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list backups: {str(e)}")

@router.post("/restore/{backup_id}")
async def restore_database_from_backup(
    backup_id: int,
    admin_db: Session = Depends(get_admin_db),
    current_admin = Depends(get_current_admin_user)
):
    """
    Restore database from backup
    """
    try:
        # Get backup record
        backup = admin_db.query(AdminBackup).filter(AdminBackup.id == backup_id).first()
        if not backup:
            raise HTTPException(status_code=404, detail="Backup not found")
        
        # Check if backup file exists
        if not os.path.exists(backup.file_path):
            raise HTTPException(status_code=404, detail="Backup file not found")
        
        # Restore database
        success = restore_admin_database(backup.file_path)
        
        if success:
            # Log action (in the restored database)
            log_admin_action(
                admin_db, 
                current_admin.id, 
                "database_restored",
                "backup",
                str(backup_id)
            )
            
            return {
                "status": "success",
                "message": "Database restored successfully",
                "backup_file": backup.file_path,
                "restored_at": datetime.now().isoformat()
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to restore database")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to restore database: {str(e)}")

@router.delete("/backups/{backup_id}")
async def delete_backup(
    backup_id: int,
    admin_db: Session = Depends(get_admin_db),
    current_admin = Depends(get_current_admin_user)
):
    """
    Delete a backup file and record
    """
    try:
        # Get backup record
        backup = admin_db.query(AdminBackup).filter(AdminBackup.id == backup_id).first()
        if not backup:
            raise HTTPException(status_code=404, detail="Backup not found")
        
        # Delete backup file if it exists
        if backup.file_path and os.path.exists(backup.file_path):
            os.remove(backup.file_path)
        
        # Delete backup record
        admin_db.delete(backup)
        admin_db.commit()
        
        # Log action
        log_admin_action(
            admin_db, 
            current_admin.id, 
            "backup_deleted",
            "backup",
            str(backup_id)
        )
        
        return {
            "status": "success",
            "message": "Backup deleted successfully"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete backup: {str(e)}")

@router.get("/stats")
async def get_database_stats(
    admin_db: Session = Depends(get_admin_db),
    current_admin = Depends(get_current_admin_user)
):
    """
    Get database statistics
    """
    try:
        # Get dashboard summary
        summary = get_admin_dashboard_summary(admin_db)
        
        # Get recent activity
        recent_logs = admin_db.query(AdminAuditLog).order_by(
            AdminAuditLog.created_at.desc()
        ).limit(10).all()
        
        recent_activity = []
        for log in recent_logs:
            activity = {
                "id": log.id,
                "action": log.action,
                "resource_type": log.resource_type,
                "user_id": log.user_id,
                "created_at": log.created_at.isoformat()
            }
            recent_activity.append(activity)
        
        return {
            "status": "success",
            "summary": summary,
            "recent_activity": recent_activity,
            "database_info": get_admin_db_info()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get database stats: {str(e)}")

@router.post("/optimize")
async def optimize_database(
    admin_db: Session = Depends(get_admin_db),
    current_admin = Depends(get_current_admin_user)
):
    """
    Optimize SQLite database (VACUUM)
    """
    try:
        # Execute VACUUM to optimize database
        admin_db.execute("VACUUM;")
        admin_db.commit()
        
        # Log action
        log_admin_action(
            admin_db, 
            current_admin.id, 
            "database_optimized",
            "database",
            "admin_database"
        )
        
        # Get updated database info
        db_info = get_admin_db_info()
        
        return {
            "status": "success",
            "message": "Database optimized successfully",
            "database_size_mb": db_info["size_mb"]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to optimize database: {str(e)}")

@router.get("/audit-logs")
async def get_audit_logs(
    limit: int = 50,
    offset: int = 0,
    action_filter: Optional[str] = None,
    admin_db: Session = Depends(get_admin_db),
    current_admin = Depends(get_current_admin_user)
):
    """
    Get audit logs with pagination
    """
    try:
        query = admin_db.query(AdminAuditLog)
        
        if action_filter:
            query = query.filter(AdminAuditLog.action.contains(action_filter))
        
        total_logs = query.count()
        logs = query.order_by(AdminAuditLog.created_at.desc()).offset(offset).limit(limit).all()
        
        audit_logs = []
        for log in logs:
            log_data = {
                "id": log.id,
                "user_id": log.user_id,
                "action": log.action,
                "resource_type": log.resource_type,
                "resource_id": log.resource_id,
                "ip_address": log.ip_address,
                "created_at": log.created_at.isoformat()
            }
            audit_logs.append(log_data)
        
        return {
            "status": "success",
            "audit_logs": audit_logs,
            "total_logs": total_logs,
            "limit": limit,
            "offset": offset
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get audit logs: {str(e)}")

@router.post("/cleanup")
async def cleanup_old_data(
    days_to_keep: int = 30,
    admin_db: Session = Depends(get_admin_db),
    current_admin = Depends(get_current_admin_user)
):
    """
    Clean up old data from admin database
    """
    try:
        from datetime import timedelta
        
        cutoff_date = datetime.now() - timedelta(days=days_to_keep)
        
        # Delete old audit logs
        old_logs = admin_db.query(AdminAuditLog).filter(
            AdminAuditLog.created_at < cutoff_date
        ).count()
        
        admin_db.query(AdminAuditLog).filter(
            AdminAuditLog.created_at < cutoff_date
        ).delete()
        
        # Delete inactive sessions
        from ..models.admin_models import AdminSession
        old_sessions = admin_db.query(AdminSession).filter(
            AdminSession.expires_at < datetime.now()
        ).count()
        
        admin_db.query(AdminSession).filter(
            AdminSession.expires_at < datetime.now()
        ).delete()
        
        admin_db.commit()
        
        # Log action
        log_admin_action(
            admin_db, 
            current_admin.id, 
            "database_cleanup",
            "database",
            f"removed_{old_logs}_logs_{old_sessions}_sessions"
        )
        
        return {
            "status": "success",
            "message": f"Cleanup completed. Removed {old_logs} old audit logs and {old_sessions} expired sessions",
            "logs_removed": old_logs,
            "sessions_removed": old_sessions
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to cleanup database: {str(e)}")