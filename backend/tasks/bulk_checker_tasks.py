"""
Celery Tasks for Enhanced Bulk Checker Operations
Advanced background job processing with status tracking and progress updates
"""

import asyncio
import time
import traceback
from datetime import datetime, timedelta
from typing import Any

from celery import Task
from celery.result import AsyncResult

from app_websockets.connection_manager import MessageType, connection_manager
from core.celery_app import celery_app
from core.database import get_db_session
from core.logger import get_logger
from services.bulk_imap_checker import BulkIMAPChecker
from services.bulk_smtp_checker import BulkSMTPChecker
from services.error_classifier import ErrorClassifier

logger = get_logger(__name__)


class BulkCheckerTask(Task):
    """Base task class for bulk checker operations with progress tracking"""

    def __init__(self):
        self.progress = {
            "state": "PENDING",
            "current": 0,
            "total": 0,
            "status": "Initializing...",
            "start_time": None,
            "estimated_completion": None,
            "results": {"valid": 0, "invalid": 0, "errors": 0, "speed": 0.0},
            "error_details": [],
        }

    def update_progress(
        self,
        current: int,
        total: int,
        status: str,
        results: dict | None = None,
        session_id: str | None = None,
    ):
        """Update task progress and broadcast via WebSocket"""
        self.progress.update(
            {
                "state": "PROGRESS",
                "current": current,
                "total": total,
                "status": status,
                "percentage": (current / total * 100) if total > 0 else 0,
            }
        )

        if results:
            self.progress["results"].update(results)

        # Calculate speed and ETA
        if self.progress["start_time"]:
            elapsed = time.time() - self.progress["start_time"]
            if elapsed > 0:
                speed = current / elapsed
                self.progress["results"]["speed"] = speed

                if speed > 0:
                    remaining_time = (total - current) / speed
                    eta = datetime.now() + timedelta(seconds=remaining_time)
                    self.progress["estimated_completion"] = eta.isoformat()

        # Update Celery task state
        self.update_state(state="PROGRESS", meta=self.progress)

        # Broadcast via WebSocket if session_id provided
        if session_id:
            asyncio.create_task(self._broadcast_progress(session_id))

    async def _broadcast_progress(self, session_id: str):
        """Broadcast progress via WebSocket"""
        try:
            progress_data = {
                "type": "bulk_checker_progress",
                "session_id": session_id,
                "job_id": self.request.id,
                "task_type": getattr(self, "task_type", "unknown"),
                **self.progress,
            }

            await connection_manager.broadcast_to_all(
                {
                    "type": MessageType.MONITORING_UPDATE.value,
                    "data": progress_data,
                }
            )
        except Exception as e:
            logger.error(f"Failed to broadcast progress: {e}")


@celery_app.task(bind=True, base=BulkCheckerTask)
def bulk_smtp_check_task(
    self, session_id: str, combo_data: str, config: dict[str, Any]
) -> dict[str, Any]:
    """
    Celery task for bulk SMTP checking with advanced job management

    Args:
        session_id: Session identifier
        combo_data: Combo list data (email:password format)
        config: Configuration parameters (threads, timeout, proxy settings, etc.)

    Returns:
        Task result with statistics and details
    """
    self.task_type = "smtp_bulk_check"
    self.progress["start_time"] = time.time()

    try:
        # Initialize progress
        self.update_progress(
            0, 0, "Initializing SMTP bulk check...", session_id=session_id
        )

        # Run async bulk check in event loop
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        try:
            result = loop.run_until_complete(
                _run_smtp_bulk_check(self, session_id, combo_data, config)
            )

            # Final progress update
            self.update_progress(
                result["total_processed"],
                result["total_processed"],
                "SMTP bulk check completed successfully",
                results=result["summary"],
                session_id=session_id,
            )

            return {
                "state": "SUCCESS",
                "result": result,
                "progress": self.progress,
            }

        finally:
            loop.close()

    except Exception as exc:
        logger.error(f"SMTP bulk check task failed: {exc}")
        logger.error(traceback.format_exc())

        error_result = {
            "state": "FAILURE",
            "error": str(exc),
            "traceback": traceback.format_exc(),
            "progress": self.progress,
        }

        self.update_state(state="FAILURE", meta=error_result)

        # Broadcast error via WebSocket
        if session_id:
            asyncio.create_task(self._broadcast_progress(session_id))

        raise exc


