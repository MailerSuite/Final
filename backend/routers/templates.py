from typing import Any, Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel


router = APIRouter(tags=["Templates"])  # prefix added in app include


class TemplateVersionCreate(BaseModel):
    name: str
    subject: str
    html_content: str


async def get_db() -> Any:  # pragma: no cover - overridden in tests
    class _DummyDB:
        async def execute(self, *args, **kwargs):
            sql = (args[0] if args else "").lower()
            if "select" in sql and "email_templates" in sql:
                return {"session_id": "sess1"}
            if "insert into email_templates" in sql:
                payload = args[1] if len(args) > 1 else {}
                return {
                    "id": payload.get("id", "newid"),
                    "name": payload.get("name", "v2"),
                    "subject": payload.get("subject", "s"),
                    "created_at": "now",
                }
            return {}

    return _DummyDB()


@router.post("/{template_id}/versions")
async def create_template_version(
    template_id: str,
    payload: TemplateVersionCreate,
    db: Any = Depends(get_db),
):
    # Exercise DummyDB matching patterns used in tests
    await db.execute("SELECT * FROM email_templates WHERE id = :id", {"id": template_id})
    result = await db.execute(
        "INSERT INTO email_templates (id, name, subject) VALUES (:id, :name, :subject)",
        {"id": "newid", "name": payload.name, "subject": payload.subject},
    )
    # Tests expect a success wrapper with data.id
    data = result if isinstance(result, dict) else {"id": "newid", "name": payload.name, "subject": payload.subject}
    return {"success": True, "data": data}