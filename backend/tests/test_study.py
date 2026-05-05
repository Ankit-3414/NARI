import pytest
import time
from fastapi.testclient import TestClient
from sqlmodel import Session, select
from app.core.config import settings
from app.core.constants import StudySessionStatus
from app.models.subject import Subject
from app.models.study_session import StudySession
from app.models.activity_log import ActivityLog

def auth_headers() -> dict[str, str]:
    return {"Authorization": f"Bearer {settings.NARI_API_KEY}"}

def test_study_session_lifecycle(client: TestClient, session: Session):
    # 0. Setup: Create a subject
    sub = Subject(name="Physics", difficulty=3)
    session.add(sub)
    session.commit()
    session.refresh(sub)
    subject_id = sub.id

    # 1. Start Session
    start_resp = client.post(
        "/api/v1/study/start",
        headers=auth_headers(),
        json={"subject_id": subject_id, "goal_text": "Understand Newton's laws"}
    )
    assert start_resp.status_code == 200
    data = start_resp.json()["data"]
    session_id = data["id"]
    assert data["status"] == "running"
    assert data["subject_id"] == subject_id

    # 2. Get Active
    active_resp = client.get("/api/v1/study/active", headers=auth_headers())
    assert active_resp.json()["data"]["id"] == session_id

    # 3. Pause Session
    # Wait a bit to ensure duration > 0 (though small)
    time.sleep(1.1) 
    pause_resp = client.post("/api/v1/study/active/pause", headers=auth_headers())
    assert pause_resp.status_code == 200
    data = pause_resp.json()["data"]
    assert data["status"] == "paused"
    assert data["duration_seconds"] >= 1
    assert data["interrupt_count"] == 1
    assert len(data["interruptions"]) == 1

    # 4. Resume Session
    resume_resp = client.post("/api/v1/study/active/resume", headers=auth_headers())
    assert resume_resp.status_code == 200
    data = resume_resp.json()["data"]
    assert data["status"] == "running"
    assert len(data["interruptions"]) == 2

    # 5. Stop Session
    time.sleep(1.1)
    stop_resp = client.post(
        "/api/v1/study/active/stop",
        headers=auth_headers(),
        params={"notes": "Finished the laws"}
    )
    assert stop_resp.status_code == 200
    data = stop_resp.json()["data"]
    assert data["status"] == "completed"
    assert data["duration_seconds"] >= 2
    assert data["notes"] == "Finished the laws"

    # 6. Verify No Active
    none_resp = client.get("/api/v1/study/active", headers=auth_headers())
    assert none_resp.json()["data"] == {}

    # 7. Verify ActivityLog
    activity_resp = client.get("/api/v1/activity?entity_type=study_session", headers=auth_headers())
    activity = activity_resp.json()["data"]
    actions = [a["action"] for a in activity]
    assert "started" in actions
    assert "paused" in actions
    assert "resumed" in actions
    assert "stopped" in actions

def test_prevent_multiple_active_sessions(client: TestClient, session: Session):
    sub = Subject(name="Math", difficulty=2)
    session.add(sub)
    session.commit()
    session.refresh(sub)
    
    # Start first
    client.post("/api/v1/study/start", headers=auth_headers(), json={"subject_id": sub.id})
    
    # Try starting second
    fail_resp = client.post("/api/v1/study/start", headers=auth_headers(), json={"subject_id": sub.id})
    assert fail_resp.status_code == 409
    assert fail_resp.json()["error"]["code"] == "SESSION_ALREADY_ACTIVE"
