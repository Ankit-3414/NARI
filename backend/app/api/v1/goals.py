"""Goal routes."""

from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlmodel import Session

from ...core.constants import GoalStatus, GoalScope
from ...core.security import verify_api_key
from ...db.session import get_session
from ...schemas.common import success_response
from ...schemas.goal import GoalCreate, GoalUpdate
from ...services.goal_service import goal_service

router = APIRouter(
    prefix="/goals",
    tags=["goals"],
    dependencies=[Depends(verify_api_key)],
)


@router.get("")
def list_goals(
    status: Optional[GoalStatus] = None,
    scope: Optional[GoalScope] = None,
    parent_id: Optional[int] = None,
    session: Session = Depends(get_session),
):
    goals = goal_service.list(
        session,
        status=status,
        scope=scope,
        parent_id=parent_id,
    )
    return success_response([goal_service.to_data(g) for g in goals])


@router.post("")
async def create_goal(
    payload: GoalCreate,
    session: Session = Depends(get_session),
):
    goal = await goal_service.create(session, payload)
    return success_response(goal_service.to_data(goal))


@router.get("/{goal_id}")
def get_goal(goal_id: int, session: Session = Depends(get_session)):
    goal = goal_service.get(session, goal_id)
    return success_response(goal_service.to_data(goal))


@router.patch("/{goal_id}")
async def update_goal(
    goal_id: int,
    payload: GoalUpdate,
    session: Session = Depends(get_session),
):
    goal = await goal_service.update(session, goal_id, payload)
    return success_response(goal_service.to_data(goal))


@router.delete("/{goal_id}")
async def delete_goal(goal_id: int, session: Session = Depends(get_session)):
    await goal_service.delete(session, goal_id)
    return success_response({"id": goal_id, "deleted": True})


@router.post("/{goal_id}/progress")
async def update_goal_progress(
    goal_id: int,
    increment: int = Query(default=1),
    session: Session = Depends(get_session),
):
    goal = await goal_service.update_progress(session, goal_id, increment=increment)
    return success_response(goal_service.to_data(goal))
