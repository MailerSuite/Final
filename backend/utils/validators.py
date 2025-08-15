"""Enhanced security validators with comprehensive protection"""

import html
import json
import re
import secrets
import urllib.parse
from pathlib import Path
from typing import Any

# SECURITY FIX: Enhanced SQL injection protection patterns
SQL_INJECTION_PATTERNS = [
    r"(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)",
    r"(--|#|\/\*|\*\/)",
    r"(\b(OR|AND)\s+\w+\s*=\s*\w+)",
    r"(\'\s*(OR|AND)\s*\')",
    r"(\d+\s*(=|<|>)\s*\d+)",
    r"(INFORMATION_SCHEMA|SYSOBJECTS|SYSCOLUMNS)",
    r"(xp_|sp_|fn_)",
    r"(\b(CAST|CONVERT|SUBSTRING|ASCII|CHAR)\s*\()",
]

# SECURITY FIX: XSS protection patterns
XSS_PATTERNS = [
    r"<script[^>]*>.*?</script>",
    r"javascript:",
    r"on\w+\s*=",
    r"<iframe[^>]*>.*?</iframe>",
    r"<object[^>]*>.*?</object>",
    r"<embed[^>]*>",
    r"<form[^>]*>.*?</form>",
    r"<link[^>]*>",
    r"<meta[^>]*>",
    r"data:text/html",
    r"vbscript:",
    r"expression\s*\(",
]

# SECURITY FIX: Path traversal patterns
PATH_TRAVERSAL_PATTERNS = [
    r"\.\.",
    r"\.\\",
    r"\./",
    r"%2e%2e",
    r"%2f",
    r"%5c",
    r"\\",
    r"/etc/",
    r"/proc/",
    r"/sys/",
    r"c:",
    r"d:",
]


def validate_table_name(name: str) -> bool:
    """Enhanced table name validation against SQL injections"""
    if not name or len(name) > 64:
        return False

    # Check for SQL injection patterns
    for pattern in SQL_INJECTION_PATTERNS:
        if re.search(pattern, name, re.IGNORECASE):
            return False

    return bool(re.match(r"^[a-zA-Z_][a-zA-Z0-9_]*$", name))


def validate_column_name(name: str) -> bool:
    """Column name validation against SQL injections"""
    if not name or len(name) > 64:
        return False
    return bool(re.match(r"^[a-zA-Z_][a-zA-Z0-9_]*$", name))


def sanitize_user_input(
    input_data: Any, max_length: int = 1000, allow_html: bool = False
) -> str:
    """SECURITY FIX: Comprehensive user input sanitization"""
    if input_data is None:
        return ""

    data = str(input_data)

    # Limit input length
    if len(data) > max_length:
        data = data[:max_length]

    # SQL injection protection
    for pattern in SQL_INJECTION_PATTERNS:
        data = re.sub(pattern, "", data, flags=re.IGNORECASE)

    # XSS protection
    if not allow_html:
        for pattern in XSS_PATTERNS:
            data = re.sub(pattern, "", data, flags=re.IGNORECASE)

        # HTML entity encoding
        data = html.escape(data)

    # Path traversal protection
    for pattern in PATH_TRAVERSAL_PATTERNS:
        data = re.sub(pattern, "", data, flags=re.IGNORECASE)

    # Remove dangerous characters
    dangerous_chars = ["\x00", "\x0b", "\x0c"]
    for char in dangerous_chars:
        data = data.replace(char, "")

    # Additional cleanup of control characters
    data = "".join(
        char for char in data if ord(char) >= 32 or char in "\n\r\t"
    )

    return data.strip()


def sanitize_html_input(input_data: str, max_length: int = 10000) -> str:
    """SECURITY FIX: Safe HTML content sanitization"""
    if not input_data:
        return ""

    # Limit length
    if len(input_data) > max_length:
        input_data = input_data[:max_length]

    # Remove dangerous scripts and tags
    for pattern in XSS_PATTERNS:
        input_data = re.sub(
            pattern, "", input_data, flags=re.IGNORECASE | re.DOTALL
        )

    # Allow only safe HTML tags
    safe_tags = [
        "p",
        "br",
        "strong",
        "em",
        "u",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "ul",
        "ol",
        "li",
    ]

    # Remove all tags except safe ones
    import re

    tag_pattern = r"<(\w+)[^>]*>"

    def replace_tag(match):
        tag = match.group(1).lower()
        if tag in safe_tags:
            return f"<{tag}>"
        return ""

    sanitized = re.sub(tag_pattern, replace_tag, input_data)

    # Remove any remaining script content
    sanitized = re.sub(
        r"<script.*?</script>", "", sanitized, flags=re.IGNORECASE | re.DOTALL
    )

    return sanitized


