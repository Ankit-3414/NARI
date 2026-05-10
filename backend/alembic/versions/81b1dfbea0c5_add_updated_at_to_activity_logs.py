"""add updated_at to activity_logs."""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa



revision: str = '81b1dfbea0c5'
down_revision: Union[str, None] = 'c247b97838a5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('activity_logs', sa.Column('updated_at', sa.DateTime(), nullable=True))
    # Fill existing rows with created_at value
    op.execute("UPDATE activity_logs SET updated_at = created_at")
    # In a real app we'd make it non-nullable after filling, but for SQLite it's tricky.
    # We'll just leave it as is or use batch_op.

def downgrade() -> None:
    op.drop_column('activity_logs', 'updated_at')
