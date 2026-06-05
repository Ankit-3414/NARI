"""Habit service."""

from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any, Optional

from sqlmodel import Session, select

from ..core.constants import EntityType, HabitFrequency
from ..core.errors import NariError
from ..core.events import get_event_bus
from ..models.habit import Habit, HabitLog
from ..schemas.habit import HabitCreate, HabitUpdate, HabitLogCreate
from ..utils.datetime_utils import utc_now
from ..websocket.events import EventNames


class HabitService:
    """Business logic for habit management."""

    async def create(self, session: Session, payload: HabitCreate) -> Habit:
        """Create a new habit."""
        habit = Habit(**payload.model_dump())
        
        session.add(habit)
        session.commit()
        session.refresh(habit)
        
        await self._emit_event(EventNames.HABIT_CREATED, habit)
        return habit

    def get(self, session: Session, habit_id: int) -> Habit:
        habit = session.get(Habit, habit_id)
        if not habit:
            raise NariError("HABIT_NOT_FOUND", f"Habit {habit_id} not found", 404)
        return habit

    def list(self, session: Session) -> list[Habit]:
        statement = select(Habit).order_by(Habit.created_at.desc())
        return list(session.exec(statement).all())

    async def update(self, session: Session, habit_id: int, payload: HabitUpdate) -> Habit:
        """Update a habit."""
        habit = self.get(session, habit_id)
        updates = payload.model_dump(exclude_unset=True)
        
        for key, value in updates.items():
            setattr(habit, key, value)
            
        habit.updated_at = utc_now()
        session.add(habit)
        session.commit()
        session.refresh(habit)
        
        await self._emit_event(EventNames.HABIT_UPDATED, habit)
        return habit

    async def delete(self, session: Session, habit_id: int) -> Habit:
        """Delete a habit."""
        habit = self.get(session, habit_id)
        session.delete(habit)
        session.commit()
        await self._emit_event(EventNames.HABIT_DELETED, habit)
        return habit

    async def complete(self, session: Session, habit_id: int, payload: HabitLogCreate) -> Habit:
        """Log a habit completion and update streak."""
        habit = self.get(session, habit_id)
        now = utc_now()
        
        # Create log entry
        log = HabitLog(
            habit_id=habit_id,
            created_at=now,
            note=payload.note
        )
        session.add(log)
        
        # Update streak logic
        self._update_streak(habit, now)
        
        habit.last_completed_at = now
        habit.updated_at = now
        
        session.add(habit)
        session.commit()
        session.refresh(habit)
        
        await self._emit_event(EventNames.HABIT_COMPLETED, habit)
        await self._emit_event(EventNames.HABIT_STREAK_UPDATED, habit)
        return habit

    def list_logs(self, session: Session, habit_id: int, limit: int = 30) -> list[HabitLog]:
        """Get completion logs for a habit."""
        statement = select(HabitLog).where(HabitLog.habit_id == habit_id).order_by(HabitLog.created_at.desc()).limit(limit)
        return list(session.exec(statement).all())

    def _update_streak(self, habit: Habit, completion_time: datetime) -> None:
        """Calculate and update habit streaks."""
        if not habit.last_completed_at:
            habit.current_streak = 1
        else:
            diff = completion_time.date() - habit.last_completed_at.date()
            
            if habit.frequency == HabitFrequency.DAILY:
                if diff == timedelta(days=1):
                    habit.current_streak += 1
                elif diff > timedelta(days=1):
                    habit.current_streak = 1
                # If diff is 0, they already completed it today; streak doesn't change
            elif habit.frequency == HabitFrequency.WEEKLY:
                # Simplistic weekly check: if same week, no change; if next week, +1; else reset
                # This is a bit simplified for a POC
                if diff > timedelta(days=7):
                    habit.current_streak = 1
                elif diff >= timedelta(days=1):
                    # Should check week numbers really
                    habit.current_streak += 1
        
        if habit.current_streak > habit.best_streak:
            habit.best_streak = habit.current_streak

    def to_data(self, habit: Habit) -> dict[str, Any]:
        return {
            "id": habit.id,
            "name": habit.name,
            "description": habit.description,
            "frequency": habit.frequency.value,
            "target_count": habit.target_count,
            "current_streak": habit.current_streak,
            "best_streak": habit.best_streak,
            "last_completed_at": habit.last_completed_at.isoformat() if habit.last_completed_at else None,
            "created_at": habit.created_at.isoformat(),
            "updated_at": habit.updated_at.isoformat(),
        }

    async def _emit_event(self, event: EventNames, habit: Habit) -> None:
        await get_event_bus().emit_ws_event(
            event=event.value,
            entity_type=EntityType.HABIT.value,
            entity_id=habit.id,
            data=self.to_data(habit),
        )


habit_service = HabitService()
