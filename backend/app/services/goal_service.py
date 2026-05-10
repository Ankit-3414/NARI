"""Goal service."""

from __future__ import annotations

from typing import Any, Optional

from sqlmodel import Session, select

from ..core.constants import EntityType, GoalStatus
from ..core.errors import NariError
from ..core.events import get_event_bus
from ..models.goal import Goal
from ..schemas.goal import GoalCreate, GoalUpdate
from ..utils.datetime_utils import utc_now
from ..websocket.events import EventNames


class GoalService:
    """Business logic for goal management."""

    async def create(self, session: Session, payload: GoalCreate) -> Goal:
        """Create a new goal."""
        goal = Goal(**payload.model_dump())
        
        session.add(goal)
        session.commit()
        session.refresh(goal)
        
        await self._emit_event(EventNames.GOAL_CREATED, goal)
        return goal

    def get(self, session: Session, goal_id: int) -> Goal:
        goal = session.get(Goal, goal_id)
        if not goal:
            raise NariError("GOAL_NOT_FOUND", f"Goal {goal_id} not found", 404)
        return goal

    def list(
        self,
        session: Session,
        *,
        status: Optional[GoalStatus] = None,
        scope: Optional[Any] = None,
        parent_id: Optional[int] = None,
    ) -> list[Goal]:
        statement = select(Goal)
        if status:
            statement = statement.where(Goal.status == status)
        if scope:
            statement = statement.where(Goal.scope == scope)
        if parent_id is not None:
            statement = statement.where(Goal.parent_goal_id == parent_id)
            
        statement = statement.order_by(Goal.created_at.desc())
        return list(session.exec(statement).all())

    async def update(self, session: Session, goal_id: int, payload: GoalUpdate) -> Goal:
        """Update a goal."""
        goal = self.get(session, goal_id)
        updates = payload.model_dump(exclude_unset=True)
        
        for key, value in updates.items():
            setattr(goal, key, value)
            
        goal.updated_at = utc_now()
        session.add(goal)
        session.commit()
        session.refresh(goal)
        
        await self._emit_event(EventNames.GOAL_UPDATED, goal)
        return goal

    async def delete(self, session: Session, goal_id: int) -> Goal:
        """Delete a goal."""
        goal = self.get(session, goal_id)
        session.delete(goal)
        session.commit()
        await self._emit_event(EventNames.GOAL_DELETED, goal)
        return goal

    async def update_progress(self, session: Session, goal_id: int, increment: int = 1) -> Goal:
        """Increment goal progress."""
        goal = self.get(session, goal_id)
        goal.current_value += increment
        goal.updated_at = utc_now()
        
        # Auto-complete if target reached
        if goal.target_value and goal.current_value >= goal.target_value:
            goal.status = GoalStatus.COMPLETED
            
        session.add(goal)
        session.commit()
        session.refresh(goal)
        
        await self._emit_event(EventNames.GOAL_PROGRESS_UPDATED, goal)
        return goal

    def to_data(self, goal: Goal) -> dict[str, Any]:
        return {
            "id": goal.id,
            "title": goal.title,
            "description": goal.description,
            "scope": goal.scope.value,
            "status": goal.status.value,
            "target_value": goal.target_value,
            "current_value": goal.current_value,
            "start_date": goal.start_date.isoformat() if goal.start_date else None,
            "due_date": goal.due_date.isoformat() if goal.due_date else None,
            "parent_goal_id": goal.parent_goal_id,
            "created_at": goal.created_at.isoformat(),
            "updated_at": goal.updated_at.isoformat(),
        }

    async def _emit_event(self, event: EventNames, goal: Goal) -> None:
        await get_event_bus().emit_ws_event(
            event=event.value,
            entity_type=EntityType.GOAL.value,
            entity_id=goal.id,
            data=self.to_data(goal),
        )


goal_service = GoalService()
