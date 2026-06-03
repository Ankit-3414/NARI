"""create_knowledge_nodes."""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


revision: str = '22c53c01a402'
down_revision: Union[str, None] = 'a437f4991b51'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create main knowledge_nodes table
    op.create_table('knowledge_nodes',
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('concept', sqlmodel.sql.sqltypes.AutoString(length=200), nullable=False),
        sa.Column('summary', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('raw_content', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column('source', sqlmodel.sql.sqltypes.AutoString(length=50), nullable=False),
        sa.Column('confidence', sa.Float(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('knowledge_nodes', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_knowledge_nodes_concept'), ['concept'], unique=True)

    # Create the sqlite-vec virtual table for storing embeddings (384 dims for all-MiniLM-L6-v2)
    op.execute("CREATE VIRTUAL TABLE IF NOT EXISTS knowledge_nodes_vec USING vec0(embedding float[384]);")

    # We do NOT use automatic triggers for embeddings like we did for FTS5 because 
    # calculating the embedding is a slow Python process. We will insert the embedding 
    # manually via our Python service when we save the node.


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS knowledge_nodes_vec;")
    
    with op.batch_alter_table('knowledge_nodes', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_knowledge_nodes_concept'))

    op.drop_table('knowledge_nodes')