@celery_app.task(bind=True, base=BulkCheckerTask)
def bulk_imap_check_task(
    self, session_id: str, combo_data: str, config: dict[str, Any]
) -> dict[str, Any]:
    """
    Celery task for bulk IMAP checking with advanced job management

    Args:
        session_id: Session identifier
        combo_data: Combo list data (email:password format)
        config: Configuration parameters (threads, timeout, proxy settings, etc.)

    Returns:
        Task result with statistics and details
    """
    self.task_type = "imap_bulk_check"
    self.progress["start_time"] = time.time()

    try:
        # Initialize progress
        self.update_progress(
            0, 0, "Initializing IMAP bulk check...", session_id=session_id
        )

        # Run async bulk check in event loop
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        try:
            result = loop.run_until_complete(
                _run_imap_bulk_check(self, session_id, combo_data, config)
            )

            # Final progress update
            self.update_progress(
                result["total_processed"],
                result["total_processed"],
                "IMAP bulk check completed successfully",
                results=result["summary"],
                session_id=session_id,
            )

            return {
                "state": "SUCCESS",
                "result": result,
                "progress": self.progress,
            }

        finally:
            loop.close()

    except Exception as exc:
        logger.error(f"IMAP bulk check task failed: {exc}")
        logger.error(traceback.format_exc())

        error_result = {
            "state": "FAILURE",
            "error": str(exc),
            "traceback": traceback.format_exc(),
            "progress": self.progress,
        }

        self.update_state(state="FAILURE", meta=error_result)

        # Broadcast error via WebSocket
        if session_id:
            asyncio.create_task(self._broadcast_progress(session_id))

        raise exc


async def _run_smtp_bulk_check(
    task: BulkCheckerTask,
    session_id: str,
    combo_data: str,
    config: dict[str, Any],
) -> dict[str, Any]:
    """Execute SMTP bulk check with progress tracking"""

    # Get database session
    async with get_db_session() as db:
        # Initialize checker
        checker = BulkSMTPChecker(db, session_id)

        # Apply configuration
        checker.max_threads = config.get("max_threads", 50)
        checker.timeout = config.get("timeout", 30)
        checker.proxy_timeout = config.get("proxy_timeout", 15)
        checker.enable_inbox_test = config.get("enable_inbox_test", True)

        # Parse combo list
        task.update_progress(
            0, 0, "Parsing combo list...", session_id=session_id
        )
        combos = await checker.parse_combo_list(combo_data)

        if not combos:
            raise ValueError("No valid combos found in provided data")

        total_combos = len(combos)
        task.update_progress(
            0,
            total_combos,
            f"Starting SMTP check for {total_combos} combos...",
            session_id=session_id,
        )

        # Load proxies if enabled
        if config.get("enable_proxy", True):
            proxy_count = await checker.load_proxies()
            task.update_progress(
                0,
                total_combos,
                f"Loaded {proxy_count} proxies. Starting checks...",
                session_id=session_id,
            )

        # Initialize error classifier
        error_classifier = ErrorClassifier()

        # Track progress and results
        processed = 0
        valid_count = 0
        invalid_count = 0
        error_count = 0
        error_details = []

        # Custom progress callback
        def progress_callback(current: int, results: list):
            nonlocal processed, valid_count, invalid_count, error_count

            processed = current
            valid_count = len(
                [r for r in results if r.status.value == "valid"]
            )
            invalid_count = len(
                [
                    r
                    for r in results
                    if r.status.value in ["invalid", "auth_failed"]
                ]
            )
            error_count = len(
                [
                    r
                    for r in results
                    if r.status.value
                    not in ["valid", "invalid", "auth_failed"]
                ]
            )

            # Classify recent errors
            recent_errors = [
                r for r in results[-10:] if r.error_message
            ]  # Last 10 errors
            for result in recent_errors:
                if result.error_message:
                    classified = error_classifier.classify_error(
                        result.error_message, "smtp"
                    )
                    error_details.append(
                        {
                            "email": result.combo.email,
                            "error": result.error_message,
                            "category": classified.category.value,
                            "severity": classified.severity.value,
                            "suggestion": classified.suggested_action,
                        }
                    )

            # Keep only recent errors
            error_details = error_details[-50:]  # Keep last 50 errors

            task.update_progress(
                current=current,
                total=total_combos,
                status=f"Checked {current}/{total_combos} - Valid: {valid_count}, Invalid: {invalid_count}, Errors: {error_count}",
                results={
                    "valid": valid_count,
                    "invalid": invalid_count,
                    "errors": error_count,
                    "speed": current
                    / (time.time() - task.progress["start_time"])
                    if task.progress["start_time"]
                    else 0,
                },
                session_id=session_id,
            )

        # Monkey patch progress callback
        original_update_progress = checker.update_progress
        checker.update_progress = lambda: progress_callback(
            checker.progress.checked, []
        )

        # Run bulk check
        results = await checker.run_bulk_check(combos)

        # Save results to database
        await checker.save_results_to_database(results)

        # Generate error statistics
        classified_errors = []
        for result in results:
            if result.error_message:
                classified = error_classifier.classify_error(
                    result.error_message, "smtp"
                )
                classified_errors.append(classified)

        error_stats = error_classifier.get_error_statistics(classified_errors)

        return {
            "total_processed": len(results),
            "summary": {
                "valid": len(
                    [r for r in results if r.status.value == "valid"]
                ),
                "invalid": len(
                    [
                        r
                        for r in results
                        if r.status.value in ["invalid", "auth_failed"]
                    ]
                ),
                "errors": len(
                    [
                        r
                        for r in results
                        if r.status.value
                        not in ["valid", "invalid", "auth_failed"]
                    ]
                ),
                "speed": len(results)
                / (time.time() - task.progress["start_time"]),
            },
            "error_statistics": error_stats,
            "sample_errors": error_details[-10:],  # Last 10 errors for review
            "execution_time": time.time() - task.progress["start_time"],
            "config_used": config,
        }


