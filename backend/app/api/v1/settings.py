"""User settings routes."""

from typing import Any
from fastapi import APIRouter, Depends
from sqlmodel import Session

from ...core.security import verify_api_key
from ...db.session import get_session
from ...schemas.common import success_response
from ...services.user_service import user_service

router = APIRouter(
    prefix="/settings",
    tags=["settings"],
    dependencies=[Depends(verify_api_key)],
)

@router.get("")
def get_settings(session: Session = Depends(get_session)):
    """Get the current user's settings."""
    settings = user_service.get_settings(session)
    return success_response(settings)

@router.patch("")
def update_settings(
    payload: dict[str, Any],
    session: Session = Depends(get_session)
):
    """Update the current user's settings."""
    updated_settings = user_service.update_settings(session, payload)
    return success_response(updated_settings)
