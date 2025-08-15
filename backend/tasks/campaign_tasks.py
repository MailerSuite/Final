import asyncio

from config.settings import settings
from core.celery_app import celery_app
from core.database import async_session
from models.base import Campaign
from routers.websocket import send_job_log_update
from services.proxy_service import ProxyService
from services.smtp_service import SMTPService

celery = celery_app


@celery.task(bind=True, max_retries=settings.SMTP_MAX_RETRIES)
def send_campaign_batch(
    self,
    campaign_id: str,
    leads: list[dict],
    template: dict,
    batch_size: int,
    delay_between_batches: int,
    threads_count: int,
    proxy_type: str | None = None,
    proxy_host: str | None = None,
    proxy_port: int | None = None,
    proxy_username: str | None = None,
    proxy_password: str | None = None,
):
    async def _inner():
        async with async_session() as session:
            service = SMTPService(session)
            proxy_service = ProxyService(session)
            campaign = await session.get(Campaign, campaign_id)
            if not campaign:
                return
            campaign.batch_size = batch_size
            campaign.delay_between_batches = delay_between_batches
            campaign.threads_count = threads_count
            campaign.proxy_type = proxy_type
            campaign.proxy_host = proxy_host
            campaign.proxy_port = proxy_port
            campaign.proxy_username = proxy_username
            campaign.proxy_password = proxy_password
            smtp_accounts = await service._get_session_smtp_accounts(
                str(campaign.session_id)
            )
            proxies = await proxy_service.get_working_proxies(
                str(campaign.session_id)
            )
            semaphore = asyncio.Semaphore(threads_count)
            stats = {
                "sent": 0,
                "success": 0,
                "failed": 0,
                "rate_limited": 0,
                "proxy_errors": 0,
                "smtp_errors": 0,
                "oauth_errors": 0,
            }

            async def worker(ld: dict):
                await service._send_single_email(
                    recipient=ld,
                    template=template,
                    campaign=campaign,
                    smtp_accounts=smtp_accounts,
                    proxies=proxies,
                    semaphore=semaphore,
                    stats=stats,
                    max_retries=settings.SMTP_MAX_RETRIES,
                )

            for i in range(0, len(leads), batch_size):
                sub_batch = leads[i : i + batch_size]
                await send_job_log_update(
                    campaign_id,
                    {
                        "event": "sub_batch_start",
                        "offset": i,
                        "size": len(sub_batch),
                    },
                )
                await asyncio.gather(*(worker(l) for l in sub_batch))
                if i + batch_size < len(leads):
                    await asyncio.sleep(delay_between_batches)
            await send_job_log_update(
                campaign_id,
                {
                    "event": "batch_complete",
                    "sent": stats["sent"],
                    "failed": stats["failed"],
                },
            )
            campaign.sent_count += stats["sent"]
            campaign.delivered_count += stats["success"]
            campaign.bounced_count += stats["failed"]
            await session.commit()

    asyncio.run(_inner())


@celery.task(name="tasks.campaign_tasks.run_campaign")
def run_campaign(campaign_id: str, session_id: str) -> None:
    async def _inner() -> None:
        from services.campaign_service import CampaignService

        async with async_session() as session:
            service = CampaignService(session)
            await service._execute_campaign(campaign_id, session_id)

    asyncio.run(_inner())
