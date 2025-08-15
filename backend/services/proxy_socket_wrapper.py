"""
Proxy Socket Wrapper for Async SMTP/IMAP Libraries
Provides proxy support for aiosmtplib and aioimaplib
"""

import asyncio
import ssl

import aioimaplib
import aiosmtplib
import python_socks

from core.logger import get_logger

logger = get_logger(__name__)


class AsyncProxyConnector:
    """Handles proxy connections for async email libraries"""

    @staticmethod
    async def create_smtp_with_proxy(
        host: str,
        port: int,
        proxy_host: str,
        proxy_port: int,
        proxy_username: str | None = None,
        proxy_password: str | None = None,
        use_tls: bool = False,
        timeout: int = 30,
    ) -> aiosmtplib.SMTP:
        """Create aiosmtplib SMTP connection through SOCKS5 proxy"""
        try:
            # Create proxy connection
            proxy = python_socks.ProxyType.SOCKS5
            proxy_settings = {
                "proxy_type": proxy,
                "addr": proxy_host,
                "port": proxy_port,
                "username": proxy_username,
                "password": proxy_password,
                "rdns": True,
            }

            # Create socket through proxy
            sock = python_socks.socksocket()
            sock.set_proxy(**proxy_settings)
            sock.settimeout(timeout)

            # Connect to SMTP server through proxy
            await asyncio.get_event_loop().run_in_executor(
                None, sock.connect, (host, port)
            )

            # Wrap socket for aiosmtplib
            reader, writer = await asyncio.open_connection(sock=sock)

            # Create SMTP client with the proxied connection
            smtp = aiosmtplib.SMTP(
                hostname=host, port=port, timeout=timeout, use_tls=use_tls
            )

            # Replace the connection with our proxied one
            smtp._reader = reader
            smtp._writer = writer
            smtp._connect_future = asyncio.Future()
            smtp._connect_future.set_result(True)

            return smtp

        except Exception as e:
            logger.error(
                f"Failed to create SMTP connection through proxy: {e}"
            )
            raise

    @staticmethod
    async def create_imap_with_proxy(
        host: str,
        port: int,
        proxy_host: str,
        proxy_port: int,
        proxy_username: str | None = None,
        proxy_password: str | None = None,
        use_ssl: bool = True,
        timeout: int = 30,
    ) -> aioimaplib.IMAP4_SSL:
        """Create aioimaplib IMAP connection through SOCKS5 proxy"""
        try:
            # Create proxy connection
            proxy = python_socks.ProxyType.SOCKS5
            proxy_settings = {
                "proxy_type": proxy,
                "addr": proxy_host,
                "port": proxy_port,
                "username": proxy_username,
                "password": proxy_password,
                "rdns": True,
            }

            # Create socket through proxy
            sock = python_socks.socksocket()
            sock.set_proxy(**proxy_settings)
            sock.settimeout(timeout)

            # Connect to IMAP server through proxy
            await asyncio.get_event_loop().run_in_executor(
                None, sock.connect, (host, port)
            )

            # Create SSL context if needed
            if use_ssl:
                context = ssl.create_default_context()
                sock = context.wrap_socket(sock, server_hostname=host)

            # Wrap socket for aioimaplib
            reader, writer = await asyncio.open_connection(sock=sock)

            # Create IMAP client
            if use_ssl:
                imap = aioimaplib.IMAP4_SSL(
                    host=host, port=port, timeout=timeout
                )
            else:
                imap = aioimaplib.IMAP4(host=host, port=port, timeout=timeout)

            # Replace the connection with our proxied one
            imap._reader = reader
            imap._writer = writer
            imap.protocol = aioimaplib.IMAP4ClientProtocol(imap)

            return imap

        except Exception as e:
            logger.error(
                f"Failed to create IMAP connection through proxy: {e}"
            )
            raise


class ProxyConnectionPool:
    """Connection pool for proxied SMTP/IMAP connections"""

    def __init__(self, max_connections: int = 100):
        self.max_connections = max_connections
        self._smtp_pool: dict = {}
        self._imap_pool: dict = {}
        self._lock = asyncio.Lock()

    async def get_smtp_connection(
        self,
        host: str,
        port: int,
        proxy_host: str | None = None,
        proxy_port: int | None = None,
        **kwargs,
    ) -> aiosmtplib.SMTP:
        """Get SMTP connection from pool or create new one"""
        key = f"{host}:{port}:{proxy_host}:{proxy_port}"

        async with self._lock:
            if key in self._smtp_pool:
                conn = self._smtp_pool[key]
                if conn.is_connected:
                    return conn
                else:
                    del self._smtp_pool[key]

            # Create new connection
            if proxy_host and proxy_port:
                conn = await AsyncProxyConnector.create_smtp_with_proxy(
                    host, port, proxy_host, proxy_port, **kwargs
                )
            else:
                conn = aiosmtplib.SMTP(hostname=host, port=port, **kwargs)
                await conn.connect()

            self._smtp_pool[key] = conn
            return conn

    async def release_smtp_connection(self, conn: aiosmtplib.SMTP):
        """Release SMTP connection back to pool"""
        # Connection stays in pool for reuse
        pass

    async def close_all(self):
        """Close all connections in the pool"""
        async with self._lock:
            for conn in self._smtp_pool.values():
                try:
                    await conn.quit()
                except Exception:
                    pass
            self._smtp_pool.clear()

            for conn in self._imap_pool.values():
                try:
                    await conn.logout()
                except Exception:
                    pass
            self._imap_pool.clear()
