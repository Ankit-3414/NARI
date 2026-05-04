"""Database session and engine setup with SQLite WAL mode.

All database operations go through this session. The engine is configured with
performance-oriented pragmas suitable for Server-01 hardware.
"""

from sqlmodel import SQLModel, Session, create_engine
from sqlalchemy import text
from sqlalchemy.orm import sessionmaker
from contextlib import contextmanager
from .base import BaseModel
import os
from ..core.config import settings


# Create engine with SQLite WAL mode and performance pragmas
engine = create_engine(
    settings.DATABASE_URL,
    echo=settings.NARI_LOG_LEVEL == "DEBUG",
    connect_args={"check_same_thread": False},
)


def init_db() -> None:
    """Initialize the database: create tables and set pragmas."""
    SQLModel.metadata.create_all(engine)

    # Apply SQLite pragmas for better performance on Server-01
    with Session(engine) as session:
        session.execute(text("PRAGMA journal_mode=WAL"))
        session.execute(text("PRAGMA synchronous=NORMAL"))
        session.execute(text("PRAGMA cache_size=-128000"))  # 128MB cache
        session.execute(text("PRAGMA temp_store=MEMORY"))
        session.execute(text("PRAGMA mmap_size=268435456"))  # 256MB mmap
        session.commit()


def get_session():
    """Dependency: yield a database session."""
    with Session(engine) as session:
        yield session