"""Task service."""

from __future__ import annotations

import json
from datetime import date
from typing import Any

from sqlmodel import Session, select, or_

from ..core.constants import EntityType, TaskPriority, TaskStatus
from ..core.errors import NariError
from ..core.events import get_event_bus
from ..models.task import Task, TaskHistory
from ..schemas.task import TaskCreate, TaskUpdate
from ..utils.datetime_utils import utc_now
from ..websocket.events import EventNames

SENSITIVE_FIELDS = {"title", "description", "tags"}


class TaskService:
    """Business logic for task management."""

    def _redact_snapshot(self, data: dict[str, Any] | None) -> dict[str, Any] | None:
        """Redact sensitive fields from a task snapshot."""
        if data is None:
            return None
        return {
            key: (f"[REDACTED:{len(str(value))} chars]" if key in SENSITIVE_FIELDS and value else value)
            for key, value in data.items()
        }

    async def create(self, session: Session, payload: TaskCreate) -> Task:
        data = payload.model_dump()
        tags = data.pop("tags", None)
        task = Task(**data, tags_json=self._encode_tags(tags))

        session.add(task)
        session.flush()
        self._add_history(session, task, "created", None, self._snapshot(task))
        session.commit()
        session.refresh(task)
        await self._emit_event(EventNames.TASK_CREATED, task)
        return task

    def get(self, session: Session, task_id: int) -> Task:
        task = session.get(Task, task_id)
        if task is None:
            raise NariError(
                "TASK_NOT_FOUND",
                f"Task with id {task_id} does not exist",
                404,
            )
        return task

    def list(
        self,
        session: Session,
        *,
        status: TaskStatus | None = None,
        priority: TaskPriority | None = None,
        subject_id: int | None = None,
        due_date: date | None = None,
        tag: str | None = None,
    ) -> list[Task]:
        statement = select(Task)
        if status is not None:
            statement = statement.where(Task.status == status)
        if priority is not None:
            statement = statement.where(Task.priority == priority)
        if subject_id is not None:
            statement = statement.where(Task.subject_id == subject_id)
        if due_date is not None:
            statement = statement.where(Task.due_date == due_date)
        statement = statement.order_by(Task.sort_index, Task.id)

        tasks = list(session.exec(statement).all())
        if tag is None:
            return tasks
        return [task for task in tasks if tag in self._decode_tags(task.tags_json)]

    async def update(self, session: Session, task_id: int, payload: TaskUpdate) -> Task:
        task = self.get(session, task_id)
        old_data = self._snapshot(task)
        updates = payload.model_dump(exclude_unset=True)

        if "tags" in updates:
            task.tags_json = self._encode_tags(updates.pop("tags"))
        for key, value in updates.items():
            setattr(task, key, value)

        if task.status == TaskStatus.DONE and task.completed_at is None:
            task.completed_at = utc_now()
        if task.status != TaskStatus.DONE:
            task.completed_at = None
        task.updated_at = utc_now()

        session.add(task)
        session.flush()
        self._add_history(session, task, "updated", old_data, self._snapshot(task))
        session.commit()
        session.refresh(task)
        await self._emit_event(EventNames.TASK_UPDATED, task)
        return task

    async def delete(self, session: Session, task_id: int) -> Task:
        task = self.get(session, task_id)
        old_data = self._snapshot(task)
        task.status = TaskStatus.CANCELLED
        task.completed_at = None
        task.updated_at = utc_now()

        session.add(task)
        session.flush()
        self._add_history(session, task, "deleted", old_data, self._snapshot(task))
        session.commit()
        session.refresh(task)
        await self._emit_event(EventNames.TASK_DELETED, task)
        return task

    async def complete(self, session: Session, task_id: int) -> Task:
        task = self.get(session, task_id)
        if task.status == TaskStatus.DONE:
            raise NariError("ALREADY_COMPLETED", "Task is already completed", 409)

        old_data = self._snapshot(task)
        task.status = TaskStatus.DONE
        task.completed_at = utc_now()
        task.updated_at = utc_now()

        session.add(task)
        session.flush()
        self._add_history(session, task, "completed", old_data, self._snapshot(task))
        session.commit()
        session.refresh(task)
        await self._emit_event(EventNames.TASK_COMPLETED, task)
        return task

    async def reopen(self, session: Session, task_id: int) -> Task:
        task = self.get(session, task_id)
        old_data = self._snapshot(task)
        task.status = TaskStatus.PENDING
        task.completed_at = None
        task.updated_at = utc_now()

        session.add(task)
        session.flush()
        self._add_history(session, task, "reopened", old_data, self._snapshot(task))
        session.commit()
        session.refresh(task)
        await self._emit_event(EventNames.TASK_REOPENED, task)
        return task

    def history(self, session: Session, task_id: int) -> list[TaskHistory]:
        self.get(session, task_id)
        statement = (
            select(TaskHistory)
            .where(TaskHistory.task_id == task_id)
            .order_by(TaskHistory.changed_at)
        )
        return list(session.exec(statement).all())

    def today(self, session: Session) -> list[Task]:
        today = utc_now().date()
        statement = (
            select(Task)
            .where(Task.status != TaskStatus.DONE)
            .where(Task.status != TaskStatus.CANCELLED)
            .where(or_(Task.due_date <= today, Task.due_date == None))
            .order_by(Task.due_date, Task.priority, Task.id)
        )
        return list(session.exec(statement).all())

    def to_data(self, task: Task) -> dict[str, Any]:
        return {
            "id": task.id,
            "title": task.title,
            "description": task.description,
            "priority": task.priority.value,
            "status": task.status.value,
            "due_date": task.due_date.isoformat() if task.due_date else None,
            "subject_id": task.subject_id,
            "tags": self._decode_tags(task.tags_json),
            "estimated_minutes": task.estimated_minutes,
            "actual_minutes": task.actual_minutes,
            "recurrence_rule": task.recurrence_rule,
            "parent_task_id": task.parent_task_id,
            "sort_index": task.sort_index,
            "completed_at": (
                task.completed_at.isoformat() if task.completed_at else None
            ),
            "created_at": task.created_at.isoformat(),
            "updated_at": task.updated_at.isoformat(),
        }

    def history_to_data(self, entry: TaskHistory) -> dict[str, Any]:
        return entry.model_dump(mode="json")

    def _add_history(
        self,
        session: Session,
        task: Task,
        action: str,
        old_data: dict[str, Any] | None,
        new_data: dict[str, Any],
    ) -> None:
        redacted_old = self._redact_snapshot(old_data)
        redacted_new = self._redact_snapshot(new_data)
        
        session.add(
            TaskHistory(
                task_id=task.id,
                action=action,
                old_data_json=json.dumps(redacted_old) if redacted_old is not None else None,
                new_data_json=json.dumps(redacted_new),
            )
        )

    async def _emit_event(
        self,
        event: EventNames,
        task: Task,
    ) -> None:
        await get_event_bus().emit_ws_event(
            event=event.value,
            entity_type=EntityType.TASK.value,
            entity_id=task.id,
            data=self.to_data(task),
        )

    def _snapshot(self, task: Task) -> dict[str, Any]:
        return self.to_data(task)

    def _encode_tags(self, tags: list[str] | None) -> str | None:
        if tags is None:
            return None
        return json.dumps(tags)

    def _decode_tags(self, tags_json: str | None) -> list[str]:
        if not tags_json:
            return []
        return list(json.loads(tags_json))


task_service = TaskService()
