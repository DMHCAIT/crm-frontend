-- COMPREHENSIVE DIAGNOSTIC FOR UPDATED LEADS FILTER
-- Run this in Supabase SQL Editor to diagnose the exact issue

-- Step 1: Check if updated_at column exists
SELECT 
    column_name, 
    data_type,
    is_nullable
FROM 
    information_schema.columns
WHERE 
    table_name = 'leads'
    AND column_name = 'updated_at';

-- Step 2: Check sample data comparing created_at vs updated_at
SELECT 
    id,
    fullName,
    status,
    TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') as created_date,
    TO_CHAR(updated_at, 'YYYY-MM-DD HH24:MI:SS') as updated_date,
    CASE 
        WHEN updated_at = created_at THEN '❌ NEVER UPDATED (same as created)'
        WHEN updated_at IS NULL THEN '❌ NULL'
        WHEN updated_at > created_at THEN '✅ Has been updated'
        ELSE '⚠️ Updated before created (data issue)'
    END as update_status
FROM 
    leads
ORDER BY 
    created_at DESC
LIMIT 20;

-- Step 3: Count leads by update status
SELECT 
    CASE 
        WHEN updated_at IS NULL THEN '❌ NULL updated_at'
        WHEN updated_at = created_at THEN '❌ Never Updated (updated_at = created_at)'
        WHEN updated_at > created_at THEN '✅ Has Been Updated'
        WHEN updated_at < created_at THEN '⚠️ Data Issue (updated < created)'
    END as category,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM 
    leads
GROUP BY 
    category
ORDER BY 
    count DESC;

-- Step 4: Check your specific date range (December 4-10, 2025)
-- This is exactly what your filter is trying to do
SELECT 
    COUNT(*) as total_in_range,
    MIN(updated_at) as earliest_update,
    MAX(updated_at) as latest_update
FROM 
    leads
WHERE 
    updated_at >= '2025-12-04 00:00:00' 
    AND updated_at <= '2025-12-10 23:59:59';

-- Step 5: Check created_at for same date range (to see difference)
SELECT 
    'CREATED in this range:' as filter_type,
    COUNT(*) as total
FROM 
    leads
WHERE 
    created_at >= '2025-12-04 00:00:00' 
    AND created_at <= '2025-12-10 23:59:59'
UNION ALL
SELECT 
    'UPDATED in this range:' as filter_type,
    COUNT(*) as total
FROM 
    leads
WHERE 
    updated_at >= '2025-12-04 00:00:00' 
    AND updated_at <= '2025-12-10 23:59:59';

-- Step 6: Show actual leads in your date range with details
SELECT 
    id,
    fullName,
    email,
    status,
    TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI') as created,
    TO_CHAR(updated_at, 'YYYY-MM-DD HH24:MI') as last_updated,
    CASE 
        WHEN updated_at = created_at THEN '❌ Never modified'
        WHEN updated_at > created_at THEN '✅ Was modified'
    END as modification_status
FROM 
    leads
WHERE 
    updated_at >= '2025-12-04 00:00:00' 
    AND updated_at <= '2025-12-10 23:59:59'
ORDER BY 
    updated_at DESC
LIMIT 50;

-- Step 7: Check if trigger exists
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM 
    information_schema.triggers
WHERE 
    event_object_table = 'leads'
    AND trigger_name LIKE '%update%';

-- INTERPRETATION:
-- If Step 3 shows most leads as "Never Updated (updated_at = created_at)"
-- → You need to run the trigger migration (COMPLETE-FIX-updated-at-trigger.sql)
--
-- If Step 4 shows "total_in_range: 0" 
-- → No leads were UPDATED in December 4-10, 2025
-- → Check Step 5 to see if leads were CREATED in that range instead
--
-- If Step 7 shows no trigger
-- → The updated_at column will never update automatically
-- → You MUST run the migration SQL file
