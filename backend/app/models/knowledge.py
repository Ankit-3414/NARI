"""Knowledge Graph and Semantic Memory models."""

from datetime import datetime
from typing import Optional

from sqlmodel import Field, Index, SQLModel

from ..db.base import BaseModel


class KnowledgeNode(BaseModel, table=True):
    """A single piece of synthesized knowledge learned by NARI."""
    __tablename__ = "knowledge_nodes"

    concept: str = Field(
        sa_column_kwargs={"nullable": False, "unique": True},
        description="The core topic or concept (e.g., 'Python Async', 'My Morning Routine')",
        max_length=200,
        index=True,
    )
    summary: str = Field(
        sa_column_kwargs={"nullable": False},
        description="A concise summary of what NARI knows about this concept.",
    )
    raw_content: Optional[str] = Field(
        default=None,
        sa_column_kwargs={"nullable": True},
        description="The raw text or source material.",
    )
    source: str = Field(
        default="autonomous_research",
        sa_column_kwargs={"nullable": False},
        description="Where this knowledge came from (e.g., 'user_conversation', 'web_search')",
        max_length=50,
    )
    confidence: float = Field(
        default=0.5,
        sa_column_kwargs={"nullable": False},
        description="How confident NARI is in this knowledge (0.0 to 1.0)",
    )
    # The actual vector embedding is stored in a separate sqlite-vec virtual table
    # linked by rowid/id.
