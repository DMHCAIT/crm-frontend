-- ============================================
-- CRM System - Database Migration v2.2.0
-- STEP 2: Create Indexes and Triggers
-- Run this after STEP1
-- ============================================

-- ============================================
-- INDEXES FOR SCHEDULED_EXPORTS
-- ============================================

CREATE INDEX IF NOT EXISTS idx_scheduled_exports_user ON scheduled_exports(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_exports_status ON scheduled_exports(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_exports_next_run ON scheduled_exports(next_run);
CREATE INDEX IF NOT EXISTS idx_scheduled_exports_created_at ON scheduled_exports(created_at DESC);

-- ============================================
-- INDEXES FOR DOCUMENTS
-- ============================================

CREATE INDEX IF NOT EXISTS idx_documents_entity ON documents(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_documents_uploader ON documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_at ON documents(uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_deleted_at ON documents(deleted_at);

-- ============================================
-- INDEXES FOR EXPORT_HISTORY
-- ============================================

CREATE INDEX IF NOT EXISTS idx_export_history_schedule ON export_history(schedule_id);
CREATE INDEX IF NOT EXISTS idx_export_history_user ON export_history(user_id);
CREATE INDEX IF NOT EXISTS idx_export_history_started_at ON export_history(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_export_history_status ON export_history(status);

-- ============================================
-- TRIGGER FOR SCHEDULED_EXPORTS
-- ============================================

CREATE OR REPLACE FUNCTION update_scheduled_exports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_scheduled_exports_updated_at
BEFORE UPDATE ON scheduled_exports
FOR EACH ROW
EXECUTE FUNCTION update_scheduled_exports_updated_at();

-- ============================================
-- STORAGE BUCKET SETUP
-- ============================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'crm-documents',
  'crm-documents',
  true,
  10485760,
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'image/gif',
    'text/plain'
  ]
) ON CONFLICT (id) DO NOTHING;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ STEP 2 Complete - Indexes, Triggers, and Storage Created';
  RAISE NOTICE 'Next: Run database-migration-v2.2.0-STEP3-security.sql';
END $$;
