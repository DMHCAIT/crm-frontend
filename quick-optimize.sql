-- ============================================
-- QUICK DATABASE OPTIMIZATION (No VACUUM)
-- Run this ONCE in Supabase SQL Editor
-- ============================================

-- Step 1: Add indexes for faster querying
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_updated_at ON leads(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_reports_to ON users(reports_to);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Step 2: Add composite indexes for query optimization
CREATE INDEX IF NOT EXISTS idx_leads_assigned_status ON leads(assigned_to, status);
CREATE INDEX IF NOT EXISTS idx_leads_updated_assigned ON leads(updated_at DESC, assigned_to);

-- Step 3: Update table statistics
ANALYZE leads;
ANALYZE users;

-- Success! Indexes created and statistics updated.
-- Your queries should now be much faster.
