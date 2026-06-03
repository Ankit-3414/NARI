"""Task Pydantic schemas."""

from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from ..core.constants import TaskPriority, TaskStatus


class TaskBase(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: Optional[str] = None
    priority: TaskPriority = TaskPriority.NORMAL
    due_date: Optional[date] = None
    subject_id: Optional[int] = None
    tags: Optional[list[str]] = None
    estimated_minutes: Optional[int] = None
    actual_minutes: Optional[int] = None
    recurrence_rule: Optional[str] = None
    parent_task_id: Optional[int] = None
    location_id: Optional[int] = None


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[TaskPriority] = None
    status: Optional[TaskStatus] = None
    due_date: Optional[date] = None
    subject_id: Optional[int] = None
    tags: Optional[list[str]] = None
    estimated_minutes: Optional[int] = None
    actual_minutes: Optional[int] = None
    recurrence_rule: Optional[str] = None
    parent_task_id: Optional[int] = None
    location_id: Optional[int] = None


class TaskResponse(TaskBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    status: TaskStatus
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class TaskHistoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    task_id: int
    action: str
    old_data_json: Optional[str]
    new_data_json: str
    changed_at: datetime
    changed_by: str
