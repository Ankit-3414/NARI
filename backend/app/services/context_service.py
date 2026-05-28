from ..core.constants import EntityType
from ..core.events import get_event_bus
from ..websocket.events import EventNames

class ContextService:
    @staticmethod
    async def log_context(text: str, source: str = "api") -> bool:
        """
        Logs raw user context to the ActivityLog.
        This is a frictionless entry point for behavioral data.
        """
        # We use emit_ws_event to ensure a standardized envelope that 
        # ActivityService.handle_event can process correctly.
        await get_event_bus().emit_ws_event(
            event=EventNames.CONTEXT_LOGGED.value,
            entity_type=EntityType.CONTEXT.value,
            entity_id=0,  # Context entries don't have a primary ID beyond the log itself
            data={
                "text": text,
                "action": "logged",
                "message": text[:500],
                "source": source
            }
        )
        
        return True

context_service = ContextService()
