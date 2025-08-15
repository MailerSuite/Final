import re
from pathlib import Path

__all__ = ["sanitize_filename"]


def sanitize_filename(name: str) -> str:
    """Sanitize untrusted filename.

    Removes directory components and replaces disallowed characters to
    prevent path traversal or injection issues.
    """
    base = Path(name).name
    sanitized = re.sub("[^A-Za-z0-9._-]", "_", base)
    if sanitized in {"", ".", ".."}:
        raise ValueError("invalid filename")
    return sanitized
