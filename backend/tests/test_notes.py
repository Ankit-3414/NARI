import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, select
from app.core.config import settings
from app.models.note import Note, NoteVersion
from app.models.activity_log import ActivityLog

def auth_headers() -> dict[str, str]:
    return {"Authorization": f"Bearer {settings.NARI_API_KEY}"}

def test_note_versioning_lifecycle(client: TestClient, session: Session):
    # 1. Create Note (v1)
    create_resp = client.post(
        "/api/v1/notes",
        headers=auth_headers(),
        json={
            "title": "Quantum Mechanics",
            "content_markdown": "Intro to wave functions.",
            "tags": ["physics", "hard"]
        }
    )
    assert create_resp.status_code == 200
    data = create_resp.json()["data"]
    note_id = data["id"]
    assert data["title"] == "Quantum Mechanics"

    # 2. Verify Version 1 created
    v_resp = client.get(f"/api/v1/notes/{note_id}/versions", headers=auth_headers())
    versions = v_resp.json()["data"]
    assert len(versions) == 1
    assert versions[0]["version_number"] == 1
    assert versions[0]["content_markdown"] == "Intro to wave functions."

    # 3. Update Note (Metadata only - no new version)
    update_meta = client.patch(
        f"/api/v1/notes/{note_id}",
        headers=auth_headers(),
        json={"title": "Quantum Mechanics (Advanced)"}
    )
    assert update_meta.status_code == 200
    assert update_meta.json()["data"]["title"] == "Quantum Mechanics (Advanced)"
    
    v_resp = client.get(f"/api/v1/notes/{note_id}/versions", headers=auth_headers())
    assert len(v_resp.json()["data"]) == 1

    # 4. Update Content (v2)
    update_content = client.patch(
        f"/api/v1/notes/{note_id}",
        headers=auth_headers(),
        json={
            "content_markdown": "Wave functions and Schrodinger equation.",
            "change_note": "Added Schrodinger"
        }
    )
    assert update_content.status_code == 200
    
    v_resp = client.get(f"/api/v1/notes/{note_id}/versions", headers=auth_headers())
    versions = v_resp.json()["data"]
    assert len(versions) == 2
    assert versions[0]["version_number"] == 2
    assert versions[0]["change_note"] == "Added Schrodinger"

    # 5. Get Specific Version
    v1_resp = client.get(f"/api/v1/notes/{note_id}/versions/1", headers=auth_headers())
    assert v1_resp.json()["data"]["content_markdown"] == "Intro to wave functions."

    # 6. Archive and Verify
    client.delete(f"/api/v1/notes/{note_id}", headers=auth_headers())
    list_resp = client.get("/api/v1/notes", headers=auth_headers())
    assert len(list_resp.json()["data"]) == 0

    # 7. ActivityLog
    activity_resp = client.get("/api/v1/activity?entity_type=note", headers=auth_headers())
    actions = [a["action"] for a in activity_resp.json()["data"]]
    assert "created" in actions
    assert "updated" in actions
    assert "deleted" in actions