def validate_email_format(email: str) -> tuple[bool, str | None]:
    """Email format validation"""
    if not email or len(email) > 254:
        return False, "Email too long or empty"

    # Basic regex for email
    email_pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"

    if not re.match(email_pattern, email):
        return False, "Invalid email format"

    # Check for dangerous characters
    if any(char in email for char in ["<", ">", '"', "'", "\x00", "\n", "\r"]):
        return False, "Email contains invalid characters"

    return True, None


def validate_email_secure(email: str) -> bool:
    """Enhanced email validation with security checks"""
    if not email or len(email) > 254:
        return False

    # Basic format validation
    email_pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    if not re.match(email_pattern, email):
        return False

    # Security checks
    suspicious_patterns = [
        r'[<>"\'\`]',  # Dangerous characters
        r"javascript:",  # XSS attempt
        r"data:",  # Data URI
        r"%[0-9a-f]{2}",  # URL encoding
    ]

    for pattern in suspicious_patterns:
        if re.search(pattern, email, re.IGNORECASE):
            return False

    return True


def validate_password_strength(password: str) -> tuple[bool, str | None]:
    """Enhanced password complexity validation"""
    if not password:
        return False, "Password is required"

    if len(password) < 8:
        return False, "Password must be at least 8 characters long"

    if len(password) > 128:
        return False, "Password too long (max 128 characters)"

    # Check for different types of characters
    checks = {
        "uppercase": re.search(r"[A-Z]", password),
        "lowercase": re.search(r"[a-z]", password),
        "digit": re.search(r"\d", password),
        "special": re.search(r'[!@#$%^&*(),.?":{}|<>]', password),
    }

    missing = [name for name, found in checks.items() if not found]

    if len(missing) > 1:
        return False, f"Password must contain {', '.join(missing)}"

    # Check for common weak passwords
    weak_passwords = {
        "password",
        "password123",
        "12345678",
        "qwerty",
        "abc123",
        "admin",
        "root",
        "user",
        "00000000",
        "11111111",
    }

    if password.lower() in weak_passwords:
        return False, "Password is too common"

    return True, None


def validate_password_strength(password: str) -> dict[str, Any]:
    """Enhanced password strength validation"""
    result = {"valid": True, "errors": [], "strength": "weak", "score": 0}

    if len(password) < 8:
        result["errors"].append("Password must be at least 8 characters long")
        result["valid"] = False

    if len(password) > 128:
        result["errors"].append("Password is too long (max 128 characters)")
        result["valid"] = False

    # Check for character variety
    has_upper = any(c.isupper() for c in password)
    has_lower = any(c.islower() for c in password)
    has_digit = any(c.isdigit() for c in password)
    has_special = any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in password)

    score = 0
    if has_upper:
        score += 1
    if has_lower:
        score += 1
    if has_digit:
        score += 1
    if has_special:
        score += 1
    if len(password) >= 12:
        score += 1
    if len(password) >= 16:
        score += 1

    result["score"] = score

    if score < 3:
        result["valid"] = False
        result["errors"].append(
            "Password must contain uppercase, lowercase, and numbers or special characters"
        )

    if score >= 5:
        result["strength"] = "strong"
    elif score >= 3:
        result["strength"] = "medium"

    # Check for common passwords
    common_passwords = [
        "password",
        "123456",
        "admin",
        "user",
        "test",
        "qwerty",
    ]
    if password.lower() in common_passwords:
        result["valid"] = False
        result["errors"].append("Password is too common")

    return result


def validate_session_id(session_id: str) -> bool:
    """Session ID validation"""
    if not session_id:
        return False

    # UUID format or safe identifier
    uuid_pattern = (
        r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"
    )
    safe_id_pattern = r"^[a-zA-Z0-9_-]{8,64}$"

    return bool(
        re.match(uuid_pattern, session_id)
        or re.match(safe_id_pattern, session_id)
    )


def validate_filename(filename: str) -> tuple[bool, str | None]:
    """Filename validation"""
    if not filename:
        return False, "Filename is required"

    if len(filename) > 255:
        return False, "Filename too long"

    # Check for dangerous characters
    dangerous_chars = [
        "/",
        "\\",
        "..",
        "<",
        ">",
        ":",
        '"',
        "|",
        "?",
        "*",
        "\x00",
    ]
    for char in dangerous_chars:
        if char in filename:
            return False, f"Filename contains invalid character: {char}"

    # Check for Windows reserved names
    reserved_names = {
        "CON",
        "PRN",
        "AUX",
        "NUL",
        "COM1",
        "COM2",
        "COM3",
        "COM4",
        "COM5",
        "COM6",
        "COM7",
        "COM8",
        "COM9",
        "LPT1",
        "LPT2",
        "LPT3",
        "LPT4",
        "LPT5",
        "LPT6",
        "LPT7",
        "LPT8",
        "LPT9",
    }

    name_without_ext = filename.split(".")[0].upper()
    if name_without_ext in reserved_names:
        return False, "Filename uses reserved name"

    return True, None


