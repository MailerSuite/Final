"""
Consolidated Data Router
Implements comprehensive data management including leads, domains, and bulk operations
"""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query, BackgroundTasks, Response
from pydantic import BaseModel, EmailStr, Field, validator, HttpUrl
from typing import List, Optional, Dict, Any, Union
from datetime import datetime, timedelta
from enum import Enum
import logging
import uuid
import csv
import io
import json
import pandas as pd
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, insert, update, delete, and_, or_, func

from core.database import async_session
from core.error_standardization import error_standardizer, create_not_found_error, create_duplicate_error
from core.enhanced_audit_system import get_enhanced_audit_system, AuditEventType, AuditLevel
from core.monitoring import performance_monitor
from routers.consolidated.auth_router import get_current_user, UserProfile
from models import LeadBase, LeadEntry, Domain, EmailBase

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/data", tags=["Upload"])

# Enhanced Pydantic models
class LeadStatus(str, Enum):
    NEW = "new"
    CONTACTED = "contacted"
    QUALIFIED = "qualified"
    CONVERTED = "converted"
    LOST = "lost"
    UNSUBSCRIBED = "unsubscribed"

class DomainStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"
    EXPIRED = "expired"

class MaterialType(str, Enum):
    EMAIL_BASES = "email-bases"
    DOMAINS = "domains"
    LEAD_LISTS = "lead-lists"
    CONTACT_LISTS = "contact-lists"

class ExportFormat(str, Enum):
    CSV = "csv"
    JSON = "json"
    XLSX = "xlsx"

