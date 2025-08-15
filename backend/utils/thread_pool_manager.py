import asyncio
from concurrent.futures import ThreadPoolExecutor

from models.base import ThreadPool


class ThreadPoolManager:
    _pools: dict[str, ThreadPool] = {}
    _subscribers: dict[str, set[asyncio.Queue]] = {}
    _executors: dict[str, ThreadPoolExecutor] = {}

    @classmethod
    def get_pool(cls, pool_id: str) -> ThreadPool | None:
        return cls._pools.get(str(pool_id))

    @classmethod
    def update_pool(cls, pool: ThreadPool) -> None:
        pool_id = str(pool.id)
        cls._pools[pool_id] = pool
        for q in list(cls._subscribers.get(pool_id, set())):
            q.put_nowait(pool)

    @classmethod
    def delete_pool(cls, pool_id: str) -> None:
        pool_id = str(pool_id)
        cls._pools.pop(pool_id, None)
        executor = cls._executors.pop(pool_id, None)
        if executor:
            executor.shutdown(wait=False)
        for q in list(cls._subscribers.get(pool_id, set())):
            q.put_nowait(None)

    @classmethod
    async def subscribe(cls, pool_id: str) -> asyncio.Queue:
        q = asyncio.Queue()
        cls._subscribers.setdefault(str(pool_id), set()).add(q)
        if str(pool_id) in cls._pools:
            await q.put(cls._pools[str(pool_id)])
        return q

    @classmethod
    def get_executor(
        cls, pool_id: str, max_workers: int
    ) -> ThreadPoolExecutor:
        key = str(pool_id)
        exe = cls._executors.get(key)
        if not exe or exe._max_workers != max_workers:
            if exe:
                exe.shutdown(wait=False)
            exe = ThreadPoolExecutor(max_workers=max_workers)
            cls._executors[key] = exe
        return exe

    @classmethod
    def unsubscribe(cls, pool_id: str, q: asyncio.Queue) -> None:
        """Remove ``q`` from subscriber list for ``pool_id``."""
        subscribers = cls._subscribers.get(str(pool_id))
        if not subscribers:
            return
        subscribers.discard(q)
        if not subscribers:
            cls._subscribers.pop(str(pool_id), None)
