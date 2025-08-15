"""
API utility helpers: pagination, field selection, and response helpers.
"""
from __future__ import annotations

from typing import Any, Dict, Iterable, List, Optional, Sequence


def select_fields(item: Dict[str, Any], fields: Optional[Iterable[str]]) -> Dict[str, Any]:
    if not fields:
        return item
    field_set = set(fields)
    return {k: v for k, v in item.items() if k in field_set}


def build_paginated_response(
    items: Sequence[Dict[str, Any]],
    total: int,
    limit: int,
    offset: int,
    fields: Optional[Iterable[str]] = None,
) -> Dict[str, Any]:
    selected = [select_fields(i, fields) for i in items]
    return {
        "items": selected,
        "total": total,
        "limit": limit,
        "offset": offset,
        "hasMore": offset + len(selected) < total,
    }
