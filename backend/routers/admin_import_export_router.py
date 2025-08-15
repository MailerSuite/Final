"""
Admin Import/Export Router
Manages data import and export operations for administrators
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File, BackgroundTasks
from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any, Union
from datetime import datetime
from enum import Enum
import logging
import uuid
import json
import csv
import io
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, insert, update, delete, and_, or_, func

from core.database import async_session
from core.error_standardization import error_standardizer, create_not_found_error
from core.enhanced_audit_system import get_enhanced_audit_system, AuditEventType, AuditLevel
from core.monitoring import performance_monitor
from routers.consolidated.auth_router import get_current_user, UserProfile
from schemas.common import MessageResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/admin", tags=["Admin Extensions"])

# Pydantic models for import/export
class DataType(str, Enum):
    USERS = "users"
    CAMPAIGNS = "campaigns"
    TEMPLATES = "templates"
    SETTINGS = "settings"
    ANALYTICS = "analytics"
    DATABASE = "database"

class JobStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class ExportFormat(str, Enum):
    CSV = "csv"
    JSON = "json"
    XML = "xml"
    SQL = "sql"
    XLSX = "xlsx"

class ImportJobCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    type: DataType
    template_id: Optional[str] = None
    validate_data: bool = True
    create_backup: bool = True
    skip_duplicates: bool = True
    field_mappings: Dict[str, str] = {}

class ExportJobCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    type: DataType
    format: ExportFormat
    include_headers: bool = True
    compression: bool = False
    encryption: bool = False
    date_range_start: Optional[datetime] = None
    date_range_end: Optional[datetime] = None
    filters: Dict[str, Any] = {}

class ImportJobResponse(BaseModel):
    id: str
    name: str
    type: DataType
    status: JobStatus
    progress: float
    file_name: str
    file_size: int
    records_processed: int
    records_total: int
    created_at: datetime
    completed_at: Optional[datetime]
    created_by: str
    error_message: Optional[str]
    validation_errors: List[str] = []

class ExportJobResponse(BaseModel):
    id: str
    name: str
    type: DataType
    format: ExportFormat
    status: JobStatus
    progress: float
    file_path: Optional[str]
    file_size: Optional[int]
    records_exported: int
    created_at: datetime
    completed_at: Optional[datetime]
    created_by: str
    filters: Dict[str, Any]
    compression: bool
    encryption: bool

class DataTemplate(BaseModel):
    id: str
    name: str
    type: DataType
    description: str
    required_fields: List[str]
    optional_fields: List[str]
    field_mappings: Dict[str, str]
    validation_rules: Dict[str, Any]
    example_data: List[Dict[str, Any]]

class ImportStatsResponse(BaseModel):
    total_imports: int
    successful_imports: int
    failed_imports: int
    records_imported: int
    last_import_date: Optional[datetime]

class ExportStatsResponse(BaseModel):
    total_exports: int
    successful_exports: int
    failed_exports: int
    records_exported: int
    last_export_date: Optional[datetime]

# Dependency to verify admin access
async def get_current_admin_user(current_user: UserProfile = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user

@router.get("/import/stats", response_model=ImportStatsResponse)
async def get_import_stats(
    current_admin: UserProfile = Depends(get_current_admin_user),
    db: AsyncSession = Depends(async_session)
):
    """Get import statistics"""
    try:
        # Mock implementation - replace with actual database queries
        stats = ImportStatsResponse(
            total_imports=45,
            successful_imports=38,
            failed_imports=7,
            records_imported=12547,
            last_import_date=datetime.now()
        )
        
        return stats
        
    except Exception as e:
        logger.error(f"Error fetching import stats: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch import statistics"
        )

@router.get("/export/stats", response_model=ExportStatsResponse)
async def get_export_stats(
    current_admin: UserProfile = Depends(get_current_admin_user),
    db: AsyncSession = Depends(async_session)
):
    """Get export statistics"""
    try:
        # Mock implementation - replace with actual database queries
        stats = ExportStatsResponse(
            total_exports=67,
            successful_exports=61,
            failed_exports=6,
            records_exported=28934,
            last_export_date=datetime.now()
        )
        
        return stats
        
    except Exception as e:
        logger.error(f"Error fetching export stats: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch export statistics"
        )

@router.get("/import/jobs", response_model=List[ImportJobResponse])
async def list_import_jobs(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    status_filter: Optional[JobStatus] = None,
    type_filter: Optional[DataType] = None,
    current_admin: UserProfile = Depends(get_current_admin_user),
    db: AsyncSession = Depends(async_session)
):
    """List import jobs with filtering and pagination"""
    try:
        # Mock implementation - replace with actual database queries
        mock_jobs = [
            ImportJobResponse(
                id=str(uuid.uuid4()),
                name="User Data Import - January 2024",
                type=DataType.USERS,
                status=JobStatus.COMPLETED,
                progress=100.0,
                file_name="users_january_2024.csv",
                file_size=2048576,
                records_processed=1250,
                records_total=1250,
                created_at=datetime.now(),
                completed_at=datetime.now(),
                created_by=current_admin.email,
                error_message=None,
                validation_errors=[]
            ),
            ImportJobResponse(
                id=str(uuid.uuid4()),
                name="Campaign Templates Import",
                type=DataType.TEMPLATES,
                status=JobStatus.RUNNING,
                progress=65.0,
                file_name="email_templates.json",
                file_size=512000,
                records_processed=13,
                records_total=20,
                created_at=datetime.now(),
                completed_at=None,
                created_by=current_admin.email,
                error_message=None,
                validation_errors=[]
            )
        ]
        
        # Apply filters
        filtered_jobs = mock_jobs
        if status_filter:
            filtered_jobs = [j for j in filtered_jobs if j.status == status_filter]
        if type_filter:
            filtered_jobs = [j for j in filtered_jobs if j.type == type_filter]
        
        return filtered_jobs[skip:skip + limit]
        
    except Exception as e:
        logger.error(f"Error listing import jobs: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list import jobs"
        )

@router.get("/export/jobs", response_model=List[ExportJobResponse])
async def list_export_jobs(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    status_filter: Optional[JobStatus] = None,
    type_filter: Optional[DataType] = None,
    current_admin: UserProfile = Depends(get_current_admin_user),
    db: AsyncSession = Depends(async_session)
):
    """List export jobs with filtering and pagination"""
    try:
        # Mock implementation - replace with actual database queries
        mock_jobs = [
            ExportJobResponse(
                id=str(uuid.uuid4()),
                name="Monthly User Report",
                type=DataType.USERS,
                format=ExportFormat.XLSX,
                status=JobStatus.COMPLETED,
                progress=100.0,
                file_path="/exports/users_report_january_2024.xlsx",
                file_size=3145728,
                records_exported=2847,
                created_at=datetime.now(),
                completed_at=datetime.now(),
                created_by=current_admin.email,
                filters={"active": True, "plan": "premium"},
                compression=True,
                encryption=False
            ),
            ExportJobResponse(
                id=str(uuid.uuid4()),
                name="Campaign Analytics Export",
                type=DataType.ANALYTICS,
                format=ExportFormat.JSON,
                status=JobStatus.RUNNING,
                progress=45.0,
                file_path=None,
                file_size=None,
                records_exported=234,
                created_at=datetime.now(),
                completed_at=None,
                created_by=current_admin.email,
                filters={"date_range": "2024-01"},
                compression=False,
                encryption=True
            )
        ]
        
        # Apply filters
        filtered_jobs = mock_jobs
        if status_filter:
            filtered_jobs = [j for j in filtered_jobs if j.status == status_filter]
        if type_filter:
            filtered_jobs = [j for j in filtered_jobs if j.type == type_filter]
        
        return filtered_jobs[skip:skip + limit]
        
    except Exception as e:
        logger.error(f"Error listing export jobs: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list export jobs"
        )

@router.post("/import/jobs", response_model=ImportJobResponse)
async def create_import_job(
    job_data: ImportJobCreate,
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = None,
    current_admin: UserProfile = Depends(get_current_admin_user),
    db: AsyncSession = Depends(async_session)
):
    """Create a new import job"""
    try:
        # Validate file type
        allowed_types = ["text/csv", "application/json", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"]
        if file.content_type not in allowed_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unsupported file type"
            )
        
        # Read file content for validation
        content = await file.read()
        file_size = len(content)
        
        # Mock record count estimation
        if file.content_type == "text/csv":
            # Count lines for CSV
            records_total = len(content.decode().split('\n')) - 1  # Exclude header
        else:
            # Mock count for other formats
            records_total = 100
        
        # Create import job
        import_job = ImportJobResponse(
            id=str(uuid.uuid4()),
            name=job_data.name,
            type=job_data.type,
            status=JobStatus.PENDING,
            progress=0.0,
            file_name=file.filename or "uploaded_file",
            file_size=file_size,
            records_processed=0,
            records_total=records_total,
            created_at=datetime.now(),
            completed_at=None,
            created_by=current_admin.email,
            error_message=None,
            validation_errors=[]
        )
        
        # Add background task to process import
        background_tasks.add_task(process_import_job, import_job.id, content, job_data)
        
        logger.info(f"Created import job {import_job.id} by {current_admin.email}")
        return import_job
        
    except Exception as e:
        logger.error(f"Error creating import job: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create import job"
        )

@router.post("/export/jobs", response_model=ExportJobResponse)
async def create_export_job(
    job_data: ExportJobCreate,
    background_tasks: BackgroundTasks,
    current_admin: UserProfile = Depends(get_current_admin_user),
    db: AsyncSession = Depends(async_session)
):
    """Create a new export job"""
    try:
        # Create export job
        export_job = ExportJobResponse(
            id=str(uuid.uuid4()),
            name=job_data.name,
            type=job_data.type,
            format=job_data.format,
            status=JobStatus.PENDING,
            progress=0.0,
            file_path=None,
            file_size=None,
            records_exported=0,
            created_at=datetime.now(),
            completed_at=None,
            created_by=current_admin.email,
            filters=job_data.filters,
            compression=job_data.compression,
            encryption=job_data.encryption
        )
        
        # Add background task to process export
        background_tasks.add_task(process_export_job, export_job.id, job_data)
        
        logger.info(f"Created export job {export_job.id} by {current_admin.email}")
        return export_job
        
    except Exception as e:
        logger.error(f"Error creating export job: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create export job"
        )

@router.get("/import/jobs/{job_id}", response_model=ImportJobResponse)
async def get_import_job(
    job_id: str,
    current_admin: UserProfile = Depends(get_current_admin_user),
    db: AsyncSession = Depends(async_session)
):
    """Get a specific import job by ID"""
    try:
        # Mock implementation - replace with actual database query
        job = ImportJobResponse(
            id=job_id,
            name="User Data Import",
            type=DataType.USERS,
            status=JobStatus.COMPLETED,
            progress=100.0,
            file_name="users.csv",
            file_size=1024000,
            records_processed=500,
            records_total=500,
            created_at=datetime.now(),
            completed_at=datetime.now(),
            created_by=current_admin.email,
            error_message=None,
            validation_errors=[]
        )
        
        return job
        
    except Exception as e:
        logger.error(f"Error fetching import job {job_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Import job not found"
        )

@router.get("/export/jobs/{job_id}", response_model=ExportJobResponse)
async def get_export_job(
    job_id: str,
    current_admin: UserProfile = Depends(get_current_admin_user),
    db: AsyncSession = Depends(async_session)
):
    """Get a specific export job by ID"""
    try:
        # Mock implementation - replace with actual database query
        job = ExportJobResponse(
            id=job_id,
            name="User Data Export",
            type=DataType.USERS,
            format=ExportFormat.CSV,
            status=JobStatus.COMPLETED,
            progress=100.0,
            file_path="/exports/users_export.csv",
            file_size=2048000,
            records_exported=1000,
            created_at=datetime.now(),
            completed_at=datetime.now(),
            created_by=current_admin.email,
            filters={},
            compression=False,
            encryption=False
        )
        
        return job
        
    except Exception as e:
        logger.error(f"Error fetching export job {job_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Export job not found"
        )

@router.delete("/import/jobs/{job_id}", response_model=MessageResponse)
async def cancel_import_job(
    job_id: str,
    current_admin: UserProfile = Depends(get_current_admin_user),
    db: AsyncSession = Depends(async_session)
):
    """Cancel or delete an import job"""
    try:
        # Mock implementation - replace with actual job cancellation logic
        logger.info(f"Cancelled import job {job_id} by {current_admin.email}")
        
        return MessageResponse(message="Import job cancelled successfully")
        
    except Exception as e:
        logger.error(f"Error cancelling import job {job_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to cancel import job"
        )

@router.delete("/export/jobs/{job_id}", response_model=MessageResponse)
async def cancel_export_job(
    job_id: str,
    current_admin: UserProfile = Depends(get_current_admin_user),
    db: AsyncSession = Depends(async_session)
):
    """Cancel or delete an export job"""
    try:
        # Mock implementation - replace with actual job cancellation logic
        logger.info(f"Cancelled export job {job_id} by {current_admin.email}")
        
        return MessageResponse(message="Export job cancelled successfully")
        
    except Exception as e:
        logger.error(f"Error cancelling export job {job_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to cancel export job"
        )

@router.get("/templates", response_model=List[DataTemplate])
async def list_data_templates(
    type_filter: Optional[DataType] = None,
    current_admin: UserProfile = Depends(get_current_admin_user),
    db: AsyncSession = Depends(async_session)
):
    """List available data templates for import operations"""
    try:
        # Mock implementation - replace with actual database query
        templates = [
            DataTemplate(
                id=str(uuid.uuid4()),
                name="User Import Template",
                type=DataType.USERS,
                description="Standard template for importing user data",
                required_fields=["email", "name", "plan_id"],
                optional_fields=["phone", "company", "country"],
                field_mappings={"email": "email_address", "name": "full_name"},
                validation_rules={"email": {"type": "email", "required": True}},
                example_data=[{"email": "user@example.com", "name": "John Doe", "plan_id": "premium"}]
            ),
            DataTemplate(
                id=str(uuid.uuid4()),
                name="Campaign Import Template",
                type=DataType.CAMPAIGNS,
                description="Template for importing email campaigns",
                required_fields=["name", "subject", "content"],
                optional_fields=["tags", "scheduled_at"],
                field_mappings={"name": "campaign_name", "subject": "email_subject"},
                validation_rules={"name": {"type": "string", "required": True}},
                example_data=[{"name": "Welcome Campaign", "subject": "Welcome!", "content": "Hello..."}]
            )
        ]
        
        if type_filter:
            templates = [t for t in templates if t.type == type_filter]
        
        return templates
        
    except Exception as e:
        logger.error(f"Error listing data templates: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list data templates"
        )

@router.get("/export/jobs/{job_id}/download")
async def download_export_file(
    job_id: str,
    current_admin: UserProfile = Depends(get_current_admin_user),
    db: AsyncSession = Depends(async_session)
):
    """Download the exported file"""
    try:
        # Mock implementation - replace with actual file serving
        from fastapi.responses import FileResponse
        
        # In a real implementation, you would:
        # 1. Fetch the job from database
        # 2. Verify the file exists
        # 3. Return the file
        
        # For now, return a mock response
        return {"download_url": f"/api/v1/admin/files/export_{job_id}.csv"}
        
    except Exception as e:
        logger.error(f"Error downloading export file {job_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to download export file"
        )

# Background task functions
async def process_import_job(job_id: str, file_content: bytes, job_data: ImportJobCreate):
    """Background task to process import job"""
    try:
        # Mock processing logic
        logger.info(f"Processing import job {job_id}")
        # In a real implementation, you would:
        # 1. Parse the file content
        # 2. Validate data against template
        # 3. Insert records into database
        # 4. Update job progress
        # 5. Handle errors and validation issues
        
    except Exception as e:
        logger.error(f"Error processing import job {job_id}: {str(e)}")

async def process_export_job(job_id: str, job_data: ExportJobCreate):
    """Background task to process export job"""
    try:
        # Mock processing logic
        logger.info(f"Processing export job {job_id}")
        # In a real implementation, you would:
        # 1. Query data based on filters
        # 2. Format data according to export format
        # 3. Apply compression/encryption if requested
        # 4. Save file to storage
        # 5. Update job progress
        
    except Exception as e:
        logger.error(f"Error processing export job {job_id}: {str(e)}")