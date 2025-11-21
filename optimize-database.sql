-- ============================================
-- DATABASE OPTIMIZATION FOR LEADS QUERY
-- Run this in your Supabase SQL Editor
-- ============================================

-- 1. Add indexes for faster querying
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_updated_at ON leads(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_reports_to ON users(reports_to);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- 2. Add composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_leads_assigned_status ON leads(assigned_to, status);
CREATE INDEX IF NOT EXISTS idx_leads_updated_assigned ON leads(updated_at DESC, assigned_to);

-- 3. Analyze the tables to update statistics (VACUUM requires special handling)
ANALYZE leads;
ANALYZE users;

-- NOTE: VACUUM must be run separately outside a transaction block
-- Run these commands ONE AT A TIME in Supabase SQL Editor if needed:
-- VACUUM leads;
-- VACUUM users;

-- 4. Check current table statistics
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation
FROM pg_stats
WHERE tablename IN ('leads', 'users')
ORDER BY tablename, attname;

-- 5. Check if indexes are being used
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- 6. Increase statement timeout for complex queries (optional)
ALTER DATABASE postgres SET statement_timeout = '30s';

-- 7. Check current statement timeout
SHOW statement_timeout;
