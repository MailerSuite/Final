"""
Redis Configuration with Authentication and Security
Handles Redis connection, authentication, and clustering for production
"""

import json
import logging
from typing import Any
from urllib.parse import urlparse

from redis import asyncio as aioredis
from redis.exceptions import AuthenticationError, ConnectionError

from config.settings import settings

logger = logging.getLogger(__name__)


class RedisConfig:
    """Advanced Redis configuration with authentication and clustering"""

    def __init__(self):
        self.redis_url = settings.REDIS_URL
        self.redis_client = None
        self.cluster_nodes = []
        self.is_cluster = False

    def _parse_redis_config(self) -> dict[str, Any]:
        """Parse Redis URL and extract configuration"""
        parsed = urlparse(self.redis_url)

        config = {
            "host": parsed.hostname or "localhost",
            "port": parsed.port or 6379,
            "db": int(parsed.path[1:])
            if parsed.path and len(parsed.path) > 1
            else 0,
            "password": parsed.password,
            "username": parsed.username,
            "ssl": parsed.scheme == "rediss",
            "decode_responses": True,
            "socket_timeout": 30,
            "socket_connect_timeout": 30,
            "retry_on_timeout": True,
            "health_check_interval": 30,
        }

        return config

    async def create_redis_client(self) -> aioredis.Redis:
        """Create authenticated Redis client with security features"""
        config = self._parse_redis_config()

        try:
            # Create Redis client with authentication
            self.redis_client = aioredis.from_url(
                self.redis_url,
                **{k: v for k, v in config.items() if v is not None},
            )

            # Test connection and authentication
            await self.redis_client.ping()
            logger.info(
                "Redis client connected successfully with authentication"
            )

            # Set up security configurations
            await self._configure_security()

            return self.redis_client

        except AuthenticationError as e:
            logger.error(f"Redis authentication failed: {e}")
            raise
        except ConnectionError as e:
            logger.error(f"Redis connection failed: {e}")
            raise
        except Exception as e:
            logger.error(f"Redis client creation failed: {e}")
            raise

    async def _configure_security(self):
        """Configure Redis security settings"""
        try:
            # Check if we have AUTH capabilities
            info = await self.redis_client.info()

            # Configure security settings if we have admin access
            if "redis_version" in info:
                logger.info(f"Connected to Redis {info['redis_version']}")

                # Set security configurations
                security_configs = {
                    "maxmemory-policy": "allkeys-lru",  # Memory management
                    "timeout": "300",  # Client timeout
                    "tcp-keepalive": "60",  # Keep alive
                }

                for key, value in security_configs.items():
                    try:
                        await self.redis_client.config_set(key, value)
                        logger.debug(f"Set Redis config {key}={value}")
                    except Exception as e:
                        logger.debug(f"Could not set {key}: {e}")

        except Exception as e:
            logger.warning(f"Could not configure Redis security: {e}")

    async def setup_clustering(self, cluster_nodes: list[str]) -> bool:
        """Set up Redis clustering for horizontal scale"""
        try:
            from rediscluster import RedisCluster

            self.cluster_nodes = cluster_nodes
            self.is_cluster = True

            # Create cluster client
            startup_nodes = []
            for node in cluster_nodes:
                parsed = urlparse(node)
                startup_nodes.append(
                    {"host": parsed.hostname, "port": parsed.port or 6379}
                )

            self.redis_client = RedisCluster(
                startup_nodes=startup_nodes,
                decode_responses=True,
                skip_full_coverage_check=True,
                health_check_interval=30,
                socket_timeout=30,
            )

            # Test cluster connection
            await self.redis_client.ping()
            logger.info(
                f"Redis cluster connected with {len(startup_nodes)} nodes"
            )

            return True

        except ImportError:
            logger.warning(
                "redis-py-cluster not installed, clustering unavailable"
            )
            return False
        except Exception as e:
            logger.error(f"Redis clustering setup failed: {e}")
            return False

    async def check_performance(self) -> dict[str, Any]:
        """Check Redis performance and health"""
        if not self.redis_client:
            await self.create_redis_client()

        try:
            # Basic performance metrics
            info = await self.redis_client.info()

            # Latency test
            import time

            start_time = time.time()
            await self.redis_client.ping()
            latency_ms = (time.time() - start_time) * 1000

            # Memory usage
            memory_used = info.get("used_memory", 0)
            memory_max = info.get("maxmemory", 0)
            memory_usage_percent = (
                (memory_used / memory_max * 100) if memory_max > 0 else 0
            )

            # Connections
            connected_clients = info.get("connected_clients", 0)
            max_clients = info.get("maxclients", 0)

            # Commands processed
            total_commands = info.get("total_commands_processed", 0)

            return {
                "redis_version": info.get("redis_version", "unknown"),
                "latency_ms": round(latency_ms, 2),
                "memory_used_bytes": memory_used,
                "memory_usage_percent": round(memory_usage_percent, 2),
                "connected_clients": connected_clients,
                "max_clients": max_clients,
                "total_commands_processed": total_commands,
                "uptime_seconds": info.get("uptime_in_seconds", 0),
                "is_cluster": self.is_cluster,
                "cluster_nodes": len(self.cluster_nodes)
                if self.is_cluster
                else 0,
            }

        except Exception as e:
            logger.error(f"Redis performance check failed: {e}")
            return {"error": str(e)}

    async def setup_monitoring(self) -> dict[str, Any]:
        """Set up Redis monitoring and alerting"""
        try:
            # Create monitoring keys
            monitoring_config = {
                "redis_monitoring:enabled": "true",
                "redis_monitoring:interval": "30",
                "redis_monitoring:thresholds": json.dumps(
                    {
                        "memory_usage_percent": 80,
                        "connected_clients_percent": 90,
                        "latency_ms": 100,
                    }
                ),
            }

            for key, value in monitoring_config.items():
                await self.redis_client.set(key, value, ex=86400)  # 24 hours

            logger.info("Redis monitoring configuration set up")

            return {
                "status": "success",
                "monitoring_keys_created": len(monitoring_config),
                "monitoring_interval_seconds": 30,
            }

        except Exception as e:
            logger.error(f"Redis monitoring setup failed: {e}")
            return {"status": "error", "message": str(e)}

    def get_production_recommendations(self) -> dict[str, Any]:
        """Get Redis production optimization recommendations"""
        recommendations = []

        # Check authentication
        parsed = urlparse(self.redis_url)
        if not parsed.password and not settings.DEBUG:
            recommendations.append(
                {
                    "type": "critical",
                    "issue": "No Redis Authentication",
                    "recommendation": "Enable Redis AUTH for production security",
                    "impact": "High - Unauthorized access to cache and session data",
                }
            )

        # Check SSL/TLS
        if not parsed.scheme == "rediss" and not settings.DEBUG:
            recommendations.append(
                {
                    "type": "warning",
                    "issue": "Unencrypted Redis Connection",
                    "recommendation": "Use TLS encryption (rediss://) for production",
                    "impact": "Medium - Data transmitted in plain text",
                }
            )

        # Check clustering
        if not self.is_cluster and not settings.DEBUG:
            recommendations.append(
                {
                    "type": "optimization",
                    "issue": "Single Redis Instance",
                    "recommendation": "Consider Redis clustering for high availability",
                    "impact": "Medium - Single point of failure",
                }
            )

        # Check location
        if "localhost" in self.redis_url and not settings.DEBUG:
            recommendations.append(
                {
                    "type": "warning",
                    "issue": "Local Redis Instance",
                    "recommendation": "Use dedicated Redis server/service in production",
                    "impact": "Medium - Affects scalability and reliability",
                }
            )

        return {
            "redis_url": self.redis_url,
            "is_cluster": self.is_cluster,
            "has_auth": bool(parsed.password),
            "uses_ssl": parsed.scheme == "rediss",
            "recommendations": recommendations,
        }

    async def create_production_config(self) -> str:
        """Generate production Redis configuration"""
        config_template = """
# Redis Production Configuration for MailerSuite
# High-performance settings for load balancing and caching

# Security
requirepass YOUR_SECURE_REDIS_PASSWORD
# bind 127.0.0.1  # Uncomment and set specific IPs for security

# Performance
maxmemory 2gb
maxmemory-policy allkeys-lru
tcp-keepalive 60
timeout 300

# Persistence (adjust based on needs)
save 900 1
save 300 10
save 60 10000

# Networking
tcp-backlog 511
maxclients 10000

# Logging
loglevel notice
syslog-enabled yes
syslog-ident redis

# Advanced
hash-max-ziplist-entries 512
hash-max-ziplist-value 64
list-max-ziplist-size -2
set-max-intset-entries 512
zset-max-ziplist-entries 128
zset-max-ziplist-value 64
"""

        return config_template.strip()


# Global Redis configuration instance
redis_config = RedisConfig()


async def get_redis_client() -> aioredis.Redis:
    """Get authenticated Redis client"""
    if not redis_config.redis_client:
        await redis_config.create_redis_client()
    return redis_config.redis_client


async def init_redis():
    """Initialize Redis with authentication and security"""
    await redis_config.create_redis_client()
    return redis_config.redis_client
