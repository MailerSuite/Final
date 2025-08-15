"""Add SMTP provider configuration tables

Revision ID: add_smtp_provider_tables
Revises: 
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_smtp_provider_tables'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create smtp_provider_configs table
    op.create_table('smtp_provider_configs',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('user_id', sa.String(36), nullable=False),
        sa.Column('provider', sa.String(50), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        
        # Provider credentials (encrypted)
        sa.Column('api_key', sa.Text(), nullable=True),
        sa.Column('api_secret', sa.Text(), nullable=True),
        sa.Column('access_key_id', sa.Text(), nullable=True),
        sa.Column('secret_access_key', sa.Text(), nullable=True),
        sa.Column('region', sa.String(50), nullable=True),
        
        # SMTP settings
        sa.Column('smtp_host', sa.String(255), nullable=False),
        sa.Column('smtp_port', sa.Integer(), nullable=True, default=587),
        sa.Column('smtp_username', sa.String(255), nullable=True),
        sa.Column('smtp_password', sa.Text(), nullable=True),
        sa.Column('use_tls', sa.Boolean(), nullable=True, default=True),
        sa.Column('use_ssl', sa.Boolean(), nullable=True, default=False),
        
        # Provider-specific limits
        sa.Column('sending_quota_daily', sa.Integer(), nullable=True, default=50000),
        sa.Column('sending_quota_hourly', sa.Integer(), nullable=True),
        sa.Column('sending_rate_per_second', sa.Float(), nullable=True, default=14),
        sa.Column('max_concurrent_connections', sa.Integer(), nullable=True, default=10),
        sa.Column('max_message_size_mb', sa.Integer(), nullable=True, default=10),
        sa.Column('max_recipients_per_message', sa.Integer(), nullable=True, default=50),
        
        # Current usage tracking
        sa.Column('daily_sent_count', sa.Integer(), nullable=True, default=0),
        sa.Column('hourly_sent_count', sa.Integer(), nullable=True, default=0),
        sa.Column('monthly_sent_count', sa.Integer(), nullable=True, default=0),
        sa.Column('last_reset_daily', sa.DateTime(), nullable=True),
        sa.Column('last_reset_hourly', sa.DateTime(), nullable=True),
        sa.Column('last_reset_monthly', sa.DateTime(), nullable=True),
        
        # Reputation and health
        sa.Column('reputation_score', sa.Float(), nullable=True, default=100.0),
        sa.Column('bounce_rate', sa.Float(), nullable=True, default=0.0),
        sa.Column('complaint_rate', sa.Float(), nullable=True, default=0.0),
        
        # Provider-specific settings (JSON)
        sa.Column('provider_settings', sa.JSON(), nullable=True),
        
        # Warmup configuration
        sa.Column('is_warming_up', sa.Boolean(), nullable=True, default=False),
        sa.Column('warmup_start_date', sa.DateTime(), nullable=True),
        sa.Column('warmup_daily_increment', sa.Integer(), nullable=True, default=50),
        sa.Column('warmup_current_limit', sa.Integer(), nullable=True),
        
        # Status and monitoring
        sa.Column('is_active', sa.Boolean(), nullable=True, default=True),
        sa.Column('is_verified', sa.Boolean(), nullable=True, default=False),
        sa.Column('last_health_check', sa.DateTime(), nullable=True),
        sa.Column('health_status', sa.String(50), nullable=True, default='healthy'),
        sa.Column('error_count', sa.Integer(), nullable=True, default=0),
        sa.Column('last_error', sa.Text(), nullable=True),
        
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    )
    
    # Create indices
    op.create_index('idx_smtp_provider_configs_user_id', 'smtp_provider_configs', ['user_id'])
    op.create_index('idx_smtp_provider_configs_provider', 'smtp_provider_configs', ['provider'])
    op.create_index('idx_smtp_provider_configs_is_active', 'smtp_provider_configs', ['is_active'])
    
    # Create smtp_provider_usage_logs table
    op.create_table('smtp_provider_usage_logs',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('provider_config_id', sa.String(36), nullable=False),
        
        sa.Column('timestamp', sa.DateTime(), nullable=False),
        sa.Column('hour_bucket', sa.DateTime(), nullable=False),
        sa.Column('day_bucket', sa.DateTime(), nullable=False),
        
        sa.Column('emails_sent', sa.Integer(), nullable=True, default=0),
        sa.Column('emails_bounced', sa.Integer(), nullable=True, default=0),
        sa.Column('emails_complained', sa.Integer(), nullable=True, default=0),
        
        sa.Column('average_send_time_ms', sa.Float(), nullable=True),
        sa.Column('error_count', sa.Integer(), nullable=True, default=0),
        
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['provider_config_id'], ['smtp_provider_configs.id'], ),
    )
    
    # Create indices for usage logs
    op.create_index('idx_smtp_provider_usage_logs_config_id', 'smtp_provider_usage_logs', ['provider_config_id'])
    op.create_index('idx_smtp_provider_usage_logs_timestamp', 'smtp_provider_usage_logs', ['timestamp'])
    op.create_index('idx_smtp_provider_usage_logs_hour_bucket', 'smtp_provider_usage_logs', ['hour_bucket'])
    op.create_index('idx_smtp_provider_usage_logs_day_bucket', 'smtp_provider_usage_logs', ['day_bucket'])


def downgrade() -> None:
    # Drop indices
    op.drop_index('idx_smtp_provider_usage_logs_day_bucket', table_name='smtp_provider_usage_logs')
    op.drop_index('idx_smtp_provider_usage_logs_hour_bucket', table_name='smtp_provider_usage_logs')
    op.drop_index('idx_smtp_provider_usage_logs_timestamp', table_name='smtp_provider_usage_logs')
    op.drop_index('idx_smtp_provider_usage_logs_config_id', table_name='smtp_provider_usage_logs')
    
    op.drop_index('idx_smtp_provider_configs_is_active', table_name='smtp_provider_configs')
    op.drop_index('idx_smtp_provider_configs_provider', table_name='smtp_provider_configs')
    op.drop_index('idx_smtp_provider_configs_user_id', table_name='smtp_provider_configs')
    
    # Drop tables
    op.drop_table('smtp_provider_usage_logs')
    op.drop_table('smtp_provider_configs')
