"""
Bulk Service Connection Pooling for SMTP/IMAP Operations
Optimizes performance for high-volume email operations
"""

import asyncio
import logging
import threading
import time
from collections import defaultdict
from contextlib import asynccontextmanager
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, AsyncContextManager

import aioimaplib
import aiosmtplib

logger = logging.getLogger(__name__)


class ConnectionType(Enum):
    SMTP = "smtp"
    IMAP = "imap"


class ConnectionStatus(Enum):
    IDLE = "idle"
    ACTIVE = "active"
    ERROR = "error"
    EXPIRED = "expired"


@dataclass
class ConnectionConfig:
    host: str
    port: int
    username: str
    password: str
    use_tls: bool = True
    use_ssl: bool = False
    timeout: int = 30
    max_idle_time: int = 300  # 5 minutes
    max_reuse_count: int = 100


@dataclass
class PooledConnection:
    connection: aiosmtplib.SMTP | aioimaplib.IMAP4_SSL
    config: ConnectionConfig
    connection_type: ConnectionType
    created_at: float = field(default_factory=time.time)
    last_used: float = field(default_factory=time.time)
    use_count: int = 0
    status: ConnectionStatus = ConnectionStatus.IDLE
    thread_id: int | None = None


class BulkConnectionPool:
    """High-performance connection pool for SMTP/IMAP operations"""

    def __init__(
        self,
        max_connections_per_server: int = 10,
        max_total_connections: int = 100,
        cleanup_interval: int = 60,
        health_check_interval: int = 300,
    ):
        self.max_connections_per_server = max_connections_per_server
        self.max_total_connections = max_total_connections
        self.cleanup_interval = cleanup_interval
        self.health_check_interval = health_check_interval

        # Connection pools organized by server
        self.smtp_pools: dict[str, list[PooledConnection]] = defaultdict(list)
        self.imap_pools: dict[str, list[PooledConnection]] = defaultdict(list)

        # Pool locks for thread safety
        self.pool_locks: dict[str, asyncio.Lock] = defaultdict(asyncio.Lock)

        # Statistics
        self.stats = {
            "connections_created": 0,
            "connections_reused": 0,
            "connections_expired": 0,
            "connections_failed": 0,
            "active_connections": 0,
            "total_operations": 0,
        }

        # Background tasks
        self._cleanup_task: asyncio.Task | None = None
        self._health_check_task: asyncio.Task | None = None
        self._running = False

    async def start(self):
        """Start the connection pool and background tasks"""
        if self._running:
            return

        self._running = True
        self._cleanup_task = asyncio.create_task(self._cleanup_loop())
        self._health_check_task = asyncio.create_task(
            self._health_check_loop()
        )
        logger.info("🚀 Bulk connection pool started")

    async def stop(self):
        """Stop the connection pool and cleanup all connections"""
        self._running = False

        if self._cleanup_task:
            self._cleanup_task.cancel()
        if self._health_check_task:
            self._health_check_task.cancel()

        # Close all connections
        await self._close_all_connections()
        logger.info("🛑 Bulk connection pool stopped")

    @asynccontextmanager
    async def get_smtp_connection(
        self, config: ConnectionConfig
    ) -> AsyncContextManager[aiosmtplib.SMTP]:
        """Get an SMTP connection from the pool"""
        server_key = f"{config.host}:{config.port}:{config.username}"
        connection = None

        try:
            # Get connection from pool
            connection = await self._get_connection(
                server_key, ConnectionType.SMTP, config
            )
            self.stats["total_operations"] += 1
            self.stats["active_connections"] += 1

            yield connection.connection

        except Exception as e:
            logger.error(f"SMTP connection error: {e}")
            if connection:
                connection.status = ConnectionStatus.ERROR
            raise
        finally:
            if connection:
                await self._return_connection(server_key, connection)
                self.stats["active_connections"] -= 1

    @asynccontextmanager
    async def get_imap_connection(
        self, config: ConnectionConfig
    ) -> AsyncContextManager[aioimaplib.IMAP4_SSL]:
        """Get an IMAP connection from the pool"""
        server_key = f"{config.host}:{config.port}:{config.username}"
        connection = None

        try:
            # Get connection from pool
            connection = await self._get_connection(
                server_key, ConnectionType.IMAP, config
            )
            self.stats["total_operations"] += 1
            self.stats["active_connections"] += 1

            yield connection.connection

        except Exception as e:
            logger.error(f"IMAP connection error: {e}")
            if connection:
                connection.status = ConnectionStatus.ERROR
            raise
        finally:
            if connection:
                await self._return_connection(server_key, connection)
                self.stats["active_connections"] -= 1

    async def _get_connection(
        self,
        server_key: str,
        conn_type: ConnectionType,
        config: ConnectionConfig,
    ) -> PooledConnection:
        """Get a connection from the pool or create a new one"""
        async with self.pool_locks[server_key]:
            pool = (
                self.smtp_pools
                if conn_type == ConnectionType.SMTP
                else self.imap_pools
            )

            # Try to find a reusable connection
            for connection in pool[server_key]:
                if (
                    connection.status == ConnectionStatus.IDLE
                    and connection.use_count < config.max_reuse_count
                    and time.time() - connection.last_used
                    < config.max_idle_time
                ):
                    # Test connection health
                    if await self._test_connection_health(connection):
                        connection.status = ConnectionStatus.ACTIVE
                        connection.last_used = time.time()
                        connection.use_count += 1
                        self.stats["connections_reused"] += 1
                        return connection
                    else:
                        # Remove unhealthy connection
                        await self._close_connection(connection)
                        pool[server_key].remove(connection)

            # Create new connection if pool not at capacity
            if len(pool[server_key]) < self.max_connections_per_server:
                total_connections = sum(len(p) for p in pool.values())
                if total_connections < self.max_total_connections:
                    connection = await self._create_connection(
                        conn_type, config
                    )
                    pool[server_key].append(connection)
                    self.stats["connections_created"] += 1
                    return connection

            # Pool at capacity, wait for available connection
            raise Exception(f"Connection pool exhausted for {server_key}")

    async def _create_connection(
        self, conn_type: ConnectionType, config: ConnectionConfig
    ) -> PooledConnection:
        """Create a new connection"""
        try:
            if conn_type == ConnectionType.SMTP:
                connection = aiosmtplib.SMTP(
                    hostname=config.host,
                    port=config.port,
                    timeout=config.timeout,
                    use_tls=config.use_tls,
                )
                await connection.connect()
                if config.username and config.password:
                    await connection.login(config.username, config.password)

            else:  # IMAP
                if config.use_ssl:
                    connection = aioimaplib.IMAP4_SSL(
                        host=config.host,
                        port=config.port,
                        timeout=config.timeout,
                    )
                else:
                    connection = aioimaplib.IMAP4(
                        host=config.host,
                        port=config.port,
                        timeout=config.timeout,
                    )

                await connection.wait_hello_from_server()
                if config.username and config.password:
                    await connection.login(config.username, config.password)

            pooled_conn = PooledConnection(
                connection=connection,
                config=config,
                connection_type=conn_type,
                status=ConnectionStatus.ACTIVE,
                thread_id=threading.get_ident(),
            )

            logger.debug(
                f"Created new {conn_type.value} connection to {config.host}:{config.port}"
            )
            return pooled_conn

        except Exception as e:
            self.stats["connections_failed"] += 1
            logger.error(f"Failed to create {conn_type.value} connection: {e}")
            raise

    async def _return_connection(
        self, server_key: str, connection: PooledConnection
    ):
        """Return a connection to the pool"""
        if connection.status == ConnectionStatus.ERROR:
            # Remove failed connections
            async with self.pool_locks[server_key]:
                pool = (
                    self.smtp_pools
                    if connection.connection_type == ConnectionType.SMTP
                    else self.imap_pools
                )
                if connection in pool[server_key]:
                    pool[server_key].remove(connection)
                await self._close_connection(connection)
        else:
            # Return healthy connection to idle state
            connection.status = ConnectionStatus.IDLE
            connection.last_used = time.time()

    async def _test_connection_health(
        self, connection: PooledConnection
    ) -> bool:
        """Test if a connection is still healthy"""
        try:
            if connection.connection_type == ConnectionType.SMTP:
                # SMTP health check
                response = await connection.connection.noop()
                return response.code == 250
            else:
                # IMAP health check
                response = await connection.connection.noop()
                return response.result == "OK"

        except Exception:
            return False

    async def _close_connection(self, connection: PooledConnection):
        """Close a single connection"""
        try:
            if connection.connection_type == ConnectionType.SMTP:
                if hasattr(connection.connection, "quit"):
                    await connection.connection.quit()
            else:
                if hasattr(connection.connection, "logout"):
                    await connection.connection.logout()

        except Exception as e:
            logger.debug(f"Error closing connection: {e}")

    async def _cleanup_loop(self):
        """Background task to cleanup expired connections"""
        while self._running:
            try:
                await asyncio.sleep(self.cleanup_interval)
                await self._cleanup_expired_connections()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Cleanup loop error: {e}")

    async def _cleanup_expired_connections(self):
        """Remove expired and overused connections"""
        current_time = time.time()

        for pool_dict in [self.smtp_pools, self.imap_pools]:
            for server_key in list(pool_dict.keys()):
                async with self.pool_locks[server_key]:
                    connections_to_remove = []

                    for connection in pool_dict[server_key]:
                        should_remove = (
                            connection.status == ConnectionStatus.IDLE
                            and (
                                current_time - connection.last_used
                                > connection.config.max_idle_time
                                or connection.use_count
                                >= connection.config.max_reuse_count
                            )
                        )

                        if should_remove:
                            connections_to_remove.append(connection)

                    for connection in connections_to_remove:
                        pool_dict[server_key].remove(connection)
                        await self._close_connection(connection)
                        self.stats["connections_expired"] += 1

                    # Clean up empty server pools
                    if not pool_dict[server_key]:
                        del pool_dict[server_key]

    async def _health_check_loop(self):
        """Background task to perform health checks on idle connections"""
        while self._running:
            try:
                await asyncio.sleep(self.health_check_interval)
                await self._health_check_all_connections()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Health check loop error: {e}")

    async def _health_check_all_connections(self):
        """Perform health checks on all idle connections"""
        for pool_dict in [self.smtp_pools, self.imap_pools]:
            for server_key in list(pool_dict.keys()):
                async with self.pool_locks[server_key]:
                    unhealthy_connections = []

                    for connection in pool_dict[server_key]:
                        if connection.status == ConnectionStatus.IDLE:
                            if not await self._test_connection_health(
                                connection
                            ):
                                unhealthy_connections.append(connection)

                    for connection in unhealthy_connections:
                        pool_dict[server_key].remove(connection)
                        await self._close_connection(connection)
                        logger.info(
                            f"Removed unhealthy connection to {connection.config.host}"
                        )

    async def _close_all_connections(self):
        """Close all connections in all pools"""
        for pool_dict in [self.smtp_pools, self.imap_pools]:
            for server_key in list(pool_dict.keys()):
                async with self.pool_locks[server_key]:
                    for connection in pool_dict[server_key]:
                        await self._close_connection(connection)
                    pool_dict[server_key].clear()

    def get_pool_stats(self) -> dict[str, Any]:
        """Get comprehensive pool statistics"""
        smtp_stats = {
            server: len(conns) for server, conns in self.smtp_pools.items()
        }
        imap_stats = {
            server: len(conns) for server, conns in self.imap_pools.items()
        }

        return {
            "smtp_pools": smtp_stats,
            "imap_pools": imap_stats,
            "total_smtp_connections": sum(smtp_stats.values()),
            "total_imap_connections": sum(imap_stats.values()),
            "performance_stats": self.stats.copy(),
            "pool_efficiency": {
                "reuse_ratio": (
                    self.stats["connections_reused"]
                    / max(
                        self.stats["connections_created"]
                        + self.stats["connections_reused"],
                        1,
                    )
                ),
                "failure_ratio": (
                    self.stats["connections_failed"]
                    / max(
                        self.stats["connections_created"]
                        + self.stats["connections_failed"],
                        1,
                    )
                ),
            },
        }


