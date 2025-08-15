"""
Standardized Response Handling System for SGPT API
Phase 2 Enhancement: Consistent success responses across all endpoints
"""

import time
from typing import Any, Dict, List, Optional, Union
from uuid import uuid4

from pydantic import BaseModel


# ============================================================================
# STANDARDIZED SUCCESS RESPONSE SCHEMAS
# ============================================================================

class StandardSuccessResponse(BaseModel):
    """Standardized success response format"""
    success: bool = True
    message: str
    data: Optional[Union[Dict[str, Any], List[Any], Any]] = None
    meta: Optional[Dict[str, Any]] = None
    timestamp: float
    request_id: str


class PaginatedResponse(BaseModel):
    """Standardized paginated response format"""
    success: bool = True
    message: str
    data: List[Any]
    pagination: Dict[str, Any]
    timestamp: float
    request_id: str


class CreatedResponse(BaseModel):
    """Standardized creation response format"""
    success: bool = True
    message: str
    data: Any
    resource_id: str
    timestamp: float
    request_id: str


class UpdatedResponse(BaseModel):
    """Standardized update response format"""
    success: bool = True
    message: str
    data: Any
    updated_fields: Optional[List[str]] = None
    timestamp: float
    request_id: str


class DeletedResponse(BaseModel):
    """Standardized deletion response format"""
    success: bool = True
    message: str
    resource_id: str
    timestamp: float
    request_id: str


# ============================================================================
# RESPONSE BUILDERS
# ============================================================================

class ResponseBuilder:
    """Centralized response building with consistent structure"""
    
    @staticmethod
    def success(
        message: str = "Operation completed successfully",
        data: Optional[Union[Dict[str, Any], List[Any], Any]] = None,
        meta: Optional[Dict[str, Any]] = None,
    ) -> StandardSuccessResponse:
        """Create a standardized success response"""
        return StandardSuccessResponse(
            message=message,
            data=data,
            meta=meta,
            timestamp=time.time(),
            request_id=f"req_{uuid4().hex[:12]}",
        )
    
    @staticmethod
    def created(
        message: str,
        data: Any,
        resource_id: str,
    ) -> CreatedResponse:
        """Create a standardized creation response"""
        return CreatedResponse(
            message=message,
            data=data,
            resource_id=resource_id,
            timestamp=time.time(),
            request_id=f"req_{uuid4().hex[:12]}",
        )
    
    @staticmethod
    def updated(
        message: str,
        data: Any,
        updated_fields: Optional[List[str]] = None,
    ) -> UpdatedResponse:
        """Create a standardized update response"""
        return UpdatedResponse(
            message=message,
            data=data,
            updated_fields=updated_fields,
            timestamp=time.time(),
            request_id=f"req_{uuid4().hex[:12]}",
        )
    
    @staticmethod
    def deleted(
        message: str,
        resource_id: str,
    ) -> DeletedResponse:
        """Create a standardized deletion response"""
        return DeletedResponse(
            message=message,
            resource_id=resource_id,
            timestamp=time.time(),
            request_id=f"req_{uuid4().hex[:12]}",
        )
    
    @staticmethod
    def paginated(
        message: str,
        data: List[Any],
        page: int,
        per_page: int,
        total: int,
        total_pages: Optional[int] = None,
    ) -> PaginatedResponse:
        """Create a standardized paginated response"""
        if total_pages is None:
            total_pages = (total + per_page - 1) // per_page
        
        pagination = {
            "page": page,
            "per_page": per_page,
            "total": total,
            "total_pages": total_pages,
            "has_next": page < total_pages,
            "has_prev": page > 1,
        }
        
        return PaginatedResponse(
            message=message,
            data=data,
            pagination=pagination,
            timestamp=time.time(),
            request_id=f"req_{uuid4().hex[:12]}",
        )


# ============================================================================
# COMMON RESPONSE MESSAGES
# ============================================================================

