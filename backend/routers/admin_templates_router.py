"""
Admin Templates Router
Manages email templates and template operations for administrators
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from pydantic import BaseModel, EmailStr, Field, validator
from typing import List, Optional, Dict, Any, Union
from datetime import datetime
from enum import Enum
import logging
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, insert, update, delete, and_, or_, func

from core.database import async_session
from core.error_standardization import error_standardizer, create_not_found_error
from core.enhanced_audit_system import get_enhanced_audit_system, AuditEventType, AuditLevel
from core.monitoring import performance_monitor
from routers.consolidated.auth_router import get_current_user, UserProfile
from schemas.common import MessageResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/admin", tags=["System", "Templates", "Admin Extensions", "Security"])

# Pydantic models for templates
class TemplateType(str, Enum):
    WELCOME = "welcome"
    MARKETING = "marketing"
    NOTIFICATION = "notification"
    TRANSACTIONAL = "transactional"

class TemplateStatus(str, Enum):
    ACTIVE = "active"
    DRAFT = "draft"
    ARCHIVED = "archived"

class TemplateVariable(BaseModel):
    name: str
    type: str = "string"
    required: bool = True
    default_value: Optional[str] = None
    description: Optional[str] = None

class EmailTemplateCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    subject: str = Field(..., min_length=1, max_length=255)
    content: str = Field(..., min_length=1)
    type: TemplateType
    variables: List[TemplateVariable] = []
    tags: List[str] = []
    category: Optional[str] = None

class EmailTemplateUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    subject: Optional[str] = Field(None, min_length=1, max_length=255)
    content: Optional[str] = None
    type: Optional[TemplateType] = None
    status: Optional[TemplateStatus] = None
    variables: Optional[List[TemplateVariable]] = None
    tags: Optional[List[str]] = None
    category: Optional[str] = None

class EmailTemplateResponse(BaseModel):
    id: str
    name: str
    subject: str
    content: str
    type: TemplateType
    status: TemplateStatus
    usage_count: int
    variables: List[TemplateVariable]
    tags: List[str]
    category: Optional[str]
    created_at: datetime
    updated_at: datetime
    created_by: str

class TemplateStatsResponse(BaseModel):
    total_templates: int
    active_templates: int
    draft_templates: int
    archived_templates: int
    total_usage: int
    most_used_template: Optional[str]
    most_used_count: int

class TemplateUsageResponse(BaseModel):
    template_id: str
    campaign_id: str
    campaign_name: str
    sent_count: int
    open_rate: float
    click_rate: float
    used_at: datetime

# Dependency to verify admin access
async def get_current_admin_user(current_user: UserProfile = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user

@router.get("/templates/stats", response_model=TemplateStatsResponse)
async def get_template_stats(
    current_admin: UserProfile = Depends(get_current_admin_user),
    db: AsyncSession = Depends(async_session)
):
    """Get template usage statistics"""
    try:
        # Mock implementation - replace with actual database queries
        stats = TemplateStatsResponse(
            total_templates=25,
            active_templates=18,
            draft_templates=5,
            archived_templates=2,
            total_usage=1247,
            most_used_template="Welcome Email",
            most_used_count=234
        )
        
        return stats
        
    except Exception as e:
        logger.error(f"Error fetching template stats: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch template statistics"
        )

@router.get("/templates", response_model=List[EmailTemplateResponse])
async def list_templates(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    search: Optional[str] = None,
    type_filter: Optional[TemplateType] = None,
    status_filter: Optional[TemplateStatus] = None,
    sort_by: str = Query("created_at", regex="^(name|created_at|updated_at|usage_count)$"),
    sort_order: str = Query("desc", regex="^(asc|desc)$"),
    current_admin: UserProfile = Depends(get_current_admin_user),
    db: AsyncSession = Depends(async_session)
):
    """List all email templates with filtering and pagination"""
    try:
        # Mock implementation - replace with actual database queries
        mock_templates = [
            EmailTemplateResponse(
                id=str(uuid.uuid4()),
                name="Welcome Email",
                subject="Welcome to SGPT - Get Started!",
                content="Welcome {{name}}! We're excited to have you on board...",
                type=TemplateType.WELCOME,
                status=TemplateStatus.ACTIVE,
                usage_count=234,
                variables=[
                    TemplateVariable(name="name", type="string", required=True),
                    TemplateVariable(name="email", type="email", required=True),
                    TemplateVariable(name="company", type="string", required=False)
                ],
                tags=["System", "Templates", "Admin Extensions", "Security"],
                category="user_lifecycle",
                created_at=datetime.now(),
                updated_at=datetime.now(),
                created_by=current_admin.email
            ),
            EmailTemplateResponse(
                id=str(uuid.uuid4()),
                name="Marketing Campaign",
                subject="🚀 Boost Your Email Marketing ROI by 300%",
                content="Dear {{name}}, discover how to triple your email marketing results...",
                type=TemplateType.MARKETING,
                status=TemplateStatus.ACTIVE,
                usage_count=156,
                variables=[
                    TemplateVariable(name="name", type="string", required=True),
                    TemplateVariable(name="company", type="string", required=False),
                    TemplateVariable(name="industry", type="string", required=False)
                ],
                tags=["System", "Templates", "Admin Extensions", "Security"],
                category="marketing",
                created_at=datetime.now(),
                updated_at=datetime.now(),
                created_by=current_admin.email
            ),
            EmailTemplateResponse(
                id=str(uuid.uuid4()),
                name="Password Reset",
                subject="Reset Your SGPT Password",
                content="Hi {{name}}, you requested to reset your password...",
                type=TemplateType.TRANSACTIONAL,
                status=TemplateStatus.ACTIVE,
                usage_count=89,
                variables=[
                    TemplateVariable(name="name", type="string", required=True),
                    TemplateVariable(name="reset_link", type="url", required=True),
                    TemplateVariable(name="expires_at", type="datetime", required=True)
                ],
                tags=["System", "Templates", "Admin Extensions", "Security"],
                category="security",
                created_at=datetime.now(),
                updated_at=datetime.now(),
                created_by="system@sgpt.com"
            )
        ]
        
        # Apply filters
        filtered_templates = mock_templates
        if search:
            filtered_templates = [t for t in filtered_templates if search.lower() in t.name.lower() or search.lower() in t.subject.lower()]
        if type_filter:
            filtered_templates = [t for t in filtered_templates if t.type == type_filter]
        if status_filter:
            filtered_templates = [t for t in filtered_templates if t.status == status_filter]
        
        # Apply pagination
        paginated_templates = filtered_templates[skip:skip + limit]
        
        return paginated_templates
        
    except Exception as e:
        logger.error(f"Error listing templates: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list templates"
        )

@router.post("/templates", response_model=EmailTemplateResponse)
async def create_template(
    template_data: EmailTemplateCreate,
    current_admin: UserProfile = Depends(get_current_admin_user),
    db: AsyncSession = Depends(async_session)
):
    """Create a new email template"""
    try:
        # Mock implementation - replace with actual database insertion
        new_template = EmailTemplateResponse(
            id=str(uuid.uuid4()),
            name=template_data.name,
            subject=template_data.subject,
            content=template_data.content,
            type=template_data.type,
            status=TemplateStatus.DRAFT,
            usage_count=0,
            variables=template_data.variables,
            tags=template_data.tags,
            category=template_data.category,
            created_at=datetime.now(),
            updated_at=datetime.now(),
            created_by=current_admin.email
        )
        
        logger.info(f"Created new template: {new_template.name} by {current_admin.email}")
        return new_template
        
    except Exception as e:
        logger.error(f"Error creating template: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create template"
        )

@router.get("/templates/{template_id}", response_model=EmailTemplateResponse)
async def get_template(
    template_id: str,
    current_admin: UserProfile = Depends(get_current_admin_user),
    db: AsyncSession = Depends(async_session)
):
    """Get a specific template by ID"""
    try:
        # Mock implementation - replace with actual database query
        template = EmailTemplateResponse(
            id=template_id,
            name="Welcome Email",
            subject="Welcome to SGPT - Get Started!",
            content="Welcome {{name}}! We're excited to have you on board...",
            type=TemplateType.WELCOME,
            status=TemplateStatus.ACTIVE,
            usage_count=234,
            variables=[
                TemplateVariable(name="name", type="string", required=True),
                TemplateVariable(name="email", type="email", required=True)
            ],
            tags=["System", "Templates", "Admin Extensions", "Security"],
            category="user_lifecycle",
            created_at=datetime.now(),
            updated_at=datetime.now(),
            created_by=current_admin.email
        )
        
        return template
        
    except Exception as e:
        logger.error(f"Error fetching template {template_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )

@router.put("/templates/{template_id}", response_model=EmailTemplateResponse)
async def update_template(
    template_id: str,
    template_data: EmailTemplateUpdate,
    current_admin: UserProfile = Depends(get_current_admin_user),
    db: AsyncSession = Depends(async_session)
):
    """Update an existing template"""
    try:
        # Mock implementation - replace with actual database update
        updated_template = EmailTemplateResponse(
            id=template_id,
            name=template_data.name or "Updated Template",
            subject=template_data.subject or "Updated Subject",
            content=template_data.content or "Updated content...",
            type=template_data.type or TemplateType.MARKETING,
            status=template_data.status or TemplateStatus.ACTIVE,
            usage_count=234,
            variables=template_data.variables or [],
            tags=template_data.tags or [],
            category=template_data.category,
            created_at=datetime.now(),
            updated_at=datetime.now(),
            created_by=current_admin.email
        )
        
        logger.info(f"Updated template {template_id} by {current_admin.email}")
        return updated_template
        
    except Exception as e:
        logger.error(f"Error updating template {template_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update template"
        )

@router.delete("/templates/{template_id}", response_model=MessageResponse)
async def delete_template(
    template_id: str,
    current_admin: UserProfile = Depends(get_current_admin_user),
    db: AsyncSession = Depends(async_session)
):
    """Delete a template"""
    try:
        # Mock implementation - replace with actual database deletion
        logger.info(f"Deleted template {template_id} by {current_admin.email}")
        
        return MessageResponse(message="Template deleted successfully")
        
    except Exception as e:
        logger.error(f"Error deleting template {template_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete template"
        )

@router.get("/templates/{template_id}/usage", response_model=List[TemplateUsageResponse])
async def get_template_usage(
    template_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_admin: UserProfile = Depends(get_current_admin_user),
    db: AsyncSession = Depends(async_session)
):
    """Get template usage history"""
    try:
        # Mock implementation - replace with actual database query
        usage_history = [
            TemplateUsageResponse(
                template_id=template_id,
                campaign_id=str(uuid.uuid4()),
                campaign_name="January Newsletter",
                sent_count=1250,
                open_rate=23.5,
                click_rate=4.2,
                used_at=datetime.now()
            ),
            TemplateUsageResponse(
                template_id=template_id,
                campaign_id=str(uuid.uuid4()),
                campaign_name="Product Launch",
                sent_count=890,
                open_rate=31.2,
                click_rate=6.8,
                used_at=datetime.now()
            )
        ]
        
        return usage_history[skip:skip + limit]
        
    except Exception as e:
        logger.error(f"Error fetching template usage {template_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch template usage"
        )

@router.post("/templates/{template_id}/duplicate", response_model=EmailTemplateResponse)
async def duplicate_template(
    template_id: str,
    current_admin: UserProfile = Depends(get_current_admin_user),
    db: AsyncSession = Depends(async_session)
):
    """Duplicate an existing template"""
    try:
        # Mock implementation - replace with actual database operations
        duplicated_template = EmailTemplateResponse(
            id=str(uuid.uuid4()),
            name="Copy of Welcome Email",
            subject="Welcome to SGPT - Get Started!",
            content="Welcome {{name}}! We're excited to have you on board...",
            type=TemplateType.WELCOME,
            status=TemplateStatus.DRAFT,
            usage_count=0,
            variables=[
                TemplateVariable(name="name", type="string", required=True),
                TemplateVariable(name="email", type="email", required=True)
            ],
            tags=["System", "Templates", "Admin Extensions", "Security"],
            category="user_lifecycle",
            created_at=datetime.now(),
            updated_at=datetime.now(),
            created_by=current_admin.email
        )
        
        logger.info(f"Duplicated template {template_id} by {current_admin.email}")
        return duplicated_template
        
    except Exception as e:
        logger.error(f"Error duplicating template {template_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to duplicate template"
        )

@router.post("/templates/{template_id}/preview")
async def preview_template(
    template_id: str,
    variables: Dict[str, Any],
    current_admin: UserProfile = Depends(get_current_admin_user),
    db: AsyncSession = Depends(async_session)
):
    """Preview template with variable substitution"""
    try:
        # Mock implementation - replace with actual template rendering
        rendered_content = {
            "subject": "Welcome to SGPT - Get Started!",
            "content": f"Welcome {variables.get('name', 'User')}! We're excited to have you on board...",
            "html_content": f"<h1>Welcome {variables.get('name', 'User')}!</h1><p>We're excited to have you on board...</p>"
        }
        
        return rendered_content
        
    except Exception as e:
        logger.error(f"Error previewing template {template_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to preview template"
        )