import pytest
from datetime import UTC, datetime, timedelta
from fastapi.testclient import TestClient
from sqlmodel import Session, select
from app.models.reminder import Reminder
from app.core.constants import ReminderStatus
from app.core.config import settings

def auth_headers() -> dict[str, str]:
    return {"Authorization": f"Bearer {settings.NARI_API_KEY}"}

def test_reminder_lifecycle(client: TestClient, session: Session):
    # 1. Create reminder
    due_at = datetime.now(UTC) + timedelta(minutes=10)
    response = client.post(
        "/api/v1/reminders",
        headers=auth_headers(),
        json={
            "title": "Test Reminder",
            "message": "Do something",
            "due_at": due_at.isoformat()
        }
    )
    assert response.status_code == 200
    data = response.json()["data"]
    reminder_id = data["id"]
    assert data["title"] == "Test Reminder"
    assert data["status"] == "scheduled"

    # 2. List reminders
    response = client.get("/api/v1/reminders", headers=auth_headers())
    assert response.status_code == 200
    assert len(response.json()["data"]) == 1

    # 3. Snooze reminder
    response = client.post(
        f"/api/v1/reminders/{reminder_id}/snooze?minutes=30",
        headers=auth_headers()
    )
    assert response.status_code == 200
    assert response.json()["data"]["status"] == "snoozed"
    
    # 4. Dismiss reminder
    response = client.post(
        f"/api/v1/reminders/{reminder_id}/dismiss",
        headers=auth_headers()
    )
    assert response.status_code == 200
    assert response.json()["data"]["status"] == "dismissed"

    # 5. Delete reminder
    response = client.delete(
        f"/api/v1/reminders/{reminder_id}",
        headers=auth_headers()
    )
    assert response.status_code == 200
    assert response.json()["data"]["deleted"] is True
