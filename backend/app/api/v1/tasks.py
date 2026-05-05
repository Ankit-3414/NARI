"""Task routes."""

from datetime import date

from fastapi import APIRouter, Depends
from sqlmodel import Session

from ...core.constants import TaskPriority, TaskStatus
from ...core.security import verify_api_key
from ...db.session import get_session
from ...schemas.common import success_response
from ...schemas.task import TaskCreate, TaskUpdate
from ...services.task_service import task_service

router = APIRouter(
    prefix="/tasks",
    tags=["tasks"],
    dependencies=[Depends(verify_api_key)],
)


@router.get("")
def list_tasks(
    status: TaskStatus | None = None,
    priority: TaskPriority | None = None,
    subject_id: int | None = None,
    due_date: date | None = None,
    tag: str | None = None,
    session: Session = Depends(get_session),
):
    tasks = task_service.list(
        session,
        status=status,
        priority=priority,
        subject_id=subject_id,
        due_date=due_date,
        tag=tag,
    )
    return success_response([task_service.to_data(task) for task in tasks])


@router.post("")
async def create_task(
    payload: TaskCreate,
    session: Session = Depends(get_session),
):
    task = await task_service.create(session, payload)
    return success_response(task_service.to_data(task))


@router.get("/today")
def today_tasks(session: Session = Depends(get_session)):
    tasks = task_service.today(session)
    return success_response([task_service.to_data(task) for task in tasks])


@router.get("/{task_id}")
def get_task(task_id: int, session: Session = Depends(get_session)):
    task = task_service.get(session, task_id)
    return success_response(task_service.to_data(task))


@router.patch("/{task_id}")
async def update_task(
    task_id: int,
    payload: TaskUpdate,
    session: Session = Depends(get_session),
):
    task = await task_service.update(session, task_id, payload)
    return success_response(task_service.to_data(task))


@router.delete("/{task_id}")
async def delete_task(task_id: int, session: Session = Depends(get_session)):
    task = await task_service.delete(session, task_id)
    return success_response(task_service.to_data(task))


@router.post("/{task_id}/complete")
async def complete_task(task_id: int, session: Session = Depends(get_session)):
    task = await task_service.complete(session, task_id)
    return success_response(task_service.to_data(task))


@router.post("/{task_id}/reopen")
async def reopen_task(task_id: int, session: Session = Depends(get_session)):
    task = await task_service.reopen(session, task_id)
    return success_response(task_service.to_data(task))


@router.get("/{task_id}/history")
def task_history(task_id: int, session: Session = Depends(get_session)):
    history = task_service.history(session, task_id)
    return success_response(
        [task_service.history_to_data(entry) for entry in history]
    )
