"""Study session model with interruption tracking.

CRITICAL: interrupt_count and interruptions_json are included from day one.
Historical interruption data CANNOT be reconstructed if these fields are added later.
Every study session tracks exactly how many times it was paused.
"""

from datetime import datetime
from typing import Optional

from sqlmodel import Field, Index

from ..core.constants import StudySessionStatus
from ..db.base import BaseModel


class StudySession(BaseModel, table=True):
    """Study session table - tracks all focused study periods.

    Note on interruptions: The interrupt_count and interruptions_json fields
    exist from day one. We cannot retroactively add meaningful interruption
    data if we skip tracking it now. Always increment on pause.
    """
    __tablename__ = "study_sessions"

    subject_id: int = Field(
        foreign_key="subjects.id",
        sa_column_kwargs={"nullable": False, "index": True},
        description="Subject being studied",
    )
    status: StudySessionStatus = Field(
        default=StudySessionStatus.RUNNING,
        sa_column_kwargs={"nullable": False, "index": True},
        description="Session status",
    )
    goal_text: Optional[str] = Field(
        default=None,
        sa_column_kwargs={"nullable": True},
        description="Study goal for this session",
        max_length=500,
    )
    notes: Optional[str] = Field(
        default=None,
        sa_column_kwargs={"nullable": True},
        description="Post-session notes",
    )
    paused_at: Optional[datetime] = Field(
        default=None,
        sa_column_kwargs={"nullable": True},
        description="Last pause timestamp",
    )
    resumed_at: Optional[datetime] = Field(
        default=None,
        sa_column_kwargs={"nullable": True},
        description="Last resume timestamp",
    )
    ended_at: Optional[datetime] = Field(
        default=None,
        sa_column_kwargs={"nullable": True, "index": True},
        description="Session end timestamp",
    )
    duration_seconds: int = Field(
        default=0,
        sa_column_kwargs={"nullable": False},
        description="Total duration in seconds (calculated on stop)",
    )
    interrupt_count: int = Field(
        default=0,
        sa_column_kwargs={"nullable": False},
        description="Number of times session was paused",
    )
    interruptions_json: Optional[str] = Field(
        default=None,
        sa_column_kwargs={"nullable": True},
        description="JSON array of pause/resume timestamps",
    )

    @property
    def started_at(self) -> datetime:
        """Alias for created_at for domain clarity."""
        return self.created_at

    __table_args__ = (
        Index("idx_study_subject_status", "subject_id", "status"),
    )
