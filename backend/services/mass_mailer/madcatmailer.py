"""
SGPT Core Mailing Engine - MadCatMailer
Advanced email delivery system with rate limiting, bounce handling, and performance optimization
"""

import asyncio
import logging
import random
import ssl
import time
from collections.abc import Callable

# Remove ThreadPoolExecutor import - using pure async now
from dataclasses import dataclass
from datetime import datetime, timedelta
from email import encoders
from email.mime.base import MIMEBase as MimeBase
from email.mime.multipart import MIMEMultipart as MimeMultipart
from email.mime.text import MIMEText as MimeText
from enum import Enum

import aiosmtplib  # Async SMTP library instead of smtplib

from .bulk_orchestrator import BulkMailOrchestrator

logger = logging.getLogger(__name__)


class DeliveryStatus(Enum):
    """Email delivery status codes"""

    PENDING = "pending"
    SENT = "sent"
    FAILED = "failed"
    BOUNCED = "bounced"
    REJECTED = "rejected"
    RATE_LIMITED = "rate_limited"
    RETRY = "retry"


@dataclass
class SMTPConfig:
    """SMTP server configuration"""

    host: str
    port: int
    username: str
    password: str
    use_ssl: bool = True
    use_tls: bool = False
    timeout: int = 30
    rate_limit: int = 100  # emails per minute


@dataclass
class EmailMessage:
    """Email message data"""

    to: str
    subject: str
    body_text: str
    body_html: str | None = None
    from_name: str | None = None
    reply_to: str | None = None
    attachments: list[str] | None = None
    variables: dict[str, str] | None = None


@dataclass
class DeliveryResult:
    """Email delivery result"""

    email: EmailMessage
    status: DeliveryStatus
    message_id: str | None = None
    error: str | None = None
    timestamp: datetime | None = None


