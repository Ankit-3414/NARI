"""ActivityLog model - the memory layer of NARI.

The most important table in the system. Every meaningful action is logged here
so the future AI has behavioral history to reason about. Never skip writing
to this table. It is append-only and never updated.

Rules (non-negotiable):
1. Every service method that modifies state MUST write to ActivityLog
2. ActivityLog writes happen AFTER successful DB commit
3. ActivityLog is append-only - never update or delete entries
4. If an ActivityLog write fails, log the error but do NOT roll back main operation
5. ActivityLog writes must be non-blocking - use background task if slow
"""

from typing import Optional

from sqlmodel import Field, Index

from ..core.constants import EntityType
from ..db.base import BaseModel


class ActivityLog(BaseModel, table=True):
    """Activity log entry."""
    __tablename__ = "activity_logs"

    entity_type: EntityType = Field(
        sa_column_kwargs={"nullable": False, "index": True},
        description="Type of entity that was modified",
    )
    entity_id: Optional[int] = Field(
        default=None,
        sa_column_kwargs={"nullable": True, "index": True},
        description="ID of the entity (NULL for system events)",
    )
    action: str = Field(
        sa_column_kwargs={"nullable": False},
        description="Action performed (created|updated|completed|etc)",
        max_length=50,
    )
    message: str = Field(
        sa_column_kwargs={"nullable": False},
        description="Human-readable description",
        max_length=500,
    )
    payload_json: Optional[str] = Field(
        default=None,
        sa_column_kwargs={"nullable": True},
        description="Full context snapshot as JSON",
    )
    raw_content: Optional[str] = Field(
        default=None,
        sa_column_kwargs={"nullable": True},
        description="Raw or unredacted content block for FTS indexing",
    )
    is_encrypted: bool = Field(
        default=False,
        sa_column_kwargs={"nullable": False, "server_default": "0"},
        description="Whether the payload is encrypted",
    )
    source: str = Field(
        default="api",
        sa_column_kwargs={"nullable": False},
        description="Source of change (api|cli|scheduler|system)",
        max_length=20,
    )
    actor: str = Field(
        default="user",
        sa_column_kwargs={"nullable": False},
        description="Who performed the action (user|system)",
        max_length=20,
    )

    __table_args__ = (
        Index("idx_activity_log_entity", "entity_type", "entity_id"),
        Index("idx_activity_log_created", "created_at"),
    )
