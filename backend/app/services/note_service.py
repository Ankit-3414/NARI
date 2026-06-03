"""Note service."""

from __future__ import annotations

import json
from datetime import datetime
from typing import Any, Optional

from sqlmodel import Session, select, func

from ..core.constants import EntityType
from ..core.errors import NariError
from ..core.events import get_event_bus
from ..models.note import Note, NoteVersion
from ..models.subject import Subject
from ..schemas.note import NoteCreate, NoteUpdate
from ..utils.datetime_utils import utc_now
from ..utils.tag_utils import decode_tags, encode_tags
from ..websocket.events import EventNames


class NoteService:
    """Business logic for markdown notes and versioning."""

    async def create(self, session: Session, payload: NoteCreate) -> Note:
        """Create a new note and its first version."""
        if payload.subject_id:
            subject = session.get(Subject, payload.subject_id)
            if not subject:
                raise NariError("SUBJECT_NOT_FOUND", f"Subject {payload.subject_id} not found", 404)

        data = payload.model_dump()
        tags = data.pop("tags", None)
        content = data.get("content_markdown", "")
        
        note = Note(
            **data,
            tags_json=self._encode_tags(tags)
        )
        
        session.add(note)
        session.flush()  # Get note.id
        
        # Create first version
        self._add_version(session, note.id, 1, content, "Initial version")
        
        session.commit()
        session.refresh(note)
        await self._emit_event(EventNames.NOTE_CREATED, note)
        return note

    def get(self, session: Session, note_id: int) -> Note:
        note = session.get(Note, note_id)
        if not note:
            raise NariError("NOTE_NOT_FOUND", f"Note {note_id} not found", 404)
        return note

    def list(
        self,
        session: Session,
        *,
        subject_id: Optional[int] = None,
        tag: Optional[str] = None,
        include_archived: bool = False,
    ) -> list[Note]:
        statement = select(Note)
        if not include_archived:
            statement = statement.where(Note.archived_at == None)
        if subject_id:
            statement = statement.where(Note.subject_id == subject_id)
        
        notes = list(session.exec(statement.order_by(Note.updated_at.desc())).all())
        if tag:
            return [n for n in notes if tag in self._decode_tags(n.tags_json)]
        return notes

    async def update(self, session: Session, note_id: int, payload: NoteUpdate) -> Note:
        """Update a note and create a new version if content changed."""
        note = self.get(session, note_id)
        updates = payload.model_dump(exclude_unset=True)
        change_note = updates.pop("change_note", "Update")
        
        content_changed = "content_markdown" in updates and updates["content_markdown"] != note.content_markdown
        
        if "tags" in updates:
            note.tags_json = self._encode_tags(updates.pop("tags"))
        
        for key, value in updates.items():
            setattr(note, key, value)
            
        note.updated_at = utc_now()
        session.add(note)
        
        if content_changed:
            # Determine next version number
            next_version = session.exec(
                select(func.max(NoteVersion.version_number)).where(NoteVersion.note_id == note_id)
            ).one() + 1
            self._add_version(session, note_id, next_version, note.content_markdown, change_note)
            
        session.commit()
        session.refresh(note)
        await self._emit_event(EventNames.NOTE_UPDATED, note)
        return note

    async def delete(self, session: Session, note_id: int) -> Note:
        """Soft delete a note."""
        note = self.get(session, note_id)
        note.archived_at = utc_now()
        note.updated_at = utc_now()
        
        session.add(note)
        session.commit()
        session.refresh(note)
        await self._emit_event(EventNames.NOTE_DELETED, note)
        return note

    def get_versions(self, session: Session, note_id: int) -> list[NoteVersion]:
        """Get all versions of a note."""
        self.get(session, note_id)
        statement = select(NoteVersion).where(NoteVersion.note_id == note_id).order_by(NoteVersion.version_number.desc())
        return list(session.exec(statement).all())

    def get_version(self, session: Session, note_id: int, version_number: int) -> NoteVersion:
        """Get a specific version of a note."""
        statement = select(NoteVersion).where(
            NoteVersion.note_id == note_id,
            NoteVersion.version_number == version_number
        )
        version = session.exec(statement).first()
        if not version:
            raise NariError("VERSION_NOT_FOUND", f"Version {version_number} of note {note_id} not found", 404)
        return version

    def to_data(self, note: Note) -> dict[str, Any]:
        return {
            "id": note.id,
            "title": note.title,
            "content_markdown": note.content_markdown,
            "summary": note.summary,
            "subject_id": note.subject_id,
            "tags": self._decode_tags(note.tags_json),
            "archived_at": note.archived_at.isoformat() if note.archived_at else None,
            "created_at": note.created_at.isoformat(),
            "updated_at": note.updated_at.isoformat(),
        }

    def _add_version(
        self,
        session: Session,
        note_id: int,
        version_number: int,
        content: str,
        change_note: str
    ) -> None:
        version = NoteVersion(
            note_id=note_id,
            version_number=version_number,
            content_markdown=content,
            change_note=change_note
        )
        session.add(version)

    async def _emit_event(self, event: EventNames, note: Note) -> None:
        await get_event_bus().emit_ws_event(
            event=event.value,
            entity_type=EntityType.NOTE.value,
            entity_id=note.id,
            data=self.to_data(note),
        )

    def _encode_tags(self, tags: list[str] | None) -> str | None:
        return encode_tags(tags)

    def _decode_tags(self, tags_json: str | None) -> list[str]:
        return decode_tags(tags_json)


note_service = NoteService()
