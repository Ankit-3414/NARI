"""Reminder routes."""

from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlmodel import Session

from ...core.constants import ReminderStatus
from ...core.security import verify_api_key
from ...db.session import get_session
from ...schemas.common import success_response
from ...schemas.reminder import ReminderCreate, ReminderUpdate
from ...services.reminder_service import reminder_service

router = APIRouter(
    prefix="/reminders",
    tags=["reminders"],
    dependencies=[Depends(verify_api_key)],
)


@router.get("")
def list_reminders(
    status: Optional[ReminderStatus] = None,
    task_id: Optional[int] = None,
    subject_id: Optional[int] = None,
    include_triggered: bool = False,
    session: Session = Depends(get_session),
):
    reminders = reminder_service.list(
        session,
        status=status,
        task_id=task_id,
        subject_id=subject_id,
        include_triggered=include_triggered,
    )
    return success_response([reminder_service.to_data(r) for r in reminders])


@router.post("")
async def create_reminder(
    payload: ReminderCreate,
    session: Session = Depends(get_session),
):
    reminder = await reminder_service.create(session, payload)
    return success_response(reminder_service.to_data(reminder))


@router.get("/{reminder_id}")
def get_reminder(reminder_id: int, session: Session = Depends(get_session)):
    reminder = reminder_service.get(session, reminder_id)
    return success_response(reminder_service.to_data(reminder))


@router.patch("/{reminder_id}")
async def update_reminder(
    reminder_id: int,
    payload: ReminderUpdate,
    session: Session = Depends(get_session),
):
    reminder = await reminder_service.update(session, reminder_id, payload)
    return success_response(reminder_service.to_data(reminder))


@router.delete("/{reminder_id}")
async def delete_reminder(reminder_id: int, session: Session = Depends(get_session)):
    await reminder_service.delete(session, reminder_id)
    return success_response({"id": reminder_id, "deleted": True})


@router.post("/{reminder_id}/snooze")
async def snooze_reminder(
    reminder_id: int,
    minutes: int = Query(default=15, ge=1, le=1440),
    session: Session = Depends(get_session),
):
    reminder = await reminder_service.snooze(session, reminder_id, minutes=minutes)
    return success_response(reminder_service.to_data(reminder))


@router.post("/{reminder_id}/dismiss")
async def dismiss_reminder(reminder_id: int, session: Session = Depends(get_session)):
    reminder = await reminder_service.dismiss(session, reminder_id)
    return success_response(reminder_service.to_data(reminder))
