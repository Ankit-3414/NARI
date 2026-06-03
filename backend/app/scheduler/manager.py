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

        # Add the daily telemetry briefing job at 8:00 AM local time daily
        self.scheduler.add_job(
            self.trigger_daily_briefing,
            trigger="cron",
            hour=8,
            minute=0,
            id="daily_briefing",
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
                logger.info(f"Triggering reminder ID: {reminder.id}")
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
                        logger.info(f"Auto-dismissing locked-in reminder ID: {reminder.id}")
                        await reminder_service.dismiss(session, reminder.id, resolution=ReminderStatus.DISMISSED)
                
                # Flow 2: Missed (Ghosted if NOT Locked-In)
                # Production: Mark as MISSED after 5 minutes
                else:
                    if now > (t_at + timedelta(minutes=5)):
                        logger.info(f"Marking ghosted reminder as MISSED ID: {reminder.id}")
                        await reminder_service.dismiss(session, reminder.id, resolution=ReminderStatus.MISSED)

    async def trigger_daily_briefing(self):
        """Compile and trigger the Daily Telemetry Briefing."""
        logger.info("Compiling daily telemetry briefing...")
        with Session(db_session.engine) as session:
            # 1. Fetch user preferences
            from ..services.user_service import user_service
            user = user_service.get_default_user(session)
            
            import json
            preferences = {}
            if user.preferences_json:
                try:
                    preferences = json.loads(user.preferences_json)
                except Exception:
                    preferences = {}
            
            # 2. Fetch fresh real-time weather using coordinates if available
            from ..utils.weather import fetch_weather_report
            weather_city = preferences.get("weather_city", "Jamshedpur")
            lat = preferences.get("weather_lat")
            lon = preferences.get("weather_lon")
            
            weather_report = await fetch_weather_report(weather_city, lat=lat, lon=lon)
            
            # Extract basic info from the report for the summary
            # The report format is: "Current weather in {name}, {admin1} ({country}):\n- Conditions: {condition}\n- Temperature: {temp}°C..."
            lines = weather_report.split('\n')
            condition = "Clear sky ☀️"
            temp = "25"
            for line in lines:
                if "Conditions:" in line:
                    condition = line.split("Conditions:")[1].strip()
                if "Temperature:" in line:
                    temp = line.split("Temperature:")[1].split("°C")[0].strip()
            
            # 3. Get pending urgent/high priority tasks for today
            from ..services.task_service import task_service
            today_tasks = task_service.today(session)
            urgent_count = sum(1 for t in today_tasks if t.priority.value in ["urgent", "high"])
            
            # 4. Generate recommendation (focus window)
            rec = "High focus window detected between 9 AM and 11 AM."
            cond_lower = condition.lower()
            if "rain" in cond_lower or "drizzle" in cond_lower or "storm" in cond_lower or "thunderstorm" in cond_lower:
                rec = "Rainy conditions detected. Indoor deep-work focus block recommended."
            elif "fog" in cond_lower:
                rec = "Misty atmosphere. Keep screen contrast high and focus on writing or planning."
            
            # 5. Build briefing content
            title = "NARI TELEMETRY BRIEFING"
            message = (
                f"• Weather: {temp}°C, {condition} in {weather_city}\n"
                f"• Objectives: {urgent_count} high-priority tasks pending.\n"
                f"• Recommendation: {rec}"
            )
            
            # 6. Create triggered reminder in database
            from ..schemas.reminder import ReminderCreate
            from ..utils.datetime_utils import utc_now
            
            payload = ReminderCreate(
                title=title,
                message=message,
                due_at=utc_now(),
                status=ReminderStatus.TRIGGERED,
                is_active=True
            )
            
            await reminder_service.create(session, payload)
            logger.info("Daily telemetry briefing triggered successfully.")

scheduler_manager = SchedulerManager()
