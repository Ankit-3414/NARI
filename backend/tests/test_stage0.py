from pathlib import Path

from fastapi.testclient import TestClient
from sqlalchemy import text
from sqlmodel import Session, select

from app.core.config import settings
from app.core.constants import EntityType
from app.models.activity_log import ActivityLog
from app.services.activity_service import activity_service


def auth_headers(api_key: str | None = None) -> dict[str, str]:
    token = api_key or settings.NARI_API_KEY
    return {"Authorization": f"Bearer {token}"}


def test_app_imports_and_starts(client: TestClient):
    assert client.app.title == "NARI"


def test_health_with_valid_api_key_returns_ok(client: TestClient):
    response = client.get("/api/v1/health", headers=auth_headers())

    assert response.status_code == 200
    data = response.json()
    assert data["ok"] is True
    assert data["error"] is None
    assert data["data"]["status"] == "healthy"
    assert data["data"]["database"] == "ok"
    assert "server_time" in data["data"]


def test_health_without_api_key_returns_standard_error(client: TestClient):
    response = client.get("/api/v1/health")

    assert response.status_code == 401
    assert response.json() == {
        "ok": False,
        "data": None,
        "error": {
            "code": "UNAUTHORIZED",
            "message": "Missing or invalid API key",
        },
    }


def test_health_with_bad_api_key_returns_standard_error(client: TestClient):
    response = client.get("/api/v1/health", headers=auth_headers("bad-key"))

    assert response.status_code == 401
    assert response.json()["error"]["code"] == "UNAUTHORIZED"


def test_database_ping_succeeds(session: Session):
    assert session.exec(text("SELECT 1")).one()[0] == 1


def test_activity_service_writes_append_only_row(session: Session):
    entry = activity_service.create(
        session,
        entity_type=EntityType.SYSTEM,
        action="created",
        message="Stage 0 smoke test",
        source="system",
        actor="system",
    )

    rows = session.exec(select(ActivityLog)).all()

    assert entry is not None
    assert len(rows) == 1
    assert rows[0].message == "Stage 0 smoke test"
