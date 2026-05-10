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

    def get_temporal_performance(self, session: Session, days: int = 30) -> list[dict[str, Any]]:
        """Map activity intensity by hour of day."""
        since = datetime.now() - timedelta(days=days)
        
        # We'll use ActivityLog to track all "completed" or "started" events
        statement = select(ActivityLog).where(
            ActivityLog.created_at >= since,
            or_(
                ActivityLog.action == "completed",
                ActivityLog.action == "started",
                ActivityLog.action == "created"
            )
        )
        logs = session.exec(statement).all()
        
        # Initialize buckets for 24 hours
        buckets = {h: 0 for h in range(24)}
        for log in logs:
            hour = log.created_at.hour
            buckets[hour] += 1
            
        return [
            {"hour": h, "intensity": count}
            for h, count in buckets.items()
        ]

    def get_neural_heatmap(self, session: Session, days: int = 365) -> list[dict[str, Any]]:
        """Get activity intensity per day for the heatmap."""
        since = date.today() - timedelta(days=days)
        
        # Aggregate logs by date
        # Note: In SQLite, we use date(created_at)
        statement = select(
            func.date(ActivityLog.created_at).label("day"),
            func.count(ActivityLog.id).label("count")
        ).where(
            ActivityLog.created_at >= datetime.combine(since, datetime.min.time())
        ).group_by("day")
        
        results = session.exec(statement).all()
        return [{"date": r.day, "value": r.count} for r in results]

    def get_subject_distribution(self, session: Session) -> list[dict[str, Any]]:
        """Calculate energy distribution across subjects based on tasks and study time."""
        from ..models.subject import Subject
        
        subjects = session.exec(select(Subject)).all()
        distribution = []
        
        for sub in subjects:
            # Count completed tasks
            task_count = session.exec(
                select(func.count(Task.id)).where(
                    Task.subject_id == sub.id,
                    Task.status == "done"
                )
            ).first() or 0
            
            # Total study seconds
            study_seconds = session.exec(
                select(func.sum(StudySession.duration_seconds)).where(
                    StudySession.subject_id == sub.id,
                    StudySession.status == StudySessionStatus.COMPLETED
                )
            ).first() or 0
            
            # Weighted score: 1 task = 15 mins of study (900s)
            score = task_count + (study_seconds / 900)
            
            if score > 0:
                distribution.append({
                    "subject": sub.name,
                    "color": sub.color,
                    "score": round(score, 2),
                    "tasks": task_count,
                    "study_hours": round(study_seconds / 3600, 1)
                })
                
        return sorted(distribution, key=lambda x: x["score"], reverse=True)


analytics_service = AnalyticsService()
