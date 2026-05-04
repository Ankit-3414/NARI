"""Goal model with hierarchical tree support."""

from sqlmodel import SQLModel, Field, Index
from typing import Optional
from datetime import datetime, date
from ..core.constants import GoalScope, GoalStatus


class Goal(SQLModel, table=True):
    """Goal table - tracks long-term objectives with hierarchy.

    Supports parent/child relationships for nested goals:
    Yearly → Quarterly → Monthly → Weekly → Daily
    """
    __tablename__ = "goals"

    id: Optional[int] = Field(
        default=None,
        primary_key=True,
        description="Primary key",
    )
    title: str = Field(
        sa_column_kwargs={"nullable": False},
        description="Goal title",
        max_length=200,
    )
    description: Optional[str] = Field(
        default=None,
        sa_column_kwargs={"nullable": True},
        description="Goal description",
    )
    scope: GoalScope = Field(
        default=GoalScope.WEEKLY,
        sa_column_kwargs={"nullable": False, "index": True},
        description="Goal scope/period",
    )
    status: GoalStatus = Field(
        default=GoalStatus.ACTIVE,
        sa_column_kwargs={"nullable": False, "index": True},
        description="Goal status",
    )
    target_value: Optional[int] = Field(
        default=None,
        sa_column_kwargs={"nullable": True},
        description="Target value (e.g., 10 tasks, 20 study hours)",
    )
    current_value: int = Field(
        default=0,
        sa_column_kwargs={"nullable": False},
        description="Current progress value",
    )
    start_date: Optional[date] = Field(
        default=None,
        sa_column_kwargs={"nullable": True},
        description="Goal start date",
    )
    due_date: Optional[date] = Field(
        default=None,
        sa_column_kwargs={"nullable": True, "index": True},
        description="Goal due date",
    )
    parent_goal_id: Optional[int] = Field(
        default=None,
        sa_column_kwargs={"nullable": True, "foreign_key": "goals.id", "index": True},
        description="Parent goal for hierarchy",
    )

    __table_args__ = (
        Index("idx_goals_parent", "parent_goal_id"),
    )