"""Base SQLModel class with common fields inherited by all models."""

from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel

from ..utils.datetime_utils import utc_now


class TimestampMixin(SQLModel):
    """Mixin that adds created_at and updated_at fields.

    All models inherit from this to ensure time-aware records from day one.
    """
    created_at: Optional[datetime] = Field(
        default_factory=utc_now,
        nullable=False,
        description="UTC timestamp when the record was created",
    )
    updated_at: Optional[datetime] = Field(
        default_factory=utc_now,
        nullable=False,
        description="UTC timestamp when the record was last updated",
    )


class BaseModel(TimestampMixin):
    """Base model with id and timestamps. All table models inherit from this."""
    id: Optional[int] = Field(
        default=None,
        primary_key=True,
        description="Primary key (autoincrement)",
    )
