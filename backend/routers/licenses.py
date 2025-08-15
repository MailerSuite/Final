from fastapi import APIRouter, Depends, HTTPException

from core.database import get_db
from routers.auth import get_current_user
from schemas.licenses import LicenseCreate, LicenseResponse
from services.license_service import LicenseService

router = APIRouter()


def get_service(db=Depends(get_db)) -> LicenseService:
    return LicenseService(db)


@router.post("/", response_model=LicenseResponse, status_code=201)
async def assign_license(
    data: LicenseCreate,
    service: LicenseService = Depends(get_service),
    current_user=Depends(get_current_user),
):
    lic = await service.assign_plan(
        current_user.id, str(data.plan_id), data.is_trial
    )
    return LicenseResponse.model_validate(lic)


@router.get("/me", response_model=LicenseResponse)
async def get_my_license(
    service: LicenseService = Depends(get_service),
    current_user=Depends(get_current_user),
):
    lic = await service.get_user_license(current_user.id)
    if not lic:
        raise HTTPException(status_code=404, detail="License not found")
    return LicenseResponse.model_validate(lic)
