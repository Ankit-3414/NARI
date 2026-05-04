"""Note model with versioning.

Notes are auto-versioned on every save. NoteVersion provides full history.
"""

from sqlmodel import SQLModel, Field, Relationship, Index
from typing import Optional, List
from datetime import datetime
from ..core.constants import EntityType


class Note(SQLModel, table=True):
    """Note table - stores markdown notes with version history."""
    __tablename__ = "notes"

    id: Optional[int] = Field(
        default=None,
        primary_key=True,
        description="Primary key",
    )
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
        sa_column_kwargs={"nullable": True, "foreign_key": "subjects.id", "index": True},
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


class NoteVersion(SQLModel, table=True):
    """Note version history - snapshot on every save.

    Enables full version history and rollback capability.
    Auto-saved on every note update.
    """
    __tablename__ = "note_versions"

    id: Optional[int] = Field(
        default=None,
        primary_key=True,
        description="Primary key",
    )
    note_id: int = Field(
        sa_column_kwargs={"nullable": False, "foreign_key": "notes.id", "index": True},
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
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column_kwargs={"nullable": False, "index": True},
        description="Version creation timestamp",
    )

    __table_args__ = (
        Index("idx_note_versions_note", "note_id", "version_number"),
    )