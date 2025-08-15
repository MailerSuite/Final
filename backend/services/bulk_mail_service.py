import asyncio
import logging
from collections import deque
from collections.abc import Awaitable, Callable, Iterable

from config.settings import settings
from models.bulk_mail_job import BulkMailJob
from services.proxy_service import ProxyService, ProxyUnavailableError

from .email_composer import compose_email
from .smtp_client import SMTPConnectionPool


class RateLimiter:
    """Simple async rate limiter based on timestamps."""

    def __init__(self, limit: int, interval: float = 60.0) -> None:
        self.limit = limit
        self.interval = interval
        self.timestamps: dict[str, deque[float]] = {}
        self.lock = asyncio.Lock()

    async def acquire(self, key: str) -> None:
        async with self.lock:
            now = asyncio.get_event_loop().time()
            dq = self.timestamps.setdefault(key, deque())
            while dq and now - dq[0] > self.interval:
                dq.popleft()
            if len(dq) >= self.limit:
                wait = self.interval - (now - dq[0])
                await asyncio.sleep(wait)
                now = asyncio.get_event_loop().time()
                while dq and now - dq[0] > self.interval:
                    dq.popleft()
            dq.append(now)


logger = logging.getLogger(__name__)


class BulkMailService:
    def __init__(self, host: str, port: int, sender: str, session_id: str = None, db_session = None) -> None:
        use_tls = port == 465
        self.pool = SMTPConnectionPool(
            host,
            port,
            use_tls,
            max_connections=settings.BULK_MAIL_MAX_WORKERS,
            max_uses=settings.BULK_MAIL_POOL_MAX_USES,
            ttl=settings.BULK_MAIL_POOL_TTL,
        )
        self.sender = sender
        self.rate_limiter = RateLimiter(settings.BULK_MAIL_RATE_LIMIT)
        self.retry_attempts = settings.BULK_MAIL_RETRY_ATTEMPTS
        self.backoff = settings.BULK_MAIL_RETRY_BACKOFF
        
        # Enhanced proxy support
        self.session_id = session_id
        self.db_session = db_session
        self.proxy_service = ProxyService(db_session) if db_session else None
        
        # Enforce proxy usage for bulk operations
        if settings.PROXY_ENFORCEMENT_STRICT and not self.proxy_service:
            logger.warning("⚠️  Bulk mail service initialized without proxy service - IP leak prevention may be limited")

    async def send_one(self, recipient: str, subject: str, body: str) -> bool:
        # ENFORCE PROXY USAGE FOR BULK OPERATIONS
        if settings.PROXY_IP_LEAK_PREVENTION and self.proxy_service:
            try:
                # Get working proxy for this session
                proxy = await self.proxy_service.get_working_proxy(self.session_id)
                if not proxy:
                    logger.error(f"❌ No working proxy available for session {self.session_id}")
                    return False
                
                logger.debug(f"🔒 Using proxy {proxy.host}:{proxy.port} for bulk mail to {recipient}")
                
            except ProxyUnavailableError as e:
                logger.error(f"❌ Proxy unavailable for bulk mail: {e}")
                return False
            except Exception as e:
                logger.error(f"❌ Proxy error for bulk mail: {e}")
                return False
        
        last_exc: Exception | None = None
        for attempt in range(self.retry_attempts):
            await self.rate_limiter.acquire("bulk")
            client = await self.pool.acquire()
            try:
                msg = compose_email(self.sender, recipient, subject, body)
                await client.send_message(msg)
                await self.pool.release(client)
                return True
            except Exception as exc:
                last_exc = exc
                await self.pool.release(client)
                await asyncio.sleep(self.backoff**attempt)
        logger.error("Failed to send %s: %s", recipient, last_exc)
        return False

    async def send_bulk(
        self,
        recipients: Iterable[str],
        subject: str,
        body: str,
        progress_cb: Callable[[dict[str, int]], Awaitable[None]] | None = None,
    ) -> dict[str, int]:
        # VALIDATE PROXY AVAILABILITY BEFORE BULK OPERATION
        if settings.PROXY_IP_LEAK_PREVENTION and self.proxy_service and self.session_id:
            try:
                working_proxies = await self.proxy_service.get_working_proxies(self.session_id, force_check=True)
                if not working_proxies:
                    logger.error(f"❌ No working proxies available for bulk mail session {self.session_id}")
                    return {"sent": 0, "failed": len(list(recipients)), "total": len(list(recipients)), "error": "No working proxies"}
                
                logger.info(f"🔒 Bulk mail operation using {len(working_proxies)} working proxies")
                
            except Exception as e:
                logger.error(f"❌ Proxy validation failed for bulk mail: {e}")
                return {"sent": 0, "failed": len(list(recipients)), "total": len(list(recipients)), "error": f"Proxy validation failed: {e}"}
        
        stats = {"sent": 0, "failed": 0, "total": len(list(recipients))}
        sem = asyncio.Semaphore(settings.BULK_MAIL_MAX_WORKERS)

        async def worker(email: str) -> None:
            async with sem:
                if await self.send_one(email, subject, body):
                    stats["sent"] += 1
                else:
                    stats["failed"] += 1
                if progress_cb:
                    await progress_cb(stats.copy())

        await asyncio.gather(*(worker(r) for r in recipients))
        return stats

    async def close(self) -> None:
        await self.pool.close()


async def create_bulk_job(
    db_session,
    user_id: str,
    subject: str,
    body_html: str,
    recipients: list[str],
    attachments: list[str] | None = None,
) -> BulkMailJob:
    from uuid import uuid4

    from tasks.mailer import send_bulk_mail

    job = BulkMailJob(
        id=uuid4(), user_id=user_id, status="pending", total=len(recipients)
    )
    db_session.add(job)
    await db_session.commit()
    await db_session.refresh(job)
    send_bulk_mail.delay(
        str(job.id), subject, body_html, recipients, attachments or []
    )
    return job
