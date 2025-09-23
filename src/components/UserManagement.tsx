import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getApiClient, type DatabaseUser } from '../lib/backend';
import { 
  Users, 
  Plus, 
  Search, 
  User,
  Shield,
  Crown,
  Briefcase,
  UserCheck,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Edit3,
  Eye,
  Settings,
  Trash2,
  BarChart3,
  Grid,
  List,
  TrendingUp,
  Award,
  Filter
} from 'lucide-react';

const UserManagement: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<DatabaseUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<DatabaseUser | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'teams'>('teams');
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [showTeamComparison, setShowTeamComparison] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const apiClient = getApiClient();
      const userData: any = await apiClient.getUsers();
      
      // Ensure userData is always an array
      let processedUsers = [];
      if (Array.isArray(userData)) {
        processedUsers = userData;
      } else if (userData && userData.data && Array.isArray(userData.data)) {
        processedUsers = userData.data;
      } else if (userData && typeof userData === 'object') {
        // If it's an object, try to extract array from common response patterns
        processedUsers = userData.users || userData.result || [];
      }
      
      // Users loaded successfully
      
      setUsers(processedUsers);
      setError(null);
    } catch (err) {
      console.error('❌ Error loading users:', err);
      
      // Set proper error state without fallback data
      setUsers([]);
      setError('Failed to load users. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const roleHierarchy = {
    'super_admin': { 
      level: 5, 
      label: 'Super Admin', 
      icon: Crown, 
      color: 'bg-purple-500'
    },
    'senior_manager': { 
      level: 4, 
      label: 'Senior Manager', 
      icon: Shield, 
      color: 'bg-blue-500'
    },
    'manager': { 
      level: 3, 
      label: 'Manager', 
      icon: Briefcase, 
      color: 'bg-green-500'
    },
    'team_leader': { 
      level: 2, 
      label: 'Team Leader', 
      icon: UserCheck, 
      color: 'bg-orange-500'
    },
    'counselor': { 
      level: 1, 
      label: 'Counselor', 
      icon: User, 
      color: 'bg-gray-500'
    }
  };

  // Get teams (departments) available to current user
  const getAccessibleTeams = () => {
    if (!Array.isArray(users)) return [];
    
    const currentUserRole = currentUser?.role || 'counselor';
    const currentUserLevel = roleHierarchy[currentUserRole as keyof typeof roleHierarchy]?.level || 1;
    
    // Get unique departments from users that current user can access
    const accessibleUsers = users.filter(user => {
      const userLevel = roleHierarchy[user.role as keyof typeof roleHierarchy]?.level || 1;
      return userLevel <= currentUserLevel;
    });
    
    const teams = Array.from(new Set(accessibleUsers.map(u => u.department).filter(Boolean)));
    return teams.sort();
  };

  // Get team statistics and comparisons
  const getTeamAnalytics = () => {
    if (!Array.isArray(users)) return {};
    
    const currentUserRole = currentUser?.role || 'counselor';
    const currentUserLevel = roleHierarchy[currentUserRole as keyof typeof roleHierarchy]?.level || 1;
    
    const accessibleUsers = users.filter(user => {
      const userLevel = roleHierarchy[user.role as keyof typeof roleHierarchy]?.level || 1;
      return userLevel <= currentUserLevel;
    });
    
    const teamStats: any = {};
    
    accessibleUsers.forEach(user => {
      const team = user.department || 'Unassigned';
      if (!teamStats[team]) {
        teamStats[team] = {
          total: 0,
          active: 0,
          inactive: 0,
          roles: {},
          avgLevel: 0,
          members: []
        };
      }
      
      teamStats[team].total++;
      teamStats[team].members.push(user);
      
      if (user.status === 'active') {
        teamStats[team].active++;
      } else {
        teamStats[team].inactive++;
      }
      
      const userLevel = roleHierarchy[user.role as keyof typeof roleHierarchy]?.level || 1;
      teamStats[team].avgLevel += userLevel;
      
      if (!teamStats[team].roles[user.role]) {
        teamStats[team].roles[user.role] = 0;
      }
      teamStats[team].roles[user.role]++;
    });
    
    // Calculate average levels
    Object.keys(teamStats).forEach(team => {
      teamStats[team].avgLevel = teamStats[team].avgLevel / teamStats[team].total;
    });
    
    return teamStats;
  };

  const getFilteredUsers = () => {
    // Ensure users is always an array before filtering
    if (!Array.isArray(users)) {
      console.warn('⚠️ Users is not an array:', typeof users, users);
      return [];
    }

    // Get current user's role level for hierarchy filtering
    const currentUserRole = currentUser?.role || 'counselor';
    const currentUserLevel = roleHierarchy[currentUserRole as keyof typeof roleHierarchy]?.level || 1;
    
    return users.filter(user => {
      // Ensure user object has required properties
      if (!user || typeof user !== 'object') {
        return false;
      }

      // Role hierarchy: users can only see users at their level or below
      const userLevel = roleHierarchy[user.role as keyof typeof roleHierarchy]?.level || 1;
      const canSeeUser = userLevel <= currentUserLevel;
      
      const matchesRole = selectedRole === 'all' || user.role === selectedRole;
      const matchesTeam = selectedTeam === 'all' || user.department === selectedTeam;
      const matchesSearch = (user.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (user.email || '').toLowerCase().includes(searchTerm.toLowerCase());
      return canSeeUser && matchesRole && matchesTeam && matchesSearch;
    });
  };

  const getVisibleRoles = () => {
    // Get current user's role level to filter available role options
    const currentUserRole = currentUser?.role || 'counselor';
    const currentUserLevel = roleHierarchy[currentUserRole as keyof typeof roleHierarchy]?.level || 1;
    
    return Object.entries(roleHierarchy).filter(([_, role]) => role.level <= currentUserLevel);
  };

  const getCurrentUserPermissions = () => {
    const currentUserRole = currentUser?.role || 'counselor';
    const currentUserLevel = roleHierarchy[currentUserRole as keyof typeof roleHierarchy]?.level || 1;
    
    return {
      canAddUsers: currentUserLevel >= 3, // Manager level and above
      canEditUsers: currentUserLevel >= 2, // Team Leader level and above
      canDeleteUsers: currentUserLevel >= 4, // Senior Manager level and above
      level: currentUserLevel,
      role: currentUserRole
    };
  };

  // Real function implementations
  const handleAddUser = () => {
    setSelectedUser(null);
    setShowAddModal(true);
  };

  const handleEditUser = (user: DatabaseUser) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleViewUser = (user: DatabaseUser) => {
    setSelectedUser(user);
    // Could open a view modal or navigate to user detail page
    alert(`Viewing user: ${user.name}\nEmail: ${user.email}\nRole: ${user.role}`);
  };

  const handleUserSettings = async (user: DatabaseUser) => {
    try {
      setActionLoading(user.id);
      const apiClient = getApiClient();
      
      // Toggle user status
      const newStatus = user.status === 'active' ? 'inactive' : 'active';
      await apiClient.updateUser(user.id, { status: newStatus });
      
      // Reload users to show updated status
      await loadUsers();
      
      alert(`User ${user.name} status changed to ${newStatus}`);
    } catch (err) {
      console.error('Error updating user status:', err);
      alert('Failed to update user status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (user: DatabaseUser) => {
    if (!window.confirm(`Are you sure you want to delete user ${user.name}?`)) {
      return;
    }

    try {
      setActionLoading(user.id);
      const apiClient = getApiClient();
      await apiClient.deleteUser(user.id);
      
      // Reload users to show updated list
      await loadUsers();
      
      alert(`User ${user.name} has been deleted`);
    } catch (err) {
      console.error('Error deleting user:', err);
      alert('Failed to delete user');
    } finally {
      setActionLoading(null);
    }
  };

  const saveUser = async (userData: Partial<DatabaseUser>) => {
    try {
      setActionLoading('save');
      const apiClient = getApiClient();
      
      console.log('💾 Saving user data:', userData);
      
      if (selectedUser) {
        // Update existing user using proper backend API
        const result = await apiClient.updateUser(selectedUser.id, userData);
        console.log('✅ User updated successfully:', result);
      } else {
        // Create new user using proper backend API 
        const result = await apiClient.createUser(userData);
        console.log('✅ User created successfully:', result);
      }
      
      // Reload users and close modal
      await loadUsers();
      setShowAddModal(false);
      setShowEditModal(false);
      setSelectedUser(null);
      
      alert(`User ${selectedUser ? 'updated' : 'created'} successfully`);
    } catch (err) {
      console.error('Error saving user:', err);
      alert(`Failed to ${selectedUser ? 'update' : 'create'} user`);
    } finally {
      setActionLoading(null);
    }
  };

  const getRoleIcon = (role: string) => {
    const roleData = roleHierarchy[role as keyof typeof roleHierarchy];
    const IconComponent = roleData?.icon || User;
    return <IconComponent className="w-4 h-4" />;
  };

  const getRoleColor = (role: string) => {
    return roleHierarchy[role as keyof typeof roleHierarchy]?.color || 'bg-gray-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <div className="text-red-600">
            <p className="font-medium">Error loading users</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        </div>
        <button
          onClick={loadUsers}
          className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Get data for components
  const filteredUsers = getFilteredUsers();
  const visibleRoles = getVisibleRoles();
  const permissions = getCurrentUserPermissions();
  const accessibleTeams = getAccessibleTeams();
  const teamAnalytics = getTeamAnalytics();

  return (
    <div className="space-y-6">
      {/* Enhanced Header with Team View Toggle */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600">
              Manage team members with hierarchical access control
              <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                {roleHierarchy[permissions.role as keyof typeof roleHierarchy]?.label || 'User'} View (Level {permissions.level})
              </span>
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('teams')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'teams' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Grid className="w-4 h-4 mr-1.5 inline" />
                Team View
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <List className="w-4 h-4 mr-1.5 inline" />
                List View
              </button>
            </div>
            
            {/* Team Comparison Toggle */}
            <button
              onClick={() => setShowTeamComparison(!showTeamComparison)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                showTeamComparison 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <BarChart3 className="w-4 h-4 mr-1.5 inline" />
              Team Comparison
            </button>
            
            {permissions.canAddUsers && (
              <button 
                onClick={handleAddUser}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add User</span>
              </button>
            )}
          </div>
        </div>

        {/* Access Control Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-blue-600" />
            <p className="text-sm text-blue-700">
              <strong>Hierarchical Access:</strong> You can view and manage users at Level {permissions.level} and below. 
              Total accessible users: <strong>{filteredUsers.length}</strong> across <strong>{accessibleTeams.length}</strong> teams.
            </p>
          </div>
        </div>
      </div>

      {/* Team Comparison Panel */}
      {showTeamComparison && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
            Team Performance Comparison
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(teamAnalytics).map(([teamName, stats]: [string, any]) => (
              <div key={teamName} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">{teamName}</h4>
                  <Award className="w-4 h-4 text-yellow-500" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Members:</span>
                    <span className="font-medium">{stats.total}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Active:</span>
                    <span className="font-medium text-green-600">{stats.active}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Inactive:</span>
                    <span className="font-medium text-red-600">{stats.inactive}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Avg Level:</span>
                    <span className="font-medium text-blue-600">{stats.avgLevel.toFixed(1)}</span>
                  </div>
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <p className="text-xs text-gray-500 mb-1">Role Distribution:</p>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(stats.roles).map(([role, count]: [string, any]) => (
                        <span key={role} className={`px-2 py-1 text-xs rounded-full ${getRoleColor(role)} text-white`}>
                          {roleHierarchy[role as keyof typeof roleHierarchy]?.label || role}: {count}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Enhanced Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-80"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Roles</option>
              {visibleRoles.map(([key, role]) => (
                <option key={key} value={key}>{role.label}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-gray-400" />
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Teams</option>
              {accessibleTeams.map(team => (
                <option key={team} value={team}>{team}</option>
              ))}
            </select>
          </div>

          <div className="ml-auto text-sm text-gray-600">
            Showing {filteredUsers.length} of {users.filter(u => {
              const userLevel = roleHierarchy[u.role as keyof typeof roleHierarchy]?.level || 1;
              return userLevel <= permissions.level;
            }).length} accessible users
          </div>
        </div>
      </div>

      {/* Statistics - Only show roles visible to current user */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {visibleRoles.map(([roleKey, role]) => {
          const count = users.filter(u => u.role === roleKey).length;
          const IconComponent = role.icon;
          
          return (
            <div key={roleKey} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{role.label}s</p>
                  <p className="text-2xl font-bold text-gray-900">{count}</p>
                </div>
                <div className={`w-10 h-10 rounded-full ${role.color} flex items-center justify-center text-white`}>
                  <IconComponent className="w-5 h-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Role Hierarchy Info */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Your Access Level</h3>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-600">
            <p>Current Role: <span className="font-medium text-gray-900">{roleHierarchy[permissions.role as keyof typeof roleHierarchy]?.label}</span></p>
            <p>Access Level: <span className="font-medium text-gray-900">Level {permissions.level}</span></p>
            <p className="mt-2 text-xs">You can view and manage team members at Level {permissions.level} and below</p>
          </div>
          <div className="flex-1">
            <div className="text-xs text-gray-500 mb-2">Hierarchy Levels:</div>
            <div className="flex space-x-2">
              {Object.entries(roleHierarchy)
                .sort(([,a], [,b]) => b.level - a.level)
                .map(([roleKey, role]) => {
                  const isAccessible = role.level <= permissions.level;
                  const IconComponent = role.icon;
                  return (
                    <div 
                      key={roleKey} 
                      className={`flex flex-col items-center p-2 rounded-lg ${
                        isAccessible ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 border border-gray-200 opacity-50'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full ${role.color} flex items-center justify-center text-white mb-1`}>
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-medium">{role.level}</span>
                      <span className="text-xs text-gray-600">{role.label}</span>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </div>



      {/* Users Display - Team View or List View */}
      {viewMode === 'teams' ? (
        // Team-wise view
        <div className="space-y-6">
          {accessibleTeams.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No teams found</p>
            </div>
          ) : (
            accessibleTeams.map(team => {
              const teamUsers = filteredUsers.filter(u => u.department === team);
              if (teamUsers.length === 0) return null;
              
              return (
                <div key={team} className="bg-white rounded-lg shadow">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-900 flex items-center">
                        <Users className="w-5 h-5 mr-2 text-blue-600" />
                        {team} Team ({teamUsers.length} members)
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span className="flex items-center">
                          <TrendingUp className="w-4 h-4 mr-1 text-green-500" />
                          Avg Level: {(teamAnalytics[team as string]?.avgLevel || 0).toFixed(1)}
                        </span>
                        <span className="text-green-600">
                          {teamAnalytics[team as string]?.active || 0} Active
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {teamUsers.map((user) => (
                      <div key={user.id} className="p-6 hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            {/* Avatar */}
                            <div className={`w-12 h-12 rounded-full ${getRoleColor(user.role)} flex items-center justify-center text-white`}>
                              {getRoleIcon(user.role)}
                            </div>
                            
                            {/* User Info */}
                            <div>
                              <h4 className="text-lg font-medium text-gray-900">{user.name}</h4>
                              <p className="text-sm text-gray-600">{user.designation || roleHierarchy[user.role as keyof typeof roleHierarchy]?.label}</p>
                              <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                                <span className="flex items-center">
                                  <Mail className="w-4 h-4 mr-1" />
                                  {user.email}
                                </span>
                                {user.phone && (
                                  <span className="flex items-center">
                                    <Phone className="w-4 h-4 mr-1" />
                                    {user.phone}
                                  </span>
                                )}
                                {user.location && (
                                  <span className="flex items-center">
                                    <MapPin className="w-4 h-4 mr-1" />
                                    {user.location}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Actions and Status */}
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              user.status === 'active' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {user.status}
                            </span>
                            
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Level {roleHierarchy[user.role as keyof typeof roleHierarchy]?.level || 1}
                            </span>
                            
                            <button 
                              onClick={() => handleViewUser(user)}
                              className="p-2 text-gray-400 hover:text-gray-600"
                              title="View User"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            
                            {permissions.canEditUsers && (
                              <button 
                                onClick={() => handleEditUser(user)}
                                className="p-2 text-gray-400 hover:text-gray-600"
                                title="Edit User"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })
          )}
        </div>
      ) : (
        // Traditional list view
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Team Members ({filteredUsers.length})
            </h3>
          </div>

          {filteredUsers.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No users found</p>
              {searchTerm && (
                <p className="text-sm text-gray-500 mt-2">
                  Try adjusting your search criteria
                </p>
              )}
            </div>
          ) : (
          <div className="divide-y divide-gray-200">
            {filteredUsers.map((user) => (
              <div key={user.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {/* Avatar */}
                    <div className={`w-12 h-12 rounded-full ${getRoleColor(user.role)} flex items-center justify-center text-white`}>
                      {getRoleIcon(user.role)}
                    </div>
                    
                    {/* User Info */}
                    <div>
                      <h4 className="text-lg font-medium text-gray-900">{user.name}</h4>
                      <p className="text-sm text-gray-600">{user.designation || roleHierarchy[user.role as keyof typeof roleHierarchy]?.label}</p>
                      <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                        <span className="flex items-center">
                          <Mail className="w-4 h-4 mr-1" />
                          {user.email}
                        </span>
                        {user.phone && (
                          <span className="flex items-center">
                            <Phone className="w-4 h-4 mr-1" />
                            {user.phone}
                          </span>
                        )}
                        {user.location && (
                          <span className="flex items-center">
                            <MapPin className="w-4 h-4 mr-1" />
                            {user.location}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions - Based on permissions */}
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user.status}
                    </span>
                    
                    {/* Role level indicator */}
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Level {roleHierarchy[user.role as keyof typeof roleHierarchy]?.level || 1}
                    </span>
                    
                    <button 
                      onClick={() => handleViewUser(user)}
                      className="p-2 text-gray-400 hover:text-gray-600"
                      title="View User"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    
                    {permissions.canEditUsers && (
                      <button 
                        onClick={() => handleEditUser(user)}
                        className="p-2 text-gray-400 hover:text-gray-600"
                        title="Edit User"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    )}
                    
                    {permissions.canDeleteUsers && (
                      <>
                        <button 
                          onClick={() => handleUserSettings(user)}
                          disabled={actionLoading === user.id}
                          className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                          title="Toggle Status"
                        >
                          {actionLoading === user.id ? (
                            <div className="w-4 h-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
                          ) : (
                            <Settings className="w-4 h-4" />
                          )}
                        </button>
                        
                        {/* Delete button for super admins only */}
                        {permissions.role === 'super_admin' && (
                          <button 
                            onClick={() => handleDeleteUser(user)}
                            disabled={actionLoading === user.id}
                            className="p-2 text-red-400 hover:text-red-600 disabled:opacity-50"
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Additional Info */}
                {user.department && (
                  <div className="mt-3 text-sm text-gray-600">
                    <span className="font-medium">Department:</span> {user.department}
                    {user.join_date && (
                      <span className="ml-4">
                        <Calendar className="w-4 h-4 inline mr-1" />
                        Joined: {new Date(user.join_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        </div>
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <UserModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSave={saveUser}
          loading={actionLoading === 'save'}
          availableRoles={visibleRoles}
          users={users}
          roleHierarchy={roleHierarchy}
        />
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <UserModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSave={saveUser}
          loading={actionLoading === 'save'}
          user={selectedUser}
          availableRoles={visibleRoles}
          users={users}
          roleHierarchy={roleHierarchy}
        />
      )}
    </div>
  );
};

// User Modal Component
interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (userData: Partial<DatabaseUser>) => void;
  loading: boolean;
  user?: DatabaseUser;
  availableRoles: [string, any][];
  users: DatabaseUser[];
  roleHierarchy: any;
}

const UserModal: React.FC<UserModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  loading, 
  user, 
  availableRoles,
  users,
  roleHierarchy
}) => {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    username: user?.username || '',
    email: user?.email || '',
    phone: user?.phone || '',
    role: user?.role || 'counselor',
    designation: user?.designation || '',
    department: user?.department || '',
    location: user?.location || '',
    status: user?.status || 'active',
    reports_to: user?.reports_to || '', // Fixed: Use correct field name
    password: '', // Password field for new users
    confirmPassword: '' // Confirm password field
  });

  const [passwordError, setPasswordError] = useState('');

  if (!isOpen) return null;

  const validatePasswords = () => {
    if (!user) { // Only validate for new users
      if (!formData.password) {
        setPasswordError('Password is required for new users');
        return false;
      }
      if (formData.password.length < 6) {
        setPasswordError('Password must be at least 6 characters');
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        setPasswordError('Passwords do not match');
        return false;
      }
    }
    setPasswordError('');
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePasswords()) {
      return;
    }

    // Prepare user data - exclude password confirmation
    const { confirmPassword, ...userData } = formData;
    
    // For existing users, don't send password if it's empty
    if (user && !formData.password) {
      const { password, ...userDataWithoutPassword } = userData;
      onSave(userDataWithoutPassword);
    } else {
      onSave(userData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">
          {user ? 'Edit User' : 'Add New User'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Username</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="Username for login"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          
          {/* Password fields - only show for new users or when editing password */}
          {!user && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700">Password *</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="Minimum 6 characters"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Confirm Password *</label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="Re-enter password"
                  required
                />
                {passwordError && (
                  <p className="text-red-600 text-sm mt-1">{passwordError}</p>
                )}
              </div>
            </>
          )}
          
          {user && (
            <div>
              <label className="block text-sm font-medium text-gray-700">New Password (optional)</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="Leave blank to keep current password"
              />
              {formData.password && (
                <div className="mt-2">
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="Confirm new password"
                  />
                  {passwordError && (
                    <p className="text-red-600 text-sm mt-1">{passwordError}</p>
                  )}
                </div>
              )}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({...formData, role: e.target.value as DatabaseUser['role']})}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              required
            >
              {availableRoles.map(([key, role]) => (
                <option key={key} value={key}>{role.label}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Department</label>
            <input
              type="text"
              value={formData.department}
              onChange={(e) => setFormData({...formData, department: e.target.value})}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Location</label>
            <select
              value={formData.location}
              onChange={(e) => setFormData({...formData, location: e.target.value})}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">Select Location</option>
              <option value="Delhi">Delhi</option>
              <option value="Hyderabad">Hyderabad</option>
              <option value="Kashmir">Kashmir</option>
              <option value="Remote">Remote</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Reports To (Supervisor) <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.reports_to}
              onChange={(e) => setFormData({...formData, reports_to: e.target.value})}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              required
            >
              <option value="">Select Supervisor (Required)</option>
              {users
                .filter(u => u.id !== user?.id && u.status === 'active') // Don't show current user and only active users
                .filter(u => {
                  // Only show users with higher or equal role hierarchy
                  const currentUserLevel = roleHierarchy[user?.role || 'counselor']?.level || 1;
                  const supervisorLevel = roleHierarchy[u.role as keyof typeof roleHierarchy]?.level || 1;
                  return supervisorLevel >= currentUserLevel;
                })
                .map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({roleHierarchy[u.role as keyof typeof roleHierarchy]?.label || u.role}) - {u.department || 'No Department'}
                  </option>
                ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({...formData, status: e.target.value as DatabaseUser['status']})}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Saving...' : (user ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserManagement;