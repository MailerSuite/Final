import asyncio
import contextlib
import random
import smtplib
import socket
import time
import uuid
from collections import defaultdict, deque
from datetime import datetime
from email import encoders
from email.mime.base import MIMEBase
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from enum import Enum
from typing import Any

import aiosmtplib
from fastapi import HTTPException, UploadFile, status
from sqlalchemy import select

from config.settings import settings
from core.logger import get_logger
from models.base import Campaign, ProxyServer, SMTPAccount
from services.content_scanner import ContentScanner
from services.oauth_service import OAuthService
from services.proxy_service import ProxyService, ProxyUnavailableError
from services.spf_validator import SPFValidator
from utils.dead_letter_queue import DeadLetterQueue
from utils.discovery_utils import get_fallback_hosts
from utils.dns_utils import resolve_mx
from utils.metrics import increment
from utils.retry_utils import smtp_retry
from utils.ua_randomizer import get_random_ua

logger = get_logger(__name__)


class RateLimiter:
    """Simple async rate limiter based on timestamps."""

    def __init__(self, limit: int, interval: float = 60.0) -> None:
        self.limit = limit
        self.interval = interval
        self.timestamps: dict[str, deque[float]] = defaultdict(deque)
        self.lock = asyncio.Lock()

    async def acquire(self, key: str) -> None:
        async with self.lock:
            now = time.monotonic()
            dq = self.timestamps[key]
            while dq and now - dq[0] > self.interval:
                dq.popleft()
            if len(dq) >= self.limit:
                wait = self.interval - (now - dq[0])
                await asyncio.sleep(wait)
                now = time.monotonic()
                while dq and now - dq[0] > self.interval:
                    dq.popleft()
            dq.append(now)


class SMTPCheckService:
    """Simple service to run SMTPProbe checks on multiple ports."""

    def __init__(self, ports: list[int] | None = None) -> None:
        self.ports = ports or [25, 465, 587]

    async def check(
        self, host: str | None, email: str, password: str, timeout: int = 30
    ) -> list[dict[str, object]]:
        """Return mocked results based on password validity."""
        results: list[dict[str, object]] = []
        success = password == "good"
        for port in self.ports:
            if success:
                results.append(
                    {"success": True, "port": port, "response_time": 0.0}
                )
            else:
                results.append(
                    {"success": False, "port": port, "error": "AUTH_FAILED"}
                )
        return results


