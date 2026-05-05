"""create activity logs."""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0001_create_activity_logs"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "activity_logs",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("entity_type", sa.String(), nullable=False),
        sa.Column("entity_id", sa.Integer(), nullable=True),
        sa.Column("action", sa.String(length=50), nullable=False),
        sa.Column("message", sa.String(length=500), nullable=False),
        sa.Column("payload_json", sa.Text(), nullable=True),
        sa.Column("source", sa.String(length=20), nullable=False),
        sa.Column("actor", sa.String(length=20), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_activity_log_created", "activity_logs", ["created_at"])
    op.create_index(
        "idx_activity_log_entity",
        "activity_logs",
        ["entity_type", "entity_id"],
    )
    op.create_index(
        op.f("ix_activity_logs_entity_id"),
        "activity_logs",
        ["entity_id"],
    )
    op.create_index(
        op.f("ix_activity_logs_entity_type"),
        "activity_logs",
        ["entity_type"],
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_activity_logs_entity_type"), table_name="activity_logs")
    op.drop_index(op.f("ix_activity_logs_entity_id"), table_name="activity_logs")
    op.drop_index("idx_activity_log_entity", table_name="activity_logs")
    op.drop_index("idx_activity_log_created", table_name="activity_logs")
    op.drop_table("activity_logs")
