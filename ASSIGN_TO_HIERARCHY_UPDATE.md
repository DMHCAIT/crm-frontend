# Assign To Hierarchy Update

## Summary
Updated all user assignment and transfer dropdowns to use hierarchical user filtering (`assignableUsers`) instead of the complete user list (`users`). This ensures that users can only assign/transfer leads to users within their organizational hierarchy.

## Changes Made

### 1. Add Lead Form - "Assign To" Dropdown ✅
- **Location**: Add Lead Modal
- **Status**: Already using `assignableUsers` (correct)
- **Update**: Standardized to use `username` field consistently
- **Result**: Shows only users below current user in hierarchy

### 2. Transfer Modal - "Transfer to Counselor" ✅
- **Location**: Individual lead transfer modal
- **Status**: Was using `users` (incorrect)
- **Update**: Changed to use `assignableUsers` with proper hierarchy filtering
- **Result**: Shows only accessible users for transfer

### 3. Bulk Transfer - "Transfer to Counselor" ✅
- **Location**: Bulk lead transfer modal
- **Status**: Was using `users` (incorrect) 
- **Update**: Changed to use `assignableUsers` with proper hierarchy filtering
- **Result**: Shows only accessible users for bulk transfer

### 4. Edit Lead Form - "Assigned to" ✅
- **Location**: Lead detail modal edit mode
- **Status**: Already using `assignableUsers` (correct)
- **Update**: Standardized to use `username` field consistently
- **Result**: Shows only users below current user in hierarchy

### 5. Team Member Modal - Transfer Dropdown ✅
- **Location**: Team workload distribution modal
- **Status**: Already using `assignableUsers` (correct)
- **Update**: No changes needed
- **Result**: Shows only accessible users for team member lead transfers

## Technical Details

### Data Source
All dropdowns now use the `assignableUsers` array which is populated by:
```javascript
const assignableUsersResponse = await apiClient.getAssignableUsers();
```

### User Object Structure
```javascript
{
  id: user.id,
  name: user.name || user.username,
  username: user.username,        // ← Primary identifier for assignments
  email: user.email,
  role: user.role || 'User',
  display_name: user.display_name || `${user.name || user.username} (${user.role})`
}
```

### Value Consistency
All dropdowns now use: `user.username || user.name || user.email` as the option value to ensure consistency with backend lead assignment logic.

## Backend Integration
The `getAssignableUsers()` API already handles:
- ✅ User hierarchy filtering based on `reports_to` relationships
- ✅ Role-based access control
- ✅ Recursive subordinate detection
- ✅ Proper JWT token validation

## User Experience
- **Managers**: See all their subordinates and subordinates' subordinates
- **Team Leaders**: See only their direct reports
- **Regular Users**: See only themselves for assignment
- **Consistent UI**: All assignment/transfer interfaces now show the same filtered user list

## Testing
1. Login as different user roles
2. Check "Add Lead" → "Assign To" dropdown
3. Check individual lead transfer options
4. Check bulk transfer options
5. Check edit lead assignment options
6. Verify Team Workload Distribution transfer options

All should show only users accessible within the organizational hierarchy.