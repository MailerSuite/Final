import asyncio
from collections.abc import Awaitable, Callable

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.base import ThreadPool
from schemas.thread_pool import (
    ThreadPoolCreate,
    ThreadPoolResponse,
    ThreadPoolUpdate,
)
from utils.thread_pool_manager import ThreadPoolManager

# WebSocket functionality removed for simplicity


class ThreadPoolService:
    def __init__(self, db: AsyncSession | None = None) -> None:
        self.db = db
        self._tasks: dict[str, list[asyncio.Task]] = {}
        self._cancel_events: dict[str, asyncio.Event] = {}

    async def list_pools(self) -> list[ThreadPool]:
        result = await self.db.execute(
            select(ThreadPool).order_by(ThreadPool.created_at)
        )
        return result.scalars().all()

    async def create_pool(self, data: ThreadPoolCreate) -> ThreadPool:
        pool = ThreadPool(**data.model_dump())
        self.db.add(pool)
        await self.db.commit()
        await self.db.refresh(pool)
        ThreadPoolManager.update_pool(pool)
        await send_thread_pool_update(
            str(pool.id), ThreadPoolResponse.model_validate(pool).model_dump()
        )
        return pool

    async def update_pool(
        self, pool_id: str, data: ThreadPoolUpdate
    ) -> ThreadPool:
        result = await self.db.execute(
            select(ThreadPool).where(ThreadPool.id == pool_id)
        )
        pool = result.scalar_one_or_none()
        if not pool:
            raise HTTPException(
                status_code=404, detail="Thread pool not found"
            )
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(pool, field, value)
        self.db.add(pool)
        await self.db.commit()
        await self.db.refresh(pool)
        ThreadPoolManager.update_pool(pool)
        await send_thread_pool_update(
            str(pool.id), ThreadPoolResponse.model_validate(pool).model_dump()
        )
        return pool

    async def delete_pool(self, pool_id: str) -> bool:
        result = await self.db.execute(
            select(ThreadPool).where(ThreadPool.id == pool_id)
        )
        pool = result.scalar_one_or_none()
        if not pool:
            return False
        await self.db.delete(pool)
        await self.db.commit()
        ThreadPoolManager.delete_pool(pool_id)
        await send_thread_pool_update(str(pool_id), {"deleted": True})
        return True

    async def run_tasks(
        self,
        token: str,
        funcs: list[Callable[[], Awaitable[object]]],
    ) -> list[object]:
        cancel = asyncio.Event()
        self._cancel_events[token] = cancel
        tasks = [asyncio.create_task(f()) for f in funcs]
        self._tasks[token] = tasks
        results: list[object] = []
        try:
            for coro in asyncio.as_completed(tasks):
                if cancel.is_set():
                    break
                try:
                    res = await coro
                except Exception as exc:  # pragma: no cover - defensive
                    res = exc
                results.append(res)
        finally:
            for t in tasks:
                if not t.done():
                    t.cancel()
            await asyncio.gather(*tasks, return_exceptions=True)
            self._tasks.pop(token, None)
            self._cancel_events.pop(token, None)
        return results

    async def cancel(self, token: str) -> int:
        event = self._cancel_events.get(token)
        if not event:
            return 0
        event.set()
        tasks = self._tasks.get(token, [])
        for t in tasks:
            t.cancel()
        await asyncio.gather(*tasks, return_exceptions=True)
        self._tasks.pop(token, None)
        self._cancel_events.pop(token, None)
        return len(tasks)


global_thread_pool = ThreadPoolService()
