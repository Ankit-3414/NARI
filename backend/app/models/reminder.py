"""Reminder model with scheduler integration."""

from datetime import datetime
from typing import Optional

from sqlmodel import Field, Index

from ..core.constants import ReminderStatus
from ..db.base import BaseModel


class Reminder(BaseModel, table=True):
    """Reminder table - scheduled notifications.

    Supports one-time and recurring reminders (RRULE).
    Triggered by APScheduler jobs.
    """
    __tablename__ = "reminders"

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
        foreign_key="tasks.id",
        sa_column_kwargs={"nullable": True, "index": True},
        description="Associated task",
    )
    subject_id: Optional[int] = Field(
        default=None,
        foreign_key="subjects.id",
        sa_column_kwargs={"nullable": True, "index": True},
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
    is_active: bool = Field(
        default=True,
        sa_column_kwargs={"nullable": False, "index": True},
        description="Whether the reminder is active",
    )
    is_locked_in: bool = Field(
        default=False,
        sa_column_kwargs={"nullable": False, "index": True},
        description="Whether user confirmed attendance via Pre-Flight Intercept",
    )
    locked_in_at: Optional[datetime] = Field(
        default=None,
        sa_column_kwargs={"nullable": True},
        description="Timestamp of user confirmation",
    )

    __table_args__ = (
        Index("idx_reminders_task", "task_id"),
        Index("idx_reminders_subject", "subject_id"),
    )
