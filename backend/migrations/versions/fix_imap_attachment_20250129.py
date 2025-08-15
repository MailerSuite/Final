"""Fix IMAP attachment message_id foreign key type

Revision ID: fix_imap_attachment_20250129
Revises: master_consolidated_20250129
Create Date: 2025-01-29 20:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'fix_imap_attachment_20250129'
down_revision: Union[str, None] = 'master_consolidated_20250129'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Ensure table exists with correct foreign key type; avoid destructive drop when not needed
    op.create_table(
        'imap_attachments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('message_id', sa.UUID(), nullable=True),
        sa.Column('filename', sa.String(length=255), nullable=True),
        sa.Column('content_type', sa.String(length=100), nullable=True),
        sa.Column('size', sa.Integer(), nullable=True),
        sa.Column(
            'created_at', sa.DateTime(), 
            server_default=sa.text('now()'), nullable=True
        ),
        sa.Column(
            'updated_at', sa.DateTime(), 
            server_default=sa.text('now()'), 
            onupdate=sa.text('now()'), nullable=True
        ),
        sa.ForeignKeyConstraint(['message_id'], ['imap_messages.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(
        op.f('ix_imap_attachments_id'),
        'imap_attachments', ['id'], unique=False
    )


def downgrade() -> None:
    # Drop the table
    op.drop_index(op.f('ix_imap_attachments_id'), table_name='imap_attachments')
    op.drop_table('imap_attachments') 