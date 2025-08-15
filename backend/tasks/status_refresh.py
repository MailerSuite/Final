import asyncio
from datetime import datetime, timedelta

from sqlalchemy.ext.asyncio import AsyncSession

from config.settings import settings
from core.celery_app import celery_app
from core.database import async_session
from core.imap_checker import IMAPChecker
from core.proxy_checker import ProxyChecker
from core.smtp_checker import SMTPChecker
from models.base import IMAPAccount, ProxyServer, SMTPAccount
from schemas.imap import IMAPAccountCreate, IMAPStatus
from schemas.proxy import ProxyServerCreate, ProxyStatus
from schemas.smtp import SMTPAccountCreate, SMTPStatus

celery = celery_app
celery.conf.beat_schedule = {
    "refresh-all-statuses": {
        "task": "tasks.status_refresh.refresh_all_statuses",
        "schedule": timedelta(seconds=5),
    }
}
celery.conf.timezone = "UTC"


@celery.task
def refresh_all_statuses() -> None:
    """Refresh SMTP, IMAP and proxy statuses."""
    asyncio.run(_refresh_all())


async def _refresh_all() -> None:
    async with async_session() as session:
        await _refresh_proxies(session)
        await _refresh_smtp_accounts(session)
        await _refresh_imap_accounts(session)
        await session.commit()


async def _refresh_proxies(session: AsyncSession) -> None:
    result = await session.execute(select(ProxyServer))
    proxies = result.scalars().all()
    if not proxies:
        return
    checker = ProxyChecker(timeout=settings.PROXY_CHECK_TIMEOUT)
    inputs = [
        ProxyServerCreate(
            host=p.host,
            port=p.port,
            username=p.username,
            password=p.password,
            proxy_type=p.proxy_type,
        )
        for p in proxies
    ]
    results = await checker.check_multiple_servers(inputs)
    now = datetime.utcnow()
    for proxy, res in zip(proxies, results, strict=False):
        proxy.last_checked = now
        proxy.response_time = res.response_time
        proxy.error_message = res.error_message
        if res.status == ProxyStatus.VALID:
            proxy.status = "valid"
        elif res.status == ProxyStatus.INVALID:
            proxy.status = "dead"
        else:
            proxy.status = "error"
    await session.flush()


async def _refresh_smtp_accounts(session: AsyncSession) -> None:
    result = await session.execute(select(SMTPAccount))
    accounts = result.scalars().all()
    if not accounts:
        return
    checker = SMTPChecker(timeout=settings.SMTP_DEFAULT_TIMEOUT)
    inputs = [
        SMTPAccountCreate(
            server=a.smtp_server,
            port=a.smtp_port,
            email=a.email,
            password=a.password,
        )
        for a in accounts
    ]
    results = await checker.check_multiple_accounts(inputs)
    now = datetime.utcnow()
    for acc, res in zip(accounts, results, strict=False):
        acc.is_checked = True
        acc.last_checked = now
        acc.response_time = res.response_time
        acc.error_message = res.error_message
        if res.status == SMTPStatus.VALID:
            acc.status = "checked"
        elif res.status == SMTPStatus.INVALID:
            acc.status = "dead"
        else:
            acc.status = "error"
    await session.flush()


async def _refresh_imap_accounts(session: AsyncSession) -> None:
    result = await session.execute(select(IMAPAccount))
    accounts = result.scalars().all()
    if not accounts:
        return
    checker = IMAPChecker(timeout=settings.IMAP_DEFAULT_TIMEOUT)
    inputs = [
        IMAPAccountCreate(
            imap_server=a.imap_server,
            imap_port=a.imap_port,
            email=a.email,
            password=a.password,
        )
        for a in accounts
    ]
    results = await checker.check_multiple_accounts(inputs)
    now = datetime.utcnow()
    for acc, res in zip(accounts, results, strict=False):
        acc.is_checked = True
        acc.last_checked = now
        acc.response_time = res.response_time
        acc.error_message = res.error_message
        if res.status == IMAPStatus.VALID:
            acc.status = "checked"
        elif res.status == IMAPStatus.INVALID:
            acc.status = "dead"
        else:
            acc.status = "error"
    await session.flush()
