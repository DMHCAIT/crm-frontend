-- ============================================
-- CRM System - Database Migration v2.2.0
-- STEP 1: Create Tables Only
-- Run this first, then run STEP2
-- ============================================

-- ============================================
-- 1. SCHEDULED EXPORTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS scheduled_exports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  export_type VARCHAR(50) NOT NULL CHECK (export_type IN ('leads', 'students', 'analytics', 'full')),
  format VARCHAR(10) NOT NULL CHECK (format IN ('csv', 'pdf', 'xlsx')),
  frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  schedule_time VARCHAR(10) NOT NULL,
  email VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'error')),
  filters JSONB,
  last_run TIMESTAMP,
  next_run TIMESTAMP NOT NULL,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 2. DOCUMENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type VARCHAR(20) NOT NULL CHECK (entity_type IN ('lead', 'student')),
  entity_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type VARCHAR(100) NOT NULL,
  url TEXT NOT NULL,
  uploaded_by UUID NOT NULL,
  uploaded_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP,
  metadata JSONB,
  CONSTRAINT check_file_size CHECK (file_size > 0 AND file_size <= 10485760)
);

-- ============================================
-- 3. EXPORT HISTORY TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS export_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  schedule_id UUID,
  user_id UUID NOT NULL,
  export_type VARCHAR(50) NOT NULL,
  format VARCHAR(10) NOT NULL,
  status VARCHAR(20) DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  file_url TEXT,
  file_size BIGINT,
  records_count INTEGER,
  error_message TEXT,
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  email_sent BOOLEAN DEFAULT FALSE,
  email_sent_at TIMESTAMP
);

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ STEP 1 Complete - Tables Created Successfully';
  RAISE NOTICE 'Next: Run database-migration-v2.2.0-STEP2-indexes.sql';
END $$;
