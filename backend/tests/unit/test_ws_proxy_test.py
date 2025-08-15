from starlette.testclient import TestClient
from app.main import app


def test_ws_proxy_test_not_found():
    client = TestClient(app)

    # Ensure websocket returns error for unknown proxy id
    with client.websocket_connect("/api/v1/ws/proxies/test/unknown") as ws:
        msg = ws.receive_json()
        # Expect an error type
        assert msg.get("type") == "error"
        ws.close()