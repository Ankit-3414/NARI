"""Study session routes."""

from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlmodel import Session

from ...core.security import verify_api_key
from ...db.session import get_session
from ...schemas.common import success_response
from ...schemas.study_session import StudySessionCreate
from ...services.study_service import study_service

router = APIRouter(
    prefix="/study",
    tags=["study"],
    dependencies=[Depends(verify_api_key)],
)


@router.get("")
def list_study_sessions(
    subject_id: Optional[int] = None,
    limit: int = Query(default=50, ge=1, le=100),
    session: Session = Depends(get_session),
):
    sessions = study_service.list(session, subject_id=subject_id, limit=limit)
    return success_response([study_service.to_data(s) for s in sessions])


@router.post("/start")
async def start_study_session(
    payload: StudySessionCreate,
    session: Session = Depends(get_session),
):
    study_session = await study_service.start(session, payload)
    return success_response(study_service.to_data(study_session))


@router.get("/active")
def get_active_session(session: Session = Depends(get_session)):
    active = study_service.get_active(session)
    if not active:
        return success_response(None)
    return success_response(study_service.to_data(active))


@router.post("/active/pause")
async def pause_active_session(session: Session = Depends(get_session)):
    active = study_service.get_active(session)
    if not active:
        from ...core.errors import NariError
        raise NariError("NO_ACTIVE_SESSION", "No active study session to pause", 404)
    
    study_session = await study_service.pause(session, active.id)
    return success_response(study_service.to_data(study_session))


@router.post("/active/resume")
async def resume_active_session(session: Session = Depends(get_session)):
    active = study_service.get_active(session)
    if not active:
        from ...core.errors import NariError
        raise NariError("NO_ACTIVE_SESSION", "No active study session to resume", 404)
    
    study_session = await study_service.resume(session, active.id)
    return success_response(study_service.to_data(study_session))


@router.post("/active/stop")
async def stop_active_session(
    notes: Optional[str] = None,
    session: Session = Depends(get_session)
):
    active = study_service.get_active(session)
    if not active:
        from ...core.errors import NariError
        raise NariError("NO_ACTIVE_SESSION", "No active study session to stop", 404)
    
    study_session = await study_service.stop(session, active.id, notes=notes)
    return success_response(study_service.to_data(study_session))


@router.get("/{session_id}")
def get_study_session(session_id: int, session: Session = Depends(get_session)):
    study_session = study_service.get(session, session_id)
    return success_response(study_service.to_data(study_session))