async def _run_imap_bulk_check(
    task: BulkCheckerTask,
    session_id: str,
    combo_data: str,
    config: dict[str, Any],
) -> dict[str, Any]:
    """Execute IMAP bulk check with progress tracking"""

    # Get database session
    async with get_db_session() as db:
        # Initialize checker
        checker = BulkIMAPChecker(db, session_id)

        # Apply configuration
        checker.max_threads = config.get("max_threads", 30)
        checker.timeout = config.get("timeout", 30)
        checker.proxy_timeout = config.get("proxy_timeout", 15)
        checker.check_inbox_count = config.get("check_inbox_count", True)

        # Parse combo list
        task.update_progress(
            0, 0, "Parsing IMAP combo list...", session_id=session_id
        )
        combos = await checker.parse_combo_list(combo_data)

        if not combos:
            raise ValueError("No valid combos found in provided data")

        total_combos = len(combos)
        task.update_progress(
            0,
            total_combos,
            f"Starting IMAP check for {total_combos} combos...",
            session_id=session_id,
        )

        # Load proxies if enabled
        if config.get("enable_proxy", True):
            proxy_count = await checker.load_proxies()
            task.update_progress(
                0,
                total_combos,
                f"Loaded {proxy_count} proxies. Starting IMAP checks...",
                session_id=session_id,
            )

        # Initialize error classifier
        error_classifier = ErrorClassifier()

        # Track progress and results
        processed = 0
        valid_count = 0
        invalid_count = 0
        error_count = 0
        error_details = []
        total_inbox_count = 0

        # Custom progress callback
        def progress_callback(current: int, results: list):
            nonlocal \
                processed, \
                valid_count, \
                invalid_count, \
                error_count, \
                total_inbox_count

            processed = current
            valid_count = len(
                [r for r in results if r.status.value == "valid"]
            )
            invalid_count = len(
                [
                    r
                    for r in results
                    if r.status.value in ["invalid", "auth_failed"]
                ]
            )
            error_count = len(
                [
                    r
                    for r in results
                    if r.status.value
                    not in ["valid", "invalid", "auth_failed"]
                ]
            )
            total_inbox_count = sum(
                r.inbox_count for r in results if r.status.value == "valid"
            )

            # Classify recent errors
            recent_errors = [
                r for r in results[-10:] if r.error_message
            ]  # Last 10 errors
            for result in recent_errors:
                if result.error_message:
                    classified = error_classifier.classify_error(
                        result.error_message, "imap"
                    )
                    error_details.append(
                        {
                            "email": result.combo.email,
                            "error": result.error_message,
                            "category": classified.category.value,
                            "severity": classified.severity.value,
                            "suggestion": classified.suggested_action,
                        }
                    )

            # Keep only recent errors
            error_details = error_details[-50:]  # Keep last 50 errors

            task.update_progress(
                current=current,
                total=total_combos,
                status=f"IMAP: {current}/{total_combos} - Valid: {valid_count}, Invalid: {invalid_count}, Errors: {error_count}",
                results={
                    "valid": valid_count,
                    "invalid": invalid_count,
                    "errors": error_count,
                    "total_inbox_emails": total_inbox_count,
                    "speed": current
                    / (time.time() - task.progress["start_time"])
                    if task.progress["start_time"]
                    else 0,
                },
                session_id=session_id,
            )

        # Monkey patch progress callback
        original_update_progress = checker.update_progress
        checker.update_progress = lambda: progress_callback(
            checker.progress.checked, []
        )

        # Run bulk check
        results = await checker.run_bulk_check(combos)

        # Save results to database
        await checker.save_results_to_database(results)

        # Generate error statistics
        classified_errors = []
        for result in results:
            if result.error_message:
                classified = error_classifier.classify_error(
                    result.error_message, "imap"
                )
                classified_errors.append(classified)

        error_stats = error_classifier.get_error_statistics(classified_errors)

        return {
            "total_processed": len(results),
            "summary": {
                "valid": len(
                    [r for r in results if r.status.value == "valid"]
                ),
                "invalid": len(
                    [
                        r
                        for r in results
                        if r.status.value in ["invalid", "auth_failed"]
                    ]
                ),
                "errors": len(
                    [
                        r
                        for r in results
                        if r.status.value
                        not in ["valid", "invalid", "auth_failed"]
                    ]
                ),
                "total_inbox_emails": sum(
                    r.inbox_count for r in results if r.status.value == "valid"
                ),
                "avg_inbox_count": sum(
                    r.inbox_count for r in results if r.status.value == "valid"
                )
                / max(
                    1, len([r for r in results if r.status.value == "valid"])
                ),
                "speed": len(results)
                / (time.time() - task.progress["start_time"]),
            },
            "error_statistics": error_stats,
            "sample_errors": error_details[-10:],  # Last 10 errors for review
            "execution_time": time.time() - task.progress["start_time"],
            "config_used": config,
        }


