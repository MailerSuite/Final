"""
Async Performance Monitoring for High Concurrency Workloads
"""

import asyncio
import logging
import time
from collections import defaultdict, deque
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Any, TYPE_CHECKING

if TYPE_CHECKING:
    from typing import TYPE_CHECKING

import psutil

logger = logging.getLogger(__name__)


@dataclass
class ConcurrencyMetrics:
    """Metrics for tracking concurrency performance"""

    timestamp: datetime = field(default_factory=datetime.utcnow)
    active_connections: int = 0
    queued_requests: int = 0
    average_response_time: float = 0.0
    error_rate: float = 0.0
    memory_usage_mb: float = 0.0
    cpu_usage_percent: float = 0.0
    database_connections: int = 0
    smtp_connections: int = 0
    imap_connections: int = 0


@dataclass
class BottleneckAlert:
    """Alert for detected performance bottlenecks"""

    timestamp: datetime = field(default_factory=datetime.utcnow)
    severity: str = "warning"  # warning, critical
    component: str = ""  # database, smtp, imap, memory, cpu
    message: str = ""
    current_value: float = 0.0
    threshold: float = 0.0


class AsyncPerformanceMonitor:
    """Async performance monitor for high concurrency environments"""

    def __init__(self, monitoring_interval: int = 30):
        self.monitoring_interval = monitoring_interval
        self.metrics_history: deque = deque(
            maxlen=1000
        )  # Keep last 1000 metrics
        self.alerts: list[BottleneckAlert] = []
        self.active_tasks: dict[str, int] = defaultdict(int)
        self.response_times: dict[str, deque] = defaultdict(
            lambda: deque(maxlen=100)
        )
        self.error_counts: dict[str, int] = defaultdict(int)
        self.monitoring_task: asyncio.Task | None = None

        # Thresholds for bottleneck detection
        self.thresholds = {
            "memory_usage_mb": 8000,  # 8GB memory usage
            "cpu_usage_percent": 80,  # 80% CPU usage
            "database_connections": 180,  # 90% of max pool size (200)
            "smtp_connections": 180,  # 90% of max SMTP connections
            "imap_connections": 180,  # 90% of max IMAP connections
            "average_response_time": 5.0,  # 5 seconds response time
            "error_rate": 0.05,  # 5% error rate
            "queued_requests": 500,  # 500 queued requests
        }

    async def start_monitoring(self):
        """Start async monitoring task"""
        if self.monitoring_task is None or self.monitoring_task.done():
            self.monitoring_task = asyncio.create_task(self._monitoring_loop())
            logger.info("Performance monitoring started")

    async def stop_monitoring(self):
        """Stop monitoring task"""
        if self.monitoring_task and not self.monitoring_task.done():
            self.monitoring_task.cancel()
            try:
                await self.monitoring_task
            except asyncio.CancelledError:
                pass
            logger.info("Performance monitoring stopped")

    async def _monitoring_loop(self):
        return  # DISABLED FOR PERFORMANCE
        
        """Main monitoring loop"""
        while True:
            try:
                await self._collect_metrics()
                await asyncio.sleep(self.monitoring_interval)
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in monitoring loop: {e}")
                await asyncio.sleep(5)  # Brief pause before retrying

    async def _collect_metrics(self):
        """Collect current performance metrics"""
        try:
            # System metrics
            memory = psutil.virtual_memory()
            cpu_percent = psutil.cpu_percent(interval=1)

            # Application metrics
            metrics = ConcurrencyMetrics(
                active_connections=sum(self.active_tasks.values()),
                queued_requests=self._get_queued_requests(),
                average_response_time=self._calculate_average_response_time(),
                error_rate=self._calculate_error_rate(),
                memory_usage_mb=memory.used / 1024 / 1024,
                cpu_usage_percent=cpu_percent,
                database_connections=self._get_database_connections(),
                smtp_connections=self.active_tasks.get("smtp", 0),
                imap_connections=self.active_tasks.get("imap", 0),
            )

            # Store metrics
            self.metrics_history.append(metrics)

            # Check for bottlenecks
            await self._check_bottlenecks(metrics)

            # Log metrics periodically
            if len(self.metrics_history) % 10 == 0:  # Every 10 collections
                await self._log_performance_summary(metrics)

        except Exception as e:
            logger.error(f"Error collecting metrics: {e}")

    async def _check_bottlenecks(self, metrics: ConcurrencyMetrics):
        """Check for performance bottlenecks and create alerts"""
        alerts = []

        # Check each threshold
        checks = [
            ("memory_usage_mb", metrics.memory_usage_mb, "Memory usage high"),
            ("cpu_usage_percent", metrics.cpu_usage_percent, "CPU usage high"),
            (
                "database_connections",
                metrics.database_connections,
                "Database connection pool near limit",
            ),
            (
                "smtp_connections",
                metrics.smtp_connections,
                "SMTP connection limit approaching",
            ),
            (
                "imap_connections",
                metrics.imap_connections,
                "IMAP connection limit approaching",
            ),
            (
                "average_response_time",
                metrics.average_response_time,
                "Response time elevated",
            ),
            ("error_rate", metrics.error_rate, "Error rate high"),
            (
                "queued_requests",
                metrics.queued_requests,
                "Request queue backing up",
            ),
        ]

        for metric_name, current_value, message in checks:
            threshold = self.thresholds[metric_name]
            if current_value > threshold:
                severity = (
                    "critical"
                    if current_value > threshold * 1.2
                    else "warning"
                )
                alert = BottleneckAlert(
                    severity=severity,
                    component=metric_name,
                    message=f"{message}: {current_value:.2f} (threshold: {threshold})",
                    current_value=current_value,
                    threshold=threshold,
                )
                alerts.append(alert)

        # Store and log alerts
        if alerts:
            self.alerts.extend(alerts)
            # Keep only recent alerts (last 100)
            self.alerts = self.alerts[-100:]

            for alert in alerts:
                log_func = (
                    logger.critical
                    if alert.severity == "critical"
                    else logger.warning
                )
                log_func(
                    f"Performance Alert [{alert.severity.upper()}]: {alert.message}"
                )

    def track_operation_start(self, operation_type: str):
        """Track the start of an async operation"""
        self.active_tasks[operation_type] += 1

    def track_operation_end(
        self, operation_type: str, duration: float, success: bool = True
    ):
        """Track the end of an async operation"""
        self.active_tasks[operation_type] = max(
            0, self.active_tasks[operation_type] - 1
        )
        self.response_times[operation_type].append(duration)
        if not success:
            self.error_counts[operation_type] += 1

    def _get_queued_requests(self) -> int:
        """Get number of queued requests (placeholder)"""
        # This would integrate with actual queue monitoring
        return 0

    def _calculate_average_response_time(self) -> float:
        """Calculate average response time across all operations"""
        all_times = []
        for times in self.response_times.values():
            all_times.extend(times)
        return sum(all_times) / len(all_times) if all_times else 0.0

    def _calculate_error_rate(self) -> float:
        """Calculate overall error rate"""
        total_errors = sum(self.error_counts.values())
        total_requests = sum(
            len(times) for times in self.response_times.values()
        )
        return total_errors / total_requests if total_requests > 0 else 0.0

    def _get_database_connections(self) -> int:
        """Get current database connection count (placeholder)"""
        # This would integrate with actual database pool monitoring
        return self.active_tasks.get("database", 0)

    async def _log_performance_summary(self, metrics: ConcurrencyMetrics):
        """Log performance summary"""
        logger.info(
            f"Performance Summary - "
            f"Active: {metrics.active_connections}, "
            f"Memory: {metrics.memory_usage_mb:.1f}MB, "
            f"CPU: {metrics.cpu_usage_percent:.1f}%, "
            f"Avg Response: {metrics.average_response_time:.2f}s, "
            f"Error Rate: {metrics.error_rate:.2%}"
        )

    def get_current_metrics(self) -> ConcurrencyMetrics | None:
        """Get the most recent metrics"""
        return self.metrics_history[-1] if self.metrics_history else None

    def get_metrics_history(
        self, minutes: int = 60
    ) -> list[ConcurrencyMetrics]:
        """Get metrics history for the specified time period"""
        cutoff_time = datetime.utcnow() - timedelta(minutes=minutes)
        return [m for m in self.metrics_history if m.timestamp >= cutoff_time]

    def get_recent_alerts(self, minutes: int = 60) -> list[BottleneckAlert]:
        """Get recent alerts for the specified time period"""
        cutoff_time = datetime.utcnow() - timedelta(minutes=minutes)
        return [a for a in self.alerts if a.timestamp >= cutoff_time]

    async def get_performance_report(self) -> dict[str, Any]:
        """Generate comprehensive performance report"""
        current = self.get_current_metrics()
        recent_alerts = self.get_recent_alerts(60)

        report = {
            "timestamp": datetime.utcnow().isoformat(),
            "current_metrics": {
                "active_connections": current.active_connections
                if current
                else 0,
                "memory_usage_mb": current.memory_usage_mb if current else 0,
                "cpu_usage_percent": current.cpu_usage_percent
                if current
                else 0,
                "average_response_time": current.average_response_time
                if current
                else 0,
                "error_rate": current.error_rate if current else 0,
                "database_connections": current.database_connections
                if current
                else 0,
                "smtp_connections": current.smtp_connections if current else 0,
                "imap_connections": current.imap_connections if current else 0,
            },
            "active_tasks_by_type": dict(self.active_tasks),
            "recent_alerts": [
                {
                    "timestamp": alert.timestamp.isoformat(),
                    "severity": alert.severity,
                    "component": alert.component,
                    "message": alert.message,
                    "current_value": alert.current_value,
                    "threshold": alert.threshold,
                }
                for alert in recent_alerts
            ],
            "performance_trends": {
                "memory_trend": self._calculate_trend("memory_usage_mb"),
                "cpu_trend": self._calculate_trend("cpu_usage_percent"),
                "response_time_trend": self._calculate_trend(
                    "average_response_time"
                ),
            },
        }

        return report

    def _calculate_trend(self, metric_name: str) -> str:
        """Calculate trend for a specific metric"""
        if len(self.metrics_history) < 2:
            return "insufficient_data"

        recent_metrics = list(self.metrics_history)[
            -10:
        ]  # Last 10 measurements
        if len(recent_metrics) < 2:
            return "insufficient_data"

        values = [getattr(m, metric_name) for m in recent_metrics]
        if all(v == values[0] for v in values):
            return "stable"

        # Simple trend calculation
        first_half = sum(values[: len(values) // 2]) / (len(values) // 2)
        second_half = sum(values[len(values) // 2 :]) / (
            len(values) - len(values) // 2
        )

        if second_half > first_half * 1.1:
            return "increasing"
        elif second_half < first_half * 0.9:
            return "decreasing"
        else:
            return "stable"


# Global performance monitor instance
performance_monitor = AsyncPerformanceMonitor()


# Context manager for operation tracking
class OperationTracker:
    """Context manager for tracking async operations"""

    def __init__(self, operation_type: str):
        self.operation_type = operation_type
        self.start_time = None

    async def __aenter__(self):
        self.start_time = time.time()
        performance_monitor.track_operation_start(self.operation_type)
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        duration = time.time() - self.start_time
        success = exc_type is None
        performance_monitor.track_operation_end(
            self.operation_type, duration, success
        )
        return False
