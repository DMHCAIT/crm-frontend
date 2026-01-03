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
  const [viewMode, setViewMode] = useState<'list' | 'teams' | 'hierarchy'>('teams');
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [showTeamComparison, setShowTeamComparison] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [selectedCompany, setSelectedCompany] = useState('all');
  const [showUserDetailModal, setShowUserDetailModal] = useState(false);
  const [userDetailData, setUserDetailData] = useState<{
    user: DatabaseUser | null;
    subordinates: any[];
    leads: any[];
    loading: boolean;
  }>({
    user: null,
    subordinates: [],
    leads: [],
    loading: false
  });

  // Branch options
  const branches = [
    { id: 'all', name: 'All Branches', icon: '🌐' },
    { id: 'delhi', name: 'Delhi', icon: '🏛️' },
    { id: 'hyderabad', name: 'Hyderabad', icon: '🌆' },
    { id: 'kashmir', name: 'Kashmir', icon: '🏔️' }
  ];

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
    'admin': { 
      level: 6, 
      label: 'Administrator', 
      icon: Crown, 
      color: 'bg-purple-600'
    },
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


    
    return users.filter(user => {
      // Ensure user object has required properties
      if (!user || typeof user !== 'object') {
        return false;
      }

      // Hierarchical filtering: users can see themselves and users who report to them (directly or indirectly)
      const canSeeUser = canAccessUser(user, currentUser?.id);
      
      const matchesRole = selectedRole === 'all' || user.role === selectedRole;
      const matchesTeam = selectedTeam === 'all' || user.department === selectedTeam;
      const matchesBranch = selectedBranch === 'all' || 
                           (user.branch && user.branch.toLowerCase() === selectedBranch.toLowerCase()) ||
                           (user.location && user.location.toLowerCase().includes(selectedBranch.toLowerCase()));
      const matchesCompany = selectedCompany === 'all' || user.company === selectedCompany;
      const matchesSearch = (user.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (user.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (user.username || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      return canSeeUser && matchesRole && matchesTeam && matchesBranch && matchesCompany && matchesSearch;
    });
  };

  // Check if current user can access/see another user based on hierarchy
  const canAccessUser = (targetUser: DatabaseUser, currentUserId?: string) => {
    if (!currentUserId || !targetUser) return false;
    
    // Admins can see everyone
    if (currentUser?.role === 'admin') return true;
    
    // Super admins can see everyone (except restricted by admin)
    if (currentUser?.role === 'super_admin') return true;
    
    // Users can always see themselves
    if (targetUser.id === currentUserId) return true;
    
    // Check if targetUser reports to currentUser (directly or indirectly)
    return isSubordinate(targetUser.id, currentUserId);
  };

  // Check if userId is a subordinate of supervisorId (direct or indirect)
  const isSubordinate = (userId: string, supervisorId: string): boolean => {
    const user = users.find(u => u.id === userId);
    if (!user || !user.reports_to) return false;
    
    // Direct report
    if (user.reports_to === supervisorId) return true;
    
    // Indirect report - check recursively
    return isSubordinate(user.reports_to, supervisorId);
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
      canDeleteUsers: currentUserLevel >= 5, // Super Admin and Admin levels
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

  const handleViewUser = async (user: DatabaseUser) => {
    setSelectedUser(user);
    setUserDetailData({
      user,
      subordinates: [],
      leads: [],
      loading: true
    });
    setShowUserDetailModal(true);

    try {
      const apiClient = getApiClient();
      
      // Load subordinates and leads in parallel
      const [subordinatesResponse, leadsResponse] = await Promise.all([
        apiClient.getUserSubordinates(user.id).catch(() => ({ subordinates: [] })),
        apiClient.getUserLeads(user.id, true).catch(() => ({ leads: [] }))
      ]);

      const subordinates = (subordinatesResponse as any)?.subordinates || [];
      const leads = (leadsResponse as any)?.leads || [];

      setUserDetailData({
        user,
        subordinates,
        leads,
        loading: false
      });
      
      console.log(`📊 Loaded ${subordinates.length} subordinates and ${leads.length} leads for ${user.name}`);
      
    } catch (error) {
      console.error('❌ Error loading user details:', error);
      setUserDetailData(prev => ({
        ...prev,
        loading: false
      }));
    }
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
      
      // Convert empty string UUID fields to null for database compatibility
      const cleanedUserData = {
        ...userData,
        reports_to: userData.reports_to === '' ? null : userData.reports_to
      };
      
      console.log('💾 Saving user data:', cleanedUserData);
      console.log('🔍 Reports to field specifically:', cleanedUserData.reports_to);
      
      if (selectedUser) {
        // Update existing user using proper backend API
        const result = await apiClient.updateUser(selectedUser.id, cleanedUserData);
        console.log('✅ User updated successfully:', result);
      } else {
        // Create new user using proper backend API 
        const result = await apiClient.createUser(cleanedUserData);
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
                onClick={() => setViewMode('hierarchy')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'hierarchy' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <BarChart3 className="w-4 h-4 mr-1.5 inline" />
                Org Chart
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

          {/* Branch Filter Buttons */}
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-gray-400" />
            <div className="flex space-x-1">
              {branches.map(branch => (
                <button
                  key={branch.id}
                  onClick={() => setSelectedBranch(branch.id)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1 ${
                    selectedBranch === branch.id
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <span>{branch.icon}</span>
                  <span>{branch.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Company Filter Buttons */}
          <div className="flex items-center space-x-2">
            <Briefcase className="w-4 h-4 text-gray-400" />
            <div className="flex space-x-1">
              <button
                onClick={() => setSelectedCompany('all')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1 ${
                  selectedCompany === 'all'
                    ? 'bg-gray-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span>🌐</span>
                <span>All Companies</span>
              </button>
              <button
                onClick={() => setSelectedCompany('DMHCA')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1 ${
                  selectedCompany === 'DMHCA'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span>🏥</span>
                <span>DMHCA</span>
              </button>
              <button
                onClick={() => setSelectedCompany('IBMP')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1 ${
                  selectedCompany === 'IBMP'
                    ? 'bg-green-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span>🎓</span>
                <span>IBMP</span>
              </button>
            </div>
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
                                {user.branch && (
                                  <span className="flex items-center">
                                    <span className="w-4 h-4 mr-1 text-lg">🏢</span>
                                    {user.branch}
                                  </span>
                                )}
                                {user.company && (
                                  <span className="flex items-center">
                                    <span className="w-4 h-4 mr-1 text-lg">🏛️</span>
                                    {user.company}
                                  </span>
                                )}
                              </div>
                              {/* Hierarchy Information */}
                              {user.reports_to && (
                                <div className="mt-2 text-sm text-gray-600">
                                  <span className="flex items-center">
                                    <UserCheck className="w-4 h-4 mr-1 text-blue-500" />
                                    Reports to: <strong className="ml-1">
                                      {users.find(u => u.id === user.reports_to)?.name || 'Unknown'}
                                    </strong> 
                                    <span className="ml-1 text-gray-400">
                                      ({roleHierarchy[users.find(u => u.id === user.reports_to)?.role as keyof typeof roleHierarchy]?.label || 'Unknown Role'})
                                    </span>
                                  </span>
                                </div>
                              )}
                              
                              {/* Show Direct Reports */}
                              {(() => {
                                const directReports = users.filter(u => u.reports_to === user.id);
                                if (directReports.length > 0) {
                                  return (
                                    <div className="mt-2 text-sm text-gray-600">
                                      <span className="flex items-center">
                                        <Users className="w-4 h-4 mr-1 text-green-500" />
                                        Team: <span className="ml-1 font-medium text-green-700">
                                          {directReports.length} direct report{directReports.length > 1 ? 's' : ''}
                                        </span>
                                      </span>
                                      <div className="ml-5 mt-1 text-xs text-gray-500">
                                        {directReports.map(report => report.name).join(', ')}
                                      </div>
                                    </div>
                                  );
                                }
                                return null;
                              })()}
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
      ) : viewMode === 'hierarchy' ? (
        // Organizational Hierarchy View
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
              Organizational Hierarchy
            </h3>
            <p className="text-sm text-gray-600 mt-1">Complete reporting structure and team relationships</p>
          </div>

          <div className="p-6">
            {(() => {
              // Build hierarchy tree
              const buildHierarchyTree = () => {
                const userMap = new Map();
                filteredUsers.forEach(user => userMap.set(user.id, { ...user, children: [] }));
                
                const roots: any[] = [];
                filteredUsers.forEach(user => {
                  if (user.reports_to && userMap.has(user.reports_to)) {
                    userMap.get(user.reports_to).children.push(userMap.get(user.id));
                  } else {
                    roots.push(userMap.get(user.id));
                  }
                });
                
                return roots;
              };

              const renderHierarchyNode = (user: any, level = 0) => {
                const directReports = user.children || [];
                const hasReports = directReports.length > 0;
                
                return (
                  <div key={user.id} className={`${level > 0 ? 'ml-8 border-l-2 border-gray-200 pl-4' : ''} mb-4`}>
                    <div className="flex items-center p-3 bg-gray-50 rounded-lg border">
                      <div className="flex-shrink-0 mr-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          level === 0 ? 'bg-purple-500' : 
                          level === 1 ? 'bg-blue-500' : 
                          level === 2 ? 'bg-green-500' : 
                          level === 3 ? 'bg-yellow-500' : 'bg-gray-500'
                        } text-white font-semibold`}>
                          {user.name?.charAt(0) || 'U'}
                        </div>
                      </div>
                      
                      <div className="flex-grow">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold text-gray-900">{user.name}</h4>
                            <p className="text-sm text-blue-600 font-medium">@{user.username}</p>
                            <p className="text-sm text-gray-600">
                              {roleHierarchy[user.role as keyof typeof roleHierarchy]?.label || user.role}
                            </p>
                            <p className="text-xs text-gray-500">{user.email}</p>
                          </div>
                          
                          <div className="text-right">
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                user.status === 'active' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {user.status}
                              </span>
                              
                              {hasReports && (
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                                  {directReports.length} report{directReports.length > 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                            
                            <div className="mt-1 flex space-x-1">
                              <button 
                                onClick={() => handleViewUser(user)}
                                className="p-1 text-gray-400 hover:text-gray-600"
                                title="View User"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              
                              {permissions.canEditUsers && (
                                <button 
                                  onClick={() => handleEditUser(user)}
                                  className="p-1 text-gray-400 hover:text-gray-600"
                                  title="Edit User"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Render children */}
                    {directReports.map((child: any) => renderHierarchyNode(child, level + 1))}
                  </div>
                );
              };

              const hierarchyTree = buildHierarchyTree();
              
              return (
                <div className="space-y-4">
                  {hierarchyTree.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No hierarchy data available</p>
                    </div>
                  ) : (
                    hierarchyTree.map(root => renderHierarchyNode(root))
                  )}
                </div>
              );
            })()}
          </div>
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

      {/* User Detail Modal */}
      {showUserDetailModal && userDetailData.user && (
        <UserDetailModal
          isOpen={showUserDetailModal}
          onClose={() => setShowUserDetailModal(false)}
          userData={userDetailData}
          onTransferLead={(leadId: string, targetUserId: string) => {
            // Handle lead transfer
            console.log(`Transferring lead ${leadId} to user ${targetUserId}`);
          }}
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
    branch: user?.branch || '', // Branch field for filtering
    company: user?.company || '', // Company field (DMHCA, IBMP)
    status: user?.status || 'active',
    reports_to: user?.reports_to || '', // Keep as string for form handling
    password: '', // Password field for new users
    confirmPassword: '' // Confirm password field
  });

  // DEBUG: Log the user role and form data role
  console.log('🔍 UserForm Debug:', {
    userRole: user?.role,
    formDataRole: formData.role,
    userName: user?.name,
    isSupeAdmin: formData.role === 'super_admin'
  });

  const [passwordError, setPasswordError] = useState('');

  // Update form data when user prop changes (important for edit mode)
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        username: user.username || '',
        email: user.email || '',
        phone: user.phone || '',
        role: user.role || 'counselor',
        designation: user.designation || '',
        department: user.department || '',
        location: user.location || '',
        branch: user.branch || '',
        company: user.company || '',
        status: user.status || 'active',
        reports_to: user.reports_to || '',
        password: '',
        confirmPassword: ''
      });
    }
  }, [user]);

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

    // Prepare user data - exclude password confirmation and fix types
    const { confirmPassword, ...rawUserData } = formData;
    
    // Fix branch and company types - explicitly send undefined to prevent database defaults
    const userData = {
      ...rawUserData,
      branch: (rawUserData.branch && ['Delhi', 'Hyderabad', 'Kashmir'].includes(rawUserData.branch)) 
        ? rawUserData.branch as DatabaseUser['branch'] 
        : undefined,
      company: (rawUserData.company && ['DMHCA', 'IBMP'].includes(rawUserData.company))
        ? rawUserData.company as DatabaseUser['company']
        : undefined // Keep as undefined, but make sure backend handles this properly
    };
    
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
            <label className="block text-sm font-medium text-gray-700">Branch</label>
            <select
              value={formData.branch}
              onChange={(e) => setFormData({...formData, branch: e.target.value || ''})}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">Select Branch</option>
              <option value="Delhi">Delhi</option>
              <option value="Hyderabad">Hyderabad</option>
              <option value="Kashmir">Kashmir</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Company <span className="text-red-500">*</span></label>
            <select
              value={formData.company}
              onChange={(e) => setFormData({...formData, company: e.target.value || ''})}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              required
            >
              <option value="">Select Company</option>
              <option value="DMHCA">DMHCA</option>
              <option value="IBMP">IBMP</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Reports To (Supervisor) 
              {formData.role !== 'super_admin' ? <span className="text-red-500">*</span> : null}
              {/* DEBUG: Role = {formData.role}, isSuperAdmin = {formData.role === 'super_admin'} */}
            </label>
            <select
              value={formData.reports_to}
              onChange={(e) => setFormData({...formData, reports_to: e.target.value})}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              required={formData.role !== 'super_admin'}
            >
              <option value="">
                {formData.role === 'super_admin' ? 'No Supervisor (Optional)' : 'Select Supervisor (Required)'}
              </option>
              {users
                .filter(u => u.id !== user?.id && u.status === 'active') // Don't show current user and only active users
                .filter(u => {
                  // For super_admin, they can either have no supervisor or report to other super_admins
                  if (formData.role === 'super_admin') {
                    return u.role === 'super_admin'; // Super admins can only report to other super admins
                  }
                  
                  // For other roles, only show users with HIGHER role hierarchy (must report to someone above their level)
                  const currentUserLevel = roleHierarchy[formData.role as keyof typeof roleHierarchy]?.level || 1;
                  const supervisorLevel = roleHierarchy[u.role as keyof typeof roleHierarchy]?.level || 1;
                  return supervisorLevel > currentUserLevel; // Changed from >= to > for proper hierarchy
                })
                .map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({roleHierarchy[u.role as keyof typeof roleHierarchy]?.label || u.role}) - {u.department || 'No Department'}
                  </option>
                ))}
            </select>
            {formData.role === 'super_admin' && (
              <p className="mt-1 text-sm text-gray-500">
                Super Admins can work independently without a supervisor, or report to other Super Admins if needed.
              </p>
            )}
            {formData.role !== 'super_admin' && (
              <p className="mt-1 text-sm text-gray-500">
                All users must report to a supervisor with a higher role level.
              </p>
            )}
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

// User Detail Modal Component
interface UserDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  userData: {
    user: DatabaseUser | null;
    subordinates: any[];
    leads: any[];
    loading: boolean;
  };
  onTransferLead: (leadId: string, targetUserId: string) => void;
  roleHierarchy: any;
}

const UserDetailModal: React.FC<UserDetailModalProps> = ({
  isOpen,
  onClose,
  userData,
  onTransferLead,
  roleHierarchy
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'subordinates' | 'leads'>('overview');
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);

  if (!isOpen || !userData.user) return null;

  const { user, subordinates, leads, loading } = userData;

  const handleTransferSelectedLeads = (targetUserId: string) => {
    selectedLeads.forEach(leadId => {
      onTransferLead(leadId, targetUserId);
    });
    setSelectedLeads([]);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={onClose}></div>
        </div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
            <div className="flex items-center justify-between border-b border-gray-200 pb-4">
              <div className="flex items-center">
                <div className="flex-shrink-0 mr-4">
                  <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-xl">
                    {user.name.charAt(0)}
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{user.name}</h3>
                  <p className="text-md text-blue-600 font-semibold">@{user.username}</p>
                  <p className="text-sm text-gray-600">{user.email}</p>
                  <p className="text-sm text-blue-600 font-medium">
                    {roleHierarchy[user.role]?.label || user.role}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {/* Tabs */}
            <div className="mt-4">
              <nav className="flex space-x-8">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'overview'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('subordinates')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'subordinates'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Team ({subordinates.length})
                </button>
                <button
                  onClick={() => setActiveTab('leads')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'leads'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Leads ({leads.length})
                </button>
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="bg-gray-50 px-4 py-5 sm:p-6 max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Loading...</span>
              </div>
            ) : (
              <>
                {activeTab === 'overview' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white p-4 rounded-lg border">
                        <h4 className="font-medium text-gray-900">Contact Information</h4>
                        <div className="mt-2 space-y-2 text-sm text-gray-600">
                          <p><span className="font-medium">Email:</span> {user.email}</p>
                          <p><span className="font-medium">Phone:</span> {user.phone || 'Not provided'}</p>
                          <p><span className="font-medium">Department:</span> {user.department || 'Not specified'}</p>
                          <p><span className="font-medium">Location:</span> {user.location || 'Not specified'}</p>
                        </div>
                      </div>
                      <div className="bg-white p-4 rounded-lg border">
                        <h4 className="font-medium text-gray-900">Role & Hierarchy</h4>
                        <div className="mt-2 space-y-2 text-sm text-gray-600">
                          <p><span className="font-medium">Role:</span> {roleHierarchy[user.role]?.label || user.role}</p>
                          <p><span className="font-medium">Status:</span> 
                            <span className={`ml-1 px-2 py-1 rounded-full text-xs ${
                              user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {user.status}
                            </span>
                          </p>
                          <p><span className="font-medium">Team Size:</span> {subordinates.length} direct reports</p>
                          <p><span className="font-medium">Total Leads:</span> {leads.length}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'subordinates' && (
                  <div className="space-y-3">
                    {subordinates.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No direct reports</p>
                    ) : (
                      subordinates.map((subordinate: any) => (
                        <div key={subordinate.id} className="bg-white p-4 rounded-lg border flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full bg-gray-500 flex items-center justify-center text-white font-medium mr-3">
                              {subordinate.name.charAt(0)}
                            </div>
                            <div>
                              <h5 className="font-medium text-gray-900">{subordinate.name}</h5>
                              <p className="text-sm text-gray-600">{subordinate.email}</p>
                              <p className="text-xs text-blue-600">{roleHierarchy[subordinate.role]?.label || subordinate.role}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              subordinate.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {subordinate.status}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'leads' && (
                  <div className="space-y-3">
                    {leads.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No leads assigned</p>
                    ) : (
                      <div>
                        <div className="mb-4 flex items-center justify-between">
                          <p className="text-sm text-gray-600">
                            {selectedLeads.length > 0 && (
                              <span className="font-medium text-blue-600">
                                {selectedLeads.length} selected
                              </span>
                            )}
                          </p>
                          {selectedLeads.length > 0 && (
                            <select
                              onChange={(e) => {
                                if (e.target.value) {
                                  handleTransferSelectedLeads(e.target.value);
                                }
                              }}
                              className="text-sm border rounded px-2 py-1"
                            >
                              <option value="">Transfer selected to...</option>
                              {subordinates.map((sub: any) => (
                                <option key={sub.id} value={sub.id}>
                                  {sub.name} ({sub.role})
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                        
                        {leads.map((lead: any) => (
                          <div key={lead.id} className="bg-white p-4 rounded-lg border">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={selectedLeads.includes(lead.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedLeads([...selectedLeads, lead.id]);
                                    } else {
                                      setSelectedLeads(selectedLeads.filter(id => id !== lead.id));
                                    }
                                  }}
                                  className="mr-3"
                                />
                                <div>
                                  <h5 className="font-medium text-gray-900">{lead.fullName}</h5>
                                  <p className="text-sm text-gray-600">{lead.email}</p>
                                  <p className="text-xs text-gray-500">
                                    Status: <span className="font-medium">{lead.status}</span> | 
                                    Course: {lead.course} | 
                                    Updated: {new Date(lead.updated_at).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  lead.status === 'hot' ? 'bg-red-100 text-red-800' :
                                  lead.status === 'warm' ? 'bg-yellow-100 text-yellow-800' :
                                  lead.status === 'cold' ? 'bg-blue-100 text-blue-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {lead.status}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;