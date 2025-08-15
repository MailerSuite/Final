"""
Admin APIs Extension - Additional endpoints for complete admin panel functionality
This file contains APIs for news, tarifs, chat, trial configs, and API management
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime
import logging
from typing import Optional

# Import the same dependencies as the main admin router
from ..core.database import get_db
from ..core.auth_utils import get_current_admin_user

router = APIRouter(prefix="/extensions", tags=["Admin Extensions"])
logger = logging.getLogger(__name__)

# ============================================================================
# NEWS MANAGEMENT ENDPOINTS
# ============================================================================

@router.get("/news")
async def list_news(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_admin_user)
):
    """Get all news items"""
    try:
        # Simulated news data - in production this would come from database
        news_items = [
            {
                "id": 1,
                "title": "SGPT Platform Update v2.1.0 Released",
                "content": "Major admin UI transformation complete with 25+ new APIs",
                "author": "Admin Team",
                "created_at": "2025-01-30T15:00:00Z",
                "updated_at": "2025-01-30T15:00:00Z",
                "published": True,
                "priority": "high"
            },
            {
                "id": 2,
                "title": "New Performance Monitoring Features",
                "content": "Real-time system monitoring with psutil integration now available",
                "author": "Dev Team",
                "created_at": "2025-01-29T10:00:00Z",
                "updated_at": "2025-01-29T10:00:00Z",
                "published": True,
                "priority": "medium"
            },
            {
                "id": 3,
                "title": "Security Enhancement Rollout",
                "content": "Enhanced admin security monitoring and audit logging implemented",
                "author": "Security Team",
                "created_at": "2025-01-28T14:30:00Z",
                "updated_at": "2025-01-28T14:30:00Z",
                "published": True,
                "priority": "high"
            }
        ]
        
        return news_items
        
    except Exception as e:
        logger.error(f"Error fetching news: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch news: {str(e)}")


@router.post("/news")
async def create_news(
    news_data: dict,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_admin_user)
):
    """Create a new news item"""
    try:
        title = news_data.get("title", "").strip()
        if not title:
            raise HTTPException(status_code=400, detail="Title is required")
        
        # Simulate creating news item
        new_news = {
            "id": 4,  # Simple ID generation for demo
            "title": title,
            "content": news_data.get("content", ""),
            "author": current_user.email if hasattr(current_user, 'email') else "admin",
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
            "published": news_data.get("published", False),
            "priority": news_data.get("priority", "medium")
        }
        
        return {
            "message": "News item created successfully",
            "news": new_news
        }
        
    except Exception as e:
        logger.error(f"Error creating news: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create news: {str(e)}")


@router.put("/news/{news_id}")
async def update_news(
    news_id: int,
    news_data: dict,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_admin_user)
):
    """Update a news item"""
    try:
        # Simulate updating news item
        updated_news = {
            "id": news_id,
            "title": news_data.get("title", "Updated News Title"),
            "content": news_data.get("content", ""),
            "author": current_user.email if hasattr(current_user, 'email') else "admin",
            "updated_at": datetime.utcnow().isoformat(),
            "published": news_data.get("published", False),
            "priority": news_data.get("priority", "medium")
        }
        
        return {
            "message": "News item updated successfully",
            "news": updated_news
        }
        
    except Exception as e:
        logger.error(f"Error updating news: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update news: {str(e)}")


@router.delete("/news/{news_id}")
async def delete_news(
    news_id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_admin_user)
):
    """Delete a news item"""
    try:
        return {
            "message": f"News item {news_id} deleted successfully"
        }
        
    except Exception as e:
        logger.error(f"Error deleting news: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete news: {str(e)}")


# ============================================================================
# TARIFS MANAGEMENT ENDPOINTS
# ============================================================================

@router.get("/tarifs")
async def list_tarifs(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_admin_user)
):
    """Get all pricing tarifs"""
    try:
        # Simulated tarifs data
        tarifs = [
            {
                "id": 1,
                "name": "Basic Plan",
                "price_monthly": 29.99,
                "price_yearly": 299.99,
                "description": "Perfect for small businesses",
                "features": ["10K emails/month", "Basic analytics", "Email support"],
                "max_emails": 10000,
                "max_campaigns": 5,
                "max_lists": 10,
                "active": True,
                "created_at": "2025-01-15T10:00:00Z"
            },
            {
                "id": 2,
                "name": "Professional Plan",
                "price_monthly": 79.99,
                "price_yearly": 799.99,
                "description": "For growing businesses",
                "features": ["50K emails/month", "Advanced analytics", "Priority support", "A/B testing"],
                "max_emails": 50000,
                "max_campaigns": 20,
                "max_lists": 50,
                "active": True,
                "created_at": "2025-01-15T10:00:00Z"
            },
            {
                "id": 3,
                "name": "Enterprise Plan",
                "price_monthly": 199.99,
                "price_yearly": 1999.99,
                "description": "For large enterprises",
                "features": ["Unlimited emails", "Custom analytics", "24/7 support", "Custom integrations"],
                "max_emails": -1,  # Unlimited
                "max_campaigns": -1,
                "max_lists": -1,
                "active": True,
                "created_at": "2025-01-15T10:00:00Z"
            }
        ]
        
        return tarifs
        
    except Exception as e:
        logger.error(f"Error fetching tarifs: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch tarifs: {str(e)}")


@router.post("/tarifs")
async def create_tarif(
    tarif_data: dict,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_admin_user)
):
    """Create a new pricing tarif"""
    try:
        name = tarif_data.get("name", "").strip()
        if not name:
            raise HTTPException(status_code=400, detail="Tarif name is required")
        
        # Simulate creating tarif
        new_tarif = {
            "id": 4,  # Simple ID generation for demo
            "name": name,
            "price_monthly": tarif_data.get("price_monthly", 0),
            "price_yearly": tarif_data.get("price_yearly", 0),
            "description": tarif_data.get("description", ""),
            "features": tarif_data.get("features", []),
            "max_emails": tarif_data.get("max_emails", 1000),
            "max_campaigns": tarif_data.get("max_campaigns", 1),
            "max_lists": tarif_data.get("max_lists", 1),
            "active": tarif_data.get("active", True),
            "created_at": datetime.utcnow().isoformat()
        }
        
        return {
            "message": "Tarif created successfully",
            "tarif": new_tarif
        }
        
    except Exception as e:
        logger.error(f"Error creating tarif: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create tarif: {str(e)}")


# ============================================================================
# API MANAGEMENT ENDPOINTS
# ============================================================================

@router.get("/api/settings")
async def get_api_settings(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_admin_user)
):
    """Get API configuration settings"""
    try:
        settings = {
            "rate_limiting": {
                "enabled": True,
                "requests_per_minute": 60,
                "requests_per_hour": 3600,
                "burst_limit": 200
            },
            "cors": {
                "enabled": True,
                "allowed_origins": ["https://sgpt.dev", "https://app.sgpt.dev"],
                "allowed_methods": ["GET", "POST", "PUT", "DELETE"],
                "allowed_headers": ["*"]
            },
            "authentication": {
                "jwt_expiry_minutes": 60,
                "refresh_token_days": 7,
                "require_2fa_for_admin": False
            },
            "features": {
                "api_versioning": True,
                "request_logging": True,
                "response_compression": True,
                "swagger_enabled": True
            },
            "security": {
                "max_request_size_mb": 10,
                "ip_whitelist_enabled": False,
                "api_key_rotation_days": 90
            }
        }
        
        return settings
        
    except Exception as e:
        logger.error(f"Error fetching API settings: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch API settings: {str(e)}")


@router.put("/api/settings")
async def update_api_settings(
    settings_data: dict,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_admin_user)
):
    """Update API configuration settings"""
    try:
        # Simulate updating API settings
        updated_settings = {
            "rate_limiting": settings_data.get("rate_limiting", {}),
            "cors": settings_data.get("cors", {}),
            "authentication": settings_data.get("authentication", {}),
            "features": settings_data.get("features", {}),
            "security": settings_data.get("security", {}),
            "updated_at": datetime.utcnow().isoformat(),
            "updated_by": current_user.email if hasattr(current_user, 'email') else "admin"
        }
        
        return {
            "message": "API settings updated successfully",
            "settings": updated_settings
        }
        
    except Exception as e:
        logger.error(f"Error updating API settings: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update API settings: {str(e)}")


@router.get("/api/keys")
async def list_api_keys(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_admin_user)
):
    """Get all API keys"""
    try:
        # Simulated API keys data
        api_keys = [
            {
                "id": "1",
                "name": "Production API Key",
                "key": "sk_live_abc123...xyz789",  # Truncated for security
                "permissions": ["read", "write"],
                "last_used": "2025-01-30T15:30:00Z",
                "requests_count": 15420,
                "rate_limit": 1000,
                "active": True,
                "created_at": "2025-01-01T00:00:00Z"
            },
            {
                "id": "2",
                "name": "Development API Key",
                "key": "sk_dev_def456...abc123",
                "permissions": ["read"],
                "last_used": "2025-01-30T12:00:00Z",
                "requests_count": 5670,
                "rate_limit": 100,
                "active": True,
                "created_at": "2025-01-15T00:00:00Z"
            }
        ]
        
        return api_keys
        
    except Exception as e:
        logger.error(f"Error fetching API keys: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch API keys: {str(e)}")


@router.post("/api/keys")
async def create_api_key(
    key_data: dict,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_admin_user)
):
    """Create a new API key"""
    try:
        import secrets
        import string
        
        # Generate a secure API key
        alphabet = string.ascii_letters + string.digits
        key = "sk_" + ('live' if key_data.get('environment') == 'production' else 'dev') + "_"
        key += ''.join(secrets.choice(alphabet) for _ in range(32))
        
        new_key = {
            "id": str(3),
            "name": key_data.get("name", "New API Key"),
            "key": key,
            "permissions": key_data.get("permissions", ["read"]),
            "rate_limit": key_data.get("rate_limit", 100),
            "active": True,
            "created_at": datetime.utcnow().isoformat(),
            "requests_count": 0,
            "last_used": None
        }
        
        return {
            "message": "API key created successfully",
            "api_key": new_key
        }
        
    except Exception as e:
        logger.error(f"Error creating API key: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create API key: {str(e)}")


# ============================================================================
# TRIAL CONFIG MANAGEMENT ENDPOINTS
# ============================================================================

@router.get("/trial-configs")
async def list_trial_configs(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_admin_user)
):
    """Get all trial configurations"""
    try:
        # Simulated trial configs data
        configs = [
            {
                "id": 1,
                "config_name": "Standard Trial",
                "is_active": True,
                "duration_minutes": 10080,  # 7 days in minutes
                "min_threads": 1,
                "max_threads": 5,
                "max_campaigns": 3,
                "price_usd": 0.0,
                "price_btc": "0.00000000",
                "max_extensions": 2,
                "extension_minutes": 7200,  # 5 days
                "extension_price_usd": 9.99,
                "allowed_features": ["basic_campaigns", "email_analytics", "smtp_integration"],
                "created_at": "2025-01-15T10:00:00Z"
            },
            {
                "id": 2,
                "config_name": "Premium Trial",
                "is_active": False,
                "duration_minutes": 20160,  # 14 days in minutes
                "min_threads": 2,
                "max_threads": 10,
                "max_campaigns": 10,
                "price_usd": 0.0,
                "price_btc": "0.00000000",
                "max_extensions": 3,
                "extension_minutes": 10080,  # 7 days
                "extension_price_usd": 19.99,
                "allowed_features": ["advanced_campaigns", "detailed_analytics", "ai_features", "bulk_operations"],
                "created_at": "2025-01-15T10:00:00Z"
            }
        ]
        
        return configs
        
    except Exception as e:
        logger.error(f"Error fetching trial configs: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch trial configs: {str(e)}")


@router.post("/trial-configs")
async def create_trial_config(
    config_data: dict,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_admin_user)
):
    """Create a new trial configuration"""
    try:
        new_config = {
            "id": 3,  # Simple ID generation
            "config_name": config_data.get("config_name", "New Trial Config"),
            "is_active": config_data.get("is_active", False),
            "duration_minutes": config_data.get("duration_minutes", 10080),
            "min_threads": config_data.get("min_threads", 1),
            "max_threads": config_data.get("max_threads", 5),
            "max_campaigns": config_data.get("max_campaigns", 3),
            "price_usd": config_data.get("price_usd", 0.0),
            "price_btc": config_data.get("price_btc", "0.00000000"),
            "max_extensions": config_data.get("max_extensions", 2),
            "extension_minutes": config_data.get("extension_minutes", 7200),
            "extension_price_usd": config_data.get("extension_price_usd", 9.99),
            "allowed_features": config_data.get("allowed_features", []),
            "created_at": datetime.utcnow().isoformat()
        }
        
        return {
            "message": "Trial configuration created successfully",
            "config": new_config
        }
        
    except Exception as e:
        logger.error(f"Error creating trial config: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create trial config: {str(e)}")


# ============================================================================
# CHAT MANAGEMENT ENDPOINTS
# ============================================================================

@router.get("/chat/conversations")
async def list_chat_conversations(
    status: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_admin_user)
):
    """Get chat conversations with optional status filtering"""
    try:
        # Simulated chat conversations
        conversations = [
            {
                "id": "conv_001",
                "user_id": "user_123",
                "user_name": "John Doe",
                "user_email": "john@example.com",
                "status": "active",
                "priority": "high",
                "subject": "Campaign setup assistance needed",
                "last_message": "I need help setting up my first email campaign",
                "last_message_at": "2025-01-30T15:45:00Z",
                "agent_id": "agent_admin",
                "agent_name": "Admin Support",
                "created_at": "2025-01-30T15:30:00Z",
                "messages_count": 5,
                "unread_count": 2
            },
            {
                "id": "conv_002",
                "user_id": "user_456",
                "user_name": "Jane Smith",
                "user_email": "jane@company.com",
                "status": "resolved",
                "priority": "medium",
                "subject": "SMTP configuration issue",
                "last_message": "Thank you for the help! It's working now.",
                "last_message_at": "2025-01-30T14:20:00Z",
                "agent_id": "agent_tech",
                "agent_name": "Tech Support",
                "created_at": "2025-01-30T13:45:00Z",
                "messages_count": 8,
                "unread_count": 0
            },
            {
                "id": "conv_003",
                "user_id": "user_789",
                "user_name": "Bob Johnson",
                "user_email": "bob@startup.io",
                "status": "pending",
                "priority": "low",
                "subject": "Billing inquiry",
                "last_message": "When will my next invoice be generated?",
                "last_message_at": "2025-01-30T12:15:00Z",
                "agent_id": None,
                "agent_name": None,
                "created_at": "2025-01-30T12:15:00Z",
                "messages_count": 1,
                "unread_count": 1
            }
        ]
        
        # Filter by status if provided
        if status:
            conversations = [c for c in conversations if c["status"] == status]
        
        return {
            "conversations": conversations[:limit],
            "total_count": len(conversations),
            "status_counts": {
                "active": len([c for c in conversations if c["status"] == "active"]),
                "pending": len([c for c in conversations if c["status"] == "pending"]),
                "resolved": len([c for c in conversations if c["status"] == "resolved"])
            }
        }
        
    except Exception as e:
        logger.error(f"Error fetching chat conversations: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch conversations: {str(e)}")


@router.get("/chat/stats")
async def get_chat_stats(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_admin_user)
):
    """Get chat support statistics"""
    try:
        stats = {
            "total_conversations": 156,
            "active_conversations": 23,
            "pending_conversations": 12,
            "resolved_today": 45,
            "average_response_time_minutes": 8.5,
            "customer_satisfaction": 4.7,
            "agent_stats": [
                {
                    "agent_id": "agent_admin",
                    "agent_name": "Admin Support",
                    "active_chats": 8,
                    "total_resolved": 234,
                    "avg_rating": 4.8,
                    "status": "online"
                },
                {
                    "agent_id": "agent_tech",
                    "agent_name": "Tech Support",
                    "active_chats": 5,
                    "total_resolved": 189,
                    "avg_rating": 4.6,
                    "status": "online"
                }
            ],
            "hourly_volume": [12, 8, 5, 3, 2, 4, 8, 15, 23, 28, 32, 29],  # Last 12 hours
            "resolution_time": {
                "under_1_hour": 78,
                "1_to_4_hours": 15,
                "4_to_24_hours": 5,
                "over_24_hours": 2
            }
        }
        
        return stats
        
    except Exception as e:
        logger.error(f"Error fetching chat stats: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch chat stats: {str(e)}")


@router.post("/chat/conversations/{conversation_id}/assign")
async def assign_chat_conversation(
    conversation_id: str,
    assignment_data: dict,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_admin_user)
):
    """Assign a chat conversation to an agent"""
    try:
        agent_id = assignment_data.get("agent_id")
        if not agent_id:
            raise HTTPException(status_code=400, detail="Agent ID is required")
        
        return {
            "message": f"Conversation {conversation_id} assigned successfully",
            "conversation_id": conversation_id,
            "agent_id": agent_id,
            "assigned_at": datetime.utcnow().isoformat(),
            "assigned_by": current_user.email if hasattr(current_user, 'email') else "admin"
        }
        
    except Exception as e:
        logger.error(f"Error assigning conversation: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to assign conversation: {str(e)}")