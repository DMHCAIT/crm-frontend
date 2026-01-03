// 🔐 ADMIN USER RESTRICTIONS COMPONENT - React Component Example
import React, { useState, useEffect } from 'react';
import { getApiClient } from '../lib/backend';
import { useAuth } from '../hooks/useAuth';

// Type definitions
interface UserRestriction {
  id: string;
  restriction_type: string;
  notes?: string;
  created_at: string;
  users?: {
    fullName: string;
    username: string;
    role: string;
    department: string;
  };
}

interface SuperAdmin {
  id: string;
  fullName: string;
  username: string;
  department: string;
  role: string;
}

interface RestrictionData {
  restricted_user_id: string;
  restriction_type: string;
  notes: string;
}

const AdminUserRestrictions: React.FC = () => {
  const { user } = useAuth();
  const [restrictions, setRestrictions] = useState<UserRestriction[]>([]);
  const [superAdmins, setSuperAdmins] = useState<SuperAdmin[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  
  // Only show this component to admins
  if (user?.role !== 'admin') {
    return <div className="text-red-500">Access Denied - Admin Only</div>;
  }

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load current restrictions using fetch directly
      const token = localStorage.getItem('authToken');
      
      const restrictionsResponse = await fetch('/api/user-restrictions', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (restrictionsResponse.ok) {
        const restrictionsData = await restrictionsResponse.json();
        setRestrictions(restrictionsData.restrictions || []);
      }
      
      // Load super admin users
      const usersResponse = await fetch('/api/users-supabase', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        const superAdminUsers = usersData.users?.filter(u => u.role === 'super_admin') || [];
        setSuperAdmins(superAdminUsers);
      }
      
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createRestriction = async (restrictionData: RestrictionData) => {
    try {
      const token = localStorage.getItem('authToken');
      
      const response = await fetch('/api/user-restrictions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(restrictionData)
      });
      
      if (response.ok) {
        loadData(); // Reload data
        setShowAddModal(false);
      } else {
        throw new Error('Failed to create restriction');
      }
    } catch (error) {
      console.error('Error creating restriction:', error);
      alert('Failed to create restriction');
    }
  };

  const removeRestriction = async (restrictionId: string) => {
    try {
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(`/api/user-restrictions?id=${restrictionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        loadData(); // Reload data
      } else {
        throw new Error('Failed to remove restriction');
      }
    } catch (error) {
      console.error('Error removing restriction:', error);
      alert('Failed to remove restriction');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">🔐 Super Admin Restrictions</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Add Restriction
        </button>
      </div>

      {/* Current Restrictions */}
      <div className="space-y-4">
        {restrictions.length === 0 ? (
          <p className="text-gray-500 italic">No restrictions currently applied</p>
        ) : (
          restrictions.map(restriction => (
            <div key={restriction.id} className="border p-4 rounded-lg bg-red-50">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-red-800">
                    🚫 {restriction.users?.fullName || 'Unknown User'}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Username: {restriction.users?.username} | 
                    Role: {restriction.users?.role} |
                    Department: {restriction.users?.department}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Restriction Type: {restriction.restriction_type}
                  </p>
                  {restriction.notes && (
                    <p className="text-sm text-gray-600 mt-1">
                      Notes: {restriction.notes}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    Created: {new Date(restriction.created_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => removeRestriction(restriction.id)}
                  className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                >
                  Remove
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Restriction Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-lg font-semibold mb-4">Add User Restriction</h3>
            <form onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const formData = new FormData(form);
              createRestriction({
                restricted_user_id: formData.get('user_id') as string,
                restriction_type: formData.get('restriction_type') as string,
                notes: formData.get('notes') as string
              });
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Super Admin to Restrict
                  </label>
                  <select
                    name="user_id"
                    required
                    className="w-full border rounded-md px-3 py-2"
                  >
                    <option value="">Select Super Admin...</option>
                    {superAdmins.map(admin => (
                      <option key={admin.id} value={admin.id}>
                        {admin.fullName} ({admin.username}) - {admin.department}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Restriction Type
                  </label>
                  <select
                    name="restriction_type"
                    className="w-full border rounded-md px-3 py-2"
                  >
                    <option value="user_access">User Access</option>
                    <option value="branch_access">Branch Access</option>
                    <option value="lead_access">Lead Access</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    name="notes"
                    rows="3"
                    className="w-full border rounded-md px-3 py-2"
                    placeholder="Reason for restriction..."
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                  >
                    Add Restriction
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserRestrictions;