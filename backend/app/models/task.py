"""Task model with full history tracking."""

from datetime import date, datetime
from typing import Optional

from sqlmodel import Field, Index, SQLModel

from ..core.constants import TaskPriority, TaskStatus
from ..db.base import BaseModel
from ..utils.datetime_utils import utc_naive


class Task(BaseModel, table=True):
    """Task table - main task management."""
    __tablename__ = "tasks"

    title: str = Field(
        sa_column_kwargs={"nullable": False},
        description="Task title",
        max_length=200,
    )
    description: Optional[str] = Field(
        default=None,
        sa_column_kwargs={"nullable": True},
        description="Task description",
    )
    priority: TaskPriority = Field(
        default=TaskPriority.NORMAL,
        sa_column_kwargs={"nullable": False},
        description="Task priority",
    )
    status: TaskStatus = Field(
        default=TaskStatus.PENDING,
        sa_column_kwargs={"nullable": False, "index": True},
        description="Task status",
    )
    due_date: Optional[date] = Field(
        default=None,
        sa_column_kwargs={"nullable": True},
        description="Due date",
    )
    subject_id: Optional[int] = Field(
        default=None,
        sa_column_kwargs={"nullable": True},
        description="Associated subject",
    )
    tags_json: Optional[str] = Field(
        default=None,
        sa_column_kwargs={"nullable": True},
        description="Tags as JSON array",
    )
    estimated_minutes: Optional[int] = Field(
        default=None,
        sa_column_kwargs={"nullable": True},
        description="Estimated time in minutes",
    )
    actual_minutes: Optional[int] = Field(
        default=None,
        sa_column_kwargs={"nullable": True},
        description="Actual time spent in minutes",
    )
    recurrence_rule: Optional[str] = Field(
        default=None,
        sa_column_kwargs={"nullable": True},
        description="RRULE format recurrence",
        max_length=200,
    )
    parent_task_id: Optional[int] = Field(
        default=None,
        foreign_key="tasks.id",
        sa_column_kwargs={"nullable": True},
        description="Parent task for subtasks",
    )
    sort_index: int = Field(
        default=0,
        sa_column_kwargs={"nullable": False},
        description="Sort order for tasks",
    )
    location_id: Optional[int] = Field(
        default=None,
        foreign_key="location_nodes.id",
        sa_column_kwargs={"nullable": True},
        description="Linked physical location",
    )
    completed_at: Optional[datetime] = Field(
        default=None,
        sa_column_kwargs={"nullable": True},
        description="Completion timestamp",
    )

    __table_args__ = (
        Index("idx_tasks_subject", "subject_id"),
        Index("idx_tasks_due_date", "due_date"),
        Index("idx_tasks_status", "status"),
        Index("idx_tasks_parent", "parent_task_id"),
    )


class TaskHistory(BaseModel, table=True):
    """Task history - full audit trail of every task change.

    Written on every task modification. Never deleted or updated.
    """
    __tablename__ = "task_history"

    task_id: int = Field(
        foreign_key="tasks.id",
        sa_column_kwargs={"nullable": False, "index": True},
        description="Task reference",
    )
    action: str = Field(
        sa_column_kwargs={"nullable": False},
        description="Action (created|updated|completed|reopened|deleted)",
        max_length=50,
    )
    old_data_json: Optional[str] = Field(
        default=None,
        sa_column_kwargs={"nullable": True},
        description="Snapshot before change",
    )
    new_data_json: str = Field(
        sa_column_kwargs={"nullable": False},
        description="Snapshot after change",
    )
    changed_at: datetime = Field(
        default_factory=utc_naive,
        sa_column_kwargs={"nullable": False, "index": True},
        description="Change timestamp",
    )
    changed_by: str = Field(
        default="user",
        sa_column_kwargs={"nullable": False},
        description="Who made the change",
        max_length=50,
    )
