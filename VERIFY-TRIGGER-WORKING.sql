-- VERIFY TRIGGER IS WORKING
-- Run this to confirm the trigger is active

-- Test 1: Check trigger exists
SELECT 
    trigger_name,
    event_manipulation as event,
    action_timing as timing,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'leads'
  AND trigger_name = 'trigger_update_leads_updated_at';

-- Test 2: Check current data (should all have updated_at values now)
SELECT 
    COUNT(*) as total_leads,
    COUNT(updated_at) as with_updated_at,
    COUNT(*) - COUNT(updated_at) as null_updated_at
FROM leads;

-- Test 3: Sample leads to see actual values
SELECT 
    id,
    "fullName",
    status,
    TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') as created,
    TO_CHAR(updated_at, 'YYYY-MM-DD HH24:MI:SS') as updated,
    CASE 
        WHEN updated_at > created_at THEN '✅ Modified'
        WHEN updated_at = created_at THEN '⚠️ Never modified'
        ELSE '❌ Issue'
    END as status
FROM leads
ORDER BY updated_at DESC
LIMIT 20;

-- Test 4: Count leads updated today (Dec 23, 2025)
SELECT COUNT(*) as updated_today
FROM leads
WHERE updated_at >= '2025-12-23 00:00:00'
  AND updated_at <= '2025-12-23 23:59:59';

-- Test 5: Count leads updated yesterday (Dec 22, 2025)
SELECT COUNT(*) as updated_yesterday
FROM leads
WHERE updated_at >= '2025-12-22 00:00:00'
  AND updated_at <= '2025-12-22 23:59:59';

-- Test 6: MANUALLY UPDATE A LEAD TO TEST TRIGGER
-- This will test if the trigger is actually working
UPDATE leads 
SET status = status  -- Update with same value to trigger the update
WHERE id = (SELECT id FROM leads LIMIT 1)
RETURNING 
    id, 
    "fullName",
    TO_CHAR(updated_at, 'YYYY-MM-DD HH24:MI:SS') as new_updated_at;

-- After running Test 6, run Test 4 again - the count should increase by 1!
