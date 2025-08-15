import asyncio

from core.celery_app import celery_app
from services.imap_test_service import imap_test_service


async def run_imap_test(
    server: str, port: int, email: str, password: str
) -> None:
    await imap_test_service.start(server, port, email, password)
    await imap_test_service._task


@celery_app.task(name="tasks.imap_tasks.send_test_email_bulk")
def send_test_email_bulk(
    job_id: str,
    template_id: str,
    imap_account_id: str,
    recipient: str | None,
    emails_per_item: int = 1,
) -> None:
    asyncio.run(
        imap_test_service.send_bulk(
            template_id, imap_account_id, recipient, emails_per_item
        )
    )
