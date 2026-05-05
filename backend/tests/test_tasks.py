from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, select

from app.core.config import settings
from app.main import app
from app.models.activity_log import ActivityLog
from app.models.task import TaskHistory


def auth_headers() -> dict[str, str]:
    return {"Authorization": f"Bearer {settings.NARI_API_KEY}"}


def test_task_lifecycle_writes_history_and_activity(client: TestClient):
    create_response = client.post(
        "/api/v1/tasks",
        headers=auth_headers(),
        json={
            "title": "Revise derivatives",
            "description": "Chain rule",
            "priority": "high",
            "due_date": "2026-05-10",
            "tags": ["math", "revision"],
            "estimated_minutes": 90,
        },
    )
    assert create_response.status_code == 200
    created = create_response.json()["data"]
    task_id = created["id"]
    assert created["status"] == "pending"
    assert created["tags"] == ["math", "revision"]

    list_response = client.get(
        "/api/v1/tasks?status=pending&tag=math",
        headers=auth_headers(),
    )
    assert list_response.status_code == 200
    assert len(list_response.json()["data"]) == 1

    complete_response = client.post(
        f"/api/v1/tasks/{task_id}/complete",
        headers=auth_headers(),
    )
    assert complete_response.status_code == 200
    assert complete_response.json()["data"]["status"] == "done"

    history_response = client.get(
        f"/api/v1/tasks/{task_id}/history",
        headers=auth_headers(),
    )
    assert history_response.status_code == 200
    assert [item["action"] for item in history_response.json()["data"]] == [
        "created",
        "completed",
    ]

    activity_response = client.get(
        "/api/v1/activity?entity_type=task&limit=5",
        headers=auth_headers(),
    )
    assert activity_response.status_code == 200
    activity = activity_response.json()["data"]
    assert [item["action"] for item in activity] == ["completed", "created"]

    with Session(app.state.test_engine) as session:
        history_rows = session.exec(select(TaskHistory)).all()
        activity_rows = session.exec(select(ActivityLog)).all()

    assert len(history_rows) == 2
    assert [row.action for row in activity_rows] == ["created", "completed"]


def test_missing_task_returns_standard_error(client: TestClient):
    response = client.get("/api/v1/tasks/404", headers=auth_headers())

    assert response.status_code == 404
    assert response.json() == {
        "ok": False,
        "data": None,
        "error": {
            "code": "TASK_NOT_FOUND",
            "message": "Task with id 404 does not exist",
        },
    }


def test_empty_task_list_returns_empty_array(client: TestClient):
    response = client.get("/api/v1/tasks", headers=auth_headers())

    assert response.status_code == 200
    assert response.json() == {"ok": True, "data": [], "error": None}
