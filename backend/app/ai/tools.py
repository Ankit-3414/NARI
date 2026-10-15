"""Tool Registry for NARI AI.

Defines the capabilities available to the LLM in OpenAI function calling format.
"""

from typing import Any, Callable
from sqlmodel import Session
import json
import httpx
import re

from ..services.task_service import task_service
from ..services.activity_service import activity_service
from ..services.note_service import note_service
from ..schemas.task import TaskCreate
from ..core.constants import EntityType, TaskPriority
from ..services.semantic_memory import semantic_memory
from ..utils.weather import fetch_weather_report
from ..utils.web_search import perform_web_search

class ToolRegistry:
    def __init__(self):
        self.tools = [
            {
                "type": "function",
                "function": {
                    "name": "create_task",
                    "description": "Create a new task for the user.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "title": {
                                "type": "string",
                                "description": "The title or main description of the task."
                            },
                            "priority": {
                                "type": "string",
                                "enum": ["low", "normal", "high", "urgent"],
                                "description": "The priority of the task."
                            },
                            "status": {
                                "type": "string",
                                "enum": ["pending", "done", "cancelled"],
                                "description": "The current status of the task. Set to 'done' or 'cancelled' if logging a completed/cancelled historical activity."
                            },
                            "location_id": {
                                "type": "integer",
                                "description": "Optional ID of a saved physical location (e.g. Home, Gym) to link this task to."
                            }
                        },
                        "required": ["title"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "complete_task",
                    "description": "Mark a task as completed.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "task_id": {
                                "type": "integer",
                                "description": "The ID of the task to complete."
                            }
                        },
                        "required": ["task_id"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "log_context",
                    "description": "Log a highly significant user preference, emotional state, or context observation. DO NOT call for standard greetings, small talk, or routine queries.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "observation": {
                                "type": "string",
                                "description": "The specific behavioral insight, user state, or preference observation."
                            },
                            "detected_mood": {
                                "type": "string",
                                "enum": ["focused", "stressed", "fatigued", "motivated", "calm", "neutral"],
                                "description": "The current detected mood or cognitive state of the user based on their tone and message."
                            },
                            "significance": {
                                "type": "integer",
                                "minimum": 1,
                                "maximum": 5,
                                "description": "The significance level of this observation for future productivity and behavior adaptation (1 = low, 5 = critical)."
                            }
                        },
                        "required": ["observation", "detected_mood", "significance"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "search_memory",
                    "description": "Search the user's past behavior, notes, or NARI's core knowledge base.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "query": {
                                "type": "string",
                                "description": "The search query (e.g. 'learning python', 'meditation schedule')."
                            },
                            "target": {
                                "type": "string",
                                "enum": ["activity", "notes", "knowledge"],
                                "description": "Whether to search past activity logs, full markdown notes, or NARI's core knowledge base (vector memory)."
                            }
                        },
                        "required": ["query", "target"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "save_core_memory",
                    "description": "Save a permanent fact, preference, or learned concept into NARI's core semantic memory.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "concept": {
                                "type": "string",
                                "description": "The core topic or concept name (e.g. 'User Diet', 'Python Async')."
                            },
                            "summary": {
                                "type": "string",
                                "description": "A concise summary of what was learned or the rule to follow."
                            }
                        },
                        "required": ["concept", "summary"]
                    }
                }
            },

            {
                "type": "function",
                "function": {
                    "name": "get_weather",
                    "description": "Get the current weather and 3-day forecast for a city or geographical location in the world.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "location": {
                                "type": "string",
                                "description": "The name of the city, region, or location (e.g., 'Jamshedpur', 'New Delhi', 'Paris')."
                            }
                        },
                        "required": ["location"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "list_locations",
                    "description": "Retrieve the list of saved physical locations (e.g. Home, Gym, Office) including their coordinates and geofenced radiuses.",
                    "parameters": {
                        "type": "object",
                        "properties": {}
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "create_location",
                    "description": "Register and save a new physical location node with coordinates and geofenced radius.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "label": {
                                "type": "string",
                                "description": "Name or identifier of the location (e.g. 'Gym', 'Market', 'Work')."
                            },
                            "latitude": {
                                "type": "number",
                                "description": "Latitude coordinate."
                            },
                            "longitude": {
                                "type": "number",
                                "description": "Longitude coordinate."
                            },
                            "category": {
                                "type": "string",
                                "enum": ["home", "shopping", "fitness", "work", "study", "general"],
                                "description": "The category classification."
                            },
                            "radius_meters": {
                                "type": "number",
                                "description": "Geofence boundary radius in meters (default 100)."
                            },
                            "name": {
                                "type": "string",
                                "description": "Optional description or street address."
                            }
                        },
                        "required": ["label", "latitude", "longitude"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "list_tasks",
                    "description": "List the user's tasks.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "status": {
                                "type": "string",
                                "enum": ["pending", "done", "all"],
                                "description": "Filter by task status."
                            }
                        }
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "list_habits",
                    "description": "List active habits with their streaks.",
                    "parameters": {
                        "type": "object",
                        "properties": {}
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "list_goals",
                    "description": "List active goals and their target progress.",
                    "parameters": {
                        "type": "object",
                        "properties": {}
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "list_reminders",
                    "description": "List scheduled, triggered, or snoozed reminders.",
                    "parameters": {
                        "type": "object",
                        "properties": {}
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "create_note",
                    "description": "Create a new note for the user to write down ideas, concepts, or reminders.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "title": {
                                "type": "string",
                                "description": "The title of the note."
                            },
                            "content_markdown": {
                                "type": "string",
                                "description": "The body of the note in Markdown format."
                            },
                            "subject_id": {
                                "type": "integer",
                                "description": "Optional ID of a Subject to link this note to."
                            }
                        },
                        "required": ["title", "content_markdown"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "update_note",
                    "description": "Update an existing note's title, markdown content, or change note.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "note_id": {
                                "type": "integer",
                                "description": "The ID of the note to update."
                            },
                            "title": {
                                "type": "string",
                                "description": "The new title of the note."
                            },
                            "content_markdown": {
                                "type": "string",
                                "description": "The new markdown body of the note."
                            },
                            "change_note": {
                                "type": "string",
                                "description": "Optional description of what was changed."
                            }
                        },
                        "required": ["note_id"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "delete_note",
                    "description": "Delete (archive) an existing note.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "note_id": {
                                "type": "integer",
                                "description": "The ID of the note to delete/archive."
                            }
                        },
                        "required": ["note_id"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "create_reminder",
                    "description": "Create a new scheduled or recurring reminder.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "title": {
                                "type": "string",
                                "description": "The title of the reminder."
                            },
                            "due_at": {
                                "type": "string",
                                "description": "The scheduled date/time for the reminder in ISO format (UTC), e.g. '2026-06-04T12:00:00Z'."
                            },
                            "repeat_rule": {
                                "type": "string",
                                "description": "Optional RFC-5545 repeat rule string (e.g. 'FREQ=DAILY;INTERVAL=1' or 'FREQ=WEEKLY;BYDAY=MO,WE,FR')."
                            },
                            "message": {
                                "type": "string",
                                "description": "Optional description/message for the reminder."
                            }
                        },
                        "required": ["title", "due_at"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "dismiss_reminder",
                    "description": "Dismiss a reminder.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "reminder_id": {
                                "type": "integer",
                                "description": "The ID of the reminder to dismiss."
                            }
                        },
                        "required": ["reminder_id"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "lock_in_reminder",
                    "description": "Lock in a reminder (confirming attendance/lock-in for Pre-Flight Intercept).",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "reminder_id": {
                                "type": "integer",
                                "description": "The ID of the reminder to lock in."
                            }
                        },
                        "required": ["reminder_id"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "skip_reminder",
                    "description": "Skip today's reminder (intentional skip).",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "reminder_id": {
                                "type": "integer",
                                "description": "The ID of the reminder to skip."
                            }
                        },
                        "required": ["reminder_id"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "snooze_reminder",
                    "description": "Snooze a reminder for a given number of minutes.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "reminder_id": {
                                "type": "integer",
                                "description": "The ID of the reminder to snooze."
                            },
                            "minutes": {
                                "type": "integer",
                                "description": "Number of minutes to snooze (default 15)."
                            }
                        },
                        "required": ["reminder_id"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "create_habit",
                    "description": "Create a new habit for the user to track.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "name": {
                                "type": "string",
                                "description": "The name of the habit (e.g. 'Read for 30 minutes')."
                            },
                            "frequency": {
                                "type": "string",
                                "enum": ["daily", "weekly"],
                                "description": "How often the habit should be tracked (default: 'daily')."
                            },
                            "description": {
                                "type": "string",
                                "description": "Optional description of the habit."
                            },
                            "target_count": {
                                "type": "integer",
                                "description": "Optional target completions (default: 1)."
                            }
                        },
                        "required": ["name"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "delete_habit",
                    "description": "Archive/delete a habit.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "habit_id": {
                                "type": "integer",
                                "description": "The ID of the habit to delete."
                            }
                        },
                        "required": ["habit_id"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "web_search",
                    "description": "Search the live web for current information, news, research papers, or documentation. Fetches webpage content and returns a reasoned, synthesized report with citations.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "query": {
                                "type": "string",
                                "description": "The search query (e.g. 'latest python release', 'who is the CEO of Microsoft')."
                            }
                        },
                        "required": ["query"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "update_task",
                    "description": "Update a task's title, priority, status, or location link.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "task_id": {"type": "integer", "description": "The ID of the task to update."},
                            "title": {"type": "string", "description": "The new title for the task."},
                            "priority": {"type": "string", "enum": ["low", "normal", "high", "urgent"], "description": "The new priority."},
                            "status": {"type": "string", "enum": ["pending", "done", "cancelled"], "description": "The new status."},
                            "location_id": {"type": "integer", "description": "Optional location ID to link to."}
                        },
                        "required": ["task_id"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "reopen_task",
                    "description": "Reopen a task (change status back to pending).",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "task_id": {"type": "integer", "description": "The ID of the task to reopen."}
                        },
                        "required": ["task_id"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "delete_task",
                    "description": "Delete (cancel) a task.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "task_id": {"type": "integer", "description": "The ID of the task to delete/cancel."}
                        },
                        "required": ["task_id"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "create_subject",
                    "description": "Create a new study subject.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "name": {"type": "string", "description": "The name of the subject (e.g. 'Advanced Python')."},
                            "description": {"type": "string", "description": "Optional description of the subject."},
                            "difficulty": {"type": "integer", "description": "Optional difficulty rating 1-5 (default 1)."},
                            "priority": {"type": "integer", "description": "Optional priority level 1-5 (default 1)."},
                            "tags": {"type": "array", "items": {"type": "string"}, "description": "Optional list of tags."}
                        },
                        "required": ["name"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "list_subjects",
                    "description": "List all active study subjects.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "include_archived": {"type": "boolean", "description": "Whether to include archived subjects."}
                        }
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "update_subject",
                    "description": "Update a study subject's details.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "subject_id": {"type": "integer", "description": "The ID of the subject to update."},
                            "name": {"type": "string", "description": "The new name of the subject."},
                            "description": {"type": "string", "description": "The new description."},
                            "difficulty": {"type": "integer", "description": "The new difficulty rating 1-5."},
                            "priority": {"type": "integer", "description": "The new priority level 1-5."},
                            "tags": {"type": "array", "items": {"type": "string"}, "description": "The new list of tags."}
                        },
                        "required": ["subject_id"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "delete_subject",
                    "description": "Archive/delete a study subject.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "subject_id": {"type": "integer", "description": "The ID of the subject to archive."}
                        },
                        "required": ["subject_id"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "start_study_session",
                    "description": "Start a new active study session for a subject.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "subject_id": {"type": "integer", "description": "The ID of the Subject to study."},
                            "goal_text": {"type": "string", "description": "Optional session objective/goal."}
                        },
                        "required": ["subject_id"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "pause_study_session",
                    "description": "Pause the currently running study session.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "session_id": {"type": "integer", "description": "The ID of the study session to pause."}
                        },
                        "required": ["session_id"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "resume_study_session",
                    "description": "Resume the currently paused study session.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "session_id": {"type": "integer", "description": "The ID of the study session to resume."}
                        },
                        "required": ["session_id"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "stop_study_session",
                    "description": "Complete and stop the current study session.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "session_id": {"type": "integer", "description": "The ID of the study session to stop."},
                            "notes": {"type": "string", "description": "Optional summary or review notes for the session."}
                        },
                        "required": ["session_id"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "get_active_study_session",
                    "description": "Retrieve the currently active (running or paused) study session, if any.",
                    "parameters": {
                        "type": "object",
                        "properties": {}
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "get_study_stats",
                    "description": "Get total cumulative study time statistics for today.",
                    "parameters": {
                        "type": "object",
                        "properties": {}
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "create_goal",
                    "description": "Create a new long-term goal.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "title": {"type": "string", "description": "The title of the goal."},
                            "target_value": {"type": "integer", "description": "The target progress metric (e.g. 10 hours, 5 books)."},
                            "current_value": {"type": "integer", "description": "The starting progress value (default 0)."},
                            "scope": {"type": "string", "enum": ["daily", "weekly", "monthly", "yearly", "lifetime"], "description": "The scope of the goal."},
                            "description": {"type": "string", "description": "Optional explanation."}
                        },
                        "required": ["title", "target_value"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "update_goal",
                    "description": "Update a goal's progress, target, status, or info.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "goal_id": {"type": "integer", "description": "The ID of the goal to update."},
                            "title": {"type": "string", "description": "The new title."},
                            "current_value": {"type": "integer", "description": "The current progress value."},
                            "target_value": {"type": "integer", "description": "The target progress value."},
                            "status": {"type": "string", "enum": ["pending", "in_progress", "completed", "cancelled"], "description": "The new status."},
                            "description": {"type": "string", "description": "The new description."}
                        },
                        "required": ["goal_id"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "delete_goal",
                    "description": "Delete a goal.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "goal_id": {"type": "integer", "description": "The ID of the goal to delete."}
                        },
                        "required": ["goal_id"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "increment_goal_progress",
                    "description": "Increment the progress value of a goal by a specified number.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "goal_id": {"type": "integer", "description": "The ID of the goal to increment."},
                            "increment": {"type": "integer", "description": "The amount to increase progress by (default 1)."}
                        },
                        "required": ["goal_id"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "get_habit_logs",
                    "description": "Retrieve recent completion logs/history for a specific habit.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "habit_id": {"type": "integer", "description": "The ID of the habit."},
                            "limit": {"type": "integer", "description": "Maximum number of logs to return (default 10)."}
                        },
                        "required": ["habit_id"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "complete_habit",
                    "description": "Log a completion entry for a habit to increment its streak.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "habit_id": {"type": "integer", "description": "The ID of the habit to complete."},
                            "note": {"type": "string", "description": "Optional description of this specific completion instance."}
                        },
                        "required": ["habit_id"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "update_habit",
                    "description": "Update a habit's settings.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "habit_id": {"type": "integer", "description": "The ID of the habit to update."},
                            "name": {"type": "string", "description": "The new habit name."},
                            "frequency": {"type": "string", "enum": ["daily", "weekly"], "description": "The new tracking frequency."},
                            "description": {"type": "string", "description": "The new description."},
                            "target_count": {"type": "integer", "description": "The new target completion count."}
                        },
                        "required": ["habit_id"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "update_reminder",
                    "description": "Update a reminder's schedule or message.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "reminder_id": {"type": "integer", "description": "The ID of the reminder to update."},
                            "title": {"type": "string", "description": "The new title."},
                            "due_at": {"type": "string", "description": "The new due datetime in ISO format (UTC)."},
                            "repeat_rule": {"type": "string", "description": "The new RFC-5545 repeat rule."},
                            "message": {"type": "string", "description": "The new description/message."}
                        },
                        "required": ["reminder_id"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "delete_reminder",
                    "description": "Hard delete a reminder from the schedule.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "reminder_id": {"type": "integer", "description": "The ID of the reminder to delete."}
                        },
                        "required": ["reminder_id"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "get_activity_log",
                    "description": "Retrieve the raw recent behavior and activity stream logs in chronological order.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "limit": {"type": "integer", "description": "Number of logs to retrieve (default 20, max 100)."}
                        }
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "get_server_health",
                    "description": "Retrieve diagnostic telemetry and health metrics of the NARI server host (e.g. CPU, RAM, Disk, DB size, record counts, API status).",
                    "parameters": {
                        "type": "object",
                        "properties": {}
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "run_server_cleanup",
                    "description": "Perform self-healing system routines including SQLite database vacuuming, clearing temporary junk files, and database integrity checks.",
                    "parameters": {
                        "type": "object",
                        "properties": {}
                    }
                }
            }
        ]

    async def execute_tool(self, session: Session, name: str, arguments: dict[str, Any]) -> str:
        """Execute a tool by name and return its result as a string."""
        try:
            if name == "create_task":
                # Ensure priority is valid
                priority = arguments.get("priority", "normal")
                try:
                    priority = TaskPriority(priority)
                except ValueError:
                    priority = TaskPriority.NORMAL
                
                # Ensure status is valid
                status_arg = arguments.get("status", "pending")
                try:
                    status = TaskStatus(status_arg)
                except ValueError:
                    status = TaskStatus.PENDING
                
                payload = TaskCreate(
                    title=arguments["title"],
                    priority=priority,
                    status=status,
                    location_id=arguments.get("location_id")
                )
                task = await task_service.create(session, payload)
                feedback = f"Task created successfully with ID {task.id}."
                if task.location_id:
                    from ..services.location_service import location_service
                    loc = location_service.get(session, task.location_id)
                    if loc:
                        feedback += f" Linked to location: {loc.label}."
                return feedback
                
            elif name == "complete_task":
                task_id = arguments["task_id"]
                await task_service.complete(session, task_id)
                return f"Task {task_id} completed successfully."
                
            elif name == "log_context":
                observation = arguments["observation"]
                detected_mood = arguments["detected_mood"]
                significance = arguments["significance"]
                
                activity_service.create(
                    session,
                    entity_type=EntityType.CONTEXT,
                    action="logged",
                    message=f"Behavioral context logged (Mood: {detected_mood.upper()}, Significance: {significance}/5)",
                    entity_id=0, # Context entries don't have a parent entity yet
                    payload={
                        "observation": observation,
                        "detected_mood": detected_mood,
                        "significance": significance
                    },
                    source="ai_agent"
                )
                return f"Successfully logged behavioral context with mood: {detected_mood}."
                
            elif name == "search_memory":
                target = arguments.get("target", "knowledge")
                query = arguments["query"]
                from sqlmodel import select
                
                if target == "knowledge":
                    results = semantic_memory.search_knowledge(session, query, limit=5)
                    if not results:
                        return "No matching knowledge nodes found in semantic memory."
                    formatted = "\n".join([f"- [{r.concept}]: {r.summary} (Source: {r.source}, Confidence: {r.confidence:.2f})" for r in results])
                    return f"Semantic Search Results (Core Knowledge):\n{formatted}"
                
                elif target == "activity":
                    from ..models.activity_log import ActivityLog
                    statement = select(ActivityLog).where(
                        ActivityLog.message.like(f"%{query}%")
                    ).order_by(ActivityLog.created_at.desc()).limit(5)
                    results = list(session.exec(statement).all())
                    if not results:
                        return "No matching activity found."
                    formatted = "\n".join([f"- [{r.created_at.strftime('%Y-%m-%d')}] {r.message}" for r in results if not r.is_encrypted])
                    return f"Search Results (Activity):\n{formatted}"
                else:
                    from ..models.note import Note
                    statement = select(Note).where(
                        Note.archived_at == None
                    ).where(
                        (Note.title.like(f"%{query}%")) | (Note.content_markdown.like(f"%{query}%"))
                    ).order_by(Note.updated_at.desc()).limit(3)
                    results = list(session.exec(statement).all())
                    if not results:
                        return "No matching notes found."
                    formatted = "\n".join([f"- [Note {r.id}: {r.title}] {r.content_markdown[:100]}..." for r in results])
                    return f"Search Results (Notes):\n{formatted}"

            elif name == "save_core_memory":
                concept = arguments["concept"]
                summary = arguments["summary"]
                semantic_memory.store_knowledge(session, concept, summary, source="agent_interaction")
                return f"Core memory saved for concept: {concept}"


                
            elif name == "get_weather":
                location = arguments.get("location")
                
                # Try to enhance accuracy using stored user coordinates if available
                from ..services.user_service import user_service
                user = user_service.get_default_user(session)
                lat, lon = None, None
                
                if user.preferences_json:
                    try:
                        prefs = json.loads(user.preferences_json)
                        # If no location provided, or it matches the user's city, use high-precision coords
                        stored_city = prefs.get("weather_city", "").lower()
                        if not location or location.lower() == "current" or location.lower() == "here" or (stored_city and stored_city in location.lower()):
                            lat = prefs.get("weather_lat")
                            lon = prefs.get("weather_lon")
                            # If we use coords, we can still use the stored city name for the report
                            if not location or location.lower() in ["current", "here"]:
                                location = prefs.get("weather_city")
                    except Exception:
                        pass
                
                return await fetch_weather_report(location, lat=lat, lon=lon)

            elif name == "list_locations":
                from ..services.location_service import location_service
                locations = await location_service.list(session, include_archived=False)
                if not locations:
                    return "No saved locations found."
                formatted = "\n".join([
                    f"- [{loc.category.upper()}] {loc.label}: Lat {loc.latitude}, Lng {loc.longitude} (Radius: {loc.radius_meters}m)"
                    for loc in locations
                ])
                return f"Saved Locations:\n{formatted}"

            elif name == "create_location":
                from ..services.location_service import location_service
                from ..schemas.location import LocationCreate
                
                payload = LocationCreate(
                    label=arguments["label"],
                    latitude=arguments["latitude"],
                    longitude=arguments["longitude"],
                    category=arguments.get("category", "general"),
                    radius_meters=arguments.get("radius_meters", 100.0),
                    name=arguments.get("name")
                )
                loc = await location_service.create_location(session, payload)
                return f"Successfully registered new location '{loc.label}' with ID {loc.id}."
                
            elif name == "list_tasks":
                from ..core.constants import TaskStatus
                status_val = arguments.get("status", "pending")
                task_status = None
                if status_val == "pending":
                    task_status = TaskStatus.PENDING
                elif status_val == "done":
                    task_status = TaskStatus.DONE
                tasks = task_service.list(session, status=task_status)
                if not tasks:
                    return f"No {status_val} tasks found."
                return "Tasks:\n" + "\n".join([f"- [ID {t.id}] [{t.priority.value.upper()}] {t.title} ({t.status.value})" for t in tasks])

            elif name == "list_habits":
                from ..services.habit_service import habit_service
                habits = habit_service.list(session)
                if not habits:
                    return "No habits registered."
                return "Active Habits:\n" + "\n".join([f"- [ID {h.id}] {h.name} (Streak: {h.current_streak} days, Freq: {h.frequency.value})" for h in habits])


            elif name == "list_goals":
                from ..services.goal_service import goal_service
                goals = goal_service.list(session)
                if not goals:
                    return "No goals registered."
                return "Active Goals:\n" + "\n".join([f"- [ID {g.id}] {g.title}: Progress {g.current_value}/{g.target_value} ({g.status.value})" for g in goals])

            elif name == "list_reminders":
                from ..services.reminder_service import reminder_service
                reminders = reminder_service.list(session, include_triggered=True)
                if not reminders:
                    return "No active reminders."
                return "Reminders:\n" + "\n".join([f"- [ID {r.id}] {r.title}: Status {r.status.value} (Due: {r.due_at.isoformat() if r.due_at else 'N/A'})" for r in reminders])

            elif name == "create_note":
                from ..schemas.note import NoteCreate
                payload = NoteCreate(
                    title=arguments["title"],
                    content_markdown=arguments["content_markdown"],
                    subject_id=arguments.get("subject_id")
                )
                note = await note_service.create(session, payload)
                return f"Successfully created note '{note.title}' with ID {note.id}."

            elif name == "update_note":
                from ..schemas.note import NoteUpdate
                note_id = arguments["note_id"]
                payload = NoteUpdate(
                    title=arguments.get("title"),
                    content_markdown=arguments.get("content_markdown"),
                    change_note=arguments.get("change_note")
                )
                note = await note_service.update(session, note_id, payload)
                return f"Successfully updated note '{note.title}' (ID {note_id})."

            elif name == "delete_note":
                note_id = arguments["note_id"]
                await note_service.delete(session, note_id)
                return f"Successfully deleted/archived note {note_id}."

            elif name == "create_reminder":
                from ..services.reminder_service import reminder_service
                from ..schemas.reminder import ReminderCreate
                from datetime import datetime
                
                due_at_str = arguments["due_at"]
                if due_at_str.endswith("Z"):
                    due_at_str = due_at_str[:-1] + "+00:00"
                due_at = datetime.fromisoformat(due_at_str)
                
                payload = ReminderCreate(
                    title=arguments["title"],
                    due_at=due_at,
                    repeat_rule=arguments.get("repeat_rule"),
                    message=arguments.get("message")
                )
                reminder = await reminder_service.create(session, payload)
                return f"Successfully created reminder '{reminder.title}' with ID {reminder.id} due at {reminder.due_at}."

            elif name == "dismiss_reminder":
                from ..services.reminder_service import reminder_service
                reminder_id = arguments["reminder_id"]
                await reminder_service.dismiss(session, reminder_id)
                return f"Successfully dismissed reminder {reminder_id}."

            elif name == "lock_in_reminder":
                from ..services.reminder_service import reminder_service
                reminder_id = arguments["reminder_id"]
                await reminder_service.lock_in(session, reminder_id)
                return f"Successfully locked in reminder {reminder_id} (confirmed attendance for Pre-Flight Intercept)."

            elif name == "skip_reminder":
                from ..services.reminder_service import reminder_service
                reminder_id = arguments["reminder_id"]
                await reminder_service.skip(session, reminder_id)
                return f"Successfully skipped reminder {reminder_id}."

            elif name == "snooze_reminder":
                from ..services.reminder_service import reminder_service
                reminder_id = arguments["reminder_id"]
                minutes = arguments.get("minutes", 15)
                await reminder_service.snooze(session, reminder_id, minutes=minutes)
                return f"Successfully snoozed reminder {reminder_id} for {minutes} minutes."

            elif name == "create_habit":
                from ..services.habit_service import habit_service
                from ..schemas.habit import HabitCreate
                from ..core.constants import HabitFrequency
                
                freq_str = arguments.get("frequency", "daily")
                frequency = HabitFrequency.DAILY
                if freq_str == "weekly":
                    frequency = HabitFrequency.WEEKLY
                    
                payload = HabitCreate(
                    name=arguments["name"],
                    frequency=frequency,
                    description=arguments.get("description"),
                    target_count=arguments.get("target_count", 1)
                )
                habit = await habit_service.create(session, payload)
                return f"Successfully created habit '{habit.name}' with ID {habit.id}."

            elif name == "delete_habit":
                from ..services.habit_service import habit_service
                habit_id = arguments["habit_id"]
                await habit_service.delete(session, habit_id)
                return f"Successfully deleted habit {habit_id}."
            
            elif name == "web_search":
                query = arguments["query"]
                return await perform_web_search(query, session=session)

            elif name == "update_task":
                from ..schemas.task import TaskUpdate
                from ..core.constants import TaskStatus
                task_id = arguments["task_id"]
                updates = {}
                if "title" in arguments:
                    updates["title"] = arguments["title"]
                if "priority" in arguments:
                    updates["priority"] = TaskPriority(arguments["priority"])
                if "status" in arguments:
                    updates["status"] = TaskStatus(arguments["status"])
                if "location_id" in arguments:
                    updates["location_id"] = arguments["location_id"]
                payload = TaskUpdate(**updates)
                task = await task_service.update(session, task_id, payload)
                return f"Task {task_id} updated successfully. Status is now {task.status.value}."

            elif name == "reopen_task":
                task_id = arguments["task_id"]
                await task_service.reopen(session, task_id)
                return f"Task {task_id} reopened successfully."

            elif name == "delete_task":
                task_id = arguments["task_id"]
                await task_service.delete(session, task_id)
                return f"Task {task_id} deleted (cancelled) successfully."

            elif name == "create_subject":
                from ..services.subject_service import subject_service
                from ..schemas.subject import SubjectCreate
                payload = SubjectCreate(
                    name=arguments["name"],
                    description=arguments.get("description"),
                    difficulty=arguments.get("difficulty", 1),
                    priority=arguments.get("priority", 1),
                    tags=arguments.get("tags")
                )
                subj = await subject_service.create(session, payload)
                return f"Subject '{subj.name}' created successfully with ID {subj.id}."

            elif name == "list_subjects":
                from ..services.subject_service import subject_service
                include_archived = arguments.get("include_archived", False)
                subjects = subject_service.list(session, include_archived=include_archived)
                if not subjects:
                    return "No subjects registered."
                return "Subjects:\n" + "\n".join([f"- [ID {s.id}] {s.name} (Diff: {s.difficulty}, Priority: {s.priority})" for s in subjects])

            elif name == "update_subject":
                from ..services.subject_service import subject_service
                from ..schemas.subject import SubjectUpdate
                subject_id = arguments["subject_id"]
                updates = {}
                for key in ["name", "description", "difficulty", "priority", "tags"]:
                    if key in arguments:
                        updates[key] = arguments[key]
                payload = SubjectUpdate(**updates)
                await subject_service.update(session, subject_id, payload)
                return f"Subject {subject_id} updated successfully."

            elif name == "delete_subject":
                from ..services.subject_service import subject_service
                subject_id = arguments["subject_id"]
                await subject_service.delete(session, subject_id)
                return f"Subject {subject_id} archived successfully."

            elif name == "start_study_session":
                from ..services.study_service import study_service
                from ..schemas.study_session import StudySessionCreate
                payload = StudySessionCreate(
                    subject_id=arguments["subject_id"],
                    goal_text=arguments.get("goal_text")
                )
                stud = await study_service.start(session, payload)
                return f"Study session started successfully (ID {stud.id}) for subject {stud.subject_id}."

            elif name == "pause_study_session":
                from ..services.study_service import study_service
                session_id = arguments["session_id"]
                await study_service.pause(session, session_id)
                return f"Study session {session_id} paused."

            elif name == "resume_study_session":
                from ..services.study_service import study_service
                session_id = arguments["session_id"]
                await study_service.resume(session, session_id)
                return f"Study session {session_id} resumed."

            elif name == "stop_study_session":
                from ..services.study_service import study_service
                session_id = arguments["session_id"]
                await study_service.stop(session, session_id, notes=arguments.get("notes"))
                return f"Study session {session_id} completed."

            elif name == "get_active_study_session":
                from ..services.study_service import study_service
                active = study_service.get_active(session)
                if not active:
                    return "No study session is currently running or paused."
                return f"Active Study Session:\n- ID: {active.id}\n- Subject ID: {active.subject_id}\n- Status: {active.status.value}\n- Goal: {active.goal_text or 'None'}\n- Duration: {active.duration_seconds}s"

            elif name == "get_study_stats":
                from ..services.study_service import study_service
                stats = study_service.get_today_stats(session)
                return f"Today's Study Stats: {stats['total_minutes']} minutes ({stats['total_hours']} hours) total."

            elif name == "create_goal":
                from ..services.goal_service import goal_service
                from ..schemas.goal import GoalCreate
                from ..core.constants import GoalScope
                scope_str = arguments.get("scope", "monthly")
                scope = GoalScope.MONTHLY
                try:
                    scope = GoalScope(scope_str)
                except ValueError:
                    pass
                payload = GoalCreate(
                    title=arguments["title"],
                    target_value=arguments["target_value"],
                    current_value=arguments.get("current_value", 0),
                    scope=scope,
                    description=arguments.get("description")
                )
                goal = await goal_service.create(session, payload)
                return f"Goal '{goal.title}' created successfully with ID {goal.id}."

            elif name == "update_goal":
                from ..services.goal_service import goal_service
                from ..schemas.goal import GoalUpdate
                from ..core.constants import GoalStatus
                goal_id = arguments["goal_id"]
                updates = {}
                if "title" in arguments:
                    updates["title"] = arguments["title"]
                if "current_value" in arguments:
                    updates["current_value"] = arguments["current_value"]
                if "target_value" in arguments:
                    updates["target_value"] = arguments["target_value"]
                if "status" in arguments:
                    updates["status"] = GoalStatus(arguments["status"])
                if "description" in arguments:
                    updates["description"] = arguments["description"]
                payload = GoalUpdate(**updates)
                await goal_service.update(session, goal_id, payload)
                return f"Goal {goal_id} updated successfully."

            elif name == "delete_goal":
                from ..services.goal_service import goal_service
                goal_id = arguments["goal_id"]
                await goal_service.delete(session, goal_id)
                return f"Goal {goal_id} deleted successfully."

            elif name == "increment_goal_progress":
                from ..services.goal_service import goal_service
                goal_id = arguments["goal_id"]
                increment = arguments.get("increment", 1)
                goal = await goal_service.update_progress(session, goal_id, increment=increment)
                return f"Successfully incremented goal '{goal.title}' (ID {goal_id}) progress by {increment}. Current progress: {goal.current_value}/{goal.target_value}."

            elif name == "get_habit_logs":
                from ..services.habit_service import habit_service
                habit_id = arguments["habit_id"]
                limit = arguments.get("limit", 10)
                logs = habit_service.list_logs(session, habit_id, limit=limit)
                if not logs:
                    return f"No completion logs found for habit ID {habit_id}."
                formatted_logs = "\n".join([f"- Log ID {log.id}: completed at {log.created_at.isoformat()} (Note: {log.note or 'None'})" for log in logs])
                return f"Recent logs for habit ID {habit_id}:\n{formatted_logs}"

            elif name == "complete_habit":
                from ..services.habit_service import habit_service
                from ..schemas.habit import HabitLogCreate
                habit_id = arguments["habit_id"]
                payload = HabitLogCreate(note=arguments.get("note"))
                habit = await habit_service.complete(session, habit_id, payload)
                return f"Logged completion for habit '{habit.name}' (ID {habit_id}). Current streak: {habit.current_streak} days."

            elif name == "update_habit":
                from ..services.habit_service import habit_service
                from ..schemas.habit import HabitUpdate
                from ..core.constants import HabitFrequency
                habit_id = arguments["habit_id"]
                updates = {}
                if "name" in arguments:
                    updates["name"] = arguments["name"]
                if "frequency" in arguments:
                    updates["frequency"] = HabitFrequency(arguments["frequency"])
                if "description" in arguments:
                    updates["description"] = arguments["description"]
                if "target_count" in arguments:
                    updates["target_count"] = arguments["target_count"]
                payload = HabitUpdate(**updates)
                await habit_service.update(session, habit_id, payload)
                return f"Habit {habit_id} updated successfully."

            elif name == "update_reminder":
                from ..services.reminder_service import reminder_service
                from ..schemas.reminder import ReminderUpdate
                from datetime import datetime
                reminder_id = arguments["reminder_id"]
                updates = {}
                if "title" in arguments:
                    updates["title"] = arguments["title"]
                if "due_at" in arguments:
                    due_at_str = arguments["due_at"]
                    if due_at_str.endswith("Z"):
                        due_at_str = due_at_str[:-1] + "+00:00"
                    updates["due_at"] = datetime.fromisoformat(due_at_str)
                if "repeat_rule" in arguments:
                    updates["repeat_rule"] = arguments["repeat_rule"]
                if "message" in arguments:
                    updates["message"] = arguments["message"]
                payload = ReminderUpdate(**updates)
                await reminder_service.update(session, reminder_id, payload)
                return f"Reminder {reminder_id} updated successfully."

            elif name == "delete_reminder":
                from ..services.reminder_service import reminder_service
                reminder_id = arguments["reminder_id"]
                await reminder_service.delete(session, reminder_id)
                return f"Reminder {reminder_id} deleted successfully."

            elif name == "get_activity_log":
                limit = min(arguments.get("limit", 20), 100)
                logs = activity_service.list(session, limit=limit)
                if not logs:
                    return "No activity logs found."
                formatted = "\n".join([f"- [{log.created_at.strftime('%Y-%m-%d %H:%M:%S')}] [{log.entity_type.upper()}] {log.message}" for log in logs if not log.is_encrypted])
                return f"Recent Activity Logs (last {len(logs)}):\n{formatted}"

            elif name == "get_server_health":
                import os
                import sys
                import platform
                import shutil
                import subprocess
                from sqlalchemy import text
                from ..core.config import settings

                sys_info = f"{platform.system()} {platform.release()} ({platform.machine()})"
                py_version = sys.version.split()[0]
                
                total, used, free = shutil.disk_usage(".")
                disk_info = f"{used / (1024**3):.1f} GB used / {total / (1024**3):.1f} GB total ({free / (1024**3):.1f} GB free)"

                cpu_usage = "N/A"
                ram_usage = "N/A"
                if platform.system() == "Windows":
                    try:
                        res = subprocess.run("wmic cpu get LoadPercentage", shell=True, capture_output=True, text=True, timeout=1.0)
                        if res.returncode == 0:
                            lines = [l.strip() for l in res.stdout.splitlines() if l.strip()]
                            if len(lines) > 1:
                                cpu_usage = f"{lines[1]}%"
                    except Exception:
                        pass
                    try:
                        res = subprocess.run("wmic OS get FreePhysicalMemory,TotalVisibleMemorySize /Value", shell=True, capture_output=True, text=True, timeout=1.0)
                        if res.returncode == 0:
                            lines = res.stdout.strip().split("\n")
                            free_mem = None
                            total_mem = None
                            for line in lines:
                                if "FreePhysicalMemory" in line:
                                    free_mem = int(line.split("=")[1].strip())
                                elif "TotalVisibleMemorySize" in line:
                                    total_mem = int(line.split("=")[1].strip())
                            if free_mem and total_mem:
                                used_mem = total_mem - free_mem
                                ram_usage = f"{((used_mem / total_mem) * 100):.1f}% ({used_mem // 1024} MB / {total_mem // 1024} MB)"
                    except Exception:
                        pass
                elif platform.system() == "Linux":
                    try:
                        with open("/proc/meminfo", "r") as f:
                            lines = f.readlines()
                        mem_total, mem_avail = 0, 0
                        for line in lines:
                            if "MemTotal" in line:
                                mem_total = int(line.split()[1])
                            elif "MemAvailable" in line:
                                mem_avail = int(line.split()[1])
                        if mem_total and mem_avail:
                            used_mem = mem_total - mem_avail
                            ram_usage = f"{((used_mem / mem_total) * 100):.1f}% ({used_mem // 1024} MB / {mem_total // 1024} MB)"
                    except Exception:
                        pass
                    try:
                        with open("/proc/loadavg", "r") as f:
                            load = f.read().strip().split()
                        cpu_usage = f"Load Avg: {load[0]} (1m), {load[1]} (5m)"
                    except Exception:
                        pass

                db_path = settings.DATABASE_URL.replace("sqlite:///", "")
                db_size_mb = 0.0
                if os.path.exists(db_path):
                    db_size_mb = os.path.getsize(db_path) / (1024**2)
                
                try:
                    journal_mode = session.execute(text("PRAGMA journal_mode")).scalar()
                    integrity = session.execute(text("PRAGMA integrity_check")).scalar()
                    schema_ver = session.execute(text("PRAGMA schema_version")).scalar()
                except Exception as e:
                    journal_mode, integrity, schema_ver = "Unknown", f"Error: {e}", "Unknown"

                try:
                    tasks_count = session.execute(text("SELECT COUNT(*) FROM tasks")).scalar()
                    activities_count = session.execute(text("SELECT COUNT(*) FROM activity_log")).scalar()
                    memories_count = session.execute(text("SELECT COUNT(*) FROM knowledge_nodes")).scalar()
                    reminders_count = session.execute(text("SELECT COUNT(*) FROM reminders")).scalar()
                    habits_count = session.execute(text("SELECT COUNT(*) FROM habits")).scalar()
                    goals_count = session.execute(text("SELECT COUNT(*) FROM goals")).scalar()
                    notes_count = session.execute(text("SELECT COUNT(*) FROM notes")).scalar()
                except Exception as e:
                    tasks_count = activities_count = memories_count = reminders_count = habits_count = goals_count = notes_count = "Error"

                nvidia_status = "Offline"
                weather_status = "Offline"
                try:
                    async with httpx.AsyncClient() as client_http:
                        resp = await client_http.get("https://integrate.api.nvidia.com/v1/models", timeout=2.0)
                        if resp.status_code in [200, 401]:
                            nvidia_status = "Online / Reachable"
                except Exception as e:
                    nvidia_status = f"Unreachable ({e.__class__.__name__})"

                try:
                    async with httpx.AsyncClient() as client_http:
                        resp = await client_http.get("https://api.open-meteo.com/v1/forecast?latitude=22.80&longitude=86.20&current=temperature_2m", timeout=2.0)
                        if resp.status_code == 200:
                            weather_status = "Online / Reachable"
                except Exception as e:
                    weather_status = f"Unreachable ({e.__class__.__name__})"

                report = (
                    "### NARI SYSTEM HEALTH & SERVER TELEMETRY REPORT:\n"
                    f"- **Host OS**: {sys_info}\n"
                    f"- **Python Version**: {py_version}\n"
                    f"- **CPU Load**: {cpu_usage}\n"
                    f"- **Memory (RAM) Usage**: {ram_usage}\n"
                    f"- **Disk Space**: {disk_info}\n"
                    "- **SQLite Database Health**:\n"
                    f"  - File Path: `{db_path}`\n"
                    f"  - Size: `{db_size_mb:.2f} MB`\n"
                    f"  - Schema Version: `{schema_ver}`\n"
                    f"  - Journal Mode: `{journal_mode.upper()}`\n"
                    f"  - Integrity Check: `{integrity}`\n"
                    "- **Database Table Record Metrics**:\n"
                    f"  - Tasks: `{tasks_count}` | Reminders: `{reminders_count}`\n"
                    f"  - Habits: `{habits_count}` | Goals: `{goals_count}`\n"
                    f"  - Knowledge Nodes (Memory): `{memories_count}` | Notes: `{notes_count}`\n"
                    f"  - Total Activity Logs: `{activities_count}`\n"
                    "- **External Service Integrations Connectivity**:\n"
                    f"  - NVIDIA NIM Endpoint: `{nvidia_status}`\n"
                    f"  - Open-Meteo Weather API: `{weather_status}`"
                )
                return report

            elif name == "run_server_cleanup":
                import os
                import tempfile
                import shutil
                import time
                from sqlalchemy import text
                from ..core.config import settings

                db_path = settings.DATABASE_URL.replace("sqlite:///", "")
                size_before = 0.0
                if os.path.exists(db_path):
                    size_before = os.path.getsize(db_path) / (1024**2)

                db_vacuumed = False
                db_err = None
                try:
                    session.commit()
                    with session.bind.connect() as conn:
                        conn.execution_options(isolation_level="AUTOCOMMIT").execute(text("VACUUM"))
                    db_vacuumed = True
                except Exception as e:
                    db_err = str(e)

                size_after = size_before
                if os.path.exists(db_path):
                    size_after = os.path.getsize(db_path) / (1024**2)

                db_integrity = "Unknown"
                try:
                    db_integrity = session.execute(text("PRAGMA integrity_check")).scalar()
                except Exception as e:
                    db_integrity = f"Error: {e}"

                cleaned_bytes = 0
                cleaned_dirs = 0
                temp_dir = tempfile.gettempdir()
                pytest_cleaned = []
                try:
                    for item in os.listdir(temp_dir):
                        if "pytest-of-" in item or "garbage-" in item:
                            full_path = os.path.join(temp_dir, item)
                            mtime = os.path.getmtime(full_path)
                            if time.time() - mtime > 3600:
                                try:
                                    if os.path.isdir(full_path):
                                        dir_size = 0
                                        for root, dirs, files in os.walk(full_path):
                                            for f in files:
                                                dir_size += os.path.getsize(os.path.join(root, f))
                                        shutil.rmtree(full_path)
                                        cleaned_bytes += dir_size
                                        cleaned_dirs += 1
                                        pytest_cleaned.append(item)
                                    else:
                                        file_size = os.path.getsize(full_path)
                                        os.remove(full_path)
                                        cleaned_bytes += file_size
                                        pytest_cleaned.append(item)
                                except Exception:
                                    pass
                except Exception as e:
                    pass

                activity_service.create(
                    session,
                    entity_type=EntityType.CONTEXT,
                    action="digested",
                    message=f"System Self-Healing Cleanup Executed. SQLite DB size optimized from {size_before:.2f}MB to {size_after:.2f}MB.",
                    entity_id=0,
                    payload={
                        "size_before_mb": size_before,
                        "size_after_mb": size_after,
                        "temp_dirs_removed": cleaned_dirs,
                        "temp_bytes_cleaned": cleaned_bytes
                    },
                    source="system"
                )

                feedback = (
                    "### NARI SYSTEM CLEANUP & SELF-HEALING COMPLETE:\n"
                    f"- **SQLite Database Optimizer**:\n"
                    f"  - Vacuum Executed: `{db_vacuumed}`" + (f" (Error: {db_err})" if db_err else "") + "\n"
                    f"  - Database Size: `{size_before:.2f} MB` -> `{size_after:.2f} MB` (Saved `{(size_before - size_after):.2f} MB`)\n"
                    f"  - DB Integrity Status: `{db_integrity}`\n"
                    f"- **Host Temp File Cleaner**:\n"
                    f"  - Temporary Pytest Directories Removed: `{cleaned_dirs}`\n"
                    f"  - Disk Space Reclaimed: `{cleaned_bytes / (1024**2):.3f} MB` ({cleaned_bytes} bytes)\n"
                    f"  - Cleaned Items: {', '.join(pytest_cleaned[:5])}" + ("..." if len(pytest_cleaned) > 5 else "")
                )
                return feedback
                    
            else:
                return f"Error: Tool '{name}' is not recognized."
                
        except Exception as e:
            print(f"TOOL EXECUTION ERROR: {e}")
            return f"Error executing tool '{name}': {str(e)}"



tool_registry = ToolRegistry()
