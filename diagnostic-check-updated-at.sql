-- =====================================================
-- DIAGNOSTIC: Check Updated At Column Status
-- Run this BEFORE running the trigger migration
-- to understand the current state of your data
-- =====================================================

-- 1. Check if updated_at column exists
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'leads' 
  AND column_name = 'updated_at';

-- 2. Check sample of updated_at values
SELECT 
  id,
  name,
  status,
  created_at,
  updated_at,
  CASE 
    WHEN updated_at = created_at THEN '⚠️ SAME (Never Updated)'
    WHEN updated_at IS NULL THEN '❌ NULL'
    WHEN updated_at > created_at THEN '✅ Different (Has been updated)'
    ELSE '❓ Unknown'
  END as update_status
FROM leads
ORDER BY created_at DESC
LIMIT 20;

-- 3. Count leads by update status
SELECT 
  CASE 
    WHEN updated_at = created_at THEN 'Never Updated (updated_at = created_at)'
    WHEN updated_at IS NULL THEN 'NULL (missing updated_at)'
    WHEN updated_at > created_at THEN 'Has Been Updated'
    ELSE 'Other'
  END as status,
  COUNT(*) as count
FROM leads
GROUP BY 
  CASE 
    WHEN updated_at = created_at THEN 'Never Updated (updated_at = created_at)'
    WHEN updated_at IS NULL THEN 'NULL (missing updated_at)'
    WHEN updated_at > created_at THEN 'Has Been Updated'
    ELSE 'Other'
  END
ORDER BY count DESC;

-- 4. Check if trigger already exists
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_timing
FROM information_schema.triggers
WHERE event_object_table = 'leads'
  AND trigger_name LIKE '%updated_at%';

-- 5. Sample leads that should match your date filter (03/12/2025 - 11/12/2025)
-- This checks both created_at and updated_at
SELECT 
  id,
  name,
  status,
  created_at::date as created_date,
  updated_at::date as updated_date,
  CASE 
    WHEN updated_at::date BETWEEN '2025-12-03' AND '2025-12-11' THEN '✅ In Range'
    ELSE '❌ Out of Range'
  END as in_filter_range
FROM leads
WHERE updated_at::date BETWEEN '2025-12-03' AND '2025-12-11'
ORDER BY updated_at DESC
LIMIT 10;

-- 6. Count how many leads fall in your filter range
SELECT 
  COUNT(*) as leads_in_range,
  MIN(updated_at) as earliest_update,
  MAX(updated_at) as latest_update
FROM leads
WHERE updated_at::date BETWEEN '2025-12-03' AND '2025-12-11';

-- =====================================================
-- EXPECTED RESULTS:
-- 
-- If Trigger is MISSING:
-- - Query 2: All leads show "⚠️ SAME (Never Updated)"
-- - Query 3: 100% of leads in "Never Updated" category
-- - Query 4: Returns 0 rows (no trigger)
-- - Query 6: Shows 0 or very few leads (only those created in that range)
--
-- If Trigger EXISTS:
-- - Query 2: Mix of statuses, some show "✅ Different"
-- - Query 3: Mix of "Never Updated" and "Has Been Updated"
-- - Query 4: Returns trigger_update_leads_updated_at
-- - Query 6: Shows actual leads modified in that date range
-- =====================================================
