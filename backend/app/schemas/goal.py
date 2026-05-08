"""Goal schemas."""

from datetime import date
from typing import Optional

from pydantic import BaseModel, ConfigDict

from ..core.constants import GoalScope, GoalStatus


class GoalBase(BaseModel):
    title: str
    description: Optional[str] = None
    scope: GoalScope = GoalScope.WEEKLY
    status: GoalStatus = GoalStatus.ACTIVE
    target_value: Optional[int] = None
    current_value: int = 0
    start_date: Optional[date] = None
    due_date: Optional[date] = None
    parent_goal_id: Optional[int] = None


class GoalCreate(GoalBase):
    pass


class GoalUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    scope: Optional[GoalScope] = None
    status: Optional[GoalStatus] = None
    target_value: Optional[int] = None
    current_value: Optional[int] = None
    start_date: Optional[date] = None
    due_date: Optional[date] = None
    parent_goal_id: Optional[int] = None


class GoalRead(GoalBase):
    id: int
    model_config = ConfigDict(from_attributes=True)
