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
    return {"name": "Test Campaign", "subject": "Test Subject", "content": "Test content", "status": "draft"}


@pytest.fixture
def sample_smtp_data() -> dict:
    return {"host": "smtp.gmail.com", "port": 587, "username": "test@gmail.com", "password": "testpassword", "use_tls": True}