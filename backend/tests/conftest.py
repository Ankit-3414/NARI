import pytest
from pathlib import Path
from typing import Iterator
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from app.db import session as db_session
from app.main import app
from app.core.config import settings

@pytest.fixture(name="engine")
def engine_fixture(tmp_path: Path):
    db_path = tmp_path / "nari-test.db"
    engine = create_engine(
        f"sqlite:///{db_path}",
        connect_args={"check_same_thread": False},
    )
    
    from sqlalchemy import event
    @event.listens_for(engine, "connect")
    def connect(dbapi_connection, connection_record):
        import sqlite_vec
        dbapi_connection.enable_load_extension(True)
        sqlite_vec.load(dbapi_connection)
        dbapi_connection.enable_load_extension(False)
    
    # Override the global engine in the session module
    old_engine = db_session.engine
    db_session.engine = engine
    
    SQLModel.metadata.create_all(engine)
    
    yield engine
    
    # Restore the global engine
    db_session.engine = old_engine

@pytest.fixture(name="session")
def session_fixture(engine):
    with Session(engine) as session:
        yield session

@pytest.fixture(name="client")
def client_fixture(session, engine) -> Iterator[TestClient]:
    def override_get_session():
        yield session

    app.dependency_overrides[db_session.get_session] = override_get_session
    # Also ensure the app uses the test engine if it accesses it via app.state
    app.state.test_engine = engine
    
    with TestClient(app) as client:
        yield client
    
    app.dependency_overrides.clear()
