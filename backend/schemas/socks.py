from enum import Enum

from pydantic import BaseModel, Field


class SocksProxyType(str, Enum):
    SOCKS5 = "socks5"
    SOCKS4 = "socks4"


class SocksTestConfig(BaseModel):
    host: str
    port: int
    proxy_type: SocksProxyType = SocksProxyType.SOCKS5
    target_host: str = "google.com"
    target_port: int = 80
    timeout: int = 30
    max_concurrent: int | None = Field(
        None, description="Override default max concurrent checks"
    )
