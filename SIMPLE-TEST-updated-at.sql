-- SIMPLE TEST: Check if updated_at is the problem
-- Run this in Supabase SQL Editor

-- Test 1: Count leads updated yesterday (Dec 22, 2025)
SELECT COUNT(*) as leads_updated_yesterday
FROM leads
WHERE updated_at >= '2025-12-22 00:00:00' 
  AND updated_at <= '2025-12-22 23:59:59';

-- Test 2: Count leads CREATED yesterday (Dec 22, 2025) 
SELECT COUNT(*) as leads_created_yesterday
FROM leads
WHERE created_at >= '2025-12-22 00:00:00' 
  AND created_at <= '2025-12-22 23:59:59';

-- Test 3: Show 10 random leads - compare created_at vs updated_at
SELECT 
    id,
    "fullName",
    status,
    created_at,
    updated_at,
    CASE 
        WHEN updated_at = created_at THEN '❌ NEVER MODIFIED (dates are same)'
        WHEN updated_at > created_at THEN '✅ WAS MODIFIED (updated_at is newer)'
        ELSE '⚠️ DATA ERROR'
    END as status_check
FROM leads
LIMIT 10;

-- Test 4: Check if trigger exists
SELECT COUNT(*) as trigger_count
FROM information_schema.triggers
WHERE event_object_table = 'leads'
  AND trigger_name LIKE '%update%updated_at%';

-- EXPECTED RESULTS:
-- If Test 1 shows 0 but Test 2 shows some number
-- → updated_at is NOT working, it's stuck at created_at
-- → You need to run COMPLETE-FIX-updated-at-trigger.sql
--
-- If Test 3 shows all "NEVER MODIFIED"
-- → Confirms updated_at column is frozen
-- → Run the trigger migration
--
-- If Test 4 shows 0
-- → No trigger exists
-- → Run the trigger migration
