"""Task Pydantic schemas."""

from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime
from ..core.constants import TaskStatus, TaskPriority


class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    priority: TaskPriority = TaskPriority.NORMAL
    status: TaskStatus = TaskStatus.PENDING
    due_date: Optional[datetime] = None
    subject_id: Optional[int] = None
    tags: Optional[List[str]] = None
    estimated_minutes: Optional[int] = None
    actual_minutes: Optional[int] = None
    recurrence_rule: Optional[str] = None
    parent_task_id: Optional[int] = None


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[TaskPriority] = None
    status: Optional[TaskStatus] = None
    due_date: Optional[datetime] = None
    subject_id: Optional[int] = None
    tags: Optional[List[str]] = None
    estimated_minutes: Optional[int] = None
    actual_minutes: Optional[int] = None
    recurrence_rule: Optional[str] = None
    parent_task_id: Optional[int] = None


class TaskResponse(TaskBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
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