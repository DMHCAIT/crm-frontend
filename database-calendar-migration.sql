-- =====================================================
-- CALENDAR EVENTS TABLE MIGRATION
-- Run in Supabase SQL Editor
-- =====================================================

-- Create calendar_events table
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(500) NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  type VARCHAR(50) DEFAULT 'meeting' CHECK (type IN ('meeting', 'call', 'demo', 'follow_up', 'reminder', 'other')),
  status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'rescheduled')),
  location VARCHAR(500),
  attendees JSONB DEFAULT '[]',
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  reminder_minutes INTEGER DEFAULT 30,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure end_time is after start_time
  CONSTRAINT check_event_times CHECK (end_time > start_time)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id ON calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_lead_id ON calendar_events(lead_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_time ON calendar_events(start_time);
CREATE INDEX IF NOT EXISTS idx_calendar_events_status ON calendar_events(status);
CREATE INDEX IF NOT EXISTS idx_calendar_events_type ON calendar_events(type);

-- Add updated_at trigger
DROP TRIGGER IF EXISTS update_calendar_events_updated_at ON calendar_events;
CREATE TRIGGER update_calendar_events_updated_at
    BEFORE UPDATE ON calendar_events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can see their own events
CREATE POLICY "Users can view own calendar events"
  ON calendar_events FOR SELECT
  USING (user_id = auth.uid() OR attendees @> to_jsonb(auth.uid()::text));

-- Users can create their own events
CREATE POLICY "Users can create own calendar events"
  ON calendar_events FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own events
CREATE POLICY "Users can update own calendar events"
  ON calendar_events FOR UPDATE
  USING (user_id = auth.uid());

-- Users can delete their own events
CREATE POLICY "Users can delete own calendar events"
  ON calendar_events FOR DELETE
  USING (user_id = auth.uid());

-- Admins can see all events
CREATE POLICY "Admins can view all calendar events"
  ON calendar_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Calendar events table created successfully';
    RAISE NOTICE '✅ Indexes and constraints added';
    RAISE NOTICE '✅ Row Level Security enabled';
END $$;
