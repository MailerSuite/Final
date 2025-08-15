"""
SOCKS Test Service - Service for SOCKS proxy testing
Moved from models/ to services/ for better organization
"""

import asyncio
from contextlib import suppress
from datetime import datetime

from core.logger import get_logger

logger = get_logger(__name__)


class SocksTestState:
    IDLE = "idle"
    RUNNING = "running"
    STOPPED = "stopped"


class SocksConnectionLog:
    def __init__(
        self,
        timestamp: datetime,
        latency: float,
        success: bool,
        error: str | None = None,
    ):
        self.timestamp = timestamp
        self.latency = latency
        self.success = success
        self.error = error


class SocksTestMetrics:
    def __init__(self):
        self.state = SocksTestState.IDLE
        self.attempts = 0
        self.successes = 0
        self.failures = 0
        self.start_time: datetime | None = None
        self.stop_time: datetime | None = None
        self.stop_reason: str | None = None
        self.logs = []

    @property
    def error_rate(self) -> float:
        return self.failures / self.attempts * 100 if self.attempts else 0.0

    @property
    def success_rate(self) -> float:
        return self.successes / self.attempts * 100 if self.attempts else 0.0

    @property
    def elapsed(self) -> float:
        if not self.start_time:
            return 0.0
        end = self.stop_time or datetime.utcnow()
        return (end - self.start_time).total_seconds()


class SocksTestService:
    """Manage running SOCKS proxy connection tests."""

    def __init__(self) -> None:
        self.metrics = SocksTestMetrics()
        self._task: asyncio.Task | None = None
        self._stop_event = asyncio.Event()

    async def start(
        self,
        host: str,
        port: int,
        proxy_type: str = "socks5",
        target_host: str = "google.com",
        target_port: int = 80,
        max_concurrent: int = 10,
    ) -> None:
        if self.metrics.state == SocksTestState.RUNNING:
            raise RuntimeError("test already running")

        self.metrics = SocksTestMetrics()
        self.metrics.state = SocksTestState.RUNNING
        self.metrics.start_time = datetime.utcnow()
        self._stop_event.clear()
        self._task = asyncio.create_task(
            self._runner(
                host,
                port,
                proxy_type,
                target_host,
                target_port,
                max_concurrent,
            )
        )

    async def stop(self) -> None:
        if self.metrics.state != SocksTestState.RUNNING:
            return
        self.metrics.stop_reason = self.metrics.stop_reason or "manual"
        self._stop_event.set()
        if self._task:
            with suppress(asyncio.CancelledError):
                await self._task
        self.metrics.state = SocksTestState.STOPPED
        self.metrics.stop_time = datetime.utcnow()

    async def _runner(
        self,
        host: str,
        port: int,
        proxy_type: str,
        target_host: str,
        target_port: int,
        max_concurrent: int,
    ) -> None:
        semaphore = asyncio.Semaphore(max_concurrent)

        async def worker() -> None:
            while not self._stop_event.is_set():
                async with semaphore:
                    success, latency, error = await self._check_connection(
                        host, port, proxy_type, target_host, target_port
                    )
                    self.metrics.attempts += 1
                    if success:
                        self.metrics.successes += 1
                    else:
                        self.metrics.failures += 1

                    log = SocksConnectionLog(
                        datetime.utcnow(), latency, success, error
                    )
                    self.metrics.logs.append(log)

                    # Keep only last 100 logs
                    if len(self.metrics.logs) > 100:
                        self.metrics.logs.pop(0)

                await asyncio.sleep(0.1)

        tasks = [asyncio.create_task(worker()) for _ in range(max_concurrent)]

        try:
            await asyncio.gather(*tasks)
        except asyncio.CancelledError:
            self.metrics.stop_reason = self.metrics.stop_reason or "manual"
        finally:
            # Cancel all workers
            for task in tasks:
                if not task.done():
                    task.cancel()
            await asyncio.gather(*tasks, return_exceptions=True)
            self.metrics.state = SocksTestState.STOPPED
            self.metrics.stop_time = datetime.utcnow()

    async def _check_connection(
        self,
        host: str,
        port: int,
        proxy_type: str,
        target_host: str,
        target_port: int,
    ) -> tuple[bool, float, str | None]:
        try:
            start_time = datetime.utcnow()
            # Mock SOCKS connection
            await asyncio.sleep(0.1)
            latency = (datetime.utcnow() - start_time).total_seconds()
            return True, latency, None
        except Exception as exc:
            return False, 0.0, str(exc)

    def status(self) -> dict:
        return {
            "state": self.metrics.state,
            "attempts": self.metrics.attempts,
            "successes": self.metrics.successes,
            "failures": self.metrics.failures,
            "error_rate": self.metrics.error_rate,
            "success_rate": self.metrics.success_rate,
            "elapsed": self.metrics.elapsed,
            "stop_reason": self.metrics.stop_reason,
        }


socks_test_service = SocksTestService()
