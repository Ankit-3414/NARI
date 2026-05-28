"""Subject Pydantic schemas."""

from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime


class SubjectBase(BaseModel):
    name: str
    description: Optional[str] = None
    difficulty: Optional[int] = None
    priority: int = 0
    exam_date: Optional[datetime] = None
    tags: Optional[list[str]] = None


class SubjectCreate(SubjectBase):
    pass


class SubjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    difficulty: Optional[int] = None
    priority: Optional[int] = None
    exam_date: Optional[datetime] = None
    tags: Optional[list[str]] = None
    archived_at: Optional[datetime] = None


class SubjectResponse(SubjectBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    archived_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime