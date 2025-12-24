-- =====================================================
-- ADVANCED ANALYTICS DATABASE MIGRATION (SAFE VERSION)
-- Run this in Supabase SQL Editor
-- Works with existing or new analytics_events table
-- =====================================================

-- 1. Handle Analytics Events Table
DO $$
BEGIN
    -- Check if table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'analytics_events') THEN
        RAISE NOTICE 'Table analytics_events exists, checking columns...';
        
        -- Add all missing columns
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'analytics_events' AND column_name = 'id') THEN
            ALTER TABLE analytics_events ADD COLUMN id UUID PRIMARY KEY DEFAULT gen_random_uuid();
            RAISE NOTICE 'Added id column';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'analytics_events' AND column_name = 'event_type') THEN
            ALTER TABLE analytics_events ADD COLUMN event_type VARCHAR(50) NOT NULL DEFAULT 'unknown';
            RAISE NOTICE 'Added event_type column';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'analytics_events' AND column_name = 'user_id') THEN
            ALTER TABLE analytics_events ADD COLUMN user_id VARCHAR(255);
            RAISE NOTICE 'Added user_id column';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'analytics_events' AND column_name = 'lead_id') THEN
            ALTER TABLE analytics_events ADD COLUMN lead_id UUID;
            RAISE NOTICE 'Added lead_id column';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'analytics_events' AND column_name = 'student_id') THEN
            ALTER TABLE analytics_events ADD COLUMN student_id VARCHAR(255);
            RAISE NOTICE 'Added student_id column';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'analytics_events' AND column_name = 'duration_seconds') THEN
            ALTER TABLE analytics_events ADD COLUMN duration_seconds INTEGER;
            RAISE NOTICE 'Added duration_seconds column';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'analytics_events' AND column_name = 'metadata') THEN
            ALTER TABLE analytics_events ADD COLUMN metadata JSONB DEFAULT '{}';
            RAISE NOTICE 'Added metadata column';
        END IF;
        
        -- Handle timestamp/event_timestamp
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'analytics_events' AND column_name = 'timestamp') THEN
            ALTER TABLE analytics_events RENAME COLUMN timestamp TO event_timestamp;
            RAISE NOTICE 'Renamed timestamp to event_timestamp';
        ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'analytics_events' AND column_name = 'event_timestamp') THEN
            ALTER TABLE analytics_events ADD COLUMN event_timestamp TIMESTAMPTZ DEFAULT NOW();
            RAISE NOTICE 'Added event_timestamp column';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'analytics_events' AND column_name = 'session_id') THEN
            ALTER TABLE analytics_events ADD COLUMN session_id VARCHAR(255);
            RAISE NOTICE 'Added session_id column';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'analytics_events' AND column_name = 'ip_address') THEN
            ALTER TABLE analytics_events ADD COLUMN ip_address INET;
            RAISE NOTICE 'Added ip_address column';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'analytics_events' AND column_name = 'user_agent') THEN
            ALTER TABLE analytics_events ADD COLUMN user_agent TEXT;
            RAISE NOTICE 'Added user_agent column';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'analytics_events' AND column_name = 'created_at') THEN
            ALTER TABLE analytics_events ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
            RAISE NOTICE 'Added created_at column';
        END IF;
        
        RAISE NOTICE 'Updated existing analytics_events table';
    ELSE
        -- Create new table
        CREATE TABLE analytics_events (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          event_type VARCHAR(50) NOT NULL,
          user_id VARCHAR(255),
          lead_id UUID,
          student_id VARCHAR(255),
          duration_seconds INTEGER,
          metadata JSONB DEFAULT '{}',
          event_timestamp TIMESTAMPTZ DEFAULT NOW(),
          session_id VARCHAR(255),
          ip_address INET,
          user_agent TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
        RAISE NOTICE 'Created new analytics_events table';
    END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_events_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_user ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_lead ON analytics_events(lead_id);
CREATE INDEX IF NOT EXISTS idx_events_timestamp ON analytics_events(event_timestamp);
CREATE INDEX IF NOT EXISTS idx_events_metadata ON analytics_events USING GIN(metadata);

-- 2. Add lead_score columns to leads table
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS lead_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS churn_risk VARCHAR(20) DEFAULT 'Low',
ADD COLUMN IF NOT EXISTS last_contact_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS next_action TEXT,
ADD COLUMN IF NOT EXISTS next_action_priority VARCHAR(20);

-- Create index for lead score
CREATE INDEX IF NOT EXISTS idx_leads_score ON leads(lead_score);

-- 3. Create view for lead analytics with scores
CREATE OR REPLACE VIEW vw_lead_analytics_enhanced AS
SELECT 
    l.id,
    l."fullName" as name,
    l.email,
    l.phone,
    l.status,
    l.source,
    l.estimated_value,
    l.sale_price,
    l.lead_score,
    l.churn_risk,
    l.last_contact_at,
    l.next_action,
    l.next_action_priority,
    l.created_at,
    l.updated_at,
    l.assigned_to,
    u.name as assigned_user_name,
    u.role as assigned_user_role,
    EXTRACT(YEAR FROM l.created_at) as year,
    EXTRACT(MONTH FROM l.created_at) as month,
    EXTRACT(QUARTER FROM l.created_at) as quarter,
    TO_CHAR(l.created_at, 'YYYY-MM') as year_month,
    DATE(l.created_at) as created_date,
    CASE 
        WHEN l.status = 'Enrolled' THEN 1 
        ELSE 0 
    END as is_converted,
    CASE 
        WHEN l.sale_price > 0 THEN 1 
        ELSE 0 
    END as has_sale,
    -- Calculate engagement metrics
    (SELECT COUNT(*) 
     FROM analytics_events ae 
     WHERE ae.lead_id = l.id 
     AND ae.event_type IN ('email_open', 'call_made', 'meeting_scheduled')
    ) as engagement_count,
    -- Days since last contact
    CASE 
        WHEN l.last_contact_at IS NOT NULL 
        THEN EXTRACT(DAY FROM (NOW() - l.last_contact_at))
        ELSE EXTRACT(DAY FROM (NOW() - l.created_at))
    END as days_since_contact
FROM leads l
LEFT JOIN users u ON l.assigned_to = u.id::VARCHAR;

-- 4. Create cohort analysis view
CREATE OR REPLACE VIEW vw_cohort_analysis AS
SELECT 
    TO_CHAR(created_at, 'YYYY-MM') as cohort_month,
    COUNT(*) as total_leads,
    COUNT(CASE WHEN status = 'Enrolled' THEN 1 END) as enrolled_count,
    COUNT(CASE WHEN status = 'Enrolled' AND 
          EXTRACT(MONTH FROM AGE(updated_at, created_at)) <= 1 THEN 1 END) as month_1_conversions,
    COUNT(CASE WHEN status = 'Enrolled' AND 
          EXTRACT(MONTH FROM AGE(updated_at, created_at)) <= 2 THEN 1 END) as month_2_conversions,
    COUNT(CASE WHEN status = 'Enrolled' AND 
          EXTRACT(MONTH FROM AGE(updated_at, created_at)) <= 3 THEN 1 END) as month_3_conversions,
    ROUND(COUNT(CASE WHEN status = 'Enrolled' AND 
          EXTRACT(MONTH FROM AGE(updated_at, created_at)) <= 1 THEN 1 END)::NUMERIC / 
          NULLIF(COUNT(*), 0) * 100, 2) as month_1_rate,
    ROUND(COUNT(CASE WHEN status = 'Enrolled' AND 
          EXTRACT(MONTH FROM AGE(updated_at, created_at)) <= 2 THEN 1 END)::NUMERIC / 
          NULLIF(COUNT(*), 0) * 100, 2) as month_2_rate,
    ROUND(COUNT(CASE WHEN status = 'Enrolled' AND 
          EXTRACT(MONTH FROM AGE(updated_at, created_at)) <= 3 THEN 1 END)::NUMERIC / 
          NULLIF(COUNT(*), 0) * 100, 2) as month_3_rate
FROM leads
GROUP BY TO_CHAR(created_at, 'YYYY-MM')
ORDER BY cohort_month DESC;

-- 5. Create revenue forecasting view
CREATE OR REPLACE VIEW vw_revenue_forecast AS
WITH source_conversion_rates AS (
    SELECT 
        source,
        COUNT(*) as total_leads,
        COUNT(CASE WHEN status = 'Enrolled' THEN 1 END) as converted_leads,
        ROUND(COUNT(CASE WHEN status = 'Enrolled' THEN 1 END)::NUMERIC / 
              NULLIF(COUNT(*), 0), 4) as conversion_rate
    FROM leads
    WHERE created_at >= NOW() - INTERVAL '6 months'
    GROUP BY source
)
SELECT 
    l.id,
    l."fullName" as name,
    l.status,
    l.source,
    l.estimated_value,
    scr.conversion_rate,
    CASE 
        WHEN l.status = 'Hot' THEN 0.7
        WHEN l.status = 'Warm' THEN 0.4
        WHEN l.status = 'Follow Up' THEN 0.25
        ELSE 0.1
    END as status_multiplier,
    ROUND(COALESCE(l.estimated_value, 50000) * 
          COALESCE(scr.conversion_rate, 0.15) * 
          CASE 
              WHEN l.status = 'Hot' THEN 0.7
              WHEN l.status = 'Warm' THEN 0.4
              WHEN l.status = 'Follow Up' THEN 0.25
              ELSE 0.1
          END, 2) as weighted_value
FROM leads l
LEFT JOIN source_conversion_rates scr ON l.source = scr.source
WHERE l.status NOT IN ('Enrolled', 'Not Interested');

-- 6. Create pipeline velocity view
CREATE OR REPLACE VIEW vw_pipeline_velocity AS
WITH status_changes AS (
    SELECT 
        lead_id,
        metadata->>'from_status' as from_status,
        metadata->>'to_status' as to_status,
        event_timestamp,
        LAG(event_timestamp) OVER (PARTITION BY lead_id ORDER BY event_timestamp) as prev_timestamp
    FROM analytics_events
    WHERE event_type = 'status_change'
)
SELECT 
    to_status,
    COUNT(*) as transition_count,
    ROUND(AVG(EXTRACT(EPOCH FROM (event_timestamp - prev_timestamp)) / 3600), 2) as avg_hours_in_previous_status,
    ROUND(MIN(EXTRACT(EPOCH FROM (event_timestamp - prev_timestamp)) / 3600), 2) as min_hours,
    ROUND(MAX(EXTRACT(EPOCH FROM (event_timestamp - prev_timestamp)) / 3600), 2) as max_hours
FROM status_changes
WHERE prev_timestamp IS NOT NULL
GROUP BY to_status
ORDER BY avg_hours_in_previous_status;

-- 7. Grant permissions
GRANT SELECT ON analytics_events TO authenticated;
GRANT INSERT ON analytics_events TO authenticated;
GRANT UPDATE ON analytics_events TO authenticated;

GRANT SELECT ON vw_lead_analytics_enhanced TO authenticated;
GRANT SELECT ON vw_cohort_analysis TO authenticated;
GRANT SELECT ON vw_revenue_forecast TO authenticated;
GRANT SELECT ON vw_pipeline_velocity TO authenticated;

-- 8. Create function to track events
CREATE OR REPLACE FUNCTION track_analytics_event(
    p_event_type VARCHAR,
    p_user_id VARCHAR DEFAULT NULL,
    p_lead_id UUID DEFAULT NULL,
    p_student_id VARCHAR DEFAULT NULL,
    p_duration_seconds INTEGER DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
    v_event_id UUID;
BEGIN
    INSERT INTO analytics_events (
        event_type,
        user_id,
        lead_id,
        student_id,
        duration_seconds,
        metadata
    ) VALUES (
        p_event_type,
        p_user_id,
        p_lead_id,
        p_student_id,
        p_duration_seconds,
        p_metadata
    ) RETURNING id INTO v_event_id;
    
    RETURN v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Create trigger to update last_contact_at on leads
CREATE OR REPLACE FUNCTION update_lead_last_contact()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.event_type IN ('call_made', 'email_sent', 'meeting_scheduled', 'whatsapp_sent') THEN
        UPDATE leads 
        SET last_contact_at = NEW.event_timestamp 
        WHERE id = NEW.lead_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_last_contact ON analytics_events;
CREATE TRIGGER trigger_update_last_contact
    AFTER INSERT ON analytics_events
    FOR EACH ROW
    EXECUTE FUNCTION update_lead_last_contact();

-- 10. Insert sample analytics events for testing (optional - only if table is empty)
DO $$
BEGIN
    IF (SELECT COUNT(*) FROM analytics_events) = 0 THEN
        -- Check if event_name column exists (use it if present, otherwise use event_type)
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'analytics_events' AND column_name = 'event_name') THEN
            INSERT INTO analytics_events (event_name, event_type, lead_id, metadata) 
            SELECT 
                'lead_viewed',
                'lead_viewed',
                id,
                jsonb_build_object('source', 'web_dashboard', 'assigned_to', assigned_to)
            FROM leads
            WHERE assigned_to IS NOT NULL
            LIMIT 10;
        ELSE
            INSERT INTO analytics_events (event_type, lead_id, metadata) 
            SELECT 
                'lead_viewed',
                id,
                jsonb_build_object('source', 'web_dashboard', 'assigned_to', assigned_to)
            FROM leads
            WHERE assigned_to IS NOT NULL
            LIMIT 10;
        END IF;
        RAISE NOTICE 'Inserted sample events';
    ELSE
        RAISE NOTICE 'Table already has data, skipping sample insert';
    END IF;
END $$;

-- =====================================================
-- Verification Queries
-- =====================================================

-- Check if tables and views were created
SELECT 
    'analytics_events' as object_name, 
    COUNT(*) as record_count 
FROM analytics_events
UNION ALL
SELECT 'vw_lead_analytics_enhanced', COUNT(*) FROM vw_lead_analytics_enhanced
UNION ALL
SELECT 'vw_cohort_analysis', COUNT(*) FROM vw_cohort_analysis
UNION ALL
SELECT 'vw_revenue_forecast', COUNT(*) FROM vw_revenue_forecast;

-- Check lead_score column
SELECT COUNT(*) as leads_with_scores 
FROM leads 
WHERE lead_score IS NOT NULL;

-- Verify column names in analytics_events
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'analytics_events'
ORDER BY ordinal_position;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
SELECT '✅ MIGRATION COMPLETED SUCCESSFULLY!' as status;
