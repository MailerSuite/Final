"""
Load Balancer Tasks for High-Concurrency Client Management
Handles dynamic resource allocation for clients running 500-1000+ threads
"""

import asyncio
import json
import logging
from datetime import datetime, timedelta
from typing import Any

import psutil
from celery import current_app as celery_app
from redis import Redis

from config.settings import settings
from core.celery_app import WORKER_SCALING_CONFIG

logger = logging.getLogger(__name__)

# Redis connection for load balancing
redis_client = Redis.from_url(settings.REDIS_URL, decode_responses=True)


class LoadBalancer:
    """Intelligent load balancer for high-concurrency email campaigns"""

    def __init__(self):
        self.redis = redis_client
        self.config = WORKER_SCALING_CONFIG

    async def register_client_session(
        self, session_id: str, thread_count: int, user_id: str
    ) -> dict[str, Any]:
        """Register a new client session with thread requirements"""
        client_tier = self._get_client_tier(thread_count)

        session_data = {
            "session_id": session_id,
            "user_id": user_id,
            "thread_count": thread_count,
            "tier": client_tier,
            "registered_at": datetime.utcnow().isoformat(),
            "last_activity": datetime.utcnow().isoformat(),
            "allocated_workers": 0,
            "queue_priority": self._get_queue_priority(client_tier),
            "resource_limits": self._get_resource_limits(client_tier),
        }

        # Store in Redis with TTL
        self.redis.hset(f"client_session:{session_id}", mapping=session_data)
        self.redis.expire(f"client_session:{session_id}", 86400)  # 24 hours

        # Add to active clients list
        self.redis.sadd("active_clients", session_id)

        logger.info(
            f"Registered client session {session_id} with {thread_count} threads (tier: {client_tier})"
        )
        return session_data

    def _get_client_tier(self, thread_count: int) -> str:
        """Determine client tier based on thread count"""
        if thread_count <= 50:
            return "low"
        elif thread_count <= 200:
            return "medium"
        elif thread_count <= 500:
            return "high"
        else:
            return "extreme"

    def _get_queue_priority(self, tier: str) -> int:
        """Get queue priority based on client tier"""
        priorities = {
            "extreme": 10,  # Highest priority for 500+ threads
            "high": 8,
            "medium": 6,
            "low": 4,
        }
        return priorities.get(tier, 4)

    def _get_resource_limits(self, tier: str) -> dict[str, int]:
        """Get resource limits based on client tier"""
        limits = {
            "low": {
                "max_concurrent_tasks": 10,
                "max_memory_mb": 512,
                "max_workers": 5,
            },
            "medium": {
                "max_concurrent_tasks": 25,
                "max_memory_mb": 1024,
                "max_workers": 10,
            },
            "high": {
                "max_concurrent_tasks": 50,
                "max_memory_mb": 2048,
                "max_workers": 20,
            },
            "extreme": {
                "max_concurrent_tasks": 100,
                "max_memory_mb": 4096,
                "max_workers": 40,
            },
        }
        return limits.get(tier, limits["low"])

    async def allocate_resources(self, session_id: str) -> dict[str, Any]:
        """Dynamically allocate resources based on current system load"""
        session_data = self.redis.hgetall(f"client_session:{session_id}")
        if not session_data:
            raise ValueError(f"Session {session_id} not found")

        tier = session_data["tier"]
        limits = json.loads(session_data["resource_limits"])

        # Check current system resources
        system_load = self._get_system_load()
        available_workers = self._get_available_workers()

        # Calculate optimal allocation
        allocation = self._calculate_optimal_allocation(
            tier, limits, system_load, available_workers
        )

        # Update session with allocation
        session_data.update(
            {
                "allocated_workers": allocation["workers"],
                "allocated_memory": allocation["memory"],
                "queue_name": allocation["queue"],
                "last_allocation": datetime.utcnow().isoformat(),
            }
        )

        self.redis.hset(f"client_session:{session_id}", mapping=session_data)

        # Store allocation in system metrics
        self._record_allocation_metrics(session_id, allocation)

        return allocation

    def _get_system_load(self) -> dict[str, float]:
        """Get current system resource utilization"""
        cpu_percent = psutil.cpu_percent(interval=0.0)
        memory = psutil.virtual_memory()

        return {
            "cpu_percent": cpu_percent,
            "memory_percent": memory.percent,
            "available_memory_mb": memory.available / 1024 / 1024,
            "load_average": psutil.getloadavg()[0]
            if hasattr(psutil, "getloadavg")
            else 0,
        }

    def _get_available_workers(self) -> int:
        """Get number of available Celery workers"""
        try:
            inspect = celery_app.control.inspect()
            active_workers = len(inspect.active() or {})
            return max(0, self.config["max_workers"] - active_workers)
        except Exception as e:
            logger.warning(f"Could not get worker count: {e}")
            return 10  # Default fallback

    def _calculate_optimal_allocation(
        self,
        tier: str,
        limits: dict,
        system_load: dict,
        available_workers: int,
    ) -> dict[str, Any]:
        """Calculate optimal resource allocation"""
        base_multiplier = self.config["client_thread_multiplier"][tier]

        # Adjust based on system load
        if system_load["cpu_percent"] > 80:
            multiplier = (
                base_multiplier * 0.7
            )  # Reduce allocation under high load
        elif system_load["cpu_percent"] < 30:
            multiplier = (
                base_multiplier * 1.3
            )  # Increase allocation under low load
        else:
            multiplier = base_multiplier

        # Calculate worker allocation
        requested_workers = min(
            int(limits["max_workers"] * multiplier),
            available_workers,
            limits["max_workers"],
        )

        # Determine queue based on tier and current load
        if tier == "extreme":
            queue = "high_priority"
        elif tier == "high":
            queue = "bulk_mail"
        else:
            queue = "celery"

        return {
            "workers": max(1, requested_workers),
            "memory": limits["max_memory_mb"],
            "queue": queue,
            "priority": self._get_queue_priority(tier),
            "concurrency_limit": limits["max_concurrent_tasks"],
        }

    def _record_allocation_metrics(self, session_id: str, allocation: dict):
        """Record allocation metrics for monitoring"""
        metrics = {
            "timestamp": datetime.utcnow().isoformat(),
            "session_id": session_id,
            "allocated_workers": allocation["workers"],
            "allocated_memory": allocation["memory"],
            "queue": allocation["queue"],
        }

        # Store in Redis list for time-series data
        self.redis.lpush("allocation_metrics", json.dumps(metrics))
        self.redis.ltrim(
            "allocation_metrics", 0, 1000
        )  # Keep last 1000 records


