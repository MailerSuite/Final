"""Add plan column to users table

Revision ID: add_plan_column_to_users
Revises: 
Create Date: 2025-01-29 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_plan_column_to_users'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Add plan column if not exists
    op.execute("""
        ALTER TABLE IF EXISTS users
        ADD COLUMN IF NOT EXISTS plan VARCHAR(50);
    """)
    
    # Create index conditionally
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_indexes WHERE indexname = 'idx_users_plan'
            ) THEN
                CREATE INDEX idx_users_plan ON users(plan);
            END IF;
        END $$;
    """)
    
    # Backfill default
    op.execute("UPDATE users SET plan = 'PLAN1' WHERE plan IS NULL")


def downgrade():
    # Remove index first
    op.drop_index('idx_users_plan', 'users')
    
    # Remove plan column
    op.drop_column('users', 'plan')