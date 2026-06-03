"""Backend Intent Engine.

Ported from frontend/src/components/context/contextSuggestionRules.js.
Provides rule-based intent classification for natural language inputs.
"""

import re
from datetime import datetime, timedelta
from typing import Any, Optional

from ..core.constants import TaskPriority


class IntentEngine:
    """Classifies natural language input into structured intents."""

    def get_suggestions(self, text: str) -> list[dict[str, Any]]:
        """Return a list of suggestions based on rules."""
        value = text.strip()
        if not value:
            return []
        
        lower = value.toLowerCase() if hasattr(value, 'toLowerCase') else value.lower()
        suggestions = []

        # 1. Tasks
        if lower.startswith("todo:") or lower.startswith("task:"):
            prefix = "todo:" if lower.startswith("todo:") else "task:"
            title = value[len(prefix):].strip()
            suggestions.append({
                "type": "task",
                "label": "Create Task",
                "confidence": "rule",
                "payload": {
                    "title": title or "Context task",
                    "description": value,
                    "priority": TaskPriority.NORMAL,
                },
            })

        # 2. Reminders
        reminder = self._build_reminder_suggestion(value)
        if reminder:
            suggestions.append(reminder)

        # 3. Habits
        habit = self._build_habit_suggestion(value)
        if habit:
            suggestions.append(habit)

        # 4. Study Sessions
        study = self._build_study_suggestion(value)
        if study:
            suggestions.append(study)

        # 5. Mood
        mood = self._build_mood_suggestion(value)
        if mood:
            suggestions.append(mood)

        # 6. Notes
        if lower.startswith("note:") or lower.startswith("idea:"):
            prefix = "note:" if lower.startswith("note:") else "idea:"
            content = value[len(prefix):].strip()
            suggestions.append({
                "type": "note",
                "label": "Save Note",
                "confidence": "rule",
                "payload": {
                    "title": (content[:60] if content else "Context note"),
                    "content_markdown": value,
                    "tags": ["context-stream"],
                },
            })

        return suggestions

    def _build_reminder_suggestion(self, text: str) -> Optional[dict[str, Any]]:
        lower = text.lower()
        if not lower.startswith("remind me to "):
            return None

        body = text[len("remind me to "):].strip()
        day_offset = 1 if "tomorrow" in lower else 0
        
        clock = self._parse_clock(body)
        if not clock:
            return None

        hour, minute = clock
        
        # Clean up title
        title = body
        title = re.sub(r"\btomorrow\b", "", title, flags=re.IGNORECASE)
        title = re.sub(r"\btoday\b", "", title, flags=re.IGNORECASE)
        title = re.sub(r"\bat\s*\d{1,2}(?::\d{2})?\s*(?:am|pm)?\b", "", title, flags=re.IGNORECASE)
        title = title.strip()

        due_at = datetime.now() + timedelta(days=day_offset)
        due_at = due_at.replace(hour=hour, minute=minute, second=0, microsecond=0)

        return {
            "type": "reminder",
            "label": "Create Reminder",
            "confidence": "rule",
            "payload": {
                "title": title or "Context reminder",
                "message": text,
                "due_at": due_at.isoformat(),
            },
        }

    def _parse_clock(self, value: str) -> Optional[tuple[int, int]]:
        match = re.search(r"\b(?:at\s*)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b", value, re.IGNORECASE)
        if not match:
            return None

        hour = int(match.group(1))
        minute = int(match.group(2)) if match.group(2) else 0
        meridiem = match.group(3).lower() if match.group(3) else None

        if meridiem == "pm" and hour < 12:
            hour += 12
        if meridiem == "am" and hour == 12:
            hour = 0
        
        if hour > 23 or minute > 59:
            return None

        return hour, minute

    def _build_habit_suggestion(self, text: str) -> Optional[dict[str, Any]]:
        lower = text.lower()
        habit_patterns = [
            {"phrase": "drank water", "habit": "Drink Water"},
            {"phrase": "exercised", "habit": "Exercise"},
            {"phrase": "worked out", "habit": "Exercise"},
            {"phrase": "ran", "habit": "Run"},
            {"phrase": "went for a run", "habit": "Run"},
            {"phrase": "meditated", "habit": "Meditation"},
            {"phrase": "read for", "habit": "Reading"},
            {"phrase": "studied", "habit": "Study"},
        ]

        for p in habit_patterns:
            if p["phrase"] in lower:
                return {
                    "type": "habit",
                    "label": f"Log {p['habit']}",
                    "confidence": "rule",
                    "payload": {
                        "habit_name": p["habit"],
                        "notes": text,
                    },
                }
        return None

    def _build_study_suggestion(self, text: str) -> Optional[dict[str, Any]]:
        lower = text.lower()
        
        # studied [subject] for [time]
        match = re.search(r"studied\s+(.+?)\s+for\s+(\d+(?:\.\d+)?)\s*(hour|hr|hours|mins?)", lower)
        if match:
            subject, time, unit = match.groups()
            minutes = float(time) * 60 if unit.startswith("h") else float(time)
            return {
                "type": "study",
                "label": "Log Study Session",
                "confidence": "rule",
                "payload": {
                    "subject_id": subject.strip(),
                    "duration_minutes": int(round(minutes)),
                    "notes": text,
                },
            }
        
        # studied [subject]
        match = re.search(r"studied\s+(.+)", lower)
        if match:
            subject = match.group(1).strip()
            return {
                "type": "study",
                "label": "Log Study Session",
                "confidence": "rule",
                "payload": {
                    "subject_id": subject,
                    "duration_minutes": 0,
                    "notes": text,
                },
            }
        return None

    def _build_mood_suggestion(self, text: str) -> Optional[dict[str, Any]]:
        lower = text.lower()
        mood_patterns = [
            {"phrase": "feeling productive", "mood": "productive", "emoji": "💪"},
            {"phrase": "feeling focused", "mood": "focused", "emoji": "🎯"},
            {"phrase": "feeling tired", "mood": "tired", "emoji": "😴"},
            {"phrase": "feeling stressed", "mood": "stressed", "emoji": "😰"},
            {"phrase": "feeling happy", "mood": "happy", "emoji": "😊"},
            {"phrase": "feeling sad", "mood": "sad", "emoji": "😢"},
            {"phrase": "feeling anxious", "mood": "anxious", "emoji": "😟"},
            {"phrase": "feeling energized", "mood": "energized", "emoji": "⚡"},
            {"phrase": "feeling calm", "mood": "calm", "emoji": "🧘"},
            {"phrase": "feeling motivated", "mood": "motivated", "emoji": "🚀"},
        ]

        for p in mood_patterns:
            if p["phrase"] in lower:
                return {
                    "type": "mood",
                    "label": "Log Mood",
                    "confidence": "rule",
                    "payload": {
                        "mood": p["mood"],
                        "notes": text,
                        "emoji": p["emoji"],
                    },
                }
        return None


intent_engine = IntentEngine()
