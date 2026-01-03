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

      // Filter for super admins only
      const superAdminUsers = (usersData as User[]).filter((user: User) => user.role === 'super_admin');
      console.log('🔧 AdminUserRestrictions: Filtered super admins:', superAdminUsers);
      setSuperAdmins(superAdminUsers || []);
      
      console.log('🔧 AdminUserRestrictions: Data loaded successfully');
    } catch (err) {
      console.error('🚨 AdminUserRestrictions: Error loading data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
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
          <h2 className="text-2xl font-bold text-gray-900">🏢 Branch Access Control</h2>
          <p className="text-gray-600 mt-1">Control which branches super administrators can access</p>
        </div>
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

      {/* Current Branch Access Rules */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🔒 Branch Access Rules</h3>
        
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
              <h5 className="font-semibold text-gray-900 mb-2">✅ All Branches Access</h5>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Delhi Branch</li>
                <li>• Hyderabad Branch</li>
                <li>• Mumbai Branch</li>
                <li>• Bangalore Branch</li>
                <li>• Main Branch</li>
                <li>• All Future Branches</li>
              </ul>
            </div>
          </div>

          {/* Other Super Admins - Restricted */}
          <div className="border rounded-lg p-4 bg-yellow-50 border-yellow-200">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-12 h-12 bg-yellow-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                SA
              </div>
              <div>
                <h4 className="font-bold text-yellow-800">Other Super Admins</h4>
                <p className="text-sm text-yellow-600">Restricted Access</p>
              </div>
            </div>
            <div className="bg-white p-3 rounded border">
              <h5 className="font-semibold text-gray-900 mb-2">🔐 Limited Branches Access</h5>
              <ul className="text-sm text-gray-600 space-y-1">
                <li className="text-green-600">• Delhi Branch ✅</li>
                <li className="text-green-600">• Hyderabad Branch ✅</li>
                <li className="text-red-600">• Mumbai Branch ❌</li>
                <li className="text-red-600">• Bangalore Branch ❌</li>
                <li className="text-red-600">• Main Branch ❌</li>
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
              const bgColor = isRubeena ? 'bg-green-50 hover:bg-green-100 border-green-200' : 'bg-yellow-50 hover:bg-yellow-100 border-yellow-200';
              const badgeColor = isRubeena ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
              
              return (
                <div key={admin.id} className={`border p-4 rounded-lg transition-colors ${bgColor}`}>
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${isRubeena ? 'bg-green-600' : 'bg-yellow-600'}`}>
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
                      {isRubeena ? 'All Branches Access' : 'Delhi + Hyderabad Only'}
                    </span>
                  </div>
                  {isRubeena && (
                    <div className="mt-2 text-center">
                      <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
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

      {/* Information Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <span className="text-2xl">ℹ️</span>
          </div>
          <div>
            <h4 className="font-semibold text-blue-900 mb-2">How Branch Access Control Works</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>Rubeena:</strong> Has unrestricted access to all branches and all system features</li>
              <li>• <strong>Other Super Admins:</strong> Can only view/manage data from Delhi and Hyderabad branches</li>
              <li>• <strong>Lead Management:</strong> Restricted users only see leads from their allowed branches</li>
              <li>• <strong>User Management:</strong> Restricted users only see users from their allowed branches</li>
              <li>• <strong>Reports & Analytics:</strong> Data is automatically filtered by branch access</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminUserRestrictions;