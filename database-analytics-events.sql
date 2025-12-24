-- =====================================================
-- ANALYTICS EVENTS TABLE - Activity Tracking System
-- Run this in Supabase SQL Editor
-- Created: December 24, 2025
-- =====================================================

-- Create analytics_events table for comprehensive activity tracking
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(50) NOT NULL,
  user_id VARCHAR(255),
  lead_id VARCHAR(255),
  student_id VARCHAR(255),
  duration_seconds INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  event_timestamp TIMESTAMPTZ DEFAULT NOW(),
  session_id VARCHAR(255),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_events_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_user ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_lead ON analytics_events(lead_id);
CREATE INDEX IF NOT EXISTS idx_events_timestamp ON analytics_events(event_timestamp);
CREATE INDEX IF NOT EXISTS idx_events_session ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON analytics_events(created_at DESC);

-- Create composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_events_user_type ON analytics_events(user_id, event_type);
CREATE INDEX IF NOT EXISTS idx_events_lead_type ON analytics_events(lead_id, event_type);
CREATE INDEX IF NOT EXISTS idx_events_type_timestamp ON analytics_events(event_type, event_timestamp DESC);

-- Add comments for documentation
COMMENT ON TABLE analytics_events IS 'Tracks all user interactions and system events for analytics';
COMMENT ON COLUMN analytics_events.event_type IS 'Type of event: lead_viewed, lead_created, lead_updated, email_sent, call_made, status_change, etc.';
COMMENT ON COLUMN analytics_events.metadata IS 'JSON field for flexible event-specific data: {outcome, device, location, from_status, to_status, etc.}';
COMMENT ON COLUMN analytics_events.duration_seconds IS 'Duration of the event in seconds (e.g., time spent viewing lead)';

-- Create lead_scores table for storing calculated scores
CREATE TABLE IF NOT EXISTS lead_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id VARCHAR(255) NOT NULL UNIQUE,
  score INTEGER DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  score_level VARCHAR(20) DEFAULT 'Low', -- High, Medium, Low
  engagement_score INTEGER DEFAULT 0,
  recency_score INTEGER DEFAULT 0,
  source_score INTEGER DEFAULT 0,
  profile_score INTEGER DEFAULT 0,
  behavioral_score INTEGER DEFAULT 0,
  churn_risk INTEGER DEFAULT 0 CHECK (churn_risk >= 0 AND churn_risk <= 100),
  churn_level VARCHAR(20) DEFAULT 'Low', -- High, Medium, Low
  last_calculated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for lead_scores
CREATE INDEX IF NOT EXISTS idx_lead_scores_lead ON lead_scores(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_scores_score ON lead_scores(score DESC);
CREATE INDEX IF NOT EXISTS idx_lead_scores_level ON lead_scores(score_level);
CREATE INDEX IF NOT EXISTS idx_lead_scores_churn ON lead_scores(churn_risk DESC);

-- Add comments
COMMENT ON TABLE lead_scores IS 'Stores calculated lead scores and churn predictions';
COMMENT ON COLUMN lead_scores.score IS 'Overall lead score (0-100) based on multiple factors';
COMMENT ON COLUMN lead_scores.churn_risk IS 'Probability of lead going cold (0-100)';

-- Create function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_lead_scores_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for lead_scores
DROP TRIGGER IF EXISTS trigger_update_lead_scores_updated_at ON lead_scores;
CREATE TRIGGER trigger_update_lead_scores_updated_at
  BEFORE UPDATE ON lead_scores
  FOR EACH ROW
  EXECUTE FUNCTION update_lead_scores_updated_at();

-- Grant permissions (adjust based on your RLS policies)
GRANT SELECT, INSERT, UPDATE ON analytics_events TO authenticated;
GRANT SELECT, INSERT, UPDATE ON lead_scores TO authenticated;

-- Create view for recent activities
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

-- Grant permissions
GRANT SELECT ON vw_recent_activities TO authenticated;

-- Insert sample event types documentation
COMMENT ON TABLE analytics_events IS 'Event Types:
- lead_viewed: User viewed lead details
- lead_created: New lead created
- lead_updated: Lead information updated
- lead_assigned: Lead assigned to user
- status_change: Lead status changed
- email_sent: Email sent to lead
- email_opened: Lead opened email
- call_made: Phone call made
- call_answered: Call was answered
- call_missed: Call not answered
- whatsapp_sent: WhatsApp message sent
- follow_up_created: Follow-up scheduled
- follow_up_completed: Follow-up completed
- document_uploaded: Document uploaded
- note_added: Note added to lead
- login: User logged in
- logout: User logged out';

-- =====================================================
-- SUCCESS! Tables created successfully
-- =====================================================

-- Verify tables
SELECT 'analytics_events' as table_name, COUNT(*) as row_count FROM analytics_events
UNION ALL
SELECT 'lead_scores', COUNT(*) FROM lead_scores;

-- Check indexes
SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename IN ('analytics_events', 'lead_scores')
ORDER BY tablename, indexname;
