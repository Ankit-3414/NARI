"""Context Builder for NARI AI.

Assembles a structured context window representing the user's current state.
"""

from typing import Any
from sqlmodel import Session
from datetime import datetime

from ..services.task_service import task_service
from ..services.reminder_service import reminder_service
from ..services.activity_service import activity_service
from ..services.study_service import study_service
from ..services.semantic_memory import semantic_memory
from ..core.constants import EntityType
from ..utils.privacy import redact_text_pii

class ContextBuilder:
    def __init__(self):
        self._cached_project_meta = None

    def build_context_window(
        self, 
        session: Session, 
        current_query: str = "",
        latitude: float | None = None,
        longitude: float | None = None,
        active_node_label: str | None = None,
        is_pure_greeting: bool = False
    ) -> str:
        """Builds a string representation of the current context for the LLM."""
        from ..services.user_service import user_service
        from ..utils.datetime_utils import localize_datetime, utc_now
        
        user = user_service.get_default_user(session)
        tz_name = user.timezone
        
        # Localize current time to user's timezone
        now = localize_datetime(utc_now(), tz_name)
        
        # Parse weather telemetry from user preferences
        import json
        preferences = {}
        if user.preferences_json:
            try:
                preferences = json.loads(user.preferences_json)
            except Exception:
                preferences = {}
                
        weather_city = preferences.get("weather_city")
        weather_temp = preferences.get("weather_temp")
        weather_condition = preferences.get("weather_condition")
        
        weather_str = ""
        if weather_city and weather_temp is not None and weather_condition:
            weather_str = f"WEATHER TELEMETRY: {weather_temp}°C, {weather_condition} in {weather_city}\n"
        
        # 1. Current Time & State
        context = f"CURRENT TIME: {now.strftime('%A, %Y-%m-%d %H:%M:%S')}\n"
        if active_node_label:
            context += f"CURRENT LOCATION: {active_node_label.upper()}\n"
        elif latitude is not None and longitude is not None:
            context += f"CURRENT COORDINATES: Lat {latitude:.6f}, Lng {longitude:.6f} (Transit Mode)\n"
        if weather_str:
            context += weather_str
        context += "\n"
        
        # 2. Deep Knowledge (Dynamic Persona Injection)
        if current_query and not is_pure_greeting and len(current_query.strip().split()) >= 2:
            try:
                relevant_knowledge = semantic_memory.search_knowledge(session, current_query, limit=5)
                if relevant_knowledge:
                    context += "CORE DIRECTIVES & RETRIEVED KNOWLEDGE:\n"
                    for k in relevant_knowledge:
                        context += f"- [{k.concept}]: {k.summary}\n"
                    context += "\n"
            except Exception as e:
                # Fail gracefully if sqlite-vec is acting up
                print(f"KNOWLEDGE RETRIEVAL ERROR: {e}")
                context += f"(Knowledge retrieval offline)\n\n"

        # 2b. Project Roadmap & Self-Awareness
        context += self._get_project_meta() + "\n"

        # 3. Today's Tasks
        today_tasks = task_service.today(session)
        context += "TODAY'S TASKS:\n"
        if today_tasks:
            for t in today_tasks:
                context += f"- [ID: {t.id}] {t.title} (Priority: {t.priority.value}, Status: {t.status.value})\n"
        else:
            context += "- No pending tasks for today.\n"
        context += "\n"

        # 3b. Active Habits
        from ..services.habit_service import habit_service
        habits = habit_service.list(session)
        context += "ACTIVE HABITS:\n"
        if habits:
            for h in habits:
                context += f"- [ID: {h.id}] {h.name} (Streak: {h.current_streak} days, Frequency: {h.frequency.value})\n"
        else:
            context += "- No active habits.\n"
        context += "\n"

        # 3c. Active Goals
        from ..services.goal_service import goal_service
        goals = goal_service.list(session)
        # Filter to only active/in-progress goals
        active_goals = [g for g in goals if g.status.value in ["pending", "in_progress", "active"]]
        context += "ACTIVE GOALS:\n"
        if active_goals:
            for g in active_goals:
                target_str = f"/{g.target_value}" if g.target_value else ""
                context += f"- [ID: {g.id}] {g.title} (Progress: {g.current_value}{target_str}, Scope: {g.scope.value}, Status: {g.status.value})\n"
        else:
            context += "- No active goals.\n"
        context += "\n"

        # 3d. Active Reminders
        active_reminders = reminder_service.list(session, include_triggered=True)
        # Filter to only scheduled/triggered
        active_reminders = [r for r in active_reminders if r.status.value in ["scheduled", "triggered"]]
        context += "ACTIVE REMINDERS:\n"
        if active_reminders:
            for r in active_reminders:
                due_local = localize_datetime(r.due_at, tz_name)
                context += f"- [ID: {r.id}] {r.title} (Due: {due_local.strftime('%Y-%m-%d %H:%M:%S')}, Status: {r.status.value})\n"
        else:
            context += "- No active reminders.\n"
        context += "\n"

        # 4. Study State
        active_session = study_service.get_active(session)
        if active_session:
            started_local = localize_datetime(active_session.started_at, tz_name)
            context += f"CURRENTLY STUDYING: Subject ID {active_session.subject_id} (Started: {started_local.strftime('%Y-%m-%d %H:%M:%S')})\n\n"

        # 5. Recent Activity (Last 10 events)
        recent_activity = activity_service.list(session, limit=10)
        context += "RECENT BEHAVIORAL HISTORY (Last 10 Actions):\n"
        if recent_activity:
            # Reverse to show chronological order (oldest first in the list of recent)
            for a in reversed(recent_activity):
                msg = a.message
                a_created_local = localize_datetime(a.created_at, tz_name)
                context += f"- [{a_created_local.strftime('%H:%M:%S')}] {msg}\n"
        else:
            context += "- No recent activity.\n"

        return redact_text_pii(context)

    def _get_project_meta(self) -> str:
        """Reads NARI's own README.md and PRODUCT.md to extract product purpose and roadmap features."""
        if self._cached_project_meta is not None:
            return self._cached_project_meta

        import os
        try:
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
            readme_path = os.path.join(base_dir, "README.md")
            
            roadmap_lines = []
            if os.path.exists(readme_path):
                with open(readme_path, "r", encoding="utf-8") as f:
                    lines = f.readlines()
                
                in_roadmap = False
                for line in lines:
                    if "## Roadmap" in line:
                        in_roadmap = True
                        continue
                    if in_roadmap:
                        # Stop at next major heading (except subheadings like ### Phase)
                        if line.startswith("## ") and not line.startswith("### ") and not "Roadmap" in line:
                            break
                        stripped = line.strip()
                        if stripped:
                            roadmap_lines.append(stripped)
                            
            roadmap_str = "\n".join(roadmap_lines) if roadmap_lines else "No roadmap found."
            
            from ..core.config import settings
            meta = (
                "NARI ARCHITECTURE & ROADMAP:\n"
                f"- Current version: {settings.NARI_VERSION}\n"
                "- Self-hosted environment: Ubuntu Server 24.04, Nginx proxy, systemd process supervisor\n"
                "- Active specifications:\n"
                f"{roadmap_str}\n"
            )
            self._cached_project_meta = meta
            return meta
        except Exception as e:
            return f"NARI ARCHITECTURE & ROADMAP: (Unable to read project files: {str(e)})\n"

context_builder = ContextBuilder()
