"""WebSocket and internal event constants."""

from enum import Enum


class EventNames(str, Enum):
    # Task events
    TASK_CREATED = "task_created"
    TASK_UPDATED = "task_updated"
    TASK_COMPLETED = "task_completed"
    TASK_DELETED = "task_deleted"
    TASK_REOPENED = "task_reopened"

    # Subject events
    SUBJECT_CREATED = "subject_created"
    SUBJECT_UPDATED = "subject_updated"
    SUBJECT_ARCHIVED = "subject_archived"

    # Study events
    STUDY_STARTED = "study_started"
    STUDY_PAUSED = "study_paused"
    STUDY_RESUMED = "study_resumed"
    STUDY_STOPPED = "study_stopped"

    # Note events
    NOTE_CREATED = "note_created"
    NOTE_UPDATED = "note_updated"
    NOTE_DELETED = "note_deleted"

    # Reminder events
    REMINDER_CREATED = "reminder_created"
    REMINDER_UPDATED = "reminder_updated"
    REMINDER_DELETED = "reminder_deleted"
    REMINDER_TRIGGERED = "reminder_triggered"
    REMINDER_SNOOZED = "reminder_snoozed"
    REMINDER_DISMISSED = "reminder_dismissed"

    # Goal & Habit events
    GOAL_CREATED = "goal_created"
    GOAL_UPDATED = "goal_updated"
    GOAL_DELETED = "goal_deleted"
    GOAL_PROGRESS_UPDATED = "goal_progress_updated"
    HABIT_CREATED = "habit_created"
    HABIT_UPDATED = "habit_updated"
    HABIT_DELETED = "habit_deleted"
    HABIT_COMPLETED = "habit_completed"
    HABIT_STREAK_UPDATED = "habit_streak_updated"

    # Location events
    LOCATION_CREATED = "location_created"
    LOCATION_UPDATED = "location_updated"
    LOCATION_DELETED = "location_deleted"

    # System events
    ACTIVITY_LOGGED = "activity_logged"
    CONTEXT_LOGGED = "context_logged"
