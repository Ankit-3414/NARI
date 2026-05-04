"""Common Pydantic schemas used across all API responses."""

from pydantic import BaseModel
from typing import Generic, TypeVar, Optional, List, Any
from datetime import datetime


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
    items: List[T]
    total: int
    page: int
    per_page: int
    has_more: bool