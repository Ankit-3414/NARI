import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, select
from app.core.config import settings
from app.models.subject import Subject
from app.models.activity_log import ActivityLog

def auth_headers() -> dict[str, str]:
    return {"Authorization": f"Bearer {settings.NARI_API_KEY}"}

def test_subject_crud_lifecycle(client: TestClient, session: Session):
    # 1. Create Subject
    create_response = client.post(
        "/api/v1/subjects",
        headers=auth_headers(),
        json={
            "name": "Mathematics",
            "description": "Calculus and Algebra",
            "difficulty": 4,
            "priority": 10,
            "tags": ["uni", "stem"]
        }
    )
    assert create_response.status_code == 200
    data = create_response.json()["data"]
    subject_id = data["id"]
    assert data["name"] == "Mathematics"
    assert data["tags"] == ["uni", "stem"]
    assert data["created_at"] is not None
    assert data["updated_at"] is not None

    # 2. List Subjects
    list_response = client.get("/api/v1/subjects", headers=auth_headers())
    assert list_response.status_code == 200
    assert len(list_response.json()["data"]) == 1
    assert list_response.json()["data"][0]["name"] == "Mathematics"

    # 3. Update Subject
    update_response = client.patch(
        f"/api/v1/subjects/{subject_id}",
        headers=auth_headers(),
        json={"difficulty": 5, "priority": 15}
    )
    assert update_response.status_code == 200
    assert update_response.json()["data"]["difficulty"] == 5
    assert update_response.json()["data"]["priority"] == 15

    # 4. Get Subject
    get_response = client.get(f"/api/v1/subjects/{subject_id}", headers=auth_headers())
    assert get_response.status_code == 200
    assert get_response.json()["data"]["difficulty"] == 5

    # 5. Archive Subject (Soft Delete)
    delete_response = client.delete(f"/api/v1/subjects/{subject_id}", headers=auth_headers())
    assert delete_response.status_code == 200
    assert delete_response.json()["data"]["archived_at"] is not None

    # 6. Verify Hidden in List by default
    list_active = client.get("/api/v1/subjects", headers=auth_headers())
    assert len(list_active.json()["data"]) == 0

    # 7. Verify Visible in List with include_archived
    list_all = client.get("/api/v1/subjects?include_archived=true", headers=auth_headers())
    assert len(list_all.json()["data"]) == 1

    # 8. Verify ActivityLog
    activity_response = client.get("/api/v1/activity?entity_type=subject", headers=auth_headers())
    assert activity_response.status_code == 200
    activity = activity_response.json()["data"]
    # Should have: created, updated, archived
    actions = [a["action"] for row in activity for a in [row]] # flatten if needed, but it's a list
    assert "created" in [a["action"] for a in activity]
    assert "updated" in [a["action"] for a in activity]
    assert "archived" in [a["action"] for a in activity]
