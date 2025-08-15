from enum import Enum

from pydantic import BaseModel


class ProcessStatus(str, Enum):
    """Status of a managed background process."""

    IDLE = "IDLE"
    RUNNING = "RUNNING"
    VALIDATING = "VALIDATING"
    STOPPED = "STOPPED"


class ProcessInfo(BaseModel):
    """Information about a background process."""

    name: str
    status: ProcessStatus
    cpu_usage: float
    memory_usage: float
    pid: int | None = None
    last_log: str | None = None
