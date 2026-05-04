"""In-process event bus for cross-service communication.

Services emit events after successful DB commit. Other services or components
subscribe to these events (e.g., for WebSocket broadcasting). No service should
call another service directly — use the event bus instead.
"""

import asyncio
from typing import Dict, List, Callable, Any
from datetime import datetime
import json
from ..core.logging import get_logger

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

    def emit(self, event_name: str, data: Dict[str, Any]) -> None:
        """Emit an event synchronously (non-blocking)."""
        if event_name in self._subscribers:
            for callback in self._subscribers[event_name]:
                try:
                    # Fire and forget - don't block on callbacks
                    asyncio.create_task(self._safe_call(callback, event_name, data))
                except Exception as e:
                    logger.error(f"Error in event callback for {event_name}: {e}")

    async def _safe_call(self, callback: Callable, event_name: str, data: Dict[str, Any]) -> None:
        try:
            result = callback(event_name, data)
            if asyncio.iscoroutine(result):
                await result
        except Exception as e:
            logger.error(f"Error in event callback {event_name}: {e}")

    def emit_ws_event(
        self,
        event: str,
        entity_type: str,
        entity_id: int,
        data: Dict[str, Any] = None,
    ) -> Dict[str, Any]:
        """Emit a standardized WebSocket event.

        This creates the event envelope that WebSocket clients expect:
        {
            "event": "task_created",
            "entity_type": "task",
            "entity_id": 12,
            "timestamp": "2026-04-28T10:00:00Z",
            "data": {}
        }
        """
        envelope = {
            "event": event,
            "entity_type": entity_type,
            "entity_id": entity_id,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "data": data or {},
        }
        self.emit(event, envelope)
        logger.debug(f"WS event emitted: {event} for {entity_type}:{entity_id}")
        return envelope


def get_event_bus() -> EventBus:
    """Get the singleton event bus instance."""
    return EventBus()