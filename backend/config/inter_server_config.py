"""
Inter-Server Communication Configuration
Settings and utilities for admin panel to main server communication
"""
import os
from typing import List, Dict, Optional
import logging

logger = logging.getLogger(__name__)

class InterServerConfig:
    """Configuration for inter-server communication"""
    
    # Main server settings
    MAIN_SERVER_URL = os.getenv("MAIN_SERVER_URL", "http://localhost:8000")
    ADMIN_SERVER_API_KEY = os.getenv("ADMIN_SERVER_API_KEY", "sgpt_admin_dev_key_change_in_production")
    
    # API settings
    API_TIMEOUT = int(os.getenv("API_TIMEOUT", "30"))
    MAX_RETRY_ATTEMPTS = int(os.getenv("MAX_RETRY_ATTEMPTS", "3"))
    
    # Cache settings
    CACHE_REFRESH_INTERVAL = int(os.getenv("CACHE_REFRESH_INTERVAL", "300"))
    USER_CACHE_TTL = int(os.getenv("USER_CACHE_TTL", "600"))
    METRICS_CACHE_TTL = int(os.getenv("METRICS_CACHE_TTL", "180"))
    SYSTEM_CACHE_TTL = int(os.getenv("SYSTEM_CACHE_TTL", "60"))
    
    # WebSocket settings
    ENABLE_ADMIN_WEBSOCKETS = os.getenv("ENABLE_ADMIN_WEBSOCKETS", "true").lower() == "true"
    WEBSOCKET_RECONNECT_INTERVAL = int(os.getenv("WEBSOCKET_RECONNECT_INTERVAL", "30"))
    WEBSOCKET_HEARTBEAT_INTERVAL = int(os.getenv("WEBSOCKET_HEARTBEAT_INTERVAL", "60"))
    
    # Security settings
    ALLOWED_ADMIN_IPS = os.getenv("ALLOWED_ADMIN_IPS", "127.0.0.1,::1").split(",")
    ADMIN_SESSION_TIMEOUT = int(os.getenv("ADMIN_SESSION_TIMEOUT", "480"))  # minutes
    
    # Monitoring settings
    ENABLE_COMMUNICATION_LOGS = os.getenv("ENABLE_COMMUNICATION_LOGS", "true").lower() == "true"
    ADMIN_LOG_LEVEL = os.getenv("ADMIN_LOG_LEVEL", "INFO")
    
    # Performance settings
    FALLBACK_MODE_ENABLED = os.getenv("FALLBACK_MODE_ENABLED", "true").lower() == "true"
    ENABLE_PERFORMANCE_MONITORING = os.getenv("ENABLE_PERFORMANCE_MONITORING", "true").lower() == "true"
    
    # Feature flags
    ENABLE_USER_MANAGEMENT = os.getenv("ENABLE_USER_MANAGEMENT", "true").lower() == "true"
    ENABLE_PLAN_MANAGEMENT = os.getenv("ENABLE_PLAN_MANAGEMENT", "true").lower() == "true"
    ENABLE_BULK_OPERATIONS = os.getenv("ENABLE_BULK_OPERATIONS", "true").lower() == "true"
    ENABLE_SYSTEM_MONITORING = os.getenv("ENABLE_SYSTEM_MONITORING", "true").lower() == "true"
    ENABLE_CACHE_MANAGEMENT = os.getenv("ENABLE_CACHE_MANAGEMENT", "true").lower() == "true"
    
    @classmethod
    def get_admin_endpoints(cls) -> Dict[str, str]:
        """Get admin access endpoints for main server"""
        base_url = cls.MAIN_SERVER_URL
        return {
            "users": f"{base_url}/api/v1/admin-access/users",
            "plans": f"{base_url}/api/v1/admin-access/plans",
            "metrics": f"{base_url}/api/v1/admin-access/metrics",
            "system": f"{base_url}/api/v1/admin-access/system",
            "health": f"{base_url}/api/v1/admin-access/system/health",
        }
    
    @classmethod
    def get_websocket_endpoints(cls) -> Dict[str, str]:
        """Get WebSocket endpoints for real-time communication"""
        if not cls.ENABLE_ADMIN_WEBSOCKETS:
            return {}
        
        base_url = cls.MAIN_SERVER_URL.replace("http://", "ws://").replace("https://", "wss://")
        return {
            "metrics": f"{base_url}/ws/admin-access/metrics",
            "notifications": f"{base_url}/ws/admin-access/notifications",
        }
    
    @classmethod
    def get_cache_ttl(cls, cache_type: str) -> int:
        """Get cache TTL for specific cache type"""
        ttl_map = {
            "users": cls.USER_CACHE_TTL,
            "metrics": cls.METRICS_CACHE_TTL,
            "system": cls.SYSTEM_CACHE_TTL,
        }
        return ttl_map.get(cache_type, cls.CACHE_REFRESH_INTERVAL)
    
    @classmethod
    def is_feature_enabled(cls, feature: str) -> bool:
        """Check if a specific feature is enabled"""
        feature_map = {
            "user_management": cls.ENABLE_USER_MANAGEMENT,
            "plan_management": cls.ENABLE_PLAN_MANAGEMENT,
            "bulk_operations": cls.ENABLE_BULK_OPERATIONS,
            "system_monitoring": cls.ENABLE_SYSTEM_MONITORING,
            "cache_management": cls.ENABLE_CACHE_MANAGEMENT,
        }
        return feature_map.get(feature, False)
    
    @classmethod
    def validate_configuration(cls) -> List[str]:
        """Validate configuration and return list of issues"""
        issues = []
        
        # Check required settings
        if not cls.MAIN_SERVER_URL:
            issues.append("MAIN_SERVER_URL is required")
        
        if not cls.ADMIN_SERVER_API_KEY or cls.ADMIN_SERVER_API_KEY == "sgpt_admin_dev_key_change_in_production":
            issues.append("ADMIN_SERVER_API_KEY should be changed from default value")
        
        # Check numeric settings
        try:
            if cls.API_TIMEOUT <= 0:
                issues.append("API_TIMEOUT must be positive")
        except (ValueError, TypeError):
            issues.append("API_TIMEOUT must be a valid number")
        
        try:
            if cls.MAX_RETRY_ATTEMPTS < 0:
                issues.append("MAX_RETRY_ATTEMPTS must be non-negative")
        except (ValueError, TypeError):
            issues.append("MAX_RETRY_ATTEMPTS must be a valid number")
        
        # Check URL format
        if not cls.MAIN_SERVER_URL.startswith(("http://", "https://")):
            issues.append("MAIN_SERVER_URL must start with http:// or https://")
        
        return issues
    
    @classmethod
    def get_configuration_summary(cls) -> Dict:
        """Get configuration summary for debugging"""
        return {
            "main_server": {
                "url": cls.MAIN_SERVER_URL,
                "api_key_set": bool(cls.ADMIN_SERVER_API_KEY),
                "timeout": cls.API_TIMEOUT,
                "max_retries": cls.MAX_RETRY_ATTEMPTS,
            },
            "cache": {
                "refresh_interval": cls.CACHE_REFRESH_INTERVAL,
                "user_ttl": cls.USER_CACHE_TTL,
                "metrics_ttl": cls.METRICS_CACHE_TTL,
                "system_ttl": cls.SYSTEM_CACHE_TTL,
            },
            "websockets": {
                "enabled": cls.ENABLE_ADMIN_WEBSOCKETS,
                "reconnect_interval": cls.WEBSOCKET_RECONNECT_INTERVAL,
                "heartbeat_interval": cls.WEBSOCKET_HEARTBEAT_INTERVAL,
            },
            "security": {
                "allowed_ips": cls.ALLOWED_ADMIN_IPS,
                "session_timeout": cls.ADMIN_SESSION_TIMEOUT,
            },
            "features": {
                "user_management": cls.ENABLE_USER_MANAGEMENT,
                "plan_management": cls.ENABLE_PLAN_MANAGEMENT,
                "bulk_operations": cls.ENABLE_BULK_OPERATIONS,
                "system_monitoring": cls.ENABLE_SYSTEM_MONITORING,
                "cache_management": cls.ENABLE_CACHE_MANAGEMENT,
            },
            "monitoring": {
                "communication_logs": cls.ENABLE_COMMUNICATION_LOGS,
                "log_level": cls.ADMIN_LOG_LEVEL,
                "performance_monitoring": cls.ENABLE_PERFORMANCE_MONITORING,
                "fallback_mode": cls.FALLBACK_MODE_ENABLED,
            }
        }

# Global configuration instance
inter_server_config = InterServerConfig()

# Validation on import
configuration_issues = inter_server_config.validate_configuration()
if configuration_issues:
    for issue in configuration_issues:
        logger.warning(f"Configuration issue: {issue}")

# Export commonly used values
MAIN_SERVER_URL = inter_server_config.MAIN_SERVER_URL
ADMIN_SERVER_API_KEY = inter_server_config.ADMIN_SERVER_API_KEY
API_TIMEOUT = inter_server_config.API_TIMEOUT
ENABLE_COMMUNICATION_LOGS = inter_server_config.ENABLE_COMMUNICATION_LOGS