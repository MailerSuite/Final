"""
SGPT Backend pytest configuration.
Uses the real FastAPI app and Postgres-backed startup to exercise full stack.
"""

import os
import sys
import pytest
from typing import Generator
from fastapi.testclient import TestClient

# Ensure testing env before importing app
os.environ.setdefault("TESTING", "true")
os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///:memory:")
os.environ.setdefault("REDIS_URL", "redis://localhost:6379/0")

# Ensure backend root on sys.path
BACKEND_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BACKEND_ROOT not in sys.path:
    sys.path.insert(0, BACKEND_ROOT)

from app.main import app  # noqa: E402
from utils.database_startup_manager import DatabaseStartupManager


@pytest.fixture(scope="session")
def client() -> Generator[TestClient, None, None]:
    """Provide a TestClient with app lifespan (startup tasks run)."""
    # Ensure default admin exists before tests
    dbm = DatabaseStartupManager()
    # Best-effort: ignore errors, tests will surface failures
    try:
        import anyio
        anyio.run(dbm.create_default_data)
    except Exception:
        pass
    with TestClient(app) as c:
        yield c


@pytest.fixture(scope="session")
def admin_credentials() -> dict:
    """Default admin seeded during startup manager."""
    return {"email": "admin@sgpt.dev", "password": "admin123"}


@pytest.fixture(scope="session")
def admin_token(client: TestClient, admin_credentials: dict) -> str:
    resp = client.post("/api/v1/auth/login", json=admin_credentials)
    if resp.status_code != 200:
        # Attempt to register then login
        reg_payload = {"email": admin_credentials["email"], "password": admin_credentials["password"]}
        client.post("/api/v1/auth/register", json=reg_payload)
        resp = client.post("/api/v1/auth/login", json=admin_credentials)
    assert resp.status_code == 200, resp.text
    return resp.json()["access_token"]


@pytest.fixture(scope="session")
def admin_headers(admin_token: str) -> dict:
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture
def sample_campaign_data() -> dict:
    return {
        "name": "Summer Sale Campaign 2025",
        "template_id": "550e8400-e29b-41d4-a716-446655440000", 
        "subject": "🌞 Summer Sale: 50% Off All Items - Don't Miss Out!",
        "sender": "marketing@fashionstore.com",
        "lead_base_ids": ["550e8400-e29b-41d4-a716-446655440001"],
        "batch_size": 150,
        "delay_between_batches": 45,
        "threads_count": 6,
        "autostart": False,
        "status": "draft",
        "content": "<html><body><h1>Summer Sale is Here!</h1><p>Get 50% off all summer collection items. Limited time offer!</p></body></html>"
    }


@pytest.fixture  
def sample_smtp_data() -> dict:
    return {
        "host": "smtp.sendgrid.net",
        "port": 587,
        "username": "apikey", 
        "password": "SG.abc123def456ghi789jkl012mno345pqr678stu901vwx234yz567",
        "use_tls": True,
        "from_email": "marketing@fashionstore.com",
        "from_name": "Fashion Store Marketing Team",
        "daily_limit": 10000,
        "status": "active"
    }