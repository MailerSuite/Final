"""remove_telegram_username_column

Revision ID: ef5d34452ab9
Revises: fix_imap_attachment_20250129
Create Date: 2025-07-30 09:59:26.577669

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ef5d34452ab9'
down_revision: Union[str, None] = 'fix_imap_attachment_20250129'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Drop index if exists
    op.execute("""
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1 FROM pg_indexes WHERE indexname = 'ix_users_telegram_username'
            ) THEN
                DROP INDEX ix_users_telegram_username;
            END IF;
        END $$;
    """)
    # Drop column if exists
    op.execute("""
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'users' AND column_name = 'telegram_username'
            ) THEN
                ALTER TABLE users DROP COLUMN telegram_username;
            END IF;
        END $$;
    """)


def downgrade() -> None:
    # No-op safe downgrade (optional recreation)
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'users' AND column_name = 'telegram_username'
            ) THEN
                ALTER TABLE users ADD COLUMN telegram_username VARCHAR(255);
            END IF;
            IF NOT EXISTS (
                SELECT 1 FROM pg_indexes WHERE indexname = 'ix_users_telegram_username'
            ) THEN
                CREATE UNIQUE INDEX ix_users_telegram_username ON users(telegram_username);
            END IF;
        END $$;
    """)
