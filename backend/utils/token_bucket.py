"""Simple thread-safe token bucket rate limiter."""

from __future__ import annotations

from threading import Lock
from time import monotonic


class TokenBucket:
    """Token bucket algorithm with thread safety."""

    def __init__(self, rate: float, capacity: float) -> None:
        """Initialize bucket with ``rate`` tokens/sec and maximum ``capacity``."""
        self.rate = rate
        self.capacity = capacity
        self.tokens = capacity
        self.timestamp = monotonic()
        self._lock = Lock()

    def consume(self, tokens: float = 1) -> bool:
        """Attempt to consume ``tokens``. Return True if successful."""
        with self._lock:
            now = monotonic()
            elapsed = now - self.timestamp
            self.timestamp = now
            self.tokens = min(self.capacity, self.tokens + elapsed * self.rate)
            if self.tokens >= tokens:
                self.tokens -= tokens
                return True
            return False
