"""
Comprehensive Error Classification Service
Inspired by mailtools error handling patterns for detailed failure analysis
"""

import logging
from dataclasses import dataclass
from enum import Enum
from typing import Any

logger = logging.getLogger(__name__)


class ErrorCategory(str, Enum):
    """Main error categories"""

    AUTHENTICATION = "authentication"
    CONNECTION = "connection"
    TIMEOUT = "timeout"
    RATE_LIMIT = "rate_limit"
    SERVER_ERROR = "server_error"
    PROXY_ERROR = "proxy_error"
    CONFIGURATION = "configuration"
    TEMPORARY = "temporary"
    PERMANENT = "permanent"
    UNKNOWN = "unknown"


class ErrorSeverity(str, Enum):
    """Error severity levels"""

    LOW = "low"  # Temporary issues, high retry chance
    MEDIUM = "medium"  # Possible issues, medium retry chance
    HIGH = "high"  # Serious issues, low retry chance
    CRITICAL = "critical"  # Permanent issues, no retry


class RetryStrategy(str, Enum):
    """Retry strategies based on error type"""

    IMMEDIATE = "immediate"  # Retry immediately
    EXPONENTIAL = "exponential"  # Exponential backoff
    FIXED_DELAY = "fixed_delay"  # Fixed delay between retries
    NO_RETRY = "no_retry"  # Don't retry
    AFTER_PROXY_CHANGE = "after_proxy_change"  # Retry with different proxy


@dataclass
class ErrorPattern:
    """Error pattern definition"""

    keywords: list[str]
    category: ErrorCategory
    severity: ErrorSeverity
    retry_strategy: RetryStrategy
    max_retries: int
    description: str
    permanent: bool = False


@dataclass
class ClassifiedError:
    """Classified error result"""

    original_error: str
    category: ErrorCategory
    severity: ErrorSeverity
    retry_strategy: RetryStrategy
    max_retries: int
    description: str
    is_permanent: bool
    confidence: float
    matched_patterns: list[str]
    suggested_action: str


