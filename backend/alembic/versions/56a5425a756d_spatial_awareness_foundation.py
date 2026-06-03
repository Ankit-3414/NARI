"""spatial_awareness_foundation

Revision ID: 56a5425a756d
Revises: 22c53c01a402
Create Date: 2026-06-03 18:45:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = '56a5425a756d'
down_revision: Union[str, None] = '22c53c01a402'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create location_nodes table
    op.create_table(
        'location_nodes',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('label', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('name', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column('latitude', sa.Float(), nullable=False),
        sa.Column('longitude', sa.Float(), nullable=False),
        sa.Column('category', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column('radius_meters', sa.Float(), nullable=False),
        sa.Column('archived_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_location_nodes_category'), 'location_nodes', ['category'], unique=False)
    op.create_index(op.f('ix_location_nodes_label'), 'location_nodes', ['label'], unique=False)

    # Add location_id to tasks
    with op.batch_alter_table('tasks', schema=None) as batch_op:
        batch_op.add_column(sa.Column('location_id', sa.Integer(), nullable=True))
        batch_op.create_foreign_key('fk_tasks_location_id', 'location_nodes', ['location_id'], ['id'])

    # Add location_id to notes
    with op.batch_alter_table('notes', schema=None) as batch_op:
        batch_op.add_column(sa.Column('location_id', sa.Integer(), nullable=True))
        batch_op.create_foreign_key('fk_notes_location_id', 'location_nodes', ['location_id'], ['id'])


def downgrade() -> None:
    # Remove location_id from notes
    with op.batch_alter_table('notes', schema=None) as batch_op:
        batch_op.drop_constraint('fk_notes_location_id', type_='foreignkey')
        batch_op.drop_column('location_id')

    # Remove location_id from tasks
    with op.batch_alter_table('tasks', schema=None) as batch_op:
        batch_op.drop_constraint('fk_tasks_location_id', type_='foreignkey')
        batch_op.drop_column('location_id')

    # Drop location_nodes table
    op.drop_index(op.f('ix_location_nodes_label'), table_name='location_nodes')
    op.drop_index(op.f('ix_location_nodes_category'), table_name='location_nodes')
    op.drop_table('location_nodes')
