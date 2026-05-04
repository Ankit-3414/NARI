"""Reminder model with scheduler integration."""

from sqlmodel import SQLModel, Field, Index
from typing import Optional
from datetime import datetime
from ..core.constants import ReminderStatus


class Reminder(SQLModel, table=True):
    """Reminder table - scheduled notifications.

    Supports one-time and recurring reminders (RRULE).
    Triggered by APScheduler jobs.
    """
    __tablename__ = "reminders"

    id: Optional[int] = Field(
        default=None,
        primary_key=True,
        description="Primary key",
    )
    title: str = Field(
        sa_column_kwargs={"nullable": False},
        description="Reminder title",
        max_length=200,
    )
    message: Optional[str] = Field(
        default=None,
        sa_column_kwargs={"nullable": True},
        description="Reminder message body",
        max_length=500,
    )
    due_at: datetime = Field(
        sa_column_kwargs={"nullable": False, "index": True},
        description="Due timestamp",
    )
    repeat_rule: Optional[str] = Field(
        default=None,
        sa_column_kwargs={"nullable": True},
        description="RRULE format recurrence (RFC 5545)",
    )
    status: ReminderStatus = Field(
        default=ReminderStatus.SCHEDULED,
        sa_column_kwargs={"nullable": False, "index": True},
        description="Reminder status",
    )
    task_id: Optional[int] = Field(
        default=None,
        sa_column_kwargs={"nullable": True, "foreign_key": "tasks.id", "index": True},
        description="Associated task",
    )
    subject_id: Optional[int] = Field(
        default=None,
        sa_column_kwargs={"nullable": True, "foreign_key": "subjects.id", "index": True},
        description="Associated subject",
    )
    triggered_at: Optional[datetime] = Field(
        default=None,
        sa_column_kwargs={"nullable": True, "index": True},
        description="Triggered timestamp",
    )
    snoozed_until: Optional[datetime] = Field(
        default=None,
        sa_column_kwargs={"nullable": True, "index": True},
        description="Snoozed until timestamp",
    )

    __table_args__ = (
        Index("idx_reminders_task", "task_id"),
        Index("idx_reminders_subject", "subject_id"),
    )