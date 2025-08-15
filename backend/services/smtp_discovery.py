import asyncio
import contextlib
from collections.abc import Iterable

from aiosmtplib import (
    SMTP,
    SMTPAuthenticationError,
    SMTPConnectError,
    SMTPException,
)

from core.email_utils import (
    AUTH_TIMEOUT,
    CONNECT_TIMEOUT,
    MAX_CONCURRENT_PROBES,
    host_permutations,
    mx_lookup,
    port_security_matrix,
)


class SMTPDiscoveryService:
    def __init__(
        self, *, semaphore: asyncio.Semaphore | None = None
    ) -> None:
        self.semaphore = semaphore or asyncio.Semaphore(MAX_CONCURRENT_PROBES)

    async def _probe(
        self, email: str, password: str, host: str, port: int, mode: str
    ) -> bool:
        use_tls = port == 465 or mode == "ssl"
        smtp = SMTP(
            hostname=host, port=port, timeout=CONNECT_TIMEOUT, use_tls=use_tls
        )
        try:
            await asyncio.wait_for(smtp.connect(), CONNECT_TIMEOUT)
            if mode == "starttls":
                await smtp.starttls()
            await asyncio.wait_for(smtp.login(email, password), AUTH_TIMEOUT)
            await smtp.quit()
            return True
        except (TimeoutError, SMTPAuthenticationError, SMTPConnectError, SMTPException):
            with contextlib.suppress(Exception):
                await smtp.quit()
            return False

    async def discover_account(
        self, email: str, password: str
    ) -> tuple[str, int, str] | None:
        domain = email.split("@")[-1]
        hosts = host_permutations(domain)
        mx_hosts = await mx_lookup(domain)
        for mx in mx_hosts:
            if mx not in hosts:
                hosts.append(mx)
        matrix = port_security_matrix()
        for host in hosts:
            for port, mode in matrix:
                if await self._probe(email, password, host, port, mode):
                    return (host, port, mode)
        return None

    async def import_from_lines(
        self, lines: Iterable[str]
    ) -> list[tuple[str, str, int, str]]:
        from utils.smtp_parser import parse_smtp_line

        entries: list[dict[str, str]] = []
        for line in lines:
            parsed = parse_smtp_line(line)
            if parsed:
                entries.append(parsed)

        async def worker(email: str, password: str):
            async with self.semaphore:
                result = await self.discover_account(email, password)
                if result:
                    host, port, mode = result
                    return (email, host, port, mode)
                return None

        tasks = []
        results: list[tuple[str, str, int, str]] = []
        for entry in entries:
            email = entry["email"]
            password = entry["password"]
            server = entry.get("server")
            port = entry.get("port")
            if server and port:
                mode = "ssl" if int(port) == 465 else "starttls"
                results.append((email, server, int(port), mode))
            else:
                tasks.append(worker(email, password))

        if tasks:
            discovered = await asyncio.gather(*tasks)
            results.extend([r for r in discovered if r])

        return results
