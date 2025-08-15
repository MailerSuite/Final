import asyncio
import smtplib
import ssl
import time
from concurrent.futures import ThreadPoolExecutor

import python_socks.sync

from config.settings import settings
from core.logger import get_logger
from schemas.smtp import SMTPAccountCreate, SMTPStatus, SMTPTestResult
from utils.metrics import SMTP_METRICS
from utils.smtp_auto_detect import TLSMode, detect_tls_mode
from utils.smtp_parser import parse_smtp_line
from utils.thread_pool_manager import ThreadPoolManager

logger = get_logger(__name__)


class SMTPChecker:
    """SMTP account checker"""

    def __init__(self, timeout: int = 30, proxy_url: str | None = None):
        self.timeout = timeout
        self.proxy_url = proxy_url

    async def check_smtp_account(
        self,
        account: SMTPAccountCreate,
        *,
        executor: ThreadPoolExecutor | None = None,
    ) -> SMTPTestResult:
        """Check single SMTP account"""
        start_time = time.time()
        try:
            result = await asyncio.get_event_loop().run_in_executor(
                executor, self._check_smtp_sync, account, self.proxy_url
            )
            response_time = time.time() - start_time
            SMTP_METRICS.record(result["success"], response_time * 1000)
            if result["success"]:
                return SMTPTestResult(
                    email=account.email,
                    status=SMTPStatus.VALID,
                    response_time=response_time,
                )
            else:
                return SMTPTestResult(
                    email=account.email,
                    status=SMTPStatus.INVALID,
                    response_time=response_time,
                    error_message=str(result["error"]),
                )
        except Exception as e:
            response_time = time.time() - start_time
            logger.error(f"SMTP check error for {account.email}: {e}")
            SMTP_METRICS.record(False, response_time * 1000)
            return SMTPTestResult(
                email=account.email,
                status=SMTPStatus.ERROR,
                response_time=response_time,
                error_message=str(e),
            )

    def _check_smtp_sync(
        self, account: SMTPAccountCreate, proxy_url: str | None = None
    ) -> dict:
        """Synchronous SMTP check"""
        if (
            settings.FIREWALL_ENABLED
            and settings.SMTP_PROXY_FORCE
            and (not proxy_url)
        ):
            return {
                "success": False,
                "error": "No SOCKS proxy configured. Please set one in Proxy Manager.",
            }
        server: smtplib.SMTP | None = None
        try:
            context = ssl.create_default_context()
            try:
                mode = detect_tls_mode(account.server, account.port, timeout=5)
            except Exception:
                mode = TLSMode.NONE
            if proxy_url:
                sock = python_socks.sync.Proxy.from_url(proxy_url).connect(
                    account.server, account.port, timeout=self.timeout
                )
                if mode is TLSMode.SSL:
                    server = smtplib.SMTP_SSL(
                        account.server,
                        account.port,
                        timeout=self.timeout,
                        context=context,
                    )
                    server.sock = sock
                    server.file = sock.makefile("rb")
                else:
                    server = smtplib.SMTP(
                        account.server, account.port, timeout=self.timeout
                    )
                    server.sock = sock
                    server.file = sock.makefile("rb")
            else:
                if mode is TLSMode.SSL:
                    server = smtplib.SMTP_SSL(
                        account.server,
                        account.port,
                        timeout=self.timeout,
                        context=context,
                    )
                else:
                    server = smtplib.SMTP(
                        account.server, account.port, timeout=self.timeout
                    )
            server.ehlo()
            if mode is TLSMode.STARTTLS:
                server.starttls(context=context)
                server.ehlo()
            server.login(account.email, account.password)
            server.noop()
            return {"success": True, "error": None}
        except smtplib.SMTPAuthenticationError as e:
            return {"success": False, "error": f"Authentication failed: {e}"}
        except smtplib.SMTPConnectError as e:
            return {"success": False, "error": f"Connection failed: {e}"}
        except smtplib.SMTPException as e:
            return {"success": False, "error": f"SMTP error: {e}"}
        except Exception as e:
            return {"success": False, "error": f"Unexpected error: {e}"}
        finally:
            if server is not None:
                try:
                    server.quit()
                except Exception:
                    pass

    async def check_multiple_accounts(
        self,
        accounts: list[SMTPAccountCreate],
        max_concurrent: int = settings.SMTP_MAX_CONCURRENT,
        thread_pool_id: str | None = None,
    ) -> list[SMTPTestResult]:
        """Check multiple SMTP accounts concurrently"""
        external_executor = False
        if thread_pool_id:
            executor = ThreadPoolManager.get_executor(
                thread_pool_id, max_concurrent
            )
        else:
            executor = ThreadPoolExecutor(max_workers=max_concurrent)
            external_executor = True
        try:
            tasks = [
                self.check_smtp_account(account, executor=executor)
                for account in accounts
            ]
            results = await asyncio.gather(*tasks, return_exceptions=True)
        finally:
            if external_executor:
                executor.shutdown(wait=False)
        final_results = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                final_results.append(
                    SMTPTestResult(
                        email=accounts[i].email,
                        status=SMTPStatus.ERROR,
                        error_message=str(result),
                    )
                )
            else:
                final_results.append(result)
        return final_results


def parse_smtp_list(content: str) -> list[SMTPAccountCreate]:
    """Parse SMTP list from text content."""
    accounts: list[SMTPAccountCreate] = []
    lines = content.strip().split("\n")
    for line in lines:
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        try:
            parsed = parse_smtp_line(line)
            if not parsed:
                logger.warning(f"Invalid SMTP format: {line}")
                continue
            accounts.append(
                SMTPAccountCreate(
                    server=parsed["server"],
                    port=parsed["port"],
                    email=parsed["email"],
                    password=parsed["password"],
                )
            )
        except Exception as e:
            logger.warning(f"Failed to parse SMTP line '{line}': {e}")
            continue
    return accounts


def _auto_detect_smtp_server(email: str) -> tuple[str, int]:
    domain = email.split("@")[1].lower()
    smtp_servers = {
        "gmail.com": ("smtp.gmail.com", 587),
        "outlook.com": ("smtp-mail.outlook.com", 587),
        "hotmail.com": ("smtp-mail.outlook.com", 587),
        "yahoo.com": ("smtp.mail.yahoo.com", 587),
        "aol.com": ("smtp.aol.com", 587),
        "icloud.com": ("smtp.mail.me.com", 587),
    }
    return smtp_servers.get(domain, (f"smtp.{domain}", 587))
