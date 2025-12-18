-- ============================================
-- CRM System - Database Migration v2.2.0
-- STEP 3: Security Policies (RLS)
-- Run this after STEP2
-- ============================================

-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE scheduled_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE export_history ENABLE ROW LEVEL SECURITY;

-- ============================================
-- SCHEDULED_EXPORTS POLICIES
-- ============================================

CREATE POLICY "Users can view their own scheduled exports"
ON scheduled_exports FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own scheduled exports"
ON scheduled_exports FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own scheduled exports"
ON scheduled_exports FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own scheduled exports"
ON scheduled_exports FOR DELETE
USING (user_id = auth.uid());

-- ============================================
-- DOCUMENTS POLICIES
-- ============================================

CREATE POLICY "Users can view documents for accessible entities"
ON documents FOR SELECT
USING (
  uploaded_by = auth.uid()
  OR
  (SELECT role FROM users WHERE id = auth.uid()) = 'super_admin'
);

CREATE POLICY "Users can upload documents"
ON documents FOR INSERT
WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "Users can delete their own documents"
ON documents FOR DELETE
USING (
  uploaded_by = auth.uid() 
  OR 
  (SELECT role FROM users WHERE id = auth.uid()) = 'super_admin'
);

-- ============================================
-- EXPORT_HISTORY POLICIES
-- ============================================

CREATE POLICY "Users can view their own export history"
ON export_history FOR SELECT
USING (user_id = auth.uid());

-- ============================================
-- UTILITY FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION cleanup_old_export_history()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM export_history
  WHERE started_at < NOW() - INTERVAL '90 days'
  AND status = 'completed';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ STEP 3 Complete - Security Policies Applied';
  RAISE NOTICE '✅ All Migration Steps Complete!';
  RAISE NOTICE 'Tables: scheduled_exports, documents, export_history';
  RAISE NOTICE 'Storage bucket: crm-documents';
  RAISE NOTICE 'Note: Create storage policies manually in Supabase Dashboard > Storage > crm-documents > Policies';
END $$;
