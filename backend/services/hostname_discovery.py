import asyncio

import aioimaplib
import dns.asyncresolver
from aiosmtplib import SMTP

from core.logger import get_logger
from utils.discovery_utils import get_fallback_hosts

logger = get_logger(__name__)


class HostnameDiscoveryService:
    """Discover SMTP and IMAP hostnames using DNS records and guessing."""

    def __init__(self, timeout: int = 5) -> None:
        self.timeout = timeout

    async def _resolve_mx(self, domain: str) -> list[tuple[int, str]]:
        """Return list of (priority, host) MX records."""
        try:
            resolver = dns.asyncresolver.Resolver()
            resolver.lifetime = self.timeout
            answers = await resolver.resolve(domain, "MX")
            records = sorted(

                    (r.preference, r.exchange.to_text().rstrip("."))
                    for r in answers

            )
            return records
        except Exception as exc:
            logger.warning(f"MX lookup failed for {domain}: {exc}")
            return []

    async def _resolve_imap_srv(
        self, domain: str
    ) -> list[tuple[int, str, int]]:
        """Return list of (priority, host, port) SRV records."""
        try:
            resolver = dns.asyncresolver.Resolver()
            resolver.lifetime = self.timeout
            answers = await resolver.resolve(f"_imap._tcp.{domain}", "SRV")
            records = sorted(

                    (r.priority, r.target.to_text().rstrip("."), r.port)
                    for r in answers

            )
            return records
        except Exception as exc:
            logger.debug(f"SRV lookup failed for {domain}: {exc}")
            return []

    async def _probe_smtp(
        self, host: str, port: int
    ) -> tuple[bool, str | None, int | None]:
        """Try connecting to SMTP server and return (success, protocol, latency_ms)."""
        try:
            start = asyncio.get_event_loop().time()
            smtp = SMTP(
                hostname=host,
                port=port,
                timeout=self.timeout,
                use_tls=port == 465,
            )
            await smtp.connect()
            protocol = "SSL" if port == 465 else "PLAIN"
            if port == 587:
                if smtp.supports_extension("starttls"):
                    await smtp.starttls()
                    protocol = "STARTTLS"
            latency = int((asyncio.get_event_loop().time() - start) * 1000)
            await smtp.quit()
            return (True, protocol, latency)
        except Exception as exc:
            logger.debug(f"SMTP probe failed for {host}:{port}: {exc}")
            return (False, None, None)

    async def _probe_imap(
        self, host: str, port: int
    ) -> tuple[bool, str | None, int | None]:
        """Try connecting to IMAP server and return (success, protocol, latency_ms)."""
        try:
            start = asyncio.get_event_loop().time()
            if port == 993:
                imap = aioimaplib.IMAP4_SSL(
                    host=host, port=port, timeout=self.timeout
                )
                await imap.wait_hello_from_server()
                protocol = "SSL"
            else:
                imap = aioimaplib.IMAP4(
                    host=host, port=port, timeout=self.timeout
                )
                await imap.wait_hello_from_server()
                try:
                    await imap.starttls()
                    protocol = "STARTTLS"
                except Exception:
                    protocol = "PLAIN"
            latency = int((asyncio.get_event_loop().time() - start) * 1000)
            await imap.logout()
            return (True, protocol, latency)
        except Exception as exc:
            logger.debug(f"IMAP probe failed for {host}:{port}: {exc}")
            return (False, None, None)

    async def discover_smtp_hosts(self, email: str) -> dict:
        domain = email.split("@", 1)[-1]
        mx_records = await self._resolve_mx(domain)
        mx_hosts = [h for _, h in mx_records]
        discovery_method = "dns_mx" if mx_records else "guessing"
        if mx_records:
            hosts = mx_hosts
        else:
            hosts = await get_fallback_hosts(domain)
        results = []
        for host in hosts:
            for port in (25, 465, 587):
                success, protocol, latency = await self._probe_smtp(host, port)
                results.append(
                    {
                        "hostname": host,
                        "port": port,
                        "protocol": protocol,
                        "dns_record": "MX" if host in mx_hosts else "GUESS",
                        "priority": next(
                            (p for p, h in mx_records if h == host), None
                        ),
                        "latency_ms": latency,
                        "status": "valid" if success else "invalid",
                    }
                )
        return {
            "email": email,
            "completed": True,
            "discovery_method": (
                discovery_method if mx_records else "dns_mx_and_guessing"
            ),
            "results": results,
        }

    async def discover_imap_hosts(self, email: str) -> dict:
        domain = email.split("@", 1)[-1]
        srv_records = await self._resolve_imap_srv(domain)
        discovery_method = "dns_srv" if srv_records else "guessing"
        if srv_records:
            hosts = [(h, port) for _, h, port in srv_records]
        else:
            prefixes = await get_fallback_hosts(domain)
            hosts = [(h, 993) for h in prefixes] + [(h, 143) for h in prefixes]
        results = []
        for host, port in hosts:
            success, protocol, latency = await self._probe_imap(host, port)
            results.append(
                {
                    "hostname": host,
                    "port": port,
                    "protocol": protocol,
                    "dns_record": (
                        "SRV"
                        if any(
                            (
                                h == host and prt == port
                                for _, h, prt in srv_records
                            )
                        )
                        else "GUESS"
                    ),
                    "priority": next(
                        (
                            p
                            for p, h, prt in srv_records
                            if h == host and prt == port
                        ),
                        None,
                    ),
                    "latency_ms": latency,
                    "status": "valid" if success else "invalid",
                }
            )
        return {
            "email": email,
            "completed": True,
            "discovery_method": (
                discovery_method if srv_records else "dns_srv_and_guessing"
            ),
            "results": results,
        }
