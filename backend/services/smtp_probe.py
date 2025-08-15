import asyncio
from dataclasses import dataclass
from enum import Enum

from aiosmtplib import (
    SMTP,
    SMTPAuthenticationError,
    SMTPConnectError,
    SMTPException,
)

from core.logger import get_logger
from services.dns_utils import resolve_mx

logger = get_logger(__name__)


class ErrorCode(str, Enum):
    DNS_FAIL = "DNS_FAIL"
    TIMEOUT = "TIMEOUT"
    TLS_REQUIRED = "TLS_REQUIRED"
    AUTH_FAILED = "AUTH_FAILED"
    CONNECTION_FAILED = "CONNECT_FAIL"
    UNKNOWN = "UNKNOWN"


@dataclass
class SMTPProbeResult:
    success: bool
    latency: float | None
    error_message: str | None


class SMTPProbeError(Exception):
    def __init__(self, code: ErrorCode, detail: str) -> None:
        super().__init__(detail)
        self.code = code
        self.detail = detail


class SMTPProbe:
    def __init__(self, timeout: int = 30) -> None:
        self.timeout = timeout

    async def check(
        self, host: str | None, port: int, username: str, password: str
    ) -> SMTPProbeResult:
        start = asyncio.get_event_loop().time()
        if not host:
            domain = username.split("@", 1)[1]
            try:
                mx_hosts = await resolve_mx(domain)
            except Exception as exc:
                return SMTPProbeResult(False, None, str(exc))
            if not mx_hosts:
                return SMTPProbeResult(False, None, "no MX records")
            host = mx_hosts[0]
        try:
            smtp = SMTP(hostname=host, port=port, timeout=self.timeout)
            await smtp.connect()
        except TimeoutError as _exc:
            return SMTPProbeResult(False, None, "connection timeout")
        except SMTPConnectError as _exc:
            return SMTPProbeResult(False, None, str(_exc))
        except SMTPException as _exc:
            return SMTPProbeResult(False, None, str(_exc))
        try:
            if port == 587:
                if not smtp.supports_extension("starttls"):
                    await smtp.quit()
                    return SMTPProbeResult(False, None, "STARTTLS required")
                await smtp.starttls()
                await smtp.ehlo()
            await smtp.login(username, password)
            await smtp.quit()
        except SMTPAuthenticationError as _exc:
            await smtp.quit()
            return SMTPProbeResult(False, None, str(_exc))
        except TimeoutError as _exc:
            await smtp.quit()
            return SMTPProbeResult(False, None, "auth timeout")
        except SMTPException as _exc:
            await smtp.quit()
            return SMTPProbeResult(False, None, str(_exc))
        latency = asyncio.get_event_loop().time() - start
        return SMTPProbeResult(
            success=True, latency=latency, error_message=None
        )
