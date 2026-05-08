"""Habit schemas."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict

from ..core.constants import HabitFrequency


class HabitBase(BaseModel):
    name: str
    description: Optional[str] = None
    frequency: HabitFrequency = HabitFrequency.DAILY
    target_count: int = 1
    current_streak: int = 0
    best_streak: int = 0
    last_completed_at: Optional[datetime] = None


class HabitCreate(HabitBase):
    pass


class HabitUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    frequency: Optional[HabitFrequency] = None
    target_count: Optional[int] = None
    current_streak: Optional[int] = None
    best_streak: Optional[int] = None
    last_completed_at: Optional[datetime] = None


class HabitRead(HabitBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


class HabitLogBase(BaseModel):
    habit_id: Optional[int] = None
    note: Optional[str] = None


class HabitLogCreate(HabitLogBase):
    pass


class HabitLogRead(HabitLogBase):
    id: int
    completed_at: datetime
    model_config = ConfigDict(from_attributes=True)
