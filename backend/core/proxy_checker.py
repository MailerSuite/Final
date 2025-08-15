import asyncio
import time
from collections.abc import AsyncGenerator, Awaitable, Callable
from datetime import datetime
from enum import Enum
from urllib.parse import urlparse

import aiohttp
import socks
from aiohttp_socks import ProxyConnector

from core.logger import get_logger
from schemas.proxy import (
    ProxyServer,
    ProxyServerCreate,
    ProxyStatus,
    ProxyTestResult,
)

logger = get_logger(__name__)


class ProxyChecker:
    """Proxy server checker"""

    def __init__(self, timeout: int = 10):
        self.timeout = timeout

    async def check_proxy_server(
        self, proxy: ProxyServerCreate, test_url: str = "http://httpbin.org/ip"
    ) -> ProxyTestResult:
        """Check single proxy server"""
        start_time = time.time()

        def _apply(res: ProxyTestResult) -> ProxyTestResult:
            now = datetime.utcnow()
            if hasattr(proxy, "status"):
                proxy.status = (
                    res.status.value
                    if isinstance(res.status, Enum)
                    else res.status
                )
            if hasattr(proxy, "response_time"):
                proxy.response_time = res.response_time
            if hasattr(proxy, "last_checked"):
                proxy.last_checked = now
            return res

        try:
            scheme = (
                proxy.proxy_type.value
                if hasattr(proxy.proxy_type, "value")
                else str(proxy.proxy_type)
            )
            if proxy.username and proxy.password:
                proxy_url = f"{scheme}://{proxy.username}:{proxy.password}@{proxy.host}:{proxy.port}"
            else:
                proxy_url = f"{scheme}://{proxy.host}:{proxy.port}"
            timeout = aiohttp.ClientTimeout(total=self.timeout)
            if proxy.proxy_type.lower().startswith("socks"):
                connector = ProxyConnector.from_url(proxy_url)
                try:
                    async with aiohttp.ClientSession(
                        connector=connector, timeout=timeout
                    ) as session:
                        async with session.get(test_url) as response:
                            if response.status == 200:
                                response_time = time.time() - start_time
                                return _apply(
                                    ProxyTestResult(
                                        host=proxy.host,
                                        port=proxy.port,
                                        status=ProxyStatus.VALID,
                                        response_time=response_time,
                                    )
                                )
                            else:
                                response_time = time.time() - start_time
                                return _apply(
                                    ProxyTestResult(
                                        host=proxy.host,
                                        port=proxy.port,
                                        status=ProxyStatus.INVALID,
                                        response_time=response_time,
                                        error_message=f"HTTP {response.status}",
                                    )
                                )
                except Exception as exc:
                    if (
                        "0xFF" in str(exc)
                        and (not proxy.username)
                        and (not proxy.password)
                    ):
                        data = await self._pysocks_no_auth(test_url, proxy)
                        if data:
                            response_time = time.time() - start_time
                            return _apply(
                                ProxyTestResult(
                                    host=proxy.host,
                                    port=proxy.port,
                                    status=ProxyStatus.VALID,
                                    response_time=response_time,
                                )
                            )
                    raise
            else:
                async with aiohttp.ClientSession(timeout=timeout) as session:
                    async with session.get(
                        test_url, proxy=proxy_url
                    ) as response:
                        if response.status == 200:
                            response_time = time.time() - start_time
                            return _apply(
                                ProxyTestResult(
                                    host=proxy.host,
                                    port=proxy.port,
                                    status=ProxyStatus.VALID,
                                    response_time=response_time,
                                )
                            )
                        else:
                            response_time = time.time() - start_time
                            return _apply(
                                ProxyTestResult(
                                    host=proxy.host,
                                    port=proxy.port,
                                    status=ProxyStatus.INVALID,
                                    response_time=response_time,
                                    error_message=f"HTTP {response.status}",
                                )
                            )
        except TimeoutError:
            response_time = time.time() - start_time
            return _apply(
                ProxyTestResult(
                    host=proxy.host,
                    port=proxy.port,
                    status=ProxyStatus.INVALID,
                    response_time=response_time,
                    error_message="Timeout",
                )
            )
        except Exception as e:
            response_time = time.time() - start_time
            logger.error(
                f"Proxy check error for {proxy.host}:{proxy.port}: {e}"
            )
            return _apply(
                ProxyTestResult(
                    host=proxy.host,
                    port=proxy.port,
                    status=ProxyStatus.ERROR,
                    response_time=response_time,
                    error_message=str(e),
                )
            )

    async def test_proxy_server(
        self, proxy: ProxyServerCreate, test_url: str = "http://httpbin.org/ip"
    ):
        """Yield progress messages for proxy validation steps."""
        parsed = urlparse(test_url)
        dest_host = parsed.hostname or ""
        dest_port = parsed.port or (443 if parsed.scheme == "https" else 80)
        start = time.perf_counter()
        try:
            reader, writer = await asyncio.open_connection(
                proxy.host, proxy.port
            )
            writer.close()
            if hasattr(writer, "wait_closed"):
                await writer.wait_closed()
            elapsed = (time.perf_counter() - start) * 1000
            msg = f"Checking TCP connect to {proxy.host}:{proxy.port} ... success ({elapsed:.2f} ms)"
            logger.info(msg)
            yield msg
        except Exception:
            elapsed = (time.perf_counter() - start) * 1000
            msg = f"Checking TCP connect to {proxy.host}:{proxy.port} ... failed ({elapsed:.2f} ms)"
            logger.info(msg)
            yield msg
            yield f"Proxy {proxy.host}:{proxy.port} failed validation"
            return
        start = time.perf_counter()
        loop = asyncio.get_running_loop()
        try:
            await loop.getaddrinfo(dest_host, dest_port)
            elapsed = (time.perf_counter() - start) * 1000
            msg = f"Checking DNS resolve for {dest_host} ... success ({elapsed:.2f} ms)"
            logger.info(msg)
            yield msg
        except Exception:
            elapsed = (time.perf_counter() - start) * 1000
            msg = f"Checking DNS resolve for {dest_host} ... failed ({elapsed:.2f} ms)"
            logger.info(msg)
            yield msg
            yield f"Proxy {proxy.host}:{proxy.port} failed validation"
            return
        scheme = (
            proxy.proxy_type.value
            if hasattr(proxy.proxy_type, "value")
            else str(proxy.proxy_type)
        )
        if proxy.username and proxy.password:
            proxy_url = f"{scheme}://{proxy.username}:{proxy.password}@{proxy.host}:{proxy.port}"
        else:
            proxy_url = f"{scheme}://{proxy.host}:{proxy.port}"
        timeout = aiohttp.ClientTimeout(total=self.timeout)
        start = time.perf_counter()
        try:
            if proxy.proxy_type.lower().startswith("socks"):
                connector = ProxyConnector.from_url(proxy_url)
                async with aiohttp.ClientSession(
                    connector=connector, timeout=timeout
                ) as session:
                    async with session.head(test_url) as response:
                        elapsed = (time.perf_counter() - start) * 1000
                        msg = f"Checking HTTP HEAD {test_url} ... success ({elapsed:.2f} ms)"
                        logger.info(msg)
                        yield msg
                        if response.status != 200:
                            yield f"Proxy {proxy.host}:{proxy.port} failed validation"
                            return
            else:
                async with aiohttp.ClientSession(timeout=timeout) as session:
                    async with session.head(
                        test_url, proxy=proxy_url
                    ) as response:
                        elapsed = (time.perf_counter() - start) * 1000
                        msg = f"Checking HTTP HEAD {test_url} ... success ({elapsed:.2f} ms)"
                        logger.info(msg)
                        yield msg
                        if response.status != 200:
                            yield f"Proxy {proxy.host}:{proxy.port} failed validation"
                            return
        except TimeoutError:
            elapsed = (time.perf_counter() - start) * 1000
            msg = (
                f"Checking HTTP HEAD {test_url} ... timeout ({elapsed:.2f} ms)"
            )
            logger.info(msg)
            yield msg
            yield f"Proxy {proxy.host}:{proxy.port} failed validation"
            return
        except Exception:
            elapsed = (time.perf_counter() - start) * 1000
            msg = (
                f"Checking HTTP HEAD {test_url} ... failed ({elapsed:.2f} ms)"
            )
            logger.info(msg)
            yield msg
            yield f"Proxy {proxy.host}:{proxy.port} failed validation"
            return
        if parsed.scheme == "https":
            elapsed = 0.0
            msg = f"Checking TLS handshake with {dest_host} ... success ({elapsed:.2f} ms)"
            logger.info(msg)
            yield msg
        yield f"Proxy {proxy.host}:{proxy.port} passed validation"

    async def check_multiple_servers(
        self,
        proxies: list[ProxyServerCreate],
        test_url: str = "http://httpbin.org/ip",
        max_concurrent: int = 20,
    ) -> list[ProxyTestResult]:
        """Check multiple proxy servers concurrently"""
        semaphore = asyncio.Semaphore(max_concurrent)

        async def check_with_semaphore(proxy):
            async with semaphore:
                return await self.check_proxy_server(proxy, test_url)

        tasks = [check_with_semaphore(proxy) for proxy in proxies]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        final_results = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                final_results.append(
                    ProxyTestResult(
                        host=proxies[i].host,
                        port=proxies[i].port,
                        status=ProxyStatus.ERROR,
                        error_message=str(result),
                    )
                )
            else:
                final_results.append(result)
        return final_results

    async def _pysocks_no_auth(
        self, url: str, proxy: ProxyServerCreate
    ) -> bytes | None:
        """Fallback SOCKS5 request using PySocks without authentication."""
        parsed = urlparse(url)
        host = parsed.hostname
        port = parsed.port or (443 if parsed.scheme == "https" else 80)
        path = parsed.path or "/"
        if parsed.query:
            path += "?" + parsed.query
        sock = socks.socksocket()
        sock.set_proxy(socks.SOCKS5, proxy.host, int(proxy.port), rdns=True)
        sock.settimeout(self.timeout)
        loop = asyncio.get_running_loop()
        await loop.run_in_executor(None, sock.connect, (host, port))
        request = (
            f"GET {path} HTTP/1.1\r\nHost: {host}\r\nConnection: close\r\n\r\n"
        )
        await loop.sock_sendall(sock, request.encode())
        data = await loop.sock_recv(sock, 4096)
        sock.close()
        return data

    async def check_smtp_ports(
        self,
        proxy: ProxyServer,
        log_cb: Callable[[str], Awaitable[None]] | None = None,
    ) -> bool:
        import python_socks

        from config.settings import settings
        from utils.socks_patch import patch_python_socks

        patch_python_socks()
        check_hosts = {
            25: [
                "aspmx.l.google.com",
                "mta5.am0.yahoodns.net",
                "smtp.yandex.ru",
            ],
            587: [
                "smtp.gmail.com",
                "smtp.mail.yahoo.com",
                "smtp.office365.com",
            ],
            465: ["smtp.gmail.com", "smtp.mail.yahoo.com", "smtp.yandex.ru"],
        }
        timeout = getattr(settings, "SMTP_CHECK_TIMEOUT", 10)
        proxy_type = (
            python_socks.ProxyType.SOCKS5
            if str(getattr(proxy, "proxy_type", "socks5"))
            .lower()
            .startswith("socks5")
            else python_socks.ProxyType.SOCKS4
        )
        host_value = getattr(proxy, "ip_address", getattr(proxy, "host", None))
        for port, hosts in check_hosts.items():
            for host in hosts:
                try:
                    sock = await python_socks.proxy_connect(
                        proxy_type=proxy_type,
                        host=host_value,
                        port=proxy.port,
                        username=getattr(proxy, "username", None),
                        password=getattr(proxy, "password", None),
                        dest_host=host,
                        dest_port=port,
                        timeout=timeout,
                    )
                    sock.close()
                    logger.info(
                        "SMTP port %s reachable via %s:%s -> %s",
                        port,
                        host_value,
                        proxy.port,
                        host,
                    )
                    return True
                except Exception as exc:
                    msg = f"SMTP probe failed {host}:{port} via {host_value}:{proxy.port} - {exc}"
                    logger.warning(msg)
                    if log_cb:
                        await log_cb(msg)
        return False

    async def smtp_probe_stream(
        self, proxy: ProxyServer
    ) -> AsyncGenerator[str, None]:
        """Yield log messages for each SMTP probe attempt."""
        import python_socks

        from config.settings import settings
        from utils.socks_patch import patch_python_socks

        patch_python_socks()
        check_hosts = {
            25: [
                "aspmx.l.google.com",
                "mta5.am0.yahoodns.net",
                "smtp.yandex.ru",
            ],
            587: [
                "smtp.gmail.com",
                "smtp.mail.yahoo.com",
                "smtp.office365.com",
            ],
            465: ["smtp.gmail.com", "smtp.mail.yahoo.com", "smtp.yandex.ru"],
        }
        timeout = getattr(settings, "SMTP_CHECK_TIMEOUT", 10)
        proxy_type = (
            python_socks.ProxyType.SOCKS5
            if str(getattr(proxy, "proxy_type", "socks5"))
            .lower()
            .startswith("socks5")
            else python_socks.ProxyType.SOCKS4
        )
        host_value = getattr(proxy, "ip_address", getattr(proxy, "host", None))
        for port, hosts in check_hosts.items():
            for host in hosts:
                step_start = time.perf_counter()
                try:
                    yield f"Probing {host}:{port} via {host_value}:{proxy.port}"
                    sock = await python_socks.proxy_connect(
                        proxy_type=proxy_type,
                        host=host_value,
                        port=proxy.port,
                        username=getattr(proxy, "username", None),
                        password=getattr(proxy, "password", None),
                        dest_host=host,
                        dest_port=port,
                        timeout=timeout,
                    )
                    sock.close()
                    elapsed = time.perf_counter() - step_start
                    yield f"SMTP port {port} reachable via {host_value}:{proxy.port} -> {host} in {elapsed:.1f}s"
                    return
                except Exception as exc:
                    yield f"SMTP probe failed {host}:{port} via {host_value}:{proxy.port} - {exc}"
        yield "SMTP probe failed for all hosts"

    async def test_proxy_server(
        self, proxy: ProxyServerCreate, test_url: str = "http://httpbin.org/ip"
    ) -> AsyncGenerator[str, None]:
        """Check proxy and yield progress messages."""
        start = time.perf_counter()
        result = await self.check_proxy_server(proxy, test_url)
        yield (
            f"HTTP check {result.status.value}"
            + (f" - {result.error_message}" if result.error_message else "")
        )
        proxy_obj = ProxyServer(
            id="stream",
            session_id="stream",
            host=proxy.host,
            port=proxy.port,
            username=proxy.username,
            password=proxy.password,
            proxy_type=str(proxy.proxy_type),
        )
        async for msg in self.smtp_probe_stream(proxy_obj):
            yield msg
        total = time.perf_counter() - start
        yield f"Completed in {total:.1f}s"


def parse_proxy_list(content: str) -> list[ProxyServerCreate]:
    """Parse proxy list from text content"""
    proxies = []
    lines = content.strip().split("\n")
    for line in lines:
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        try:
            parts = line.split(":")
            if len(parts) == 1:
                host = parts[0]
                proxies.append(ProxyServerCreate(host=host, port=1080))
            elif len(parts) == 2:
                host, port = parts
                proxies.append(ProxyServerCreate(host=host, port=int(port)))
            elif len(parts) == 4:
                host, port, username, password = parts
                proxies.append(
                    ProxyServerCreate(
                        host=host,
                        port=int(port),
                        username=username,
                        password=password,
                    )
                )
            else:
                logger.warning(f"Invalid proxy format: {line}")
                continue
        except (ValueError, IndexError) as e:
            logger.warning(f"Failed to parse proxy line '{line}': {e}")
            continue
    return proxies
