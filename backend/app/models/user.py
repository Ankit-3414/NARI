"""User model - single user system for now.

Schema is multi-user ready even though we're single-user now.
"""

from sqlmodel import SQLModel, Field, Index
from typing import Optional
from ..core.constants import EntityType


class User(SQLModel, table=True):
    """User table - single user for now, multi-user ready."""
    __tablename__ = "users"

    id: Optional[int] = Field(
        default=None,
        primary_key=True,
        description="Primary key",
    )
    username: str = Field(
        sa_column_kwargs={"nullable": False, "unique": True},
        description="Unique username",
        max_length=100,
    )
    display_name: Optional[str] = Field(
        default=None,
        sa_column_kwargs={"nullable": True},
        description="Display name",
        max_length=100,
    )
    api_key_hash: str = Field(
        sa_column_kwargs={"nullable": False},
        description="Hashed API key",
        max_length=255,
    )
    timezone: str = Field(
        default="Asia/Kolkata",
        sa_column_kwargs={"nullable": False},
        description="User timezone",
        max_length=50,
    )
    theme: str = Field(
        default="dark",
        sa_column_kwargs={"nullable": False},
        description="UI theme preference",
        max_length=20,
    )
    last_seen_at: Optional[datetime] = Field(
        default=None,
        sa_column_kwargs={"nullable": True},
        description="Last activity timestamp",
    )
    preferences_json: Optional[str] = Field(
        default=None,
        sa_column_kwargs={"nullable": True},
        description="Miscellaneous preferences as JSON",
    )

    __table_args__ = (
        Index("idx_users_username", "username"),
    )