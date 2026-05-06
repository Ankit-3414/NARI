"""APScheduler manager for background tasks."""

import asyncio
from datetime import UTC, datetime
from typing import Optional

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from sqlmodel import Session, select

from ..core.constants import ReminderStatus
from ..core.logging import get_logger
from ..db.session import engine
from ..models.reminder import Reminder
from ..services.reminder_service import reminder_service

logger = get_logger(__name__)

class SchedulerManager:
    """Manager for background jobs."""

    def __init__(self):
        self.scheduler = AsyncIOScheduler(timezone=UTC)
        self._is_running = False

    def start(self):
        """Start the scheduler."""
        if self._is_running:
            return
        
        # Add the reminder check job
        self.scheduler.add_job(
            self.check_reminders,
            trigger=IntervalTrigger(seconds=30),
            id="check_reminders",
            replace_existing=True,
        )
        
        self.scheduler.start()
        self._is_running = True
        logger.info("Scheduler started (polling every 30s)")

    def stop(self):
        """Stop the scheduler."""
        if self._is_running:
            self.scheduler.shutdown()
            self._is_running = False
            logger.info("Scheduler stopped")

    async def check_reminders(self):
        """Poll the database for due reminders."""
        now = datetime.now(UTC)
        
        # We need a new session for each check
        with Session(engine) as session:
            statement = select(Reminder).where(
                Reminder.status == ReminderStatus.SCHEDULED,
                Reminder.due_at <= now
            )
            due_reminders = session.exec(statement).all()
            
            if not due_reminders:
                # Also check snoozed ones
                statement = select(Reminder).where(
                    Reminder.status == ReminderStatus.SNOOZED,
                    Reminder.snoozed_until <= now
                )
                due_reminders = session.exec(statement).all()

            for reminder in due_reminders:
                logger.info(f"Triggering reminder: {reminder.title} (ID: {reminder.id})")
                try:
                    await reminder_service.trigger(session, reminder.id)
                    # After triggering, if it's recurring, we should schedule the next one
                    # For now, we just mark as triggered
                except Exception as e:
                    logger.error(f"Failed to trigger reminder {reminder.id}: {e}")

scheduler_manager = SchedulerManager()
