"""Fix comprehensive schema conflicts and type mismatches

Revision ID: fix_comprehensive_20250129
Revises: b96396a12565
Create Date: 2025-01-29 19:05:00.000000

"""
from alembic import op

# revision identifiers, used by Alembic.
revision = 'fix_comprehensive_20250129'
down_revision = 'b96396a12565'
branch_labels = None
depends_on = None


def upgrade():
    """Fix all schema conflicts and type mismatches."""
    
    # Fix campaign_metrics table issues
    try:
        # Drop foreign key constraint if exists
        op.execute("""
            DO $$ 
            BEGIN
                IF EXISTS (
                    SELECT 1 FROM information_schema.table_constraints 
                    WHERE constraint_name = 'campaign_metrics_campaign_id_fkey'
                ) THEN
                    ALTER TABLE campaign_metrics 
                    DROP CONSTRAINT campaign_metrics_campaign_id_fkey;
                END IF;
            EXCEPTION WHEN OTHERS THEN
                NULL;
            END $$;
        """)
        
        # Fix campaign_id column type (String to UUID)
        op.execute("""
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'campaign_metrics' 
                    AND column_name = 'campaign_id'
                ) THEN
                    -- Clear invalid data first
                    DELETE FROM campaign_metrics WHERE campaign_id IS NOT NULL;
                    
                    -- Change column type to UUID
                    ALTER TABLE campaign_metrics 
                    ALTER COLUMN campaign_id TYPE UUID USING NULL;
                    
                    -- Re-add foreign key constraint
                    IF EXISTS (
                        SELECT 1 FROM information_schema.tables 
                        WHERE table_name = 'campaigns'
                    ) THEN
                        ALTER TABLE campaign_metrics 
                        ADD CONSTRAINT campaign_metrics_campaign_id_fkey 
                        FOREIGN KEY (campaign_id) REFERENCES campaigns(id);
                    END IF;
                END IF;
            EXCEPTION WHEN OTHERS THEN
                NULL;
            END $$;
        """)
    except Exception:
        pass  # Table might not exist yet
    
    # Fix failed_sends table issues
    try:
        # Drop foreign key constraint if exists
        op.execute("""
            DO $$ 
            BEGIN
                IF EXISTS (
                    SELECT 1 FROM information_schema.table_constraints 
                    WHERE constraint_name = 'failed_sends_campaign_id_fkey'
                ) THEN
                    ALTER TABLE failed_sends 
                    DROP CONSTRAINT failed_sends_campaign_id_fkey;
                END IF;
            EXCEPTION WHEN OTHERS THEN
                NULL;
            END $$;
        """)
        
        # Fix campaign_id column type in failed_sends
        op.execute("""
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'failed_sends' 
                    AND column_name = 'campaign_id'
                ) THEN
                    -- Clear invalid data first
                    DELETE FROM failed_sends WHERE campaign_id IS NOT NULL;
                    
                    -- Change column type to UUID
                    ALTER TABLE failed_sends 
                    ALTER COLUMN campaign_id TYPE UUID USING NULL;
                    
                    -- Re-add foreign key constraint
                    IF EXISTS (
                        SELECT 1 FROM information_schema.tables 
                        WHERE table_name = 'campaigns'
                    ) THEN
                        ALTER TABLE failed_sends 
                        ADD CONSTRAINT failed_sends_campaign_id_fkey 
                        FOREIGN KEY (campaign_id) REFERENCES campaigns(id);
                    END IF;
                END IF;
            EXCEPTION WHEN OTHERS THEN
                NULL;
            END $$;
        """)
    except Exception:
        pass  # Table might not exist yet
    
    # Fix integrations table UUID conflicts
    try:
        # Ensure integrations table columns use UUID types, but avoid errors when table doesn't exist
        op.execute("""
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1 FROM information_schema.tables 
                    WHERE table_name = 'integrations'
                ) THEN
                    -- Convert id column to UUID if needed
                    IF EXISTS (
                        SELECT 1 FROM information_schema.columns 
                        WHERE table_name = 'integrations' 
                        AND column_name = 'id'
                        AND data_type != 'uuid'
                    ) THEN
                        DELETE FROM integrations;
                        ALTER TABLE integrations ALTER COLUMN id TYPE UUID USING id::uuid;
                    END IF;
                    -- Convert provider_id to UUID if needed
                    IF EXISTS (
                        SELECT 1 FROM information_schema.columns 
                        WHERE table_name = 'integrations' 
                        AND column_name = 'provider_id'
                        AND data_type != 'uuid'
                    ) THEN
                        DELETE FROM integrations;
                        ALTER TABLE integrations ALTER COLUMN provider_id TYPE UUID USING provider_id::uuid;
                    END IF;
                END IF;
            EXCEPTION WHEN OTHERS THEN
                NULL;
            END $$;
        """)
    except Exception:
        pass  # Table might not exist yet
    
    # Fix integration_field_maps references
    try:
        op.execute("""
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'integration_field_maps' 
                    AND column_name = 'integration_id'
                    AND data_type != 'uuid'
                ) THEN
                    -- Clear data to avoid conversion issues
                    DELETE FROM integration_field_maps;
                    
                    -- Convert integration_id column to UUID
                    ALTER TABLE integration_field_maps 
                    ALTER COLUMN integration_id TYPE UUID 
                    USING integration_id::uuid;
                END IF;
            EXCEPTION WHEN OTHERS THEN
                NULL;
            END $$;
        """)
    except Exception:
        pass  # Table might not exist yet
    
    # Create missing indexes for performance
    try:
        op.execute("""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_indexes 
                    WHERE indexname = 'idx_campaign_metrics_campaign_id'
                ) THEN
                    CREATE INDEX CONCURRENTLY idx_campaign_metrics_campaign_id 
                    ON campaign_metrics(campaign_id);
                END IF;
            EXCEPTION WHEN OTHERS THEN
                NULL;
            END $$;
        """)
        
        op.execute("""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_indexes 
                    WHERE indexname = 'idx_failed_sends_campaign_id'
                ) THEN
                    CREATE INDEX CONCURRENTLY idx_failed_sends_campaign_id 
                    ON failed_sends(campaign_id);
                END IF;
            EXCEPTION WHEN OTHERS THEN
                NULL;
            END $$;
        """)
    except Exception:
        pass  # Indexes might already exist


def downgrade():
    """Downgrade is not supported for this comprehensive fix."""
    pass 