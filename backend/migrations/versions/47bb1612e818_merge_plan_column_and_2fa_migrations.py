"""merge_plan_column_and_2fa_migrations

Revision ID: 47bb1612e818
Revises: 57fd9116006c, add_plan_column_to_users
Create Date: 2025-07-30 22:26:54.600609

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '47bb1612e818'
down_revision: Union[str, None] = ('57fd9116006c', 'add_plan_column_to_users')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