# Load balancer singleton
load_balancer = LoadBalancer()


@celery_app.task(bind=True, queue="monitoring")
def monitor_system_resources(self):
    """Monitor system resources and auto-scale workers"""
    try:
        system_load = load_balancer._get_system_load()

        # Store metrics
        metrics = {
            "timestamp": datetime.utcnow().isoformat(),
            "cpu_percent": system_load["cpu_percent"],
            "memory_percent": system_load["memory_percent"],
            "available_memory_mb": system_load["available_memory_mb"],
        }

        redis_client.lpush("system_metrics", json.dumps(metrics))
        redis_client.ltrim("system_metrics", 0, 1000)

        # Auto-scaling logic
        if system_load["cpu_percent"] > 85:
            logger.warning(
                "High CPU usage detected, consider scaling up workers"
            )
        elif system_load["memory_percent"] > 90:
            logger.warning(
                "High memory usage detected, consider scaling up workers"
            )

        return metrics

    except Exception as e:
        logger.error(f"Error monitoring system resources: {e}")
        self.retry(countdown=60, max_retries=3)


@celery_app.task(bind=True, queue="monitoring")
def cleanup_inactive_sessions(self):
    """Clean up inactive client sessions"""
    try:
        active_sessions = redis_client.smembers("active_clients")
        current_time = datetime.utcnow()

        for session_id in active_sessions:
            session_data = redis_client.hgetall(f"client_session:{session_id}")
            if session_data:
                last_activity = datetime.fromisoformat(
                    session_data["last_activity"]
                )
                if current_time - last_activity > timedelta(hours=2):
                    # Remove inactive session
                    redis_client.delete(f"client_session:{session_id}")
                    redis_client.srem("active_clients", session_id)
                    logger.info(f"Cleaned up inactive session: {session_id}")

    except Exception as e:
        logger.error(f"Error cleaning up sessions: {e}")


@celery_app.task(bind=True, queue="high_priority")
def distribute_campaign_load(
    self,
    session_id: str,
    campaign_data: dict,
    recipient_batches: list[list[dict]],
):
    """Distribute campaign load across multiple workers based on client tier"""
    try:
        # Get session allocation
        allocation = asyncio.run(load_balancer.allocate_resources(session_id))

        # Distribute batches across allocated workers
        worker_count = allocation["workers"]
        queue = allocation["queue"]

        # Split recipient batches among workers
        batches_per_worker = len(recipient_batches) // worker_count
        if batches_per_worker == 0:
            batches_per_worker = 1

        task_ids = []
        for i in range(0, len(recipient_batches), batches_per_worker):
            worker_batches = recipient_batches[i : i + batches_per_worker]

            # Create task for this worker with specific queue
            from tasks.campaign_tasks import send_campaign_batch

            task = send_campaign_batch.apply_async(
                args=[session_id, worker_batches, campaign_data],
                queue=queue,
                priority=allocation["priority"],
            )
            task_ids.append(task.id)

        return {
            "distributed_tasks": task_ids,
            "worker_count": worker_count,
            "queue": queue,
            "session_id": session_id,
        }

    except Exception as e:
        logger.error(f"Error distributing campaign load: {e}")
        self.retry(countdown=30, max_retries=3)
