"""Habit model with streak tracking."""

from sqlmodel import SQLModel, Field, Relationship, Index
from typing import Optional, List
from datetime import datetime
from ..core.constants import HabitFrequency


class Habit(SQLModel, table=True):
    """Habit table - tracks daily/weekly repeating habits.

    Streaks are calculated from habit_logs entries.
    """
    __tablename__ = "habits"

    id: Optional[int] = Field(
        default=None,
        primary_key=True,
        description="Primary key",
    )
    name: str = Field(
        sa_column_kwargs={"nullable": False},
        description="Habit name",
        max_length=100,
    )
    description: Optional[str] = Field(
        default=None,
        sa_column_kwargs={"nullable": True},
        description="Habit description",
    )
    frequency: HabitFrequency = Field(
        default=HabitFrequency.DAILY,
        sa_column_kwargs={"nullable": False},
        description="Habit frequency",
    )
    target_count: int = Field(
        default=1,
        sa_column_kwargs={"nullable": False},
        description="Target completions per period",
    )
    current_streak: int = Field(
        default=0,
        sa_column_kwargs={"nullable": False},
        description="Current consecutive streak",
    )
    best_streak: int = Field(
        default=0,
        sa_column_kwargs={"nullable": False},
        description="Best streak ever achieved",
    )
    last_completed_at: Optional[datetime] = Field(
        default=None,
        sa_column_kwargs={"nullable": True, "index": True},
        description="Last completion timestamp",
    )

    __table_args__ = (
        Index("idx_habits_frequency", "frequency"),
    )


class HabitLog(SQLModel, table=True):
    """Habit log - records each habit completion.

    Writing to this table triggers streak recalculation in the service.
    """
    __tablename__ = "habit_logs"

    id: Optional[int] = Field(
        default=None,
        primary_key=True,
        description="Primary key",
    )
    habit_id: int = Field(
        sa_column_kwargs={"nullable": False, "foreign_key": "habits.id", "index": True},
        description="Habit reference",
    )
    completed_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column_kwargs={"nullable": False, "index": True},
        description="Completion timestamp",
    )
    note: Optional[str] = Field(
        default=None,
        sa_column_kwargs={"nullable": True},
        description="Optional note",
        max_length=200,
    )