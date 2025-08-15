from uuid import UUID

from fastapi import APIRouter, HTTPException

from schemas.common import MessageResponse
from schemas.handshake import Handshake, HandshakeCreate, HandshakeUpdate
from services.handshake_service import handshake_service

router = APIRouter()


@router.get(
    "/handshakes/",
    response_model=list[Handshake],
    summary="List handshake configs",
    responses={200: {"description": "List of stored handshakes"}},
)
async def list_handshakes() -> list[Handshake]:
    return handshake_service.list()


@router.get(
    "/handshakes/{handshake_id}",
    response_model=Handshake,
    summary="Get handshake config",
    responses={
        200: {"description": "Handshake details"},
        404: {"description": "Not found"},
    },
)
async def get_handshake(handshake_id: UUID) -> Handshake:
    try:
        return handshake_service.get(handshake_id)
    except KeyError:
        raise HTTPException(status_code=404, detail="Handshake not found")


@router.post(
    "/handshakes/",
    response_model=Handshake,
    summary="Create handshake config",
    responses={200: {"description": "Created"}},
)
async def create_handshake(data: HandshakeCreate) -> Handshake:
    return handshake_service.create(data)


@router.put(
    "/handshakes/{handshake_id}",
    response_model=Handshake,
    summary="Update handshake config",
    responses={
        200: {"description": "Updated"},
        404: {"description": "Not found"},
    },
)
async def update_handshake(
    handshake_id: UUID, data: HandshakeUpdate
) -> Handshake:
    try:
        return handshake_service.update(handshake_id, data)
    except KeyError:
        raise HTTPException(status_code=404, detail="Handshake not found")


@router.delete(
    "/handshakes/{handshake_id}",
    response_model=MessageResponse,
    summary="Delete handshake config",
    responses={
        200: {"description": "Deleted"},
        404: {"description": "Not found"},
    },
)
async def delete_handshake(handshake_id: UUID) -> MessageResponse:
    try:
        handshake_service.delete(handshake_id)
    except KeyError:
        raise HTTPException(status_code=404, detail="Handshake not found")
    return MessageResponse(message="deleted")
