"""
Unified Logging System for SGPT
Replaces fragmented logging with a centralized, structured approach
"""

import json
import logging
import logging.config
import sys
import time
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Optional, Union

from config.settings import settings


class SGPTFormatter(logging.Formatter):
    """Custom formatter for SGPT logs with structured output"""
    
    def format(self, record: logging.LogRecord) -> str:
        # Create base log entry
        log_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }
        
        # Add exception info if present
        if record.exc_info:
            log_entry["exception"] = self.formatException(record.exc_info)
        
        # Add extra fields if present
        extra_fields = {
            k: v for k, v in record.__dict__.items()
            if k not in {
                'name', 'msg', 'args', 'levelname', 'levelno', 'pathname',
                'filename', 'module', 'exc_info', 'exc_text', 'stack_info',
                'lineno', 'funcName', 'created', 'msecs', 'relativeCreated',
                'thread', 'threadName', 'processName', 'process', 'message'
            }
        }
        
        if extra_fields:
            log_entry["extra"] = extra_fields
        
        return json.dumps(log_entry, default=str, ensure_ascii=False)


class SGPTLogger:
    """Centralized logger for SGPT application"""
    
    def __init__(self, name: str = "sgpt"):
        self.name = name
        self._logger = logging.getLogger(name)
        self._setup_logging()
    
    def _setup_logging(self):
        """Set up logging configuration"""
        # Create logs directory
        log_dir = Path("logs")
        log_dir.mkdir(exist_ok=True)
        
        # Configuration for different environments
        # Use DEBUG level for development environment
        if settings.ENVIRONMENT == "development" or settings.DEBUG:
            level = logging.DEBUG
            console_level = logging.DEBUG
        else:
            level = logging.INFO
            console_level = logging.WARNING
        
        # Configure formatters
        detailed_formatter = SGPTFormatter()
        simple_formatter = logging.Formatter(
            "%(asctime)s | %(levelname)s | %(name)s | %(message)s"
        )
        
        # Configure handlers
        handlers = []
        
        # Console handler
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(console_level)
        console_handler.setFormatter(simple_formatter)
        handlers.append(console_handler)
        
        # File handler for all logs
        file_handler = logging.FileHandler(log_dir / "sgpt.log")
        file_handler.setLevel(level)
        file_handler.setFormatter(detailed_formatter)
        handlers.append(file_handler)
        
        # Backend-specific log file
        backend_handler = logging.FileHandler(log_dir / "backend.log")
        backend_handler.setLevel(level)
        backend_handler.setFormatter(simple_formatter)
        handlers.append(backend_handler)
        
        # Error file handler
        error_handler = logging.FileHandler(log_dir / "sgpt_errors.log")
        error_handler.setLevel(logging.ERROR)
        error_handler.setFormatter(detailed_formatter)
        handlers.append(error_handler)
        
        # Startup/operations file handler
        startup_handler = logging.FileHandler(log_dir / "sgpt_startup.log")
        startup_handler.setLevel(logging.INFO)
        startup_handler.setFormatter(detailed_formatter)
        startup_handler.addFilter(lambda record: "startup" in record.name or "operation" in record.name)
        handlers.append(startup_handler)
        
        # Configure logger
        self._logger.setLevel(level)
        self._logger.handlers.clear()
        for handler in handlers:
            self._logger.addHandler(handler)
    
    def debug(self, message: str, **kwargs):
        """Log debug message"""
        self._logger.debug(message, extra=kwargs)
    
    def info(self, message: str, **kwargs):
        """Log info message"""
        self._logger.info(message, extra=kwargs)
    
    def warning(self, message: str, **kwargs):
        """Log warning message"""
        self._logger.warning(message, extra=kwargs)
    
    def error(self, message: str, **kwargs):
        """Log error message"""
        self._logger.error(message, extra=kwargs)
    
    def critical(self, message: str, **kwargs):
        """Log critical message"""
        self._logger.critical(message, extra=kwargs)
    
    def exception(self, message: str, **kwargs):
        """Log exception with traceback"""
        self._logger.exception(message, extra=kwargs)
    
    # Specialized logging methods
    def startup_begin(self, operation: str, **kwargs):
        """Log startup operation beginning"""
        self.info(f"🚀 STARTUP BEGIN: {operation}", operation=operation, phase="startup", **kwargs)
    
    def startup_success(self, operation: str, duration: float = None, **kwargs):
        """Log startup operation success"""
        msg = f"✅ STARTUP SUCCESS: {operation}"
        if duration:
            msg += f" (took {duration:.2f}s)"
        self.info(msg, operation=operation, phase="startup", duration=duration, status="success", **kwargs)
    
    def startup_failure(self, operation: str, error: str, duration: float = None, **kwargs):
        """Log startup operation failure"""
        msg = f"❌ STARTUP FAILURE: {operation}"
        if duration:
            msg += f" (failed after {duration:.2f}s)"
        self.error(msg, operation=operation, phase="startup", error=error, duration=duration, status="failure", **kwargs)
    
    def api_request(self, method: str, path: str, status_code: int, duration: float = None, **kwargs):
        """Log API request"""
        msg = f"{method} {path} -> {status_code}"
        if duration:
            msg += f" ({duration:.3f}s)"
        
        if status_code >= 500:
            self.error(msg, method=method, path=path, status_code=status_code, duration=duration, **kwargs)
        elif status_code >= 400:
            self.warning(msg, method=method, path=path, status_code=status_code, duration=duration, **kwargs)
        else:
            self.info(msg, method=method, path=path, status_code=status_code, duration=duration, **kwargs)
    
    def database_operation(self, operation: str, table: str = None, duration: float = None, **kwargs):
        """Log database operation"""
        msg = f"DB: {operation}"
        if table:
            msg += f" on {table}"
        if duration:
            msg += f" ({duration:.3f}s)"
        
        self.debug(msg, operation=operation, table=table, duration=duration, category="database", **kwargs)
    
    def security_event(self, event_type: str, severity: str, details: Dict[str, Any], **kwargs):
        """Log security event"""
        msg = f"🔒 SECURITY: {event_type} [{severity.upper()}]"
        self.warning(msg, event_type=event_type, severity=severity, details=details, category="security", **kwargs)
    
    def performance_metric(self, metric_name: str, value: Union[int, float], unit: str = "", **kwargs):
        """Log performance metric"""
        msg = f"📊 METRIC: {metric_name} = {value}{unit}"
        self.info(msg, metric_name=metric_name, value=value, unit=unit, category="performance", **kwargs)


