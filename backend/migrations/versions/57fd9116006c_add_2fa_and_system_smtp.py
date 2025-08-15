"""add_2fa_and_system_smtp

Revision ID: 57fd9116006c
Revises: ef5d34452ab9
Create Date: 2025-07-30 13:48:02.445217

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '57fd9116006c'
down_revision: Union[str, None] = 'ef5d34452ab9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add 2FA fields to users table (idempotent)
    op.execute("""
        ALTER TABLE IF EXISTS users
        ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS two_factor_secret VARCHAR(6),
        ADD COLUMN IF NOT EXISTS two_factor_secret_expires TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS two_factor_verified BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS two_factor_backup_codes JSONB;
    """)
    
    # Create system_smtp_config table
    op.create_table('system_smtp_config',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('smtp_host', sa.String(length=255), nullable=False),
        sa.Column('smtp_port', sa.Integer(), nullable=False),
        sa.Column('smtp_username', sa.String(length=255), nullable=False),
        sa.Column('smtp_password', sa.Text(), nullable=False),
        sa.Column('use_tls', sa.Boolean(), nullable=False),
        sa.Column('use_ssl', sa.Boolean(), nullable=False),
        sa.Column('from_email', sa.String(length=255), nullable=False),
        sa.Column('from_name', sa.String(length=100), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('is_verified', sa.Boolean(), nullable=False),
        sa.Column('last_verified_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('daily_limit', sa.Integer(), nullable=False),
        sa.Column('emails_sent_today', sa.Integer(), nullable=False),
        sa.Column('last_reset_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('reply_to_email', sa.String(length=255), nullable=True),
        sa.Column('custom_headers', sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create index for active SMTP configs (idempotent)
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_indexes WHERE indexname = 'idx_system_smtp_active'
            ) THEN
                CREATE INDEX idx_system_smtp_active ON system_smtp_config(is_active);
            END IF;
        END $$;
    """)


def downgrade() -> None:
    # Drop system_smtp_config table
    op.drop_index('idx_system_smtp_active', table_name='system_smtp_config')
    op.drop_table('system_smtp_config')
    
    # Remove 2FA fields from users table
    op.drop_column('users', 'two_factor_backup_codes')
    op.drop_column('users', 'two_factor_verified')
    op.drop_column('users', 'two_factor_secret_expires')
    op.drop_column('users', 'two_factor_secret')
    op.drop_column('users', 'two_factor_enabled')