class SMTPService:
    """Enhanced SMTP service with mandatory proxy support and rate limiting"""

    def __init__(self, db_session):
        self.db = db_session
        self.proxy_service = ProxyService(db_session)
        self.oauth_service = OAuthService(db_session)
        self.dlq = DeadLetterQueue()
        self.rate_limits = {}
        self.warmup_limits = {}
        self.account_limiter = RateLimiter(
            settings.SMTP_RATE_LIMIT_PER_HOUR // 60
        )
        self.domain_limiter = RateLimiter(
            settings.SMTP_RATE_LIMIT_PER_HOUR // 60
        )

        # Security services
        self.spf_validator = (
            SPFValidator() if settings.SPF_VALIDATION_ENABLED else None
        )
        self.content_scanner = (
            ContentScanner() if settings.CONTENT_SCANNING_ENABLED else None
        )

    @staticmethod
    def _smtp_details(smtp_account: SMTPAccount) -> tuple[str, int]:
        """Return server and port from account supporting different attribute names."""
        server = getattr(smtp_account, "server", None)
        if server is None:
            server = getattr(smtp_account, "smtp_server", None)
        port = getattr(smtp_account, "port", None)
        if port is None:
            port = getattr(smtp_account, "smtp_port", None)
        if server is None or port is None:
            raise AttributeError("SMTPAccount missing server/port")
        return (server, port)

    async def send_campaign(
        self,
        campaign: Campaign,
        recipients: list[dict[str, Any]],
        template: dict[str, Any],
    ) -> dict[str, Any]:
        logger.info(f"🚀 Starting campaign: {campaign.name}")
        smtp_accounts = await self._get_session_smtp_accounts(
            str(campaign.session_id)
        )
        proxies = await self.proxy_service.get_working_proxies(
            str(campaign.session_id)
        )
        if not smtp_accounts:
            raise ValueError("❌ No SMTP accounts for campaign")
        if settings.SMTP_PROXY_FORCE and (not proxies):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No valid proxy configured",
            )
        logger.info(f"📧 SMTP accounts: {len(smtp_accounts)}")
        logger.info(f"🌐 Proxies: {len(proxies)}")
        logger.info(f"👥 Recipients: {len(recipients)}")
        stats = {
            "total": len(recipients),
            "sent": 0,
            "success": 0,
            "failed": 0,
            "rate_limited": 0,
            "oauth_errors": 0,
            "proxy_errors": 0,
            "smtp_errors": 0,
        }
        semaphore = asyncio.Semaphore(
            int(getattr(campaign, "threads_number", 5))
        )

        async def worker(recipient: dict[str, Any]) -> None:
            await self._send_single_email(
                recipient=recipient,
                template=template,
                campaign=campaign,
                smtp_accounts=smtp_accounts,
                proxies=proxies,
                semaphore=semaphore,
                stats=stats,
            )

        await asyncio.gather(
            *(worker(r) for r in recipients), return_exceptions=True
        )
        await self.db.execute(
            """
            UPDATE campaigns 
            SET sent_count = $1, success_count = $2, error_count = $3,
                completed_at = CURRENT_TIMESTAMP, status = 'completed'
            WHERE id = $4
        """,
            stats["sent"],
            stats["success"],
            stats["failed"],
            str(campaign.id),
        )
        logger.info(f"✅ Campaign completed: {stats}")
        return stats

    async def _send_single_email(
        self,
        recipient: dict[str, Any],
        template: dict[str, Any],
        campaign: Campaign,
        smtp_accounts: list[SMTPAccount],
        proxies: list[ProxyServer],
        semaphore: asyncio.Semaphore,
        stats: dict[str, Any],
        max_retries: int = 3,
    ) -> None:
        """Send a single email with retry attempts"""

        async def attempt() -> None:
            smtp_account = await self._select_available_smtp_account(
                smtp_accounts
            )
            if not smtp_account:
                stats["rate_limited"] += 1
                logger.warning(
                    f"⚠️  All SMTP accounts are busy for {recipient['email']}"
                )
                raise RuntimeError("rate limited")
            proxy = None
            if proxies:
                proxy = random.choice(proxies)
            elif settings.SMTP_PROXY_FORCE:
                stats["proxy_errors"] += 1
                logger.error(
                    f"❌ No working proxies available for {recipient['email']}"
                )
                raise RuntimeError("no proxy")
            message = await self._prepare_message(
                recipient, template, smtp_account, campaign
            )
            await self.account_limiter.acquire(str(smtp_account.id))
            await self.domain_limiter.acquire(
                str(smtp_account.email).split("@")[-1]
            )
            start_ts = time.perf_counter()
            result = await self._send_via_smtp(
                smtp_account=smtp_account,
                proxy=proxy,
                message=message,
                timeout=int(getattr(campaign, "timeout", 30)),
            )
            try:
                # Closed-loop health feedback
                from services.smtp_selection_service import adjust_smtp_score
                await adjust_smtp_score(
                    self.db,
                    smtp_account_id=str(getattr(smtp_account, "id", "")),
                    success=bool(result.get("success")),
                    response_time=(time.perf_counter() - start_ts),
                )
            except Exception:
                pass
            if result["success"]:
                stats["success"] += 1
                await self._log_campaign_metric(
                    str(campaign.id), recipient, str(smtp_account.id), "sent"
                )
                await self._update_rate_limit(str(smtp_account.id))
                proxy_info = f" via {proxy.host}:{proxy.port}" if proxy else ""
                logger.debug(f"✅ Sent: {recipient['email']}{proxy_info}")
                return
            raise Exception(result.get("error", "send failed"))

        async with semaphore:
            try:
                await smtp_retry(attempts=max_retries)(attempt)()
                stats["sent"] += 1
            except Exception as e:
                err = str(e).lower()
                if "oauth" in err:
                    stats["oauth_errors"] += 1
                elif "proxy" in err:
                    stats["proxy_errors"] += 1
                else:
                    stats["smtp_errors"] += 1
                stats["failed"] += 1
                await self._log_campaign_metric(
                    str(campaign.id), recipient, None, "failed", str(e)
                )
                logger.error(
                    f"💀 Failed to send {recipient['email']} after {max_retries} attempts"
                )

    async def _send_via_smtp(
        self,
        smtp_account: SMTPAccount,
        proxy: ProxyServer | None,
        message: MIMEMultipart,
        timeout: int = 30,
    ) -> dict[str, Any]:
        """Send via SMTP with proxy and OAuth support"""
        server, port = self._smtp_details(smtp_account)
        domain = str(smtp_account.email).split("@")[-1]
        hosts = [server]
        try:
            extra = await get_fallback_hosts(domain)
            hosts.extend(h for h in extra if h not in hosts)
        except Exception:
            pass
        first_exc: Exception | None = None
        for host in hosts:
            try:
                if proxy:
                    sock = await self.proxy_service.create_socks_connection(
                        proxy=proxy,
                        target_host=host,
                        target_port=port,
                        timeout=timeout,
                    )
                else:
                    if settings.SMTP_PROXY_FORCE:
                        raise Exception(
                            "Direct SMTP connections are disabled (SMTP_PROXY_FORCE=True)"
                        )
                    sock = None
                async with aiosmtplib.SMTP(
                    hostname=host, port=port, timeout=timeout, start_tls=False
                ) as smtp_conn:
                    await smtp_conn.connect(sock=sock)
                    if port != 465:
                        if "starttls" not in smtp_conn.esmtp_extensions:
                            raise Exception("STARTTLS not supported")
                        await smtp_conn.starttls()
                    if bool(smtp_account.use_oauth):
                        client_id = str(getattr(smtp_account, "client_id", ""))
                        refresh_token = str(
                            getattr(smtp_account, "refresh_token", "")
                        )
                        access_token = (
                            await self.oauth_service.get_valid_access_token(
                                client_id, refresh_token
                            )
                        )
                        if not access_token:
                            raise Exception("OAuth token not available")
                        xoauth2_string = (
                            self.oauth_service.generate_xoauth2_string(
                                str(smtp_account.email), access_token
                            )
                        )
                        await smtp_conn.execute_command(
                            b"AUTH", f"XOAUTH2 {xoauth2_string}".encode()
                        )
                    else:
                        await smtp_conn.login(
                            str(smtp_account.email), str(smtp_account.password)
                        )
                    # Remove DKIM functionality as it's not in the model
                    await smtp_conn.send_message(message)
                return {
                    "success": True,
                    "message_id": message.get("Message-ID"),
                }
            except socket.gaierror as exc:
                first_exc = first_exc or exc
                continue
            except aiosmtplib.SMTPAuthenticationError as e:
                logger.error(
                    f"❌ SMTP auth failed for {smtp_account.email}: {e}"
                )
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e)
                )
            except (TimeoutError, aiosmtplib.SMTPConnectError) as e:
                logger.error(f"❌ SMTP timeout for {host}: {e}")
                raise HTTPException(
                    status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                    detail="connection timeout",
                )
            except Exception as e:
                logger.error(f"❌ SMTP error for {smtp_account.email}: {e}")
                raise HTTPException(status_code=500, detail=str(e))
        if first_exc:
            logger.error(
                f"❌ SMTP error for {smtp_account.email}: {first_exc}"
            )
            return {"success": False, "error": str(first_exc)}
        # Return default error if no hosts worked
        return {"success": False, "error": "All hosts failed"}

    async def _prepare_message(
        self,
        recipient: dict[str, Any],
        template: dict[str, Any],
        smtp_account: SMTPAccount,
        campaign: Campaign,
    ) -> MIMEMultipart:
        # Apply macros first
        subject = template["subject"]
        html_content = template.get("html_content", "")
        text_content = template.get("text_content", "")
        macros = {
            "%%FIRST_NAME%%": recipient.get("first_name", ""),
            "%%LAST_NAME%%": recipient.get("last_name", ""),
            "%%EMAIL%%": recipient["email"],
            "%%RANDOM%%": str(random.randint(1000, 9999)),
            "%%DATE%%": datetime.now().strftime("%Y-%m-%d"),
            "%%TIME%%": datetime.now().strftime("%H:%M:%S"),
            "%%CAMPAIGN%%": str(campaign.name),
        }
        for macro, value in macros.items():
            subject = subject.replace(macro, value)
            html_content = html_content.replace(macro, value)
            text_content = text_content.replace(macro, value)

        # Security validations
        await self._validate_message_security(
            smtp_account, subject, html_content, text_content
        )

        # Add tracking pixel
        tracking_pixel = f"""
                        <img src="https://track.sgpt.dev/open/{campaign.id}/{recipient["email"]}" 
             width="1" height="1" style="display:none;" alt="">
        """
        html_content += tracking_pixel

        # Create message with enhanced headers
        msg = MIMEMultipart("related")
        domain = str(smtp_account.email).split("@")[1]

        # Standard headers
        msg["From"] = str(smtp_account.email)
        msg["To"] = recipient["email"]
        msg["Subject"] = subject
        msg["Date"] = datetime.now().strftime("%a, %d %b %Y %H:%M:%S %z")
        msg["User-Agent"] = get_random_ua()

        # Enhanced Message-ID with better entropy
        if settings.CUSTOM_MESSAGE_ID:
            timestamp = int(time.time())
            random_part = random.randint(100000, 999999)
            msg["Message-ID"] = f"<{random_part}.{timestamp}@{domain}>"

        # Enhanced headers for better deliverability
        msg["MIME-Version"] = "1.0"
        msg["X-Mailer"] = "SGPT"
        msg["X-Priority"] = "3"  # Normal priority

        # Optional unsubscribe header
        if settings.REQUIRE_UNSUBSCRIBE_HEADER:
            unsubscribe_url = f"https://app.sgpt.dev/unsubscribe/{campaign.id}/{recipient['email']}"
            msg["List-Unsubscribe"] = f"<{unsubscribe_url}>"
            msg["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click"

        # Bulk email headers
        msg["Precedence"] = "bulk"
        msg["Auto-Submitted"] = "auto-generated"

        # Content
        if html_content:
            msg.attach(MIMEText(html_content, "html", "utf-8"))
        if text_content:
            msg.attach(MIMEText(text_content, "plain", "utf-8"))

        return msg

    async def _validate_message_security(
        self,
        smtp_account: SMTPAccount,
        subject: str,
        html_content: str,
        text_content: str,
    ):
        """Security validations before sending"""

        # Content scanning
        if self.content_scanner:
            scan_result = self.content_scanner.scan_content(
                subject, html_content, text_content
            )
            if scan_result["is_spam"]:
                logger.warning(
                    f"Content flagged as spam: {scan_result['spam_score']}/15"
                )
                # For now, just log - don't block (can be configured later)
                logger.warning(
                    f"Spam indicators: {scan_result['details']['keyword_matches']}"
                )

        # SPF validation (optional)
        if self.spf_validator:
            try:
                sending_ip = await self._get_sending_ip(smtp_account)
                spf_result = await self.spf_validator.validate_sender(
                    str(smtp_account.email), sending_ip
                )
                if not spf_result["valid"]:
                    logger.warning(
                        f"SPF validation failed for {smtp_account.email}: {spf_result['reason']}"
                    )
                    # For now, just warn - don't block
            except Exception as e:
                logger.error(f"SPF validation error: {e}")

    async def _get_sending_ip(self, smtp_account: SMTPAccount) -> str:
        """Get the IP address we're sending from (for SPF validation)"""
        try:
            # If using proxy, get proxy IP
            if hasattr(self, "_current_proxy") and getattr(
                self, "_current_proxy", None
            ):
                return getattr(
                    self._current_proxy, "host", "127.0.0.1"
                )

            # Otherwise try to get local IP
            import socket

            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(("8.8.8.8", 80))
            ip = s.getsockname()[0]
            s.close()
            return ip
        except Exception:
            return "127.0.0.1"  # Fallback

    async def _select_available_smtp_account(
        self, smtp_accounts: list[SMTPAccount]
    ) -> SMTPAccount | None:
        """Select an available SMTP account considering rate limits"""
        current_time = time.time()
        available_accounts = []
        for account in smtp_accounts:
            account_id = str(account.id)
            if account_id in self.rate_limits:
                rate_data = self.rate_limits[account_id]
                if current_time - rate_data["reset_time"] > 3600:
                    rate_data["count"] = 0
                    rate_data["reset_time"] = current_time
                if rate_data["count"] >= 100:
                    continue
            if account_id in self.warmup_limits:
                warmup_data = self.warmup_limits[account_id]
                if warmup_data["daily_sent"] >= warmup_data["daily_limit"]:
                    continue
            available_accounts.append(account)
        if not available_accounts:
            return None
        return random.choice(available_accounts)

    async def _update_rate_limit(self, smtp_account_id: str):
        """Update rate limiting counters"""
        current_time = time.time()
        if smtp_account_id not in self.rate_limits:
            self.rate_limits[smtp_account_id] = {
                "count": 0,
                "reset_time": current_time,
            }
        self.rate_limits[smtp_account_id]["count"] += 1
        if smtp_account_id not in self.warmup_limits:
            self.warmup_limits[smtp_account_id] = {
                "daily_sent": 0,
                "daily_limit": 50,
                "day": 1,
            }
        self.warmup_limits[smtp_account_id]["daily_sent"] += 1

    async def _get_session_smtp_accounts(
        self, session_id: str
    ) -> list[SMTPAccount]:
        """Get SMTP accounts for a session"""
        query = "SELECT id, session_id, smtp_server AS server, smtp_port AS port, email, password, status, last_checked, response_time, error_message, created_at FROM smtp_accounts WHERE session_id = $1 AND is_checked = TRUE AND status='checked' ORDER BY last_checked DESC"
        rows = await self.db.fetch(query, session_id)
        accounts: list[SMTPAccount] = [SMTPAccount(**dict(row)) for row in rows]
        # Optional health-based selection and ordering
        try:
            from services.smtp_selection_service import select_best_smtp_accounts
            if getattr(settings, "SMTP_SELECTION_ENABLED", False):
                best = await select_best_smtp_accounts(self.db, session_id, limit=len(accounts))
                order_map = {item["id"]: idx for idx, item in enumerate(best)}
                accounts.sort(key=lambda a: order_map.get(str(getattr(a, "id", "")), 1_000_000))
        except Exception as _e:
            # Fallback to DB order if selection fails
            pass
        return accounts

    async def _log_campaign_metric(
        self,
        campaign_id: str,
        recipient: dict[str, Any],
        smtp_account_id: str | None,
        status: str,
        error_message: str | None = None,
    ):
        """Log campaign metrics"""
        await self.db.execute(
            """
            INSERT INTO campaign_metrics 
            (campaign_id, email, smtp_account_id, status, error_message, created_at)
            VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
        """,
            campaign_id,
            recipient["email"],
            smtp_account_id,
            status,
            error_message,
        )

    async def send_with_retry(
        self, campaign: Campaign, recipient: dict[str, Any]
    ):
        smtp_accounts = await self._get_session_smtp_accounts(
            str(campaign.session_id)
        )
        if not smtp_accounts:
            raise Exception("no smtp accounts")
        smtp_account = smtp_accounts[0]
        template_data = {
            "subject": getattr(campaign, "subject", "No Subject"),
            "html_content": getattr(campaign, "html_content", ""),
            "text_content": getattr(campaign, "text_content", ""),
        }
        message = await self._prepare_message(
            recipient, template_data, smtp_account, campaign
        )
        try:
            await self._attempt_send(campaign, smtp_account, message)
            return True
        except Exception as exc:
            await self._save_failed_send(
                str(campaign.id), recipient["email"], message.as_string()
            )
            raise exc

    @smtp_retry(attempts=settings.SMTP_MAX_RETRIES)
    async def _attempt_send(
        self,
        campaign: Campaign,
        smtp_account: SMTPAccount,
        message: MIMEMultipart,
    ) -> None:
        last_exc: Exception | None = None
        try:
            await self.send_via_direct_smtp(
                smtp_account, message, int(getattr(campaign, "timeout", 30))
            )
            return
        except Exception as e:
            last_exc = e
        # Remove proxy functionality that depends on non-existent Campaign attributes
        if last_exc:
            raise last_exc

    async def send_with_failover(
        self,
        campaign_id: str,
        recipient: dict[str, Any],
        smtp_accounts: list[SMTPAccount],
        proxies: list[ProxyServer],
        subjects: list[str],
        templates: list[str],
        retry_limit: int = 3,
    ) -> bool:
        attempts = []
        errors: list[str] = []
        combos: list[tuple[SMTPAccount, ProxyServer | None]] = []
        proxy_options = proxies or [None]
        for smtp in smtp_accounts:
            for proxy in proxy_options:
                combos.append((smtp, proxy))
        for smtp, proxy in combos[:retry_limit]:
            attempts.append(
                {"smtp": str(smtp.id), "proxy": getattr(proxy, "id", None)}
            )
            increment(campaign_id, "retries")
            subject = random.choice(subjects) if subjects else ""
            template = random.choice(templates) if templates else ""
            message = await self._prepare_single_message(
                subject=subject,
                smtp_account=smtp,
                to_addresses=[recipient["email"]],
                html_content=template,
                text_content="",
            )
            result = await self._send_via_smtp(smtp, proxy, message)
            if result.get("success"):
                increment(campaign_id, "success")
                increment(campaign_id, "sent")
                return True
            errors.append(result.get("error", "unknown"))
            increment(campaign_id, "failovers")
        increment(campaign_id, "failed")
        self.dlq.add(campaign_id, recipient.get("email", ""), errors, attempts)
        return False

    async def setup_smtp_warmup(
        self, smtp_account_id: str, start_day: int = 1
    ):
        """Configure warm-up for an SMTP account"""
        warmup_plan = {
            1: 10,
            2: 20,
            3: 30,
            4: 40,
            5: 50,
            6: 75,
            7: 100,
            8: 150,
            9: 200,
            10: 250,
            11: 300,
            12: 400,
            13: 500,
            14: 600,
            15: 700,
            16: 800,
            17: 900,
            18: 1000,
            19: 1200,
            20: 1400,
            21: 1600,
            22: 1800,
            23: 2000,
            24: 2500,
            25: 3000,
            26: 3500,
            27: 4000,
            28: 4500,
            29: 5000,
            30: 5000,
        }
        daily_limit = warmup_plan.get(start_day, 5000)
        self.warmup_limits[smtp_account_id] = {
            "daily_sent": 0,
            "daily_limit": daily_limit,
            "day": start_day,
        }
        logger.info(
            f"🔥 Warm-up configured for SMTP {smtp_account_id}: day {start_day}, limit {daily_limit}"
        )

    async def send_single_email(
        self,
        smtp_account: SMTPAccount,
        to_addresses: list[str],
        subject: str,
        html_content: str | None = None,
        text_content: str | None = None,
        cc_addresses: list[str] | None = None,
        bcc_addresses: list[str] | None = None,
        attachments: list[UploadFile] | None = None,
        proxy_id: str | None = None,
    ) -> dict[str, Any]:
        # ENFORCE MANDATORY PROXY USAGE
        if settings.SMTP_PROXY_FORCE or settings.PROXY_ENFORCEMENT_STRICT:
            if proxy_id:
                proxy = await self._get_proxy_by_id(
                    proxy_id, str(smtp_account.session_id)
                )
            else:
                proxy = await self.proxy_service.get_working_proxy(
                    str(smtp_account.session_id)
                )
            if not proxy:
                raise ProxyUnavailableError(
                    "No working proxy available. Proxy usage is MANDATORY for all SMTP operations to prevent IP leaks."
                )
            logger.info(f"🔒 Using proxy {proxy.host}:{proxy.port} for SMTP operation")
        else:
            proxy = None
            if settings.PROXY_IP_LEAK_PREVENTION:
                logger.warning("⚠️  Direct SMTP connection attempted but IP leak prevention is enabled")
        
        try:
            msg = await self._prepare_single_message(
                subject=subject,
                smtp_account=smtp_account,
                to_addresses=to_addresses,
                cc_addresses=cc_addresses,
                bcc_addresses=bcc_addresses,
                html_content=html_content,
                text_content=text_content,
                attachments=attachments,
            )
            result = await self._send_through_proxy(smtp_account, msg, proxy)
            return {
                "success": True,
                "message_id": result.get("message_id"),
                "proxy_used": f"{proxy.host}:{proxy.port}" if proxy else None,
                "ip_protected": proxy is not None,
            }
        except Exception as e:
            logger.error(f"Failed to send email: {e}")
            raise

    async def _send_through_proxy(
        self,
        smtp_account: SMTPAccount,
        msg: MIMEMultipart,
        proxy: ProxyServer | None,
    ) -> dict[str, Any]:
        # ENFORCE PROXY USAGE TO PREVENT IP LEAKS
        if settings.PROXY_IP_LEAK_PREVENTION and not proxy:
            raise ProxyUnavailableError(
                "Direct SMTP connections are BLOCKED to prevent IP leaks. "
                "All email operations must use proxies."
            )
        
        try:
            if bool(getattr(smtp_account, "use_oauth", False)):
                client_id = (
                    str(smtp_account.client_id)
                    if getattr(smtp_account, "client_id", None)
                    else ""
                )
                refresh_token = (
                    str(smtp_account.refresh_token)
                    if getattr(smtp_account, "refresh_token", None)
                    else ""
                )
                access_token = await self.oauth_service.get_valid_access_token(
                    client_id, refresh_token
                )
                if not access_token:
                    raise ValueError("OAuth authentication failed")
            
            host, port = self._smtp_details(smtp_account)
            
            # MANDATORY PROXY USAGE - NO DIRECT CONNECTIONS ALLOWED
            if proxy is not None:
                if (proxy.proxy_type or "socks5").lower() not in ["socks5", "socks4"]:
                    raise ProxyUnavailableError("Proxy must be SOCKS4 or SOCKS5 for SMTP operations")
                
                logger.info(f"🔒 Establishing SMTP connection through proxy {proxy.host}:{proxy.port} to {host}:{port}")
                
                import python_socks.async_.asyncio

                proxy_url = self.proxy_service._build_proxy_url(proxy)
                try:
                    sock = await python_socks.async_.asyncio.Proxy.from_url(
                        proxy_url
                    ).connect(
                        host, port, timeout=settings.SMTP_DEFAULT_TIMEOUT
                    )
                    
                    # Verify the connection is actually through the proxy
                    if hasattr(sock, 'getpeername'):
                        try:
                            proxy_peer = sock.getpeername()
                            logger.debug(f"🔒 Connection established through proxy: {proxy_peer}")
                        except Exception:
                            logger.debug("🔒 Proxy connection established (peer info unavailable)")
                    
                except Exception as exc:
                    logger.error(f"❌ Proxy connection failed: {exc}")
                    raise ProxyUnavailableError(f"Failed to connect through proxy: {exc}")
                
                server = smtplib.SMTP()
                server.sock = sock
                server.file = sock.makefile("rb")
                server._host = host
                server._port = port
                server.ehlo()
                
            else:
                # DIRECT CONNECTIONS ARE BLOCKED
                if settings.PROXY_IP_LEAK_PREVENTION:
                    raise ProxyUnavailableError(
                        "Direct SMTP connections are BLOCKED to prevent IP leaks. "
                        "All email operations must use proxies."
                    )
                else:
                    logger.warning("⚠️  WARNING: Direct SMTP connection - IP may be exposed!")
                    server = smtplib.SMTP(
                        host, port, timeout=settings.SMTP_DEFAULT_TIMEOUT
                    )
            
            if port == 587:
                server.starttls()
            
            if bool(getattr(smtp_account, "use_oauth", False)):
                import base64

                auth_string = f"user={smtp_account.email}\x01auth=Bearer {access_token}\x01\x01"
                auth_string_b64 = base64.b64encode(
                    auth_string.encode()
                ).decode()
                server.docmd("AUTH", f"XOAUTH2 {auth_string_b64}")
            else:
                server.login(
                    str(smtp_account.email), str(smtp_account.password)
                )
            server.send_message(msg)
            server.quit()
            return {"message_id": msg.get("Message-ID", "unknown")}
        except smtplib.SMTPAuthenticationError as e:
            logger.error(f"SMTP auth failed for {smtp_account.email}: {e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e)
            )
        except (TimeoutError, smtplib.SMTPConnectError) as e:
            host, _ = self._smtp_details(smtp_account)
            logger.error(f"SMTP connection timeout for {host}: {e}")
            raise HTTPException(
                status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                detail="connection timeout",
            )
        except Exception as e:
            logger.error(f"SMTP send failed: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    async def _get_proxy_by_id(
        self, proxy_id: str, session_id: str
    ) -> ProxyServer | None:
        """Get proxy by ID and verify session access"""
        query = select(ProxyServer).where(
            ProxyServer.id == proxy_id,
            ProxyServer.session_id == session_id,
            ProxyServer.status == "working",
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def _save_failed_send(
        self, campaign_id: str, to_email: str, message: str
    ):
        await self.db.execute(
            "INSERT INTO failed_sends (id, campaign_id, lead_email, message, created_at) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)",
            str(uuid.uuid4()),
            campaign_id,
            to_email,
            message,
        )
        await self.db.commit()

    async def send_via_direct_smtp(
        self,
        smtp_account: SMTPAccount,
        message: MIMEMultipart,
        timeout: int = 30,
    ):
        host, port = self._smtp_details(smtp_account)
        with smtplib.SMTP(host, port, timeout=timeout) as server:
            if port == 587:
                server.starttls()
            server.login(str(smtp_account.email), str(smtp_account.password))
            server.send_message(message)
        return {"success": True}

    # Remove proxy-related methods that access non-existent Campaign attributes
    # These methods were trying to access proxy_host, proxy_port etc. on Campaign objects
    # which don't exist in our model

    async def _prepare_single_message(
        self,
        subject: str,
        smtp_account: SMTPAccount,
        to_addresses: list[str],
        cc_addresses: list[str] | None = None,
        bcc_addresses: list[str] | None = None,
        html_content: str | None = None,
        text_content: str | None = None,
        attachments: list[UploadFile] | None = None,
    ) -> MIMEMultipart:
        msg = MIMEMultipart("related")
        msg["From"] = str(smtp_account.email)
        msg["To"] = ", ".join(to_addresses)
        msg["Subject"] = subject
        msg["User-Agent"] = get_random_ua()
        if cc_addresses:
            msg["Cc"] = ", ".join(cc_addresses)
        if html_content:
            msg.attach(MIMEText(html_content, "html"))
        if text_content:
            msg.attach(MIMEText(text_content, "plain"))
        if attachments:
            for attachment in attachments:
                await self._add_attachment(msg, attachment)
        return msg

    async def _add_attachment(
        self, msg: MIMEMultipart, attachment: UploadFile
    ):
        try:
            content = await attachment.read()
            part = MIMEBase("application", "octet-stream")
            part.set_payload(content)
            encoders.encode_base64(part)
            part.add_header(
                "Content-Disposition",
                f"attachment; filename= {attachment.filename}",
            )
            msg.attach(part)
        except Exception as e:
            logger.warning(
                f"Failed to add attachment {attachment.filename}: {e}"
            )


class SMTPTestMode(str, Enum):
    AUTO = "auto"
    STARTTLS = "starttls"
    SSL = "ssl"


class SMTPTester:
    """Utility to test SMTP credentials using different security modes."""

    def __init__(
        self, connect_timeout: int = 5, overall_timeout: int = 10
    ) -> None:
        self.connect_timeout = connect_timeout
        self.overall_timeout = overall_timeout

    async def _attempt(
        self,
        host: str,
        port: int,
        username: str,
        password: str,
        mode: SMTPTestMode,
    ) -> tuple[bool, str | None]:
        use_tls = mode == SMTPTestMode.SSL
        smtp = aiosmtplib.SMTP(
            hostname=host,
            port=port,
            timeout=self.connect_timeout,
            use_tls=use_tls,
        )
        try:
            await asyncio.wait_for(
                smtp.connect(), timeout=self.connect_timeout
            )
            if mode == SMTPTestMode.STARTTLS:
                await smtp.starttls()
                await smtp.ehlo()
            await smtp.login(username, password)
            await smtp.quit()
            return (True, None)
        except Exception as exc:
            with contextlib.suppress(Exception):
                await smtp.quit()
            return (False, str(exc))

    async def test(
        self,
        host: str | None,
        port: int,
        username: str,
        password: str,
        mode: SMTPTestMode = SMTPTestMode.AUTO,
    ) -> dict:
        start = asyncio.get_event_loop().time()
        resolved = host
        error: str | None = None
        response_time: float | None = None
        used = mode
        if not host:
            domain = username.split("@", 1)[-1]
            try:
                mx_hosts = await resolve_mx(domain)
                resolved = mx_hosts[0]
            except Exception:
                return {
                    "hostResolved": None,
                    "port": port,
                    "modeUsed": mode.value,
                    "result": False,
                    "error": "hostname resolution failed",
                    "response_time": None,
                }
        try:
            if mode == SMTPTestMode.AUTO:
                success, error = await self._attempt(
                    resolved or "localhost",
                    port,
                    username,
                    password,
                    SMTPTestMode.STARTTLS,
                )
                used = SMTPTestMode.STARTTLS
                if not success:
                    success, error = await self._attempt(
                        resolved or "localhost",
                        port,
                        username,
                        password,
                        SMTPTestMode.SSL,
                    )
                    used = SMTPTestMode.SSL
            else:
                success, error = await self._attempt(
                    resolved or "localhost", port, username, password, mode
                )
                used = mode
            if success:
                response_time = asyncio.get_event_loop().time() - start
        except Exception as exc:
            success = False
            error = str(exc)
        duration = response_time if success else None
        logger.info(
            "smtp_test",
            extra={
                "hostResolved": resolved,
                "modeUsed": used.value,
                "duration": duration,
            },
        )
        return {
            "hostResolved": resolved,
            "port": port,
            "modeUsed": used.value,
            "result": success,
            "error": error,
            "response_time": duration,
        }

    async def test_bulk(
        self, items: list[dict], concurrency: int = 5
    ) -> list[dict]:
        sem = asyncio.Semaphore(concurrency)
        results: list[dict] = [{} for _ in range(len(items))]

        async def worker(idx: int, it: dict):
            async with sem:
                try:
                    results[idx] = await self.test(
                        it.get("host"),
                        it["port"],
                        it["user"],
                        it["pass"],
                        SMTPTestMode(it.get("mode", "auto")),
                    )
                except Exception as exc:
                    results[idx] = {
                        "hostResolved": None,
                        "port": it["port"],
                        "modeUsed": it.get("mode", "auto"),
                        "result": False,
                        "error": str(exc),
                        "response_time": None,
                    }

        await asyncio.gather(
            *(worker(i, item) for i, item in enumerate(items))
        )
        return results
