"""Study session service."""

from __future__ import annotations

import json
from datetime import UTC, datetime
from typing import Any, Optional

from sqlmodel import Session, select, and_, or_

from ..core.constants import EntityType, StudySessionStatus
from ..core.errors import NariError
from ..core.events import get_event_bus
from ..models.study_session import StudySession
from ..models.subject import Subject
from ..schemas.study_session import StudySessionCreate, StudySessionUpdate
from ..utils.datetime_utils import utc_now
from ..websocket.events import EventNames


class StudyService:
    """Business logic for study session tracking."""

    async def start(self, session: Session, payload: StudySessionCreate) -> StudySession:
        """Start a new study session. Ensures only one session is active at a time."""
        # 1. Verify subject exists
        subject = session.get(Subject, payload.subject_id)
        if not subject:
            raise NariError("SUBJECT_NOT_FOUND", f"Subject {payload.subject_id} not found", 404)

        # 2. Check for existing active session
        active = self.get_active(session)
        if active:
            raise NariError("SESSION_ALREADY_ACTIVE", "A study session is already in progress", 409)

        # 3. Create new session
        study_session = StudySession(
            subject_id=payload.subject_id,
            goal_text=payload.goal_text,
            status=StudySessionStatus.RUNNING,
            duration_seconds=0,
            interrupt_count=0,
            interruptions_json="[]"
        )
        
        session.add(study_session)
        session.commit()
        session.refresh(study_session)
        await self._emit_event(EventNames.STUDY_STARTED, study_session)
        return study_session

    async def pause(self, session: Session, session_id: int) -> StudySession:
        """Pause a running study session."""
        study_session = self.get(session, session_id)
        if study_session.status != StudySessionStatus.RUNNING:
            raise NariError("INVALID_STATUS", f"Cannot pause session in {study_session.status} status", 400)

        now = utc_now()
        
        # Calculate duration for the running segment
        last_start = study_session.resumed_at or study_session.created_at
        if last_start.tzinfo is None:
            last_start = last_start.replace(tzinfo=UTC)
            
        segment_duration = int((now - last_start).total_seconds())
        study_session.duration_seconds += segment_duration
        
        study_session.status = StudySessionStatus.PAUSED
        study_session.paused_at = now
        study_session.interrupt_count += 1
        
        # Log interruption
        interruptions = json.loads(study_session.interruptions_json or "[]")
        interruptions.append({"type": "pause", "timestamp": now.isoformat()})
        study_session.interruptions_json = json.dumps(interruptions)
        
        study_session.updated_at = now
        session.add(study_session)
        session.commit()
        session.refresh(study_session)
        await self._emit_event(EventNames.STUDY_PAUSED, study_session)
        return study_session

    async def resume(self, session: Session, session_id: int) -> StudySession:
        """Resume a paused study session."""
        study_session = self.get(session, session_id)
        if study_session.status != StudySessionStatus.PAUSED:
            raise NariError("INVALID_STATUS", f"Cannot resume session in {study_session.status} status", 400)

        now = utc_now()
        study_session.status = StudySessionStatus.RUNNING
        study_session.resumed_at = now
        
        # Log resumption
        interruptions = json.loads(study_session.interruptions_json or "[]")
        interruptions.append({"type": "resume", "timestamp": now.isoformat()})
        study_session.interruptions_json = json.dumps(interruptions)
        
        study_session.updated_at = now
        session.add(study_session)
        session.commit()
        session.refresh(study_session)
        await self._emit_event(EventNames.STUDY_RESUMED, study_session)
        return study_session

    async def stop(self, session: Session, session_id: int, notes: Optional[str] = None) -> StudySession:
        """Stop a running or paused study session."""
        study_session = self.get(session, session_id)
        if study_session.status == StudySessionStatus.COMPLETED:
            raise NariError("ALREADY_COMPLETED", "Session is already completed", 409)

        now = utc_now()
        
        # Update duration if it was running
        if study_session.status == StudySessionStatus.RUNNING:
            last_start = study_session.resumed_at or study_session.created_at
            if last_start.tzinfo is None:
                last_start = last_start.replace(tzinfo=UTC)
            segment_duration = int((now - last_start).total_seconds())
            study_session.duration_seconds += segment_duration

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

    def get(self, session: Session, session_id: int) -> StudySession:
        study_session = session.get(StudySession, session_id)
        if not study_session:
            raise NariError("SESSION_NOT_FOUND", f"Study session {session_id} not found", 404)
        return study_session

    def get_active(self, session: Session) -> Optional[StudySession]:
        """Return the currently running or paused session, if any."""
        statement = select(StudySession).where(
            or_(
                StudySession.status == StudySessionStatus.RUNNING,
                StudySession.status == StudySessionStatus.PAUSED
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

    def to_data(self, study_session: StudySession) -> dict[str, Any]:
        return {
            "id": study_session.id,
            "subject_id": study_session.subject_id,
            "status": study_session.status.value,
            "goal_text": study_session.goal_text,
            "notes": study_session.notes,
            "duration_seconds": study_session.duration_seconds,
            "interrupt_count": study_session.interrupt_count,
            "interruptions": json.loads(study_session.interruptions_json or "[]"),
            "paused_at": study_session.paused_at.isoformat() if study_session.paused_at else None,
            "resumed_at": study_session.resumed_at.isoformat() if study_session.resumed_at else None,
            "ended_at": study_session.ended_at.isoformat() if study_session.ended_at else None,
            "created_at": study_session.created_at.isoformat(),
            "updated_at": study_session.updated_at.isoformat(),
        }

    def _emit_event(self, event: EventNames, study_session: StudySession) -> None:
        get_event_bus().emit_ws_event(
            event=event.value,
            entity_type=EntityType.STUDY_SESSION.value,
            entity_id=study_session.id,
            data=self.to_data(study_session),
        )


study_service = StudyService()
