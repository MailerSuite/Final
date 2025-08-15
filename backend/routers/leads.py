from uuid import UUID

from fastapi import APIRouter, Depends, File, Query, UploadFile

from core.database import get_db
from core.logger import get_logger
from routers.auth import get_current_user
from schemas.leads import (
    LeadBaseCreate,
    LeadBaseResponse,
    LeadBaseUpdate,
    LeadEntryList,
    LeadEntryResponse,
    LeadEntryUpdate,
    LeadEntryCursorPage,
    LeadEntryCreateInBase,
    UploadResult,
)
from services.lead_service import LeadService

logger = get_logger(__name__)
router = APIRouter()


def get_lead_service(db=Depends(get_db)) -> LeadService:
    return LeadService(db)


@router.get("/lead-bases/", response_model=list[LeadBaseResponse])
async def get_lead_bases(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(
        100, ge=1, le=1000, description="Maximum number of records"
    ),
    search: str | None = Query(None, description="Search by name"),
    service: LeadService = Depends(get_lead_service),
    current_user=Depends(get_current_user),
):
    return await service.get_lead_bases(
        owner_id=current_user.id, skip=skip, limit=limit, search=search
    )


@router.get("/lead-bases/{base_id}", response_model=LeadBaseResponse)
async def get_lead_base(
    base_id: UUID,
    service: LeadService = Depends(get_lead_service),
    current_user=Depends(get_current_user),
):
    return await service.get_lead_base(base_id, current_user.id)


@router.post("/lead-bases/", response_model=LeadBaseResponse, status_code=201)
async def create_lead_base(
    base_data: LeadBaseCreate,
    service: LeadService = Depends(get_lead_service),
    current_user=Depends(get_current_user),
):
    """Create a new lead base."""
    return await service.create_lead_base(base_data, current_user.id)


@router.put("/lead-bases/{base_id}", response_model=LeadBaseResponse)
async def update_lead_base(
    base_id: UUID,
    base_data: LeadBaseUpdate,
    service: LeadService = Depends(get_lead_service),
    current_user=Depends(get_current_user),
):
    """Update a lead base."""
    return await service.update_lead_base(
        base_id, base_data, current_user.id
    )


@router.delete("/lead-bases/{base_id}")
async def delete_lead_base(
    base_id: UUID,
    service: LeadService = Depends(get_lead_service),
    current_user=Depends(get_current_user),
):
    """Delete a lead base."""
    return await service.delete_lead_base(base_id, current_user.id)


@router.post("/lead-bases/{base_id}/upload", response_model=UploadResult)
async def upload_csv_to_base(
    base_id: UUID,
    file: UploadFile = File(..., description="CSV or TXT file with leads"),
    service: LeadService = Depends(get_lead_service),
    current_user=Depends(get_current_user),
):
    return await service.upload_csv(base_id, file, current_user.id)


@router.get("/lead-bases/{base_id}/leads/", response_model=LeadEntryList)
async def get_leads_in_base(
    base_id: UUID,
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(
        50, ge=1, le=500, description="Maximum number of records"
    ),
    search: str | None = Query(
        None, description="Search by email, first name or last name"
    ),
    service: LeadService = Depends(get_lead_service),
    current_user=Depends(get_current_user),
):
    return await service.get_leads(
        base_id=base_id,
        owner_id=current_user.id,
        skip=skip,
        limit=limit,
        search=search,
    )


@router.get("/lead-bases/{base_id}/leads/cursor", response_model=LeadEntryCursorPage)
async def get_leads_cursor(
    base_id: UUID,
    cursor: str | None = Query(None, description="Cursor token from previous page"),
    limit: int = Query(1000, ge=1, le=5000, description="Max items per page"),
    search: str | None = Query(None, description="Search by email or name"),
    service: LeadService = Depends(get_lead_service),
    current_user=Depends(get_current_user),
):
    return await service.get_leads_cursor(
        base_id=base_id,
        owner_id=current_user.id,
        cursor=cursor,
        limit=limit,
        search=search,
    )


@router.get("/leads/{lead_id}", response_model=LeadEntryResponse)
async def get_lead_by_id(
    lead_id: UUID,
    service: LeadService = Depends(get_lead_service),
    current_user=Depends(get_current_user),
):
    """Retrieve lead information."""
    return await service.get_lead(lead_id, current_user.id)


@router.post("/lead-bases/{base_id}/leads", response_model=LeadEntryResponse, status_code=201)
async def create_lead_in_base(
    base_id: UUID,
    data: LeadEntryCreateInBase,
    service: LeadService = Depends(get_lead_service),
    current_user=Depends(get_current_user),
):
    """Create a single lead within a base (fast path)."""
    return await service.create_lead_in_base(base_id, current_user.id, data)


@router.put("/leads/{lead_id}", response_model=LeadEntryResponse)
async def update_lead_entry(
    lead_id: UUID,
    lead_data: LeadEntryUpdate,
    service: LeadService = Depends(get_lead_service),
    current_user=Depends(get_current_user),
):
    """Update lead information."""
    return await service.update_lead(lead_id, lead_data, current_user.id)


@router.delete("/leads/{lead_id}")
async def delete_lead_entry(
    lead_id: UUID,
    service: LeadService = Depends(get_lead_service),
    current_user=Depends(get_current_user),
):
    """Delete a lead."""
    return await service.delete_lead(lead_id, current_user.id)


@router.post("/leads/{lead_id}/validate-email")
async def validate_single_lead_email(
    lead_id: UUID,
    service: LeadService = Depends(get_lead_service),
    current_user=Depends(get_current_user),
):
    return await service.validate_lead_email(lead_id, current_user.id)
