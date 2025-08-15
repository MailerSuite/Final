"""
Admin Panel Utilities
Helper functions for admin database operations
"""
import hashlib
import secrets
import string
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import json
import os

def hash_password(password: str) -> str:
    """
    Hash password for admin users
    """
    salt = secrets.token_hex(16)
    password_hash = hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 100000)
    return f"{salt}:{password_hash.hex()}"

def verify_password(password: str, hashed: str) -> bool:
    """
    Verify password against hash
    """
    try:
        salt, password_hash = hashed.split(':')
        computed_hash = hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 100000)
        return password_hash == computed_hash.hex()
    except:
        return False

def generate_api_key() -> tuple[str, str]:
    """
    Generate API key and its hash
    Returns: (api_key, key_hash)
    """
    # Generate a secure API key
    api_key = 'sgpt_' + ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(32))
    
    # Hash the API key for storage
    key_hash = hashlib.sha256(api_key.encode()).hexdigest()
    
    return api_key, key_hash

def verify_api_key(api_key: str, stored_hash: str) -> bool:
    """
    Verify API key against stored hash
    """
    computed_hash = hashlib.sha256(api_key.encode()).hexdigest()
    return computed_hash == stored_hash

def generate_session_token() -> str:
    """
    Generate secure session token
    """
    return secrets.token_urlsafe(32)

def create_backup_filename(backup_type: str = "database") -> str:
    """
    Create standardized backup filename
    """
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    return f"admin_{backup_type}_backup_{timestamp}.db"

def export_admin_data_to_json(data: list, filename: str = None) -> str:
    """
    Export admin data to JSON file
    """
    if not filename:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"admin_export_{timestamp}.json"
    
    export_data = {
        "export_date": datetime.now().isoformat(),
        "export_type": "admin_data",
        "data": data
    }
    
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(export_data, f, indent=2, default=str)
    
    return filename

def sanitize_input(value: str, max_length: int = 255) -> str:
    """
    Sanitize user input for admin operations
    """
    if not value:
        return ""
    
    # Remove potentially dangerous characters
    sanitized = value.strip()
    sanitized = sanitized[:max_length]
    
    # Basic XSS prevention
    dangerous_chars = ['<', '>', '"', "'", '&', 'javascript:', 'data:']
    for char in dangerous_chars:
        sanitized = sanitized.replace(char, '')
    
    return sanitized

def validate_admin_permissions(user_permissions: list, required_permission: str) -> bool:
    """
    Validate if admin user has required permission
    """
    if not user_permissions:
        return False
    
    # Super admin has all permissions
    if "*" in user_permissions:
        return True
    
    # Check specific permission
    return required_permission in user_permissions

def get_client_ip(request) -> str:
    """
    Get client IP address from request
    """
    # Check for forwarded IP first
    forwarded_for = request.headers.get('X-Forwarded-For')
    if forwarded_for:
        return forwarded_for.split(',')[0].strip()
    
    # Check for real IP
    real_ip = request.headers.get('X-Real-IP')
    if real_ip:
        return real_ip
    
    # Fallback to direct client IP
    return getattr(request.client, 'host', 'unknown')

def log_admin_action(db, user_id: int, action: str, resource_type: str = None, 
                    resource_id: str = None, old_values: dict = None, 
                    new_values: dict = None, ip_address: str = None, 
                    user_agent: str = None):
    """
    Log admin action for audit trail
    """
    from ..models.admin_models import AdminAuditLog
    
    audit_log = AdminAuditLog(
        user_id=user_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        old_values=old_values,
        new_values=new_values,
        ip_address=ip_address,
        user_agent=user_agent
    )
    
    db.add(audit_log)
    db.commit()

def calculate_trial_expiry(start_date: datetime, duration_days: int) -> datetime:
    """
    Calculate trial expiry date
    """
    return start_date + timedelta(days=duration_days)

def format_file_size(size_bytes: int) -> str:
    """
    Format file size in human readable format
    """
    if size_bytes == 0:
        return "0 B"
    
    size_names = ["B", "KB", "MB", "GB", "TB"]
    i = 0
    while size_bytes >= 1024 and i < len(size_names) - 1:
        size_bytes /= 1024.0
        i += 1
    
    return f"{size_bytes:.2f} {size_names[i]}"

def generate_mock_stats_data():
    """
    Generate mock statistics data for development
    """
    import random
    from datetime import datetime, timedelta
    
    # Generate hourly data for last 24 hours
    hourly_data = []
    for i in range(24):
        hour = datetime.now() - timedelta(hours=i)
        hourly_data.append({
            "hour": hour.strftime("%H:00"),
            "requests": random.randint(50, 200),
            "avg_response_time": random.randint(100, 500),
            "error_rate": random.uniform(0.1, 5.0)
        })
    
    return {
        "overview": {
            "total_requests": random.randint(10000, 50000),
            "successful_requests": random.randint(9500, 49000),
            "failed_requests": random.randint(100, 1000),
            "avg_response_time": random.randint(150, 300),
            "uptime_percentage": random.uniform(99.0, 99.9),
            "active_users": random.randint(50, 200),
            "total_data_transferred": random.randint(1000000, 10000000)
        },
        "performance": {
            "cpu_avg": random.uniform(20, 70),
            "memory_avg": random.uniform(40, 80),
            "disk_usage": random.uniform(30, 60),
            "network_io": random.randint(1000000, 10000000),
            "database_connections": random.randint(10, 50),
            "cache_hit_rate": random.uniform(85, 98),
            "queue_length": random.randint(0, 10)
        },
        "hourly_breakdown": hourly_data
    }

def get_admin_dashboard_summary(db):
    """
    Get summary data for admin dashboard
    """
    from ..models.admin_models import AdminUser, AdminNews, AdminTrialConfig, AdminApiKey
    
    try:
        summary = {
            "total_admin_users": db.query(AdminUser).filter(AdminUser.is_active == True).count(),
            "total_news_items": db.query(AdminNews).count(),
            "published_news": db.query(AdminNews).filter(AdminNews.published == True).count(),
            "trial_configs": db.query(AdminTrialConfig).filter(AdminTrialConfig.is_active == True).count(),
            "active_api_keys": db.query(AdminApiKey).filter(AdminApiKey.is_active == True).count(),
            "last_update": datetime.now().isoformat()
        }
        return summary
    except Exception as e:
        return {
            "error": str(e),
            "total_admin_users": 0,
            "total_news_items": 0,
            "published_news": 0,
            "trial_configs": 0,
            "active_api_keys": 0,
            "last_update": datetime.now().isoformat()
        }