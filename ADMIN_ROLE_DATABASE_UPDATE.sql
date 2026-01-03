-- =====================================================
-- ADMIN ROLE DATABASE IMPLEMENTATION
-- Add admin role and user restrictions to existing CRM database
-- =====================================================

-- 1. UPDATE users table role constraint to include 'admin'
-- Current constraint only allows: super_admin, senior_manager, manager, team_leader, counselor
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check 
CHECK (role::text = ANY (ARRAY[
    'admin'::character varying,           -- NEW: Highest level admin
    'super_admin'::character varying,     -- Existing
    'senior_manager'::character varying,  -- Existing
    'manager'::character varying,         -- Existing
    'team_leader'::character varying,     -- Existing
    'counselor'::character varying        -- Existing
]::text[]));

-- 2. CREATE user_restrictions table (MISSING from current schema)
CREATE TABLE public.user_restrictions (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    admin_id uuid NOT NULL,                    -- Admin who creates the restriction
    restricted_user_id uuid NOT NULL,          -- Super admin who gets restricted
    restricted_by uuid NOT NULL,               -- Who applied the restriction
    restriction_type character varying DEFAULT 'user_access'::character varying 
        CHECK (restriction_type::text = ANY (ARRAY[
            'user_access'::character varying,   -- Hide users from super admin
            'branch_access'::character varying, -- Restrict branch access
            'lead_access'::character varying    -- Restrict lead visibility
        ]::text[])),
    restriction_scope jsonb DEFAULT '{}'::jsonb,  -- Specific restrictions data
    notes text,                                   -- Admin notes about restriction
    is_active boolean DEFAULT true,               -- Enable/disable restriction
    
    -- Constraints
    CONSTRAINT user_restrictions_pkey PRIMARY KEY (id),
    CONSTRAINT user_restrictions_admin_id_fkey 
        FOREIGN KEY (admin_id) REFERENCES public.users(id) ON DELETE CASCADE,
    CONSTRAINT user_restrictions_restricted_user_id_fkey 
        FOREIGN KEY (restricted_user_id) REFERENCES public.users(id) ON DELETE CASCADE,
    CONSTRAINT user_restrictions_restricted_by_fkey 
        FOREIGN KEY (restricted_by) REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Unique constraint to prevent duplicate restrictions
    CONSTRAINT user_restrictions_unique_restriction 
        UNIQUE(admin_id, restricted_user_id, restriction_type)
);

-- 3. CREATE indexes for performance
CREATE INDEX idx_user_restrictions_admin_id ON user_restrictions(admin_id);
CREATE INDEX idx_user_restrictions_restricted_user_id ON user_restrictions(restricted_user_id);
CREATE INDEX idx_user_restrictions_active ON user_restrictions(is_active);
CREATE INDEX idx_user_restrictions_type ON user_restrictions(restriction_type);

-- 4. ADD Row Level Security (RLS)
ALTER TABLE user_restrictions ENABLE ROW LEVEL SECURITY;

-- 5. CREATE RLS policies
-- Policy: Admins can manage their own restrictions
CREATE POLICY "admin_manage_restrictions" ON user_restrictions
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM users 
            WHERE role = 'admin' 
            AND id = admin_id
        )
    );

-- Policy: Super admins can view restrictions applied to them (read-only)
CREATE POLICY "super_admin_view_own_restrictions" ON user_restrictions
    FOR SELECT USING (
        auth.uid() = restricted_user_id
        AND EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'super_admin'
        )
    );

-- 6. UPDATE Rubeena's account to admin role
UPDATE users 
SET 
    role = 'admin',
    password_hash = crypt('Rubeena123', gen_salt('bf')),
    updated_at = CURRENT_TIMESTAMP
WHERE username = 'Rubeena' 
  AND email = 'rubykhan0003@gmail.com';

-- 7. CREATE trigger for updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_restrictions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_restrictions_updated_at
    BEFORE UPDATE ON user_restrictions
    FOR EACH ROW
    EXECUTE FUNCTION update_user_restrictions_updated_at();

-- 8. INSERT sample admin configuration (optional)
INSERT INTO system_settings (setting_key, setting_value, category, description)
VALUES 
    ('admin_restrictions_enabled', 'true', 'admin', 'Enable admin user restriction functionality'),
    ('max_restrictions_per_admin', '50', 'admin', 'Maximum restrictions one admin can create')
ON CONFLICT (setting_key) DO NOTHING;

-- 9. VERIFICATION QUERIES
-- Check if admin role was added successfully
SELECT 
    'Role constraint updated' as status,
    string_agg(unnest_val::text, ', ') as allowed_roles
FROM (
    SELECT unnest(
        string_to_array(
            substring(
                pg_get_constraintdef(oid) 
                FROM 'ANY \(ARRAY\[(.*?)\]'
            ), 
            ', '
        )
    ) as unnest_val
    FROM pg_constraint 
    WHERE conname = 'users_role_check'
) t;

-- Check Rubeena's account update
SELECT 
    'Rubeena account updated' as status,
    username,
    role,
    "fullName",
    email,
    CASE 
        WHEN password_hash IS NOT NULL THEN 'Password set'
        ELSE 'No password'
    END as password_status
FROM users 
WHERE username = 'Rubeena';

-- Check if user_restrictions table was created
SELECT 
    'user_restrictions table created' as status,
    count(*) as restriction_count
FROM user_restrictions;

-- Final verification
SELECT 
    '✅ Admin implementation completed successfully!' as result,
    CURRENT_TIMESTAMP as completed_at;