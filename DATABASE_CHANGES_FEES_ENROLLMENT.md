# Database Changes Required for Fees and Course Enrollment Features

## Overview
This document outlines the database changes needed to support the new fees functionality and course enrollment integration.

## 1. Database Schema Changes

### 1.1 Update Leads Table
Add a new column to store fees information for enrolled students:

```sql
-- Add fees column to leads table
ALTER TABLE leads 
ADD COLUMN fees DECIMAL(10,2) NULL 
COMMENT 'Course fees amount when lead is enrolled';

-- Add index for better query performance
CREATE INDEX idx_leads_status_fees ON leads(status, fees);
```

### 1.2 Update Students Table (if exists)
If you have a separate students table, ensure it has these columns:

```sql
-- Ensure students table has required columns
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS fees DECIMAL(10,2) NULL,
ADD COLUMN IF NOT EXISTS enrollment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS fee_status ENUM('pending', 'partial', 'paid', 'overdue') DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS lead_id VARCHAR(255) NULL COMMENT 'Reference to original lead ID',
ADD COLUMN IF NOT EXISTS assigned_counselor VARCHAR(255) NULL;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_students_fee_status ON students(fee_status);
CREATE INDEX IF NOT EXISTS idx_students_lead_id ON students(lead_id);
CREATE INDEX IF NOT EXISTS idx_students_enrollment_date ON students(enrollment_date);
```

### 1.3 Create Course Enrollments View (Optional)
Create a view that combines leads and students for the Course Enrollments page:

```sql
CREATE OR REPLACE VIEW course_enrollments AS
SELECT 
    CONCAT('lead-', id) as enrollment_id,
    id as original_id,
    'lead' as source_type,
    name as student_name,
    email,
    phone,
    course,
    fees,
    status,
    updated_at as enrollment_date,
    assigned_to as assigned_counselor,
    country,
    branch,
    qualification,
    CASE 
        WHEN fees IS NOT NULL AND fees > 0 THEN 'paid'
        ELSE 'pending'
    END as fee_status
FROM leads 
WHERE status = 'Enrolled'

UNION ALL

SELECT 
    CONCAT('student-', id) as enrollment_id,
    id as original_id,
    'student' as source_type,
    name as student_name,
    email,
    phone,
    course,
    fees,
    status,
    enrollment_date,
    assigned_counselor,
    country,
    branch,
    qualification,
    fee_status
FROM students 
WHERE status IN ('active', 'enrolled');
```

## 2. Data Migration Scripts

### 2.1 Migrate Existing Enrolled Leads
```sql
-- Update existing enrolled leads with default fee status
UPDATE leads 
SET fees = 0 
WHERE status = 'Enrolled' AND fees IS NULL;
```

### 2.2 Create Trigger for Auto-Enrollment (Optional)
```sql
-- Trigger to automatically create student record when lead is enrolled
DELIMITER //
CREATE TRIGGER after_lead_enrolled 
AFTER UPDATE ON leads
FOR EACH ROW
BEGIN
    -- If status changed to 'Enrolled', create or update student record
    IF NEW.status = 'Enrolled' AND OLD.status != 'Enrolled' THEN
        INSERT INTO students (
            lead_id,
            name,
            email,
            phone,
            course,
            fees,
            enrollment_date,
            fee_status,
            assigned_counselor,
            country,
            branch,
            qualification,
            status
        ) VALUES (
            NEW.id,
            NEW.name,
            NEW.email,
            NEW.phone,
            NEW.course,
            NEW.fees,
            NOW(),
            CASE WHEN NEW.fees > 0 THEN 'paid' ELSE 'pending' END,
            NEW.assigned_to,
            NEW.country,
            NEW.branch,
            NEW.qualification,
            'active'
        )
        ON DUPLICATE KEY UPDATE
            fees = NEW.fees,
            fee_status = CASE WHEN NEW.fees > 0 THEN 'paid' ELSE 'pending' END,
            updated_at = NOW();
    END IF;
END//
DELIMITER ;
```

## 3. API Endpoints Updates

### 3.1 Update Leads API
The leads API should now handle the fees field:
- GET `/api/leads` - Returns leads with fees field
- PUT `/api/leads/:id` - Updates lead including fees field
- POST `/api/leads` - Creates lead with optional fees field

### 3.2 Update Students API  
The students API should integrate with enrolled leads:
- GET `/api/students` - Returns both students and enrolled leads
- The response combines data from both sources

## 4. Frontend Changes Made

### 4.1 Lead Management Component
- ✅ Added fees field to Lead interface
- ✅ Added conditional fees input when status is "Enrolled"
- ✅ Auto-save functionality for fees field
- ✅ Enhanced detail panel size for better UX

### 4.2 Course Enrollments Component
- ✅ Modified StudentsManagement.tsx to load enrolled leads
- ✅ Combined students and enrolled leads data
- ✅ Shows fees information in enrollment records

## 5. Verification Steps

After implementing the database changes:

1. **Test Fees Field:**
   ```sql
   -- Check if fees column exists
   DESCRIBE leads;
   
   -- Test inserting fees data
   UPDATE leads SET fees = 50000 WHERE id = 'test-lead-id' AND status = 'Enrolled';
   ```

2. **Test Course Enrollments View:**
   ```sql
   -- Check if view works correctly
   SELECT * FROM course_enrollments LIMIT 10;
   ```

3. **Verify Data Integration:**
   - Create a test lead
   - Change status to "Enrolled"
   - Add fees amount
   - Check if it appears in Course Enrollments page

## 6. Backup and Rollback

### Before Making Changes:
```sql
-- Backup leads table
CREATE TABLE leads_backup_$(date +%Y%m%d) AS SELECT * FROM leads;

-- Backup students table
CREATE TABLE students_backup_$(date +%Y%m%d) AS SELECT * FROM students;
```

### Rollback Script (if needed):
```sql
-- Remove fees column from leads
ALTER TABLE leads DROP COLUMN fees;

-- Drop indexes
DROP INDEX IF EXISTS idx_leads_status_fees ON leads;
DROP INDEX IF EXISTS idx_students_fee_status ON students;
DROP INDEX IF EXISTS idx_students_lead_id ON students;

-- Drop view
DROP VIEW IF EXISTS course_enrollments;

-- Drop trigger
DROP TRIGGER IF EXISTS after_lead_enrolled;
```

## 7. Testing Checklist

- [ ] Add fees column to leads table
- [ ] Test fees input field appears when status = "Enrolled"
- [ ] Test fees field saves correctly
- [ ] Test Course Enrollments page shows enrolled leads
- [ ] Test fees amount displays correctly in enrollments
- [ ] Test filtering and searching works with new data
- [ ] Test role-based access control still works
- [ ] Verify no existing functionality is broken

## 8. Performance Considerations

- Added indexes on frequently queried columns
- View combines data efficiently
- Limits applied to prevent large data loads
- Auto-save throttling to prevent excessive API calls

## Summary of Changes Required

1. **Database:** Add `fees` column to `leads` table
2. **Optional:** Add trigger for auto-student creation
3. **Optional:** Create combined view for easy querying
4. **Frontend:** Already implemented - fees field and enrollment integration
5. **Testing:** Verify all functionality works as expected

The main change needed is adding the `fees` column to your `leads` table in Supabase. The frontend code is already ready to handle this!