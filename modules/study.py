"""Compatibility shim for legacy procedural study module.

Some parts of the codebase (notably backend.session_manager) import
`modules.study.save_session(...)`. During refactor we introduced
`modules.study_manager.StudyManager` and removed the old `study.py` file.
This small shim provides the legacy function signatures and delegates to
the new StudyManager implementation so older callers keep working.
"""
from datetime import datetime
from modules.study_manager import StudyManager


def save_session(subject, start_time: datetime, end_time: datetime):
    """Persist a completed study session.

    Delegates to StudyManager.save_session.
    """
    mgr = StudyManager()
    return mgr.save_session(subject, start_time, end_time)


def start_session(subject, subjects_loader=None):
    """Start a session for CLI compatibility.

    This function mirrors the old procedural API used by the CLI. If a
    subjects_loader is provided it is ignored here — callers should prefer
    using StudyManager directly for more control.
    """
    mgr = StudyManager()
    return mgr.start_session({"subject": subject})


def get_status():
    """Return active session status (or None)."""
    mgr = StudyManager()
    return mgr.get_status()