class ErrorClassifier:
    """Comprehensive error classifier for SMTP/IMAP operations"""

    def __init__(self):
        self.smtp_patterns = self._load_smtp_patterns()
        self.imap_patterns = self._load_imap_patterns()
        self.proxy_patterns = self._load_proxy_patterns()
        self.general_patterns = self._load_general_patterns()

    def _load_smtp_patterns(self) -> list[ErrorPattern]:
        """Load SMTP-specific error patterns"""
        return [
            # Authentication errors
            ErrorPattern(
                keywords=[
                    "authentication failed",
                    "auth failed",
                    "535",
                    "invalid credentials",
                ],
                category=ErrorCategory.AUTHENTICATION,
                severity=ErrorSeverity.HIGH,
                retry_strategy=RetryStrategy.NO_RETRY,
                max_retries=0,
                description="SMTP authentication failed - invalid credentials",
                permanent=True,
            ),
            ErrorPattern(
                keywords=[
                    "username",
                    "password",
                    "login",
                    "credential",
                    "535",
                ],
                category=ErrorCategory.AUTHENTICATION,
                severity=ErrorSeverity.HIGH,
                retry_strategy=RetryStrategy.NO_RETRY,
                max_retries=0,
                description="SMTP login credentials rejected",
                permanent=True,
            ),
            # Rate limiting
            ErrorPattern(
                keywords=[
                    "rate limit",
                    "too many",
                    "421",
                    "throttl",
                    "quota",
                    "limit exceeded",
                ],
                category=ErrorCategory.RATE_LIMIT,
                severity=ErrorSeverity.MEDIUM,
                retry_strategy=RetryStrategy.EXPONENTIAL,
                max_retries=3,
                description="SMTP rate limiting detected",
            ),
            ErrorPattern(
                keywords=["451", "temporary failure", "try again later"],
                category=ErrorCategory.TEMPORARY,
                severity=ErrorSeverity.LOW,
                retry_strategy=RetryStrategy.FIXED_DELAY,
                max_retries=5,
                description="Temporary SMTP server issue",
            ),
            # Connection errors
            ErrorPattern(
                keywords=[
                    "connection refused",
                    "connection failed",
                    "network unreachable",
                ],
                category=ErrorCategory.CONNECTION,
                severity=ErrorSeverity.MEDIUM,
                retry_strategy=RetryStrategy.AFTER_PROXY_CHANGE,
                max_retries=3,
                description="SMTP connection failed",
            ),
            ErrorPattern(
                keywords=["timeout", "timed out", "connection timeout"],
                category=ErrorCategory.TIMEOUT,
                severity=ErrorSeverity.MEDIUM,
                retry_strategy=RetryStrategy.AFTER_PROXY_CHANGE,
                max_retries=3,
                description="SMTP connection timeout",
            ),
            # Server errors
            ErrorPattern(
                keywords=["550", "554", "blocked", "spam", "blacklist"],
                category=ErrorCategory.SERVER_ERROR,
                severity=ErrorSeverity.HIGH,
                retry_strategy=RetryStrategy.NO_RETRY,
                max_retries=0,
                description="SMTP server rejection - possibly blacklisted",
                permanent=True,
            ),
            ErrorPattern(
                keywords=["500", "501", "502", "503", "504"],
                category=ErrorCategory.SERVER_ERROR,
                severity=ErrorSeverity.MEDIUM,
                retry_strategy=RetryStrategy.EXPONENTIAL,
                max_retries=2,
                description="SMTP server error",
            ),
        ]

    def _load_imap_patterns(self) -> list[ErrorPattern]:
        """Load IMAP-specific error patterns"""
        return [
            # Authentication errors
            ErrorPattern(
                keywords=[
                    "authentication failed",
                    "login failed",
                    "invalid credentials",
                    "no login",
                ],
                category=ErrorCategory.AUTHENTICATION,
                severity=ErrorSeverity.HIGH,
                retry_strategy=RetryStrategy.NO_RETRY,
                max_retries=0,
                description="IMAP authentication failed",
                permanent=True,
            ),
            ErrorPattern(
                keywords=[
                    "authenticationfailed",
                    "login incorrect",
                    "bad user",
                ],
                category=ErrorCategory.AUTHENTICATION,
                severity=ErrorSeverity.HIGH,
                retry_strategy=RetryStrategy.NO_RETRY,
                max_retries=0,
                description="IMAP login credentials invalid",
                permanent=True,
            ),
            # Connection issues
            ErrorPattern(
                keywords=["connection closed", "socket error", "broken pipe"],
                category=ErrorCategory.CONNECTION,
                severity=ErrorSeverity.MEDIUM,
                retry_strategy=RetryStrategy.AFTER_PROXY_CHANGE,
                max_retries=3,
                description="IMAP connection lost",
            ),
            ErrorPattern(
                keywords=["ssl error", "certificate", "handshake"],
                category=ErrorCategory.CONNECTION,
                severity=ErrorSeverity.MEDIUM,
                retry_strategy=RetryStrategy.FIXED_DELAY,
                max_retries=2,
                description="IMAP SSL/TLS connection issue",
            ),
            # Server capacity issues
            ErrorPattern(
                keywords=[
                    "too many connections",
                    "maximum connections",
                    "try again",
                ],
                category=ErrorCategory.RATE_LIMIT,
                severity=ErrorSeverity.LOW,
                retry_strategy=RetryStrategy.EXPONENTIAL,
                max_retries=5,
                description="IMAP server capacity limit",
            ),
            # Protocol errors
            ErrorPattern(
                keywords=["bad command", "invalid command", "protocol error"],
                category=ErrorCategory.CONFIGURATION,
                severity=ErrorSeverity.HIGH,
                retry_strategy=RetryStrategy.NO_RETRY,
                max_retries=0,
                description="IMAP protocol configuration error",
                permanent=True,
            ),
        ]

    def _load_proxy_patterns(self) -> list[ErrorPattern]:
        """Load proxy-specific error patterns"""
        return [
            ErrorPattern(
                keywords=[
                    "proxy",
                    "socks",
                    "connection refused",
                    "proxy error",
                ],
                category=ErrorCategory.PROXY_ERROR,
                severity=ErrorSeverity.MEDIUM,
                retry_strategy=RetryStrategy.AFTER_PROXY_CHANGE,
                max_retries=3,
                description="Proxy connection failed",
            ),
            ErrorPattern(
                keywords=["proxy authentication", "proxy auth", "407"],
                category=ErrorCategory.PROXY_ERROR,
                severity=ErrorSeverity.HIGH,
                retry_strategy=RetryStrategy.AFTER_PROXY_CHANGE,
                max_retries=1,
                description="Proxy authentication failed",
            ),
            ErrorPattern(
                keywords=["socks5", "socks4", "proxy timeout"],
                category=ErrorCategory.PROXY_ERROR,
                severity=ErrorSeverity.MEDIUM,
                retry_strategy=RetryStrategy.AFTER_PROXY_CHANGE,
                max_retries=3,
                description="SOCKS proxy connection issue",
            ),
        ]

    def _load_general_patterns(self) -> list[ErrorPattern]:
        """Load general error patterns"""
        return [
            ErrorPattern(
                keywords=["network", "dns", "hostname", "resolve"],
                category=ErrorCategory.CONNECTION,
                severity=ErrorSeverity.MEDIUM,
                retry_strategy=RetryStrategy.FIXED_DELAY,
                max_retries=3,
                description="Network/DNS resolution issue",
            ),
            ErrorPattern(
                keywords=["timeout", "timed out"],
                category=ErrorCategory.TIMEOUT,
                severity=ErrorSeverity.MEDIUM,
                retry_strategy=RetryStrategy.EXPONENTIAL,
                max_retries=3,
                description="Operation timeout",
            ),
            ErrorPattern(
                keywords=["connection reset", "reset by peer"],
                category=ErrorCategory.CONNECTION,
                severity=ErrorSeverity.MEDIUM,
                retry_strategy=RetryStrategy.AFTER_PROXY_CHANGE,
                max_retries=3,
                description="Connection reset by remote server",
            ),
        ]

    def classify_error(
        self, error_message: str, protocol: str = "smtp"
    ) -> ClassifiedError:
        """
        Classify an error message and return detailed classification

        Args:
            error_message: The error message to classify
            protocol: Protocol type (smtp, imap)

        Returns:
            ClassifiedError with detailed classification
        """
        error_lower = error_message.lower()

        # Get protocol-specific patterns
        if protocol.lower() == "smtp":
            protocol_patterns = self.smtp_patterns
        elif protocol.lower() == "imap":
            protocol_patterns = self.imap_patterns
        else:
            protocol_patterns = []

        # Combine all patterns
        all_patterns = (
            protocol_patterns + self.proxy_patterns + self.general_patterns
        )

        # Find matching patterns
        matches = []
        for pattern in all_patterns:
            match_count = 0
            matched_keywords = []

            for keyword in pattern.keywords:
                if keyword.lower() in error_lower:
                    match_count += 1
                    matched_keywords.append(keyword)

            if match_count > 0:
                confidence = match_count / len(pattern.keywords)
                matches.append((pattern, confidence, matched_keywords))

        # Sort by confidence
        matches.sort(key=lambda x: x[1], reverse=True)

        if matches:
            best_pattern, confidence, matched_keywords = matches[0]

            # Generate suggested action
            suggested_action = self._generate_suggested_action(
                best_pattern, error_message
            )

            return ClassifiedError(
                original_error=error_message,
                category=best_pattern.category,
                severity=best_pattern.severity,
                retry_strategy=best_pattern.retry_strategy,
                max_retries=best_pattern.max_retries,
                description=best_pattern.description,
                is_permanent=best_pattern.permanent,
                confidence=confidence,
                matched_patterns=matched_keywords,
                suggested_action=suggested_action,
            )
        else:
            # Unknown error
            return ClassifiedError(
                original_error=error_message,
                category=ErrorCategory.UNKNOWN,
                severity=ErrorSeverity.MEDIUM,
                retry_strategy=RetryStrategy.EXPONENTIAL,
                max_retries=2,
                description="Unknown error pattern",
                is_permanent=False,
                confidence=0.0,
                matched_patterns=[],
                suggested_action="Monitor error frequency and investigate if persistent",
            )

    def _generate_suggested_action(
        self, pattern: ErrorPattern, error_message: str
    ) -> str:
        """Generate suggested action based on error pattern"""
        actions = {
            ErrorCategory.AUTHENTICATION: "Verify credentials and authentication settings",
            ErrorCategory.CONNECTION: "Check network connectivity and server status",
            ErrorCategory.TIMEOUT: "Increase timeout values or check network latency",
            ErrorCategory.RATE_LIMIT: "Implement rate limiting and reduce request frequency",
            ErrorCategory.SERVER_ERROR: "Check server logs and contact server administrator",
            ErrorCategory.PROXY_ERROR: "Verify proxy settings and try different proxy",
            ErrorCategory.CONFIGURATION: "Review protocol configuration and settings",
            ErrorCategory.TEMPORARY: "Wait and retry - issue should resolve automatically",
            ErrorCategory.PERMANENT: "Manual intervention required - do not retry",
            ErrorCategory.UNKNOWN: "Investigate error pattern and update classification rules",
        }

        base_action = actions.get(pattern.category, "Monitor and investigate")

        # Add specific suggestions based on retry strategy
        if pattern.retry_strategy == RetryStrategy.NO_RETRY:
            base_action += " - Do not retry this operation"
        elif pattern.retry_strategy == RetryStrategy.AFTER_PROXY_CHANGE:
            base_action += " - Try with a different proxy server"
        elif pattern.retry_strategy == RetryStrategy.EXPONENTIAL:
            base_action += " - Retry with exponential backoff"

        return base_action

    def should_retry(
        self, classified_error: ClassifiedError, attempt_count: int
    ) -> bool:
        """
        Determine if an operation should be retried based on classified error

        Args:
            classified_error: The classified error
            attempt_count: Current attempt count

        Returns:
            True if should retry, False otherwise
        """
        if classified_error.is_permanent:
            return False

        if attempt_count >= classified_error.max_retries:
            return False

        if classified_error.retry_strategy == RetryStrategy.NO_RETRY:
            return False

        return True

    def get_retry_delay(
        self, classified_error: ClassifiedError, attempt_count: int
    ) -> float:
        """
        Get delay before retry based on error classification

        Args:
            classified_error: The classified error
            attempt_count: Current attempt count

        Returns:
            Delay in seconds
        """
        if classified_error.retry_strategy == RetryStrategy.IMMEDIATE:
            return 0.0
        elif classified_error.retry_strategy == RetryStrategy.FIXED_DELAY:
            return 5.0  # 5 seconds
        elif classified_error.retry_strategy == RetryStrategy.EXPONENTIAL:
            return min(2**attempt_count, 60.0)  # Exponential up to 60 seconds
        elif (
            classified_error.retry_strategy == RetryStrategy.AFTER_PROXY_CHANGE
        ):
            return 2.0  # Short delay after proxy change
        else:
            return 10.0  # Default delay

    def get_error_statistics(
        self, errors: list[ClassifiedError]
    ) -> dict[str, Any]:
        """
        Generate statistics from a list of classified errors

        Args:
            errors: List of classified errors

        Returns:
            Dictionary with error statistics
        """
        if not errors:
            return {}

        stats = {
            "total_errors": len(errors),
            "by_category": {},
            "by_severity": {},
            "retry_recommended": 0,
            "permanent_failures": 0,
            "avg_confidence": 0.0,
            "top_patterns": {},
        }

        for error in errors:
            # Count by category
            category = error.category.value
            stats["by_category"][category] = (
                stats["by_category"].get(category, 0) + 1
            )

            # Count by severity
            severity = error.severity.value
            stats["by_severity"][severity] = (
                stats["by_severity"].get(severity, 0) + 1
            )

            # Count retry recommendations
            if (
                error.retry_strategy != RetryStrategy.NO_RETRY
                and not error.is_permanent
            ):
                stats["retry_recommended"] += 1

            # Count permanent failures
            if error.is_permanent:
                stats["permanent_failures"] += 1

            # Track patterns
            for pattern in error.matched_patterns:
                stats["top_patterns"][pattern] = (
                    stats["top_patterns"].get(pattern, 0) + 1
                )

        # Calculate average confidence
        stats["avg_confidence"] = sum(e.confidence for e in errors) / len(
            errors
        )

        # Sort top patterns
        stats["top_patterns"] = dict(
            sorted(
                stats["top_patterns"].items(), key=lambda x: x[1], reverse=True
            )[:10]
        )

        return stats
