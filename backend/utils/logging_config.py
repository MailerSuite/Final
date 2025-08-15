import logging
import os


def setup_logging(name: str | None = None) -> logging.Logger:
    """
    Logging setup with safe error handling for Docker.
    If log file creation fails, use console logging.
    """
    logger = logging.getLogger(name)
    logger.setLevel(logging.INFO)

    # Avoid handler duplication
    if logger.handlers:
        return logger

    formatter = logging.Formatter(
        "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )

    # Try to create file handler
    try:
        # Use environment variable for log path or fallback
        log_dir = os.environ.get("LOG_DIR", "/tmp/logs")
        os.makedirs(log_dir, mode=0o777, exist_ok=True)
        log_file = os.path.join(log_dir, "app.log")

        # Check write permissions
        if os.access(os.path.dirname(log_file), os.W_OK):
            file_handler = logging.FileHandler(log_file)
            file_handler.setFormatter(formatter)
            logger.addHandler(file_handler)
        else:
            raise PermissionError("No write permission to log directory")

    except (PermissionError, OSError) as e:
        # If file logging is unavailable, use console
        console_handler = logging.StreamHandler()
        console_handler.setFormatter(formatter)
        logger.addHandler(console_handler)
        logger.warning(
            f"File logging unavailable ({e}), using console logging"
        )

    # Add console handler for important messages
    if not any(isinstance(h, logging.StreamHandler) for h in logger.handlers):
        console_handler = logging.StreamHandler()
        console_handler.setLevel(logging.WARNING)
        console_handler.setFormatter(formatter)
        logger.addHandler(console_handler)

    return logger
