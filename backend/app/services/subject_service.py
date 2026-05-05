"""Subject service."""

from __future__ import annotations

import json
from datetime import datetime
from typing import Any

from sqlmodel import Session, select

from ..core.constants import EntityType
from ..core.errors import NariError
from ..core.events import get_event_bus
from ..models.subject import Subject
from ..schemas.subject import SubjectCreate, SubjectUpdate
from ..utils.datetime_utils import utc_now
from ..websocket.events import EventNames


class SubjectService:
    """Business logic for subject management."""

    def create(self, session: Session, payload: SubjectCreate) -> Subject:
        data = payload.model_dump()
        tags = data.pop("tags", None)
        subject = Subject(**data, tags_json=self._encode_tags(tags))

        session.add(subject)
        session.commit()
        session.refresh(subject)
        self._emit_event(EventNames.SUBJECT_CREATED, subject)
        return subject

    def get(self, session: Session, subject_id: int) -> Subject:
        subject = session.get(Subject, subject_id)
        if subject is None:
            raise NariError(
                "SUBJECT_NOT_FOUND",
                f"Subject with id {subject_id} does not exist",
                404,
            )
        return subject

    def list(
        self,
        session: Session,
        *,
        include_archived: bool = False,
    ) -> list[Subject]:
        statement = select(Subject)
        if not include_archived:
            statement = statement.where(Subject.archived_at == None)
        statement = statement.order_by(Subject.priority.desc(), Subject.name)
        return list(session.exec(statement).all())

    def update(self, session: Session, subject_id: int, payload: SubjectUpdate) -> Subject:
        subject = self.get(session, subject_id)
        updates = payload.model_dump(exclude_unset=True)

        if "tags" in updates:
            subject.tags_json = self._encode_tags(updates.pop("tags"))
        for key, value in updates.items():
            setattr(subject, key, value)

        subject.updated_at = utc_now()
        session.add(subject)
        session.commit()
        session.refresh(subject)
        self._emit_event(EventNames.SUBJECT_UPDATED, subject)
        return subject

    def delete(self, session: Session, subject_id: int) -> Subject:
        """Soft delete (archive) a subject."""
        subject = self.get(session, subject_id)
        subject.archived_at = utc_now()
        subject.updated_at = utc_now()

        session.add(subject)
        session.commit()
        session.refresh(subject)
        self._emit_event(EventNames.SUBJECT_ARCHIVED, subject)
        return subject

    def to_data(self, subject: Subject) -> dict[str, Any]:
        return {
            "id": subject.id,
            "name": subject.name,
            "description": subject.description,
            "difficulty": subject.difficulty,
            "priority": subject.priority,
            "exam_date": (
                subject.exam_date.isoformat() if subject.exam_date else None
            ),
            "tags": self._decode_tags(subject.tags_json),
            "archived_at": (
                subject.archived_at.isoformat() if subject.archived_at else None
            ),
            "created_at": subject.created_at.isoformat(),
            "updated_at": subject.updated_at.isoformat(),
        }

    def _emit_event(
        self,
        event: EventNames,
        subject: Subject,
    ) -> None:
        get_event_bus().emit_ws_event(
            event=event.value,
            entity_type=EntityType.SUBJECT.value,
            entity_id=subject.id,
            data=self.to_data(subject),
        )

    def _encode_tags(self, tags: list[str] | None) -> str | None:
        if tags is None:
            return None
        return json.dumps(tags)

    def _decode_tags(self, tags_json: str | None) -> list[str]:
        if not tags_json:
            return []
        return list(json.loads(tags_json))


subject_service = SubjectService()
