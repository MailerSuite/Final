from datetime import datetime

from pydantic import BaseModel, ConfigDict


class MonitorCheck(BaseModel):
    """Single entry for monitor.check logs."""

    time: datetime
    thread: str
    socks: str | None = None
    account: str | None = None
    response: str | None = None
    status: str
    model_config = ConfigDict(from_attributes=True)
