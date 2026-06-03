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
    is_active: bool = True

class ReminderCreate(ReminderBase):
    status: Optional[ReminderStatus] = None

class ReminderUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=200)
    message: Optional[str] = Field(None, max_length=500)
    due_at: Optional[datetime] = None
    repeat_rule: Optional[str] = None
    status: Optional[ReminderStatus] = None
    is_active: Optional[bool] = None

class ReminderRead(ReminderBase):
    id: int
    status: ReminderStatus
    is_locked_in: bool
    locked_in_at: Optional[datetime] = None
    triggered_at: Optional[datetime] = None
    snoozed_until: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
