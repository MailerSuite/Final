"""Simple asynchronous SMTP connection pool with TTL and max usage."""

import asyncio
import time

from aiosmtplib import SMTP

from utils.smtp_auto_detect import TLSMode, detect_tls_mode


class PooledSMTP:
    def __init__(self, client: SMTP, created: float) -> None:
        self.client = client
        self.created = created
        self.uses = 0


class SMTPConnectionPool:
    def __init__(
        self,
        host: str,
        port: int,
        use_tls: bool = False,
        max_connections: int = 2,
        max_uses: int = 100,
        ttl: int = 300,
        timeout: int = 30,
    ) -> None:
        self._host = host
        self._port = port
        self._use_tls = use_tls
        self._max_connections = max_connections
        self._max_uses = max_uses
        self._ttl = ttl
        self._timeout = timeout
        self._pool: asyncio.Queue[PooledSMTP] = asyncio.Queue()
        self._created = 0
        self._lock = asyncio.Lock()

    async def _create_client(self) -> PooledSMTP:
        loop = asyncio.get_running_loop()
        mode = await loop.run_in_executor(
            None, detect_tls_mode, self._host, self._port
        )
        use_tls = mode is TLSMode.SSL
        smtp = SMTP(
            hostname=self._host,
            port=self._port,
            timeout=self._timeout,
            use_tls=use_tls,
            support_pipelining=True,
        )
        await smtp.connect()
        if mode is TLSMode.STARTTLS:
            await smtp.starttls()
            await smtp.ehlo()
        return PooledSMTP(smtp, time.monotonic())

    async def acquire(self) -> SMTP:
        async with self._lock:
            while not self._pool.empty():
                pooled = self._pool.get_nowait()
                if (
                    pooled.uses < self._max_uses
                    and time.monotonic() - pooled.created < self._ttl
                ):
                    pooled.uses += 1
                    return pooled.client
                else:
                    try:
                        await pooled.client.quit()
                    finally:
                        self._created -= 1
            if self._created < self._max_connections:
                pooled = await self._create_client()
                self._created += 1
                pooled.uses += 1
                return pooled.client
        pooled = await self._pool.get()
        pooled.uses += 1
        return pooled.client

    async def release(self, client: SMTP) -> None:
        async with self._lock:
            self._pool.put_nowait(PooledSMTP(client, time.monotonic()))

    async def close(self) -> None:
        async with self._lock:
            while self._created:
                pooled = await self._pool.get()
                try:
                    await pooled.client.quit()
                finally:
                    self._created -= 1
