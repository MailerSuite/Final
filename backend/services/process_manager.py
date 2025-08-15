import asyncio
from contextlib import suppress

import psutil

from core.logger import get_logger
from schemas.process import ProcessInfo, ProcessStatus

logger = get_logger(__name__)


class _ManagedProcess:
    def __init__(self, name: str):
        self.name = name
        self.status: ProcessStatus = ProcessStatus.IDLE
        self.task: asyncio.Task | None = None
        self.logs: list[str] = []
        self.lock = asyncio.Lock()


class ProcessManager:
    """Manage simple background processes inside the API worker."""

    def __init__(self) -> None:
        self._process = psutil.Process()
        self.processes: dict[str, _ManagedProcess] = {
            "smtp_test_runner": _ManagedProcess("smtp_test_runner"),
            "imap_auto_retrieval": _ManagedProcess("imap_auto_retrieval"),
            "proxy_validation": _ManagedProcess("proxy_validation"),
        }

    async def list_processes(self) -> list[ProcessInfo]:
        """Return info for all managed processes."""
        cpu = self._process.cpu_percent(interval=None)
        mem = self._process.memory_percent()
        info = []
        for proc in self.processes.values():
            last_log = proc.logs[-1] if proc.logs else None
            info.append(
                ProcessInfo(
                    name=proc.name,
                    status=proc.status,
                    cpu_usage=cpu
                    if proc.status == ProcessStatus.RUNNING
                    else 0.0,
                    memory_usage=mem
                    if proc.status == ProcessStatus.RUNNING
                    else 0.0,
                    pid=(
                        self._process.pid
                        if proc.status == ProcessStatus.RUNNING
                        else None
                    ),
                    last_log=last_log,
                )
            )
        return info

    async def _runner(self, proc: _ManagedProcess) -> None:
        while True:
            proc.logs.append("running")
            if len(proc.logs) > 50:
                proc.logs.pop(0)
            await asyncio.sleep(1)

    async def start_process(self, name: str) -> ProcessInfo:
        if name not in self.processes:
            raise KeyError(name)
        proc = self.processes[name]
        async with proc.lock:
            if proc.status == ProcessStatus.RUNNING:
                raise ValueError("already running")
            proc.task = asyncio.create_task(self._runner(proc))
            proc.status = ProcessStatus.RUNNING
            proc.logs.append("started")
        logger.info("Started process %s", name)
        return (await self.list_processes())[list(self.processes).index(name)]

    async def stop_process(self, name: str) -> ProcessInfo:
        if name not in self.processes:
            raise KeyError(name)
        proc = self.processes[name]
        async with proc.lock:
            if proc.status != ProcessStatus.RUNNING:
                raise ValueError("not running")
            if proc.task:
                proc.task.cancel()
                with suppress(asyncio.CancelledError):
                    await proc.task
            proc.status = ProcessStatus.IDLE
            proc.task = None
            proc.logs.append("stopped")
        logger.info("Stopped process %s", name)
        return (await self.list_processes())[list(self.processes).index(name)]

    async def get_logs(self, name: str) -> list[str]:
        if name not in self.processes:
            raise KeyError(name)
        return self.processes[name].logs


process_manager = ProcessManager()
