"""
Advanced Task Optimization System
Dynamic worker scaling, resource management, and task optimization for Celery
"""

import asyncio
import logging
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import psutil
from celery import Celery
from celery.app.control import Control
from celery.events.state import State

from config.settings import settings
from core.enhanced_cache import cache

logger = logging.getLogger(__name__)


class TaskResourceMonitor:
    """Monitor system resources for intelligent task scheduling"""
    
    def __init__(self):
        self.cpu_threshold_high = 80.0  # Scale up if CPU > 80%
        self.cpu_threshold_low = 30.0   # Scale down if CPU < 30%
        self.memory_threshold = 85.0    # Alert if memory > 85%
        self.metrics_cache_ttl = 30     # Cache metrics for 30 seconds
    
    async def get_system_metrics(self) -> Dict[str, float]:
        """Get current system resource metrics with caching"""
        cache_key = "system_metrics"
        cached_metrics = await cache.get(cache_key)
        
        if cached_metrics:
            return cached_metrics
        
        # Collect fresh metrics
        try:
            metrics = {
                'cpu_percent': psutil.cpu_percent(interval=1),
                'memory_percent': psutil.virtual_memory().percent,
                'disk_percent': psutil.disk_usage('/').percent,
                'load_avg': psutil.getloadavg()[0] if hasattr(psutil, 'getloadavg') else 0,
                'active_connections': len(psutil.net_connections()),
                'timestamp': time.time()
            }
            
            # Cache the metrics
            await cache.set(cache_key, metrics, self.metrics_cache_ttl)
            return metrics
            
        except Exception as e:
            logger.error(f"Error collecting system metrics: {e}")
            return {
                'cpu_percent': 0,
                'memory_percent': 0,
                'disk_percent': 0,
                'load_avg': 0,
                'active_connections': 0,
                'timestamp': time.time()
            }
    
    async def should_scale_up(self) -> bool:
        """Determine if we should scale up workers"""
        metrics = await self.get_system_metrics()
        
        return (
            metrics['cpu_percent'] > self.cpu_threshold_high or
            metrics['load_avg'] > psutil.cpu_count() * 0.8
        )
    
    async def should_scale_down(self) -> bool:
        """Determine if we should scale down workers"""
        metrics = await self.get_system_metrics()
        
        return (
            metrics['cpu_percent'] < self.cpu_threshold_low and
            metrics['load_avg'] < psutil.cpu_count() * 0.3
        )
    
    async def get_resource_health(self) -> str:
        """Get overall system health status"""
        metrics = await self.get_system_metrics()
        
        if metrics['memory_percent'] > self.memory_threshold:
            return "critical"
        elif metrics['cpu_percent'] > self.cpu_threshold_high:
            return "high"
        elif metrics['cpu_percent'] < self.cpu_threshold_low:
            return "low"
        else:
            return "normal"


