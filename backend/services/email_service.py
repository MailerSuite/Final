import asyncio
import imaplib
import random
from typing import Any
from uuid import UUID

from fastapi import UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from core.imap_checker import _auto_detect_imap_server
from core.logger import get_logger
from models import Domain, EmailTemplate, ProxyServer, SMTPAccount
from models.email_status import EmailStatus, InboxResult
from routers.websocket import send_job_log_update, send_job_progress_update
from schemas.jobs import JobMode
from services.job_service import job_service
from services.smtp_service import SMTPService
from utils.smtp_auto_detect import auto_detect_smtp_config

logger = get_logger(__name__)


class EmailService:
    """Wrapper around SMTPService for bulk jobs and test sending."""

    def __init__(self, db_session: AsyncSession | None = None) -> None:
        self.sent_count = 0
        self.failed_count = 0
        self.db: AsyncSession | None = db_session
        self.smtp_service = SMTPService(db_session) if db_session else None

    async def send_bulk_emails(
        self,
        job_id: str,
        smtp_accounts: list[dict[str, Any]],
        email_bases: list[dict[str, Any]],
        template: dict[str, Any],
        mode: JobMode,
        db_connection,
        max_concurrent: int = 10,
    ) -> None:
        self.sent_count = 0
        self.failed_count = 0
        semaphore = asyncio.Semaphore(max_concurrent)

        async def worker(email_data: dict[str, Any]) -> None:
            nonlocal smtp_accounts
            async with semaphore:
                smtp_account = random.choice(smtp_accounts)
                try:
                    await self.smtp_service.send_single_email(
                        smtp_account=smtp_account,
                        to_addresses=[email_data["email"]],
                        subject=template["subject"],
                        html_content=template.get("html_content"),
                        text_content=template.get("text_content"),
                        attachments=(
                            [
                                UploadFile(f["path"])
                                for f in template.get("attachments", [])
                            ]
                            if template.get("attachments")
                            else None
                        ),
                    )
                    self.sent_count += 1
                    await self._log_email_result(
                        job_id,
                        email_data["email"],
                        "success",
                        None,
                        db_connection,
                    )
                except Exception as exc:
                    self.failed_count += 1
                    await self._log_email_result(
                        job_id,
                        email_data["email"],
                        "failed",
                        str(exc),
                        db_connection,
                    )
                await self._update_progress(job_id, db_connection)

        await asyncio.gather(
            *(worker(e) for e in email_bases), return_exceptions=True
        )
        logger.info(
            f"Job {job_id} completed: {self.sent_count} sent, {self.failed_count} failed"
        )

    async def _log_email_result(
        self,
        job_id: str,
        email: str,
        status: str,
        error: str | None,
        db_connection,
    ) -> None:
        await db_connection.execute(
            "\n            INSERT INTO job_logs (job_id, level, message, details)\n            VALUES ($1, $2, $3, $4)\n            ",
            job_id,
            "INFO" if status == "success" else "ERROR",
            f"Email to {email}: {status}",
            {"email": email, "error": error},
        )
        await send_job_log_update(
            job_id, {"email": email, "status": status, "error": error}
        )

    async def _update_progress(self, job_id: str, db_connection) -> None:
        total_processed = self.sent_count + self.failed_count
        job_data = result = await db_connection.execute(
            "SELECT total_emails FROM jobs WHERE id = $1", job_id
        )
        if job_data:
            total_emails = job_data["total_emails"]
            await job_service.update_job_progress(
                job_id,
                self.sent_count,
                self.failed_count,
                total_emails,
                db_connection,
            )
            progress = (
                total_processed / total_emails * 100 if total_emails > 0 else 0
            )
            await send_job_progress_update(
                job_id,
                {
                    "progress": progress,
                    "sent_emails": self.sent_count,
                    "failed_emails": self.failed_count,
                    "total_emails": total_emails,
                },
            )

    async def send_test_email(
        self,
        smtp_id: UUID,
        proxy_id: UUID | None,
        template_id: UUID,
        domain_id: UUID,
    ) -> EmailStatus:
        if not self.db:
            raise ValueError("db_session is required")
        smtp = await self._get_object(SMTPAccount, smtp_id)
        template = await self._get_object(EmailTemplate, template_id)
        domain = await self._get_object(Domain, domain_id)
        proxy = (
            await self._get_object(ProxyServer, proxy_id) if proxy_id else None
        )
        try:
            detected = await asyncio.get_event_loop().run_in_executor(
                None,
                auto_detect_smtp_config,
                smtp.server,
                smtp.email,
                smtp.password,
            )
            smtp.port = detected["port"]
        except Exception as exc:
            logger.warning(f"SMTP auto-detect failed for {smtp.server}: {exc}")
        html_content = template.html_content or ""
        link = f"https://{domain.url}"
        if link not in html_content:
            html_content += f'<p><a href="{link}">test link</a></p>'
        result = await self.smtp_service.send_single_email(
            smtp_account=smtp,
            to_addresses=[smtp.email],
            subject=template.subject,
            html_content=html_content,
            text_content=template.text_content,
            proxy_id=str(proxy.id) if proxy else None,
        )
        message_id = result.get("message_id")
        inbox_status = await self._verify_inbox(smtp, message_id)
        status = EmailStatus(
            smtp_id=smtp_id,
            proxy_id=proxy_id,
            template_id=template_id,
            domain_id=domain_id,
            message_id=message_id,
            inbox_status=inbox_status,
        )
        self.db.add(status)
        await self.db.commit()
        await self.db.refresh(status)
        return status

    async def _get_object(self, model, obj_id: UUID):
        result = await self.db.execute(select(model).where(model.id == obj_id))
        obj = result.scalar_one_or_none()
        if not obj:
            raise ValueError(f"{model.__name__} not found")
        return obj

    async def _verify_inbox(
        self, smtp: SMTPAccount, message_id: str | None
    ) -> InboxResult:
        if not message_id:
            return InboxResult.UNKNOWN
        try:
            server, port = _auto_detect_imap_server(smtp.email)
            mail = imaplib.IMAP4_SSL(server, port, timeout=30)
            mail.login(smtp.email, smtp.password)
            for folder, status_enum in {
                "INBOX": InboxResult.INBOX,
                "Junk": InboxResult.JUNK,
                "Spam": InboxResult.SPAM,
            }.items():
                try:
                    resp, _ = mail.select(folder)
                    if resp == "OK":
                        typ, data = mail.search(
                            None, f'HEADER Message-ID "{message_id}"'
                        )
                        if data and data[0]:
                            mail.logout()
                            return status_enum
                except Exception:
                    continue
            mail.logout()
            return InboxResult.UNKNOWN
        except Exception as exc:
            logger.warning(f"IMAP verify failed: {exc}")
            return InboxResult.UNKNOWN
