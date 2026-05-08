"""Timezone-aware datetime helpers."""

from datetime import UTC, datetime


def utc_now() -> datetime:
    """Return the current UTC time as a timezone-aware datetime."""
    return datetime.now(UTC)


def utc_naive() -> datetime:
    """Return the current UTC time as a timezone-naive datetime (for SQLite/SQLModel comparison)."""
    return datetime.now(UTC).replace(tzinfo=None)