# Task management utilities
def get_task_status(task_id: str) -> dict[str, Any]:
    """Get status of a Celery task"""
    try:
        result = AsyncResult(task_id, app=celery_app)

        if result.state == "PENDING":
            response = {
                "state": result.state,
                "status": "Task is waiting to be processed",
            }
        elif result.state == "PROGRESS":
            response = {"state": result.state, **result.info}
        elif result.state == "SUCCESS":
            response = {"state": result.state, "result": result.result}
        else:  # FAILURE
            response = {
                "state": result.state,
                "error": str(result.info),
                "traceback": getattr(result.info, "traceback", None),
            }

        return response

    except Exception as e:
        logger.error(f"Error getting task status: {e}")
        return {"state": "ERROR", "error": str(e)}


def cancel_task(task_id: str) -> bool:
    """Cancel a running Celery task"""
    try:
        celery_app.control.revoke(task_id, terminate=True)
        return True
    except Exception as e:
        logger.error(f"Error canceling task {task_id}: {e}")
        return False


def get_active_tasks() -> list[dict[str, Any]]:
    """Get list of active tasks"""
    try:
        inspect = celery_app.control.inspect()
        active_tasks = inspect.active()

        if not active_tasks:
            return []

        all_tasks = []
        for worker, tasks in active_tasks.items():
            for task in tasks:
                all_tasks.append(
                    {
                        "id": task["id"],
                        "name": task["name"],
                        "worker": worker,
                        "args": task.get("args", []),
                        "kwargs": task.get("kwargs", {}),
                        "time_start": task.get("time_start"),
                    }
                )

        return all_tasks

    except Exception as e:
        logger.error(f"Error getting active tasks: {e}")
        return []
