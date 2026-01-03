// 🔐 ADMIN USER RESTRICTIONS COMPONENT - React Component Example
import React, { useState, useEffect } from 'react';
import { getApiClient } from '../lib/backend';
import { useAuth } from '../hooks/useAuth';

const AdminUserRestrictions = () => {
  const { user } = useAuth();
  const [restrictions, setRestrictions] = useState([]);
  const [superAdmins, setSuperAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  
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
      const apiClient = getApiClient();
      
      // Load current restrictions
      const restrictionsData = await apiClient.getUserRestrictions();
      setRestrictions(restrictionsData.data || []);
      
      // Load super admin users
      const usersData = await apiClient.getUsers();
      const superAdminUsers = usersData.data?.filter(u => u.role === 'super_admin') || [];
      setSuperAdmins(superAdminUsers);
      
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createRestriction = async (restrictionData) => {
    try {
      const apiClient = getApiClient();
      await apiClient.createUserRestriction(restrictionData);
      loadData(); // Reload data
      setShowAddModal(false);
    } catch (error) {
      console.error('Error creating restriction:', error);
      alert('Failed to create restriction');
    }
  };

  const removeRestriction = async (restrictionId) => {
    try {
      const apiClient = getApiClient();
      await apiClient.deleteUserRestriction(restrictionId);
      loadData(); // Reload data
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
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              createRestriction({
                restricted_user_id: formData.get('user_id'),
                restriction_type: formData.get('restriction_type'),
                notes: formData.get('notes')
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