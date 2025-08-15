import asyncio
import imaplib
import ssl
import time
from concurrent.futures import ThreadPoolExecutor

import python_socks.sync

from config.settings import settings
from core.logger import get_logger
from schemas.imap import IMAPAccountCreate, IMAPStatus, IMAPTestResult
from utils.thread_pool_manager import ThreadPoolManager

logger = get_logger(__name__)


class IMAPChecker:
    """IMAP account checker"""

    def __init__(self, timeout: int = 30, proxy_url: str | None = None):
        self.timeout = timeout
        self.proxy_url = proxy_url

    async def check_imap_account(
        self,
        account: IMAPAccountCreate,
        executor: ThreadPoolExecutor | None = None,
    ) -> IMAPTestResult:
        """Check single IMAP account"""
        start_time = time.time()
        try:
            result = await asyncio.get_event_loop().run_in_executor(
                executor, self._check_imap_sync, account, self.proxy_url
            )
            response_time = time.time() - start_time
            if result["success"]:
                return IMAPTestResult(
                    email=account.email,
                    status=IMAPStatus.VALID,
                    inbox_count=result.get("inbox_count", 0),
                    response_time=response_time,
                    tls_verified=result.get("tls_verified"),
                    login_latency=result.get("login_latency"),
                    error_type=None,
                )
            else:
                return IMAPTestResult(
                    email=account.email,
                    status=(
                        IMAPStatus.ERROR
                        if result.get("error_type") == "ssl"
                        else IMAPStatus.INVALID
                    ),
                    response_time=response_time,
                    error_message=result["error"],
                    tls_verified=result.get("tls_verified"),
                    login_latency=result.get("login_latency"),
                    error_type=result.get("error_type"),
                )
        except Exception as e:
            response_time = time.time() - start_time
            logger.error(f"IMAP check error for {account.email}: {e}")
            return IMAPTestResult(
                email=account.email,
                status=IMAPStatus.ERROR,
                response_time=response_time,
                error_message=str(e),
                error_type=e.__class__.__name__.lower(),
            )

    def _check_imap_sync(
        self, account: IMAPAccountCreate, proxy_url: str | None = None
    ) -> dict:
        """Synchronous IMAP check"""
        if (
            settings.FIREWALL_ENABLED
            and settings.IMAP_PROXY_FORCE
            and (not proxy_url)
        ):
            return {
                "success": False,
                "error": "No SOCKS proxy configured. Please set one in Proxy Manager.",
                "error_type": "proxy",
            }
        timeout = account.timeout or self.timeout
        retries = account.retries or 1
        last_error: dict | None = None
        for _ in range(retries):
            mail = None
            tls_verified = False
            login_latency = None
            try:
                if proxy_url:
                    sock = python_socks.sync.Proxy.from_url(proxy_url).connect(
                        account.server, account.port, timeout=timeout
                    )
                    if account.port == 993:
                        ctx = ssl.create_default_context()
                        mail = imaplib.IMAP4_SSL(
                            account.server, account.port, ssl_context=ctx
                        )
                        mail.sock = sock
                        mail.file = sock.makefile("rb")
                        tls_verified = True
                    else:
                        mail = imaplib.IMAP4(account.server, account.port)
                        mail.sock = sock
                        mail.file = sock.makefile("rb")
                        if account.port == 143:
                            ctx = ssl.create_default_context()
                            mail.starttls(ssl_context=ctx)
                            tls_verified = True
                elif account.port == 993:
                    ctx = ssl.create_default_context()
                    mail = imaplib.IMAP4_SSL(
                        account.server,
                        account.port,
                        ssl_context=ctx,
                        timeout=timeout,
                    )
                    tls_verified = True
                else:
                    mail = imaplib.IMAP4(
                        account.server, account.port, timeout=timeout
                    )
                    if account.port == 143:
                        ctx = ssl.create_default_context()
                        mail.starttls(ssl_context=ctx)
                        tls_verified = True
                start_login = time.time()
                mail.login(account.email, account.password)
                login_latency = time.time() - start_login
                status, messages = mail.select("INBOX")
                if status != "OK":
                    raise imaplib.IMAP4.error(f"select returned {status}")
                inbox_count = int(messages[0])
                return {
                    "success": True,
                    "error": None,
                    "inbox_count": inbox_count,
                    "tls_verified": tls_verified,
                    "login_latency": login_latency,
                    "error_type": None,
                }
            except ssl.SSLCertVerificationError as e:
                last_error = {
                    "success": False,
                    "error": f"SSL verify failed: {e}",
                    "tls_verified": False,
                    "login_latency": login_latency,
                    "error_type": "ssl",
                }
                break
            except (TimeoutError, imaplib.IMAP4.error) as e:
                last_error = {
                    "success": False,
                    "error": f"IMAP error: {e}",
                    "tls_verified": tls_verified,
                    "login_latency": login_latency,
                    "error_type": "imap",
                }
            except Exception as e:
                last_error = {
                    "success": False,
                    "error": f"Unexpected error: {e}",
                    "tls_verified": tls_verified,
                    "login_latency": login_latency,
                    "error_type": e.__class__.__name__.lower(),
                }
            finally:
                if mail:
                    try:
                        mail.logout()
                    except Exception:
                        pass
        return last_error or {
            "success": False,
            "error": "unknown",
            "error_type": "unknown",
        }

    async def check_multiple_accounts(
        self,
        accounts: list[IMAPAccountCreate],
        max_concurrent: int = settings.IMAP_MAX_CONCURRENT,
        thread_pool_id: str | None = None,
    ) -> list[IMAPTestResult]:
        """Check multiple IMAP accounts concurrently"""
        executor = None
        if thread_pool_id:
            pool = ThreadPoolManager.get_pool(thread_pool_id)
            if pool:
                max_concurrent = pool.max_connections
                delay = pool.delay_ms / 1000
                executor = ThreadPoolManager.get_executor(
                    thread_pool_id, pool.max_connections
                )
            else:
                delay = 0
        else:
            delay = 0
        semaphore = asyncio.Semaphore(max_concurrent)

        async def check_with_semaphore(account):
            async with semaphore:
                result = await self.check_imap_account(
                    account, executor=executor
                )
                if delay:
                    await asyncio.sleep(delay)
                return result

        tasks = [check_with_semaphore(account) for account in accounts]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        final_results = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                final_results.append(
                    IMAPTestResult(
                        email=accounts[i].email,
                        status=IMAPStatus.ERROR,
                        error_message=str(result),
                    )
                )
            else:
                final_results.append(result)
        return final_results


