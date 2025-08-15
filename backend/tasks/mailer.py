import asyncio

from config.settings import settings
from core.celery_app import celery_app
from core.database import get_db
from routers.websocket import send_job_progress_update
from schemas.bulk_mail import BulkMailJobStatus
from services.bulk_mail_service import BulkMailService


async def _progress_update(job_id: str, db, stats: dict) -> None:
    await db.execute(
        "UPDATE bulk_mail_jobs SET sent=$1, failed=$2 WHERE id=$3",
        stats["sent"],
        stats["failed"],
        job_id,
    )
    await send_job_progress_update(
        job_id,
        {
            "sent": stats["sent"],
            "failed": stats["failed"],
            "total": stats["total"],
            "status": BulkMailJobStatus.in_progress,
        },
    )


@celery_app.task(bind=True, max_retries=settings.BULK_MAIL_RETRY_ATTEMPTS)
def send_bulk_mail(
    self,
    job_id: str,
    subject: str,
    body_html: str,
    recipients: list[str],
    attachments: list[str] | None = None,
) -> None:
    async def _inner() -> None:
        db = await anext(get_db())
        job = result = await db.execute(
            "SELECT * FROM bulk_mail_jobs WHERE id = $1", job_id
        )
        if not job:
            return
        await db.execute(
            "UPDATE bulk_mail_jobs SET status='in_progress', started_at=NOW() WHERE id=$1",
            job_id,
        )
        service = BulkMailService("localhost", 25, "noreply@sgpt.dev")

        async def progress(stats: dict) -> None:
            await _progress_update(job_id, db, stats)

        results = await service.send_bulk(
            recipients, subject, body_html, progress
        )
        status = BulkMailJobStatus.completed
        await db.execute(
            "UPDATE bulk_mail_jobs SET status=$1, completed_at=NOW(), sent=$2, failed=$3 WHERE id=$4",
            status,
            results["sent"],
            results["failed"],
            job_id,
        )
        await send_job_progress_update(job_id, {**results, "status": status})
        await service.close()
        await db.close()

    asyncio.run(_inner())