class DynamicWorkerScaler:
    """Dynamic Celery worker scaling based on queue depth and system resources"""
    
    def __init__(self, celery_app: Celery):
        self.celery_app = celery_app
        self.control = Control(celery_app)
        self.resource_monitor = TaskResourceMonitor()
        
        # Scaling configuration
        self.min_workers = 2
        self.max_workers = 20
        self.scale_up_threshold = 10   # Queue depth to trigger scale up
        self.scale_down_threshold = 2  # Queue depth to trigger scale down
        self.scale_cooldown = 60       # Seconds between scaling operations
        
        self.last_scale_time = 0
        self.current_workers = self.min_workers
    
    async def get_queue_depths(self) -> Dict[str, int]:
        """Get current queue depths for all queues"""
        try:
            # Get active queue information
            inspect = self.celery_app.control.inspect()
            active_queues = inspect.active_queues()
            
            queue_depths = {}
            for worker, queues in (active_queues or {}).items():
                for queue_info in queues:
                    queue_name = queue_info['name']
                    # This is a simplified approach - in production you'd query broker directly
                    queue_depths[queue_name] = queue_depths.get(queue_name, 0) + 1
            
            return queue_depths
            
        except Exception as e:
            logger.error(f"Error getting queue depths: {e}")
            return {}
    
    async def get_worker_stats(self) -> Dict[str, Any]:
        """Get current worker statistics"""
        try:
            inspect = self.celery_app.control.inspect()
            
            stats = {
                'active_workers': 0,
                'active_tasks': 0,
                'scheduled_tasks': 0,
                'reserved_tasks': 0
            }
            
            # Get active tasks
            active = inspect.active()
            if active:
                stats['active_workers'] = len(active)
                stats['active_tasks'] = sum(len(tasks) for tasks in active.values())
            
            # Get scheduled tasks
            scheduled = inspect.scheduled()
            if scheduled:
                stats['scheduled_tasks'] = sum(len(tasks) for tasks in scheduled.values())
            
            # Get reserved tasks
            reserved = inspect.reserved()
            if reserved:
                stats['reserved_tasks'] = sum(len(tasks) for tasks in reserved.values())
            
            return stats
            
        except Exception as e:
            logger.error(f"Error getting worker stats: {e}")
            return {'active_workers': 0, 'active_tasks': 0, 'scheduled_tasks': 0, 'reserved_tasks': 0}
    
    async def should_scale_workers(self) -> tuple[bool, str]:
        """Determine if workers should be scaled and in which direction"""
        current_time = time.time()
        
        # Respect cooldown period
        if current_time - self.last_scale_time < self.scale_cooldown:
            return False, "cooldown"
        
        queue_depths = await self.get_queue_depths()
        total_queue_depth = sum(queue_depths.values())
        
        worker_stats = await self.get_worker_stats()
        resource_health = await self.resource_monitor.get_resource_health()
        
        # Scale up conditions
        if (
            total_queue_depth > self.scale_up_threshold and
            self.current_workers < self.max_workers and
            resource_health in ["normal", "low"]
        ):
            return True, "up"
        
        # Scale down conditions
        elif (
            total_queue_depth < self.scale_down_threshold and
            self.current_workers > self.min_workers and
            worker_stats['active_tasks'] < self.current_workers * 0.5
        ):
            return True, "down"
        
        return False, "stable"
    
    async def scale_workers(self, direction: str) -> bool:
        """Scale workers up or down"""
        try:
            if direction == "up":
                new_worker_count = min(self.current_workers + 2, self.max_workers)
                logger.info(f"Scaling UP workers: {self.current_workers} -> {new_worker_count}")
                
            elif direction == "down":
                new_worker_count = max(self.current_workers - 1, self.min_workers)
                logger.info(f"Scaling DOWN workers: {self.current_workers} -> {new_worker_count}")
            
            else:
                return False
            
            # In a real implementation, you would use your container orchestrator
            # For now, we'll just update our tracking
            self.current_workers = new_worker_count
            self.last_scale_time = time.time()
            
            # Cache the scaling event
            scaling_event = {
                'timestamp': datetime.now().isoformat(),
                'direction': direction,
                'old_count': self.current_workers if direction == "down" else self.current_workers - 2,
                'new_count': new_worker_count,
                'trigger': 'automatic'
            }
            
            await cache.set(f"scaling_event:{int(time.time())}", scaling_event, 3600)
            
            return True
            
        except Exception as e:
            logger.error(f"Error scaling workers: {e}")
            return False


