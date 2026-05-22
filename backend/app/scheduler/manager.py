"""APScheduler manager for background tasks."""

import asyncio
from datetime import UTC, datetime, timedelta
from typing import Optional

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from sqlmodel import Session, select, or_, and_

from ..core.config import settings
from ..core.constants import ReminderStatus
from ..core.logging import get_logger
from ..db import session as db_session
from ..models.reminder import Reminder
from ..services.reminder_service import reminder_service

logger = get_logger(__name__)

class SchedulerManager:
    """Manager for background jobs."""

    def __init__(self):
        self.scheduler = AsyncIOScheduler(timezone=settings.NARI_TIMEZONE)
        self._is_running = False

    def start(self):
        """Start the scheduler."""
        if self._is_running:
            return
        
        # Add the reminder check job
        self.scheduler.add_job(
            self.check_reminders,
            trigger=IntervalTrigger(seconds=1),
            id="check_reminders",
            replace_existing=True,
            max_instances=1,
            coalesce=True,
        )

        # Add the auto-resolution job (Ghost Protocol)
        self.scheduler.add_job(
            self.resolve_triggered_reminders,
            trigger=IntervalTrigger(seconds=10),
            id="resolve_triggered_reminders",
            replace_existing=True,
            max_instances=1,
            coalesce=True,
        )
        
        self.scheduler.start()
        self._is_running = True
        logger.info("Scheduler started (Atomic Precision: 1s polling)")

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
        with Session(db_session.engine) as session:
            # Check for scheduled OR snoozed reminders that are due AND active
            statement = select(Reminder).where(
                and_(
                    Reminder.is_active == True,
                    or_(
                        and_(
                            Reminder.status == ReminderStatus.SCHEDULED,
                            Reminder.due_at <= now
                        ),
                        and_(
                            Reminder.status == ReminderStatus.SNOOZED,
                            Reminder.snoozed_until <= now
                        )
                    )
                )
            )
            due_reminders = session.exec(statement).all()
            
            for reminder in due_reminders:
                logger.info(f"Triggering reminder: {reminder.title} (ID: {reminder.id})")
                try:
                    await reminder_service.trigger(session, reminder.id)
                except Exception as e:
                    logger.error(f"Failed to trigger reminder {reminder.id}: {e}")

    async def resolve_triggered_reminders(self):
        """Auto-resolve reminders that have been ringing too long (Ghost Protocol)."""
        now = datetime.now(UTC)
        
        with Session(db_session.engine) as session:
            # Find all triggered reminders
            statement = select(Reminder).where(Reminder.status == ReminderStatus.TRIGGERED)
            triggered_reminders = session.exec(statement).all()
            
            for reminder in triggered_reminders:
                if not reminder.triggered_at:
                    continue
                
                # Force UTC for comparison
                t_at = reminder.triggered_at
                if t_at.tzinfo is None:
                    t_at = t_at.replace(tzinfo=UTC)

                # Flow 1: Attended (Auto-Dismiss if Locked-In)
                # Production: Auto-dismiss after 2 minutes
                if reminder.is_locked_in:
                    if now > (t_at + timedelta(minutes=2)):
                        logger.info(f"Auto-dismissing locked-in reminder: {reminder.title}")
                        await reminder_service.dismiss(session, reminder.id, resolution=ReminderStatus.DISMISSED)
                
                # Flow 2: Missed (Ghosted if NOT Locked-In)
                # Production: Mark as MISSED after 5 minutes
                else:
                    if now > (t_at + timedelta(minutes=5)):
                        logger.info(f"Marking ghosted reminder as MISSED: {reminder.title}")
                        await reminder_service.dismiss(session, reminder.id, resolution=ReminderStatus.MISSED)

scheduler_manager = SchedulerManager()
