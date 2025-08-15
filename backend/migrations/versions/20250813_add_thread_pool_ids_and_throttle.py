"""
Add thread_pool_id columns to Campaign/SMTPAccount/IMAPAccount and indexes

Revision ID: 20250813_add_thread_pools
Revises: 20250813_remove_payments_bitcoin
Create Date: 2025-08-13
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '20250813_add_thread_pools'
down_revision = '20250813_remove_payments_bitcoin'
branch_labels = None
depends_on = None


def upgrade():
    # Add columns if not exist (safe for repeated runs)
    with op.batch_alter_table('campaigns', schema=None) as batch_op:
        try:
            batch_op.add_column(sa.Column('thread_pool_id', sa.String(length=36), nullable=True))
        except Exception:
            pass
        try:
            batch_op.create_index('idx_campaigns_thread_pool_id', ['thread_pool_id'], unique=False)
        except Exception:
            pass
    with op.batch_alter_table('smtp_accounts', schema=None) as batch_op:
        try:
            batch_op.add_column(sa.Column('thread_pool_id', sa.String(length=36), nullable=True))
        except Exception:
            pass
        try:
            batch_op.create_index('idx_smtp_thread_pool_id', ['thread_pool_id'], unique=False)
        except Exception:
            pass
    # imap_accounts may not have been created across all installs; guard
    try:
        with op.batch_alter_table('imap_accounts', schema=None) as batch_op:
            try:
                batch_op.add_column(sa.Column('thread_pool_id', sa.String(length=36), nullable=True))
            except Exception:
                pass
    except Exception:
        pass


def downgrade():
    try:
        with op.batch_alter_table('campaigns', schema=None) as batch_op:
            try:
                batch_op.drop_index('idx_campaigns_thread_pool_id')
            except Exception:
                pass
            try:
                batch_op.drop_column('thread_pool_id')
            except Exception:
                pass
    except Exception:
        pass
    try:
        with op.batch_alter_table('smtp_accounts', schema=None) as batch_op:
            try:
                batch_op.drop_index('idx_smtp_thread_pool_id')
            except Exception:
                pass
            try:
                batch_op.drop_column('thread_pool_id')
            except Exception:
                pass
    except Exception:
        pass
    try:
        with op.batch_alter_table('imap_accounts', schema=None) as batch_op:
            try:
                batch_op.drop_column('thread_pool_id')
            except Exception:
                pass
    except Exception:
        pass
