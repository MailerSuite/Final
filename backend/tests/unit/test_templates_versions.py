import json

from starlette.testclient import TestClient
from app.main import app


def test_template_version_create(monkeypatch):
    client = TestClient(app)

    # Monkeypatch DB execute to simulate existing template and insert
    calls = {"select": 0, "insert": 0}

    class DummyDB:
        async def execute(self, *args, **kwargs):
            sql = (args[0] if args else "").lower()
            if "select" in sql and "email_templates" in sql:
                calls["select"] += 1
                return {"session_id": "sess1"}
            if "insert into email_templates" in sql:
                calls["insert"] += 1
                return {"id": "newid", "name": "v2", "subject": "s", "created_at": "now"}
            raise AssertionError("Unexpected SQL")

    # Patch dependency
    from backend.routers import templates as tpl

    async def get_db_override():
        return DummyDB()

    app.dependency_overrides[tpl.get_db] = get_db_override

    resp = client.post(
        "/api/v1/templates/abc/versions",
        json={"name": "v2", "subject": "s", "html_content": "<h1>x</h1>"},
    )
    assert resp.status_code in (200, 201)
    data = resp.json()
    assert data["success"] is True
    assert data["data"]["id"] == "newid"

    app.dependency_overrides.clear()
