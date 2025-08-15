from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from itertools import cycle

from fastapi import UploadFile

from models.base import SMTPAccount
from services.smtp_service import SMTPService
from utils.smtp_auto_detect import select_smtp_accounts
from utils.ua_randomizer import get_random_ua


def compose_email(
    sender: str, recipient: str, subject: str, body_html: str
) -> MIMEMultipart:
    msg = MIMEMultipart("alternative")
    msg["From"] = sender
    msg["To"] = recipient
    msg["Subject"] = subject
    msg["User-Agent"] = get_random_ua()
    msg.attach(MIMEText(body_html, "html"))
    return msg


async def send(
    smtp_service: SMTPService,
    smtp_account: SMTPAccount,
    to: list[str],
    subject: str,
    *,
    smtp_mode: str = "all",
    smtp_ids: list[str] | None = None,
    count: int = 1,
    templates: list[str] | None = None,
    cc: list[str] | None = None,
    bcc: list[str] | None = None,
    html_content: str | None = None,
    text_content: str | None = None,
    attachments: list[UploadFile] | None = None,
    proxy_id: str | None = None,
) -> int:
    accounts = await select_smtp_accounts(
        smtp_service.db, str(smtp_account.session_id), smtp_mode, smtp_ids
    )
    if not accounts:
        accounts = [smtp_account]
    template_cycle = cycle(templates or [html_content or ""])
    smtp_cycle = cycle(accounts)
    sent = 0
    while sent < count:
        current_smtp = next(smtp_cycle)
        current_html = next(template_cycle)
        await smtp_service.send_single_email(
            smtp_account=current_smtp,
            to_addresses=to,
            cc_addresses=cc,
            bcc_addresses=bcc,
            subject=subject,
            html_content=current_html,
            text_content=text_content,
            attachments=attachments,
            proxy_id=proxy_id,
        )
        sent += 1
    return sent
