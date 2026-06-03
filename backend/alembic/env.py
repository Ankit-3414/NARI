"""Alembic environment for NARI."""

from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config, pool, event
from sqlmodel import SQLModel

from app.core.config import settings
from app.models import *  # Ensure all models are loaded into SQLModel.metadata

config = context.config
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = SQLModel.metadata


def include_object(object, name, type_, reflected, compare_to):
    """Filter objects to include in the migration.
    
    Ignores virtual tables (FTS, VEC) that cause reflection issues.
    """
    if type_ == "table":
        # Ignore FTS and VEC related virtual tables
        if name.endswith("_fts") or name.endswith("_fts_data") or \
           name.endswith("_fts_idx") or name.endswith("_fts_docsize") or \
           name.endswith("_fts_config") or "_vec" in name:
            return False
    return True


def run_migrations_offline() -> None:
    """Run migrations without creating an Engine."""
    context.configure(
        url=settings.DATABASE_URL,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        include_object=include_object,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations with an Engine."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    @event.listens_for(connectable, "connect")
    def connect(dbapi_connection, connection_record):
        import sqlite_vec
        dbapi_connection.enable_load_extension(True)
        sqlite_vec.load(dbapi_connection)
        dbapi_connection.enable_load_extension(False)

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            render_as_batch=True,
            include_object=include_object,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
