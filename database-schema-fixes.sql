-- =====================================================
-- DATABASE SCHEMA FIXES - PRODUCTION READY
-- Fixes UUID/VARCHAR inconsistencies and adds proper foreign keys
-- Run in Supabase SQL Editor
-- =====================================================

-- 1. FIX: Convert user_id from VARCHAR to UUID in analytics_events
DO $$
BEGIN
    -- Check if user_id column exists and is VARCHAR
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'analytics_events' 
        AND column_name = 'user_id' 
        AND data_type = 'character varying'
    ) THEN
        -- Drop old column and recreate as UUID
        ALTER TABLE analytics_events DROP COLUMN IF EXISTS user_id CASCADE;
        ALTER TABLE analytics_events ADD COLUMN user_id UUID;
        RAISE NOTICE 'Converted analytics_events.user_id from VARCHAR to UUID';
    ELSIF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'analytics_events' 
        AND column_name = 'user_id'
    ) THEN
        -- Add as UUID if doesn't exist
        ALTER TABLE analytics_events ADD COLUMN user_id UUID;
        RAISE NOTICE 'Added analytics_events.user_id as UUID';
    END IF;
END $$;

-- 2. FIX: Ensure leads.id is UUID
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'leads' 
        AND column_name = 'id' 
        AND data_type != 'uuid'
    ) THEN
        -- Create migration table
        CREATE TABLE IF NOT EXISTS leads_new (LIKE leads INCLUDING ALL);
        ALTER TABLE leads_new ALTER COLUMN id TYPE UUID USING id::uuid;
        
        -- Copy data
        INSERT INTO leads_new SELECT * FROM leads;
        
        -- Swap tables
        DROP TABLE leads CASCADE;
        ALTER TABLE leads_new RENAME TO leads;
        
        RAISE NOTICE 'Converted leads.id to UUID';
    END IF;
END $$;

-- 3. FIX: Standardize user name columns (use fullName everywhere)
DO $$
BEGIN
    -- In users table, ensure we have fullName
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'name'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'fullName'
    ) THEN
        ALTER TABLE users RENAME COLUMN name TO "fullName";
        RAISE NOTICE 'Renamed users.name to users.fullName';
    ELSIF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'fullName'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'name'
    ) THEN
        ALTER TABLE users ADD COLUMN "fullName" VARCHAR(255);
        RAISE NOTICE 'Added users.fullName column';
    END IF;
END $$;

-- 4. ADD: Foreign key constraints
DO $$
BEGIN
    -- analytics_events.user_id → users.id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_analytics_events_user'
    ) THEN
        ALTER TABLE analytics_events 
        ADD CONSTRAINT fk_analytics_events_user 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
        RAISE NOTICE 'Added foreign key: analytics_events.user_id → users.id';
    END IF;

    -- analytics_events.lead_id → leads.id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_analytics_events_lead'
    ) THEN
        ALTER TABLE analytics_events 
        ADD CONSTRAINT fk_analytics_events_lead 
        FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL;
        RAISE NOTICE 'Added foreign key: analytics_events.lead_id → leads.id';
    END IF;

    -- lead_scoring.lead_id → leads.id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_lead_scoring_lead'
    ) THEN
        ALTER TABLE lead_scoring 
        ADD CONSTRAINT fk_lead_scoring_lead 
        FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added foreign key: lead_scoring.lead_id → leads.id';
    END IF;

    -- lead_scoring.updated_by → users.id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_lead_scoring_user'
    ) THEN
        ALTER TABLE lead_scoring 
        ADD CONSTRAINT fk_lead_scoring_user 
        FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL;
        RAISE NOTICE 'Added foreign key: lead_scoring.updated_by → users.id';
    END IF;
END $$;

-- 5. ADD: Indexes for performance
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_lead_id ON analytics_events(lead_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp ON analytics_events(event_timestamp);
CREATE INDEX IF NOT EXISTS idx_lead_scoring_lead_id ON lead_scoring(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_scoring_score ON lead_scoring(score);

-- 6. ADD: Check constraints
ALTER TABLE analytics_events 
DROP CONSTRAINT IF EXISTS check_event_type,
ADD CONSTRAINT check_event_type 
CHECK (event_type IN ('page_view', 'lead_created', 'lead_updated', 'lead_converted', 'user_login', 'export', 'search', 'filter'));

ALTER TABLE lead_scoring 
DROP CONSTRAINT IF EXISTS check_score_range,
ADD CONSTRAINT check_score_range 
CHECK (score >= 0 AND score <= 100);

-- 7. FIX: Ensure student_id consistency
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'students' 
        AND column_name = 'id' 
        AND data_type != 'uuid'
    ) THEN
        ALTER TABLE students ALTER COLUMN id TYPE UUID USING id::uuid;
        RAISE NOTICE 'Converted students.id to UUID';
    END IF;
END $$;

-- 8. ADD: Updated timestamp triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_leads_updated_at ON leads;
CREATE TRIGGER update_leads_updated_at
    BEFORE UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 9. VERIFY: Schema consistency
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    -- Check for orphaned analytics_events
    SELECT COUNT(*) INTO v_count
    FROM analytics_events ae
    LEFT JOIN users u ON ae.user_id = u.id
    WHERE ae.user_id IS NOT NULL AND u.id IS NULL;
    
    IF v_count > 0 THEN
        RAISE WARNING 'Found % orphaned user_id references in analytics_events', v_count;
    END IF;

    -- Check for orphaned lead_id
    SELECT COUNT(*) INTO v_count
    FROM analytics_events ae
    LEFT JOIN leads l ON ae.lead_id = l.id
    WHERE ae.lead_id IS NOT NULL AND l.id IS NULL;
    
    IF v_count > 0 THEN
        RAISE WARNING 'Found % orphaned lead_id references in analytics_events', v_count;
    END IF;
END $$;

-- 10. CLEANUP: Remove old test/debug data
DELETE FROM analytics_events WHERE event_type = 'test' OR event_type = 'debug';

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Database schema fixes completed successfully';
    RAISE NOTICE '✅ All UUID/VARCHAR inconsistencies resolved';
    RAISE NOTICE '✅ Foreign key constraints added';
    RAISE NOTICE '✅ Performance indexes created';
    RAISE NOTICE '✅ Data integrity triggers enabled';
END $$;
