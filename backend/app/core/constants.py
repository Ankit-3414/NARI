"""Application-wide constants and enums."""

from enum import Enum


class TaskPriority(str, Enum):
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    URGENT = "urgent"


class TaskStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    DONE = "done"
    CANCELLED = "cancelled"


class ReminderStatus(str, Enum):
    SCHEDULED = "scheduled"
    TRIGGERED = "triggered"
    SNOOZED = "snoozed"
    DISMISSED = "dismissed"
    SKIPPED = "skipped"
    MISSED = "missed"


class StudySessionStatus(str, Enum):
    RUNNING = "running"
    PAUSED = "paused"
    COMPLETED = "completed"


class GoalScope(str, Enum):
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    YEARLY = "yearly"


class GoalStatus(str, Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    ABANDONED = "abandoned"


class HabitFrequency(str, Enum):
    DAILY = "daily"
    WEEKLY = "weekly"


class EntityType(str, Enum):
    SUBJECT = "subject"
    TASK = "task"
    NOTE = "note"
    STUDY_SESSION = "study_session"
    REMINDER = "reminder"
    GOAL = "goal"
    HABIT = "habit"
    LOCATION = "location"
    CONTEXT = "context"
    SYSTEM = "system"


# Standard action verbs for ActivityLog
ACTIVITY_ACTIONS = {
    "created",
    "updated",
    "completed",
    "deleted",
    "archived",
    "restored",
    "started",
    "paused",
    "resumed",
    "stopped",
    "triggered",
    "snoozed",
    "dismissed",
    "logged",
    "incremented",
    "streaked",
}