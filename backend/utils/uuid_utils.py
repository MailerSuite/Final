from collections.abc import Mapping
from typing import Any
from uuid import UUID


def stringify_uuids(data: Mapping[str, Any]) -> dict:
    """Convert any ``uuid.UUID`` values in ``data`` to strings."""
    result = dict(data)
    for key, value in result.items():
        if isinstance(value, UUID):
            result[key] = str(value)
    return result
