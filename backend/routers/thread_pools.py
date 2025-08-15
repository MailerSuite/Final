
from fastapi import APIRouter, Depends, HTTPException

from core.database import get_db
from schemas.thread_pool import (
    ThreadPoolCreate,
    ThreadPoolResponse,
    ThreadPoolUpdate,
)
from services.thread_pool_service import ThreadPoolService

router = APIRouter()


def get_service(db=Depends(get_db)) -> ThreadPoolService:
    return ThreadPoolService(db)


@router.get("/", response_model=list[ThreadPoolResponse])
async def list_pools(service: ThreadPoolService = Depends(get_service)):
    pools = await service.list_pools()
    return [ThreadPoolResponse.model_validate(p) for p in pools]


@router.post("/", response_model=ThreadPoolResponse, status_code=201)
async def create_pool(
    pool: ThreadPoolCreate, service: ThreadPoolService = Depends(get_service)
):
    pool_obj = await service.create_pool(pool)
    return ThreadPoolResponse.model_validate(pool_obj)


@router.put("/{pool_id}/", response_model=ThreadPoolResponse)
async def update_pool(
    pool_id: str,
    pool: ThreadPoolUpdate,
    service: ThreadPoolService = Depends(get_service),
):
    try:
        pool_obj = await service.update_pool(pool_id, pool)
    except HTTPException:
        raise
    return ThreadPoolResponse.model_validate(pool_obj)


@router.delete("/{pool_id}/")
async def delete_pool(
    pool_id: str, service: ThreadPoolService = Depends(get_service)
):
    deleted = await service.delete_pool(pool_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Thread pool not found")
    return {"message": "Thread pool deleted"}
