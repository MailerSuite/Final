import asyncio
import time
from contextlib import suppress
from datetime import datetime

import aioimaplib

from core.logger import get_logger
from models.imap_test import IMAPLoginLog, IMAPTestMetrics, IMAPTestState
from routers import imap_metrics

logger = get_logger(__name__)


class IMAPTestService:
    """Manage running IMAP login and capability tests."""

    def __init__(self) -> None:
        self.metrics = IMAPTestMetrics()
        self._task: asyncio.Task | None = None
        self._stop_event = asyncio.Event()

    async def start(
        self, server: str, port: int, email: str, password: str
    ) -> None:
        if self.metrics.state == IMAPTestState.RUNNING:
            raise RuntimeError("test already running")
        imap_metrics.IMAP_METRICS.reset()
        self.metrics = IMAPTestMetrics(
            state=IMAPTestState.RUNNING, start_time=datetime.utcnow()
        )
        self._stop_event.clear()
        self._task = asyncio.create_task(
            self._runner(server, port, email, password)
        )

    async def stop(self) -> None:
        if self.metrics.state != IMAPTestState.RUNNING:
            return
        self.metrics.stop_reason = self.metrics.stop_reason or "manual"
        self._stop_event.set()
        if self._task:
            with suppress(asyncio.CancelledError):
                await self._task
        self.metrics.state = IMAPTestState.STOPPED
        self.metrics.stop_time = datetime.utcnow()

    async def _runner(
        self, server: str, port: int, email: str, password: str
    ) -> None:
        try:
            while not self._stop_event.is_set():
                if (
                    self.metrics.start_time
                    and (
                        datetime.utcnow() - self.metrics.start_time
                    ).total_seconds()
                    >= 300
                ):
                    self.metrics.stop_reason = "max_duration"
                    break
                if self.metrics.attempts >= 1000:
                    self.metrics.stop_reason = "max_count"
                    break
                start = time.perf_counter()
                success, response = await self._login_capability(
                    server, port, email, password
                )
                latency_ms = (time.perf_counter() - start) * 1000
                self.metrics.attempts += 1
                self.metrics.logs.append(
                    IMAPLoginLog(
                        timestamp=datetime.utcnow(),
                        success=success,
                        response=response,
                    )
                )
                if success:
                    self.metrics.successes += 1
                else:
                    self.metrics.failures += 1
                imap_metrics.IMAP_METRICS.record(success, latency_ms)
                await imap_metrics.publish_metrics()
                if self.metrics.error_rate > 10:
                    self.metrics.stop_reason = "error_rate"
                    break
                if self.metrics.success_rate < 50:
                    self.metrics.stop_reason = "low_success_rate"
                    break
                await asyncio.sleep(0)
        except asyncio.CancelledError:
            self.metrics.stop_reason = self.metrics.stop_reason or "manual"
        finally:
            self.metrics.state = IMAPTestState.STOPPED
            self.metrics.stop_time = datetime.utcnow()
            self._stop_event.set()
            await imap_metrics.publish_metrics()

    async def _login_capability(
        self, server: str, port: int, email: str, password: str
    ) -> tuple[bool, str]:
        try:
            if port == 993:
                imap = aioimaplib.IMAP4_SSL(host=server, port=port, timeout=10)
            else:
                imap = aioimaplib.IMAP4(host=server, port=port, timeout=10)
            await imap.wait_hello_from_server()
            resp_login = await imap.login(email, password)
            if resp_login.result != "OK":
                raise Exception("login failed")
            resp_cap = await imap.capability()
            capability = " ".join(line.decode() for line in resp_cap.lines)
            await imap.logout()
            return (True, capability)
        except Exception as exc:
            logger.warning(f"IMAP login failed: {exc}")
            return (False, str(exc))

    async def send_email(
        self, template_id: str, imap_account_id: str, recipient: str | None
    ) -> str:
        await asyncio.sleep(0)
        return f"msg-{imap_account_id}"

    async def run_imap_test(
        self, server: str, port: int, email: str, password: str
    ) -> tuple[bool, str]:
        """Execute a single login+capability test."""
        return await self._login_capability(server, port, email, password)

    async def send_bulk(
        self,
        template_id: str,
        imap_account_id: str,
        recipient: str | None,
        emails_per_item: int = 1,
    ) -> list[str]:
        results = []
        for _ in range(emails_per_item):
            msg_id = await self.send_email(
                template_id, imap_account_id, recipient
            )
            results.append(msg_id)
        return results

    def status(self) -> dict:
        return {
            "state": self.metrics.state.value,
            "attempts": self.metrics.attempts,
            "successes": self.metrics.successes,
            "failures": self.metrics.failures,
            "error_rate": self.metrics.error_rate,
            "success_rate": self.metrics.success_rate,
            "elapsed": self.metrics.elapsed,
            "stop_reason": self.metrics.stop_reason,
        }


imap_test_service = IMAPTestService()
