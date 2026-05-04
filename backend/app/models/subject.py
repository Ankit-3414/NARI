"""Subject model for organizing tasks, notes, and study sessions."""

from sqlmodel import SQLModel, Field, Index
from typing import Optional
from datetime import datetime


class Subject(SQLModel, table=True):
    """Subject table - categories for tasks, notes, and study.

    Uses soft delete (archived_at) instead of hard delete.
    """
    __tablename__ = "subjects"

    id: Optional[int] = Field(
        default=None,
        primary_key=True,
        description="Primary key",
    )
    name: str = Field(
        sa_column_kwargs={"nullable": False, "unique": True},
        description="Subject name",
        max_length=100,
    )
    description: Optional[str] = Field(
        default=None,
        sa_column_kwargs={"nullable": True},
        description="Subject description",
    )
    difficulty: Optional[int] = Field(
        default=None,
        sa_column_kwargs={"nullable": True},
        description="Difficulty level 1-5",
        ge=1,
        le=5,
    )
    priority: int = Field(
        default=0,
        sa_column_kwargs={"nullable": False},
        description="Subject priority",
    )
    exam_date: Optional[datetime] = Field(
        default=None,
        sa_column_kwargs={"nullable": True},
        description="Exam date if applicable",
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
        Index("idx_subjects_archived", "archived_at"),
    )