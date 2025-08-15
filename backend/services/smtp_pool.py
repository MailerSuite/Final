import asyncio
import time
from dataclasses import dataclass

from aiosmtplib import SMTP


@dataclass
class _PooledSMTP:
    client: SMTP
    created: float
    uses: int = 0

    def expired(self, ttl: float, max_uses: int) -> bool:
        return self.uses >= max_uses or time.monotonic() - self.created > ttl


class SMTPClientPool:
    """Asynchronous connection pool for SMTP clients with reuse limits."""

    def __init__(
        self,
        host: str,
        port: int,
        use_tls: bool,
        max_connections: int = 1,
        timeout: int = 30,
        ttl: float = 300.0,
        max_uses: int = 100,
    ) -> None:
        self.host = host
        self.port = port
        self.use_tls = use_tls
        self.timeout = timeout
        self.max_connections = max_connections
        self.ttl = ttl
        self.max_uses = max_uses
        self._pool: asyncio.Queue[_PooledSMTP] = asyncio.Queue()
        self._created = 0
        self._lock = asyncio.Lock()
        self._wrappers: dict[SMTP, _PooledSMTP] = {}

    async def _create_client(self) -> SMTP:
        smtp = SMTP(
            hostname=self.host,
            port=self.port,
            timeout=self.timeout,
            use_tls=self.use_tls,
            support_pipelining=True,
        )
        await smtp.connect()
        if not self.use_tls and self.port in (25, 587):
            await smtp.starttls()
            await smtp.ehlo()
        return smtp

    async def _acquire_wrapper(self) -> _PooledSMTP:
        async with self._lock:
            while not self._pool.empty():
                wrapper = self._pool.get_nowait()
                if not wrapper.expired(self.ttl, self.max_uses):
                    return wrapper
                await wrapper.client.quit()
                self._created -= 1
                self._wrappers.pop(wrapper.client, None)
            if self._created < self.max_connections:
                client = await self._create_client()
                wrapper = _PooledSMTP(client, time.monotonic())
                self._created += 1
                self._wrappers[client] = wrapper
                return wrapper
        wrapper = await self._pool.get()
        if wrapper.expired(self.ttl, self.max_uses):
            await wrapper.client.quit()
            async with self._lock:
                self._created -= 1
                self._wrappers.pop(wrapper.client, None)
            return await self._acquire_wrapper()
        return wrapper

    async def acquire(self) -> SMTP:
        wrapper = await self._acquire_wrapper()
        return wrapper.client

    async def release(self, client: SMTP) -> None:
        wrapper = self._wrappers.get(client)
        if not wrapper:
            return
        wrapper.uses += 1
        if wrapper.expired(self.ttl, self.max_uses):
            async with self._lock:
                self._created -= 1
                self._wrappers.pop(client, None)
            try:
                await client.quit()
            finally:
                pass
        else:
            await self._pool.put(wrapper)

    async def close(self) -> None:
        while not self._pool.empty():
            wrapper = await self._pool.get()
            try:
                await wrapper.client.quit()
            finally:
                self._created -= 1
                self._wrappers.pop(wrapper.client, None)
        for wrapper in list(self._wrappers.values()):
            try:
                await wrapper.client.quit()
            finally:
                self._created -= 1
        self._wrappers.clear()
