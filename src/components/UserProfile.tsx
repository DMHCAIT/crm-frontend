import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getApiClient } from '../lib/backend';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Settings,
  Edit3,
  Save,
  X,
  Shield,
  Award,
  TrendingUp,
  Users,
  MessageSquare,
  Clock,
  Target,
  Activity,
  Bell,
  Key,
  Upload
} from 'lucide-react';

interface UserProfileData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  department?: string;
  location?: string;
  joinDate?: string;
  avatar?: string | null;
  status: string;
  permissions: string[];
  preferences: {
    notifications: {
      email: boolean;
      whatsapp: boolean;
      sms: boolean;
      push: boolean;
    };
    autoAssignment: boolean;
    followUpReminders: boolean;
    workingHours: {
      start: string;
      end: string;
    };
  };
}

interface PerformanceStats {
  leadsHandled: number;
  conversionRate: number;
  avgResponseTime: string;
  enrollments: number;
  leadsHandledChange: string;
  conversionRateChange: string;
  avgResponseTimeChange: string;
  enrollmentsChange: string;
}

const UserProfile: React.FC = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [performanceStats, setPerformanceStats] = useState<PerformanceStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    loadUserProfile();
    loadPerformanceStats();
    loadRecentActivity();
  }, [user]);

  const loadUserProfile = async () => {
    try {
      if (!user) {
        // No user data available
        setUserProfile(null);
        return;
      }

      // Fetch real user profile from backend API
      const apiClient = getApiClient();
      
      try {
        console.log('🔍 Fetching real user profile from API...');
        const response = await apiClient.getCurrentUser();
        
        if (response && response.user) {
          console.log('✅ Real user profile loaded:', response.user.name);
          setUserProfile(response.user);
          return;
        }
      } catch (apiError: any) {
        console.warn('⚠️ API call failed, using fallback profile:', apiError?.message || 'Unknown error');
      }

      // Fallback to enhanced user data from authentication context
      setUserProfile({
        id: user.id || 'USR-2024-001',
        name: user.name || user.email?.split('@')[0] || 'Unknown User',
        email: user.email || 'unknown@dmhca.in',
        phone: '+91 9876543210',
        role: user.role === 'super_admin' ? 'Super Administrator' :
              user.role === 'admin' ? 'Senior DMHCA Admissions Counselor' : 
              'DMHCA Admissions Counselor',
        department: 'MBBS Admissions',
        location: 'New Delhi',
        joinDate: '2023-01-15',
        avatar: null,
        status: 'active',
        permissions: user.permissions || ['leads.view', 'leads.edit', 'students.view', 'communications.send'],
        preferences: {
          notifications: {
            email: true,
            whatsapp: true,
            sms: false,
            push: true
          },
          autoAssignment: true,
          followUpReminders: true,
          workingHours: {
            start: '09:00',
            end: '18:00'
          }
        }
      });
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const loadPerformanceStats = async () => {
    try {
      const apiClient = getApiClient();
      
      // Get leads assigned to current user (in real implementation)
      // For now, get all leads and calculate sample stats
      const leadsData = await apiClient.getLeads();
      const leads = Array.isArray(leadsData) ? leadsData : [];
      
      // Calculate user performance stats
      const userLeads = leads.filter((lead: any) => 
        lead.assigned_to === user?.id || lead.assignedTo === user?.name
      );
      
      const totalLeads = userLeads.length;
      const convertedLeads = userLeads.filter((lead: any) => 
        lead.status === 'closed_won'
      ).length;
      
      const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;
      
      setPerformanceStats({
        leadsHandled: totalLeads,
        conversionRate: Math.round(conversionRate * 10) / 10,
        avgResponseTime: '2.4 hrs',
        enrollments: convertedLeads,
        leadsHandledChange: '+12%',
        conversionRateChange: totalLeads > 0 ? '+5.2%' : '0%',
        avgResponseTimeChange: '-0.8 hrs',
        enrollmentsChange: convertedLeads > 0 ? '+8%' : '0%'
      });
      
    } catch (error) {
      console.error('Error loading performance stats:', error);
      // Set default stats on error
      setPerformanceStats({
        leadsHandled: 0,
        conversionRate: 0,
        avgResponseTime: '0 hrs',
        enrollments: 0,
        leadsHandledChange: '0%',
        conversionRateChange: '0%',
        avgResponseTimeChange: '0 hrs',
        enrollmentsChange: '0%'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadRecentActivity = async () => {
    try {
      // In a real implementation, you would fetch user's recent activities
      // For now, use sample data
      setRecentActivity([
        {
          type: 'lead_assignment',
          message: 'Assigned new lead: Rahul Sharma (MBBS)',
          timestamp: '2 minutes ago',
          icon: Users,
          color: 'text-blue-600'
        },
        {
          type: 'communication',
          message: 'Sent WhatsApp follow-up to Priya Patel',
          timestamp: '15 minutes ago',
          icon: MessageSquare,
          color: 'text-green-600'
        },
        {
          type: 'conversion',
          message: 'Lead Aakash Kumar converted to student',
          timestamp: '1 hour ago',
          icon: Award,
          color: 'text-orange-600'
        },
        {
          type: 'task_completion',
          message: 'Completed follow-up call with Neha Singh',
          timestamp: '2 hours ago',
          icon: Clock,
          color: 'text-purple-600'
        }
      ]);
    } catch (error) {
      console.error('Error loading recent activity:', error);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="bg-gray-200 rounded-lg h-64 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-lg h-32"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500">
          Unable to load user profile. Please try again.
        </div>
      </div>
    );
  }

  const performanceStatsData = [
    {
      title: 'Leads Handled',
      value: performanceStats?.leadsHandled?.toString() || '0',
      change: performanceStats?.leadsHandledChange || '0%',
      icon: Users,
      color: 'bg-blue-500'
    },
    {
      title: 'Conversion Rate',
      value: `${performanceStats?.conversionRate || 0}%`,
      change: performanceStats?.conversionRateChange || '0%',
      icon: Target,
      color: 'bg-green-500'
    },
    {
      title: 'Avg Response Time',
      value: performanceStats?.avgResponseTime || '0 hrs',
      change: performanceStats?.avgResponseTimeChange || '0 hrs',
      icon: Clock,
      color: 'bg-purple-500'
    },
    {
      title: 'Enrollments',
      value: performanceStats?.enrollments?.toString() || '0',
      change: performanceStats?.enrollmentsChange || '0%',
      icon: Award,
      color: 'bg-orange-500'
    }
  ];

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'performance', label: 'Performance', icon: TrendingUp },
    { id: 'activity', label: 'Activity', icon: Activity },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">User Profile</h1>
        <p className="text-sm text-gray-500">Manage your profile and account settings</p>
      </div>

      {/* Profile Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="relative">
          {/* Cover Image */}
          <div className="h-32 bg-gradient-to-r from-blue-500 to-blue-600 rounded-t-xl"></div>
          
          {/* Profile Info */}
          <div className="px-6 pb-6">
            <div className="flex items-end -mt-16 mb-4">
              <div className="relative">
                <div className="w-24 h-24 bg-white rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                  <User className="w-12 h-12 text-gray-400" />
                </div>
                <button className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition-colors">
                  <Upload className="w-4 h-4" />
                </button>
              </div>
              <div className="ml-4 flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{userProfile.name}</h2>
                    <p className="text-gray-600">{userProfile.role}</p>
                    <p className="text-sm text-gray-500">{userProfile.department}</p>
                  </div>
                  <div className="flex space-x-2">
                    {!isEditing ? (
                      <button 
                        onClick={() => setIsEditing(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                      >
                        <Edit3 className="w-4 h-4" />
                        <span>Edit Profile</span>
                      </button>
                    ) : (
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => setIsEditing(false)}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                        >
                          <Save className="w-4 h-4" />
                          <span>Save</span>
                        </button>
                        <button 
                          onClick={() => setIsEditing(false)}
                          className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
                        >
                          <X className="w-4 h-4" />
                          <span>Cancel</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Info */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Mail className="w-4 h-4" />
                <span>{userProfile.email}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Phone className="w-4 h-4" />
                <span>{userProfile.phone}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4" />
                <span>{userProfile.location}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>Joined {userProfile.joinDate ? new Date(userProfile.joinDate).toLocaleDateString() : 'Unknown'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    defaultValue={userProfile.name}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900">{userProfile.name}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                {isEditing ? (
                  <input
                    type="email"
                    defaultValue={userProfile.email}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900">{userProfile.email}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                {isEditing ? (
                  <input
                    type="tel"
                    defaultValue={userProfile.phone}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900">{userProfile.phone}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                {isEditing ? (
                  <input
                    type="text"
                    defaultValue={userProfile.location}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900">{userProfile.location}</p>
                )}
              </div>
            </div>
          </div>

          {/* Role & Permissions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Role & Permissions</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <p className="text-gray-900 flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-blue-600" />
                  <span>{userProfile.role}</span>
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <p className="text-gray-900">{userProfile.department}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
                <div className="flex flex-wrap gap-2">
                  {userProfile.permissions.map((permission, index) => (
                    <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                      {permission.replace('.', ' ').replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Active
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'performance' && (
        <div className="space-y-6">
          {/* Performance Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {performanceStatsData.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.title} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-sm font-medium text-green-700 bg-green-100 px-2 py-1 rounded">
                      {stat.change}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
                  <p className="text-gray-500 text-sm mt-1">{stat.title}</p>
                </div>
              );
            })}
          </div>

          {/* Performance Chart Placeholder */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Trends</h3>
            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">Performance charts will be displayed here</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentActivity.map((activity, index) => {
                const Icon = activity.icon;
                return (
                  <div key={index} className="flex items-start space-x-4 p-4 rounded-lg hover:bg-gray-50 transition-colors">
                    <Icon className={`w-5 h-5 ${activity.color} mt-1`} />
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{activity.message}</p>
                      <p className="text-xs text-gray-500 mt-1">{activity.timestamp}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Notification Preferences */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Preferences</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-700">Email Notifications</span>
                </div>
                <button className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  userProfile.preferences.notifications.email ? 'bg-blue-600' : 'bg-gray-200'
                }`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    userProfile.preferences.notifications.email ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <MessageSquare className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-700">WhatsApp Notifications</span>
                </div>
                <button className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  userProfile.preferences.notifications.whatsapp ? 'bg-blue-600' : 'bg-gray-200'
                }`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    userProfile.preferences.notifications.whatsapp ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Bell className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-700">Push Notifications</span>
                </div>
                <button className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  userProfile.preferences.notifications.push ? 'bg-blue-600' : 'bg-gray-200'
                }`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    userProfile.preferences.notifications.push ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            </div>
          </div>

          {/* Account Security */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Security</h3>
            <div className="space-y-4">
              <button className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-3">
                  <Key className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-700">Change Password</span>
                </div>
                <span className="text-xs text-gray-500">Last changed 30 days ago</span>
              </button>
              <button className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-3">
                  <Shield className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-700">Two-Factor Authentication</span>
                </div>
                <span className="text-xs text-green-600">Enabled</span>
              </button>
            </div>
          </div>

          {/* Working Hours */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Working Hours</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                <input
                  type="time"
                  defaultValue={userProfile.preferences.workingHours.start}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                <input
                  type="time"
                  defaultValue={userProfile.preferences.workingHours.end}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Automation Settings */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Automation Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Auto-assignment of leads</span>
                <button className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  userProfile.preferences.autoAssignment ? 'bg-blue-600' : 'bg-gray-200'
                }`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    userProfile.preferences.autoAssignment ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Follow-up reminders</span>
                <button className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  userProfile.preferences.followUpReminders ? 'bg-blue-600' : 'bg-gray-200'
                }`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    userProfile.preferences.followUpReminders ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;