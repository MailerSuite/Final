from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field


class ProxyType(str, Enum):
    SOCKS5 = "socks5"
    SOCKS4 = "socks4"
    HTTP = "http"
    HTTPS = "https"


class ProxyStatus(str, Enum):
    PENDING = "pending"
    VALID = "valid"
    INVALID = "invalid"
    ERROR = "error"
    CHECKED = "checked"
    DEAD = "dead"


class ProxyServerBase(BaseModel):
    ip_address: str = Field(..., alias="host")
    port: int
    username: str | None = None
    password: str | None = None
    proxy_type: ProxyType = ProxyType.SOCKS5
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    @property
    def host(self) -> str:
        """Alias for :attr:`ip_address` for backward compatibility."""
        return self.ip_address

    @host.setter
    def host(self, value: str) -> None:
        self.ip_address = value


class ProxyServerCreate(ProxyServerBase):
    pass


class ProxyServer(ProxyServerBase):
    id: str
    status: ProxyStatus
    last_checked_at: datetime | None = Field(None, alias="last_checked")
    response_time: float | None = None
    country: str | None = None
    error_message: str | None = None
    created_at: datetime
    is_active: bool = True
    is_custom_proxy: bool = False
    model_config = ConfigDict(populate_by_name=True)


class ProxyTestRequest(BaseModel):
    proxy_servers: list[ProxyServerCreate]
    timeout: int | None = 10
    test_url: str | None = "http://httpbin.org/ip"


class ProxyTestResult(BaseModel):
    host: str
    port: int
    status: ProxyStatus
    response_time: float | None = None
    error_message: str | None = None


class ProxyBulkTestResponse(BaseModel):
    total: int
    valid: int
    invalid: int
    errors: int
    results: list[ProxyTestResult]


class ProxyActiveUpdate(BaseModel):
    """Request body for toggling proxy active flag."""

    active: bool


class ProxyLogEvent(BaseModel):
    """WebSocket message carrying a single proxy test log line."""

    type: str = "proxy_log"
    message: str


class ProxyUpdate(BaseModel):
    """Schema for updating proxy settings."""

    status: ProxyStatus | None = None
    proxy_type: ProxyType | None = None
    username: str | None = None
    password: str | None = None


class MessageResponse(BaseModel):
    """Generic message response."""

    message: str
    success: bool = True
