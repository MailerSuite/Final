from uuid import UUID, uuid4

from pydantic import BaseModel, Field


class HandshakeBase(BaseModel):
    hostname: str = Field(..., examples=["smtp.example.com:25"])
    timeout: int = Field(
        500, description="Timeout in milliseconds", examples=[500]
    )
    message: str = Field(..., examples=["HELO test.local"])


class HandshakeCreate(HandshakeBase):
    pass


class HandshakeUpdate(BaseModel):
    hostname: str | None = Field(None, examples=["smtp.example.com:25"])
    timeout: int | None = Field(None, examples=[500])
    message: str | None = Field(None, examples=["EHLO test.local"])


class Handshake(HandshakeBase):
    id: UUID = Field(default_factory=uuid4)
    model_config = dict(from_attributes=True)
