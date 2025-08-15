from uuid import UUID

from fastapi import APIRouter, HTTPException

from schemas.common import MessageResponse
from schemas.stop_conditions import (
    EvaluateMetrics,
    EvaluateResponse,
    StopCondition,
    StopConditionCreate,
    StopConditionUpdate,
)
from services.stop_condition_service import stop_condition_service
from services.thread_pool_service import global_thread_pool

router = APIRouter()


@router.get(
    "/stop-conditions/",
    response_model=list[StopCondition],
    summary="List stop conditions",
    responses={200: {"description": "List of configured conditions"}},
)
async def list_stop_conditions() -> list[StopCondition]:
    return stop_condition_service.list()


@router.post(
    "/stop-conditions/",
    response_model=StopCondition,
    summary="Create stop condition",
    responses={200: {"description": "Condition created"}},
)
async def create_stop_condition(cond: StopConditionCreate) -> StopCondition:
    return stop_condition_service.create(cond)


@router.put(
    "/stop-conditions/{condition_id}",
    response_model=StopCondition,
    summary="Update stop condition",
    responses={
        200: {"description": "Condition updated"},
        404: {"description": "Not found"},
    },
)
async def update_stop_condition(
    condition_id: UUID, cond: StopConditionUpdate
) -> StopCondition:
    try:
        return stop_condition_service.update(condition_id, cond)
    except KeyError:
        raise HTTPException(status_code=404, detail="Condition not found")


@router.delete(
    "/stop-conditions/{condition_id}",
    response_model=MessageResponse,
    summary="Delete stop condition",
    responses={
        200: {"description": "Deleted"},
        404: {"description": "Not found"},
    },
)
async def delete_stop_condition(condition_id: UUID) -> MessageResponse:
    try:
        stop_condition_service.delete(condition_id)
    except KeyError:
        raise HTTPException(status_code=404, detail="Condition not found")
    return MessageResponse(message="deleted")


@router.post(
    "/evaluate-stop",
    response_model=EvaluateResponse,
    summary="Evaluate stop conditions",
    responses={200: {"description": "Evaluation result"}},
)
async def evaluate_stop(metrics: EvaluateMetrics) -> EvaluateResponse:
    stop, reason = stop_condition_service.evaluate(metrics)
    return EvaluateResponse(stop=stop, reason=reason)


@router.post("/smtp/checks/stop")
async def stop_smtp_checks(token: str) -> MessageResponse:
    halted = await global_thread_pool.cancel(token)
    return MessageResponse(message=str(halted))
