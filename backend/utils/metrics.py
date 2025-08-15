from collections import defaultdict
from dataclasses import dataclass

CAMPAIGN_METRICS: dict[str, dict[str, int]] = defaultdict(
    lambda: {
        "sent": 0,
        "success": 0,
        "failed": 0,
        "retries": 0,
        "failovers": 0,
    }
)


@dataclass
class IMAPMetricsCollector:
    """Collect metrics for an active IMAP test run."""

    connections: int = 0
    successful: int = 0
    failed: int = 0
    emails_rx: int = 0
    total_latency_ms: float = 0.0

    def record(
        self, success: bool, latency_ms: float, emails_rx: int = 0
    ) -> None:
        """Record a single IMAP operation."""
        self.connections += 1
        if success:
            self.successful += 1
        else:
            self.failed += 1
        self.emails_rx += emails_rx
        self.total_latency_ms += latency_ms

    def reset(self) -> None:
        self.connections = 0
        self.successful = 0
        self.failed = 0
        self.emails_rx = 0
        self.total_latency_ms = 0.0

    @property
    def success_rate(self) -> float:
        return (
            self.successful / self.connections * 100
            if self.connections
            else 0.0
        )

    @property
    def avg_response_ms(self) -> float:
        return (
            self.total_latency_ms / self.connections
            if self.connections
            else 0.0
        )

    def to_dict(self) -> dict[str, float | int]:
        return {
            "successRate": round(self.success_rate, 2),
            "connections": self.connections,
            "successful": self.successful,
            "failed": self.failed,
            "emailsRx": self.emails_rx,
            "avgResponseMs": round(self.avg_response_ms, 2),
        }


IMAP_METRICS = IMAPMetricsCollector()


@dataclass
class SMTPTrafficCollector:
    """Collect metrics for SMTP send attempts."""

    connections: int = 0
    successful: int = 0
    failed: int = 0
    retries: int = 0
    failovers: int = 0
    total_latency_ms: float = 0.0

    def record(
        self,
        success: bool,
        latency_ms: float = 0.0,
        *,
        retries: int = 0,
        failover: bool = False,
    ) -> None:
        """Record a single SMTP operation."""
        self.connections += 1
        if success:
            self.successful += 1
        else:
            self.failed += 1
        self.retries += retries
        if failover:
            self.failovers += 1
        self.total_latency_ms += latency_ms

    def reset(self) -> None:
        self.connections = 0
        self.successful = 0
        self.failed = 0
        self.retries = 0
        self.failovers = 0
        self.total_latency_ms = 0.0

    @property
    def success_rate(self) -> float:
        return (
            self.successful / self.connections * 100
            if self.connections
            else 0.0
        )

    @property
    def avg_response_ms(self) -> float:
        return (
            self.total_latency_ms / self.connections
            if self.connections
            else 0.0
        )

    def to_dict(self) -> dict[str, float | int]:
        return {
            "connections": self.connections,
            "successful": self.successful,
            "failed": self.failed,
            "retries": self.retries,
            "failovers": self.failovers,
            "avgResponseMs": round(self.avg_response_ms, 2),
        }


SMTP_METRICS = SMTPTrafficCollector()


def increment(campaign_id: str, key: str, amount: int = 1) -> None:
    CAMPAIGN_METRICS[campaign_id][key] += amount


def get_metrics(campaign_id: str) -> dict[str, int]:
    return CAMPAIGN_METRICS[campaign_id]
