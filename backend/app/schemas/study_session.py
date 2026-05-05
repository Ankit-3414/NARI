"""Study session Pydantic schemas."""

from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime
from ..core.constants import StudySessionStatus


class StudySessionBase(BaseModel):
    subject_id: int
    goal_text: Optional[str] = None


class StudySessionCreate(StudySessionBase):
    pass


class StudySessionUpdate(BaseModel):
    status: Optional[StudySessionStatus] = None
    goal_text: Optional[str] = None
    notes: Optional[str] = None
    paused_at: Optional[datetime] = None
    resumed_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    duration_seconds: Optional[int] = None
    interrupt_count: Optional[int] = None
    interruptions_json: Optional[str] = None


class StudySessionResponse(StudySessionBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    status: StudySessionStatus
    notes: Optional[str] = None
    paused_at: Optional[datetime] = None
    resumed_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    duration_seconds: int
    interrupt_count: int
    interruptions_json: Optional[str] = None
    created_at: datetime
    updated_at: datetime
