-- TEST THE TRIGGER MANUALLY
-- This will update a lead and you should see it appear in "Updated Today" filter

-- Step 1: Find a lead to test with
SELECT 
    id,
    "fullName",
    email,
    status,
    TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') as created,
    TO_CHAR(updated_at, 'YYYY-MM-DD HH24:MI:SS') as current_updated_at
FROM leads
LIMIT 1;

-- Step 2: Copy the ID from above, then update that lead
-- Replace 'PASTE_ID_HERE' with the actual ID from Step 1
UPDATE leads 
SET status = status  -- This triggers the update without changing anything
WHERE id = 'PASTE_ID_HERE'
RETURNING 
    id,
    "fullName",
    TO_CHAR(updated_at, 'YYYY-MM-DD HH24:MI:SS') as new_updated_at,
    TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI:SS') as current_time;

-- Step 3: Verify the lead now has today's timestamp
SELECT 
    id,
    "fullName",
    status,
    TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') as created,
    TO_CHAR(updated_at, 'YYYY-MM-DD HH24:MI:SS') as updated_timestamp,
    CASE 
        WHEN DATE(updated_at) = CURRENT_DATE THEN '✅ Updated TODAY!'
        WHEN updated_at = created_at THEN '⚠️ Never modified'
        ELSE '📅 Updated on another day'
    END as check_result
FROM leads
WHERE id = 'PASTE_ID_HERE';

-- Step 4: Check "Updated Today" count
-- This should be greater than 0 now
SELECT COUNT(*) as updated_today_count
FROM leads
WHERE DATE(updated_at) = CURRENT_DATE;

-- IMPORTANT:
-- After running this, go to your CRM and:
-- 1. Refresh the page (Cmd+R or F5)
-- 2. Click "Updated Today" filter
-- 3. You should see the lead you just updated!
--
-- If you DON'T see it:
-- - Check browser console for errors
-- - Check backend logs for the query being executed
-- - Make sure backend was redeployed with latest code
