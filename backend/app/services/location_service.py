from __future__ import annotations

from typing import Optional, List
from sqlmodel import Session, select
from datetime import datetime

from ..core.constants import EntityType
from ..websocket.events import EventNames
from ..models.location import LocationNode
from ..schemas.location import LocationCreate, LocationUpdate
from ..utils.datetime_utils import utc_now
from .base import BaseService

class LocationService(BaseService[LocationNode, LocationCreate, LocationUpdate]):
    """Business logic for physical location management."""

    def __init__(self):
        super().__init__(LocationNode, EntityType.LOCATION)

    async def list(self, session: Session, include_archived: bool = False) -> List[LocationNode]:
        """List all saved locations."""
        statement = select(LocationNode)
        if not include_archived:
            statement = statement.where(LocationNode.archived_at == None)
        return list(session.exec(statement).all())

    async def create_location(self, session: Session, payload: LocationCreate) -> LocationNode:
        """Create a new location node."""
        return await self.create(session, payload, EventNames.LOCATION_CREATED)

    async def update_location(self, session: Session, location_id: int, payload: LocationUpdate) -> LocationNode:
        """Update an existing location node."""
        return await self.update(session, location_id, payload, EventNames.LOCATION_UPDATED)

    async def delete_location(self, session: Session, location_id: int) -> LocationNode:
        """Soft-delete (archive) a location node."""
        location = self.get(session, location_id)
        location.archived_at = utc_now()
        location.updated_at = utc_now()
        
        session.add(location)
        session.commit()
        session.refresh(location)
        
        await self._emit_event(EventNames.LOCATION_DELETED, location)
        return location

location_service = LocationService()
