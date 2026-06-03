"""Timezone-aware datetime helpers."""

from datetime import UTC, datetime


def utc_now() -> datetime:
    """Return the current UTC time as a timezone-aware datetime."""
    return datetime.now(UTC)


def utc_naive() -> datetime:
    """Return the current UTC time as a timezone-naive datetime (for SQLite/SQLModel comparison)."""
    return datetime.now(UTC).replace(tzinfo=None)


import zoneinfo

def localize_datetime(dt: datetime, tz_name: str) -> datetime:
    """Localize a naive or UTC datetime to the target timezone."""
    if not dt:
        return dt
    tz = zoneinfo.ZoneInfo(tz_name)
    if dt.tzinfo is None:
        # SQLite timestamps are stored in UTC naive format
        dt = dt.replace(tzinfo=zoneinfo.ZoneInfo("UTC"))
    return dt.astimezone(tz)
