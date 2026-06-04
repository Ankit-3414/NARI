"""In-process event bus for cross-service communication.

Services emit events after successful DB commit. Other services or components
subscribe to these events (e.g., for WebSocket broadcasting). No service should
call another service directly — use the event bus instead.
"""

import asyncio
from typing import Any, Callable, Dict, List

from ..core.logging import get_logger
from ..utils.datetime_utils import utc_now

logger = get_logger(__name__)


class EventBus:
    """Simple in-process event bus with synchronous emit and async subscribers."""

    _instance: "EventBus" = None

    def __new__(cls) -> "EventBus":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._subscribers: Dict[str, List[Callable]] = {}
        return cls._instance

    def subscribe(self, event_name: str, callback: Callable) -> None:
        """Subscribe to an event."""
        if event_name not in self._subscribers:
            self._subscribers[event_name] = []
        self._subscribers[event_name].append(callback)
        logger.debug(f"Subscribed to event: {event_name}")

    async def emit(self, event_name: str, data: Dict[str, Any]) -> None:
        """Emit an event and execute subscribers. 
        
        Audit logging and broadcasting are offloaded to background tasks 
        to ensure the main request is never blocked.
        """
        if event_name not in self._subscribers:
            return

        for callback in self._subscribers[event_name]:
            # We schedule these as tasks so they don't block each other or the caller
            asyncio.create_task(self._safe_call(callback, event_name, data))

    async def _safe_call(self, callback: Callable, event_name: str, data: Dict[str, Any]) -> None:
        try:
            result = callback(event_name, data)
            if asyncio.iscoroutine(result):
                await result
        except Exception as e:
            logger.error(f"Error in event callback {event_name}: {e}")

    async def emit_ws_event(
        self,
        event: str,
        entity_type: str,
        entity_id: int,
        data: Dict[str, Any] = None,
    ) -> Dict[str, Any]:
        """Emit a standardized WebSocket event and await broadcast."""
        envelope = {
            "event": event,
            "entity_type": entity_type,
            "entity_id": entity_id,
            "timestamp": utc_now().isoformat(),
            "data": data or {},
        }
        await self.emit(event, envelope)
        logger.debug(f"WS event emitted: {event} for {entity_type}:{entity_id}")
        return envelope


def get_event_bus() -> EventBus:
    """Get the singleton event bus instance."""
    return EventBus()


_listeners_setup = False


async def _on_reminder_updated(event_name: str, payload: Dict[str, Any]) -> None:
    """Handle side effects when a reminder is updated or dismissed."""
    from ..services.task_service import task_service
    from ..schemas.task import TaskUpdate
    from ..core.constants import TaskStatus
    from ..db.session import engine
    from sqlmodel import Session
    from ..core.errors import NariError
    from ..websocket.events import EventNames

    data = payload.get("data", {})
    task_id = data.get("task_id")

    if not task_id:
        return

    with Session(engine) as session:
        try:
            task = task_service.get(session, task_id)
            if event_name == EventNames.REMINDER_DISMISSED.value:
                if task.status != TaskStatus.DONE:
                    await task_service.update(session, task_id, TaskUpdate(status=TaskStatus.DONE))
            elif event_name == EventNames.REMINDER_UPDATED.value and data.get("status") == "skipped":
                if task.status != TaskStatus.CANCELLED:
                    await task_service.update(session, task_id, TaskUpdate(status=TaskStatus.CANCELLED))
        except NariError:
            logger.warning("Linked task %s was not found while handling reminder event %s", task_id, event_name)


async def _on_context_logged(event_name: str, payload: Dict[str, Any]) -> None:
    """Automatically digest new context logs as they are written."""
    from ..services.context_service import context_service
    from ..db.session import engine
    from sqlmodel import Session

    # Wait 1.0s to ensure the activity log writer has completed database write and commit
    await asyncio.sleep(1.0)

    with Session(engine) as session:
        try:
            logger.info("Auto-digesting new context log...")
            learned = await context_service.digest_context(session)
            if learned:
                logger.info(f"Auto-digestion complete. Learned concepts: {learned}")
        except Exception as e:
            logger.error(f"Failed to auto-digest context: {e}")


def setup_event_listeners() -> None:
    """Initialize all event subscribers."""
    global _listeners_setup
    if _listeners_setup:
        return

    from ..services.activity_service import activity_service
    from ..websocket.events import EventNames
    from ..websocket.manager import manager

    bus = get_event_bus()

    # ActivityLog subscribers
    activity_events = [
        EventNames.TASK_CREATED,
        EventNames.TASK_UPDATED,
        EventNames.TASK_COMPLETED,
        EventNames.TASK_DELETED,
        EventNames.TASK_REOPENED,
        EventNames.SUBJECT_CREATED,
        EventNames.SUBJECT_UPDATED,
        EventNames.SUBJECT_ARCHIVED,
        EventNames.STUDY_STARTED,
        EventNames.STUDY_PAUSED,
        EventNames.STUDY_RESUMED,
        EventNames.STUDY_STOPPED,
        EventNames.NOTE_CREATED,
        EventNames.NOTE_UPDATED,
        EventNames.NOTE_DELETED,
        EventNames.REMINDER_CREATED,
        EventNames.REMINDER_UPDATED,
        EventNames.REMINDER_DELETED,
        EventNames.REMINDER_TRIGGERED,
        EventNames.REMINDER_SNOOZED,
        EventNames.REMINDER_DISMISSED,
        EventNames.GOAL_CREATED,
        EventNames.GOAL_UPDATED,
        EventNames.GOAL_DELETED,
        EventNames.GOAL_PROGRESS_UPDATED,
        EventNames.HABIT_CREATED,
        EventNames.HABIT_UPDATED,
        EventNames.HABIT_DELETED,
        EventNames.HABIT_COMPLETED,
        EventNames.HABIT_STREAK_UPDATED,
        EventNames.CONTEXT_LOGGED,
    ]

    async def broadcast_handler(event_name: str, data: Dict[str, Any]):
        """Handler to broadcast events via WebSockets."""
        await manager.broadcast(
            event=data.get("event", event_name),
            entity_type=data.get("entity_type", "unknown"),
            entity_id=data.get("entity_id", 0),
            data=data.get("data", {})
        )

    for event in activity_events:
        # Subscribe for Activity Logging (Sync)
        bus.subscribe(event, activity_service.handle_event)
        # Subscribe for WebSocket Broadcasting (Async)
        bus.subscribe(event, broadcast_handler)

    # Cross-service side effects
    bus.subscribe(EventNames.REMINDER_DISMISSED.value, _on_reminder_updated)
    bus.subscribe(EventNames.REMINDER_UPDATED.value, _on_reminder_updated)
    bus.subscribe(EventNames.CONTEXT_LOGGED.value, _on_context_logged)

    _listeners_setup = True
    logger.info(f"Initialized {len(activity_events)} event listeners (ActivityLog + WS)")
