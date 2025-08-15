import asyncio
import time
from contextlib import suppress
from datetime import datetime

import python_socks

from utils.socks_patch import patch_python_socks

patch_python_socks()
from config.settings import settings
from core.logger import get_logger
from models.socks_test import (
    SocksConnectionLog,
    SocksTestMetrics,
    SocksTestState,
)

logger = get_logger(__name__)


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
        max_concurrent: int = settings.SOCKS_MAX_CONCURRENT,
    ) -> None:
        if self.metrics.state == SocksTestState.RUNNING:
            raise RuntimeError("test already running")
        self.metrics = SocksTestMetrics(
            state=SocksTestState.RUNNING, start_time=datetime.utcnow()
        )
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
                if (
                    self.metrics.start_time
                    and (
                        datetime.utcnow() - self.metrics.start_time
                    ).total_seconds()
                    >= 300
                ):
                    self.metrics.stop_reason = "max_duration"
                    self._stop_event.set()
                    break
                if self.metrics.attempts >= 1000:
                    self.metrics.stop_reason = "max_count"
                    self._stop_event.set()
                    break
                async with semaphore:
                    success, latency, error = await self._check_connection(
                        host, port, proxy_type, target_host, target_port
                    )
                self.metrics.attempts += 1
                self.metrics.logs.append(
                    SocksConnectionLog(
                        timestamp=datetime.utcnow(),
                        latency=latency,
                        success=success,
                        error=error,
                    )
                )
                if success:
                    self.metrics.successes += 1
                else:
                    self.metrics.failures += 1
                if self.metrics.error_rate > 10:
                    self.metrics.stop_reason = "error_rate"
                    self._stop_event.set()
                    break
                if self.metrics.success_rate < 50:
                    self.metrics.stop_reason = "low_success_rate"
                    self._stop_event.set()
                    break

        tasks = [asyncio.create_task(worker()) for _ in range(max_concurrent)]
        try:
            await asyncio.gather(*tasks)
        except asyncio.CancelledError:
            self.metrics.stop_reason = self.metrics.stop_reason or "manual"
        finally:
            for t in tasks:
                t.cancel()
            with suppress(asyncio.CancelledError):
                await asyncio.gather(*tasks, return_exceptions=True)
            self.metrics.state = SocksTestState.STOPPED
            self.metrics.stop_time = datetime.utcnow()
            self._stop_event.set()

    async def _check_connection(
        self,
        host: str,
        port: int,
        proxy_type: str,
        target_host: str,
        target_port: int,
    ) -> tuple[bool, float, str | None]:
        start = time.perf_counter()
        try:
            proxy_enum = (
                python_socks.ProxyType.SOCKS5
                if proxy_type.lower() == "socks5"
                else python_socks.ProxyType.SOCKS4
            )
            sock = await python_socks.proxy_connect(
                proxy_type=proxy_enum,
                host=host,
                port=port,
                dest_host=target_host,
                dest_port=target_port,
                timeout=10,
            )
            sock.close()
            return (True, time.perf_counter() - start, None)
        except Exception as exc:
            logger.warning(f"SOCKS connection failed: {exc}")
            return (False, time.perf_counter() - start, str(exc))

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


socks_test_service = SocksTestService()
