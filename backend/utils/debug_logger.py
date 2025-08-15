import json
import logging
import os
import platform
import sys
import time
import traceback
from datetime import datetime
from pathlib import Path
from typing import Any

import psutil


class DebugLogger:
    """Comprehensive debug logging system for startup, crashes, and debugging"""

    def __init__(self, log_dir: str = "logs", app_name: str = "sgpt_backend"):
        self.log_dir = Path(log_dir)
        self.app_name = app_name
        self.log_dir.mkdir(exist_ok=True)

        # Create different log files for different purposes
        self.startup_logger = self._setup_logger(
            "startup", "startup_debug.log"
        )
        self.crash_logger = self._setup_logger("crash", "crash_debug.log")
        self.debug_logger = self._setup_logger("debug", "debug.log")
        self.system_logger = self._setup_logger("system", "system_debug.log")

        # Capture system info
        self._log_system_info()

    def _setup_logger(self, name: str, filename: str) -> logging.Logger:
        """Setup individual logger with file and console handlers"""
        logger = logging.getLogger(f"{self.app_name}.{name}")
        logger.setLevel(logging.DEBUG)

        # Clear existing handlers
        logger.handlers.clear()

        # File handler with detailed formatting
        file_handler = logging.FileHandler(self.log_dir / filename, mode="a")
        file_handler.setLevel(logging.DEBUG)

        # Console handler for immediate feedback
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(logging.INFO)

        # Detailed formatter for files
        file_formatter = logging.Formatter(
            "%(asctime)s | %(levelname)s | %(name)s | %(funcName)s:%(lineno)d | %(message)s"
        )

        # Simple formatter for console
        console_formatter = logging.Formatter(
            "%(levelname)s | %(name)s | %(message)s"
        )

        file_handler.setFormatter(file_formatter)
        console_handler.setFormatter(console_formatter)

        logger.addHandler(file_handler)
        logger.addHandler(console_handler)

        return logger

    def _log_system_info(self):
        """Log comprehensive system information"""
        system_info = {
            "timestamp": datetime.now().isoformat(),
            "platform": platform.platform(),
            "python_version": sys.version,
            "python_executable": sys.executable,
            "cpu_count": psutil.cpu_count(),
            "memory_total": psutil.virtual_memory().total,
            "memory_available": psutil.virtual_memory().available,
            "disk_usage": psutil.disk_usage("/")._asdict(),
            "environment_variables": dict(os.environ),
            "current_working_directory": os.getcwd(),
            "process_id": os.getpid(),
            "user": os.getenv("USER", "unknown"),
        }

        self.system_logger.info("=== SYSTEM INFORMATION ===")
        self.system_logger.info(
            f"System Info: {json.dumps(system_info, indent=2, default=str)}"
        )

    def log_startup_begin(self, component: str, **kwargs):
        """Log the beginning of a startup process"""
        self.startup_logger.info(f"🚀 STARTUP BEGIN: {component}")
        if kwargs:
            self.startup_logger.info(f"Startup params: {kwargs}")

    def log_startup_success(self, component: str, duration: float = None):
        """Log successful startup of a component"""
        duration_msg = f" (took {duration:.2f}s)" if duration else ""
        self.startup_logger.info(
            f"✅ STARTUP SUCCESS: {component}{duration_msg}"
        )

    def log_startup_failure(
        self, component: str, error: Exception, duration: float = None
    ):
        """Log startup failure with full error details"""
        duration_msg = f" (failed after {duration:.2f}s)" if duration else ""
        self.startup_logger.error(
            f"❌ STARTUP FAILURE: {component}{duration_msg}"
        )
        self.startup_logger.error(f"Error type: {type(error).__name__}")
        self.startup_logger.error(f"Error message: {str(error)}")
        self.startup_logger.error(f"Full traceback:\n{traceback.format_exc()}")

    def log_crash(
        self, component: str, error: Exception, context: dict[str, Any] = None
    ):
        """Log a crash with full context"""
        self.crash_logger.error(f"💥 CRASH DETECTED: {component}")
        self.crash_logger.error(f"Error type: {type(error).__name__}")
        self.crash_logger.error(f"Error message: {str(error)}")
        self.crash_logger.error(f"Full traceback:\n{traceback.format_exc()}")

        if context:
            self.crash_logger.error(
                f"Crash context: {json.dumps(context, indent=2, default=str)}"
            )

    def log_debug(self, message: str, data: Any = None):
        """Log debug information"""
        if data:
            self.debug_logger.debug(f"{message}: {data}")
        else:
            self.debug_logger.debug(message)

    def log_import_attempt(
        self, module: str, success: bool, error: Exception = None
    ):
        """Log import attempts for debugging import issues"""
        if success:
            self.debug_logger.info(f"📦 IMPORT SUCCESS: {module}")
        else:
            self.debug_logger.error(f"📦 IMPORT FAILURE: {module}")
            if error:
                self.debug_logger.error(f"Import error: {str(error)}")
                self.debug_logger.error(
                    f"Import traceback:\n{traceback.format_exc()}"
                )

    def log_database_operation(
        self,
        operation: str,
        success: bool,
        error: Exception = None,
        duration: float = None,
    ):
        """Log database operations"""
        duration_msg = f" (took {duration:.2f}s)" if duration else ""
        if success:
            self.debug_logger.info(f"🗄️ DB SUCCESS: {operation}{duration_msg}")
        else:
            self.debug_logger.error(f"🗄️ DB FAILURE: {operation}{duration_msg}")
            if error:
                self.debug_logger.error(f"Database error: {str(error)}")

    def log_service_status(
        self, service: str, status: str, details: str = None
    ):
        """Log service status changes"""
        status_icons = {
            "ready": "✅",
            "starting": "🔄",
            "failed": "❌",
            "stopped": "⏹️",
            "warning": "⚠️",
        }
        icon = status_icons.get(status, "ℹ️")
        self.debug_logger.info(f"{icon} SERVICE STATUS: {service} - {status}")
        if details:
            self.debug_logger.info(f"Service details: {details}")

    def capture_exception(self, func):
        """Decorator to capture exceptions in functions"""

        def wrapper(*args, **kwargs):
            start_time = time.time()
            try:
                result = func(*args, **kwargs)
                duration = time.time() - start_time
                self.log_debug(
                    f"Function {func.__name__} completed successfully",
                    {"duration": duration},
                )
                return result
            except Exception as e:
                duration = time.time() - start_time
                self.log_crash(
                    func.__name__,
                    e,
                    {
                        "args": str(args),
                        "kwargs": str(kwargs),
                        "duration": duration,
                    },
                )
                raise

        return wrapper


# Global debug logger instance
debug_logger = DebugLogger()


# Convenience functions for easy access
def log_startup(component: str, **kwargs):
    """Log startup attempt"""
    debug_logger.log_startup_begin(component, **kwargs)


def log_success(component: str, duration: float = None):
    """Log successful operation"""
    debug_logger.log_startup_success(component, duration)


def log_failure(component: str, error: Exception, duration: float = None):
    """Log failed operation"""
    debug_logger.log_startup_failure(component, error, duration)


def log_crash(
    component: str, error: Exception, context: dict[str, Any] = None
):
    """Log crash"""
    debug_logger.log_crash(component, error, context)


def log_debug(message: str, data: Any = None):
    """Log debug info"""
    debug_logger.log_debug(message, data)


def log_import(module: str, success: bool, error: Exception = None):
    """Log import attempt"""
    debug_logger.log_import_attempt(module, success, error)


def log_db(
    operation: str,
    success: bool,
    error: Exception = None,
    duration: float = None,
):
    """Log database operation"""
    debug_logger.log_database_operation(operation, success, error, duration)


def log_service(service: str, status: str, details: str = None):
    """Log service status"""
    debug_logger.log_service_status(service, status, details)
