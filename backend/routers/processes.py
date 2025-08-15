
from fastapi import APIRouter, Depends, HTTPException

from schemas.process import ProcessInfo
from services.process_manager import ProcessManager, process_manager

router = APIRouter()


def get_manager() -> ProcessManager:
    return process_manager


@router.get(
    "/",
    response_model=list[ProcessInfo],
    summary="List all processes",
    description="Return all managed background processes with their current status.",
)
async def list_processes(
    manager: ProcessManager = Depends(get_manager),
) -> list[ProcessInfo]:
    """Return all managed background processes with their current status."""
    return await manager.list_processes()


@router.post(
    "/{name}/start",
    response_model=ProcessInfo,
    summary="Start process",
    description="Start the named background process.",
)
async def start_process(
    name: str, manager: ProcessManager = Depends(get_manager)
) -> ProcessInfo:
    """Start the named background process."""
    try:
        return await manager.start_process(name)
    except KeyError:
        raise HTTPException(status_code=404, detail="Process not found")
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.post(
    "/{name}/stop",
    response_model=ProcessInfo,
    summary="Stop process",
    description="Stop the named background process.",
)
async def stop_process(
    name: str, manager: ProcessManager = Depends(get_manager)
) -> ProcessInfo:
    """Stop the named background process."""
    try:
        return await manager.stop_process(name)
    except KeyError:
        raise HTTPException(status_code=404, detail="Process not found")
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get(
    "/{name}/logs",
    response_model=list[str],
    summary="Get process logs",
    description="Return recent logs for the specified background process.",
)
async def get_logs(
    name: str, manager: ProcessManager = Depends(get_manager)
) -> list[str]:
    """Return recent logs for the specified background process."""
    try:
        return await manager.get_logs(name)
    except KeyError:
        raise HTTPException(status_code=404, detail="Process not found")
