"""
ID utilities to simplify UUID usage in APIs.
"""
from __future__ import annotations

import re
from typing import Optional

_UUID_RE = re.compile(r"^[0-9a-fA-F-]{32,36}$")


def short_id(id_str: Optional[str]) -> Optional[str]:
    if not id_str:
        return id_str
    s = str(id_str).replace("-", "")
    return s[:8]


def looks_like_uuid(value: str) -> bool:
    return bool(_UUID_RE.match(value or ""))