class LeadBaseCreate(BaseModel):
    name: str = Field(..., min_length=3, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    category: Optional[str] = None
    tags: List[str] = []
    source: Optional[str] = None
    is_public: bool = False

class LeadBaseInfo(BaseModel):
    id: str
    name: str
    description: Optional[str]
    category: Optional[str]
    tags: List[str]
    source: Optional[str]
    is_public: bool
    lead_count: int
    valid_emails: int
    invalid_emails: int
    bounced_emails: int
    last_verified: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    created_by: str

class LeadCreate(BaseModel):
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    company: Optional[str] = None
    position: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    industry: Optional[str] = None
    location: Optional[str] = None
    status: LeadStatus = LeadStatus.NEW
    source: Optional[str] = None
    notes: Optional[str] = None
    custom_fields: Dict[str, Any] = {}

class LeadInfo(BaseModel):
    id: str
    base_id: str
    email: str
    first_name: Optional[str]
    last_name: Optional[str]
    company: Optional[str]
    position: Optional[str]
    phone: Optional[str]
    website: Optional[str]
    industry: Optional[str]
    location: Optional[str]
    status: LeadStatus
    source: Optional[str]
    notes: Optional[str]
    custom_fields: Dict[str, Any]
    email_valid: bool
    last_contacted: Optional[datetime]
    response_rate: float
    engagement_score: int
    created_at: datetime
    updated_at: datetime

class DomainCreate(BaseModel):
    domain: str = Field(..., regex=r'^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$')
    category: Optional[str] = None
    notes: Optional[str] = None
    is_blacklisted: bool = False
    max_daily_emails: Optional[int] = Field(None, ge=1)

class DomainInfo(BaseModel):
    id: str
    domain: str
    category: Optional[str]
    notes: Optional[str]
    status: DomainStatus
    is_blacklisted: bool
    max_daily_emails: Optional[int]
    reputation_score: float
    mx_records: List[str]
    spf_record: Optional[str]
    dkim_configured: bool
    dmarc_policy: Optional[str]
    ssl_certificate: bool
    emails_sent_today: int
    bounce_rate: float
    complaint_rate: float
    last_checked: Optional[datetime]
    created_at: datetime
    updated_at: datetime

class BulkUploadResult(BaseModel):
    success: bool
    message: str
    total_processed: int
    successful_imports: int
    failed_imports: int
    duplicates_skipped: int
    errors: List[Dict[str, str]]
    processing_time: float

class ExportRequest(BaseModel):
    format: ExportFormat
    filters: Dict[str, Any] = {}
    fields: Optional[List[str]] = None
    include_metadata: bool = True

# Database session dependency
async def get_db():
    async with async_session() as session:
        yield session

# In-memory storage for demo (would use actual database)
LEAD_BASES: Dict[str, LeadBaseInfo] = {}
LEADS: Dict[str, List[LeadInfo]] = {}  # base_id -> [leads]
DOMAINS: Dict[str, DomainInfo] = {}

# Lead Management Endpoints

@router.get("/leads", response_model=List[LeadBaseInfo])
async def list_lead_bases(
    category: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: UserProfile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    List all lead bases with filtering and search capabilities
    """
    try:
        audit_system = await get_enhanced_audit_system()
        
        # Filter lead bases
        filtered_bases = []
        for base_id, base_info in LEAD_BASES.items():
            # Apply filters
            if category and base_info.category != category:
                continue
            if search:
                search_lower = search.lower()
                if not any([
                    search_lower in base_info.name.lower(),
                    search_lower in (base_info.description or "").lower(),
                    any(search_lower in tag for tag in base_info.tags)
                ]):
                    continue
            
            filtered_bases.append(base_info)
        
        # Sort by creation date (newest first)
        filtered_bases.sort(key=lambda x: x.created_at, reverse=True)
        
        # Apply pagination
        paginated_bases = filtered_bases[skip:skip + limit]
        
        # Log access
        await audit_system.log_enhanced_event(
            event_type=AuditEventType.DATA_ACCESS,
            action="List lead bases",
            resource="lead_bases",
            details={
                "user_id": current_user.id,
                "filters": {"category": category, "search": search},
                "count": len(paginated_bases)
            }
        )
        
        return paginated_bases
        
    except Exception as e:
        logger.error(f"Error listing lead bases: {e}")
        error_response = error_standardizer.standardize_error(
            status_code=500,
            message="Failed to list lead bases",
            exception=e
        )
        raise HTTPException(
            status_code=error_response.status_code,
            detail=error_response.message
        )

@router.get("/leads/{base_id}", response_model=LeadBaseInfo)
async def get_lead_base(
    base_id: str,
    current_user: UserProfile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get detailed information about a specific lead base
    """
    try:
        audit_system = await get_enhanced_audit_system()
        
        # Get lead base
        base_info = LEAD_BASES.get(base_id)
        if not base_info:
            error_response = create_not_found_error("Lead base", base_id)
            raise HTTPException(
                status_code=error_response.status_code,
                detail=error_response.message
            )
        
        # Log access
        await audit_system.log_enhanced_event(
            event_type=AuditEventType.DATA_ACCESS,
            action="Get lead base details",
            resource="lead_base",
            details={
                "user_id": current_user.id,
                "base_id": base_id
            }
        )
        
        return base_info
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting lead base: {e}")
        error_response = error_standardizer.standardize_error(
            status_code=500,
            message="Failed to get lead base",
            exception=e
        )
        raise HTTPException(
            status_code=error_response.status_code,
            detail=error_response.message
        )

@router.post("/leads", response_model=LeadBaseInfo)
async def create_lead_base(
    lead_base_data: LeadBaseCreate,
    current_user: UserProfile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new lead base for organizing leads
    """
    try:
        audit_system = await get_enhanced_audit_system()
        
        # Check for duplicate names
        if any(base.name.lower() == lead_base_data.name.lower() for base in LEAD_BASES.values()):
            error_response = create_duplicate_error("Lead base", "name", lead_base_data.name)
            raise HTTPException(
                status_code=error_response.status_code,
                detail=error_response.message
            )
        
        # Create lead base
        base_id = f"base_{uuid.uuid4().hex[:12]}"
        new_base = LeadBaseInfo(
            id=base_id,
            name=lead_base_data.name,
            description=lead_base_data.description,
            category=lead_base_data.category,
            tags=lead_base_data.tags,
            source=lead_base_data.source,
            is_public=lead_base_data.is_public,
            lead_count=0,
            valid_emails=0,
            invalid_emails=0,
            bounced_emails=0,
            last_verified=None,
            created_at=datetime.now(),
            updated_at=datetime.now(),
            created_by=current_user.id
        )
        
        # Store lead base
        LEAD_BASES[base_id] = new_base
        LEADS[base_id] = []
        
        # Log creation
        await audit_system.log_enhanced_event(
            event_type=AuditEventType.LEAD_BASE_CREATED,
            action="Create lead base",
            resource="lead_base",
            details={
                "user_id": current_user.id,
                "base_id": base_id,
                "name": lead_base_data.name
            }
        )
        
        return new_base
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating lead base: {e}")
        error_response = error_standardizer.standardize_error(
            status_code=500,
            message="Failed to create lead base",
            exception=e
        )
        raise HTTPException(
            status_code=error_response.status_code,
            detail=error_response.message
        )

@router.post("/leads/{base_id}/upload", response_model=BulkUploadResult)
async def upload_leads(
    base_id: str,
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = None,
    skip_duplicates: bool = Query(True, description="Skip duplicate emails"),
    validate_emails: bool = Query(True, description="Validate email addresses"),
    current_user: UserProfile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Upload leads from CSV/Excel file to a lead base
    """
    try:
        audit_system = await get_enhanced_audit_system()
        start_time = datetime.now()
        
        # Get lead base
        base_info = LEAD_BASES.get(base_id)
        if not base_info:
            error_response = create_not_found_error("Lead base", base_id)
            raise HTTPException(
                status_code=error_response.status_code,
                detail=error_response.message
            )
        
        # Validate file type
        if not file.filename.lower().endswith(('.csv', '.xlsx', '.xls')):
            raise HTTPException(
                status_code=400,
                detail="Only CSV and Excel files are supported"
            )
        
        # Read file content
        content = await file.read()
        
        # Parse file based on type
        if file.filename.lower().endswith('.csv'):
            df = pd.read_csv(io.BytesIO(content))
        else:
            df = pd.read_excel(io.BytesIO(content))
        
        # Process leads
        successful_imports = 0
        failed_imports = 0
        duplicates_skipped = 0
        errors = []
        
        existing_emails = {lead.email for lead in LEADS.get(base_id, [])}
        
        for index, row in df.iterrows():
            try:
                # Extract lead data
                email = str(row.get('email', '')).strip()
                if not email or '@' not in email:
                    failed_imports += 1
                    errors.append({
                        "row": index + 1,
                        "error": "Invalid or missing email address"
                    })
                    continue
                
                # Check for duplicates
                if skip_duplicates and email in existing_emails:
                    duplicates_skipped += 1
                    continue
                
                # Create lead
                lead_id = f"lead_{uuid.uuid4().hex[:12]}"
                new_lead = LeadInfo(
                    id=lead_id,
                    base_id=base_id,
                    email=email,
                    first_name=str(row.get('first_name', '') or '').strip() or None,
                    last_name=str(row.get('last_name', '') or '').strip() or None,
                    company=str(row.get('company', '') or '').strip() or None,
                    position=str(row.get('position', '') or '').strip() or None,
                    phone=str(row.get('phone', '') or '').strip() or None,
                    website=str(row.get('website', '') or '').strip() or None,
                    industry=str(row.get('industry', '') or '').strip() or None,
                    location=str(row.get('location', '') or '').strip() or None,
                    status=LeadStatus.NEW,
                    source=base_info.source or "upload",
                    notes=str(row.get('notes', '') or '').strip() or None,
                    custom_fields={},
                    email_valid=True,  # Would validate if requested
                    last_contacted=None,
                    response_rate=0.0,
                    engagement_score=0,
                    created_at=datetime.now(),
                    updated_at=datetime.now()
                )
                
                # Add to leads
                if base_id not in LEADS:
                    LEADS[base_id] = []
                LEADS[base_id].append(new_lead)
                existing_emails.add(email)
                successful_imports += 1
                
            except Exception as e:
                failed_imports += 1
                errors.append({
                    "row": index + 1,
                    "error": str(e)
                })
        
        # Update base stats
        base_info.lead_count = len(LEADS.get(base_id, []))
        base_info.valid_emails = successful_imports
        base_info.updated_at = datetime.now()
        
        processing_time = (datetime.now() - start_time).total_seconds()
        
        # Create result
        result = BulkUploadResult(
            success=True,
            message=f"Processed {len(df)} rows",
            total_processed=len(df),
            successful_imports=successful_imports,
            failed_imports=failed_imports,
            duplicates_skipped=duplicates_skipped,
            errors=errors[:50],  # Limit errors to first 50
            processing_time=processing_time
        )
        
        # Background task for email validation if requested
        if validate_emails:
            background_tasks.add_task(
                validate_lead_emails,
                base_id,
                current_user.id
            )
        
        # Log upload
        await audit_system.log_enhanced_event(
            event_type=AuditEventType.BULK_UPLOAD,
            action="Upload leads",
            resource="leads",
            details={
                "user_id": current_user.id,
                "base_id": base_id,
                "file_name": file.filename,
                "successful_imports": successful_imports,
                "failed_imports": failed_imports,
                "processing_time": processing_time
            }
        )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading leads: {e}")
        error_response = error_standardizer.standardize_error(
            status_code=500,
            message="Failed to upload leads",
            exception=e
        )
        raise HTTPException(
            status_code=error_response.status_code,
            detail=error_response.message
        )

@router.get("/leads/{base_id}/leads")
async def list_leads(
    base_id: str,
    status: Optional[LeadStatus] = None,
    search: Optional[str] = None,
    company: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: UserProfile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    List leads in a specific lead base with filtering options
    """
    try:
        audit_system = await get_enhanced_audit_system()
        
        # Get lead base
        base_info = LEAD_BASES.get(base_id)
        if not base_info:
            error_response = create_not_found_error("Lead base", base_id)
            raise HTTPException(
                status_code=error_response.status_code,
                detail=error_response.message
            )
        
        # Get leads
        leads = LEADS.get(base_id, [])
        
        # Apply filters
        filtered_leads = []
        for lead in leads:
            if status and lead.status != status:
                continue
            if company and (not lead.company or company.lower() not in lead.company.lower()):
                continue
            if search:
                search_lower = search.lower()
                if not any([
                    search_lower in lead.email.lower(),
                    search_lower in (lead.first_name or "").lower(),
                    search_lower in (lead.last_name or "").lower(),
                    search_lower in (lead.company or "").lower()
                ]):
                    continue
            
            filtered_leads.append(lead)
        
        # Sort by creation date (newest first)
        filtered_leads.sort(key=lambda x: x.created_at, reverse=True)
        
        # Apply pagination
        paginated_leads = filtered_leads[skip:skip + limit]
        
        # Log access
        await audit_system.log_enhanced_event(
            event_type=AuditEventType.DATA_ACCESS,
            action="List leads",
            resource="leads",
            details={
                "user_id": current_user.id,
                "base_id": base_id,
                "filters": {"status": status, "search": search, "company": company},
                "count": len(paginated_leads)
            }
        )
        
        return {
            "leads": paginated_leads,
            "total": len(filtered_leads),
            "base_info": base_info,
            "pagination": {
                "skip": skip,
                "limit": limit,
                "has_more": len(filtered_leads) > skip + limit
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listing leads: {e}")
        error_response = error_standardizer.standardize_error(
            status_code=500,
            message="Failed to list leads",
            exception=e
        )
        raise HTTPException(
            status_code=error_response.status_code,
            detail=error_response.message
        )

# Domain Management Endpoints

@router.get("/domains")
async def list_domains(
    session_id: str = Query(..., description="Session ID"),
    status: Optional[DomainStatus] = None,
    search: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: UserProfile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    List domains with filtering and health status information
    """
    try:
        audit_system = await get_enhanced_audit_system()
        
        # Filter domains
        filtered_domains = []
        for domain_id, domain_info in DOMAINS.items():
            if status and domain_info.status != status:
                continue
            if search and search.lower() not in domain_info.domain.lower():
                continue
            
            filtered_domains.append(domain_info)
        
        # Sort by reputation score (highest first)
        filtered_domains.sort(key=lambda x: x.reputation_score, reverse=True)
        
        # Apply pagination
        paginated_domains = filtered_domains[skip:skip + limit]
        
        # Log access
        await audit_system.log_enhanced_event(
            event_type=AuditEventType.DATA_ACCESS,
            action="List domains",
            resource="domains",
            details={
                "user_id": current_user.id,
                "session_id": session_id,
                "filters": {"status": status, "search": search},
                "count": len(paginated_domains)
            }
        )
        
        return {
            "domains": paginated_domains,
            "total": len(filtered_domains),
            "pagination": {
                "skip": skip,
                "limit": limit,
                "has_more": len(filtered_domains) > skip + limit
            },
            "statistics": {
                "active_domains": len([d for d in DOMAINS.values() if d.status == DomainStatus.ACTIVE]),
                "avg_reputation": sum(d.reputation_score for d in DOMAINS.values()) / len(DOMAINS) if DOMAINS else 0,
                "total_emails_sent": sum(d.emails_sent_today for d in DOMAINS.values())
            }
        }
        
    except Exception as e:
        logger.error(f"Error listing domains: {e}")
        error_response = error_standardizer.standardize_error(
            status_code=500,
            message="Failed to list domains",
            exception=e
        )
        raise HTTPException(
            status_code=error_response.status_code,
            detail=error_response.message
        )

@router.post("/domains", response_model=DomainInfo)
async def create_domain(
    session_id: str,
    domain_data: DomainCreate,
    background_tasks: BackgroundTasks,
    current_user: UserProfile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Add a new domain with automatic configuration checking
    """
    try:
        audit_system = await get_enhanced_audit_system()
        
        # Check for duplicate domain
        if any(d.domain.lower() == domain_data.domain.lower() for d in DOMAINS.values()):
            error_response = create_duplicate_error("Domain", "domain", domain_data.domain)
            raise HTTPException(
                status_code=error_response.status_code,
                detail=error_response.message
            )
        
        # Create domain
        domain_id = f"domain_{uuid.uuid4().hex[:12]}"
        new_domain = DomainInfo(
            id=domain_id,
            domain=domain_data.domain.lower(),
            category=domain_data.category,
            notes=domain_data.notes,
            status=DomainStatus.ACTIVE,
            is_blacklisted=domain_data.is_blacklisted,
            max_daily_emails=domain_data.max_daily_emails,
            reputation_score=50.0,  # Default score
            mx_records=[],
            spf_record=None,
            dkim_configured=False,
            dmarc_policy=None,
            ssl_certificate=False,
            emails_sent_today=0,
            bounce_rate=0.0,
            complaint_rate=0.0,
            last_checked=None,
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        
        # Store domain
        DOMAINS[domain_id] = new_domain
        
        # Background task to check domain configuration
        background_tasks.add_task(
            check_domain_configuration,
            domain_id,
            current_user.id
        )
        
        # Log creation
        await audit_system.log_enhanced_event(
            event_type=AuditEventType.DOMAIN_CREATED,
            action="Create domain",
            resource="domain",
            details={
                "user_id": current_user.id,
                "domain_id": domain_id,
                "domain": domain_data.domain
            }
        )
        
        return new_domain
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating domain: {e}")
        error_response = error_standardizer.standardize_error(
            status_code=500,
            message="Failed to create domain",
            exception=e
        )
        raise HTTPException(
            status_code=error_response.status_code,
            detail=error_response.message
        )

@router.get("/domains/{domain_id}", response_model=DomainInfo)
async def get_domain(
    session_id: str,
    domain_id: str,
    current_user: UserProfile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get detailed domain information including health metrics
    """
    try:
        audit_system = await get_enhanced_audit_system()
        
        # Get domain
        domain_info = DOMAINS.get(domain_id)
        if not domain_info:
            error_response = create_not_found_error("Domain", domain_id)
            raise HTTPException(
                status_code=error_response.status_code,
                detail=error_response.message
            )
        
        # Log access
        await audit_system.log_enhanced_event(
            event_type=AuditEventType.DATA_ACCESS,
            action="Get domain details",
            resource="domain",
            details={
                "user_id": current_user.id,
                "domain_id": domain_id
            }
        )
        
        return domain_info
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting domain: {e}")
        error_response = error_standardizer.standardize_error(
            status_code=500,
            message="Failed to get domain",
            exception=e
        )
        raise HTTPException(
            status_code=error_response.status_code,
            detail=error_response.message
        )

@router.put("/domains/{domain_id}", response_model=DomainInfo)
async def update_domain(
    session_id: str,
    domain_id: str,
    domain_update: Dict[str, Any],
    current_user: UserProfile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update domain settings and configuration
    """
    try:
        audit_system = await get_enhanced_audit_system()
        
        # Get domain
        domain_info = DOMAINS.get(domain_id)
        if not domain_info:
            error_response = create_not_found_error("Domain", domain_id)
            raise HTTPException(
                status_code=error_response.status_code,
                detail=error_response.message
            )
        
        # Track changes
        changes = []
        allowed_fields = ["category", "notes", "is_blacklisted", "max_daily_emails", "status"]
        
        for field, value in domain_update.items():
            if field in allowed_fields and hasattr(domain_info, field):
                setattr(domain_info, field, value)
                changes.append(field)
        
        domain_info.updated_at = datetime.now()
        
        # Log update
        await audit_system.log_enhanced_event(
            event_type=AuditEventType.DOMAIN_UPDATED,
            action="Update domain",
            resource="domain",
            details={
                "user_id": current_user.id,
                "domain_id": domain_id,
                "changes": changes
            }
        )
        
        return domain_info
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating domain: {e}")
        error_response = error_standardizer.standardize_error(
            status_code=500,
            message="Failed to update domain",
            exception=e
        )
        raise HTTPException(
            status_code=error_response.status_code,
            detail=error_response.message
        )

@router.delete("/domains/{domain_id}")
async def delete_domain(
    session_id: str,
    domain_id: str,
    current_user: UserProfile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a domain from the system
    """
    try:
        audit_system = await get_enhanced_audit_system()
        
        # Get domain
        domain_info = DOMAINS.get(domain_id)
        if not domain_info:
            error_response = create_not_found_error("Domain", domain_id)
            raise HTTPException(
                status_code=error_response.status_code,
                detail=error_response.message
            )
        
        # Check if domain is in use
        if domain_info.emails_sent_today > 0:
            raise HTTPException(
                status_code=400,
                detail="Cannot delete domain that has been used for sending emails today"
            )
        
        # Delete domain
        del DOMAINS[domain_id]
        
        # Log deletion
        await audit_system.log_enhanced_event(
            event_type=AuditEventType.DOMAIN_DELETED,
            action="Delete domain",
            resource="domain",
            level=AuditLevel.WARNING,
            details={
                "user_id": current_user.id,
                "domain_id": domain_id,
                "domain": domain_info.domain
            }
        )
        
        return {
            "success": True,
            "message": f"Domain {domain_info.domain} deleted successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting domain: {e}")
        error_response = error_standardizer.standardize_error(
            status_code=500,
            message="Failed to delete domain",
            exception=e
        )
        raise HTTPException(
            status_code=error_response.status_code,
            detail=error_response.message
        )

# Material Management Endpoints

@router.get("/materials")
async def list_materials(
    session_id: str,
    material_type: MaterialType = Query(..., description="Type of material"),
    search: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: UserProfile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    List materials of a specific type with search functionality
    """
    try:
        audit_system = await get_enhanced_audit_system()
        
        materials = []
        
        if material_type == MaterialType.EMAIL_BASES:
            materials = list(LEAD_BASES.values())
        elif material_type == MaterialType.DOMAINS:
            materials = list(DOMAINS.values())
        elif material_type in [MaterialType.LEAD_LISTS, MaterialType.CONTACT_LISTS]:
            materials = list(LEAD_BASES.values())
        
        # Apply search filter
        if search:
            search_lower = search.lower()
            if material_type == MaterialType.EMAIL_BASES:
                materials = [m for m in materials if search_lower in m.name.lower()]
            elif material_type == MaterialType.DOMAINS:
                materials = [m for m in materials if search_lower in m.domain.lower()]
        
        # Apply pagination
        paginated_materials = materials[skip:skip + limit]
        
        # Log access
        await audit_system.log_enhanced_event(
            event_type=AuditEventType.DATA_ACCESS,
            action="List materials",
            resource="materials",
            details={
                "user_id": current_user.id,
                "session_id": session_id,
                "material_type": material_type,
                "count": len(paginated_materials)
            }
        )
        
        return {
            "materials": paginated_materials,
            "total": len(materials),
            "material_type": material_type,
            "pagination": {
                "skip": skip,
                "limit": limit,
                "has_more": len(materials) > skip + limit
            }
        }
        
    except Exception as e:
        logger.error(f"Error listing materials: {e}")
        error_response = error_standardizer.standardize_error(
            status_code=500,
            message="Failed to list materials",
            exception=e
        )
        raise HTTPException(
            status_code=error_response.status_code,
            detail=error_response.message
        )

@router.post("/materials/bulk-upload", response_model=BulkUploadResult)
async def bulk_upload_materials(
    session_id: str,
    material_type: MaterialType,
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = None,
    current_user: UserProfile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Bulk upload materials from file (domains, email lists, etc.)
    """
    try:
        audit_system = await get_enhanced_audit_system()
        start_time = datetime.now()
        
        # Validate file type
        if not file.filename.lower().endswith(('.csv', '.txt', '.xlsx')):
            raise HTTPException(
                status_code=400,
                detail="Only CSV, TXT, and Excel files are supported"
            )
        
        # Read file content
        content = await file.read()
        
        successful_imports = 0
        failed_imports = 0
        duplicates_skipped = 0
        errors = []
        
        if material_type == MaterialType.DOMAINS:
            # Process domains
            if file.filename.lower().endswith('.csv'):
                df = pd.read_csv(io.BytesIO(content))
                domains = df['domain'].tolist() if 'domain' in df.columns else []
            else:
                # Text file with one domain per line
                domains = content.decode('utf-8').strip().split('\n')
            
            existing_domains = {d.domain for d in DOMAINS.values()}
            
            for domain in domains:
                domain = domain.strip().lower()
                if not domain or '.' not in domain:
                    failed_imports += 1
                    errors.append({"domain": domain, "error": "Invalid domain format"})
                    continue
                
                if domain in existing_domains:
                    duplicates_skipped += 1
                    continue
                
                # Create domain
                domain_id = f"domain_{uuid.uuid4().hex[:12]}"
                new_domain = DomainInfo(
                    id=domain_id,
                    domain=domain,
                    category="bulk_upload",
                    notes=f"Uploaded from {file.filename}",
                    status=DomainStatus.ACTIVE,
                    is_blacklisted=False,
                    max_daily_emails=None,
                    reputation_score=50.0,
                    mx_records=[],
                    spf_record=None,
                    dkim_configured=False,
                    dmarc_policy=None,
                    ssl_certificate=False,
                    emails_sent_today=0,
                    bounce_rate=0.0,
                    complaint_rate=0.0,
                    last_checked=None,
                    created_at=datetime.now(),
                    updated_at=datetime.now()
                )
                
                DOMAINS[domain_id] = new_domain
                existing_domains.add(domain)
                successful_imports += 1
                
                # Background check
                background_tasks.add_task(check_domain_configuration, domain_id, current_user.id)
        
        elif material_type in [MaterialType.EMAIL_BASES, MaterialType.LEAD_LISTS]:
            # Process lead lists
            if file.filename.lower().endswith('.csv'):
                df = pd.read_csv(io.BytesIO(content))
            else:
                df = pd.read_excel(io.BytesIO(content))
            
            # Create a new lead base for uploaded data
            base_id = f"base_{uuid.uuid4().hex[:12]}"
            new_base = LeadBaseInfo(
                id=base_id,
                name=f"Bulk Upload - {file.filename}",
                description=f"Automatically created from {file.filename}",
                category="bulk_upload",
                tags=["Upload"],
                source="file_upload",
                is_public=False,
                lead_count=0,
                valid_emails=0,
                invalid_emails=0,
                bounced_emails=0,
                last_verified=None,
                created_at=datetime.now(),
                updated_at=datetime.now(),
                created_by=current_user.id
            )
            
            LEAD_BASES[base_id] = new_base
            LEADS[base_id] = []
            
            # Process leads
            for index, row in df.iterrows():
                try:
                    email = str(row.get('email', '')).strip()
                    if not email or '@' not in email:
                        failed_imports += 1
                        continue
                    
                    lead_id = f"lead_{uuid.uuid4().hex[:12]}"
                    new_lead = LeadInfo(
                        id=lead_id,
                        base_id=base_id,
                        email=email,
                        first_name=str(row.get('first_name', '') or '').strip() or None,
                        last_name=str(row.get('last_name', '') or '').strip() or None,
                        company=str(row.get('company', '') or '').strip() or None,
                        position=str(row.get('position', '') or '').strip() or None,
                        phone=str(row.get('phone', '') or '').strip() or None,
                        website=str(row.get('website', '') or '').strip() or None,
                        industry=str(row.get('industry', '') or '').strip() or None,
                        location=str(row.get('location', '') or '').strip() or None,
                        status=LeadStatus.NEW,
                        source="bulk_upload",
                        notes=None,
                        custom_fields={},
                        email_valid=True,
                        last_contacted=None,
                        response_rate=0.0,
                        engagement_score=0,
                        created_at=datetime.now(),
                        updated_at=datetime.now()
                    )
                    
                    LEADS[base_id].append(new_lead)
                    successful_imports += 1
                    
                except Exception as e:
                    failed_imports += 1
                    errors.append({"row": index + 1, "error": str(e)})
            
            # Update base stats
            new_base.lead_count = successful_imports
            new_base.valid_emails = successful_imports
        
        processing_time = (datetime.now() - start_time).total_seconds()
        
        result = BulkUploadResult(
            success=True,
            message=f"Processed {material_type} upload",
            total_processed=successful_imports + failed_imports + duplicates_skipped,
            successful_imports=successful_imports,
            failed_imports=failed_imports,
            duplicates_skipped=duplicates_skipped,
            errors=errors[:50],
            processing_time=processing_time
        )
        
        # Log bulk upload
        await audit_system.log_enhanced_event(
            event_type=AuditEventType.BULK_UPLOAD,
            action="Bulk upload materials",
            resource="materials",
            details={
                "user_id": current_user.id,
                "material_type": material_type,
                "file_name": file.filename,
                "successful_imports": successful_imports,
                "failed_imports": failed_imports,
                "processing_time": processing_time
            }
        )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error bulk uploading materials: {e}")
        error_response = error_standardizer.standardize_error(
            status_code=500,
            message="Failed to bulk upload materials",
            exception=e
        )
        raise HTTPException(
            status_code=error_response.status_code,
            detail=error_response.message
        )

@router.delete("/materials/{material_type}/{item_id}")
async def delete_material(
    session_id: str,
    material_type: MaterialType,
    item_id: str,
    current_user: UserProfile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a specific material item
    """
    try:
        audit_system = await get_enhanced_audit_system()
        
        item_name = None
        
        if material_type == MaterialType.DOMAINS:
            if item_id not in DOMAINS:
                error_response = create_not_found_error("Domain", item_id)
                raise HTTPException(
                    status_code=error_response.status_code,
                    detail=error_response.message
                )
            item_name = DOMAINS[item_id].domain
            del DOMAINS[item_id]
            
        elif material_type in [MaterialType.EMAIL_BASES, MaterialType.LEAD_LISTS]:
            if item_id not in LEAD_BASES:
                error_response = create_not_found_error("Lead base", item_id)
                raise HTTPException(
                    status_code=error_response.status_code,
                    detail=error_response.message
                )
            item_name = LEAD_BASES[item_id].name
            del LEAD_BASES[item_id]
            if item_id in LEADS:
                del LEADS[item_id]
        
        # Log deletion
        await audit_system.log_enhanced_event(
            event_type=AuditEventType.MATERIAL_DELETED,
            action="Delete material",
            resource="material",
            level=AuditLevel.WARNING,
            details={
                "user_id": current_user.id,
                "material_type": material_type,
                "item_id": item_id,
                "item_name": item_name
            }
        )
        
        return {
            "success": True,
            "message": f"{material_type} {item_name} deleted successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting material: {e}")
        error_response = error_standardizer.standardize_error(
            status_code=500,
            message="Failed to delete material",
            exception=e
        )
        raise HTTPException(
            status_code=error_response.status_code,
            detail=error_response.message
        )

# Export Endpoints

@router.post("/export/{data_type}")
async def export_data(
    data_type: str,
    export_request: ExportRequest,
    background_tasks: BackgroundTasks,
    current_user: UserProfile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Export data in various formats (CSV, JSON, Excel)
    """
    try:
        audit_system = await get_enhanced_audit_system()
        
        # Validate data type
        valid_types = ["leads", "domains", "campaigns", "templates"]
        if data_type not in valid_types:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid data type. Must be one of: {valid_types}"
            )
        
        # Generate export ID
        export_id = f"export_{uuid.uuid4().hex[:12]}"
        
        # Start background export task
        background_tasks.add_task(
            process_data_export,
            export_id,
            data_type,
            export_request,
            current_user.id
        )
        
        # Log export request
        await audit_system.log_enhanced_event(
            event_type=AuditEventType.DATA_EXPORT,
            action="Data export requested",
            resource="data_export",
            details={
                "user_id": current_user.id,
                "export_id": export_id,
                "data_type": data_type,
                "format": export_request.format,
                "filters": export_request.filters
            }
        )
        
        return {
            "success": True,
            "message": "Export started",
            "export_id": export_id,
            "estimated_completion": datetime.now() + timedelta(minutes=5),
            "download_url": f"/api/v1/data/exports/{export_id}/download"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error starting export: {e}")
        error_response = error_standardizer.standardize_error(
            status_code=500,
            message="Failed to start export",
            exception=e
        )
        raise HTTPException(
            status_code=error_response.status_code,
            detail=error_response.message
        )

# Helper functions
async def validate_lead_emails(base_id: str, user_id: str):
    """Background task to validate email addresses"""
    logger.info(f"Validating emails for base {base_id}")

async def check_domain_configuration(domain_id: str, user_id: str):
    """Background task to check domain DNS configuration"""
    logger.info(f"Checking domain configuration for {domain_id}")

async def process_data_export(export_id: str, data_type: str, export_request: ExportRequest, user_id: str):
    """Background task to process data export"""
    logger.info(f"Processing export {export_id} for {data_type}")

# Analytics endpoints
@router.get("/analytics/summary")
async def get_data_analytics_summary(
    time_range: str = Query("30d", regex="^(7d|30d|90d|1y)$"),
    current_user: UserProfile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get comprehensive data analytics summary
    """
    try:
        audit_system = await get_enhanced_audit_system()
        
        # Calculate summary statistics
        total_lead_bases = len(LEAD_BASES)
        total_leads = sum(len(leads) for leads in LEADS.values())
        total_domains = len(DOMAINS)
        active_domains = len([d for d in DOMAINS.values() if d.status == DomainStatus.ACTIVE])
        
        # Calculate averages
        avg_leads_per_base = total_leads / total_lead_bases if total_lead_bases > 0 else 0
        avg_domain_reputation = sum(d.reputation_score for d in DOMAINS.values()) / total_domains if total_domains > 0 else 0
        
        summary = {
            "overview": {
                "total_lead_bases": total_lead_bases,
                "total_leads": total_leads,
                "total_domains": total_domains,
                "active_domains": active_domains,
                "avg_leads_per_base": round(avg_leads_per_base, 1),
                "avg_domain_reputation": round(avg_domain_reputation, 1)
            },
            "lead_statistics": {
                "by_status": {
                    status.value: sum(
                        len([lead for lead in leads if lead.status == status])
                        for leads in LEADS.values()
                    )
                    for status in LeadStatus
                },
                "recent_additions": 0,  # Would calculate based on time_range
                "email_validation_rate": 95.2  # Mock
            },
            "domain_statistics": {
                "by_status": {
                    status.value: len([d for d in DOMAINS.values() if d.status == status])
                    for status in DomainStatus
                },
                "reputation_distribution": {
                    "excellent": len([d for d in DOMAINS.values() if d.reputation_score >= 80]),
                    "good": len([d for d in DOMAINS.values() if 60 <= d.reputation_score < 80]),
                    "poor": len([d for d in DOMAINS.values() if d.reputation_score < 60])
                },
                "total_emails_sent": sum(d.emails_sent_today for d in DOMAINS.values())
            },
            "performance_metrics": {
                "data_quality_score": 87.5,  # Mock
                "processing_speed": "2.3 records/sec",  # Mock
                "storage_efficiency": "78%"  # Mock
            }
        }
        
        # Log analytics access
        await audit_system.log_enhanced_event(
            event_type=AuditEventType.DATA_ACCESS,
            action="Data analytics accessed",
            resource="analytics",
            details={
                "user_id": current_user.id,
                "time_range": time_range
            }
        )
        
        return summary
        
    except Exception as e:
        logger.error(f"Error getting analytics summary: {e}")
        error_response = error_standardizer.standardize_error(
            status_code=500,
            message="Failed to get analytics summary",
            exception=e
        )
        raise HTTPException(
            status_code=error_response.status_code,
            detail=error_response.message
        ) 