"""Tag service for managing normalized tags."""

from typing import Any

from sqlmodel import Session, select, delete
import sqlalchemy as sa

from ..core.constants import EntityType
from ..models.tag import Tag, EntityTag


class TagService:
    """Business logic for normalized tags."""

    def get_tags(self, session: Session, entity_id: int, entity_type: EntityType) -> list[str]:
        """Get tags for an entity."""
        statement = select(Tag.name).join(EntityTag).where(
            EntityTag.entity_id == entity_id,
            EntityTag.entity_type == entity_type
        )
        return list(session.exec(statement).all())

    def set_tags(self, session: Session, entity_id: int, entity_type: EntityType, tags: list[str] | None) -> None:
        """Set tags for an entity, replacing existing ones."""
        # Delete existing links
        session.execute(
            delete(EntityTag).where(
                EntityTag.entity_id == entity_id,
                EntityTag.entity_type == entity_type
            )
        )
        
        if not tags:
            return

        for tag_name in tags:
            tag_name = tag_name.strip().lower()
            if not tag_name:
                continue
            
            # Get or create tag
            statement = select(Tag).where(Tag.name == tag_name)
            tag = session.exec(statement).first()
            if not tag:
                tag = Tag(name=tag_name)
                session.add(tag)
                session.flush()
            
            # Add link
            session.add(EntityTag(tag_id=tag.id, entity_id=entity_id, entity_type=entity_type))

    def list_tags(self, session: Session) -> list[str]:
        """List all unique tags."""
        statement = select(Tag.name).order_by(Tag.name)
        return list(session.exec(statement).all())


tag_service = TagService()
