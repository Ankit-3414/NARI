"""Habit routes."""

from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlmodel import Session

from ...core.security import verify_api_key
from ...db.session import get_session
from ...schemas.common import success_response
from ...schemas.habit import HabitCreate, HabitUpdate, HabitLogCreate
from ...services.habit_service import habit_service

router = APIRouter(
    prefix="/habits",
    tags=["habits"],
    dependencies=[Depends(verify_api_key)],
)


@router.get("")
def list_habits(session: Session = Depends(get_session)):
    habits = habit_service.list(session)
    return success_response([habit_service.to_data(h) for h in habits])


@router.post("")
async def create_habit(
    payload: HabitCreate,
    session: Session = Depends(get_session),
):
    habit = await habit_service.create(session, payload)
    return success_response(habit_service.to_data(habit))


@router.get("/{habit_id}")
def get_habit(habit_id: int, session: Session = Depends(get_session)):
    habit = habit_service.get(session, habit_id)
    return success_response(habit_service.to_data(habit))


@router.patch("/{habit_id}")
async def update_habit(
    habit_id: int,
    payload: HabitUpdate,
    session: Session = Depends(get_session),
):
    habit = await habit_service.update(session, habit_id, payload)
    return success_response(habit_service.to_data(habit))


@router.delete("/{habit_id}")
async def delete_habit(habit_id: int, session: Session = Depends(get_session)):
    await habit_service.delete(session, habit_id)
    return success_response({"id": habit_id, "deleted": True})


@router.post("/{habit_id}/complete")
async def complete_habit(
    habit_id: int,
    payload: HabitLogCreate,
    session: Session = Depends(get_session),
):
    habit = await habit_service.complete(session, habit_id, payload)
    return success_response(habit_service.to_data(habit))


@router.get("/{habit_id}/logs")
def list_habit_logs(
    habit_id: int,
    limit: int = Query(default=30, ge=1, le=100),
    session: Session = Depends(get_session),
):
    logs = habit_service.list_logs(session, habit_id, limit=limit)
    return success_response([
        {
            "id": log.id,
            "habit_id": log.habit_id,
            "completed_at": log.created_at.isoformat(),
            "note": log.note
        } for log in logs
    ])
