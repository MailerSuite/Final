import re

from utils.logging_config import setup_logging

logger = setup_logging()


def validate_email(email: str) -> bool:
    pattern = "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
    return re.match(pattern, email) is not None


def remove_duplicate_lines(content: str) -> list[str]:
    """Remove duplicate lines from content"""
    lines = content.split("\n")
    unique_lines = list(dict.fromkeys(lines))
    return [line.strip() for line in unique_lines if line.strip()]


def process_smtp_format_1(smtp_input: str) -> dict[str, str] | None:
    try:
        parts = smtp_input.split(":", 3)
        if len(parts) != 4:
            return None
        server, port, email, password = parts
        if not validate_email(email):
            return None
        return {
            "server": server.strip(),
            "port": int(port.strip()),
            "email": email.strip(),
            "password": password.strip(),
        }
    except (ValueError, IndexError):
        return None


def process_smtp_format_2(smtp_input: str) -> dict[str, str] | None:
    try:
        parts = smtp_input.split(":")
        if len(parts) < 4:
            return None
        server = parts[0]
        email = parts[1]
        password = ":".join(parts[2:-1])
        port = parts[-1]
        if not validate_email(email):
            return None
        return {
            "server": server.strip(),
            "port": int(port.strip()),
            "email": email.strip(),
            "password": password.strip(),
        }
    except (ValueError, IndexError):
        return None


def process_smtp_format_3(smtp_input: str) -> dict[str, str] | None:
    try:
        parts = smtp_input.split(",", 3)
        if len(parts) != 4:
            return None
        server, port, email, password = parts
        if not validate_email(email):
            return None
        return {
            "server": server.strip(),
            "port": int(port.strip()),
            "email": email.strip(),
            "password": password.strip(),
        }
    except (ValueError, IndexError):
        return None


def auto_detect_smtp_format(smtp_input: str) -> dict[str, str] | None:
    """Auto-detect SMTP format and extract data"""
    email_match = re.search(
        "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}", smtp_input
    )
    if not email_match:
        return None
    email = email_match.group()
    port_match = re.search("\\b(25|465|587|2525)\\b", smtp_input)
    port = int(port_match.group()) if port_match else 587
    parts = re.split("[,:;|\\s]+", smtp_input)
    parts = [p.strip() for p in parts if p.strip()]
    server = None
    password = None
    for part in parts:
        if part != email and part != str(port):
            if "." in part and (not validate_email(part)):
                server = part
            elif part != server:
                password = part
                break
    if server and password:
        return {
            "server": server,
            "port": port,
            "email": email,
            "password": password,
        }
    if password:
        return {"email": email, "password": password}
    return None


def parse_smtp_line(smtp_input: str) -> dict[str, str] | None:
    """Parse a single SMTP line using various formats"""
    smtp_input = smtp_input.strip()
    if not smtp_input:
        return None
    processors = [
        process_smtp_format_1,
        process_smtp_format_2,
        process_smtp_format_3,
        auto_detect_smtp_format,
    ]
    for processor in processors:
        result = processor(smtp_input)
        if result:
            return result
    return None


def parse_smtp_data(data: str) -> list[dict[str, str]]:
    """Parse SMTP data from text input"""
    unique_lines = remove_duplicate_lines(data)
    accounts = []
    errors = 0
    for line in unique_lines:
        result = parse_smtp_line(line)
        if result:
            accounts.append(result)
        else:
            errors += 1
            logger.warning(f"Failed to parse SMTP line: {line}")
    logger.info(f"Parsed {len(accounts)} SMTP accounts with {errors} errors")
    return accounts
