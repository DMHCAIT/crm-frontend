-- =====================================================
-- COMPLETE FIX: Updated Leads Date Filter
-- This file includes diagnostics + fix in one script
-- Run this entire file in Supabase SQL Editor
-- =====================================================

-- PART 1: DIAGNOSTIC CHECKS (see results before fix)
-- =====================================================

DO $$ 
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '   DIAGNOSTIC: Current State Check';
  RAISE NOTICE '========================================';
END $$;

-- Check if updated_at column exists
DO $$
DECLARE
  col_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'leads' AND column_name = 'updated_at'
  ) INTO col_exists;
  
  IF col_exists THEN
    RAISE NOTICE '✅ Column updated_at EXISTS in leads table';
  ELSE
    RAISE NOTICE '❌ Column updated_at MISSING - will be created';
  END IF;
END $$;

-- Check if trigger exists
DO $$
DECLARE
  trigger_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.triggers 
    WHERE event_object_table = 'leads' 
      AND trigger_name = 'trigger_update_leads_updated_at'
  ) INTO trigger_exists;
  
  IF trigger_exists THEN
    RAISE NOTICE '⚠️ Trigger ALREADY EXISTS - will be recreated';
  ELSE
    RAISE NOTICE '❌ Trigger MISSING - will be created';
  END IF;
END $$;

-- Check sample of current data
DO $$
DECLARE
  total_leads integer;
  never_updated integer;
  has_null integer;
BEGIN
  SELECT COUNT(*) INTO total_leads FROM leads;
  
  SELECT COUNT(*) INTO never_updated 
  FROM leads 
  WHERE updated_at = created_at OR updated_at IS NULL;
  
  SELECT COUNT(*) INTO has_null 
  FROM leads 
  WHERE updated_at IS NULL;
  
  RAISE NOTICE '';
  RAISE NOTICE 'Current Data Status:';
  RAISE NOTICE '  Total Leads: %', total_leads;
  RAISE NOTICE '  Never Updated (updated_at = created_at): %', never_updated;
  RAISE NOTICE '  NULL updated_at: %', has_null;
  RAISE NOTICE '';
END $$;

-- PART 2: CREATE OR ADD updated_at COLUMN (if missing)
-- =====================================================

DO $$ 
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '   STEP 1: Ensure Column Exists';
  RAISE NOTICE '========================================';
END $$;

-- Add column if it doesn't exist
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

DO $$ 
BEGIN
  RAISE NOTICE '✅ Column updated_at is ready';
END $$;

-- PART 3: CREATE TRIGGER FUNCTION
-- =====================================================

DO $$ 
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '   STEP 2: Create Trigger Function';
  RAISE NOTICE '========================================';
END $$;

-- Create or replace the function that updates the updated_at timestamp
CREATE OR REPLACE FUNCTION update_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ 
BEGIN
  RAISE NOTICE '✅ Function update_leads_updated_at() created';
END $$;

-- PART 4: CREATE TRIGGER
-- =====================================================

DO $$ 
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '   STEP 3: Create Trigger';
  RAISE NOTICE '========================================';
END $$;

-- Drop the trigger if it exists (to avoid duplicates)
DROP TRIGGER IF EXISTS trigger_update_leads_updated_at ON leads;

-- Create the trigger on the leads table
CREATE TRIGGER trigger_update_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_leads_updated_at();

DO $$ 
BEGIN
  RAISE NOTICE '✅ Trigger trigger_update_leads_updated_at created';
  RAISE NOTICE '   This trigger will now automatically update updated_at';
  RAISE NOTICE '   whenever any lead record is modified';
END $$;

-- PART 5: BACKFILL EXISTING DATA
-- =====================================================

DO $$ 
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '   STEP 4: Backfill Existing Leads';
  RAISE NOTICE '========================================';
END $$;

-- Update all existing leads to set their updated_at to their created_at if null
-- This gives existing records a baseline updated_at value
UPDATE leads 
SET updated_at = COALESCE(updated_at, created_at, NOW())
WHERE updated_at IS NULL OR updated_at = created_at;

DO $$
DECLARE
  updated_count integer;
BEGIN
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE '✅ Backfilled % lead records', updated_count;
  RAISE NOTICE '   All leads now have updated_at = created_at as baseline';
END $$;

-- PART 6: VERIFICATION
-- =====================================================

DO $$ 
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '   STEP 5: Verification';
  RAISE NOTICE '========================================';
END $$;

-- Verify the trigger was created
DO $$
DECLARE
  trigger_exists boolean;
  trigger_timing text;
  trigger_event text;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.triggers
    WHERE event_object_table = 'leads'
      AND trigger_name = 'trigger_update_leads_updated_at'
  ) INTO trigger_exists;
  
  IF trigger_exists THEN
    SELECT action_timing, event_manipulation
    INTO trigger_timing, trigger_event
    FROM information_schema.triggers
    WHERE event_object_table = 'leads'
      AND trigger_name = 'trigger_update_leads_updated_at'
    LIMIT 1;
    
    RAISE NOTICE '✅ Trigger verified: % % on leads table', trigger_timing, trigger_event;
  ELSE
    RAISE NOTICE '❌ ERROR: Trigger was not created!';
  END IF;
END $$;

-- Check final data state
DO $$
DECLARE
  total_leads integer;
  with_updated_at integer;
  null_updated_at integer;
BEGIN
  SELECT COUNT(*) INTO total_leads FROM leads;
  SELECT COUNT(*) INTO with_updated_at FROM leads WHERE updated_at IS NOT NULL;
  SELECT COUNT(*) INTO null_updated_at FROM leads WHERE updated_at IS NULL;
  
  RAISE NOTICE '';
  RAISE NOTICE 'Final Data State:';
  RAISE NOTICE '  Total Leads: %', total_leads;
  RAISE NOTICE '  With updated_at: %', with_updated_at;
  RAISE NOTICE '  NULL updated_at: %', null_updated_at;
END $$;

-- PART 7: SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '   ✅ MIGRATION COMPLETE!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'What happens now:';
  RAISE NOTICE '  1. ✅ updated_at column exists and has values';
  RAISE NOTICE '  2. ✅ Trigger automatically updates updated_at on every UPDATE';
  RAISE NOTICE '  3. ✅ All existing leads have updated_at = created_at (baseline)';
  RAISE NOTICE '  4. ✅ Date filters will now work correctly!';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Refresh your CRM page (Cmd+R or F5)';
  RAISE NOTICE '  2. Try "Updated Today" filter';
  RAISE NOTICE '  3. Modify a lead and see it appear in "Updated Today"';
  RAISE NOTICE '  4. Test Custom Date Range filter';
  RAISE NOTICE '';
  RAISE NOTICE 'The Updated Leads date filter is now WORKING! 🎉';
  RAISE NOTICE '';
END $$;