class TaskOptimizer:
    """Main task optimization coordinator"""
    
    def __init__(self, celery_app: Celery):
        self.celery_app = celery_app
        self.scaler = DynamicWorkerScaler(celery_app)
        self.resource_monitor = TaskResourceMonitor()
        
        # Task prioritization settings
        self.priority_weights = {
            'high_priority': 10,
            'bulk_mail': 8,
            'validation': 6,
            'imap_processing': 5,
            'monitoring': 3,
            'celery': 1
        }
    
    async def optimize_task_routing(self, task_name: str, task_args: tuple, task_kwargs: dict) -> str:
        """Determine optimal queue for a task based on current system state"""
        
        # Get current system metrics
        metrics = await self.resource_monitor.get_system_metrics()
        worker_stats = await self.scaler.get_worker_stats()
        
        # Default queue selection based on task type
        if 'campaign' in task_name.lower() or 'urgent' in str(task_kwargs):
            base_queue = 'high_priority'
        elif 'bulk' in task_name.lower() or 'batch' in task_name.lower():
            base_queue = 'bulk_mail'
        elif 'validate' in task_name.lower() or 'check' in task_name.lower():
            base_queue = 'validation'
        elif 'imap' in task_name.lower() or 'email' in task_name.lower():
            base_queue = 'imap_processing'
        elif 'monitor' in task_name.lower() or 'status' in task_name.lower():
            base_queue = 'monitoring'
        else:
            base_queue = 'celery'
        
        # Adjust queue based on system load
        if metrics['cpu_percent'] > 80:
            # System under high load - route non-critical tasks to monitoring queue
            if base_queue in ['validation', 'monitoring']:
                base_queue = 'monitoring'
        
        logger.debug(f"Task {task_name} routed to queue: {base_queue}")
        return base_queue
    
    async def run_optimization_cycle(self):
        """Run one optimization cycle"""
        try:
            # Check if workers need scaling
            should_scale, direction = await self.scaler.should_scale_workers()
            
            if should_scale:
                await self.scaler.scale_workers(direction)
            
            # Update optimization metrics
            optimization_stats = {
                'timestamp': datetime.now().isoformat(),
                'worker_count': self.scaler.current_workers,
                'system_metrics': await self.resource_monitor.get_system_metrics(),
                'worker_stats': await self.scaler.get_worker_stats(),
                'last_scaling_direction': direction if should_scale else 'none'
            }
            
            await cache.set("task_optimization_stats", optimization_stats, 300)
            
        except Exception as e:
            logger.error(f"Error in optimization cycle: {e}")
    
    async def start_optimization_loop(self, interval: int = 30):
        """Start the continuous optimization loop"""
        logger.info(f"Starting task optimization loop (interval: {interval}s)")
        
        while True:
            try:
                await self.run_optimization_cycle()
                await asyncio.sleep(interval)
            except asyncio.CancelledError:
                logger.info("Task optimization loop cancelled")
                break
            except Exception as e:
                logger.error(f"Error in optimization loop: {e}")
                await asyncio.sleep(interval)
    
    async def get_optimization_stats(self) -> Dict[str, Any]:
        """Get current optimization statistics"""
        stats = await cache.get("task_optimization_stats")
        
        if not stats:
            # Generate fresh stats
            stats = {
                'timestamp': datetime.now().isoformat(),
                'worker_count': self.scaler.current_workers,
                'system_metrics': await self.resource_monitor.get_system_metrics(),
                'worker_stats': await self.scaler.get_worker_stats(),
                'optimization_status': 'active'
            }
        
        return stats


# Global task optimizer instance
task_optimizer: Optional[TaskOptimizer] = None


async def init_task_optimizer(celery_app: Celery):
    """Initialize the task optimizer"""
    global task_optimizer
    task_optimizer = TaskOptimizer(celery_app)
    logger.info("Task optimizer initialized")
    
    # Start optimization loop in background
    asyncio.create_task(task_optimizer.start_optimization_loop())


async def get_task_optimizer() -> Optional[TaskOptimizer]:
    """Get the task optimizer instance"""
    return task_optimizer


# Export main components
__all__ = ['TaskOptimizer', 'DynamicWorkerScaler', 'TaskResourceMonitor', 'init_task_optimizer', 'get_task_optimizer'] 