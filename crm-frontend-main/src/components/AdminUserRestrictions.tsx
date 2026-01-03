import React, { useState, useEffect } from 'react';
import { getApiClient } from '../lib/backend';

interface User {
  id: string;
  username: string;
  fullName?: string;
  role: string;
  department?: string;
  branch?: string;
}

const AdminUserRestrictions: React.FC = () => {
  const [superAdmins, setSuperAdmins] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [restrictions, setRestrictions] = useState<any[]>([]);

  // Load data on component mount
  useEffect(() => {
    console.log('🔧 AdminUserRestrictions: Component mounted, starting data load');
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('🔧 AdminUserRestrictions: Starting to load data...');
      
      const apiClient = getApiClient();
      console.log('🔧 AdminUserRestrictions: Got API client:', !!apiClient);
      
      // Fetch users
      console.log('🔧 AdminUserRestrictions: Fetching users...');
      const usersData = await apiClient.getUsers();

      console.log('🔧 AdminUserRestrictions: Received users data:', usersData);

      // Filter for super admins only - handle null/undefined data
      const usersArray = Array.isArray(usersData) ? usersData : [];
      const superAdminUsers = usersArray.filter((user: User) => user.role === 'super_admin');
      console.log('🔧 AdminUserRestrictions: Filtered super admins:', superAdminUsers);
      setSuperAdmins(superAdminUsers || []);
      
      // Fetch existing restrictions
      console.log('🔧 AdminUserRestrictions: Fetching restrictions...');
      try {
        const restrictionsData = await apiClient.getUserRestrictions();
        console.log('🔧 AdminUserRestrictions: Received restrictions data:', restrictionsData);
        setRestrictions(Array.isArray(restrictionsData) ? restrictionsData : []);
      } catch (err) {
        console.log('🔧 AdminUserRestrictions: No restrictions found or error fetching:', err);
        setRestrictions([]);
      }
      
      console.log('🔧 AdminUserRestrictions: Data loaded successfully');
    } catch (err) {
      console.error('🚨 AdminUserRestrictions: Error loading data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const createRestriction = async (restrictionData: any) => {
    try {
      console.log('🔧 AdminUserRestrictions: Creating restriction:', restrictionData);
      const apiClient = getApiClient();
      const response = await apiClient.createUserRestriction(restrictionData);
      console.log('🔧 AdminUserRestrictions: Restriction created successfully:', response);
      await loadData(); // Reload data
      setShowAddModal(false);
    } catch (error) {
      console.error('🚨 AdminUserRestrictions: Error creating restriction:', error);
      setError(error instanceof Error ? error.message : 'Failed to create restriction');
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
          <h2 className="text-2xl font-bold text-gray-900">👥 User Visibility Control</h2>
          <p className="text-gray-600 mt-1">Control which users super administrators can see and access</p>
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

      {/* Current User Access Rules */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🔒 User Access Rules</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Rubeena - All Access */}
          <div className="border rounded-lg p-4 bg-green-50 border-green-200">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                R
              </div>
              <div>
                <h4 className="font-bold text-green-800">Rubeena (Admin)</h4>
                <p className="text-sm text-green-600">Full System Administrator</p>
              </div>
            </div>
            <div className="bg-white p-3 rounded border">
              <h5 className="font-semibold text-gray-900 mb-2">✅ All Users Access</h5>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Can see all users in the system</li>
                <li>• Can manage all user accounts</li>
                <li>• Can see all leads and data</li>
                <li>• Can access all system features</li>
                <li>• No restrictions applied</li>
              </ul>
            </div>
          </div>

          {/* Other Super Admins - Configurable */}
          <div className="border rounded-lg p-4 bg-blue-50 border-blue-200">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                SA
              </div>
              <div>
                <h4 className="font-bold text-blue-800">Other Super Admins</h4>
                <p className="text-sm text-blue-600">Configurable Access</p>
              </div>
            </div>
            <div className="bg-white p-3 rounded border">
              <h5 className="font-semibold text-gray-900 mb-2">🔐 Configurable User Access</h5>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Currently: Can see all users</li>
                <li>• Can be restricted via Admin Controls</li>
                <li>• Restrictions apply to user visibility</li>
                <li>• Lead access remains unchanged</li>
                <li>• Restrictions managed by Rubeena</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Super Admins List */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">👨‍💼 Super Administrators</h3>
        {superAdmins.length === 0 ? (
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-gray-600">No super administrators found in the system.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {superAdmins.map(admin => {
              const isRubeena = admin.username?.toLowerCase() === 'rubeena';
              const bgColor = isRubeena ? 'bg-green-50 hover:bg-green-100 border-green-200' : 'bg-blue-50 hover:bg-blue-100 border-blue-200';
              const badgeColor = isRubeena ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800';
              
              return (
                <div key={admin.id} className={`border p-4 rounded-lg transition-colors ${bgColor}`}>
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${isRubeena ? 'bg-green-600' : 'bg-blue-600'}`}>
                      {admin.fullName?.charAt(0) || admin.username?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {admin.fullName || admin.username}
                      </h4>
                      <p className="text-sm text-gray-600">@{admin.username}</p>
                      <p className="text-xs text-gray-500">{admin.department || 'No Department'}</p>
                    </div>
                  </div>
                  <div className="mt-3 text-center">
                    <span className={`inline-block text-xs px-2 py-1 rounded-full ${badgeColor}`}>
                      {isRubeena ? 'All Users Access' : 'Configurable Access'}
                    </span>
                  </div>
                  {isRubeena && (
                    <div className="mt-2 text-center">
                      <span className="inline-block bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                        👑 System Administrator
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Current Restrictions */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">🔒 Active Restrictions</h3>
        {restrictions.length === 0 ? (
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-gray-600">No restrictions currently applied. All super administrators have full access.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {restrictions.map((restriction: any) => (
              <div key={restriction.id} className="border border-red-200 p-4 rounded-lg bg-red-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-red-600">🔒</span>
                      <h4 className="font-semibold text-red-900">
                        {restriction.users?.fullName || restriction.users?.username || 'Unknown User'}
                      </h4>
                      <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                        {restriction.restriction_type.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-red-700 mb-2">
                      @{restriction.users?.username} - {restriction.users?.department || 'No Department'}
                    </p>
                    {restriction.notes && (
                      <p className="text-sm text-gray-600 italic">"{restriction.notes}"</p>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      Applied on: {new Date(restriction.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => removeRestriction(restriction.id)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Information Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <span className="text-2xl">ℹ️</span>
          </div>
          <div>
            <h4 className="font-semibold text-blue-900 mb-2">How User Visibility Control Works</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>Rubeena:</strong> Has unrestricted access to see all users and system features</li>
              <li>• <strong>Other Super Admins:</strong> Currently can see all users, but restrictions can be added</li>
              <li>• <strong>Lead Management:</strong> All super admins can see all leads (unchanged)</li>
              <li>• <strong>User Management:</strong> Restrictions only apply to which users they can see</li>
              <li>• <strong>Configurable:</strong> Use "Add Restriction" button to limit specific super admins</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Add Restriction Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Add User Restriction</h3>
            
            <form onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const formData = new FormData(form);
              
              const restrictionType = formData.get('restriction_type') as string;
              const restrictionData = {
                restricted_user_id: formData.get('user_id') as string,
                restriction_type: restrictionType,
                restriction_scope: {
                  type: restrictionType,
                  description: `Admin restriction applied to super admin user`
                },
                notes: formData.get('notes') as string
              };
              
              console.log('🔧 AdminUserRestrictions: Form submitted with data:', restrictionData);
              createRestriction(restrictionData);
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
                    {superAdmins.filter(admin => admin.username?.toLowerCase() !== 'rubeena').map(admin => (
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
                    <option value="user_access">User Access (Hide specific users)</option>
                    <option value="branch_access">Branch Access (Restrict branch visibility)</option>
                    <option value="lead_access">Lead Access (Restrict lead visibility)</option>
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