from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict
from ..core.constants import ReminderStatus

class ReminderBase(BaseModel):
    title: str = Field(..., max_length=200)
    message: Optional[str] = Field(None, max_length=500)
    due_at: datetime
    repeat_rule: Optional[str] = None
    task_id: Optional[int] = None
    subject_id: Optional[int] = None

class ReminderCreate(ReminderBase):
    pass

class ReminderUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=200)
    message: Optional[str] = Field(None, max_length=500)
    due_at: Optional[datetime] = None
    repeat_rule: Optional[str] = None
    status: Optional[ReminderStatus] = None

class ReminderRead(ReminderBase):
    id: int
    status: ReminderStatus
    triggered_at: Optional[datetime] = None
    snoozed_until: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