def validate_file_path(file_path: str) -> bool:
    """SECURITY FIX: Secure file path validation"""
    if not file_path:
        return False

    # Check for path traversal
    for pattern in PATH_TRAVERSAL_PATTERNS:
        if re.search(pattern, file_path, re.IGNORECASE):
            return False

    # Validate file extension
    try:
        path = Path(file_path)
        if not path.suffix:
            return False

        # Allow only safe extensions
        safe_extensions = {
            ".txt",
            ".csv",
            ".json",
            ".xml",
            ".pdf",
            ".doc",
            ".docx",
            ".xls",
            ".xlsx",
        }
        if path.suffix.lower() not in safe_extensions:
            return False

    except Exception:
        return False

    return True


def validate_url(
    url: str, allowed_schemes: set = None
) -> tuple[bool, str | None]:
    """URL validation"""
    if not url:
        return False, "URL is required"

    if len(url) > 2048:
        return False, "URL too long"

    if allowed_schemes is None:
        allowed_schemes = {"http", "https"}

    try:
        parsed = urllib.parse.urlparse(url)

        if parsed.scheme not in allowed_schemes:
            return (
                False,
                f"URL scheme must be one of: {', '.join(allowed_schemes)}",
            )

        if not parsed.netloc:
            return False, "Invalid URL format"

        # Check for dangerous characters
        if any(
            char in url for char in ["<", ">", '"', "'", "\x00", "\n", "\r"]
        ):
            return False, "URL contains invalid characters"

        return True, None

    except Exception as e:
        return False, f"Invalid URL: {str(e)}"


def validate_url_secure(url: str) -> bool:
    """Enhanced URL validation with security checks"""
    if not url or len(url) > 2048:
        return False

    # Check for dangerous protocols
    dangerous_protocols = [
        "javascript:",
        "data:",
        "vbscript:",
        "file:",
        "ftp:",
    ]
    for protocol in dangerous_protocols:
        if url.lower().startswith(protocol):
            return False

    # Allow only HTTP/HTTPS
    if not url.lower().startswith(("http://", "https://")):
        return False

    # Check for XSS patterns in URL
    for pattern in XSS_PATTERNS:
        if re.search(pattern, url, re.IGNORECASE):
            return False

    return True


def validate_numeric_input(
    value: str, min_val: float = None, max_val: float = None
) -> tuple[bool, str | None]:
    """Numeric input validation"""
    if not value:
        return False, "Value is required"

    try:
        num_value = float(value)

        if min_val is not None and num_value < min_val:
            return False, f"Value must be at least {min_val}"

        if max_val is not None and num_value > max_val:
            return False, f"Value must be at most {max_val}"

        return True, None

    except ValueError:
        return False, "Invalid numeric value"


def generate_secure_token(length: int = 32) -> str:
    """Generate cryptographically secure random token"""
    return secrets.token_urlsafe(length)


def validate_json_input(json_data: str, max_size: int = 10000) -> bool:
    """Secure JSON validation"""
    if not json_data or len(json_data) > max_size:
        return False

    try:
        parsed = json.loads(json_data)

        # Check for dangerous content in JSON
        json_str = json.dumps(parsed)
        for pattern in XSS_PATTERNS + SQL_INJECTION_PATTERNS:
            if re.search(pattern, json_str, re.IGNORECASE):
                return False

        return True
    except (json.JSONDecodeError, ValueError):
        return False


def rate_limit_key(identifier: str, action: str) -> str:
    """Generate key for rate limiting"""
    return f"rate_limit:{sanitize_user_input(identifier)}:{sanitize_user_input(action)}"


def validate_input_length(
    data: Any, min_length: int = 0, max_length: int = 1000
) -> bool:
    """Validate input length constraints"""
    if data is None:
        return min_length == 0

    data_str = str(data)
    return min_length <= len(data_str) <= max_length


def sanitize_filename(filename: str) -> str:
    """SECURITY FIX: Safe filename sanitization"""
    if not filename:
        return "unknown"

    # Remove path components
    filename = Path(filename).name

    # Remove dangerous characters
    sanitized = re.sub(r"[^\w\-_\.]", "_", filename)

    # Limit length
    if len(sanitized) > 255:
        name, ext = Path(sanitized).stem, Path(sanitized).suffix
        sanitized = name[: 255 - len(ext)] + ext

    # Ensure we have a valid filename
    if not sanitized or sanitized in {".", "..", ""}:
        sanitized = "unknown_file"

    return sanitized
