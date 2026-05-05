"""Common Pydantic schemas used across all API responses."""

from pydantic import BaseModel
from typing import Any, Generic, Optional, TypeVar


T = TypeVar("T")


class ErrorDetail(BaseModel):
    """Standard error detail format."""
    code: str
    message: str


class BaseResponse(BaseModel):
    """Standard response envelope for all API endpoints."""
    ok: bool
    data: Optional[Any] = None
    error: Optional[ErrorDetail] = None


class PaginatedResponse(BaseModel, Generic[T]):
    """Paginated list response envelope."""
    items: list[T]
    total: int
    page: int
    per_page: int
    has_more: bool


def success_response(data: Any = None) -> dict[str, Any]:
    """Return the standard success envelope."""
    return {"ok": True, "data": {} if data is None else data, "error": None}


def error_response(code: str, message: str) -> dict[str, Any]:
    """Return the standard error envelope."""
    return {
        "ok": False,
        "data": None,
        "error": {"code": code, "message": message},
    }
