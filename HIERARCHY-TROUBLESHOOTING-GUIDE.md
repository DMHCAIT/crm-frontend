# 🔧 HIERARCHY TROUBLESHOOTING GUIDE

## Issues Fixed in This Update

### ✅ 1. Multi-Select Assigned To Filter
- **FIXED**: Dropdown now supports multiple user selection
- **HOW TO USE**: Hold Ctrl/Cmd and click multiple users to select them
- **BENEFIT**: You can now filter leads by multiple team members at once

### ✅ 2. API Response Format
- **FIXED**: Backend now returns both `users` and `data` fields
- **FIXED**: Frontend now handles multiple response formats correctly

### ❓ 3. Empty User Lists - NEEDS TESTING

## Current Problems from Screenshots:

1. **"All Assigned (0 users)"** - assignableUsers array is empty
2. **"No team members found"** - Team Workload Distribution shows no users
3. **Team Leader can't see subordinates**

## Root Cause Analysis:

The issue is likely one of these:

### A) No `reports_to` relationships in database
```sql
-- Run this in Supabase SQL Editor to check:
SELECT 
    name, username, role, reports_to,
    (SELECT name FROM users u2 WHERE u2.id = u1.reports_to) as reports_to_name
FROM users u1 
WHERE role IN ('team_leader', 'counselor', 'manager') 
ORDER BY role, name;
```

### B) User not found in database
```sql
-- Check if your current user exists:
SELECT * FROM users WHERE username = 'your_username_here';
```

### C) All users have reports_to = NULL
```sql
-- Check reports_to setup:
SELECT 
    'Has reports_to' as status, COUNT(*) as count 
FROM users WHERE reports_to IS NOT NULL
UNION ALL
SELECT 
    'No reports_to' as status, COUNT(*) as count 
FROM users WHERE reports_to IS NULL;
```

## 🚀 QUICK FIX - Set Up Hierarchy

If you need to set up the hierarchy quickly, run these SQL commands in Supabase:

```sql
-- Example: Set up a basic hierarchy
-- 1. First, get user IDs
SELECT id, name, username, role FROM users ORDER BY role, name;

-- 2. Set up reports_to relationships (replace IDs with actual values)
-- Example structure:
-- Team Leader (Akshay) reports to Super Admin (Rubeena)
UPDATE users 
SET reports_to = (SELECT id FROM users WHERE username = 'rubeena' AND role = 'super_admin')
WHERE username = 'akshay' AND role = 'team_leader';

-- Counselors report to Team Leader
UPDATE users 
SET reports_to = (SELECT id FROM users WHERE username = 'akshay' AND role = 'team_leader')
WHERE role = 'counselor';
```

## 📋 TESTING CHECKLIST

After setting up hierarchy, test these:

### 1. Super Admin Login
- [ ] Can see ALL users in "Assigned To" dropdown
- [ ] Team Workload shows all team members
- [ ] Can assign leads to anyone

### 2. Team Leader Login  
- [ ] Can see themselves + subordinates in "Assigned To" 
- [ ] Team Workload shows "Including Subordinates (X)"
- [ ] Can see subordinate leads in Lead Management

### 3. Multi-Select Testing
- [ ] Can hold Ctrl/Cmd and select multiple users
- [ ] Filtering works with multiple selections
- [ ] "All Assigned (X users)" shows correct count

## 🐛 Debug Commands

If still not working, run these in Supabase:

```sql
-- Debug Query 1: Check your user setup
SELECT 
    u1.name as user_name,
    u1.username,
    u1.role,
    u1.email,
    u2.name as reports_to_name,
    u2.role as reports_to_role
FROM users u1
LEFT JOIN users u2 ON u1.reports_to = u2.id
WHERE u1.username = 'YOUR_USERNAME_HERE';

-- Debug Query 2: Check team structure
SELECT 
    supervisor.name as supervisor,
    supervisor.role as supervisor_role,
    COUNT(subordinate.id) as subordinate_count,
    STRING_AGG(subordinate.name, ', ') as subordinates
FROM users supervisor
LEFT JOIN users subordinate ON subordinate.reports_to = supervisor.id
WHERE supervisor.role IN ('super_admin', 'senior_manager', 'manager', 'team_leader')
GROUP BY supervisor.id, supervisor.name, supervisor.role
ORDER BY supervisor.role, supervisor.name;
```

## 🔧 Manual Hierarchy Setup

If you need to set up the hierarchy manually:

1. **Login to Supabase Dashboard**
2. **Go to Table Editor > users**
3. **For each team member, set the `reports_to` field:**
   - Counselors → Team Leader's ID
   - Team Leaders → Manager's ID  
   - Managers → Senior Manager's ID
   - Senior Managers → Super Admin's ID

## ⚡ Expected Behavior After Fix:

### Team Leader Dashboard:
- **Assigned To dropdown**: Shows "All Assigned (5 users)" instead of "(0 users)"
- **Team Workload**: Shows "Including Subordinates (3)" with team member cards
- **Lead Management**: Can see all subordinate leads

### Multi-Select Feature:
- **Hold Ctrl/Cmd**: Select multiple users from dropdown
- **Filter by multiple**: Shows leads assigned to any selected users
- **Clear selection**: Click away or select "All Assigned"

## 📞 Need Help?

If this doesn't work, please:
1. Run the debug SQL queries above
2. Share the results 
3. Check browser console for any API errors
4. Verify your current user role and username

---
**Updated**: October 2025
**Status**: Multi-select ✅ | Hierarchy Setup ❓ (needs testing)