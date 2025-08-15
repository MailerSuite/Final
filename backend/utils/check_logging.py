#!/usr/bin/env python3
"""
Logging utilities for SGPT backend
Provides logging functions for check results and operations
"""

import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Any

# Setup logger
logger = logging.getLogger("sgpt_utils_logging")


def setup_logging():
    """Setup logging configuration if not already configured"""
    if not logger.handlers:
        handler = logging.StreamHandler()
        formatter = logging.Formatter(
            "%(asctime)s | %(levelname)s | %(name)s | %(message)s"
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)
        logger.setLevel(logging.INFO)


def get_json_logger(name: str = "sgpt") -> logging.Logger:
    """Get a JSON-formatted logger"""
    json_logger = logging.getLogger(f"{name}_json")

    if not json_logger.handlers:
        # Create logs directory if it doesn't exist
        logs_dir = Path("logs")
        logs_dir.mkdir(exist_ok=True)

        # File handler for JSON logs
        file_handler = logging.FileHandler(logs_dir / f"{name}_json.log")

        # Custom JSON formatter
        class JSONFormatter(logging.Formatter):
            def format(self, record):
                log_entry = {
                    "timestamp": datetime.utcnow().isoformat(),
                    "level": record.levelname,
                    "logger": record.name,
                    "message": record.getMessage(),
                    "module": record.module,
                    "function": record.funcName,
                    "line": record.lineno,
                }
                return json.dumps(log_entry)

        file_handler.setFormatter(JSONFormatter())
        json_logger.addHandler(file_handler)
        json_logger.setLevel(logging.INFO)

    return json_logger


def log_check_result(
    check_type: str,
    target: str,
    result: bool,
    details: dict[str, Any] | None = None,
    error: str | None = None,
) -> None:
    """Log the result of a check operation (async compatible)"""
    setup_logging()

    log_data = {
        "check_type": check_type,
        "target": target,
        "result": "SUCCESS" if result else "FAILURE",
        "timestamp": datetime.utcnow().isoformat(),
        "details": details or {},
        "error": error,
    }

    if result:
        logger.info(f"✅ {check_type} check for {target}: SUCCESS")
    else:
        logger.error(f"❌ {check_type} check for {target}: FAILURE - {error}")

    # Also log to JSON logger
    json_logger = get_json_logger()
    json_logger.info(json.dumps(log_data))


def log_check_result_sync(
    check_type: str,
    target: str,
    result: bool,
    details: dict[str, Any] | None = None,
    error: str | None = None,
) -> None:
    """Log the result of a check operation (sync version)"""
    # This is the same as async version since logging is sync anyway
    log_check_result(check_type, target, result, details, error)


def log_operation(
    operation: str,
    status: str,
    message: str,
    details: dict[str, Any] | None = None,
) -> None:
    """Log a general operation result"""
    setup_logging()

    log_data = {
        "operation": operation,
        "status": status,
        "message": message,
        "timestamp": datetime.utcnow().isoformat(),
        "details": details or {},
    }

    if status.upper() in ["SUCCESS", "OK"]:
        logger.info(f"✅ {operation}: {message}")
    elif status.upper() in ["WARNING", "WARN"]:
        logger.warning(f"⚠️ {operation}: {message}")
    else:
        logger.error(f"❌ {operation}: {message}")

    # Also log to JSON logger
    json_logger = get_json_logger()
    json_logger.info(json.dumps(log_data))


def log_performance(
    operation: str, duration: float, details: dict[str, Any] | None = None
) -> None:
    """Log performance metrics"""
    setup_logging()

    log_data = {
        "operation": operation,
        "duration_seconds": duration,
        "timestamp": datetime.utcnow().isoformat(),
        "details": details or {},
    }

    logger.info(f"⏱️ {operation} completed in {duration:.2f}s")

    # Also log to JSON logger
    json_logger = get_json_logger("performance")
    json_logger.info(json.dumps(log_data))


# Initialize logging on module import
setup_logging()
