import asyncio
import random
import smtplib
import ssl
import time
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Any

try:
    import python_socks

    SOCKS_AVAILABLE = True
except ImportError:
    SOCKS_AVAILABLE = False
    print("⚠️  python-socks not installed. Proxy will not work!")
from utils.socks_patch import patch_python_socks

patch_python_socks()
from config.settings import settings
from core.logger import get_logger
from models.base import Campaign, ProxyServer, SMTPAccount
from services.blacklist_service import BlacklistService
from services.oauth_service import OAuthService
from utils.ua_randomizer import get_random_ua

logger = get_logger(__name__)


class ImprovedSMTPService:
    """Enhanced SMTP service with full proxy support"""

    def __init__(self, db_session):
        self.db = db_session
        self.blacklist_service = BlacklistService(db_session)
        self.oauth_service = OAuthService(db_session)
        self.smtp_rate_limits = {}
        self.smtp_warmup = {}

    async def send_campaign_emails(
        self,
        campaign: Campaign,
        recipients: list[dict],
        smtp_accounts: list[SMTPAccount],
        proxies: list[ProxyServer],
        template: dict,
    ) -> dict[str, Any]:
        """Send campaign with improved logic"""
        logger.info(f"🚀 Starting campaign {campaign.name}")
        logger.info(f"📧 Recipients: {len(recipients)}")
        logger.info(f"🔧 SMTP accounts: {len(smtp_accounts)}")
        logger.info(f"🌐 Proxies: {len(proxies)}")
        if settings.SMTP_PROXY_FORCE and (not proxies):
            raise ValueError("❌ SMTP_PROXY_FORCE=True, but no proxies found!")
        clean_proxies = await self._filter_clean_proxies(proxies)
        if not clean_proxies:
            raise ValueError("❌ All proxies are blacklisted!")
        logger.info(f"✅ Clean proxies: {len(clean_proxies)}")
        stats = {
            "total": len(recipients),
            "sent": 0,
            "success": 0,
            "failed": 0,
            "rate_limited": 0,
            "proxy_errors": 0,
            "smtp_errors": 0,
        }
        semaphore = asyncio.Semaphore(campaign.threads_number)
        batch_size = campaign.batch_size
        for i in range(0, len(recipients), batch_size):
            batch = recipients[i : i + batch_size]
            logger.info(
                f"📦 Processing batch {i // batch_size + 1}: {len(batch)} emails"
            )
            tasks = []
            for recipient in batch:
                task = self._send_single_email_with_retry(
                    recipient=recipient,
                    smtp_accounts=smtp_accounts,
                    proxies=clean_proxies,
                    template=template,
                    campaign=campaign,
                    semaphore=semaphore,
                    stats=stats,
                )
                tasks.append(task)
            await asyncio.gather(*tasks, return_exceptions=True)
            if i + batch_size < len(recipients):
                logger.info(
                    f"⏳ Delay {campaign.delay_between_batches}s between batches"
                )
                await asyncio.sleep(campaign.delay_between_batches)
        logger.info(f"✅ Campaign completed: {stats}")
        return stats

    async def _send_single_email_with_retry(
        self,
        recipient: dict,
        smtp_accounts: list[SMTPAccount],
        proxies: list[ProxyServer],
        template: dict,
        campaign: Campaign,
        semaphore: asyncio.Semaphore,
        stats: dict,
        max_retries: int = 3,
    ):
        """Send a single email with retries"""
        async with semaphore:
            for attempt in range(max_retries):
                try:
                    smtp_account = await self._select_smtp_account(
                        smtp_accounts
                    )
                    if not smtp_account:
                        stats["rate_limited"] += 1
                        logger.warning(
                            f"⚠️  All SMTP accounts reached limit for {recipient['email']}"
                        )
                        return
                    proxy = random.choice(proxies)
                    message = await self._prepare_email_message(
                        recipient=recipient,
                        template=template,
                        smtp_account=smtp_account,
                    )
                    result = await self._send_through_socks_proxy(
                        smtp_account=smtp_account,
                        proxy=proxy,
                        message=message,
                        timeout=campaign.timeout,
                    )
                    if result["success"]:
                        stats["success"] += 1
                        logger.debug(
                            f"✅ Sent: {recipient['email']} via {proxy.host}"
                        )
                        await self._update_rate_limit(smtp_account.id)
                        return
                    else:
                        raise Exception(result["error"])
                except Exception as e:
                    logger.warning(
                        f"❌ Attempt {attempt + 1} for {recipient['email']}: {e}"
                    )
                    if "proxy" in str(e).lower():
                        stats["proxy_errors"] += 1
                    elif "smtp" in str(e).lower():
                        stats["smtp_errors"] += 1
                    if attempt == max_retries - 1:
                        stats["failed"] += 1
                        logger.error(
                            f"💀 Failed to send {recipient['email']} after {max_retries} attempts"
                        )
                    else:
                        await asyncio.sleep(2**attempt)
            stats["sent"] += 1

    async def _filter_clean_proxies(
        self, proxies: list[ProxyServer]
    ) -> list[ProxyServer]:
        """Filter proxies that are not blacklisted"""
        clean_proxies = []
        for proxy in proxies:
            is_blacklisted = await self.blacklist_service.check_ip_blacklist(
                proxy.host
            )
            if not is_blacklisted:
                clean_proxies.append(proxy)
            else:
                logger.warning(
                    f"🚫 Proxy {proxy.host} is blacklisted, skipping"
                )
        return clean_proxies

    async def _select_smtp_account(
        self, smtp_accounts: list[SMTPAccount]
    ) -> SMTPAccount | None:
        """Select SMTP account considering rate limit and warm-up"""
        current_time = time.time()
        available_accounts = []
        for account in smtp_accounts:
            account_id = str(account.id)
            if account_id in self.smtp_rate_limits:
                rate_info = self.smtp_rate_limits[account_id]
                if current_time - rate_info["reset_time"] > 3600:
                    rate_info["count"] = 0
                    rate_info["reset_time"] = current_time
                if rate_info["count"] >= 100:
                    continue
            if account_id in self.smtp_warmup:
                warmup_info = self.smtp_warmup[account_id]
                if warmup_info["sent_today"] >= warmup_info["daily_limit"]:
                    continue
            available_accounts.append(account)
        if not available_accounts:
            return None
        return random.choice(available_accounts)

    async def _update_rate_limit(self, smtp_account_id: str):
        """Update rate limiting for SMTP account"""
        current_time = time.time()
        if smtp_account_id not in self.smtp_rate_limits:
            self.smtp_rate_limits[smtp_account_id] = {
                "count": 0,
                "reset_time": current_time,
            }
        self.smtp_rate_limits[smtp_account_id]["count"] += 1
        if smtp_account_id not in self.smtp_warmup:
            self.smtp_warmup[smtp_account_id] = {
                "daily_limit": 50,
                "sent_today": 0,
            }
        self.smtp_warmup[smtp_account_id]["sent_today"] += 1

    async def _prepare_email_message(
        self, recipient: dict, template: dict, smtp_account: SMTPAccount
    ) -> MIMEMultipart:
        msg = MIMEMultipart("related")
        msg["User-Agent"] = get_random_ua()
        subject = template["subject"]
        html_content = template.get("html_content", "")
        text_content = template.get("text_content", "")
        macros = {
            "%%FIRST_NAME%%": recipient.get("first_name", ""),
            "%%LAST_NAME%%": recipient.get("last_name", ""),
            "%%EMAIL%%": recipient["email"],
            "%%RANDOM%%": str(random.randint(1000, 9999)),
            "%%DATE%%": time.strftime("%Y-%m-%d"),
            "%%TIME%%": time.strftime("%H:%M:%S"),
        }
        for macro, value in macros.items():
            subject = subject.replace(macro, value)
            html_content = html_content.replace(macro, value)
            text_content = text_content.replace(macro, value)
        tracking_pixel = f"""<img src="https://track.example.com/open/{recipient["email"]}" width="1" height="1" style="display:none;">"""
        html_content += tracking_pixel
        msg["From"] = smtp_account.email
        msg["To"] = recipient["email"]
        msg["Subject"] = subject
        msg["Message-ID"] = (
            f"<{random.randint(100000, 999999)}@{smtp_account.email.split('@')[1]}>"
        )
        if html_content:
            msg.attach(MIMEText(html_content, "html"))
        if text_content:
            msg.attach(MIMEText(text_content, "plain"))
        return msg

    async def _send_through_socks_proxy(
        self,
        smtp_account: SMTPAccount,
        proxy: ProxyServer,
        message: MIMEMultipart,
        timeout: int = 30,
    ) -> dict[str, Any]:
        """Send via SOCKS proxy (real implementation)"""
        if not SOCKS_AVAILABLE:
            return {"success": False, "error": "python-socks is not installed"}
        try:
            if proxy.proxy_type.lower() == "socks5":
                proxy_type = python_socks.ProxyType.SOCKS5
            elif proxy.proxy_type.lower() == "socks4":
                proxy_type = python_socks.ProxyType.SOCKS4
            else:
                proxy_type = python_socks.ProxyType.HTTP
            sock = await python_socks.proxy_connect(
                proxy_type=proxy_type,
                host=proxy.host,
                port=proxy.port,
                username=proxy.username,
                password=proxy.password,
                dest_host=smtp_account.server,
                dest_port=smtp_account.port,
            )
            if smtp_account.port == 465:
                context = ssl.create_default_context()
                smtp_conn = smtplib.SMTP_SSL(
                    host=smtp_account.server,
                    port=smtp_account.port,
                    timeout=timeout,
                    sock=sock,
                    context=context,
                )
            else:
                smtp_conn = smtplib.SMTP(
                    host=smtp_account.server,
                    port=smtp_account.port,
                    timeout=timeout,
                    sock=sock,
                )
                if smtp_account.port == 587:
                    smtp_conn.starttls()
            if smtp_account.use_oauth:
                access_token = await self.oauth_service.get_valid_access_token(
                    smtp_account.client_id, smtp_account.refresh_token
                )
                if not access_token:
                    raise Exception("OAuth token not available")
                import base64

                auth_string = f"user={smtp_account.email}\x01auth=Bearer {access_token}\x01\x01"
                auth_string_b64 = base64.b64encode(
                    auth_string.encode()
                ).decode()
                smtp_conn.docmd("AUTH", f"XOAUTH2 {auth_string_b64}")
            else:
                smtp_conn.login(smtp_account.email, smtp_account.password)
            result = smtp_conn.send_message(message)
            smtp_conn.quit()
            return {
                "success": True,
                "message_id": message.get("Message-ID"),
                "proxy_used": f"{proxy.host}:{proxy.port}",
            }
        except Exception as e:
            logger.error(f"SMTP via proxy error: {e}")
            return {"success": False, "error": str(e)}

    async def warm_up_smtp_account(
        self, smtp_account: SMTPAccount, days: int = 30
    ):
        """Warm-up SMTP account (gradually increase limits)"""
        account_id = str(smtp_account.id)
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
        current_day = min(days, 30)
        daily_limit = warmup_plan.get(current_day, 5000)
        self.smtp_warmup[account_id] = {
            "daily_limit": daily_limit,
            "sent_today": 0,
            "warmup_day": current_day,
        }
        logger.info(
            f"🔥 Warm-up for {smtp_account.email}: day {current_day}, limit {daily_limit}"
        )

    async def send_via_direct_smtp(
        self,
        smtp_account: SMTPAccount,
        message: MIMEMultipart,
        timeout: int = 30,
    ):
        with smtplib.SMTP(
            smtp_account.smtp_server, smtp_account.smtp_port, timeout=timeout
        ) as server:
            if smtp_account.smtp_port == 587:
                server.starttls()
            server.login(smtp_account.email, smtp_account.password)
            server.send_message(message)
        return {"success": True}

    async def send_via_http_proxy(
        self,
        smtp_account: SMTPAccount,
        proxy: Campaign,
        message: MIMEMultipart,
        timeout: int = 30,
    ):
        import python_socks.sync

        proxy_url = f"http://{proxy.proxy_host}:{proxy.proxy_port}"
        if proxy.proxy_username:
            proxy_url = f"http://{proxy.proxy_username}:{proxy.proxy_password}@{proxy.proxy_host}:{proxy.proxy_port}"
        sock = python_socks.sync.Proxy.from_url(proxy_url).connect(
            smtp_account.smtp_server, smtp_account.smtp_port, timeout=timeout
        )
        smtp_conn = smtplib.SMTP()
        smtp_conn.sock = sock
        smtp_conn.file = sock.makefile("rb")
        smtp_conn._host = smtp_account.smtp_server
        smtp_conn._port = smtp_account.smtp_port
        smtp_conn.ehlo()
        if smtp_account.smtp_port == 587:
            smtp_conn.starttls()
        smtp_conn.login(smtp_account.email, smtp_account.password)
        smtp_conn.send_message(message)
        smtp_conn.quit()
        return {"success": True}

    async def send_via_socks_proxy(
        self,
        smtp_account: SMTPAccount,
        proxy: Campaign,
        message: MIMEMultipart,
        timeout: int = 30,
    ):
        import python_socks.sync

        proxy_url = f"socks5://{proxy.proxy_host}:{proxy.proxy_port}"
        if proxy.proxy_username:
            proxy_url = f"socks5://{proxy.proxy_username}:{proxy.proxy_password}@{proxy.proxy_host}:{proxy.proxy_port}"
        sock = python_socks.sync.Proxy.from_url(proxy_url).connect(
            smtp_account.smtp_server, smtp_account.smtp_port, timeout=timeout
        )
        smtp_conn = smtplib.SMTP()
        smtp_conn.sock = sock
        smtp_conn.file = sock.makefile("rb")
        smtp_conn._host = smtp_account.smtp_server
        smtp_conn._port = smtp_account.smtp_port
        smtp_conn.ehlo()
        if smtp_account.smtp_port == 587:
            smtp_conn.starttls()
        smtp_conn.login(smtp_account.email, smtp_account.password)
        smtp_conn.send_message(message)
        smtp_conn.quit()
        return {"success": True}


async def example_improved_usage():
    """Example usage of improved SMTP service"""
    print("=== IMPROVED SMTP SERVICE ===")
    recipients = [
        {
            "email": "user1@example.com",
            "first_name": "John",
            "last_name": "Doe",
        },
        {
            "email": "user2@example.com",
            "first_name": "Jane",
            "last_name": "Smith",
        },
    ]
    template = {
        "subject": "Hello %%FIRST_NAME%%!",
        "html_content": "<h1>Hello %%FIRST_NAME%% %%LAST_NAME%%!</h1>",
        "text_content": "Hello %%FIRST_NAME%% %%LAST_NAME%%!",
    }
    print("✅ Improvements:")
    print("  - Real SOCKS proxy support")
    print("  - Rate limiting for SMTP accounts")
    print("  - Warm-up for new accounts")
    print("  - Automatic failover")
    print("  - Tracking pixels for open rate")
    print("  - DNSBL proxy checking")
    print("  - OAuth for Outlook")
    print("  - Batch sending with delays")


if __name__ == "__main__":
    asyncio.run(example_improved_usage())
