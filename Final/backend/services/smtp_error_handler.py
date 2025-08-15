"""
SMTP Error Handler with Provider-Specific Strategies
Implements intelligent error classification and backoff strategies per provider
"""

import asyncio
import re
from datetime import datetime, timedelta
from enum import Enum
from typing import Any, Optional, Tuple

from core.logger import get_logger
from models.smtp_providers import SMTPProvider

logger = get_logger(__name__)


class ErrorType(str, Enum):
    """Types of SMTP errors"""
    AUTHENTICATION = "authentication"
    RATE_LIMIT = "rate_limit"
    QUOTA_EXCEEDED = "quota_exceeded"
    REPUTATION = "reputation"
    BLACKLIST = "blacklist"
    INVALID_RECIPIENT = "invalid_recipient"
    NETWORK = "network"
    TIMEOUT = "timeout"
    SERVER_ERROR = "server_error"
    CONFIGURATION = "configuration"
    TEMPORARY = "temporary"
    PERMANENT = "permanent"
    UNKNOWN = "unknown"


class BackoffStrategy(str, Enum):
    """Backoff strategies for error handling"""
    EXPONENTIAL = "exponential"
    LINEAR = "linear"
    CONSTANT = "constant"
    ADAPTIVE = "adaptive"


class SMTPErrorHandler:
    """Handles SMTP errors with provider-specific intelligence"""
    
    def __init__(self):
        self.error_patterns = self._initialize_error_patterns()
        self.provider_strategies = self._initialize_provider_strategies()
        self.error_history = {}  # Track errors per provider/account
        
    def _initialize_error_patterns(self) -> dict[str, list[tuple[re.Pattern, ErrorType]]]:
        """Initialize regex patterns for error classification"""
        return {
            "authentication": [
                (re.compile(r"535[\s-]5\.7\.8", re.I), ErrorType.AUTHENTICATION),
                (re.compile(r"invalid.{0,20}credentials", re.I), ErrorType.AUTHENTICATION),
                (re.compile(r"authentication.{0,20}failed", re.I), ErrorType.AUTHENTICATION),
                (re.compile(r"bad.{0,20}username.{0,20}password", re.I), ErrorType.AUTHENTICATION),
            ],
            "rate_limit": [
                (re.compile(r"rate.{0,20}limit", re.I), ErrorType.RATE_LIMIT),
                (re.compile(r"too.{0,20}many.{0,20}requests", re.I), ErrorType.RATE_LIMIT),
                (re.compile(r"421.{0,20}4\.7\.0", re.I), ErrorType.RATE_LIMIT),
                (re.compile(r"hourly.{0,20}quota", re.I), ErrorType.RATE_LIMIT),
                (re.compile(r"daily.{0,20}sending.{0,20}quota", re.I), ErrorType.QUOTA_EXCEEDED),
            ],
            "reputation": [
                (re.compile(r"554.{0,20}5\.7\.1", re.I), ErrorType.REPUTATION),
                (re.compile(r"poor.{0,20}reputation", re.I), ErrorType.REPUTATION),
                (re.compile(r"spam.{0,20}detected", re.I), ErrorType.REPUTATION),
                (re.compile(r"blocked.{0,20}due.{0,20}to.{0,20}spam", re.I), ErrorType.REPUTATION),
            ],
            "blacklist": [
                (re.compile(r"blacklisted", re.I), ErrorType.BLACKLIST),
                (re.compile(r"blocked.{0,20}by.{0,20}spamhaus", re.I), ErrorType.BLACKLIST),
                (re.compile(r"listed.{0,20}in.{0,20}rbl", re.I), ErrorType.BLACKLIST),
            ],
            "recipient": [
                (re.compile(r"550.{0,20}5\.1\.1", re.I), ErrorType.INVALID_RECIPIENT),
                (re.compile(r"user.{0,20}unknown", re.I), ErrorType.INVALID_RECIPIENT),
                (re.compile(r"mailbox.{0,20}not.{0,20}found", re.I), ErrorType.INVALID_RECIPIENT),
                (re.compile(r"recipient.{0,20}address.{0,20}rejected", re.I), ErrorType.INVALID_RECIPIENT),
            ],
            "network": [
                (re.compile(r"connection.{0,20}refused", re.I), ErrorType.NETWORK),
                (re.compile(r"network.{0,20}unreachable", re.I), ErrorType.NETWORK),
                (re.compile(r"socket.{0,20}error", re.I), ErrorType.NETWORK),
            ],
            "temporary": [
                (re.compile(r"451", re.I), ErrorType.TEMPORARY),
                (re.compile(r"try.{0,20}again.{0,20}later", re.I), ErrorType.TEMPORARY),
                (re.compile(r"temporarily.{0,20}unavailable", re.I), ErrorType.TEMPORARY),
            ],
        }
    
    def _initialize_provider_strategies(self) -> dict[SMTPProvider, dict[str, Any]]:
        """Initialize provider-specific error handling strategies"""
        return {
            SMTPProvider.AWS_SES: {
                "backoff_strategy": BackoffStrategy.EXPONENTIAL,
                "base_delay": 1.0,
                "max_delay": 300,
                "max_retries": 5,
                "error_weights": {
                    ErrorType.RATE_LIMIT: 2.0,
                    ErrorType.QUOTA_EXCEEDED: 5.0,
                    ErrorType.REPUTATION: 3.0,
                },
                "special_handlers": {
                    "MessageRejected": self._handle_aws_message_rejected,
                    "SendingPausedException": self._handle_aws_sending_paused,
                },
            },
            SMTPProvider.SENDGRID: {
                "backoff_strategy": BackoffStrategy.ADAPTIVE,
                "base_delay": 2.0,
                "max_delay": 600,
                "max_retries": 4,
                "error_weights": {
                    ErrorType.RATE_LIMIT: 1.5,
                    ErrorType.REPUTATION: 2.0,
                },
                "rate_limit_header": "X-RateLimit-Remaining",
            },
            SMTPProvider.MAILGUN: {
                "backoff_strategy": BackoffStrategy.EXPONENTIAL,
                "base_delay": 1.5,
                "max_delay": 300,
                "max_retries": 5,
                "error_weights": {
                    ErrorType.RATE_LIMIT: 1.5,
                    ErrorType.BLACKLIST: 3.0,
                },
            },
            SMTPProvider.CUSTOM: {
                "backoff_strategy": BackoffStrategy.LINEAR,
                "base_delay": 5.0,
                "max_delay": 300,
                "max_retries": 3,
                "error_weights": {},
            },
        }
    
    def classify_error(
        self, 
        error_message: str, 
        error_code: Optional[str] = None,
        provider: Optional[SMTPProvider] = None,
    ) -> Tuple[ErrorType, bool]:
        """
        Classify an error and determine if it's retryable
        
        Returns:
            Tuple of (ErrorType, is_retryable)
        """
        error_str = f"{error_code} {error_message}".lower() if error_code else error_message.lower()
        
        # Check patterns
        for category, patterns in self.error_patterns.items():
            for pattern, error_type in patterns:
                if pattern.search(error_str):
                    is_retryable = error_type not in [
                        ErrorType.AUTHENTICATION,
                        ErrorType.INVALID_RECIPIENT,
                        ErrorType.CONFIGURATION,
                        ErrorType.PERMANENT,
                    ]
                    return error_type, is_retryable
        
        # Provider-specific classification
        if provider and provider in self.provider_strategies:
            strategy = self.provider_strategies[provider]
            if "special_handlers" in strategy:
                for error_key, handler in strategy["special_handlers"].items():
                    if error_key.lower() in error_str:
                        return handler(error_message)
        
        # Default to temporary error (retryable)
        return ErrorType.TEMPORARY, True
    
    def get_backoff_delay(
        self,
        provider: SMTPProvider,
        error_type: ErrorType,
        attempt: int,
        account_id: Optional[str] = None,
    ) -> float:
        """Calculate backoff delay based on provider strategy and error type"""
        
        strategy = self.provider_strategies.get(provider, self.provider_strategies[SMTPProvider.CUSTOM])
        base_delay = strategy["base_delay"]
        max_delay = strategy["max_delay"]
        backoff_type = strategy["backoff_strategy"]
        
        # Apply error weight if available
        error_weight = strategy.get("error_weights", {}).get(error_type, 1.0)
        
        # Calculate base delay
        if backoff_type == BackoffStrategy.EXPONENTIAL:
            delay = base_delay * (2 ** (attempt - 1)) * error_weight
        elif backoff_type == BackoffStrategy.LINEAR:
            delay = base_delay * attempt * error_weight
        elif backoff_type == BackoffStrategy.CONSTANT:
            delay = base_delay * error_weight
        elif backoff_type == BackoffStrategy.ADAPTIVE:
            delay = self._calculate_adaptive_delay(
                provider, error_type, attempt, account_id, base_delay, error_weight
            )
        else:
            delay = base_delay
        
        # Apply jitter to prevent thundering herd
        import random
        jitter = random.uniform(0.8, 1.2)
        delay *= jitter
        
        return min(delay, max_delay)
    
    def _calculate_adaptive_delay(
        self,
        provider: SMTPProvider,
        error_type: ErrorType,
        attempt: int,
        account_id: Optional[str],
        base_delay: float,
        error_weight: float,
    ) -> float:
        """Calculate adaptive delay based on error history"""
        
        if not account_id:
            return base_delay * (2 ** (attempt - 1)) * error_weight
        
        # Track error history
        history_key = f"{provider}:{account_id}"
        if history_key not in self.error_history:
            self.error_history[history_key] = {
                "errors": [],
                "last_success": datetime.utcnow(),
            }
        
        history = self.error_history[history_key]
        now = datetime.utcnow()
        
        # Add current error
        history["errors"].append({
            "type": error_type,
            "timestamp": now,
        })
        
        # Clean old errors (keep last hour)
        cutoff = now - timedelta(hours=1)
        history["errors"] = [
            e for e in history["errors"] 
            if e["timestamp"] > cutoff
        ]
        
        # Calculate adaptive delay based on error frequency
        error_count = len(history["errors"])
        time_since_success = (now - history["last_success"]).total_seconds()
        
        # Increase delay if many recent errors
        frequency_factor = min(error_count / 10, 3.0)  # Cap at 3x
        
        # Increase delay if long time since last success
        success_factor = min(time_since_success / 3600, 2.0)  # Cap at 2x for 1+ hour
        
        adaptive_delay = base_delay * (2 ** (attempt - 1)) * error_weight * frequency_factor * success_factor
        
        return adaptive_delay
    
    def record_success(self, provider: SMTPProvider, account_id: str):
        """Record successful send to reset adaptive delays"""
        history_key = f"{provider}:{account_id}"
        if history_key in self.error_history:
            self.error_history[history_key]["last_success"] = datetime.utcnow()
            # Reduce error count on success
            self.error_history[history_key]["errors"] = []
    
    def should_retry(
        self,
        provider: SMTPProvider,
        error_type: ErrorType,
        attempt: int,
        is_retryable: bool,
    ) -> bool:
        """Determine if operation should be retried"""
        
        if not is_retryable:
            return False
        
        strategy = self.provider_strategies.get(provider, self.provider_strategies[SMTPProvider.CUSTOM])
        max_retries = strategy["max_retries"]
        
        # Some errors get fewer retries
        if error_type in [ErrorType.AUTHENTICATION, ErrorType.CONFIGURATION]:
            max_retries = min(max_retries, 1)
        elif error_type == ErrorType.QUOTA_EXCEEDED:
            max_retries = 0  # Don't retry quota errors
        
        return attempt <= max_retries
    
    def get_retry_after(self, headers: dict[str, str], provider: SMTPProvider) -> Optional[float]:
        """Extract retry-after value from response headers"""
        
        # Standard Retry-After header
        if "Retry-After" in headers:
            try:
                return float(headers["Retry-After"])
            except ValueError:
                # Try parsing as date
                from email.utils import parsedate_to_datetime
                try:
                    retry_date = parsedate_to_datetime(headers["Retry-After"])
                    return (retry_date - datetime.now()).total_seconds()
                except Exception:
                    pass
        
        # Provider-specific headers
        if provider == SMTPProvider.SENDGRID:
            if "X-RateLimit-Reset" in headers:
                try:
                    reset_time = int(headers["X-RateLimit-Reset"])
                    return max(0, reset_time - datetime.now().timestamp())
                except ValueError:
                    pass
        
        return None
    
    # Provider-specific handlers
    def _handle_aws_message_rejected(self, error_message: str) -> Tuple[ErrorType, bool]:
        """Handle AWS SES MessageRejected errors"""
        if "blacklist" in error_message.lower():
            return ErrorType.BLACKLIST, False
        elif "invalid" in error_message.lower():
            return ErrorType.INVALID_RECIPIENT, False
        else:
            return ErrorType.REPUTATION, True
    
    def _handle_aws_sending_paused(self, error_message: str) -> Tuple[ErrorType, bool]:
        """Handle AWS SES SendingPausedException"""
        return ErrorType.REPUTATION, False  # Don't retry, needs manual intervention
    
    async def handle_error_with_backoff(
        self,
        error: Exception,
        provider: SMTPProvider,
        attempt: int,
        account_id: Optional[str] = None,
        operation: Optional[str] = None,
    ) -> Tuple[bool, float]:
        """
        Handle an error and determine retry strategy
        
        Returns:
            Tuple of (should_retry, delay_seconds)
        """
        
        error_message = str(error)
        error_code = getattr(error, "code", None)
        
        # Classify error
        error_type, is_retryable = self.classify_error(error_message, error_code, provider)
        
        logger.warning(
            f"SMTP Error - Provider: {provider}, Type: {error_type}, "
            f"Operation: {operation}, Attempt: {attempt}, "
            f"Message: {error_message}"
        )
        
        # Check if should retry
        should_retry = self.should_retry(provider, error_type, attempt, is_retryable)
        
        if not should_retry:
            return False, 0
        
        # Calculate backoff delay
        delay = self.get_backoff_delay(provider, error_type, attempt, account_id)
        
        return True, delay