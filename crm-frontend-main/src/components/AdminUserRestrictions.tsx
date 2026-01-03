import React, { useState, useEffect } from 'react';
import { getApiClient } from '../lib/backend';

interface User {
  id: string;
  username: string;
  fullName?: string;
  role: string;
  department?: string;
}

interface Restriction {
  id: string;
  restricted_user_id: string;
  restriction_type: string;
  notes?: string;
  created_at: string;
  users?: User;
}

const AdminUserRestrictions: React.FC = () => {
  const [restrictions, setRestrictions] = useState<Restriction[]>([]);
  const [superAdmins, setSuperAdmins] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const apiClient = getApiClient();
      
      // Fetch restrictions and super admins in parallel
      const [restrictionsData, usersData] = await Promise.all([
        apiClient.getUserRestrictions(),
        apiClient.getUsers()
      ]);

      setRestrictions((restrictionsData as Restriction[]) || []);
      
      // Filter for super admins only
      const superAdminUsers = (usersData as User[]).filter((user: User) => user.role === 'super_admin');
      setSuperAdmins(superAdminUsers || []);
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const createRestriction = async (restrictionData: any) => {
    try {
      const apiClient = getApiClient();
      
      await apiClient.createUserRestriction(restrictionData);
      
      await loadData(); // Reload data
      setShowAddModal(false);
    } catch (error) {
      console.error('Error creating restriction:', error);
      setError('Failed to create restriction');
    }
  };

  const removeRestriction = async (restrictionId: string) => {
    try {
      const apiClient = getApiClient();
      
      await apiClient.deleteUserRestriction(restrictionId);
      
      await loadData(); // Reload data
    } catch (error) {
      console.error('Error removing restriction:', error);
      setError('Failed to remove restriction');
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading admin controls...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">🔐 Super Admin Restrictions</h2>
          <p className="text-gray-600 mt-1">Control what super administrators can see and access</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          disabled={superAdmins.length === 0}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          <span>🔒</span>
          <span>Add Restriction</span>
        </button>
      </div>

      {/* Error display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-red-700">
            <h3 className="font-semibold">Error</h3>
            <p className="mt-1">{error}</p>
            <button
              onClick={loadData}
              className="mt-2 text-sm bg-red-100 hover:bg-red-200 px-3 py-1 rounded"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Super Admins List */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Available Super Administrators</h3>
        {superAdmins.length === 0 ? (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800">No super administrators found in the system.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {superAdmins.map(admin => (
              <div key={admin.id} className="border p-4 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {admin.fullName?.charAt(0) || admin.username?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {admin.fullName || admin.username}
                    </h4>
                    <p className="text-sm text-gray-600">@{admin.username}</p>
                    <p className="text-xs text-blue-600">{admin.department || 'No Department'}</p>
                  </div>
                </div>
                <div className="mt-2 text-center">
                  <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                    Active • No Restrictions
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Current Restrictions */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Active Restrictions</h3>
        {restrictions.length === 0 ? (
          <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg text-center">
            <div className="text-gray-400 mb-2">
              <span className="text-4xl">🔓</span>
            </div>
            <p className="text-gray-600">No restrictions currently applied</p>
            <p className="text-sm text-gray-500 mt-1">All super administrators have full access</p>
          </div>
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
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Add New Restriction</h3>
            
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
                    Select Super Administrator
                  </label>
                  <select
                    name="user_id"
                    required
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Select a super administrator...</option>
                    {superAdmins.map(admin => (
                      <option key={admin.id} value={admin.id}>
                        {admin.fullName || admin.username} (@{admin.username})
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
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="view_only">View Only (No Edit/Delete)</option>
                    <option value="limited_access">Limited Access (Specific Sections)</option>
                    <option value="temporary_suspend">Temporary Suspend (No Access)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    name="notes"
                    placeholder="Reason for restriction..."
                    className="w-full p-2 border border-gray-300 rounded-md"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700"
                >
                  Apply Restriction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserRestrictions;