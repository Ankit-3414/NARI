"""Reminder service."""

from __future__ import annotations

from datetime import timedelta
from typing import Any, Optional

from sqlmodel import Session, select, and_, or_

from ..core.constants import EntityType, ReminderStatus
from ..core.errors import NariError
from ..core.events import get_event_bus
from ..core.logging import get_logger
from ..models.reminder import Reminder
from ..schemas.reminder import ReminderCreate, ReminderUpdate
from ..utils.datetime_utils import utc_now
from ..websocket.events import EventNames

logger = get_logger(__name__)


class ReminderService:
    """Business logic for reminder management."""

    async def create(self, session: Session, payload: ReminderCreate) -> Reminder:
        """Create a new reminder and schedule it."""
        reminder = Reminder(**payload.model_dump())
        
        session.add(reminder)
        session.commit()
        session.refresh(reminder)
        
        await self._emit_event(EventNames.REMINDER_CREATED, reminder)

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
        active_only: bool = False,
    ) -> list[Reminder]:
        statement = select(Reminder).where(Reminder.status != ReminderStatus.DISMISSED)
        
        if status:
            statement = statement.where(Reminder.status == status)
        elif not include_triggered:
            statement = statement.where(
                or_(
                    Reminder.status == ReminderStatus.SCHEDULED,
                    Reminder.status == ReminderStatus.SNOOZED
                )
            )
            
        if active_only:
            statement = statement.where(Reminder.is_active == True)

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

        # Dispatch Web Push
        try:
            from .push_service import push_service
            # Run async push notifications in background or await them
            await push_service.send_push_notification(
                session,
                title=f"NARI Reminder: {reminder.title}",
                body=reminder.message or "Objective due time reached."
            )
        except Exception as e:
            logger.warning(f"Failed to dispatch Web Push for reminder {reminder.id}: {e}")

        return reminder

    async def lock_in(self, session: Session, reminder_id: int) -> Reminder:
        """Lock in a reminder (confirmed attendance)."""
        reminder = self.get(session, reminder_id)
        reminder.is_locked_in = True
        reminder.locked_in_at = utc_now()
        reminder.updated_at = utc_now()
        
        session.add(reminder)
        session.commit()
        session.refresh(reminder)
        
        await self._emit_event(EventNames.REMINDER_UPDATED, reminder)
        return reminder

    async def skip(self, session: Session, reminder_id: int) -> Reminder:
        """Skip today's reminder (Intentional Skip)."""
        reminder = self.get(session, reminder_id)

        # Mark as skipped and reschedule if recurring
        return await self.dismiss(session, reminder_id, resolution=ReminderStatus.SKIPPED)

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

        return reminder

    async def dismiss(self, session: Session, reminder_id: int, resolution: ReminderStatus = ReminderStatus.DISMISSED) -> Reminder:
        """Dismiss a reminder and reschedule if recurring."""
        from dateutil.rrule import rrulestr

        reminder = self.get(session, reminder_id)
        reminder.status = resolution
        reminder.updated_at = utc_now()

        # Handle Recurrence
        if reminder.repeat_rule:
            try:
                # Calculate next occurrence strictly after max of due_at and current time to prevent drift and backlog
                now_naive = utc_now().replace(tzinfo=None) if utc_now().tzinfo else utc_now()
                due_naive = reminder.due_at.replace(tzinfo=None) if reminder.due_at.tzinfo else reminder.due_at
                rule = rrulestr(reminder.repeat_rule, dtstart=due_naive)
                next_occurrence = rule.after(max(due_naive, now_naive))
                
                if next_occurrence:
                    # Reset current reminder to next occurrence
                    reminder.due_at = next_occurrence
                    reminder.status = ReminderStatus.SCHEDULED
                    reminder.triggered_at = None
                    reminder.snoozed_until = None
                    # RESET LOCK-IN for next session
                    reminder.is_locked_in = False
                    reminder.locked_in_at = None
                    reminder.updated_at = utc_now()
            except Exception as e:
                logger.warning("Failed to calculate next reminder occurrence for %s: %s", reminder.id, e)

        
        session.add(reminder)
        session.commit()
        session.refresh(reminder)
        
        # Determine event name based on resolution
        event_map = {
            ReminderStatus.DISMISSED: EventNames.REMINDER_DISMISSED,
            ReminderStatus.SKIPPED: EventNames.REMINDER_UPDATED,
            ReminderStatus.MISSED: EventNames.REMINDER_UPDATED,
        }
        event = event_map.get(resolution, EventNames.REMINDER_UPDATED)
        
        await self._emit_event(event, reminder)
        return reminder

    def to_data(self, reminder: Reminder) -> dict[str, Any]:
        def format_dt(dt):
            if dt is None:
                return None
            if isinstance(dt, str):
                return dt
            return dt.isoformat()

        return {
            "id": reminder.id,
            "title": reminder.title,
            "message": reminder.message,
            "due_at": format_dt(reminder.due_at),
            "repeat_rule": reminder.repeat_rule,
            "status": (reminder.status.value if hasattr(reminder.status, 'value') else str(reminder.status)).lower(),
            "is_active": reminder.is_active,
            "is_locked_in": reminder.is_locked_in,
            "locked_in_at": format_dt(reminder.locked_in_at),
            "task_id": reminder.task_id,
            "subject_id": reminder.subject_id,
            "triggered_at": format_dt(reminder.triggered_at),
            "snoozed_until": format_dt(reminder.snoozed_until),
            "created_at": format_dt(reminder.created_at),
            "updated_at": format_dt(reminder.updated_at),
        }

    async def _emit_event(self, event: EventNames, reminder: Reminder) -> None:
        await get_event_bus().emit_ws_event(
            event=event.value,
            entity_type=EntityType.REMINDER.value,
            entity_id=reminder.id,
            data=self.to_data(reminder),
        )


reminder_service = ReminderService()