# Global connection pool instance
_connection_pool: BulkConnectionPool | None = None


async def get_connection_pool() -> BulkConnectionPool:
    """Get the global connection pool instance"""
    global _connection_pool
    if _connection_pool is None:
        _connection_pool = BulkConnectionPool()
        await _connection_pool.start()
    return _connection_pool


async def shutdown_connection_pool():
    """Shutdown the global connection pool"""
    global _connection_pool
    if _connection_pool:
        await _connection_pool.stop()
        _connection_pool = None


# Convenience functions for bulk operations
class BulkEmailOperations:
    """High-level bulk email operations using the connection pool"""

    def __init__(self, pool: BulkConnectionPool):
        self.pool = pool

    async def send_bulk_emails(
        self,
        emails: list[dict[str, Any]],
        smtp_configs: list[ConnectionConfig],
    ) -> list[dict[str, Any]]:
        """Send multiple emails using pooled SMTP connections"""
        results = []

        # Group emails by SMTP server for efficiency
        server_groups = defaultdict(list)
        for i, email in enumerate(emails):
            config_index = i % len(smtp_configs)
            server_key = f"{smtp_configs[config_index].host}:{smtp_configs[config_index].port}"
            server_groups[server_key].append(
                (email, smtp_configs[config_index])
            )

        # Process each server group concurrently
        tasks = []
        for server_key, group_emails in server_groups.items():
            task = asyncio.create_task(self._send_server_group(group_emails))
            tasks.append(task)

        group_results = await asyncio.gather(*tasks, return_exceptions=True)

        # Flatten results
        for group_result in group_results:
            if isinstance(group_result, list):
                results.extend(group_result)
            else:
                logger.error(f"Bulk send error: {group_result}")

        return results

    async def _send_server_group(
        self, emails_with_configs: list[tuple]
    ) -> list[dict[str, Any]]:
        """Send emails for a specific server group"""
        results = []

        if not emails_with_configs:
            return results

        # Use the first config as they should all be for the same server
        _, config = emails_with_configs[0]

        async with self.pool.get_smtp_connection(config) as smtp:
            for email, _ in emails_with_configs:
                try:
                    await smtp.send_message(
                        email["message"],
                        sender=email.get("sender"),
                        recipients=email.get("recipients"),
                    )
                    results.append(
                        {
                            "email_id": email.get("id"),
                            "status": "sent",
                            "timestamp": time.time(),
                        }
                    )
                except Exception as e:
                    results.append(
                        {
                            "email_id": email.get("id"),
                            "status": "failed",
                            "error": str(e),
                            "timestamp": time.time(),
                        }
                    )

        return results

    async def check_bulk_inboxes(
        self, imap_configs: list[ConnectionConfig], folders: list[str] = None
    ) -> list[dict[str, Any]]:
        """Check multiple IMAP inboxes using pooled connections"""
        if folders is None:
            folders = ["INBOX"]

        tasks = []
        for config in imap_configs:
            for folder in folders:
                task = asyncio.create_task(
                    self._check_single_inbox(config, folder)
                )
                tasks.append(task)

        results = await asyncio.gather(*tasks, return_exceptions=True)

        # Filter and process results
        inbox_results = []
        for result in results:
            if isinstance(result, dict):
                inbox_results.append(result)
            else:
                logger.error(f"Inbox check error: {result}")

        return inbox_results

    async def _check_single_inbox(
        self, config: ConnectionConfig, folder: str
    ) -> dict[str, Any]:
        """Check a single inbox folder"""
        try:
            async with self.pool.get_imap_connection(config) as imap:
                await imap.select(folder)
                search_result = await imap.search("ALL")

                message_count = (
                    len(search_result.lines[0].split())
                    if search_result.lines
                    else 0
                )

                return {
                    "server": f"{config.host}:{config.port}",
                    "username": config.username,
                    "folder": folder,
                    "message_count": message_count,
                    "status": "success",
                    "timestamp": time.time(),
                }

        except Exception as e:
            return {
                "server": f"{config.host}:{config.port}",
                "username": config.username,
                "folder": folder,
                "message_count": 0,
                "status": "failed",
                "error": str(e),
                "timestamp": time.time(),
            }
