"""Study session service."""

from __future__ import annotations

import json
from datetime import datetime, date, timedelta
from typing import Any, Optional

from sqlmodel import Session, select, and_, func

from ..core.constants import EntityType, StudySessionStatus
from ..core.errors import NariError
from ..core.events import get_event_bus
from ..models.study_session import StudySession
from ..schemas.study_session import StudySessionCreate
from ..utils.datetime_utils import utc_naive
from ..websocket.events import EventNames


class StudyService:
    """Business logic for study session management."""

    async def start(self, session: Session, payload: StudySessionCreate) -> StudySession:
        """Start a new study session."""
        # Check if there is already an active session
        active = self.get_active(session)
        if active:
            raise NariError("SESSION_ALREADY_ACTIVE", "A study session is already running", 409)

        study_session = StudySession(
            subject_id=payload.subject_id,
            goal_text=payload.goal_text,
            status=StudySessionStatus.RUNNING,
        )
        
        session.add(study_session)
        session.commit()
        session.refresh(study_session)
        
        await self._emit_event(EventNames.STUDY_STARTED, study_session)
        return study_session

    def get(self, session: Session, session_id: int) -> StudySession:
        study_session = session.get(StudySession, session_id)
        if not study_session:
            raise NariError("STUDY_SESSION_NOT_FOUND", f"Study session {session_id} not found", 404)
        return study_session

    def get_active(self, session: Session) -> Optional[StudySession]:
        """Get the currently active (running or paused) session."""
        statement = select(StudySession).where(
            and_(
                StudySession.status != StudySessionStatus.COMPLETED
            )
        )
        return session.exec(statement).first()

    def list(
        self,
        session: Session,
        *,
        subject_id: Optional[int] = None,
        limit: int = 50,
    ) -> list[StudySession]:
        statement = select(StudySession)
        if subject_id:
            statement = statement.where(StudySession.subject_id == subject_id)
        
        statement = statement.order_by(StudySession.created_at.desc()).limit(limit)
        return list(session.exec(statement).all())

    async def pause(self, session: Session, session_id: int) -> StudySession:
        """Pause a running session."""
        study_session = self.get(session, session_id)
        if study_session.status != StudySessionStatus.RUNNING:
            raise NariError("SESSION_NOT_RUNNING", "Only running sessions can be paused", 409)
            
        now = utc_naive()
        
        # Calculate duration so far
        start_time = study_session.resumed_at or study_session.created_at
        delta = now - start_time
        study_session.duration_seconds += int(delta.total_seconds())
        
        study_session.status = StudySessionStatus.PAUSED
        study_session.paused_at = now
        study_session.interrupt_count += 1
        
        # Append to interruptions JSON
        interrupts = json.loads(study_session.interruptions_json or "[]")
        interrupts.append(now.isoformat())
        study_session.interruptions_json = json.dumps(interrupts)
        
        study_session.updated_at = now
        session.add(study_session)
        session.commit()
        session.refresh(study_session)
        
        await self._emit_event(EventNames.STUDY_PAUSED, study_session)
        return study_session

    async def resume(self, session: Session, session_id: int) -> StudySession:
        """Resume a paused session."""
        study_session = self.get(session, session_id)
        if study_session.status != StudySessionStatus.PAUSED:
            raise NariError("SESSION_NOT_PAUSED", "Only paused sessions can be resumed", 409)
            
        study_session.status = StudySessionStatus.RUNNING
        study_session.resumed_at = utc_naive()
        study_session.updated_at = utc_naive()
        
        session.add(study_session)
        session.commit()
        session.refresh(study_session)
        
        await self._emit_event(EventNames.STUDY_RESUMED, study_session)
        return study_session

    async def stop(self, session: Session, session_id: int, notes: Optional[str] = None) -> StudySession:
        """Complete a session."""
        study_session = self.get(session, session_id)
        if study_session.status == StudySessionStatus.COMPLETED:
            raise NariError("SESSION_ALREADY_COMPLETED", "Session is already completed", 409)
            
        now = utc_naive()
        
        # If running, add final duration
        if study_session.status == StudySessionStatus.RUNNING:
            start_time = study_session.resumed_at or study_session.created_at
            delta = now - start_time
            study_session.duration_seconds += int(delta.total_seconds())
            
        study_session.status = StudySessionStatus.COMPLETED
        study_session.ended_at = now
        if notes:
            study_session.notes = notes
            
        study_session.updated_at = now
        session.add(study_session)
        session.commit()
        session.refresh(study_session)
        
        await self._emit_event(EventNames.STUDY_STOPPED, study_session)
        return study_session

    def get_today_stats(self, session: Session) -> dict[str, Any]:
        """Get total study time for today."""
        now = utc_naive()
        start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0)
        
        statement = select(func.sum(StudySession.duration_seconds)).where(
            StudySession.created_at >= start_of_day,
            StudySession.status == StudySessionStatus.COMPLETED
        )
        total_seconds = session.exec(statement).first() or 0
        
        # Also include duration of active session if it exists
        active = self.get_active(session)
        if active and active.created_at >= start_of_day:
            current_duration = active.duration_seconds
            if active.status == StudySessionStatus.RUNNING:
                start_time = active.resumed_at or active.created_at
                delta = utc_naive() - start_time
                current_duration += int(delta.total_seconds())
            total_seconds += current_duration

        return {
            "total_seconds": total_seconds,
            "total_hours": round(total_seconds / 3600, 2),
            "total_minutes": round(total_seconds / 60, 1)
        }

    def to_data(self, study_session: StudySession) -> dict[str, Any]:
        return {
            "id": study_session.id,
            "subject_id": study_session.subject_id,
            "status": study_session.status.value,
            "goal_text": study_session.goal_text,
            "notes": study_session.notes,
            "created_at": study_session.created_at.isoformat(),
            "paused_at": study_session.paused_at.isoformat() if study_session.paused_at else None,
            "resumed_at": study_session.resumed_at.isoformat() if study_session.resumed_at else None,
            "ended_at": study_session.ended_at.isoformat() if study_session.ended_at else None,
            "duration_seconds": study_session.duration_seconds,
            "interrupt_count": study_session.interrupt_count,
            "interruptions": json.loads(study_session.interruptions_json or "[]"),
        }

    async def _emit_event(self, event: EventNames, study_session: StudySession) -> None:
        await get_event_bus().emit_ws_event(
            event=event.value,
            entity_type=EntityType.STUDY_SESSION.value,
            entity_id=study_session.id,
            data=self.to_data(study_session),
        )


study_service = StudyService()
