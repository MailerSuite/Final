"""
Remove bitcoin/payment tables and fields

Revision ID: 20250813_remove_payments_bitcoin
Revises: 8536afa0b0bc
Create Date: 2025-08-13
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '20250813_remove_payments_bitcoin'
down_revision: Union[str, None] = '8536afa0b0bc'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Drop tables that are exclusively for bitcoin/payments
    for table in [
        'payment_requests',
        'hd_wallet_addresses',
        'bitcoin_wallets',
        'vip_customers',
        'xpub_validations',
    ]:
        try:
            op.drop_table(table)
        except Exception:
            pass

    # Drop FKs safely before dropping columns if needed
    try:
        with op.batch_alter_table('trial_plans') as batch_op:
            # these columns were added for payments; safe to keep if not exist
            try:
                batch_op.drop_column('payment_request_id')
            except Exception:
                pass
            try:
                batch_op.drop_column('is_paid')
            except Exception:
                pass
            try:
                batch_op.drop_column('payment_confirmed_at')
            except Exception:
                pass
    except Exception:
        pass

    # Remove BTC pricing fields from plans/trial configurations if present
    try:
        with op.batch_alter_table('plans') as batch_op:
            try:
                batch_op.drop_column('trial_price_btc')
            except Exception:
                pass
    except Exception:
        pass

    try:
        with op.batch_alter_table('trial_configurations') as batch_op:
            try:
                batch_op.drop_column('price_btc')
            except Exception:
                pass
    except Exception:
        pass


def downgrade() -> None:
    # Best-effort reversal: re-create minimal columns to keep downgrade path
    try:
        with op.batch_alter_table('plans') as batch_op:
            batch_op.add_column(sa.Column('trial_price_btc', sa.String(length=20), nullable=True))
    except Exception:
        pass

    try:
        with op.batch_alter_table('trial_configurations') as batch_op:
            batch_op.add_column(sa.Column('price_btc', sa.String(length=20), nullable=True))
    except Exception:
        pass

    try:
        with op.batch_alter_table('trial_plans') as batch_op:
            batch_op.add_column(sa.Column('payment_request_id', sa.String(length=36), nullable=True))
            batch_op.add_column(sa.Column('is_paid', sa.Boolean(), nullable=True))
            batch_op.add_column(sa.Column('payment_confirmed_at', sa.DateTime(timezone=True), nullable=True))
    except Exception:
        pass

    # Do not recreate bitcoin tables by default