class MadCatMailer:
    """
    Advanced async email delivery engine with:
    - Concurrent async SMTP connections
    - Rate limiting per provider
    - Bounce handling and retry logic
    - Template variable substitution
    - Performance monitoring
    - Pure async implementation for high concurrency
    """

    def __init__(
        self,
        smtp_configs: list[SMTPConfig],
        max_concurrent: int | None = None,
    ):
        self.smtp_configs = smtp_configs
        self.max_concurrent = max_concurrent or min(
            len(smtp_configs) * 10, 100
        )
        # Replace ThreadPoolExecutor with asyncio.Semaphore for concurrency control
        self.semaphore = asyncio.Semaphore(self.max_concurrent)

        # Rate limiting
        self.rate_limiters = {}
        for config in smtp_configs:
            self.rate_limiters[config.host] = {
                "count": 0,
                "reset_time": datetime.now() + timedelta(minutes=1),
                "limit": config.rate_limit,
            }

        # Connection pools - remove since aiosmtplib handles this
        self.stats = {
            "sent": 0,
            "failed": 0,
            "bounced": 0,
            "rate_limited": 0,
            "retries": 0,
        }

        # Callbacks
        self.progress_callback: Callable | None = None
        self.error_callback: Callable | None = None

    async def _get_smtp_connection(
        self, config: SMTPConfig
    ) -> aiosmtplib.SMTP:
        """Get async SMTP connection with proper configuration"""
        try:
            smtp = aiosmtplib.SMTP(
                hostname=config.host,
                port=config.port,
                timeout=config.timeout,
                use_tls=config.use_ssl,
            )
            await smtp.connect()

            if config.use_tls and not config.use_ssl:
                await smtp.starttls(tls_context=ssl.create_default_context())

            await smtp.login(config.username, config.password)
            return smtp

        except Exception as e:
            logger.error(
                f"Failed to connect to SMTP {config.host}:{config.port}: {e}"
            )
            raise

    def _check_rate_limit(self, host: str) -> bool:
        """Check if we can send email within rate limit"""
        limiter = self.rate_limiters.get(host)
        if not limiter:
            return True

        now = datetime.now()
        if now > limiter["reset_time"]:
            limiter["count"] = 0
            limiter["reset_time"] = now + timedelta(minutes=1)

        if limiter["count"] >= limiter["limit"]:
            return False

        limiter["count"] += 1
        return True

    def _substitute_variables(
        self, text: str, variables: dict[str, str]
    ) -> str:
        """Substitute template variables in text"""
        if not variables:
            return text

        for key, value in variables.items():
            text = text.replace(f"{{{key}}}", value)

        return text

    def _create_mime_message(
        self, email: EmailMessage, from_email: str
    ) -> MimeMultipart:
        """Create MIME message from EmailMessage"""
        msg = MimeMultipart("alternative")

        # Substitute variables
        subject = self._substitute_variables(
            email.subject, email.variables or {}
        )
        body_text = self._substitute_variables(
            email.body_text, email.variables or {}
        )
        body_html = self._substitute_variables(
            email.body_html or "", email.variables or {}
        )

        msg["Subject"] = subject
        msg["From"] = f"{email.from_name or 'SGPT'} <{from_email}>"
        msg["To"] = email.to

        if email.reply_to:
            msg["Reply-To"] = email.reply_to

        # Add text part
        msg.attach(MimeText(body_text, "plain"))

        # Add HTML part if available
        if body_html:
            msg.attach(MimeText(body_html, "html"))

        # Add attachments
        if email.attachments:
            for attachment_path in email.attachments:
                try:
                    with open(attachment_path, "rb") as f:
                        part = MimeBase("application", "octet-stream")
                        part.set_payload(f.read())
                        encoders.encode_base64(part)
                        part.add_header(
                            "Content-Disposition",
                            f"attachment; filename= {attachment_path.split('/')[-1]}",
                        )
                        msg.attach(part)
                except Exception as e:
                    logger.warning(
                        f"Failed to attach file {attachment_path}: {e}"
                    )

        return msg

    async def _send_single_email(
        self, email: EmailMessage, config: SMTPConfig
    ) -> DeliveryResult:
        """Send a single email using specified SMTP config with async implementation"""
        start_time = time.time()

        async with self.semaphore:  # Control concurrency
            try:
                # Check rate limit
                if not self._check_rate_limit(config.host):
                    return DeliveryResult(
                        email=email,
                        status=DeliveryStatus.RATE_LIMITED,
                        error="Rate limit exceeded",
                        timestamp=datetime.now(),
                    )

                # Create async SMTP connection
                smtp = await self._get_smtp_connection(config)

                # Create message
                msg = self._create_mime_message(email, config.username)

                # Send email asynchronously
                await smtp.send_message(msg)
                await smtp.quit()

                # Update stats
                self.stats["sent"] += 1

                result = DeliveryResult(
                    email=email,
                    status=DeliveryStatus.SENT,
                    message_id=msg.get("Message-ID"),
                    timestamp=datetime.now(),
                )

                # Call progress callback
                if self.progress_callback:
                    await self.progress_callback(result, self.stats.copy())

                logger.debug(
                    f"Email sent to {email.to} via {config.host} in {time.time() - start_time:.2f}s"
                )
                return result

            except aiosmtplib.SMTPRecipientsRefused as e:
                error_msg = f"Recipients refused: {e}"
                self.stats["bounced"] += 1

                result = DeliveryResult(
                    email=email,
                    status=DeliveryStatus.BOUNCED,
                    error=error_msg,
                    timestamp=datetime.now(),
                )

            except aiosmtplib.SMTPDataError as e:
                error_msg = f"SMTP data error: {e}"
                self.stats["failed"] += 1

                result = DeliveryResult(
                    email=email,
                    status=DeliveryStatus.FAILED,
                    error=error_msg,
                    timestamp=datetime.now(),
                )

            except Exception as e:
                error_msg = f"Unexpected error: {e}"
                self.stats["failed"] += 1

                result = DeliveryResult(
                    email=email,
                    status=DeliveryStatus.FAILED,
                    error=error_msg,
                    timestamp=datetime.now(),
                )

            # Call error callback
            if self.error_callback:
                await self.error_callback(result, error_msg)

            logger.error(f"Failed to send email to {email.to}: {result.error}")
            return result

    async def send_bulk(
        self,
        emails: list[EmailMessage],
        progress_callback: Callable | None = None,
        error_callback: Callable | None = None,
    ) -> list[DeliveryResult]:
        """
        Send bulk emails with async processing and load balancing for high concurrency
        """
        self.progress_callback = progress_callback
        self.error_callback = error_callback

        logger.info(
            f"Starting async bulk send of {len(emails)} emails using {len(self.smtp_configs)} SMTP servers"
        )

        # Create tasks for all emails with load balancing
        tasks = []
        for i, email in enumerate(emails):
            config = self.smtp_configs[i % len(self.smtp_configs)]
            task = self._send_single_email(email, config)
            tasks.append(task)

        # Process tasks in batches for memory efficiency with large volumes
        batch_size = min(1000, len(tasks))
        results = []

        for i in range(0, len(tasks), batch_size):
            batch = tasks[i : i + batch_size]
            batch_results = await asyncio.gather(
                *batch, return_exceptions=True
            )

            # Filter out exceptions and add to results
            for result in batch_results:
                if isinstance(result, Exception):
                    logger.error(f"Task failed with exception: {result}")
                    results.append(
                        DeliveryResult(
                            email=EmailMessage(
                                to="unknown", subject="", body_text=""
                            ),
                            status=DeliveryStatus.FAILED,
                            error=str(result),
                            timestamp=datetime.now(),
                        )
                    )
                else:
                    results.append(result)

            # Short delay between batches to prevent overwhelming servers
            if i + batch_size < len(tasks):
                await asyncio.sleep(0.1)

        logger.info(f"Async bulk send completed. Stats: {self.stats}")
        return results

    async def send_with_retry(
        self, email: EmailMessage, max_retries: int = 3, retry_delay: int = 5
    ) -> DeliveryResult:
        """Send email with async retry logic"""

        for attempt in range(max_retries + 1):
            # Try different SMTP configs on retries
            config_index = attempt % len(self.smtp_configs)
            config = self.smtp_configs[config_index]

            result = await self._send_single_email(email, config)

            if result.status == DeliveryStatus.SENT:
                return result

            if result.status in [
                DeliveryStatus.BOUNCED,
                DeliveryStatus.REJECTED,
            ]:
                # Don't retry for permanent failures
                return result

            if attempt < max_retries:
                logger.info(
                    f"Retrying email to {email.to} in {retry_delay} seconds (attempt {attempt + 1}/{max_retries})"
                )
                await asyncio.sleep(
                    retry_delay + random.uniform(0, 2)
                )  # Add jitter
                self.stats["retries"] += 1

        return result

    def get_stats(self) -> dict[str, int]:
        """Get current sending statistics"""
        return self.stats.copy()

    def reset_stats(self):
        """Reset statistics counters"""
        self.stats = {
            "sent": 0,
            "failed": 0,
            "bounced": 0,
            "rate_limited": 0,
            "retries": 0,
        }

    # Remove shutdown method since we're not using ThreadPoolExecutor anymore
    # async def shutdown(self):
    #     """Async shutdown - no longer needed with pure async implementation"""
    #     logger.info("MadCatMailer shutdown complete")


# Compatibility with legacy bulk orchestrator
__all__ = [
    "MadCatMailer",
    "BulkMailOrchestrator",
    "EmailMessage",
    "SMTPConfig",
    "DeliveryResult",
    "DeliveryStatus",
]
