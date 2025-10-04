import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { TokenManager } from '../lib/productionAuth';
import { 
  Calendar,
  Users,
  Activity,
  BarChart3,
  TrendingUp,
  Clock,
  Filter,
  RefreshCw,
  User,
  Search,
  AlertCircle
} from 'lucide-react';

interface UserActivity {
  username: string;
  totalUpdates: number;
  lastUpdate: string;
}

interface DailyStats {
  date: string;
  totalUpdates: number;
  activeUsers: number;
  users: string[];
}

interface LeadUpdate {
  id: string;
  fullName: string;
  status: string;
  updated_at: string;
  updated_by: string;
  created_at: string;
  assigned_to: string;
}

interface ActivityData {
  leadUpdates: LeadUpdate[];
  userStats: UserActivity[];
  dailyStats: DailyStats[];
  summary: {
    totalUpdates: number;
    dateRange: {
      start: string;
      end: string;
    };
    filteredUser: string;
  };
}

const SuperAdminAnalytics: React.FC = () => {
  const { user } = useAuth();
  const [activityData, setActivityData] = useState<ActivityData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [selectedUser, setSelectedUser] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dateFilter, setDateFilter] = useState('last_7_days');
  const [availableUsers, setAvailableUsers] = useState<string[]>([]);

  // Date filter options
  const dateFilterOptions = [
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'last_7_days', label: 'Last 7 Days' },
    { value: 'last_30_days', label: 'Last 30 Days' },
    { value: 'this_month', label: 'This Month' },
    { value: 'last_month', label: 'Last Month' },
    { value: 'custom', label: 'Custom Range' }
  ];

  // Handle date filter changes
  const handleDateFilterChange = (filterValue: string) => {
    setDateFilter(filterValue);
    const today = new Date();
    
    switch (filterValue) {
      case 'today':
        setStartDate(today.toISOString().split('T')[0]);
        setEndDate(today.toISOString().split('T')[0]);
        break;
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        setStartDate(yesterday.toISOString().split('T')[0]);
        setEndDate(yesterday.toISOString().split('T')[0]);
        break;
      case 'last_7_days':
        const lastWeek = new Date(today);
        lastWeek.setDate(today.getDate() - 7);
        setStartDate(lastWeek.toISOString().split('T')[0]);
        setEndDate(today.toISOString().split('T')[0]);
        break;
      case 'last_30_days':
        const lastMonth = new Date(today);
        lastMonth.setDate(today.getDate() - 30);
        setStartDate(lastMonth.toISOString().split('T')[0]);
        setEndDate(today.toISOString().split('T')[0]);
        break;
      case 'this_month':
        const firstDayThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        setStartDate(firstDayThisMonth.toISOString().split('T')[0]);
        setEndDate(today.toISOString().split('T')[0]);
        break;
      case 'last_month':
        const firstDayLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastDayLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
        setStartDate(firstDayLastMonth.toISOString().split('T')[0]);
        setEndDate(lastDayLastMonth.toISOString().split('T')[0]);
        break;
      case 'custom':
        // Keep current dates for custom range
        break;
    }
  };

  // Initialize with last 7 days
  useEffect(() => {
    handleDateFilterChange('last_7_days');
  }, []);

  // Load user activity data
  const loadUserActivity = async () => {
    const token = TokenManager.getToken();
    if (!token || !user) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        action: 'user-activity',
        ...(selectedUser && { username: selectedUser }),
        ...(startDate && { start_date: startDate }),
        ...(endDate && { end_date: endDate }),
        limit: '500'
      });

      // Use production API URL
      const baseUrl = window.location.hostname === 'localhost' 
        ? 'http://localhost:3001' 
        : 'https://crm-backend-dmhca.vercel.app';
      
      const response = await fetch(`${baseUrl}/api/super-admin?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`API Error (${response.status}): ${response.statusText}`);
      }

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await response.text();
        console.error('Non-JSON Response:', textResponse);
        throw new Error('Server returned HTML instead of JSON. Please check the API endpoint.');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to load activity data');
      }

      setActivityData(result.data);

      // Extract unique users for filter dropdown
      const users = new Set<string>();
      result.data.userStats.forEach((stat: UserActivity) => {
        if (stat.username && stat.username !== 'Unknown') {
          users.add(stat.username);
        }
      });
      setAvailableUsers(Array.from(users).sort());

    } catch (err) {
      console.error('Error loading user activity:', err);
      setError(err instanceof Error ? err.message : 'Failed to load activity data');
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount and when filters change
  useEffect(() => {
    if (startDate && endDate) {
      loadUserActivity();
    }
  }, [startDate, endDate, selectedUser]);

  // Check if user has super admin access
  if (user?.role !== 'super_admin') {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-800 mb-2">Access Denied</h2>
            <p className="text-red-600">Super Admin access required to view user activity analytics.</p>
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'Hot': 'bg-red-100 text-red-800',
      'Warm': 'bg-orange-100 text-orange-800',
      'Fresh': 'bg-blue-100 text-blue-800',
      'Follow Up': 'bg-yellow-100 text-yellow-800',
      'Enrolled': 'bg-green-100 text-green-800',
      'Not Interested': 'bg-gray-100 text-gray-800',
      'Junk': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
                <BarChart3 className="w-8 h-8 text-blue-600" />
                <span>Super Admin Analytics</span>
              </h1>
              <p className="text-gray-600 mt-1">Track user lead update activity and performance</p>
            </div>
            <button
              onClick={loadUserActivity}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <Filter className="w-5 h-5" />
              <span>Filters</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                <select
                  value={dateFilter}
                  onChange={(e) => handleDateFilterChange(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {dateFilterOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setDateFilter('custom');
                  }}
                  disabled={dateFilter !== 'custom'}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setDateFilter('custom');
                  }}
                  disabled={dateFilter !== 'custom'}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">User Filter</label>
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Users</option>
                  {availableUsers.map(username => (
                    <option key={username} value={username}>{username}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-end">
                <button
                  onClick={loadUserActivity}
                  disabled={loading}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-red-800 font-medium">Error:</span>
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading user activity data...</p>
          </div>
        )}

        {/* Summary Cards */}
        {activityData && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Updates</p>
                    <p className="text-3xl font-bold text-blue-600">{activityData.summary.totalUpdates}</p>
                  </div>
                  <Activity className="w-8 h-8 text-blue-600" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Users</p>
                    <p className="text-3xl font-bold text-green-600">{activityData.userStats.length}</p>
                  </div>
                  <Users className="w-8 h-8 text-green-600" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Date Range</p>
                    <p className="text-sm font-bold text-gray-900">
                      {activityData.summary.dateRange.start} to {activityData.summary.dateRange.end}
                    </p>
                  </div>
                  <Calendar className="w-8 h-8 text-purple-600" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Filter</p>
                    <p className="text-sm font-bold text-gray-900">{activityData.summary.filteredUser}</p>
                  </div>
                  <Filter className="w-8 h-8 text-orange-600" />
                </div>
              </div>
            </div>

            {/* User Statistics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5" />
                  <span>Top Performers</span>
                </h3>
                
                <div className="space-y-4">
                  {activityData.userStats.slice(0, 10).map((userStat, index) => (
                    <div key={userStat.username} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                          index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-500' : 'bg-blue-500'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{userStat.username}</p>
                          <p className="text-sm text-gray-500">
                            Last update: {formatDate(userStat.lastUpdate)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-blue-600">{userStat.totalUpdates}</p>
                        <p className="text-sm text-gray-500">updates</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Daily Activity */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <Calendar className="w-5 h-5" />
                  <span>Daily Activity</span>
                </h3>
                
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {activityData.dailyStats.slice(0, 14).map((dayStat) => (
                    <div key={dayStat.date} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">
                          {new Date(dayStat.date).toLocaleDateString('en-US', { 
                            weekday: 'short', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </p>
                        <p className="text-sm text-gray-500">{dayStat.activeUsers} active users</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600">{dayStat.totalUpdates}</p>
                        <p className="text-sm text-gray-500">updates</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Lead Updates */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <Clock className="w-5 h-5" />
                <span>Recent Lead Updates</span>
              </h3>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Lead
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Updated By
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Updated At
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Assigned To
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {activityData.leadUpdates.slice(0, 50).map((update) => (
                      <tr key={`${update.id}-${update.updated_at}`} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <User className="w-4 h-4 text-gray-400 mr-2" />
                            <div className="text-sm font-medium text-gray-900">
                              {update.fullName || 'Unknown Lead'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(update.status)}`}>
                            {update.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {update.updated_by || 'System'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(update.updated_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {update.assigned_to || 'Unassigned'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {activityData.leadUpdates.length === 0 && (
                <div className="text-center py-8">
                  <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No lead updates found for the selected criteria.</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SuperAdminAnalytics;