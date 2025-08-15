"""
Enhanced Performance Profiler with Resource Cleanup
Provides comprehensive performance monitoring with automatic resource management
"""

import asyncio
import cProfile
import gc
import io
import logging
import os
import pstats
import tempfile
import time
import tracemalloc
import weakref
from collections.abc import Callable
from contextlib import asynccontextmanager
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import psutil

logger = logging.getLogger(__name__)


@dataclass
class ProfileSession:
    session_id: str
    start_time: float
    end_time: float | None = None
    cpu_profiler: cProfile.Profile | None = None
    memory_profiler_active: bool = False
    temp_files: list[str] = field(default_factory=list)
    open_handles: list[Any] = field(default_factory=list)
    resource_trackers: list[weakref.ref] = field(default_factory=list)


@dataclass
class ProfileResult:
    session_id: str
    duration: float
    cpu_stats: dict[str, Any] | None = None
    memory_stats: dict[str, Any] | None = None
    resource_stats: dict[str, Any] | None = None
    cleanup_performed: bool = False


class EnhancedPerformanceProfiler:
    """Enhanced performance profiler with automatic resource cleanup"""

    def __init__(
        self,
        max_sessions: int = 5,
        auto_cleanup_interval: int = 300,  # 5 minutes
        temp_dir: str | None = None,
    ):
        self.max_sessions = max_sessions
        self.auto_cleanup_interval = auto_cleanup_interval
        self.temp_dir = temp_dir or tempfile.gettempdir()

        # Active profiling sessions
        self.active_sessions: dict[str, ProfileSession] = {}
        self.completed_sessions: dict[str, ProfileResult] = {}

        # Resource tracking
        self.resource_usage_baseline: dict[str, Any] | None = None
        self.leaked_resources: list[dict[str, Any]] = []

        # Background cleanup task
        self._cleanup_task: asyncio.Task | None = None
        self._profiler_running = False

        # Performance metrics
        self.profiler_overhead_ms = 0.0
        self.cleanup_stats = {
            "sessions_cleaned": 0,
            "temp_files_removed": 0,
            "memory_freed_mb": 0.0,
            "handles_closed": 0,
        }

    async def start_profiler_service(self):
        """Start the profiler service with background cleanup"""
        if self._profiler_running:
            return

        self._profiler_running = True
        self._cleanup_task = asyncio.create_task(self._background_cleanup())

        # Establish baseline resource usage
        await self._establish_baseline()

        logger.info("🚀 Enhanced performance profiler service started")

    async def stop_profiler_service(self):
        """Stop the profiler service and cleanup all resources"""
        self._profiler_running = False

        if self._cleanup_task:
            self._cleanup_task.cancel()

        # Force cleanup of all active sessions
        await self._cleanup_all_sessions()

        logger.info("🛑 Enhanced performance profiler service stopped")

    @asynccontextmanager
    async def profile_operation(
        self,
        operation_name: str,
        include_memory: bool = True,
        include_cpu: bool = True,
        custom_metrics: dict[str, Callable] | None = None,
    ):
        """Context manager for profiling operations with automatic cleanup"""

        session_id = f"{operation_name}_{int(time.time())}"
        overhead_start = time.perf_counter()

        try:
            # Start profiling session
            session = await self._start_session(
                session_id, include_memory, include_cpu
            )

            # Record profiler overhead
            self.profiler_overhead_ms = (
                time.perf_counter() - overhead_start
            ) * 1000

            yield session

        finally:
            # Always cleanup, even if operation failed
            result = await self._end_session(session_id, custom_metrics)
            await self._cleanup_session(session_id)

    async def _start_session(
        self, session_id: str, include_memory: bool, include_cpu: bool
    ) -> ProfileSession:
        """Start a new profiling session"""

        # Limit concurrent sessions
        if len(self.active_sessions) >= self.max_sessions:
            oldest_session = min(
                self.active_sessions.values(), key=lambda s: s.start_time
            )
            await self._cleanup_session(oldest_session.session_id)

        session = ProfileSession(session_id=session_id, start_time=time.time())

        # Start CPU profiling
        if include_cpu:
            session.cpu_profiler = cProfile.Profile()
            session.cpu_profiler.enable()

        # Start memory profiling
        if include_memory:
            tracemalloc.start()
            session.memory_profiler_active = True

        self.active_sessions[session_id] = session
        logger.debug(f"Started profiling session: {session_id}")

        return session

    async def _end_session(
        self,
        session_id: str,
        custom_metrics: dict[str, Callable] | None = None,
    ) -> ProfileResult:
        """End a profiling session and collect results"""

        if session_id not in self.active_sessions:
            raise ValueError(f"Session {session_id} not found")

        session = self.active_sessions[session_id]
        session.end_time = time.time()
        duration = session.end_time - session.start_time

        result = ProfileResult(session_id=session_id, duration=duration)

        try:
            # Collect CPU profiling results
            if session.cpu_profiler:
                session.cpu_profiler.disable()
                result.cpu_stats = self._extract_cpu_stats(
                    session.cpu_profiler
                )

            # Collect memory profiling results
            if session.memory_profiler_active:
                result.memory_stats = self._extract_memory_stats()
                tracemalloc.stop()
                session.memory_profiler_active = False

            # Collect custom metrics
            if custom_metrics:
                custom_results = {}
                for metric_name, metric_func in custom_metrics.items():
                    try:
                        custom_results[metric_name] = metric_func()
                    except Exception as e:
                        logger.warning(
                            f"Custom metric {metric_name} failed: {e}"
                        )
                        custom_results[metric_name] = None

                if "custom_metrics" not in result.resource_stats:
                    result.resource_stats = {}
                result.resource_stats["custom_metrics"] = custom_results

            # Collect resource usage
            result.resource_stats = self._collect_resource_stats()

            self.completed_sessions[session_id] = result
            logger.debug(
                f"Completed profiling session: {session_id} ({duration:.2f}s)"
            )

            return result

        except Exception as e:
            logger.error(f"Error ending session {session_id}: {e}")
            raise

    def _extract_cpu_stats(self, profiler: cProfile.Profile) -> dict[str, Any]:
        """Extract CPU profiling statistics"""
        try:
            string_io = io.StringIO()
            ps = pstats.Stats(profiler, stream=string_io)
            ps.sort_stats("cumulative")

            # Get top functions by cumulative time
            stats_data = ps.get_stats_profile()
            top_functions = []

            for func_key, (cc, nc, tt, ct, callers) in list(
                stats_data.func_profiles.items()
            )[:10]:
                top_functions.append(
                    {
                        "function": f"{func_key[0]}:{func_key[1]}({func_key[2]})",
                        "call_count": cc,
                        "total_time": tt,
                        "cumulative_time": ct,
                        "time_per_call": tt / cc if cc > 0 else 0,
                    }
                )

            return {
                "total_calls": stats_data.total_calls,
                "total_time": stats_data.total_tt,
                "top_functions": top_functions,
                "stats_summary": string_io.getvalue()[
                    :1000
                ],  # First 1000 chars
            }

        except Exception as e:
            logger.error(f"Error extracting CPU stats: {e}")
            return {"error": str(e)}

    def _extract_memory_stats(self) -> dict[str, Any]:
        """Extract memory profiling statistics"""
        try:
            snapshot = tracemalloc.take_snapshot()
            top_stats = snapshot.statistics("lineno")

            memory_usage = []
            for stat in top_stats[:10]:
                memory_usage.append(
                    {
                        "filename": stat.traceback.format()[0]
                        if stat.traceback
                        else "unknown",
                        "size_mb": stat.size / 1024 / 1024,
                        "count": stat.count,
                    }
                )

            total_memory = sum(stat.size for stat in top_stats) / 1024 / 1024

            return {
                "total_memory_mb": total_memory,
                "top_consumers": memory_usage,
                "total_traces": len(top_stats),
            }

        except Exception as e:
            logger.error(f"Error extracting memory stats: {e}")
            return {"error": str(e)}

    def _collect_resource_stats(self) -> dict[str, Any]:
        """Collect current resource usage statistics"""
        try:
            process = psutil.Process()

            # Memory info
            memory_info = process.memory_info()
            memory_percent = process.memory_percent()

            # CPU info
            cpu_percent = process.cpu_percent()
            cpu_times = process.cpu_times()

            # I/O info
            try:
                io_counters = process.io_counters()
                io_stats = {
                    "read_count": io_counters.read_count,
                    "write_count": io_counters.write_count,
                    "read_bytes": io_counters.read_bytes,
                    "write_bytes": io_counters.write_bytes,
                }
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                io_stats = {}

            # Thread and connection info
            thread_count = process.num_threads()

            try:
                connection_count = len(process.connections())
                open_file_count = len(process.open_files())
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                connection_count = 0
                open_file_count = 0

            # Garbage collection info
            gc_stats = gc.get_stats()
            gc_info = {
                "collections": sum(stat["collections"] for stat in gc_stats),
                "collected": sum(stat["collected"] for stat in gc_stats),
                "uncollectable": sum(
                    stat["uncollectable"] for stat in gc_stats
                ),
            }

            return {
                "memory": {
                    "rss_mb": memory_info.rss / 1024 / 1024,
                    "vms_mb": memory_info.vms / 1024 / 1024,
                    "percent": memory_percent,
                },
                "cpu": {
                    "percent": cpu_percent,
                    "user_time": cpu_times.user,
                    "system_time": cpu_times.system,
                },
                "io": io_stats,
                "resources": {
                    "threads": thread_count,
                    "connections": connection_count,
                    "open_files": open_file_count,
                },
                "gc": gc_info,
                "timestamp": time.time(),
            }

        except Exception as e:
            logger.error(f"Error collecting resource stats: {e}")
            return {"error": str(e)}

    async def _cleanup_session(self, session_id: str):
        """Cleanup a specific profiling session"""
        if session_id not in self.active_sessions:
            return

        session = self.active_sessions[session_id]
        cleanup_performed = False

        try:
            # Stop memory profiling if still active
            if session.memory_profiler_active:
                try:
                    tracemalloc.stop()
                    session.memory_profiler_active = False
                    cleanup_performed = True
                except Exception as e:
                    logger.warning(f"Error stopping memory profiler: {e}")

            # Clean up CPU profiler
            if session.cpu_profiler:
                try:
                    session.cpu_profiler.disable()
                    session.cpu_profiler = None
                    cleanup_performed = True
                except Exception as e:
                    logger.warning(f"Error cleaning up CPU profiler: {e}")

            # Close open file handles
            handles_closed = 0
            for handle in session.open_handles[:]:
                try:
                    if hasattr(handle, "close"):
                        handle.close()
                    session.open_handles.remove(handle)
                    handles_closed += 1
                except Exception as e:
                    logger.warning(f"Error closing handle: {e}")

            self.cleanup_stats["handles_closed"] += handles_closed

            # Remove temporary files
            files_removed = 0
            for temp_file in session.temp_files[:]:
                try:
                    if os.path.exists(temp_file):
                        os.remove(temp_file)
                        files_removed += 1
                    session.temp_files.remove(temp_file)
                except Exception as e:
                    logger.warning(
                        f"Error removing temp file {temp_file}: {e}"
                    )

            self.cleanup_stats["temp_files_removed"] += files_removed

            # Clear resource trackers
            session.resource_trackers.clear()

            # Remove from active sessions
            del self.active_sessions[session_id]
            self.cleanup_stats["sessions_cleaned"] += 1

            if cleanup_performed:
                logger.debug(f"Cleaned up session: {session_id}")

        except Exception as e:
            logger.error(f"Error during session cleanup {session_id}: {e}")

    async def _background_cleanup(self):
        """Background task for automatic resource cleanup"""
        while self._profiler_running:
            try:
                await asyncio.sleep(self.auto_cleanup_interval)

                # Cleanup expired sessions
                await self._cleanup_expired_sessions()

                # Detect and cleanup resource leaks
                await self._detect_resource_leaks()

                # Perform garbage collection if needed
                await self._conditional_garbage_collection()

                # Cleanup old completed sessions
                self._cleanup_old_completed_sessions()

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Background cleanup error: {e}")

    async def _cleanup_expired_sessions(self):
        """Cleanup sessions that have been running too long"""
        current_time = time.time()
        max_session_duration = 3600  # 1 hour

        expired_sessions = []
        for session_id, session in self.active_sessions.items():
            if current_time - session.start_time > max_session_duration:
                expired_sessions.append(session_id)

        for session_id in expired_sessions:
            logger.warning(f"Cleaning up expired session: {session_id}")
            await self._cleanup_session(session_id)

    async def _detect_resource_leaks(self):
        """Detect potential resource leaks"""
        try:
            current_stats = self._collect_resource_stats()

            if self.resource_usage_baseline:
                # Compare with baseline
                memory_increase = (
                    current_stats["memory"]["rss_mb"]
                    - self.resource_usage_baseline["memory"]["rss_mb"]
                )

                file_increase = (
                    current_stats["resources"]["open_files"]
                    - self.resource_usage_baseline["resources"]["open_files"]
                )

                thread_increase = (
                    current_stats["resources"]["threads"]
                    - self.resource_usage_baseline["resources"]["threads"]
                )

                # Alert on significant increases
                alerts = []
                if memory_increase > 100:  # 100MB increase
                    alerts.append(
                        f"Memory increased by {memory_increase:.1f}MB"
                    )

                if file_increase > 50:  # 50 file handles
                    alerts.append(f"Open files increased by {file_increase}")

                if thread_increase > 20:  # 20 threads
                    alerts.append(
                        f"Thread count increased by {thread_increase}"
                    )

                if alerts:
                    leak_info = {
                        "timestamp": time.time(),
                        "alerts": alerts,
                        "current_stats": current_stats,
                        "baseline_stats": self.resource_usage_baseline,
                    }
                    self.leaked_resources.append(leak_info)
                    logger.warning(f"🚨 Resource leak detected: {alerts}")

        except Exception as e:
            logger.error(f"Error detecting resource leaks: {e}")

    async def _conditional_garbage_collection(self):
        """Perform garbage collection if memory usage is high"""
        try:
            process = psutil.Process()
            memory_percent = process.memory_percent()

            if memory_percent > 80:  # High memory usage threshold
                logger.info(
                    "🗑️ Performing garbage collection due to high memory usage"
                )

                # Force garbage collection
                collected_objects = gc.collect()

                # Calculate memory freed (approximate)
                new_memory_percent = process.memory_percent()
                memory_freed = max(0, memory_percent - new_memory_percent)

                self.cleanup_stats["memory_freed_mb"] += (
                    memory_freed
                    * process.memory_info().rss
                    / 1024
                    / 1024
                    / 100
                )

                logger.info(
                    f"Garbage collection freed {collected_objects} objects, {memory_freed:.1f}% memory"
                )

        except Exception as e:
            logger.error(f"Error during garbage collection: {e}")

    def _cleanup_old_completed_sessions(self):
        """Remove old completed session results"""
        max_completed_sessions = 100

        if len(self.completed_sessions) > max_completed_sessions:
            # Keep the most recent sessions
            sorted_sessions = sorted(
                self.completed_sessions.items(),
                key=lambda x: x[1].duration,
                reverse=True,
            )

            sessions_to_keep = dict(sorted_sessions[:max_completed_sessions])
            self.completed_sessions = sessions_to_keep

    async def _cleanup_all_sessions(self):
        """Force cleanup of all active sessions"""
        session_ids = list(self.active_sessions.keys())

        for session_id in session_ids:
            await self._cleanup_session(session_id)

        # Clear completed sessions
        self.completed_sessions.clear()

        logger.info("🧹 All profiling sessions cleaned up")

    async def _establish_baseline(self):
        """Establish baseline resource usage"""
        self.resource_usage_baseline = self._collect_resource_stats()
        logger.info("📊 Resource usage baseline established")

    def get_profiler_status(self) -> dict[str, Any]:
        """Get current profiler status and statistics"""
        return {
            "profiler_running": self._profiler_running,
            "active_sessions": len(self.active_sessions),
            "completed_sessions": len(self.completed_sessions),
            "cleanup_stats": self.cleanup_stats.copy(),
            "profiler_overhead_ms": self.profiler_overhead_ms,
            "resource_leaks_detected": len(self.leaked_resources),
            "baseline_established": self.resource_usage_baseline is not None,
            "current_resources": self._collect_resource_stats(),
        }

    def get_session_results(self, session_id: str) -> ProfileResult | None:
        """Get results for a specific session"""
        return self.completed_sessions.get(session_id)

    def get_all_results(self) -> dict[str, ProfileResult]:
        """Get all completed session results"""
        return self.completed_sessions.copy()

    def export_results(self, output_dir: str) -> list[str]:
        """Export profiling results to files"""
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)

        exported_files = []

        for session_id, result in self.completed_sessions.items():
            # Export to JSON
            import json

            result_file = output_path / f"{session_id}_profile.json"

            result_data = {
                "session_id": result.session_id,
                "duration": result.duration,
                "cpu_stats": result.cpu_stats,
                "memory_stats": result.memory_stats,
                "resource_stats": result.resource_stats,
            }

            try:
                with open(result_file, "w") as f:
                    json.dump(result_data, f, indent=2, default=str)
                exported_files.append(str(result_file))
            except Exception as e:
                logger.error(f"Error exporting {session_id}: {e}")

        return exported_files