class ResponseMessages:
    """Standardized response messages"""
    
    # CRUD Operations
    CREATED = "{resource} created successfully"
    UPDATED = "{resource} updated successfully"
    DELETED = "{resource} deleted successfully"
    RETRIEVED = "{resource} retrieved successfully"
    LISTED = "{resource} list retrieved successfully"
    
    # Authentication
    LOGIN_SUCCESS = "Login successful"
    LOGOUT_SUCCESS = "Logout successful"
    REGISTER_SUCCESS = "Registration successful"
    PASSWORD_CHANGED = "Password changed successfully"
    PASSWORD_RESET = "Password reset successful"
    
    # Session Management
    SESSION_CREATED = "Session created successfully"
    SESSION_TERMINATED = "Session terminated successfully"
    ALL_SESSIONS_TERMINATED = "All sessions terminated successfully"
    
    # Campaign Operations
    CAMPAIGN_STARTED = "Campaign started successfully"
    CAMPAIGN_PAUSED = "Campaign paused successfully"
    CAMPAIGN_STOPPED = "Campaign stopped successfully"
    CAMPAIGN_CLONED = "Campaign cloned successfully"
    
    # Email Operations
    EMAIL_SENT = "Email sent successfully"
    EMAILS_SENT = "{count} emails sent successfully"
    EMAIL_VALIDATED = "Email validation completed"
    
    # System Operations
    HEALTH_CHECK = "System health check completed"
    STATUS_CHECK = "Status check completed"
    OPERATION_QUEUED = "Operation queued for processing"
    
    @staticmethod
    def format_message(template: str, **kwargs) -> str:
        """Format a message template with provided values"""
        return template.format(**kwargs)


# ============================================================================
# DECORATORS FOR STANDARDIZED RESPONSES
# ============================================================================

def standardize_response(message: Optional[str] = None):
    """Decorator to standardize successful responses"""
    def decorator(func):
        import functools
        
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            result = await func(*args, **kwargs)
            
            # If result is already a standardized response, return as-is
            if isinstance(result, (StandardSuccessResponse, PaginatedResponse, CreatedResponse, UpdatedResponse, DeletedResponse)):
                return result
            
            # If result is a dict with success=True, convert to standardized format
            if isinstance(result, dict) and result.get('success') is True:
                return ResponseBuilder.success(
                    message=result.get('message', message or "Operation completed successfully"),
                    data=result.get('data'),
                    meta=result.get('meta'),
                )
            
            # Default: wrap result in success response
            return ResponseBuilder.success(
                message=message or "Operation completed successfully",
                data=result,
            )
        
        return wrapper
    return decorator


# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

def extract_pagination_params(
    page: int = 1,
    per_page: int = 10,
    max_per_page: int = 100,
) -> tuple[int, int, int]:
    """Extract and validate pagination parameters"""
    # Ensure page is at least 1
    page = max(1, page)
    
    # Ensure per_page is within reasonable bounds
    per_page = max(1, min(per_page, max_per_page))
    
    # Calculate offset
    offset = (page - 1) * per_page
    
    return page, per_page, offset


def create_resource_response(
    action: str,
    resource_type: str,
    data: Any,
    resource_id: Optional[str] = None,
) -> Union[StandardSuccessResponse, CreatedResponse, UpdatedResponse, DeletedResponse]:
    """Create appropriate response based on action type"""
    resource_name = resource_type.title()
    
    if action == "create":
        return ResponseBuilder.created(
            message=ResponseMessages.format_message(ResponseMessages.CREATED, resource=resource_name),
            data=data,
            resource_id=resource_id or str(getattr(data, 'id', 'unknown')),
        )
    elif action == "update":
        return ResponseBuilder.updated(
            message=ResponseMessages.format_message(ResponseMessages.UPDATED, resource=resource_name),
            data=data,
        )
    elif action == "delete":
        return ResponseBuilder.deleted(
            message=ResponseMessages.format_message(ResponseMessages.DELETED, resource=resource_name),
            resource_id=resource_id or 'unknown',
        )
    else:  # retrieve/list
        return ResponseBuilder.success(
            message=ResponseMessages.format_message(ResponseMessages.RETRIEVED, resource=resource_name),
            data=data,
        )


# ============================================================================
# USAGE EXAMPLES
# ============================================================================

# Example usage in endpoints:
"""
@router.post("/campaigns", response_model=CreatedResponse)
async def create_campaign(campaign_data: CampaignCreate):
    campaign = await create_campaign_service(campaign_data)
    return ResponseBuilder.created(
        message="Campaign created successfully",
        data=campaign,
        resource_id=str(campaign.id)
    )

@router.get("/campaigns", response_model=PaginatedResponse)
async def list_campaigns(page: int = 1, per_page: int = 10):
    page, per_page, offset = extract_pagination_params(page, per_page)
    campaigns, total = await get_campaigns_service(offset, per_page)
    return ResponseBuilder.paginated(
        message="Campaigns retrieved successfully",
        data=campaigns,
        page=page,
        per_page=per_page,
        total=total
    )

@router.put("/campaigns/{id}", response_model=UpdatedResponse)
@standardize_response("Campaign updated successfully")
async def update_campaign(id: str, campaign_data: CampaignUpdate):
    return await update_campaign_service(id, campaign_data)
"""