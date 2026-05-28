"""Note Pydantic schemas."""

from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime


class NoteBase(BaseModel):
    title: str
    content_markdown: str
    subject_id: Optional[int] = None
    tags: Optional[list[str]] = None


class NoteCreate(NoteBase):
    pass


class NoteUpdate(BaseModel):
    title: Optional[str] = None
    content_markdown: Optional[str] = None
    subject_id: Optional[int] = None
    tags: Optional[list[str]] = None
    change_note: Optional[str] = None
    archived_at: Optional[datetime] = None


class NoteVersionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    version_number: int
    content_markdown: str
    change_note: Optional[str] = None
    created_at: datetime


class NoteResponse(NoteBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    summary: Optional[str] = None
    archived_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
