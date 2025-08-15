from datetime import datetime

from pydantic import BaseModel, RootModel


class InboxCheckRequest(BaseModel):
    domain_id: int
    template_id: int
    proxy_id: int
    smtp_id: int
    imap_inbox: str


class InboxCheckStepResult(BaseModel):
    step: str
    status: str
    timestamp: datetime
    error: str | None = None


class InboxCheckResponse(RootModel[list[InboxCheckStepResult]]):
    pass