# Global profiler instance
_profiler_instance: EnhancedPerformanceProfiler | None = None


async def get_profiler() -> EnhancedPerformanceProfiler:
    """Get the global profiler instance"""
    global _profiler_instance
    if _profiler_instance is None:
        _profiler_instance = EnhancedPerformanceProfiler()
        await _profiler_instance.start_profiler_service()
    return _profiler_instance


async def shutdown_profiler():
    """Shutdown the global profiler instance"""
    global _profiler_instance
    if _profiler_instance:
        await _profiler_instance.stop_profiler_service()
        _profiler_instance = None


# Convenience decorators and context managers
def profile_function(include_memory: bool = True, include_cpu: bool = True):
    """Decorator for profiling functions"""

    def decorator(func):
        if asyncio.iscoroutinefunction(func):

            async def async_wrapper(*args, **kwargs):
                profiler = await get_profiler()
                async with profiler.profile_operation(
                    f"function_{func.__name__}",
                    include_memory=include_memory,
                    include_cpu=include_cpu,
                ):
                    return await func(*args, **kwargs)

            return async_wrapper
        else:

            def sync_wrapper(*args, **kwargs):
                # For sync functions, use a simpler approach
                import asyncio

                try:
                    loop = asyncio.get_event_loop()
                    profiler = loop.run_until_complete(get_profiler())

                    async def run_with_profile():
                        async with profiler.profile_operation(
                            f"function_{func.__name__}",
                            include_memory=include_memory,
                            include_cpu=include_cpu,
                        ):
                            return func(*args, **kwargs)

                    return loop.run_until_complete(run_with_profile())
                except RuntimeError:
                    # No event loop, run without profiling
                    logger.warning(
                        f"No event loop available for profiling {func.__name__}"
                    )
                    return func(*args, **kwargs)

            return sync_wrapper

    return decorator
