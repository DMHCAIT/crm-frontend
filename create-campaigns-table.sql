-- Create WhatsApp Campaigns Table
-- Run this in Supabase SQL Editor to persist campaigns

-- First, ensure communications table has all required columns
DO $$ 
BEGIN
  -- Add sent_at if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'communications' AND column_name = 'sent_at'
  ) THEN
    ALTER TABLE communications 
    ADD COLUMN sent_at TIMESTAMPTZ DEFAULT NOW();
  END IF;

  -- Add direction if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'communications' AND column_name = 'direction'
  ) THEN
    ALTER TABLE communications 
    ADD COLUMN direction TEXT DEFAULT 'outbound' CHECK (direction IN ('inbound', 'outbound'));
  END IF;

  -- Add lead_id if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'communications' AND column_name = 'lead_id'
  ) THEN
    ALTER TABLE communications 
    ADD COLUMN lead_id BIGINT;
  END IF;

  -- Add type if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'communications' AND column_name = 'type'
  ) THEN
    ALTER TABLE communications 
    ADD COLUMN type TEXT DEFAULT 'whatsapp' CHECK (type IN ('whatsapp', 'email', 'call', 'sms'));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS whatsapp_campaigns (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  template TEXT NOT NULL,
  segment_filters JSONB DEFAULT '{}',
  lead_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sending', 'sent', 'failed', 'paused')),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Campaign statistics
  total_sent INTEGER DEFAULT 0,
  total_delivered INTEGER DEFAULT 0,
  total_failed INTEGER DEFAULT 0,
  total_read INTEGER DEFAULT 0,
  total_replied INTEGER DEFAULT 0
);

-- Add campaign_id to communications table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'communications' AND column_name = 'campaign_id'
  ) THEN
    ALTER TABLE communications 
    ADD COLUMN campaign_id BIGINT REFERENCES whatsapp_campaigns(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON whatsapp_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_by ON whatsapp_campaigns(created_by);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_at ON whatsapp_campaigns(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_communications_campaign_id ON communications(campaign_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_campaigns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_campaigns_updated_at ON whatsapp_campaigns;
CREATE TRIGGER trigger_update_campaigns_updated_at
  BEFORE UPDATE ON whatsapp_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_campaigns_updated_at();

-- Create WhatsApp Templates Table
CREATE TABLE IF NOT EXISTS whatsapp_templates (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  variables JSONB DEFAULT '[]', -- Array of variable names like ["name", "course", "qualification"]
  category TEXT DEFAULT 'marketing' CHECK (category IN ('marketing', 'followup', 'enrollment', 'reminder', 'general')),
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  usage_count INTEGER DEFAULT 0
);

-- Create indexes for templates
CREATE INDEX IF NOT EXISTS idx_templates_category ON whatsapp_templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_active ON whatsapp_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_templates_created_by ON whatsapp_templates(created_by);

-- Add updated_at trigger for templates
DROP TRIGGER IF EXISTS trigger_update_templates_updated_at ON whatsapp_templates;
CREATE TRIGGER trigger_update_templates_updated_at
  BEFORE UPDATE ON whatsapp_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_campaigns_updated_at();

-- Insert some default templates
INSERT INTO whatsapp_templates (name, content, variables, category) VALUES
('Welcome Message', 'Hi {name}! 👋 Thank you for your interest in {course}. We''d love to help you achieve your career goals!', '["name", "course"]', 'marketing'),
('Course Info', 'Hello {name}! 🎓 Here''s information about {course}:\n\n✅ Industry-recognized certification\n✅ 100% placement assistance\n✅ Flexible payment plans\n\nReply "CALLBACK" to speak with our counselor!', '["name", "course"]', 'marketing'),
('Follow-up', 'Hi {name}, just checking in! Have you had a chance to think about enrolling in {course}? Our next batch starts soon! 🚀', '["name", "course"]', 'followup'),
('Enrollment Reminder', 'Hello {name}! ⏰ Only 3 days left to secure your spot in {course}. Early bird discount ends soon! Reply "ENROLL" for details.', '["name", "course"]', 'reminder')
ON CONFLICT DO NOTHING;

-- Add RLS policies (if using Row Level Security)
ALTER TABLE whatsapp_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_templates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS campaigns_select_own ON whatsapp_campaigns;
DROP POLICY IF EXISTS campaigns_insert ON whatsapp_campaigns;
DROP POLICY IF EXISTS campaigns_update_own ON whatsapp_campaigns;
DROP POLICY IF EXISTS templates_select_active ON whatsapp_templates;
DROP POLICY IF EXISTS templates_all_admin ON whatsapp_templates;

-- Policy: Users can view campaigns they created
CREATE POLICY campaigns_select_own ON whatsapp_campaigns
  FOR SELECT
  USING (created_by = auth.uid());

-- Policy: Users can insert campaigns
CREATE POLICY campaigns_insert ON whatsapp_campaigns
  FOR INSERT
  WITH CHECK (created_by = auth.uid());

-- Policy: Users can update their own campaigns
CREATE POLICY campaigns_update_own ON whatsapp_campaigns
  FOR UPDATE
  USING (created_by = auth.uid());

-- Policy: Users can view all active templates
CREATE POLICY templates_select_active ON whatsapp_templates
  FOR SELECT
  USING (is_active = true);

-- Policy: Admins can manage templates
CREATE POLICY templates_all_admin ON whatsapp_templates
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid()
    AND users.role IN ('Admin', 'Super Admin')
  ));

COMMENT ON TABLE whatsapp_campaigns IS 'Stores WhatsApp marketing campaigns with segment filters and statistics';
COMMENT ON TABLE whatsapp_templates IS 'Reusable WhatsApp message templates with variable support';
