"""
Input Sanitization and XSS Protection Service
Comprehensive security layer for user-generated content
"""

import html
import logging
import os
import re
from typing import Any

import bleach

logger = logging.getLogger(__name__)


class InputSanitizer:
    """
    Comprehensive input sanitization service for XSS protection
    Handles text cleaning, HTML sanitization, and data validation
    """

    def __init__(self):
        # Allowed HTML tags for rich text content (very restrictive)
        self.allowed_tags = [
            "p",
            "br",
            "strong",
            "em",
            "u",
            "ol",
            "ul",
            "li",
            "h1",
            "h2",
            "h3",
            "h4",
            "h5",
            "h6",
            "blockquote",
        ]

        # Allowed HTML attributes (minimal set)
        self.allowed_attributes = {
            "*": ["class"],  # Only allow class attribute on any tag
        }

        # Allowed CSS properties (if needed)
        self.allowed_styles = []

        # Dangerous patterns to always remove
        self.dangerous_patterns = [
            r"javascript:",
            r"vbscript:",
            r"data:text/html",
            r"data:application/javascript",
            r"on\w+\s*=",  # Event handlers like onclick, onload, etc.
            r"<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>",
            r"<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>",
            r"<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>",
            r"<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>",
            r"<link\b[^<]*(?:(?!<\/link>)<[^<]*)*<\/link>",
            r"<meta\b[^<]*(?:(?!<\/meta>)<[^<]*)*<\/meta>",
        ]

        # SQL injection patterns
        self.sql_patterns = [
            r"(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)",
            r"(--|#|\/\*|\*\/)",
            r"(\b(or|and)\s+\d+\s*=\s*\d+)",
            r"(\'\s*(or|and)\s+\'\w+\'\s*=\s*\'\w+)",
        ]

        # Common XSS vectors
        self.xss_patterns = [
            r"<\s*script\b",
            r"<\s*\/\s*script\s*>",
            r"javascript\s*:",
            r"vbscript\s*:",
            r"onload\s*=",
            r"onerror\s*=",
            r"onclick\s*=",
            r"onmouseover\s*=",
            r"expression\s*\(",
            r"url\s*\(",
            r"import\s*\(",
        ]

    def sanitize_text(self, text: str, allow_html: bool = False) -> str:
        """
        Sanitize text input with comprehensive XSS protection

        Args:
            text: Input text to sanitize
            allow_html: Whether to allow safe HTML tags

        Returns:
            str: Sanitized text
        """
        if not isinstance(text, str):
            return str(text)

        if not text.strip():
            return text

        try:
            # Step 1: Remove dangerous patterns
            sanitized = self._remove_dangerous_patterns(text)

            # Step 2: Handle HTML content
            if allow_html:
                sanitized = self._sanitize_html(sanitized)
            else:
                sanitized = html.escape(sanitized)

            # Step 3: Additional XSS protection
            sanitized = self._remove_xss_vectors(sanitized)

            # Step 4: Normalize whitespace
            sanitized = self._normalize_whitespace(sanitized)

            # Step 5: Validate length
            sanitized = self._validate_length(sanitized)

            return sanitized

        except Exception as e:
            logger.error(f"Text sanitization error: {e}")
            # Fallback to basic HTML escaping
            return html.escape(str(text))

    def sanitize_email(self, email: str) -> str | None:
        """
        Sanitize and validate email addresses

        Args:
            email: Email address to sanitize

        Returns:
            str or None: Sanitized email or None if invalid
        """
        if not isinstance(email, str):
            return None

        # Basic sanitization
        email = email.strip().lower()

        # Remove dangerous characters
        email = re.sub(r'[<>"\'&]', "", email)

        # Basic email validation pattern
        email_pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"

        if re.match(email_pattern, email):
            return email
        else:
            logger.warning(f"Invalid email format rejected: {email}")
            return None

    def sanitize_url(self, url: str) -> str | None:
        """
        Sanitize and validate URLs

        Args:
            url: URL to sanitize

        Returns:
            str or None: Sanitized URL or None if invalid
        """
        if not isinstance(url, str):
            return None

        url = url.strip()

        # Remove dangerous patterns
        for pattern in self.dangerous_patterns:
            url = re.sub(pattern, "", url, flags=re.IGNORECASE)

        # Only allow specific protocols
        allowed_protocols = ["http://", "https://", "mailto:", "tel:"]

        if not any(url.startswith(protocol) for protocol in allowed_protocols):
            if not url.startswith(("/", "#")):  # Relative URLs
                logger.warning(f"URL with disallowed protocol rejected: {url}")
                return None

        return url

    def sanitize_filename(self, filename: str) -> str:
        """
        Sanitize filenames for safe storage

        Args:
            filename: Original filename

        Returns:
            str: Sanitized filename
        """
        if not isinstance(filename, str):
            return "file"

        # Remove path separators and dangerous characters
        sanitized = re.sub(r'[<>:"/\\|?*\x00-\x1f]', "", filename)

        # Remove leading/trailing dots and spaces
        sanitized = sanitized.strip(". ")

        # Limit length
        if len(sanitized) > 255:
            name, ext = os.path.splitext(sanitized)
            sanitized = name[:250] + ext

        # Fallback if completely sanitized away
        if not sanitized:
            sanitized = "sanitized_file"

        return sanitized

    def sanitize_json_data(
        self, data: dict[str, Any], sanitize_values: bool = True
    ) -> dict[str, Any]:
        """
        Recursively sanitize JSON data

        Args:
            data: Dictionary to sanitize
            sanitize_values: Whether to sanitize string values

        Returns:
            Dict: Sanitized data
        """
        if not isinstance(data, dict):
            return {}

        sanitized = {}

        for key, value in data.items():
            # Sanitize key
            clean_key = self._sanitize_dict_key(key)

            # Sanitize value based on type
            if isinstance(value, str) and sanitize_values:
                sanitized[clean_key] = self.sanitize_text(
                    value, allow_html=False
                )
            elif isinstance(value, dict):
                sanitized[clean_key] = self.sanitize_json_data(
                    value, sanitize_values
                )
            elif isinstance(value, list):
                sanitized[clean_key] = self._sanitize_list(
                    value, sanitize_values
                )
            else:
                sanitized[clean_key] = value

        return sanitized

    def _remove_dangerous_patterns(self, text: str) -> str:
        """Remove known dangerous patterns"""
        for pattern in self.dangerous_patterns:
            text = re.sub(
                pattern, "", text, flags=re.IGNORECASE | re.MULTILINE
            )
        return text

    def _sanitize_html(self, html_content: str) -> str:
        """Sanitize HTML using bleach library"""
        try:
            return bleach.clean(
                html_content,
                tags=self.allowed_tags,
                attributes=self.allowed_attributes,
                styles=self.allowed_styles,
                strip=True,
            )
        except Exception as e:
            logger.error(f"HTML sanitization error: {e}")
            return html.escape(html_content)

    def _remove_xss_vectors(self, text: str) -> str:
        """Remove common XSS attack vectors"""
        for pattern in self.xss_patterns:
            text = re.sub(pattern, "", text, flags=re.IGNORECASE)
        return text

    def _normalize_whitespace(self, text: str) -> str:
        """Normalize whitespace characters"""
        # Replace multiple whitespace with single space
        text = re.sub(r"\s+", " ", text)
        # Remove leading/trailing whitespace
        return text.strip()

    def _validate_length(self, text: str, max_length: int = 10000) -> str:
        """Validate and truncate text length"""
        if len(text) > max_length:
            logger.warning(
                f"Text truncated from {len(text)} to {max_length} characters"
            )
            return text[:max_length] + "..."
        return text

    def _sanitize_dict_key(self, key: str) -> str:
        """Sanitize dictionary keys"""
        if not isinstance(key, str):
            return str(key)

        # Only allow alphanumeric, underscore, and dash
        sanitized = re.sub(r"[^a-zA-Z0-9_-]", "", key)

        # Ensure it starts with letter or underscore
        if sanitized and not sanitized[0].isalpha() and sanitized[0] != "_":
            sanitized = "_" + sanitized

        return sanitized or "key"

    def _sanitize_list(
        self, lst: list[Any], sanitize_values: bool
    ) -> list[Any]:
        """Sanitize list items"""
        sanitized = []

        for item in lst:
            if isinstance(item, str) and sanitize_values:
                sanitized.append(self.sanitize_text(item, allow_html=False))
            elif isinstance(item, dict):
                sanitized.append(
                    self.sanitize_json_data(item, sanitize_values)
                )
            elif isinstance(item, list):
                sanitized.append(self._sanitize_list(item, sanitize_values))
            else:
                sanitized.append(item)

        return sanitized

    def detect_sql_injection(self, text: str) -> bool:
        """
        Detect potential SQL injection attempts

        Args:
            text: Text to analyze

        Returns:
            bool: True if potential SQL injection detected
        """
        if not isinstance(text, str):
            return False

        text_lower = text.lower()

        for pattern in self.sql_patterns:
            if re.search(pattern, text_lower, re.IGNORECASE):
                logger.warning(f"Potential SQL injection detected: {pattern}")
                return True

        return False

    def detect_xss_attempt(self, text: str) -> bool:
        """
        Detect potential XSS attempts

        Args:
            text: Text to analyze

        Returns:
            bool: True if potential XSS detected
        """
        if not isinstance(text, str):
            return False

        for pattern in self.xss_patterns:
            if re.search(pattern, text, re.IGNORECASE):
                logger.warning(f"Potential XSS attempt detected: {pattern}")
                return True

        return False

    def create_security_report(self, data: dict[str, Any]) -> dict[str, Any]:
        """
        Create security analysis report for input data

        Args:
            data: Data to analyze

        Returns:
            Dict: Security analysis report
        """
        report = {
            "timestamp": __import__("datetime").datetime.utcnow().isoformat(),
            "total_fields": 0,
            "sanitized_fields": 0,
            "potential_threats": [],
            "risk_level": "low",
        }

        def analyze_value(key: str, value: Any):
            report["total_fields"] += 1

            if isinstance(value, str):
                original = value
                sanitized = self.sanitize_text(value)

                if original != sanitized:
                    report["sanitized_fields"] += 1

                if self.detect_sql_injection(value):
                    report["potential_threats"].append(
                        {
                            "field": key,
                            "type": "sql_injection",
                            "severity": "high",
                        }
                    )

                if self.detect_xss_attempt(value):
                    report["potential_threats"].append(
                        {
                            "field": key,
                            "type": "xss_attempt",
                            "severity": "high",
                        }
                    )

        # Recursively analyze all fields
        self._recursive_analyze(data, "", analyze_value)

        # Determine risk level
        if report["potential_threats"]:
            high_severity = any(
                threat["severity"] == "high"
                for threat in report["potential_threats"]
            )
            report["risk_level"] = "high" if high_severity else "medium"

        return report

    def _recursive_analyze(self, data: Any, prefix: str, analyzer):
        """Recursively analyze nested data structures"""
        if isinstance(data, dict):
            for key, value in data.items():
                full_key = f"{prefix}.{key}" if prefix else key
                analyzer(full_key, value)
                if isinstance(value, (dict, list)):
                    self._recursive_analyze(value, full_key, analyzer)
        elif isinstance(data, list):
            for i, item in enumerate(data):
                full_key = f"{prefix}[{i}]"
                analyzer(full_key, item)
                if isinstance(item, (dict, list)):
                    self._recursive_analyze(item, full_key, analyzer)


# Global sanitizer instance
input_sanitizer = InputSanitizer()
