"""Reminder service."""

from __future__ import annotations

import json
from datetime import datetime, timedelta
from typing import Any, Optional

from sqlmodel import Session, select, and_, or_

from ..core.constants import EntityType, ReminderStatus
from ..core.errors import NariError
from ..core.events import get_event_bus
from ..models.reminder import Reminder
from ..schemas.reminder import ReminderCreate, ReminderUpdate
from ..utils.datetime_utils import utc_now
from ..websocket.events import EventNames


class ReminderService:
    """Business logic for reminder management."""

    async def create(self, session: Session, payload: ReminderCreate) -> Reminder:
        """Create a new reminder and schedule it."""
        reminder = Reminder(**payload.model_dump())
        
        session.add(reminder)
        session.commit()
        session.refresh(reminder)
        
        await self._emit_event(EventNames.REMINDER_CREATED, reminder)
        # TODO: Trigger scheduler update
        return reminder

    def get(self, session: Session, reminder_id: int) -> Reminder:
        reminder = session.get(Reminder, reminder_id)
        if not reminder:
            raise NariError("REMINDER_NOT_FOUND", f"Reminder {reminder_id} not found", 404)
        return reminder

    def list(
        self,
        session: Session,
        *,
        status: Optional[ReminderStatus] = None,
        task_id: Optional[int] = None,
        subject_id: Optional[int] = None,
        include_triggered: bool = False,
    ) -> list[Reminder]:
        statement = select(Reminder)
        if status:
            statement = statement.where(Reminder.status == status)
        elif not include_triggered:
            statement = statement.where(
                or_(
                    Reminder.status == ReminderStatus.SCHEDULED,
                    Reminder.status == ReminderStatus.SNOOZED
                )
            )
            
        if task_id:
            statement = statement.where(Reminder.task_id == task_id)
        if subject_id:
            statement = statement.where(Reminder.subject_id == subject_id)
            
        statement = statement.order_by(Reminder.due_at)
        return list(session.exec(statement).all())

    async def update(self, session: Session, reminder_id: int, payload: ReminderUpdate) -> Reminder:
        """Update a reminder."""
        reminder = self.get(session, reminder_id)
        updates = payload.model_dump(exclude_unset=True)
        
        for key, value in updates.items():
            setattr(reminder, key, value)
            
        reminder.updated_at = utc_now()
        session.add(reminder)
        session.commit()
        session.refresh(reminder)
        
        await self._emit_event(EventNames.REMINDER_UPDATED, reminder)
        # TODO: Trigger scheduler update
        return reminder

    async def delete(self, session: Session, reminder_id: int) -> Reminder:
        """Delete a reminder."""
        reminder = self.get(session, reminder_id)
        session.delete(reminder)
        session.commit()
        await self._emit_event(EventNames.REMINDER_DELETED, reminder)
        return reminder

    async def trigger(self, session: Session, reminder_id: int) -> Reminder:
        """Mark a reminder as triggered."""
        reminder = self.get(session, reminder_id)
        reminder.status = ReminderStatus.TRIGGERED
        reminder.triggered_at = utc_now()
        reminder.updated_at = utc_now()
        
        session.add(reminder)
        session.commit()
        session.refresh(reminder)
        
        await self._emit_event(EventNames.REMINDER_TRIGGERED, reminder)
        return reminder

    async def snooze(self, session: Session, reminder_id: int, minutes: int = 15) -> Reminder:
        """Snooze a reminder."""
        reminder = self.get(session, reminder_id)
        reminder.status = ReminderStatus.SNOOZED
        reminder.snoozed_until = utc_now() + timedelta(minutes=minutes)
        reminder.updated_at = utc_now()
        
        session.add(reminder)
        session.commit()
        session.refresh(reminder)
        
        await self._emit_event(EventNames.REMINDER_SNOOZED, reminder)
        # TODO: Trigger scheduler update
        return reminder

    async def dismiss(self, session: Session, reminder_id: int) -> Reminder:
        """Dismiss a reminder and reschedule if recurring."""
        from dateutil.rrule import rrulestr
        
        reminder = self.get(session, reminder_id)
        reminder.status = ReminderStatus.DISMISSED
        reminder.updated_at = utc_now()
        
        # Handle Recurrence
        if reminder.repeat_rule:
            try:
                # Calculate next occurrence based on the ORIGINAL due_at
                rule = rrulestr(reminder.repeat_rule, dtstart=reminder.due_at)
                next_occurrence = rule.after(reminder.due_at)
                
                if next_occurrence:
                    # Reset current reminder to next occurrence
                    reminder.due_at = next_occurrence
                    reminder.status = ReminderStatus.SCHEDULED
                    reminder.triggered_at = None
                    reminder.snoozed_until = None
                    reminder.updated_at = utc_now()
            except Exception as e:
                # Log error but don't fail dismissal
                print(f"Error calculating next occurrence: {e}")
        
        session.add(reminder)
        session.commit()
        session.refresh(reminder)
        
        await self._emit_event(EventNames.REMINDER_DISMISSED, reminder)
        return reminder

    def to_data(self, reminder: Reminder) -> dict[str, Any]:
        return {
            "id": reminder.id,
            "title": reminder.title,
            "message": reminder.message,
            "due_at": reminder.due_at.isoformat(),
            "repeat_rule": reminder.repeat_rule,
            "status": reminder.status.value,
            "task_id": reminder.task_id,
            "subject_id": reminder.subject_id,
            "triggered_at": reminder.triggered_at.isoformat() if reminder.triggered_at else None,
            "snoozed_until": reminder.snoozed_until.isoformat() if reminder.snoozed_until else None,
            "created_at": reminder.created_at.isoformat(),
            "updated_at": reminder.updated_at.isoformat(),
        }

    async def _emit_event(self, event: EventNames, reminder: Reminder) -> None:
        await get_event_bus().emit_ws_event(
            event=event.value,
            entity_type=EntityType.REMINDER.value,
            entity_id=reminder.id,
            data=self.to_data(reminder),
        )


reminder_service = ReminderService()
