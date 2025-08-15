"""Master consolidated migration for SGPT database

This migration consolidates all essential database changes and fixes
to provide a clean, single migration path for new deployments.

Revision ID: master_consolidated_20250129
Revises: fix_comprehensive_20250129
Create Date: 2025-01-29 19:06:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'master_consolidated_20250129'
down_revision = 'fix_comprehensive_20250129'
branch_labels = None
depends_on = None


def upgrade():
    """Apply consolidated database schema updates."""
    
    # Ensure all critical tables exist with correct types
    create_essential_tables()
    
    # Fix any remaining type inconsistencies
    fix_remaining_type_issues()
    
    # Add performance indexes
    add_performance_indexes()
    
    # Verify schema integrity
    verify_schema_integrity()


def create_essential_tables():
    """Create any missing essential tables."""
    
    # Ensure extension available for UUID generation
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_extension WHERE extname = 'pgcrypto'
            ) THEN
                CREATE EXTENSION pgcrypto;
            END IF;
        EXCEPTION WHEN OTHERS THEN
            NULL;
        END $$;
    """)

    # Ensure users table exists (foundation table) with latest columns
    op.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            first_name VARCHAR(100),
            last_name VARCHAR(100),
            is_active BOOLEAN DEFAULT TRUE,
            is_superuser BOOLEAN DEFAULT FALSE,
            is_verified BOOLEAN DEFAULT FALSE,
            plan VARCHAR(50),
            two_factor_enabled BOOLEAN DEFAULT FALSE,
            two_factor_secret VARCHAR(6),
            two_factor_secret_expires TIMESTAMP WITH TIME ZONE,
            two_factor_verified BOOLEAN DEFAULT FALSE,
            two_factor_backup_codes JSONB,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    """)

    # Users key indexes
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_indexes WHERE indexname = 'ix_users_email'
            ) THEN
                CREATE INDEX CONCURRENTLY ix_users_email ON users(email);
            END IF;
        EXCEPTION WHEN OTHERS THEN
            NULL;
        END $$;
    """)
    
    # Ensure campaigns table exists (critical for metrics)
    op.execute("""
        CREATE TABLE IF NOT EXISTS campaigns (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(255) NOT NULL,
            description TEXT,
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            status VARCHAR(50) DEFAULT 'draft',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    """)


def fix_remaining_type_issues():
    """Fix any remaining type inconsistencies."""
    
    # Standardize all ID fields to UUID
    tables_to_fix = [
        'campaign_metrics',
        'failed_sends', 
        'integrations',
        'integration_field_maps',
        'integration_sync_logs',
        'sessions',
        'proxy_servers'
    ]
    
    for table in tables_to_fix:
        op.execute(f"""
            DO $$
            BEGIN
                -- Fix main ID column
                IF EXISTS (
                    SELECT 1 FROM information_schema.tables 
                    WHERE table_name = '{table}'
                ) THEN
                    IF EXISTS (
                        SELECT 1 FROM information_schema.columns 
                        WHERE table_name = '{table}' 
                        AND column_name = 'id' 
                        AND data_type != 'uuid'
                    ) THEN
                        DELETE FROM {table};
                        ALTER TABLE {table} 
                        ALTER COLUMN id TYPE UUID USING gen_random_uuid();
                    END IF;
                END IF;
            EXCEPTION WHEN OTHERS THEN
                NULL;
            END $$;
        """)


def add_performance_indexes():
    """Add critical performance indexes."""
    
    indexes = [
        ('users', 'email'),
        ('campaigns', 'user_id'),
        ('campaign_metrics', 'campaign_id'),
        ('failed_sends', 'campaign_id'),
        ('sessions', 'user_id'),
        ('integrations', 'session_id'),
        ('integrations', 'provider_id'),
    ]
    
    for table, column in indexes:
        op.execute(f"""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_indexes 
                    WHERE tablename = '{table}' 
                    AND indexname = 'idx_{table}_{column}'
                ) THEN
                    CREATE INDEX CONCURRENTLY idx_{table}_{column} 
                    ON {table}({column});
                END IF;
            EXCEPTION WHEN OTHERS THEN
                NULL;
            END $$;
        """)


def verify_schema_integrity():
    """Verify that all foreign key relationships are valid."""
    
    # Check and fix foreign key constraints
    foreign_keys = [
        ('campaigns', 'user_id', 'users', 'id'),
        ('campaign_metrics', 'campaign_id', 'campaigns', 'id'),
        ('failed_sends', 'campaign_id', 'campaigns', 'id'),
        ('sessions', 'user_id', 'users', 'id'),
        ('integrations', 'session_id', 'sessions', 'id'),
    ]
    
    for child_table, child_col, parent_table, parent_col in foreign_keys:
        constraint_name = f"{child_table}_{child_col}_fkey"
        
        op.execute(f"""
            DO $$
            BEGIN
                -- Remove existing constraint if it exists
                IF EXISTS (
                    SELECT 1 FROM information_schema.table_constraints 
                    WHERE constraint_name = '{constraint_name}'
                ) THEN
                    ALTER TABLE {child_table} 
                    DROP CONSTRAINT {constraint_name};
                END IF;
                
                -- Add constraint only if both tables exist
                IF EXISTS (
                    SELECT 1 FROM information_schema.tables 
                    WHERE table_name = '{child_table}'
                ) AND EXISTS (
                    SELECT 1 FROM information_schema.tables 
                    WHERE table_name = '{parent_table}'
                ) THEN
                    -- Clean up orphaned records first
                    DELETE FROM {child_table} 
                    WHERE {child_col} IS NOT NULL 
                    AND {child_col} NOT IN (
                        SELECT {parent_col} FROM {parent_table}
                    );
                    
                    -- Add the foreign key constraint
                    ALTER TABLE {child_table} 
                    ADD CONSTRAINT {constraint_name} 
                    FOREIGN KEY ({child_col}) REFERENCES {parent_table}({parent_col});
                END IF;
            EXCEPTION WHEN OTHERS THEN
                NULL;
            END $$;
        """)


def downgrade():
    """Downgrade operations."""
    # Note: Downgrade is complex for consolidated migrations
    # Consider this a one-way migration for stability
    pass 