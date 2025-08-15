import asyncio
from collections.abc import Callable, Iterable

from config.settings import settings
from services.bulk_mail_service import BulkMailService
from utils.retry_utils import smtp_retry


class BulkMailOrchestrator:
    """Async bulk mail orchestrator for high concurrency support"""

    def __init__(self, host: str, port: int, sender: str) -> None:
        self._host = host
        self._port = port
        self._sender = sender
        self._lock = asyncio.Lock()  # Use async lock instead of threading.Lock
        self._stats = {"sent": 0, "failed": 0}
        # Replace ThreadPoolExecutor with asyncio.Semaphore for concurrency control
        self._semaphore = asyncio.Semaphore(settings.BULK_MAIL_MAX_WORKERS)

    @smtp_retry()
    async def _send(self, recipient: str, subject: str, body: str) -> None:
        """Async send method with semaphore control"""
        async with self._semaphore:
            service = BulkMailService(self._host, self._port, self._sender)
            # Assuming BulkMailService will be made async as well
            result = await service.send_bulk_async([recipient], subject, body)
            stats = (
                result
                if isinstance(result, dict)
                else {"sent": 0, "failed": 1}
            )
            async with self._lock:
                self._stats["sent"] += stats.get("sent", 0)
                self._stats["failed"] += stats.get("failed", 0)

    async def send(
        self,
        recipients: Iterable[str],
        subject: str,
        body: str,
        progress_cb: Callable[[dict[str, int]], None] | None = None,
    ) -> dict[str, int]:
        """Async send method using asyncio.gather instead of ThreadPoolExecutor"""
        tasks = []
        for email in recipients:
            task = self._send(email, subject, body)
            tasks.append(task)

        # Process tasks in batches for memory efficiency
        batch_size = min(100, len(tasks))

        for i in range(0, len(tasks), batch_size):
            batch = tasks[i : i + batch_size]
            await asyncio.gather(*batch, return_exceptions=True)

            if progress_cb:
                async with self._lock:
                    progress_cb(self._stats.copy())

            # Small delay between batches to prevent overwhelming
            if i + batch_size < len(tasks):
                await asyncio.sleep(0.1)

        return self._stats

    # Remove shutdown method since we're using pure async now
    # No ThreadPoolExecutor to shutdown
