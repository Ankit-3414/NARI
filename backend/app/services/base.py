"""Base service with unified CRUD, auditing, and event emission."""

from __future__ import annotations

import json
from typing import Any, Generic, TypeVar, Optional, Type

from sqlmodel import Session, SQLModel, select

from ..core.constants import EntityType
from ..core.errors import NariError
from ..core.events import get_event_bus
from ..websocket.events import EventNames

ModelType = TypeVar("ModelType", bound=SQLModel)
CreateSchemaType = TypeVar("CreateSchemaType", bound=Any)
UpdateSchemaType = TypeVar("UpdateSchemaType", bound=Any)


class BaseService(Generic[ModelType, CreateSchemaType, UpdateSchemaType]):
    """Generic service implementing the NARI lifecycle: Commit -> Audit -> Emit."""

    def __init__(self, model: Type[ModelType], entity_type: EntityType):
        self.model = model
        self.entity_type = entity_type

    def get(self, session: Session, id: int) -> ModelType:
        """Fetch a single record by ID."""
        obj = session.get(self.model, id)
        if obj is None:
            raise NariError(
                f"{self.entity_type.value.upper()}_NOT_FOUND",
                f"{self.entity_type.value.capitalize()} with id {id} does not exist",
                404,
            )
        return obj

    async def create(
        self, 
        session: Session, 
        payload: CreateSchemaType, 
        event_name: EventNames
    ) -> ModelType:
        """Standard create with audit and event emission."""
        data = payload.model_dump()
        # Handle special field logic in subclasses via hooks if needed
        obj = self.model(**data)
        
        session.add(obj)
        session.flush()
        session.commit()
        session.refresh(obj)
        
        await self._emit_event(event_name, obj)
        return obj

    async def update(
        self, 
        session: Session, 
        id: int, 
        payload: UpdateSchemaType, 
        event_name: EventNames
    ) -> ModelType:
        """Standard update with audit and event emission."""
        obj = self.get(session, id)
        updates = payload.model_dump(exclude_unset=True)
        
        for key, value in updates.items():
            setattr(obj, key, value)
            
        if hasattr(obj, "updated_at"):
            from ..utils.datetime_utils import utc_now
            obj.updated_at = utc_now()

        session.add(obj)
        session.commit()
        session.refresh(obj)
        
        await self._emit_event(event_name, obj)
        return obj

    async def _emit_event(
        self,
        event: EventNames,
        obj: ModelType,
    ) -> None:
        """Emit standardized event."""
        await get_event_bus().emit_ws_event(
            event=event.value,
            entity_type=self.entity_type.value,
            entity_id=getattr(obj, "id"),
            data=self.to_data(obj),
        )

    def to_data(self, obj: ModelType) -> dict[str, Any]:
        """Convert model to dict. Override in subclass for custom serialization."""
        return obj.model_dump(mode="json")
