import asyncio
import pytest
from datetime import UTC, datetime, timedelta
from fastapi.testclient import TestClient
from sqlmodel import Session, select
from app.models.reminder import Reminder
from app.core.constants import ReminderStatus
from app.core.config import settings
from app.scheduler.manager import scheduler_manager
from app.services.reminder_service import reminder_service

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


def test_triggered_reminders_are_available_when_requested(client: TestClient, session: Session):
    due_at = datetime.now(UTC) + timedelta(minutes=10)
    response = client.post(
        "/api/v1/reminders",
        headers=auth_headers(),
        json={
            "title": "Triggered Visibility",
            "message": "Should be visible to alert UIs",
            "due_at": due_at.isoformat(),
        },
    )
    assert response.status_code == 200
    reminder_id = response.json()["data"]["id"]

    asyncio.run(reminder_service.trigger(session, reminder_id))

    response = client.get("/api/v1/reminders", headers=auth_headers())
    assert response.status_code == 200
    assert reminder_id not in {item["id"] for item in response.json()["data"]}

    response = client.get(
        "/api/v1/reminders?include_triggered=true",
        headers=auth_headers(),
    )
    assert response.status_code == 200
    matching = [item for item in response.json()["data"] if item["id"] == reminder_id]
    assert matching
    assert matching[0]["status"] == "triggered"


def test_scheduler_triggers_due_reminder(client: TestClient):
    due_at = datetime.now(UTC) - timedelta(seconds=1)
    response = client.post(
        "/api/v1/reminders",
        headers=auth_headers(),
        json={
            "title": "Scheduler Trigger",
            "message": "Due now",
            "due_at": due_at.isoformat(),
        },
    )
    assert response.status_code == 200
    reminder_id = response.json()["data"]["id"]

    asyncio.run(scheduler_manager.check_reminders())

    response = client.get(f"/api/v1/reminders/{reminder_id}", headers=auth_headers())
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["status"] == "triggered"
    assert data["triggered_at"] is not None


def test_lock_in_and_skip_reminder(client: TestClient):
    due_at = datetime.now(UTC) + timedelta(minutes=30)
    response = client.post(
        "/api/v1/reminders",
        headers=auth_headers(),
        json={
            "title": "Preflight Choice",
            "message": "Confirm or skip",
            "due_at": due_at.isoformat(),
        },
    )
    assert response.status_code == 200
    reminder_id = response.json()["data"]["id"]

    response = client.post(
        f"/api/v1/reminders/{reminder_id}/lock-in",
        headers=auth_headers(),
    )
    assert response.status_code == 200
    assert response.json()["data"]["is_locked_in"] is True

    response = client.post(
        f"/api/v1/reminders/{reminder_id}/skip",
        headers=auth_headers(),
    )
    assert response.status_code == 200
    assert response.json()["data"]["status"] == "skipped"
