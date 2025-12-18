-- ============================================
-- CRM System - New Features Database Migration
-- Version: 2.2.0
-- Date: January 2025
-- ============================================

-- ============================================
-- 1. SCHEDULED EXPORTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS scheduled_exports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  export_type VARCHAR(50) NOT NULL CHECK (export_type IN ('leads', 'students', 'analytics', 'full')),
  format VARCHAR(10) NOT NULL CHECK (format IN ('csv', 'pdf', 'xlsx')),
  frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  schedule_time VARCHAR(10) NOT NULL, -- Format: 'HH:MM'
  email VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'error')),
  filters JSONB, -- Store filter criteria as JSON
  last_run TIMESTAMP,
  next_run TIMESTAMP NOT NULL,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for scheduled_exports
CREATE INDEX idx_scheduled_exports_user ON scheduled_exports(user_id);
CREATE INDEX idx_scheduled_exports_status ON scheduled_exports(status);
CREATE INDEX idx_scheduled_exports_next_run ON scheduled_exports(next_run);
CREATE INDEX idx_scheduled_exports_created_at ON scheduled_exports(created_at DESC);

-- Trigger to update updated_at timestamp
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

-- Comments
COMMENT ON TABLE scheduled_exports IS 'Stores scheduled export configurations for automated data exports';
COMMENT ON COLUMN scheduled_exports.export_type IS 'Type of data to export: leads, students, analytics, or full';
COMMENT ON COLUMN scheduled_exports.format IS 'Export file format: csv, pdf, or xlsx';
COMMENT ON COLUMN scheduled_exports.frequency IS 'Export frequency: daily, weekly, or monthly';
COMMENT ON COLUMN scheduled_exports.schedule_time IS 'Time of day to run export in HH:MM format';
COMMENT ON COLUMN scheduled_exports.filters IS 'JSON object containing filter criteria for the export';

-- ============================================
-- 2. DOCUMENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type VARCHAR(20) NOT NULL CHECK (entity_type IN ('lead', 'student')),
  entity_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL, -- Original filename
  file_name VARCHAR(255) NOT NULL, -- Stored filename with timestamp
  file_path TEXT NOT NULL, -- Path in Supabase Storage
  file_size BIGINT NOT NULL, -- File size in bytes
  file_type VARCHAR(100) NOT NULL, -- MIME type
  url TEXT NOT NULL, -- Public URL from Supabase Storage
  uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  uploaded_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP, -- Soft delete
  metadata JSONB, -- Additional file metadata
  CONSTRAINT check_file_size CHECK (file_size > 0 AND file_size <= 10485760) -- Max 10MB
);

-- Indexes for documents
CREATE INDEX idx_documents_entity ON documents(entity_type, entity_id);
CREATE INDEX idx_documents_uploader ON documents(uploaded_by);
CREATE INDEX idx_documents_uploaded_at ON documents(uploaded_at DESC);
CREATE INDEX idx_documents_deleted_at ON documents(deleted_at) WHERE deleted_at IS NULL;

-- Add foreign key constraints for entity_id (optional, depends on your schema)
-- Uncomment these if you want to enforce referential integrity
-- ALTER TABLE documents ADD CONSTRAINT fk_documents_lead 
--   FOREIGN KEY (entity_id) REFERENCES leads(id) ON DELETE CASCADE 
--   WHERE entity_type = 'lead';
-- ALTER TABLE documents ADD CONSTRAINT fk_documents_student 
--   FOREIGN KEY (entity_id) REFERENCES students(id) ON DELETE CASCADE 
--   WHERE entity_type = 'student';

-- Comments
COMMENT ON TABLE documents IS 'Stores document metadata for files uploaded to Supabase Storage';
COMMENT ON COLUMN documents.entity_type IS 'Type of entity this document is associated with';
COMMENT ON COLUMN documents.entity_id IS 'ID of the associated entity (lead or student)';
COMMENT ON COLUMN documents.name IS 'Original filename as uploaded by user';
COMMENT ON COLUMN documents.file_name IS 'Unique filename stored in Supabase Storage';
COMMENT ON COLUMN documents.file_path IS 'Full path in Supabase Storage bucket';
COMMENT ON COLUMN documents.url IS 'Public URL to access the document';
COMMENT ON COLUMN documents.deleted_at IS 'Soft delete timestamp - NULL means not deleted';

-- ============================================
-- 3. EXPORT HISTORY TABLE (Optional)
-- ============================================

