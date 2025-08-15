
from pydantic import BaseModel, EmailStr


class HostDiscoveryRequest(BaseModel):
    email: EmailStr


class HostEntry(BaseModel):
    hostname: str
    port: int
    protocol: str | None = None
    dns_record: str | None = None
    priority: int | None = None
    latency_ms: int | None = None
    status: str


class HostDiscoveryResponse(BaseModel):
    email: EmailStr
    completed: bool
    discovery_method: str
    results: list[HostEntry]
