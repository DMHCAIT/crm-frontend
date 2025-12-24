-- =====================================================
-- FIX: Rename 'timestamp' column to 'event_timestamp'
-- Run this ONLY if analytics_events table already exists
-- with 'timestamp' column
-- =====================================================

-- Option 1: If table exists with 'timestamp' column, rename it
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'analytics_events' 
    AND column_name = 'timestamp'
  ) THEN
    -- Rename the column
    ALTER TABLE analytics_events 
    RENAME COLUMN timestamp TO event_timestamp;
    
    RAISE NOTICE 'Column renamed from timestamp to event_timestamp';
  ELSE
    RAISE NOTICE 'Column timestamp does not exist - no action needed';
  END IF;
END $$;

-- Verify the change
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'analytics_events'
ORDER BY ordinal_position;

-- Recreate indexes if needed
DROP INDEX IF EXISTS idx_events_timestamp;
CREATE INDEX IF NOT EXISTS idx_events_timestamp ON analytics_events(event_timestamp);

DROP INDEX IF EXISTS idx_events_type_timestamp;
CREATE INDEX IF NOT EXISTS idx_events_type_timestamp ON analytics_events(event_type, event_timestamp DESC);

-- Recreate views if they exist
DROP VIEW IF EXISTS vw_recent_activities;
CREATE OR REPLACE VIEW vw_recent_activities AS
SELECT 
  ae.id,
  ae.event_type,
  ae.event_timestamp,
  ae.user_id,
  ae.lead_id,
  ae.metadata,
  u.name as user_name,
  l.name as lead_name,
  l.status as lead_status
FROM analytics_events ae
LEFT JOIN users u ON ae.user_id = u.id
LEFT JOIN leads l ON ae.lead_id = l.id
ORDER BY ae.event_timestamp DESC
LIMIT 1000;

-- Recreate pipeline velocity view
DROP VIEW IF EXISTS vw_pipeline_velocity;
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

-- Recreate trigger function
CREATE OR REPLACE FUNCTION update_lead_last_contact()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.event_type IN ('call_made', 'email_sent', 'meeting_scheduled', 'whatsapp_sent') THEN
        UPDATE leads 
        SET last_contact_at = NEW.event_timestamp 
        WHERE id::VARCHAR = NEW.lead_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_last_contact ON analytics_events;
CREATE TRIGGER trigger_update_last_contact
    AFTER INSERT ON analytics_events
    FOR EACH ROW
    EXECUTE FUNCTION update_lead_last_contact();

-- Grant permissions
GRANT SELECT ON vw_recent_activities TO authenticated;
GRANT SELECT ON vw_pipeline_velocity TO authenticated;

-- Success message
SELECT 'SUCCESS: timestamp column renamed to event_timestamp' as result;
