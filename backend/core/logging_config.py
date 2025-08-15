"""Enhanced logging configuration"""

import logging
import logging.handlers
import os

from pythonjsonlogger import jsonlogger


def setup_logging(app_name: str = "mailersuite", log_level: str = None):
    """Setup advanced logging"""

    # Determine logging level
    if log_level is None:
        log_level = os.getenv(
            "LOG_LEVEL",
            "INFO" if os.getenv("ENV") == "production" else "DEBUG",
        )

    # Create logs directory
    log_dir = "logs"
    os.makedirs(log_dir, exist_ok=True)

    # Setup JSON logs formatter
    json_formatter = jsonlogger.JsonFormatter(
        "%(timestamp)s %(level)s %(name)s %(message)s", timestamp=True
    )

    # Setup console formatter
    console_formatter = logging.Formatter(
        "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )

    # Create handlers
    # 1. Rotating file handler for all logs
    file_handler = logging.handlers.RotatingFileHandler(
        filename=os.path.join(log_dir, f"{app_name}.log"),
        maxBytes=10 * 1024 * 1024,  # 10MB
        backupCount=5,
        encoding="utf-8",
    )
    file_handler.setFormatter(json_formatter)
    file_handler.setLevel(logging.DEBUG)

    # 2. Rotating file handler for errors
    error_handler = logging.handlers.RotatingFileHandler(
        filename=os.path.join(log_dir, f"{app_name}_errors.log"),
        maxBytes=10 * 1024 * 1024,  # 10MB
        backupCount=5,
        encoding="utf-8",
    )
    error_handler.setFormatter(json_formatter)
    error_handler.setLevel(logging.ERROR)

    # 3. Console handler
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(console_formatter)
    console_handler.setLevel(getattr(logging, log_level))

    # 4. Time-based rotating handler (new log each day)
    time_handler = logging.handlers.TimedRotatingFileHandler(
        filename=os.path.join(log_dir, f"{app_name}_daily.log"),
        when="midnight",
        interval=1,
        backupCount=30,
        encoding="utf-8",
    )
    time_handler.setFormatter(json_formatter)
    time_handler.setLevel(logging.INFO)

    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.DEBUG)

    # Clear existing handlers
    root_logger.handlers = []

    # Add handlers
    root_logger.addHandler(file_handler)
    root_logger.addHandler(error_handler)
    root_logger.addHandler(console_handler)
    root_logger.addHandler(time_handler)

    # Configure library loggers
    logging.getLogger("uvicorn").setLevel(logging.INFO)
    logging.getLogger("fastapi").setLevel(logging.INFO)
    logging.getLogger("sqlalchemy").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)

    return root_logger


def get_logger(name: str) -> logging.Logger:
    """Get configured logger"""
    return logging.getLogger(name)
