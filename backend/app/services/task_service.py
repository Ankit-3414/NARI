"""Task service - refactored to use BaseService."""

from __future__ import annotations

import json
from datetime import date
from typing import Any

from sqlmodel import Session, select, or_

from ..core.constants import EntityType, TaskPriority, TaskStatus
from ..core.errors import NariError
from ..models.task import Task, TaskHistory
from ..schemas.task import TaskCreate, TaskUpdate
from ..utils.datetime_utils import utc_now
from ..utils.privacy import redact_pii
from ..utils.tag_utils import decode_tags, encode_tags
from ..websocket.events import EventNames
from .base import BaseService


class TaskService(BaseService[Task, TaskCreate, TaskUpdate]):
    """Business logic for task management."""

    def __init__(self):
        super().__init__(Task, EntityType.TASK)

    def _redact_snapshot(self, data: dict[str, Any] | None) -> dict[str, Any] | None:
        """Redact sensitive fields from a task snapshot."""
        if data is None:
            return None
        return redact_pii(data, {"title", "description", "tags"})

    async def create(self, session: Session, payload: TaskCreate) -> Task:
        data = payload.model_dump()
        tags = data.pop("tags", None)
        task = Task(**data, tags_json=encode_tags(tags))

        if task.status == TaskStatus.DONE and task.completed_at is None:
            task.completed_at = utc_now()

        session.add(task)
        session.flush()
        self._add_history(session, task, "created", None, self.to_data(task))
        session.commit()
        session.refresh(task)
        await self._emit_event(EventNames.TASK_CREATED, task)
        return task

    async def update(self, session: Session, task_id: int, payload: TaskUpdate) -> Task:
        task = self.get(session, task_id)
        old_data = self.to_data(task)
        updates = payload.model_dump(exclude_unset=True)

        if "tags" in updates:
            task.tags_json = encode_tags(updates.pop("tags"))
        
        for key, value in updates.items():
            setattr(task, key, value)

        # Logic for status transitions
        if task.status == TaskStatus.DONE and task.completed_at is None:
            task.completed_at = utc_now()
        elif task.status != TaskStatus.DONE:
            task.completed_at = None
        
        task.updated_at = utc_now()

        session.add(task)
        session.flush()
        self._add_history(session, task, "updated", old_data, self.to_data(task))
        session.commit()
        session.refresh(task)
        await self._emit_event(EventNames.TASK_UPDATED, task)
        return task

    async def complete(self, session: Session, task_id: int) -> Task:
        task = self.get(session, task_id)
        if task.status == TaskStatus.DONE:
            raise NariError("ALREADY_COMPLETED", "Task is already completed", 409)
        
        old_data = self.to_data(task)
        task.status = TaskStatus.DONE
        task.completed_at = utc_now()
        task.updated_at = utc_now()

        session.add(task)
        session.flush()
        self._add_history(session, task, "completed", old_data, self.to_data(task))
        session.commit()
        session.refresh(task)
        await self._emit_event(EventNames.TASK_COMPLETED, task)
        return task

    async def reopen(self, session: Session, task_id: int) -> Task:
        task = self.get(session, task_id)
        old_data = self.to_data(task)
        task.status = TaskStatus.PENDING
        task.completed_at = None
        task.updated_at = utc_now()

        session.add(task)
        session.flush()
        self._add_history(session, task, "reopened", old_data, self.to_data(task))
        session.commit()
        session.refresh(task)
        await self._emit_event(EventNames.TASK_REOPENED, task)
        return task

    async def delete(self, session: Session, task_id: int) -> Task:
        task = self.get(session, task_id)
        old_data = self.to_data(task)
        task.status = TaskStatus.CANCELLED
        task.completed_at = None
        task.updated_at = utc_now()

        session.add(task)
        session.flush()
        self._add_history(session, task, "deleted", old_data, self.to_data(task))
        session.commit()
        session.refresh(task)
        await self._emit_event(EventNames.TASK_DELETED, task)
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

    def history_to_data(self, entry: TaskHistory) -> dict[str, Any]:
        return entry.model_dump(mode="json")

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
        return [task for task in tasks if tag in decode_tags(task.tags_json)]

    def to_data(self, task: Task) -> dict[str, Any]:
        """Custom serialization for Task."""
        data = task.model_dump(mode="json")
        data["tags"] = decode_tags(task.tags_json)
        return data

    def _add_history(
        self,
        session: Session,
        task: Task,
        action: str,
        old_data: dict[str, Any] | None,
        new_data: dict[str, Any],
    ) -> None:
        """Add history entry with PII redaction."""
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


task_service = TaskService()
