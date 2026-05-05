"""create tasks."""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0002_create_tasks"
down_revision: Union[str, None] = "0001_create_activity_logs"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "tasks",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("priority", sa.String(), nullable=False),
        sa.Column("status", sa.String(), nullable=False),
        sa.Column("due_date", sa.Date(), nullable=True),
        sa.Column("subject_id", sa.Integer(), nullable=True),
        sa.Column("tags_json", sa.Text(), nullable=True),
        sa.Column("estimated_minutes", sa.Integer(), nullable=True),
        sa.Column("actual_minutes", sa.Integer(), nullable=True),
        sa.Column("recurrence_rule", sa.String(length=200), nullable=True),
        sa.Column("parent_task_id", sa.Integer(), nullable=True),
        sa.Column("sort_index", sa.Integer(), nullable=False),
        sa.Column("completed_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["parent_task_id"], ["tasks.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_tasks_due_date", "tasks", ["due_date"])
    op.create_index("idx_tasks_parent", "tasks", ["parent_task_id"])
    op.create_index("idx_tasks_status", "tasks", ["status"])
    op.create_index("idx_tasks_subject", "tasks", ["subject_id"])

    op.create_table(
        "task_history",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("task_id", sa.Integer(), nullable=False),
        sa.Column("action", sa.String(length=50), nullable=False),
        sa.Column("old_data_json", sa.Text(), nullable=True),
        sa.Column("new_data_json", sa.Text(), nullable=False),
        sa.Column("changed_at", sa.DateTime(), nullable=False),
        sa.Column("changed_by", sa.String(length=50), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["task_id"], ["tasks.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_task_history_changed_at"),
        "task_history",
        ["changed_at"],
    )
    op.create_index(op.f("ix_task_history_task_id"), "task_history", ["task_id"])


def downgrade() -> None:
    op.drop_index(op.f("ix_task_history_task_id"), table_name="task_history")
    op.drop_index(op.f("ix_task_history_changed_at"), table_name="task_history")
    op.drop_table("task_history")
    op.drop_index("idx_tasks_subject", table_name="tasks")
    op.drop_index("idx_tasks_status", table_name="tasks")
    op.drop_index("idx_tasks_parent", table_name="tasks")
    op.drop_index("idx_tasks_due_date", table_name="tasks")
    op.drop_table("tasks")
