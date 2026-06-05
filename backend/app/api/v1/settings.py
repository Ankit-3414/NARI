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

@router.get("/vapid-public-key")
def get_vapid_public_key(session: Session = Depends(get_session)):
    """Retrieve the uncompressed public VAPID key for Web Push subscription."""
    from ...services.push_service import push_service
    key = push_service.get_public_key(session)
    return success_response({"public_key": key})

@router.post("/push-subscription")
def register_push_subscription(
    payload: dict[str, Any],
    session: Session = Depends(get_session)
):
    """Register a new browser subscription for native push notifications."""
    from ...services.push_service import push_service
    push_service.register_subscription(session, payload)
    return success_response({"message": "Subscription registered successfully"})

@router.post("/push-test")
async def send_test_push(
    session: Session = Depends(get_session)
):
    """Trigger a test Web Push notification to all active endpoints."""
    from ...services.push_service import push_service
    success = await push_service.send_push_notification(
        session,
        title="NARI System Link",
        body="Telemetry channel established. Push notifications functional."
    )
    return success_response({
        "success": success,
        "message": "Test push notification dispatched" if success else "No active push subscriptions found"
    })
