import json
from datetime import datetime
from pathlib import Path
from typing import Any


class DeadLetterQueue:
    """Persistent dead-letter queue stored in a JSON file."""

    def __init__(self, path: str = "dead_letter_queue.json") -> None:
        self.file = Path(path)
        if self.file.exists():
            self.entries: list[dict[str, Any]] = json.loads(
                self.file.read_text()
            )
        else:
            self.entries = []

    def add(
        self,
        campaign_id: str,
        recipient: str,
        errors: list[str],
        attempts: list[Any],
    ) -> None:
        entry = {
            "campaign_id": campaign_id,
            "recipient": recipient,
            "errors": errors,
            "attempts": attempts,
            "timestamp": datetime.utcnow().isoformat(),
        }
        self.entries.append(entry)
        self.file.write_text(json.dumps(self.entries))

    def all(self) -> list[dict[str, Any]]:
        return self.entries


class DeadLetterQueueConsumer:
    """Async wrapper exposing simple list and pop operations."""

    def __init__(self, path: str = "dead_letter_queue.json") -> None:
        self.queue = DeadLetterQueue(path)

    async def list_entries(self) -> list[dict[str, Any]]:
        return self.queue.all()

    async def pop(self, index: int) -> dict[str, Any]:
        try:
            entry = self.queue.entries.pop(index)
        except IndexError as exc:
            raise ValueError("invalid index") from exc
        self.queue.file.write_text(json.dumps(self.queue.entries))
        return entry
