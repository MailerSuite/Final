"""
Main Server Client
Service for communicating with the main SGPT server from admin panel
"""
import asyncio
import aiohttp
import json
import os
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import logging

logger = logging.getLogger(__name__)

class MainServerClient:
    """Client for making API calls to the main SGPT server"""
    
    def __init__(self):
        self.base_url = os.getenv("MAIN_SERVER_URL", "http://localhost:8000")
        self.api_key = os.getenv("ADMIN_SERVER_API_KEY", "admin_default_key")
        self.timeout = int(os.getenv("API_TIMEOUT", "30"))
        self.max_retries = int(os.getenv("MAX_RETRY_ATTEMPTS", "3"))
        self.retry_delay = 1  # Initial retry delay in seconds
        
        # Session for connection pooling
        self.session = None
        
    async def __aenter__(self):
        """Async context manager entry"""
        self.session = aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=self.timeout),
            headers={"Authorization": f"Bearer {self.api_key}"}
        )
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        if self.session:
            await self.session.close()
    
    async def _make_request(self, method: str, endpoint: str, data: Dict = None, params: Dict = None) -> Dict:
        """
        Make HTTP request with retry logic and error handling
        """
        url = f"{self.base_url}/api/v1/admin-access{endpoint}"
        
        for attempt in range(self.max_retries):
            try:
                async with self.session.request(
                    method, 
                    url, 
                    json=data, 
                    params=params
                ) as response:
                    
                    # Log the request
                    await self._log_communication(
                        operation=f"{method} {endpoint}",
                        endpoint=url,
                        request_data=data,
                        status_code=response.status,
                        success=response.status < 400
                    )
                    
                    if response.status < 400:
                        result = await response.json()
                        return result
                    else:
                        error_text = await response.text()
                        raise aiohttp.ClientResponseError(
                            request_info=response.request_info,
                            history=response.history,
                            status=response.status,
                            message=error_text
                        )
                        
            except (aiohttp.ClientError, asyncio.TimeoutError) as e:
                logger.warning(f"Attempt {attempt + 1} failed for {method} {endpoint}: {e}")
                
                if attempt == self.max_retries - 1:
                    # Log final failure
                    await self._log_communication(
                        operation=f"{method} {endpoint}",
                        endpoint=url,
                        request_data=data,
                        status_code=0,
                        success=False,
                        error_message=str(e)
                    )
                    raise
                
                # Exponential backoff
                await asyncio.sleep(self.retry_delay * (2 ** attempt))
    
    async def _log_communication(self, operation: str, endpoint: str, request_data: Dict = None, 
                                response_data: Dict = None, status_code: int = 0, 
                                success: bool = False, error_message: str = None):
        """
        Log communication attempts for monitoring and debugging
        """
        try:
            # Import here to avoid circular imports
            from ..config.admin_database_config import AdminSessionLocal
            from ..models.admin_models import AdminCommunicationLog
            
            # Create log entry
            log_entry = AdminCommunicationLog(
                operation=operation,
                endpoint=endpoint,
                request_data=json.dumps(request_data) if request_data else None,
                response_data=json.dumps(response_data) if response_data else None,
                status_code=status_code,
                success=success,
                error_message=error_message,
                response_time_ms=0  # Would need to track timing
            )
            
            # Save to admin database
            admin_db = AdminSessionLocal()
            try:
                admin_db.add(log_entry)
                admin_db.commit()
            finally:
                admin_db.close()
                
        except Exception as e:
            logger.error(f"Failed to log communication: {e}")
    
    # User Management Methods
    async def get_users(self, page: int = 1, limit: int = 50, search: str = None) -> Dict:
        """Get users from main server with pagination"""
        params = {"page": page, "limit": limit}
        if search:
            params["search"] = search
        
        return await self._make_request("GET", "/users", params=params)
    
    async def get_user(self, user_id: str) -> Dict:
        """Get specific user details"""
        return await self._make_request("GET", f"/users/{user_id}")
    
    async def create_user(self, user_data: Dict) -> Dict:
        """Create new user account on main server"""
        return await self._make_request("POST", "/users", data=user_data)
    
    async def update_user_plan(self, user_id: str, plan_id: str) -> Dict:
        """Update user's plan"""
        data = {"plan_id": plan_id}
        return await self._make_request("PUT", f"/users/{user_id}/plan", data=data)
    
    async def update_user_status(self, user_id: str, status: str) -> Dict:
        """Update user's status (active/inactive/suspended)"""
        data = {"status": status}
        return await self._make_request("PUT", f"/users/{user_id}/status", data=data)
    
    async def delete_user(self, user_id: str) -> Dict:
        """Soft delete user account"""
        return await self._make_request("DELETE", f"/users/{user_id}")
    
    async def get_user_usage(self, user_id: str) -> Dict:
        """Get user usage statistics"""
        return await self._make_request("GET", f"/users/{user_id}/usage")
    
    # Plan Management Methods
    async def get_plans(self) -> Dict:
        """Get all available plans"""
        return await self._make_request("GET", "/plans")
    
    async def update_plan(self, plan_id: str, plan_data: Dict) -> Dict:
        """Update plan details"""
        return await self._make_request("PUT", f"/plans/{plan_id}", data=plan_data)
    
    # Metrics & Analytics Methods
    async def get_overview_metrics(self) -> Dict:
        """Get system overview metrics"""
        return await self._make_request("GET", "/metrics/overview")
    
    async def get_user_metrics(self, timeframe: str = "24h") -> Dict:
        """Get user metrics"""
        params = {"timeframe": timeframe}
        return await self._make_request("GET", "/metrics/users", params=params)
    
    async def get_campaign_metrics(self, timeframe: str = "24h") -> Dict:
        """Get campaign metrics"""
        params = {"timeframe": timeframe}
        return await self._make_request("GET", "/metrics/campaigns", params=params)
    
    async def get_email_metrics(self, timeframe: str = "24h") -> Dict:
        """Get email statistics"""
        params = {"timeframe": timeframe}
        return await self._make_request("GET", "/metrics/emails", params=params)
    
    # System Operations Methods
    async def get_system_health(self) -> Dict:
        """Get system health status"""
        return await self._make_request("GET", "/system/health")
    
    async def get_system_stats(self) -> Dict:
        """Get system statistics"""
        return await self._make_request("GET", "/system/stats")
    
    async def trigger_maintenance(self, maintenance_type: str) -> Dict:
        """Trigger maintenance tasks"""
        data = {"maintenance_type": maintenance_type}
        return await self._make_request("POST", "/system/maintenance", data=data)
    
    # Bulk Operations
    async def bulk_update_users(self, updates: List[Dict]) -> Dict:
        """Bulk update multiple users"""
        data = {"updates": updates}
        return await self._make_request("POST", "/users/bulk-update", data=data)
    
    async def export_user_data(self, filters: Dict = None) -> Dict:
        """Export user data with filters"""
        return await self._make_request("POST", "/users/export", data=filters or {})
    
    # Health Check
    async def ping(self) -> bool:
        """Simple health check ping"""
        try:
            result = await self._make_request("GET", "/health")
            return result.get("status") == "healthy"
        except:
            return False

class MainServerClientSingleton:
    """Singleton pattern for main server client"""
    _instance = None
    _client = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    async def get_client(self) -> MainServerClient:
        """Get or create client instance"""
        if self._client is None:
            self._client = MainServerClient()
            await self._client.__aenter__()
        return self._client
    
    async def close_client(self):
        """Close client connection"""
        if self._client:
            await self._client.__aexit__(None, None, None)
            self._client = None

# Convenience functions
async def get_main_server_client() -> MainServerClient:
    """Get main server client instance"""
    singleton = MainServerClientSingleton()
    return await singleton.get_client()

async def close_main_server_client():
    """Close main server client"""
    singleton = MainServerClientSingleton()
    await singleton.close_client()

# Dependency for FastAPI
async def get_main_client():
    """FastAPI dependency for main server client"""
    client = await get_main_server_client()
    try:
        yield client
    finally:
        # Don't close here as it's a singleton
        pass