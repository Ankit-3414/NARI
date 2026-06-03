"""phase_1_infrastructure."""

from typing import Sequence, Union
import json
from alembic import op
import sqlalchemy as sa
import sqlmodel


revision: str = 'a437f4991b51'
down_revision: Union[str, None] = '4b36461a3cad'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create tags table
    op.create_table(
        'tags',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('name', sa.String(length=50), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )
    op.create_index(op.f('idx_tags_name'), 'tags', ['name'], unique=True)

    # 2. Create entity_tags junction table
    op.create_table(
        'entity_tags',
        sa.Column('tag_id', sa.Integer(), nullable=False),
        sa.Column('entity_id', sa.Integer(), nullable=False),
        sa.Column('entity_type', sa.String(), nullable=False),
        sa.ForeignKeyConstraint(['tag_id'], ['tags.id'], ),
        sa.PrimaryKeyConstraint('tag_id', 'entity_id', 'entity_type')
    )

    # 3. Migrate data from tags_json to normalized tables
    connection = op.get_bind()
    
    # helper to migrate for a specific table
    def migrate_tags(table_name, entity_type):
        rows = connection.execute(sa.text(f"SELECT id, tags_json FROM {table_name} WHERE tags_json IS NOT NULL")).fetchall()
        for row_id, tags_json in rows:
            if not tags_json:
                continue
            try:
                tags = json.loads(tags_json)
                if not isinstance(tags, list):
                    continue
                for tag_name in tags:
                    if not isinstance(tag_name, str):
                        continue
                    tag_name = tag_name.strip().lower()
                    if not tag_name:
                        continue
                    # Insert tag if not exists
                    connection.execute(
                        sa.text("INSERT OR IGNORE INTO tags (name, created_at, updated_at) VALUES (:name, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)"),
                        {"name": tag_name}
                    )
                    # Get tag id
                    tag_id = connection.execute(
                        sa.text("SELECT id FROM tags WHERE name = :name"),
                        {"name": tag_name}
                    ).scalar()
                    # Insert junction
                    connection.execute(
                        sa.text("INSERT OR IGNORE INTO entity_tags (tag_id, entity_id, entity_type) VALUES (:tag_id, :entity_id, :entity_type)"),
                        {"tag_id": tag_id, "entity_id": row_id, "entity_type": entity_type}
                    )
            except Exception as e:
                print(f"Failed to migrate tags for {table_name} ID {row_id}: {e}")

    migrate_tags('tasks', 'task')
    migrate_tags('notes', 'note')
    migrate_tags('subjects', 'subject')

    # 4. Implement FTS5 for activity_logs
    op.execute("CREATE VIRTUAL TABLE activity_logs_fts USING fts5(message, raw_content, content='activity_logs', content_rowid='id');")
    
    # Triggers for activity_logs
    op.execute("""
        CREATE TRIGGER activity_logs_ai AFTER INSERT ON activity_logs BEGIN
            INSERT INTO activity_logs_fts(rowid, message, raw_content) VALUES (new.id, new.message, new.raw_content);
        END;
    """)
    op.execute("""
        CREATE TRIGGER activity_logs_ad AFTER DELETE ON activity_logs BEGIN
            INSERT INTO activity_logs_fts(activity_logs_fts, rowid, message, raw_content) VALUES('delete', old.id, old.message, old.raw_content);
        END;
    """)
    op.execute("""
        CREATE TRIGGER activity_logs_au AFTER UPDATE ON activity_logs BEGIN
            INSERT INTO activity_logs_fts(activity_logs_fts, rowid, message, raw_content) VALUES('delete', old.id, old.message, old.raw_content);
            INSERT INTO activity_logs_fts(rowid, message, raw_content) VALUES (new.id, new.message, new.raw_content);
        END;
    """)
    
    # Sync existing data for activity_logs_fts
    op.execute("INSERT INTO activity_logs_fts(rowid, message, raw_content) SELECT id, message, raw_content FROM activity_logs;")

    # 5. Implement FTS5 for notes
    op.execute("CREATE VIRTUAL TABLE notes_fts USING fts5(title, content_markdown, content='notes', content_rowid='id');")
    
    # Triggers for notes
    op.execute("""
        CREATE TRIGGER notes_ai AFTER INSERT ON notes BEGIN
            INSERT INTO notes_fts(rowid, title, content_markdown) VALUES (new.id, new.title, new.content_markdown);
        END;
    """)
    op.execute("""
        CREATE TRIGGER notes_ad AFTER DELETE ON notes BEGIN
            INSERT INTO notes_fts(notes_fts, rowid, title, content_markdown) VALUES('delete', old.id, old.title, old.content_markdown);
        END;
    """)
    op.execute("""
        CREATE TRIGGER notes_au AFTER UPDATE ON notes BEGIN
            INSERT INTO notes_fts(notes_fts, rowid, title, content_markdown) VALUES('delete', old.id, old.title, old.content_markdown);
            INSERT INTO notes_fts(rowid, title, content_markdown) VALUES (new.id, new.title, new.content_markdown);
        END;
    """)
    
    # Sync existing data for notes_fts
    op.execute("INSERT INTO notes_fts(rowid, title, content_markdown) SELECT id, title, content_markdown FROM notes;")


def downgrade() -> None:
    op.execute("DROP TRIGGER IF EXISTS notes_au;")
    op.execute("DROP TRIGGER IF EXISTS notes_ad;")
    op.execute("DROP TRIGGER IF EXISTS notes_ai;")
    op.execute("DROP TABLE IF EXISTS notes_fts;")
    
    op.execute("DROP TRIGGER IF EXISTS activity_logs_au;")
    op.execute("DROP TRIGGER IF EXISTS activity_logs_ad;")
    op.execute("DROP TRIGGER IF EXISTS activity_logs_ai;")
    op.execute("DROP TABLE IF EXISTS activity_logs_fts;")

    op.drop_index(op.f('idx_tags_name'), table_name='tags')
    op.drop_table('entity_tags')
    op.drop_table('tags')
