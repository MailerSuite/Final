from pydantic import UUID4, BaseModel


class SessionCreate(BaseModel):
    """Schema for creating a new session."""

    name: str
    description: str | None = None


class SessionPublic(BaseModel):
    """Public representation of a session."""

    id: str  # Router converts to string
    user_id: str  # Router converts to string
    name: str
    description: str | None = None
    is_active: bool
    active_proxy_id: str | None = None  # Router converts to string
    created_at: str | None = None  # String and optional

    class Config:
        from_attributes = True


class SessionDeleteResponse(BaseModel):
    """Response schema for session deletion."""

    id: UUID4
    detail: str


class ProxySelectionRequest(BaseModel):
    """Request payload for selecting a proxy for a session."""

    proxy_id: UUID4
