"""ActivityLog writer service."""
import json
from typing import Any

from sqlmodel import Session, select

from ..core.constants import EntityType
from ..core.logging import get_logger
from ..db import session as db_session
from ..models.activity_log import ActivityLog

logger = get_logger(__name__)


class ActivityService:
    """Append-only writer for the NARI ActivityLog."""

    def handle_event(self, event_name: str, payload: dict[str, Any]) -> None:
        """Handle an event from the EventBus by logging it."""
        # The payload is the WS envelope: {event, entity_type, entity_id, timestamp, data}
        entity_type = payload.get("entity_type")
        entity_id = payload.get("entity_id")
        data = payload.get("data", {})

        # Derive action and message from event name and data if not provided
        action = data.get("action", event_name.split("_")[-1])
        message = data.get("message", f"{entity_type} {action}")

        # ActivityLog writes must not block the main operation
        with Session(db_session.engine) as session:
            self.create(
                session,
                entity_type=EntityType(entity_type),
                entity_id=entity_id,
                action=action,
                message=message,
                payload=data,
            )

    def list(
        self,
        session: Session,
        *,
        entity_type: EntityType | None = None,
        entity_id: int | None = None,
        limit: int = 20,
    ) -> list[ActivityLog]:
        """List recent ActivityLog entries."""
        statement = select(ActivityLog)
        if entity_type is not None:
            statement = statement.where(ActivityLog.entity_type == entity_type)
        if entity_id is not None:
            statement = statement.where(ActivityLog.entity_id == entity_id)
        statement = statement.order_by(ActivityLog.created_at.desc()).limit(limit)
        return list(session.exec(statement).all())

    def create(
        self,
        session: Session,
        *,
        entity_type: EntityType,
        action: str,
        message: str,
        entity_id: int | None = None,
        payload: dict[str, Any] | None = None,
        source: str = "api",
        actor: str = "user",
    ) -> ActivityLog | None:
        """Write one ActivityLog entry and commit it.

        Activity logging must not roll back the main operation if it fails.
        Call this after the main service operation has committed.
        """
        try:
            entry = ActivityLog(
                entity_type=entity_type,
                entity_id=entity_id,
                action=action,
                message=message,
                payload_json=json.dumps(payload) if payload is not None else None,
                source=source,
                actor=actor,
            )
            session.add(entry)
            session.commit()
            session.refresh(entry)
            return entry
        except Exception:
            session.rollback()
            logger.exception("ActivityLog write failed")
            return None

    def to_data(self, entry: ActivityLog) -> dict[str, Any]:
        """Serialize an ActivityLog entry for API responses."""
        return {
            "id": entry.id,
            "entity_type": entry.entity_type.value,
            "entity_id": entry.entity_id,
            "action": entry.action,
            "message": entry.message,
            "payload_json": entry.payload_json,
            "source": entry.source,
            "actor": entry.actor,
            "created_at": entry.created_at.isoformat(),
        }


activity_service = ActivityService()
