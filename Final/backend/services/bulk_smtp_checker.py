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
from models.smtp_providers import SMTPProviderConfig
from services.proxy_service import ProxyService
from services.smtp_provider_service import SMTPProviderService

logger = get_logger(__name__)


class SMTPCheckStatus(str, Enum):
    """SMTP check result status"""

    VALID = "valid"
    INVALID = "invalid"
    AUTH_FAILED = "auth_failed"
    CONNECTION_FAILED = "connection_failed"
    TIMEOUT = "timeout"
    PROXY_FAILED = "proxy_failed"
    RATE_LIMITED = "rate_limited"
    QUOTA_EXCEEDED = "quota_exceeded"
    UNKNOWN_ERROR = "unknown_error"


class ProxyRotationStrategy(str, Enum):
    """Proxy rotation strategies"""

    ROUND_ROBIN = "round_robin"
    RANDOM = "random"
    LEAST_USED = "least_used"
    FASTEST = "fastest"


@dataclass
class ComboEntry:
    """SMTP combo entry"""

    email: str
    password: str
    smtp_server: str | None = None
    smtp_port: int = 587
    use_ssl: bool = False
    provider_config_id: str | None = None


@dataclass
class SMTPCheckResult:
    """SMTP check result"""

    combo: ComboEntry
    status: SMTPCheckStatus
    error_message: str | None = None
    response_time: float | None = None
    proxy_used: str | None = None
    inbox_test_result: str | None = None
    successful_send: bool = False
    server_response: str | None = None
    provider_used: str | None = None


@dataclass
class BulkCheckProgress:
    """Bulk check progress tracking"""

    total: int = 0
    processed: int = 0
    valid: int = 0
    invalid: int = 0
    errors: int = 0
    rate_limited: int = 0
    quota_exceeded: int = 0
    start_time: datetime = field(default_factory=datetime.now)
    status: str = "initializing"

    @property
    def elapsed_time(self) -> timedelta:
        return datetime.now() - self.start_time


class BulkSMTPChecker:
    """Enhanced bulk SMTP checker with SOCKS5 proxy support and provider management"""

    def __init__(self, db_session: AsyncSession, session_id: str):
        self.db = db_session
        self.session_id = session_id
        self.proxy_service = ProxyService(db_session)
        self.provider_service = SMTPProviderService(db_session)
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
        self.enable_inbox_test = getattr(settings, "BULK_SMTP_INBOX_TEST", True)
        
        # Provider management
        self.provider_configs: list[SMTPProviderConfig] = []
        self.provider_limiters = {}

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
    
    async def load_provider_configs(self, user_id: str) -> int:
        """Load provider configurations for the user"""
        try:
            self.provider_configs = await self.provider_service.get_provider_configs(
                user_id=user_id,
                active_only=True,
            )
            logger.info(
                f"Loaded {len(self.provider_configs)} provider configurations"
            )
            return len(self.provider_configs)
        except Exception as e:
            logger.error(f"Failed to load provider configs: {e}")
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
        elif self.proxy_rotation_strategy == ProxyRotationStrategy.LEAST_USED:
            # TODO: Implement least used strategy based on usage tracking
            return random.choice(self.available_proxies)
        elif self.proxy_rotation_strategy == ProxyRotationStrategy.FASTEST:
            # TODO: Implement fastest strategy based on response time tracking
            return random.choice(self.available_proxies)
        else:
            return random.choice(self.available_proxies)

    async def parse_combo_list(self, combo_data: str) -> list[ComboEntry]:
        """Parse combo list from string data"""
        combos = []
        lines = combo_data.strip().split("\n")

        for line in lines:
            line = line.strip()
            if not line or line.startswith("#"):
                continue

            parts = line.split(":")
            if len(parts) >= 2:
                email = parts[0].strip()
                password = ":".join(parts[1:]).strip()

                # Auto-detect SMTP server from email domain
                domain = email.split("@")[-1].lower()
                smtp_server, smtp_port = self._get_smtp_server_info(domain)

                combos.append(
                    ComboEntry(
                        email=email,
                        password=password,
                        smtp_server=smtp_server,
                        smtp_port=smtp_port or 587,
                    )
                )

        return combos

    def _get_smtp_server_info(
        self, domain: str
    ) -> tuple[str | None, int | None]:
        """Get SMTP server info for common domains"""
        smtp_servers = {
            "gmail.com": ("smtp.gmail.com", 587),
            "yahoo.com": ("smtp.mail.yahoo.com", 587),
            "outlook.com": ("smtp-mail.outlook.com", 587),
            "hotmail.com": ("smtp-mail.outlook.com", 587),
            "aol.com": ("smtp.aol.com", 587),
            "icloud.com": ("smtp.mail.me.com", 587),
            "mail.ru": ("smtp.mail.ru", 465),
            "yandex.com": ("smtp.yandex.com", 465),
            "protonmail.com": ("smtp.protonmail.com", 587),
            "gmx.com": ("smtp.gmx.com", 587),
        }

        if domain in smtp_servers:
            return smtp_servers[domain]

        # Try common patterns
        common_patterns = [
            f"smtp.{domain}",
            f"mail.{domain}",
            f"smtp.mail.{domain}",
            f"mx.{domain}",
        ]

        # In production, you might want to do MX record lookup
        # For now, return None to indicate unknown
        return None, None
    
    async def select_provider_for_check(
        self, combo: ComboEntry
    ) -> SMTPProviderConfig | None:
        """Select the best provider for checking this combo"""
        if not self.provider_configs:
            return None
        
        # If combo already has a provider config ID, use it
        if combo.provider_config_id:
            for config in self.provider_configs:
                if config.id == combo.provider_config_id:
                    return config
        
        # Check quotas and select best available provider
        for config in self.provider_configs:
            quota_check = await self.provider_service.check_quota(config.id, 1)
            if quota_check["allowed"]:
                # Acquire rate limit token
                if await self.provider_service.acquire_send_tokens(
                    config.id, 1, wait=False
                ):
                    return config
        
        return None

    async def check_smtp_combo(
        self, combo: ComboEntry, proxy: ProxyServer | None = None
    ) -> SMTPCheckResult:
        """Check single SMTP combo with optional proxy and provider management"""
        start_time = time.time()
        
        # Select provider if available
        provider_config = await self.select_provider_for_check(combo)
        if self.provider_configs and not provider_config:
            return SMTPCheckResult(
                combo=combo,
                status=SMTPCheckStatus.RATE_LIMITED,
                error_message="All providers rate limited or quota exceeded",
            )

        try:
            # Use provider SMTP settings if available
            if provider_config:
                combo.smtp_server = provider_config.smtp_host
                combo.smtp_port = provider_config.smtp_port
                combo.use_ssl = provider_config.use_ssl

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
            
            if provider_config:
                result.provider_used = provider_config.name

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
            
            # Record usage if provider was used
            if provider_config:
                await self.provider_service.record_usage(
                    provider_config.id,
                    emails_sent=1 if result.status == SMTPCheckStatus.VALID else 0,
                    send_time_ms=result.response_time * 1000,
                    error=result.error_message,
                )

            return result

        except Exception as e:
            return SMTPCheckResult(
                combo=combo,
                status=SMTPCheckStatus.UNKNOWN_ERROR,
                error_message=str(e),
                proxy_used=proxy_info if proxy else None,
                provider_used=provider_config.name if provider_config else None,
            )

    # ... existing code ...