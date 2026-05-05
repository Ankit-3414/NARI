"""Subject routes."""

from fastapi import APIRouter, Depends
from sqlmodel import Session

from ...core.security import verify_api_key
from ...db.session import get_session
from ...schemas.common import success_response
from ...schemas.subject import SubjectCreate, SubjectUpdate
from ...services.subject_service import subject_service

router = APIRouter(
    prefix="/subjects",
    tags=["subjects"],
    dependencies=[Depends(verify_api_key)],
)


@router.get("")
def list_subjects(
    include_archived: bool = False,
    session: Session = Depends(get_session),
):
    subjects = subject_service.list(session, include_archived=include_archived)
    return success_response([subject_service.to_data(subject) for subject in subjects])


@router.post("")
def create_subject(
    payload: SubjectCreate,
    session: Session = Depends(get_session),
):
    subject = subject_service.create(session, payload)
    return success_response(subject_service.to_data(subject))


@router.get("/{subject_id}")
def get_subject(subject_id: int, session: Session = Depends(get_session)):
    subject = subject_service.get(session, subject_id)
    return success_response(subject_service.to_data(subject))


@router.patch("/{subject_id}")
def update_subject(
    subject_id: int,
    payload: SubjectUpdate,
    session: Session = Depends(get_session),
):
    subject = subject_service.update(session, subject_id, payload)
    return success_response(subject_service.to_data(subject))


@router.delete("/{subject_id}")
def delete_subject(subject_id: int, session: Session = Depends(get_session)):
    subject = subject_service.delete(session, subject_id)
    return success_response(subject_service.to_data(subject))
