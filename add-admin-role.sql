-- =====================================================
-- ADD ADMIN ROLE AND USER RESTRICTIONS
-- Run this in Supabase SQL Editor to add admin role support
-- =====================================================

-- 1. Update users table to allow 'admin' role
DO $$
BEGIN
    -- Drop existing role check constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'users' 
        AND constraint_name = 'users_role_check'
    ) THEN
        ALTER TABLE users DROP CONSTRAINT users_role_check;
        RAISE NOTICE 'Dropped existing users_role_check constraint';
    END IF;
    
    -- Add new role check constraint including admin
    ALTER TABLE users ADD CONSTRAINT users_role_check 
    CHECK (role IN (
        'admin',
        'super_admin', 
        'senior_manager',
        'manager', 
        'team_leader', 
        'counselor',
        'junior_counselor',
        'trainee',
        'user'
    ));
    
    RAISE NOTICE 'Added new users_role_check constraint with admin role';
END $$;

-- 2. Create user_restrictions table for admin control
CREATE TABLE IF NOT EXISTS user_restrictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL,
    restricted_user_id UUID NOT NULL,
    restricted_by UUID NOT NULL,
    restriction_type VARCHAR(50) DEFAULT 'user_access' CHECK (restriction_type IN ('user_access', 'branch_access', 'lead_access')),
    restriction_scope JSONB DEFAULT '{}',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    
    -- Foreign key constraints
    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (restricted_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (restricted_by) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Unique constraint to prevent duplicate restrictions
    UNIQUE(admin_id, restricted_user_id, restriction_type)
);

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_restrictions_admin_id ON user_restrictions(admin_id);
CREATE INDEX IF NOT EXISTS idx_user_restrictions_restricted_user_id ON user_restrictions(restricted_user_id);
CREATE INDEX IF NOT EXISTS idx_user_restrictions_active ON user_restrictions(is_active);

-- 4. Add Row Level Security
ALTER TABLE user_restrictions ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for user_restrictions
CREATE POLICY "Admin can manage their restrictions" ON user_restrictions
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM users 
            WHERE role = 'admin' 
            AND id = admin_id
        )
    );

CREATE POLICY "Super admin can view restrictions applied to them" ON user_restrictions
    FOR SELECT USING (
        auth.uid() = restricted_user_id
        AND EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'super_admin'
        )
    );

-- 6. Update Rubeena's account to admin role with new password
DO $$
DECLARE
    rubeena_id UUID;
BEGIN
    -- Find Rubeena's user ID
    SELECT id INTO rubeena_id 
    FROM users 
    WHERE username = 'Rubeena' 
    AND email = 'rubykhan0003@gmail.com';
    
    IF rubeena_id IS NOT NULL THEN
        -- Update role and password
        UPDATE users 
        SET 
            role = 'admin',
            password_hash = crypt('Rubeena123', gen_salt('bf')),
            updated_at = NOW()
        WHERE id = rubeena_id;
        
        RAISE NOTICE 'Updated Rubeena account to admin role with new password';
    ELSE
        RAISE NOTICE 'Rubeena account not found';
    END IF;
END $$;

-- 7. Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_restrictions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_restrictions_updated_at
    BEFORE UPDATE ON user_restrictions
    FOR EACH ROW
    EXECUTE FUNCTION update_user_restrictions_updated_at();

-- 8. Verify the changes
SELECT 
    'Role update completed' as status,
    username,
    role,
    fullName,
    email
FROM users 
WHERE username = 'Rubeena';

RAISE NOTICE 'Admin role and user restrictions system setup completed successfully!';