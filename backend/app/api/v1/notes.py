"""Note routes."""

from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlmodel import Session

from ...core.security import verify_api_key
from ...db.session import get_session
from ...schemas.common import success_response
from ...schemas.note import NoteCreate, NoteUpdate
from ...services.note_service import note_service

router = APIRouter(
    prefix="/notes",
    tags=["notes"],
    dependencies=[Depends(verify_api_key)],
)


@router.get("")
def list_notes(
    subject_id: Optional[int] = None,
    tag: Optional[str] = None,
    include_archived: bool = False,
    session: Session = Depends(get_session),
):
    notes = note_service.list(session, subject_id=subject_id, tag=tag, include_archived=include_archived)
    return success_response([note_service.to_data(n) for n in notes])


@router.post("")
async def create_note(
    payload: NoteCreate,
    session: Session = Depends(get_session),
):
    note = await note_service.create(session, payload)
    return success_response(note_service.to_data(note))


@router.get("/{note_id}")
def get_note(note_id: int, session: Session = Depends(get_session)):
    note = note_service.get(session, note_id)
    return success_response(note_service.to_data(note))


@router.patch("/{note_id}")
async def update_note(
    note_id: int,
    payload: NoteUpdate,
    session: Session = Depends(get_session),
):
    note = await note_service.update(session, note_id, payload)
    return success_response(note_service.to_data(note))


@router.delete("/{note_id}")
async def delete_note(note_id: int, session: Session = Depends(get_session)):
    note = await note_service.delete(session, note_id)
    return success_response(note_service.to_data(note))


@router.get("/{note_id}/versions")
def get_note_versions(note_id: int, session: Session = Depends(get_session)):
    versions = note_service.get_versions(session, note_id)
    return success_response([v.model_dump(mode="json") for v in versions])


@router.get("/{note_id}/versions/{version_number}")
def get_note_version(
    note_id: int,
    version_number: int,
    session: Session = Depends(get_session)
):
    version = note_service.get_version(session, note_id, version_number)
    return success_response(version.model_dump(mode="json"))
