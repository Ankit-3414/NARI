"""Database session and engine setup with SQLite WAL mode."""

from pathlib import Path

from sqlalchemy import text
from sqlalchemy.engine import Engine, make_url
from sqlmodel import Session, create_engine

from ..core.config import settings


engine = create_engine(
    settings.DATABASE_URL,
    echo=settings.NARI_LOG_LEVEL == "DEBUG",
    connect_args={"check_same_thread": False},
)


from sqlalchemy import event

if engine.dialect.name == "sqlite":
    @event.listens_for(engine, "connect")
    def connect(dbapi_connection, connection_record):
        import sqlite_vec
        dbapi_connection.enable_load_extension(True)
        sqlite_vec.load(dbapi_connection)
        dbapi_connection.enable_load_extension(False)


def ensure_sqlite_directory(database_url: str = settings.DATABASE_URL) -> None:
    """Create the SQLite database parent directory when using a file DB."""
    url = make_url(database_url)
    if url.drivername != "sqlite" or not url.database:
        return
    if url.database in {":memory:", ""}:
        return

    Path(url.database).expanduser().parent.mkdir(parents=True, exist_ok=True)


def apply_sqlite_pragmas(target_engine: Engine = engine) -> None:
    """Apply SQLite pragmas used by NARI."""
    if target_engine.dialect.name != "sqlite":
        return

    with target_engine.connect() as connection:
        connection.execute(text("PRAGMA journal_mode=WAL"))
        connection.execute(text("PRAGMA synchronous=NORMAL"))
        connection.execute(text("PRAGMA cache_size=-128000"))
        connection.execute(text("PRAGMA temp_store=MEMORY"))
        connection.execute(text("PRAGMA mmap_size=268435456"))
        connection.commit()


def init_db() -> None:
    """Initialize runtime database settings.

    Alembic owns schema creation. This only prepares the SQLite file location
    and applies connection pragmas.
    """
    ensure_sqlite_directory()
    apply_sqlite_pragmas(engine)


def check_database() -> None:
    """Run a lightweight DB health check."""
    with Session(engine) as session:
        session.exec(text("SELECT 1")).one()


def get_session():
    """Dependency: yield a database session."""
    with Session(engine) as session:
        yield session