CREATE TABLE IF NOT EXISTS export_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  schedule_id UUID REFERENCES scheduled_exports(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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

-- Indexes for export_history
CREATE INDEX idx_export_history_schedule ON export_history(schedule_id);
CREATE INDEX idx_export_history_user ON export_history(user_id);
CREATE INDEX idx_export_history_started_at ON export_history(started_at DESC);
CREATE INDEX idx_export_history_status ON export_history(status);

-- Comments
COMMENT ON TABLE export_history IS 'Tracks history of all export executions (scheduled and manual)';
COMMENT ON COLUMN export_history.schedule_id IS 'Reference to scheduled_exports table if this was a scheduled export';
COMMENT ON COLUMN export_history.records_count IS 'Number of records included in the export';

-- ============================================
-- 4. SUPABASE STORAGE BUCKET SETUP
-- ============================================

-- Note: These commands should be run in Supabase Storage panel or via Supabase CLI
-- Creating storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'crm-documents',
  'crm-documents',
  true, -- Public access for authenticated users
  10485760, -- 10MB limit
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
-- 5. STORAGE POLICIES (Run in Supabase Dashboard)
-- ============================================

-- Note: Storage policies should be created in Supabase Dashboard > Storage > Policies
-- Or run these separately after bucket creation

-- Policy: Public read access to documents
-- CREATE POLICY "Public read access to CRM documents"
-- ON storage.objects FOR SELECT
-- USING (bucket_id = 'crm-documents');

-- Policy: Authenticated users can upload documents
-- CREATE POLICY "Authenticated users can upload CRM documents"
-- ON storage.objects FOR INSERT
-- WITH CHECK (bucket_id = 'crm-documents');

-- Policy: Authenticated users can delete documents
-- CREATE POLICY "Authenticated users can delete CRM documents"
-- ON storage.objects FOR DELETE
-- USING (bucket_id = 'crm-documents');

-- ============================================
-- 6. ANALYTICS VIEWS (Optional Performance Optimization)
-- ============================================

-- NOTE: Materialized view creation is commented out as it depends on your existing schema
-- Uncomment and adjust the following if you want to create an analytics view:

/*
CREATE MATERIALIZED VIEW IF NOT EXISTS analytics_summary AS
SELECT
  DATE_TRUNC('day', created_at) AS date,
  COUNT(*) AS total_leads,
  COUNT(CASE WHEN status = 'converted' THEN 1 END) AS converted_leads,
  COUNT(CASE WHEN status = 'qualified' THEN 1 END) AS qualified_leads,
  COUNT(CASE WHEN status = 'contacted' THEN 1 END) AS contacted_leads,
  source,
  assigned_to
FROM leads
WHERE created_at >= NOW() - INTERVAL '1 year'
GROUP BY DATE_TRUNC('day', created_at), source, assigned_to;

CREATE INDEX idx_analytics_summary_date ON analytics_summary(date DESC);
CREATE INDEX idx_analytics_summary_assigned ON analytics_summary(assigned_to);
*/

-- ============================================
-- 7. SAMPLE DATA (Optional - for testing)
-- ============================================

-- Sample scheduled export
-- INSERT INTO scheduled_exports (user_id, name, export_type, format, frequency, schedule_time, email, next_run)
-- VALUES (
--   (SELECT id FROM users WHERE role = 'super_admin' LIMIT 1),
--   'Weekly Leads Report',
--   'leads',
--   'csv',
--   'weekly',
--   '09:00',
--   'admin@example.com',
--   NOW() + INTERVAL '7 days'
-- );

-- ============================================
-- 8. PERMISSIONS & SECURITY
-- ============================================

-- Row Level Security (RLS) Policies

-- Enable RLS on tables
ALTER TABLE scheduled_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE export_history ENABLE ROW LEVEL SECURITY;

-- Scheduled Exports RLS: Users can only see their own schedules
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

-- Documents RLS: Users can see documents for entities they have access to
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

-- Export History RLS
CREATE POLICY "Users can view their own export history"
ON export_history FOR SELECT
USING (user_id = auth.uid());

-- ============================================
-- 9. UTILITY FUNCTIONS
-- ============================================

-- Function to clean up old export history (run monthly)
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
-- 10. VERIFICATION QUERIES (Run manually after migration)
-- ============================================

-- Note: Run these queries manually after the migration completes

-- Verify tables:
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_name IN ('scheduled_exports', 'documents', 'export_history');

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

-- Log migration completion
DO $$
BEGIN
  RAISE NOTICE '✅ CRM Database Migration v2.2.0 Complete';
  RAISE NOTICE 'Tables created: scheduled_exports, documents, export_history';
  RAISE NOTICE 'Storage bucket: crm-documents';
  RAISE NOTICE 'Policies and indexes applied successfully';
END $$;
