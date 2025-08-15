"""
Session Load Balancer Service
Manages client sessions with dynamic resource allocation for 500-1000+ thread scenarios
"""

import json
import uuid
from datetime import datetime
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession

from core.logger import get_logger
from models.base import Session as SessionModel
from tasks.load_balancer_tasks import load_balancer

logger = get_logger(__name__)


class SessionLoadBalancerService:
    """Service for managing client sessions with intelligent load balancing"""

    def __init__(self, db_session: AsyncSession):
        self.db = db_session
        self.load_balancer = load_balancer
        # Ensure we have a redis connection
        if (
            not hasattr(self.load_balancer, "redis")
            or self.load_balancer.redis is None
        ):
            logger.warning("Redis connection not available in load balancer")

    async def register_client_session(
        self,
        user_id: str,
        session_name: str,
        thread_count: int,
        description: str | None = None,
    ) -> dict[str, Any]:
        """
        Register a new client session with thread requirements

        Args:
            user_id: User ID
            session_name: Name for the session
            thread_count: Number of threads client will use (20-1000+)
            description: Optional description

        Returns:
            Session data with load balancing allocation
        """
        try:
            # Create database session
            session_id = str(uuid.uuid4())
            db_session = SessionModel(
                id=session_id,
                user_id=user_id,
                name=session_name,
                description=description,
                is_active=True,
                created_at=datetime.utcnow(),
            )

            self.db.add(db_session)
            await self.db.commit()
            await self.db.refresh(db_session)

            # Register with load balancer
            session_data = await self.load_balancer.register_client_session(
                session_id=session_id,
                thread_count=thread_count,
                user_id=user_id,
            )

            # Get initial resource allocation
            allocation = await self.load_balancer.allocate_resources(
                session_id
            )

            logger.info(
                f"Registered session {session_id} for user {user_id} with {thread_count} threads"
            )

            return {
                "session_id": session_id,
                "session_name": session_name,
                "thread_count": thread_count,
                "tier": session_data["tier"],
                "allocation": allocation,
                "queue_priority": session_data["queue_priority"],
                "resource_limits": session_data["resource_limits"],
                "registered_at": session_data["registered_at"],
            }

        except Exception as e:
            logger.error(f"Failed to register client session: {e}")
            await self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to register session: {str(e)}",
            )

    async def get_session_allocation(self, session_id: str) -> dict[str, Any]:
        """Get current resource allocation for a session"""
        try:
            allocation = await self.load_balancer.allocate_resources(
                session_id
            )

            # Get session metrics
            metrics = await self._get_session_metrics(session_id)

            return {
                "session_id": session_id,
                "allocation": allocation,
                "metrics": metrics,
                "timestamp": datetime.utcnow().isoformat(),
            }

        except Exception as e:
            logger.error(f"Failed to get session allocation: {e}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Session not found: {session_id}",
            )

    async def update_session_activity(
        self, session_id: str, activity_data: dict[str, Any]
    ):
        """Update session activity for load balancing decisions"""
        try:
            # Check if Redis is available and has required methods
            if (
                not hasattr(self.load_balancer, "redis")
                or self.load_balancer.redis is None
            ):
                logger.warning(
                    "Redis not available - skipping activity update"
                )
                return

            # Update last activity time
            activity_update = {
                "last_activity": datetime.utcnow().isoformat(),
                "current_load": activity_data.get("current_load", 0),
                "active_tasks": activity_data.get("active_tasks", 0),
                "throughput": activity_data.get("throughput", 0),
            }

            try:
                # Use the redis client directly but catch any type errors
                redis_client = self.load_balancer.redis
                if hasattr(redis_client, "hset"):
                    redis_client.hset(
                        f"client_session:{session_id}", mapping=activity_update
                    )

                    # Record activity metrics
                    metrics = {
                        "session_id": session_id,
                        "timestamp": datetime.utcnow().isoformat(),
                        **activity_data,
                    }

                    redis_client.lpush(
                        f"session_activity:{session_id}", json.dumps(metrics)
                    )
                    redis_client.ltrim(
                        f"session_activity:{session_id}", 0, 100
                    )

                    logger.debug(f"Updated activity for session {session_id}")

            except (AttributeError, TypeError) as redis_error:
                logger.warning(f"Redis operation failed: {redis_error}")

        except Exception as e:
            logger.error(f"Failed to update session activity: {e}")

    async def scale_session_resources(
        self, session_id: str, new_thread_count: int
    ) -> dict[str, Any]:
        """Dynamically scale session resources based on new thread count"""
        try:
            # Check if Redis is available
            if (
                not hasattr(self.load_balancer, "redis")
                or self.load_balancer.redis is None
            ):
                logger.warning("Redis not available - using fallback scaling")
                return {
                    "session_id": session_id,
                    "new_thread_count": new_thread_count,
                    "new_tier": "medium",  # fallback tier
                    "new_allocation": {
                        "workers": max(1, new_thread_count // 10),
                        "concurrency_limit": new_thread_count,
                    },
                    "scaled_at": datetime.utcnow().isoformat(),
                }

            # Update thread count in session data
            session_data = {
                "thread_count": new_thread_count,
                "tier": self.load_balancer._get_client_tier(new_thread_count),
                "last_scaled": datetime.utcnow().isoformat(),
            }

            try:
                redis_client = self.load_balancer.redis
                if hasattr(redis_client, "hset"):
                    redis_client.hset(
                        f"client_session:{session_id}", mapping=session_data
                    )

                    # Get new allocation
                    new_allocation = (
                        await self.load_balancer.allocate_resources(session_id)
                    )

                    logger.info(
                        f"Scaled session {session_id} to {new_thread_count} threads"
                    )

                    return {
                        "session_id": session_id,
                        "new_thread_count": new_thread_count,
                        "new_tier": session_data["tier"],
                        "new_allocation": new_allocation,
                        "scaled_at": session_data["last_scaled"],
                    }
                else:
                    # Return fallback if Redis doesn't have the method
                    return {
                        "session_id": session_id,
                        "new_thread_count": new_thread_count,
                        "new_tier": session_data["tier"],
                        "new_allocation": {
                            "workers": max(1, new_thread_count // 10),
                            "concurrency_limit": new_thread_count,
                        },
                        "scaled_at": session_data["last_scaled"],
                    }

            except (AttributeError, TypeError) as redis_error:
                logger.warning(f"Redis operation failed: {redis_error}")
                # Return fallback response
                return {
                    "session_id": session_id,
                    "new_thread_count": new_thread_count,
                    "new_tier": session_data["tier"],
                    "new_allocation": {
                        "workers": max(1, new_thread_count // 10),
                        "concurrency_limit": new_thread_count,
                    },
                    "scaled_at": session_data["last_scaled"],
                }

        except Exception as e:
            logger.error(f"Failed to scale session resources: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to scale session: {str(e)}",
            )

    async def get_optimal_campaign_distribution(
        self, session_id: str, total_recipients: int, estimated_send_time: int
    ) -> dict[str, Any]:
        """Calculate optimal campaign distribution based on session resources"""
        try:
            # Get current allocation
            allocation = await self.load_balancer.allocate_resources(
                session_id
            )

            # Calculate optimal batch size and distribution
            worker_count = allocation["workers"]
            concurrency_limit = allocation["concurrency_limit"]

            # Calculate optimal batch size
            optimal_batch_size = min(
                total_recipients // worker_count,
                concurrency_limit,
                1000,  # Max batch size for memory efficiency
            )

            # Ensure minimum batch size
            optimal_batch_size = max(optimal_batch_size, 10)

            # Calculate number of batches
            num_batches = (
                total_recipients + optimal_batch_size - 1
            ) // optimal_batch_size

            # Calculate estimated completion time
            estimated_completion = self._estimate_completion_time(
                total_recipients,
                worker_count,
                optimal_batch_size,
                estimated_send_time,
            )

            distribution = {
                "session_id": session_id,
                "total_recipients": total_recipients,
                "worker_count": worker_count,
                "optimal_batch_size": optimal_batch_size,
                "num_batches": num_batches,
                "queue": allocation["queue"],
                "priority": allocation["priority"],
                "estimated_completion_minutes": estimated_completion,
                "recommended_delay_between_batches": self._calculate_delay(
                    allocation["tier"]
                ),
                "resource_allocation": allocation,
            }

            logger.info(
                f"Calculated distribution for session {session_id}: {num_batches} batches, {worker_count} workers"
            )

            return distribution

        except Exception as e:
            logger.error(f"Failed to calculate campaign distribution: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to calculate distribution: {str(e)}",
            )

    async def _get_session_metrics(self, session_id: str) -> dict[str, Any]:
        """Get comprehensive session metrics"""
        try:
            # Check if Redis is available
            if (
                not hasattr(self.load_balancer, "redis")
                or self.load_balancer.redis is None
            ):
                logger.warning("Redis not available - returning empty metrics")
                return {}

            try:
                redis_client = self.load_balancer.redis
                # Get recent activity
                if hasattr(redis_client, "lrange"):
                    activity_data = redis_client.lrange(
                        f"session_activity:{session_id}", 0, 10
                    )
                else:
                    activity_data = []

                activities = []
                for data in activity_data:
                    try:
                        activities.append(json.loads(data))
                    except json.JSONDecodeError:
                        continue

                # Calculate metrics
                if activities:
                    avg_load = sum(
                        a.get("current_load", 0) for a in activities
                    ) / len(activities)
                    avg_throughput = sum(
                        a.get("throughput", 0) for a in activities
                    ) / len(activities)
                    total_tasks = sum(
                        a.get("active_tasks", 0) for a in activities
                    )
                else:
                    avg_load = 0
                    avg_throughput = 0
                    total_tasks = 0

                return {
                    "average_load": avg_load,
                    "average_throughput": avg_throughput,
                    "total_active_tasks": total_tasks,
                    "recent_activities": len(activities),
                    "last_activity": activities[0]["timestamp"]
                    if activities
                    else None,
                }

            except (AttributeError, TypeError) as redis_error:
                logger.warning(f"Redis operation failed: {redis_error}")
                return {}

        except Exception as e:
            logger.warning(f"Could not get session metrics: {e}")
            return {}

    def _estimate_completion_time(
        self,
        total_recipients: int,
        worker_count: int,
        batch_size: int,
        send_time_per_email: int,
    ) -> int:
        """Estimate campaign completion time in minutes"""
        emails_per_worker = total_recipients / worker_count
        time_per_batch = batch_size * send_time_per_email
        total_batches_per_worker = emails_per_worker / batch_size

        # Add overhead for queuing and processing
        overhead_factor = 1.2

        estimated_seconds = (
            total_batches_per_worker * time_per_batch
        ) * overhead_factor
        return int(estimated_seconds / 60)  # Convert to minutes

    def _calculate_delay(self, tier: str) -> int:
        """Calculate recommended delay between batches based on tier"""
        delays = {
            "low": 30,  # 30 seconds
            "medium": 15,  # 15 seconds
            "high": 5,  # 5 seconds
            "extreme": 2,  # 2 seconds for high-volume clients
        }
        return delays.get(tier, 15)

    async def cleanup_session(self, session_id: str):
        """Clean up session resources"""
        try:
            # Mark database session as inactive
            result = await self.db.execute(
                update(SessionModel)
                .where(SessionModel.id == session_id)
                .values(is_active=False, updated_at=datetime.utcnow())
            )

            if result.rowcount > 0:
                # Clean up Redis data if available
                if (
                    hasattr(self.load_balancer, "redis")
                    and self.load_balancer.redis is not None
                ):
                    try:
                        redis_client = self.load_balancer.redis
                        if hasattr(redis_client, "delete") and hasattr(
                            redis_client, "srem"
                        ):
                            redis_client.delete(f"client_session:{session_id}")
                            redis_client.delete(
                                f"session_activity:{session_id}"
                            )
                            redis_client.srem("active_clients", session_id)
                    except (AttributeError, TypeError) as redis_error:
                        logger.warning(f"Redis cleanup failed: {redis_error}")

                await self.db.commit()
                logger.info(f"Cleaned up session {session_id}")

        except Exception as e:
            logger.error(f"Failed to cleanup session {session_id}: {e}")
            await self.db.rollback()


# Service factory
def get_session_load_balancer_service(
    db: AsyncSession,
) -> SessionLoadBalancerService:
    """Get session load balancer service instance"""
    return SessionLoadBalancerService(db)
