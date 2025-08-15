"""
SMTP Test Service - Service for SMTP handshake testing
Moved from models/ to services/ for better organization
"""

import asyncio
from contextlib import suppress
from datetime import datetime

from core.logger import get_logger

logger = get_logger(__name__)


class SMTPTestState:
    IDLE = "idle"
    RUNNING = "running"
    STOPPED = "stopped"


class SMTPHandshakeLog:
    def __init__(self, timestamp: datetime, success: bool, response: str):
        self.timestamp = timestamp
        self.success = success
        self.response = response


class SMTPTestMetrics:
    def __init__(self):
        self.state = SMTPTestState.IDLE
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


class SMTPTestService:
    """Manage running SMTP handshake tests."""

    def __init__(self) -> None:
        self.metrics = SMTPTestMetrics()
        self._task: asyncio.Task | None = None
        self._stop_event = asyncio.Event()

    async def start(self, server: str, port: int) -> None:
        if self.metrics.state == SMTPTestState.RUNNING:
            raise RuntimeError("test already running")

        self.metrics = SMTPTestMetrics()
        self.metrics.state = SMTPTestState.RUNNING
        self.metrics.start_time = datetime.utcnow()
        self._stop_event.clear()
        self._task = asyncio.create_task(self._runner(server, port))

    async def stop(self) -> None:
        if self.metrics.state != SMTPTestState.RUNNING:
            return
        self.metrics.stop_reason = self.metrics.stop_reason or "manual"
        self._stop_event.set()
        if self._task:
            with suppress(asyncio.CancelledError):
                await self._task
        self.metrics.state = SMTPTestState.STOPPED
        self.metrics.stop_time = datetime.utcnow()

    async def _runner(self, server: str, port: int) -> None:
        try:
            while not self._stop_event.is_set():
                success, response = await self._handshake(server, port)
                self.metrics.attempts += 1
                if success:
                    self.metrics.successes += 1
                else:
                    self.metrics.failures += 1

                log = SMTPHandshakeLog(datetime.utcnow(), success, response)
                self.metrics.logs.append(log)

                # Keep only last 100 logs
                if len(self.metrics.logs) > 100:
                    self.metrics.logs.pop(0)

                await asyncio.sleep(1)
        except asyncio.CancelledError:
            self.metrics.stop_reason = self.metrics.stop_reason or "manual"
        finally:
            self.metrics.state = SMTPTestState.STOPPED
            self.metrics.stop_time = datetime.utcnow()

    async def _handshake(self, server: str, port: int) -> tuple[bool, str]:
        try:
            # Mock SMTP handshake
            await asyncio.sleep(0.1)
            return True, "250 OK"
        except Exception as exc:
            return False, str(exc)

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


smtp_test_service = SMTPTestService()