class LogContext:
    """Context manager for adding context to all logs within a block"""
    
    def __init__(self, logger: SGPTLogger, **context):
        self.logger = logger
        self.context = context
        self.old_logger = None
    
    def __enter__(self):
        # Create a new logger with context
        class ContextLogger:
            def __init__(self, base_logger, context):
                self._base = base_logger
                self._context = context
            
            def __getattr__(self, name):
                attr = getattr(self._base, name)
                if callable(attr) and name in ['debug', 'info', 'warning', 'error', 'critical', 'exception']:
                    def wrapper(*args, **kwargs):
                        kwargs.update(self._context)
                        return attr(*args, **kwargs)
                    return wrapper
                return attr
        
        return ContextLogger(self.logger, self.context)
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        pass


# Global logger instance
_global_logger = None


def get_logger(name: str = "sgpt") -> SGPTLogger:
    """Get or create a logger instance"""
    global _global_logger
    
    if _global_logger is None:
        _global_logger = SGPTLogger(name)
    
    return _global_logger


def setup_logging():
    """Set up logging for the entire application"""
    # Disable other loggers to reduce noise
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
    
    # Get the main logger
    logger = get_logger()
    logger.info("Unified logging system initialized")
    
    return logger


# Convenience functions for common logging patterns
def log_startup_phase(phase_name: str):
    """Decorator for startup phases"""
    def decorator(func):
        def wrapper(*args, **kwargs):
            logger = get_logger()
            start_time = time.time()
            
            logger.startup_begin(phase_name)
            try:
                result = func(*args, **kwargs)
                duration = time.time() - start_time
                logger.startup_success(phase_name, duration)
                return result
            except Exception as e:
                duration = time.time() - start_time
                logger.startup_failure(phase_name, str(e), duration)
                raise
        
        return wrapper
    return decorator


def log_api_call(func):
    """Decorator for API endpoints"""
    def wrapper(*args, **kwargs):
        logger = get_logger()
        start_time = time.time()
        
        # Extract request info if available
        request = None
        for arg in args:
            if hasattr(arg, 'method') and hasattr(arg, 'url'):
                request = arg
                break
        
        try:
            result = func(*args, **kwargs)
            duration = time.time() - start_time
            
            if request:
                logger.api_request(
                    request.method,
                    str(request.url.path),
                    200,  # Assume success if no exception
                    duration
                )
            
            return result
        except Exception as e:
            duration = time.time() - start_time
            
            if request:
                status_code = getattr(e, 'status_code', 500)
                logger.api_request(
                    request.method,
                    str(request.url.path),
                    status_code,
                    duration,
                    error=str(e)
                )
            
            raise
    
    return wrapper


# Migration helpers for existing logging
# NOTE: Legacy logger adapter has been removed - use get_logger() directly
# For migration from old logging patterns, use the new SGPTLogger directly

def migrate_legacy_logging():
    """Helper function to migrate from old logging patterns"""
    logger = get_logger()
    logger.info("Legacy logging migration completed - using unified logging system")
    return logger 