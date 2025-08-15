import ssl
from enum import Enum
from smtplib import SMTP, SMTP_SSL

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from models.base import SMTPAccount


class TLSMode(Enum):
    """Possible TLS modes for SMTP connections."""

    STARTTLS = "STARTTLS"
    SSL = "SSL"
    NONE = "NONE"


def detect_tls_mode(host: str, port: int, timeout: int = 5) -> TLSMode:
    """Detect whether ``host:port`` supports SSL, STARTTLS or no TLS."""
    if port == 465:
        try:
            with SMTP_SSL(host=host, port=port, timeout=timeout) as server:
                server.ehlo()
            return TLSMode.SSL
        except Exception:
            # fall back to plaintext detection
            pass
    try:
        with SMTP(host=host, port=port, timeout=timeout) as server:
            server.ehlo()
            if server.has_extn("starttls"):
                return TLSMode.STARTTLS
    except Exception:
        return TLSMode.NONE
    return TLSMode.NONE


def auto_detect_smtp_config(
    host: str,
    username: str,
    password: str,
    *,
    timeout: int = 10,
    tls_verify: bool = True,
) -> dict:
    context = ssl.create_default_context()
    if not tls_verify:
        context.check_hostname = False
        context.verify_mode = ssl.CERT_NONE
    errors = []
    try:
        with SMTP_SSL(
            host=host, port=465, timeout=timeout, context=context
        ) as server:
            server.login(username, password)
            return {"host": host, "port": 465, "encryption": "SMTPS"}
    except Exception as exc:
        errors.append(f"SMTPS failed: {exc}")
    try:
        with SMTP(host=host, port=587, timeout=timeout) as server:
            server.starttls(context=context)
            server.login(username, password)
            return {"host": host, "port": 587, "encryption": "STARTTLS"}
    except Exception as exc:
        errors.append(f"STARTTLS failed: {exc}")
    raise ValueError("; ".join(errors))


async def select_smtp_accounts(
    db: AsyncSession,
    session_id: str,
    smtp_mode: str = "all",
    smtp_ids: list[str] | None = None,
) -> list[SMTPAccount]:
    """Return SMTP accounts for a session according to mode."""
    if smtp_mode == "specific" and smtp_ids:
        result = await db.execute(
            select(SMTPAccount).where(
                SMTPAccount.session_id == session_id,
                SMTPAccount.id.in_(smtp_ids),
            )
        )
        return list(result.scalars())
    result = await db.execute(
        select(SMTPAccount).where(SMTPAccount.session_id == session_id)
    )
    return list(result.scalars())
