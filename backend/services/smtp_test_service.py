import asyncio
from contextlib import suppress
from datetime import datetime

import aiosmtplib

from core.logger import get_logger
from models.smtp_test import SMTPHandshakeLog, SMTPTestMetrics, SMTPTestState
from routers import smtp_metrics
from services.stop_condition_service import (
    EvaluateMetrics,
    stop_condition_service,
)
from utils.metrics import SMTP_METRICS

logger = get_logger(__name__)


class SMTPTestService:
    """Manage running SMTP handshake tests."""

    def __init__(self) -> None:
        self.metrics = SMTPTestMetrics()
        self._task: asyncio.Task | None = None
        self._stop_event = asyncio.Event()

    async def start(self, server: str, port: int) -> None:
        if self.metrics.state == SMTPTestState.RUNNING:
            raise RuntimeError("test already running")
        smtp_metrics.SMTP_METRICS.reset()
        self.metrics = SMTPTestMetrics(
            state=SMTPTestState.RUNNING, start_time=datetime.utcnow()
        )
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
                metrics_snapshot = EvaluateMetrics(
                    error_rate=self.metrics.error_rate,
                    success_rate=self.metrics.success_rate,
                    duration=self.metrics.elapsed,
                    total_tests=self.metrics.attempts,
                )
                stop, reason = stop_condition_service.evaluate(
                    metrics_snapshot
                )
                if stop:
                    self.metrics.stop_reason = f"condition:{reason}"
                    break
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
                start = asyncio.get_event_loop().time()
                success, response = await self._handshake(server, port)
                latency_ms = (asyncio.get_event_loop().time() - start) * 1000
                self.metrics.attempts += 1
                self.metrics.logs.append(
                    SMTPHandshakeLog(
                        timestamp=datetime.utcnow(),
                        success=success,
                        response=response,
                    )
                )
                if success:
                    self.metrics.successes += 1
                else:
                    self.metrics.failures += 1
                SMTP_METRICS.record(success, latency_ms)
                await smtp_metrics.publish_metrics()
                metrics_snapshot = EvaluateMetrics(
                    error_rate=self.metrics.error_rate,
                    success_rate=self.metrics.success_rate,
                    duration=self.metrics.elapsed,
                    total_tests=self.metrics.attempts,
                )
                stop, reason = stop_condition_service.evaluate(
                    metrics_snapshot
                )
                if stop:
                    self.metrics.stop_reason = f"condition:{reason}"
                    break
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
            self.metrics.state = SMTPTestState.STOPPED
            self.metrics.stop_time = datetime.utcnow()
            self._stop_event.set()
            await smtp_metrics.publish_metrics()

    async def _handshake(self, server: str, port: int) -> tuple[bool, str]:
        try:
            use_tls = port == 465
            smtp = aiosmtplib.SMTP(
                hostname=server, port=port, timeout=10, use_tls=use_tls
            )
            await smtp.connect()
            if (
                not use_tls
                and port in (587, 25)
                and smtp.supports_extension("starttls")
            ):
                await smtp.starttls()
                await smtp.ehlo()
            code, message = await smtp.execute_command("HELO from localhost")
            await smtp.quit()
            return (200 <= code < 400, f"{code} {message!s}")
        except Exception as exc:
            logger.warning(f"SMTP handshake failed: {exc}")
            return (False, str(exc))

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


smtp_test_service = SMTPTestService()
