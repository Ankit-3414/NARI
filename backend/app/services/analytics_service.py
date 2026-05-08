"""Analytics service."""

from __future__ import annotations

from datetime import datetime, date, timedelta
from typing import Any

from sqlmodel import Session, select, func, and_

from ..models.study_session import StudySession, StudySessionStatus
from ..models.task import Task
from ..models.habit import Habit, HabitLog
from ..models.activity_log import ActivityLog


class AnalyticsService:
    """Business logic for generating behavioral analytics."""

    def get_dashboard_summary(self, session: Session) -> dict[str, Any]:
        """Get high-level summary for the dashboard."""
        today = date.today()
        start_of_day = datetime.combine(today, datetime.min.time())
        
        # Tasks completed today
        task_statement = select(func.count(Task.id)).where(
            Task.status == "done",
            Task.updated_at >= start_of_day
        )
        tasks_done = session.exec(task_statement).first() or 0
        
        # Total study time today (minutes)
        study_statement = select(func.sum(StudySession.duration_seconds)).where(
            StudySession.status == StudySessionStatus.COMPLETED,
            StudySession.ended_at >= start_of_day
        )
        study_seconds = session.exec(study_statement).first() or 0
        study_minutes = round(study_seconds / 60, 1)
        
        # Active habits streak summary
        habit_statement = select(func.max(Habit.current_streak))
        max_streak = session.exec(habit_statement).first() or 0
        
        return {
            "tasks_done_today": tasks_done,
            "study_minutes_today": study_minutes,
            "max_habit_streak": max_streak,
            "date": today.isoformat()
        }

    def get_study_trends(self, session: Session, days: int = 7) -> list[dict[str, Any]]:
        """Get study time trends for the last X days."""
        trends = []
        for i in range(days):
            target_date = date.today() - timedelta(days=i)
            start_of_day = datetime.combine(target_date, datetime.min.time())
            end_of_day = datetime.combine(target_date, datetime.max.time())
            
            statement = select(func.sum(StudySession.duration_seconds)).where(
                StudySession.status == StudySessionStatus.COMPLETED,
                StudySession.ended_at >= start_of_day,
                StudySession.ended_at <= end_of_day
            )
            seconds = session.exec(statement).first() or 0
            
            trends.append({
                "date": target_date.isoformat(),
                "minutes": round(seconds / 60, 1)
            })
            
        return trends[::-1] # Return in chronological order

    def get_task_completion_rate(self, session: Session) -> dict[str, Any]:
        """Get overall task completion statistics."""
        total_statement = select(func.count(Task.id))
        total = session.exec(total_statement).first() or 0
        
        done_statement = select(func.count(Task.id)).where(Task.status == "done")
        done = session.exec(done_statement).first() or 0
        
        pending_statement = select(func.count(Task.id)).where(Task.status == "pending")
        pending = session.exec(pending_statement).first() or 0
        
        return {
            "total": total,
            "completed": done,
            "pending": pending,
            "completion_rate": round((done / total * 100), 1) if total > 0 else 0
        }


analytics_service = AnalyticsService()