def parse_imap_list(content: str) -> list[IMAPAccountCreate]:
    """Parse IMAP list from text content"""
    accounts = []
    lines = content.strip().split("\n")
    for line in lines:
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        try:
            delimiter = ":"
            if ";" in line and (":" not in line or line.count(";") in {1, 3}):
                delimiter = ";"
            parts = line.split(delimiter, 3)
            if len(parts) == 4:
                server, port, email, password = parts
                port = int(port)
            elif len(parts) == 2:
                email, password = parts
                server, port = _auto_detect_imap_server(email)
            else:
                logger.warning(f"Invalid IMAP format: {line}")
                continue
            accounts.append(
                IMAPAccountCreate(
                    server=server, port=port, email=email, password=password
                )
            )
        except (ValueError, IndexError) as e:
            logger.warning(f"Failed to parse IMAP line '{line}': {e}")
            continue
    return accounts


def _auto_detect_imap_server(email: str) -> tuple:
    domain = email.split("@")[1].lower()
    imap_servers = {
        "gmail.com": ("imap.gmail.com", 993),
        "outlook.com": ("outlook.office365.com", 993),
        "hotmail.com": ("outlook.office365.com", 993),
        "yahoo.com": ("imap.mail.yahoo.com", 993),
        "aol.com": ("imap.aol.com", 993),
        "icloud.com": ("imap.mail.me.com", 993),
    }
    return imap_servers.get(domain, (f"imap.{domain}", 993))
