"""Tag models for the normalized tagging system."""

from typing import Optional

from sqlmodel import Field, SQLModel

from ..core.constants import EntityType
from ..db.base import BaseModel


class Tag(BaseModel, table=True):
    """Normalized Tag table."""
    __tablename__ = "tags"

    name: str = Field(
        sa_column_kwargs={"nullable": False, "unique": True},
        description="Tag name",
        max_length=50,
        index=True,
    )


class EntityTag(SQLModel, table=True):
    """Junction table linking tags to entities."""
    __tablename__ = "entity_tags"

    tag_id: int = Field(
        foreign_key="tags.id",
        primary_key=True,
        description="Tag ID",
    )
    entity_id: int = Field(
        primary_key=True,
        description="ID of the entity being tagged",
    )
    entity_type: EntityType = Field(
        primary_key=True,
        description="Type of the entity being tagged",
    )
