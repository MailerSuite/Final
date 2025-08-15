import logging
import os
import sys
from logging.handlers import RotatingFileHandler
from pathlib import Path

from config.settings import get_settings

settings = get_settings()


def setup_logging():
    """Enhanced setup application logging with fallback to console-only if file logging fails"""
    handlers = [logging.StreamHandler(sys.stdout)]

    # Try to setup file logging with proper error handling
    try:
        # Use LOG_DIR env var or fallback to /tmp for Docker
        log_dir_path = os.environ.get("LOG_DIR", "/tmp/logs")
        log_dir = Path(log_dir_path)

        # Create directory with proper permissions
        log_dir.mkdir(mode=0o777, parents=True, exist_ok=True)

        # Test write permissions
        log_file_path = log_dir / "app.log"

        # Try to create/open the log file
        with open(log_file_path, "a") as test_file:
            test_file.write("")  # Test write access

        # If successful, add file handler with enhanced configuration
        file_handler = RotatingFileHandler(
            log_file_path, maxBytes=10 * 1024 * 1024, backupCount=5
        )
        file_handler.setFormatter(
            logging.Formatter(
                "%(asctime)s | %(levelname)s | %(name)s | %(funcName)s:%(lineno)d | %(message)s"
            )
        )
        handlers.append(file_handler)

        # Add error log file handler
        error_log_path = log_dir / "error.log"
        error_handler = RotatingFileHandler(
            error_log_path, maxBytes=5 * 1024 * 1024, backupCount=3
        )
        error_handler.setLevel(logging.ERROR)
        error_handler.setFormatter(
            logging.Formatter(
                "%(asctime)s | %(levelname)s | %(name)s | %(funcName)s:%(lineno)d | %(message)s"
            )
        )
        handlers.append(error_handler)

    except (PermissionError, OSError) as e:
        # Fall back to console-only logging
        warning_msg = f"Warning: File logging unavailable ({e}), using console logging only"
        sys.stderr.write(warning_msg + "\n")

    # Enhanced logging format
    logging.basicConfig(
        level=logging.INFO if not settings.DEBUG else logging.DEBUG,
        format="%(asctime)s | %(levelname)s | %(name)s | %(funcName)s:%(lineno)d | %(message)s",
        handlers=handlers,
        force=True,  # Override any existing configuration
    )

    # Configure specific loggers
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
    logging.getLogger("uvicorn.access").setLevel(logging.INFO)
    logging.getLogger("fastapi").setLevel(logging.INFO)


def get_logger(name: str) -> logging.Logger:
    """Get logger instance with safe initialization"""
    # Check if logging is already configured
    root_logger = logging.getLogger()
    if not root_logger.handlers:
        try:
            setup_logging()
        except Exception as e:
            # Ultimate fallback - basic console logging
            logging.basicConfig(
                level=logging.INFO,
                format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
                handlers=[logging.StreamHandler(sys.stdout)],
                force=True,
            )
            warning_msg = f"Warning: Logging setup failed ({e}), using basic console logging"
            sys.stderr.write(warning_msg + "\n")

    return logging.getLogger(name)
