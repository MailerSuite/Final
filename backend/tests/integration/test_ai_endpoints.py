import pytest
from fastapi.testclient import TestClient


@pytest.mark.asyncio
def test_ai_registry(client: TestClient, admin_headers):
    resp = client.get("/api/v1/ai/registry", headers=admin_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert any(item.get("key") == "ai.chat" for item in data)


@pytest.mark.asyncio
def test_ai_execute_chat(client: TestClient, admin_headers):
    payload = {
        "fn": "ai.chat",
        "args": {"message": "Hello", "model_id": "gpt-4-001", "max_tokens": 32},
    }
    resp = client.post("/api/v1/ai/execute", json=payload, headers=admin_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "response" in data
    assert data["model"] == "gpt-4-001"


@pytest.mark.asyncio
def test_ai_chat_sse_stream(client: TestClient, admin_headers):
    # Use streaming endpoint; requests library in TestClient buffers, but we can read text
    payload = {
        "model_id": "gpt-4-001",
        "message": "Stream this",
        "temperature": 0.1,
        "max_tokens": 32,
    }
    resp = client.post("/api/v1/ai/chat/stream", json=payload, headers=admin_headers)
    assert resp.status_code == 200
    assert resp.headers.get("content-type", "").startswith("text/event-stream")
    # Ensure at least one event frame exists in body
    text = resp.text
    assert "data:" in text
