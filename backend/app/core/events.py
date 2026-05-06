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
        """Emit an event and await all subscribers."""
        if event_name not in self._subscribers:
            return

        tasks = []
        for callback in self._subscribers[event_name]:
            tasks.append(self._safe_call(callback, event_name, data))
        
        if tasks:
            await asyncio.gather(*tasks)

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
        EventNames.REMINDER_TRIGGERED,
        EventNames.REMINDER_SNOOZED,
        EventNames.REMINDER_DISMISSED,
        EventNames.GOAL_CREATED,
        EventNames.GOAL_PROGRESS_UPDATED,
        EventNames.HABIT_COMPLETED,
        EventNames.HABIT_STREAK_UPDATED,
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

    _listeners_setup = True
    logger.info(f"Initialized {len(activity_events)} event listeners (ActivityLog + WS)")
