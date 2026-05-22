"""Note model with versioning.

Notes are auto-versioned on every save. NoteVersion provides full history.
"""

from datetime import datetime
from typing import Optional

from sqlmodel import Field, Index

from ..db.base import BaseModel


class Note(BaseModel, table=True):
    """Note table - stores markdown notes with version history."""
    __tablename__ = "notes"

    title: str = Field(
        sa_column_kwargs={"nullable": False},
        description="Note title",
        max_length=200,
    )
    content_markdown: str = Field(
        default="",
        sa_column_kwargs={"nullable": False},
        description="Note content in markdown",
    )
    summary: Optional[str] = Field(
        default=None,
        sa_column_kwargs={"nullable": True},
        description="AI-generated summary (reserved for Stage 9)",
    )
    subject_id: Optional[int] = Field(
        default=None,
        foreign_key="subjects.id",
        sa_column_kwargs={"nullable": True, "index": True},
        description="Associated subject",
    )
    tags_json: Optional[str] = Field(
        default=None,
        sa_column_kwargs={"nullable": True},
        description="Tags as JSON array",
    )
    archived_at: Optional[datetime] = Field(
        default=None,
        sa_column_kwargs={"nullable": True, "index": True},
        description="Archive timestamp (soft delete)",
    )

    __table_args__ = (
        Index("idx_notes_subject", "subject_id"),
        Index("idx_notes_archived", "archived_at"),
    )


class NoteVersion(BaseModel, table=True):
    """Note version history - snapshot on every save.

    Enables full version history and rollback capability.
    Auto-saved on every note update.
    """
    __tablename__ = "note_versions"

    note_id: int = Field(
        foreign_key="notes.id",
        sa_column_kwargs={"nullable": False, "index": True},
        description="Parent note",
    )
    version_number: int = Field(
        sa_column_kwargs={"nullable": False, "index": True},
        description="Version number (auto-incremented)",
    )
    content_markdown: str = Field(
        sa_column_kwargs={"nullable": False},
        description="Note content at this version",
    )
    change_note: Optional[str] = Field(
        default=None,
        sa_column_kwargs={"nullable": True},
        description="Optional user label for this version",
        max_length=200,
    )

    __table_args__ = (
        Index("idx_note_versions_note", "note_id", "version_number"),
    )
