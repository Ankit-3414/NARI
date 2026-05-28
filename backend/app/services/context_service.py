from ..core.constants import EntityType
from ..core.events import get_event_bus
from ..services.activity_service import activity_service
from ..websocket.events import EventNames
from ..db import session as db_session
from sqlmodel import Session

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
        
        # Also write directly to ActivityLog to satisfy engineering rule #4
        with Session(db_session.engine) as session:
            activity_service.create(
                session=session,
                entity_type=EntityType.CONTEXT,
                entity_id=None,
                action="logged",
                message=text[:200],  # First 200 chars for message
                payload={"text": text, "source": source},
                source=source,
                actor="user",
            )
        
        return True

context_service = ContextService()
