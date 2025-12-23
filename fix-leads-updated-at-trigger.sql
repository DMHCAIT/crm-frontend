-- =====================================================
-- Fix Updated At Trigger for Leads Table
-- This ensures the updated_at column is automatically
-- updated whenever a lead record is modified
-- =====================================================

-- Create or replace the function that updates the updated_at timestamp
CREATE OR REPLACE FUNCTION update_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists (to avoid duplicates)
DROP TRIGGER IF EXISTS trigger_update_leads_updated_at ON leads;

-- Create the trigger on the leads table
CREATE TRIGGER trigger_update_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_leads_updated_at();

-- Optional: Update all existing leads to set their updated_at to their created_at if null
-- This gives existing records a baseline updated_at value
UPDATE leads 
SET updated_at = COALESCE(updated_at, created_at, NOW())
WHERE updated_at IS NULL;

-- Verify the trigger was created
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'leads'
  AND trigger_name = 'trigger_update_leads_updated_at';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Updated at trigger for leads table created successfully!';
  RAISE NOTICE '📅 The updated_at column will now automatically update when leads are modified.';
END $$;
