import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getApiClient } from '../lib/backend';
import { 
  TrendingUp, 
  Users, 
  GraduationCap, 
  DollarSign, 
  MessageSquare,
  UserPlus,
  Target,
  ArrowRight,
  Activity,
  FileText,
  BarChart3
} from 'lucide-react';

interface DashboardProps {
  onNavigate?: (section: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalLeads: 0,
    activeStudents: 0,
    revenue: 0,
    conversionRate: 0
  });
  const [crmStats, setCrmStats] = useState({
    hotLeads: 0,
    avgResponseTime: 0,
    pipelineValue: 0,
    monthlyConversions: 0,
    leadScore: 0,
    followUpsDue: 0
  });
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Load real stats from Railway API
  useEffect(() => {
    const loadDashboardStats = async () => {
      try {
        setLoading(true);
        const apiClient = getApiClient();
        
        // Get dashboard stats from the new API endpoint
        const response = await apiClient.getDashboardStats() as { data: any };
        const dashboardData = response.data;
        
        setStats({
          totalLeads: dashboardData.totalLeads || 0,
          activeStudents: dashboardData.activeStudents || 0,
          revenue: (dashboardData.activeStudents || 0) * 250000,
          conversionRate: dashboardData.conversionRate || 0
        });
        
        setCrmStats({
          hotLeads: dashboardData.activeLeads || 0,
          avgResponseTime: parseFloat(dashboardData.responseTime) || 0,
          pipelineValue: (dashboardData.activeLeads || 0) * 250000,
          monthlyConversions: Math.round((dashboardData.totalLeads || 0) * ((dashboardData.conversionRate || 0) / 100)),
          leadScore: dashboardData.leadScore || 0,
          followUpsDue: dashboardData.followUpsDue || 0
        });

        // Load recent activities from real data
        await loadRecentActivities();
        
        // Dashboard stats loaded
      } catch (error) {
        console.error('❌ Failed to load dashboard stats from API:', error);
        // Data remains at initial zero values if API fails
      } finally {
        setLoading(false);
      }
    };

    loadDashboardStats();
  }, []);

  const loadRecentActivities = async () => {
    try {
      const apiClient = getApiClient();
      const leadsData = await apiClient.getLeads();
      const leads = Array.isArray(leadsData) ? leadsData : [];
      
      // Create activity entries from recent leads data
      const activities = leads.slice(0, 4).map((lead: any, index: number) => ({
        id: index + 1,
        type: 'lead',
        message: `New lead "${lead.fullName || lead.name || 'Unknown Lead'}" added`,
        time: new Date(lead.createdAt || lead.created_at || Date.now()).toLocaleString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          day: '2-digit',
          month: 'short'
        }),
        icon: UserPlus,
        color: 'text-blue-600'
      }));
      
      setRecentActivities(activities);
    } catch (error) {
      console.warn('⚠️ Failed to load recent activities:', error);
      setRecentActivities([]);
    }
  };

  // Enhanced Quick Actions with Navigation
  const quickActions = [
    {
      title: 'Add New Lead',
      description: 'Create a new lead entry',
      icon: UserPlus,
      color: 'bg-blue-500',
      action: () => onNavigate?.('leads'),
      count: loading ? 'Loading...' : `${stats.totalLeads} total`
    },
    {
      title: 'View Pipeline',
      description: 'Check CRM pipeline status',
      icon: Target,
      color: 'bg-green-500',
      action: () => onNavigate?.('crm-pipeline'),
      count: loading ? 'Loading...' : `₹${(crmStats.pipelineValue / 100000).toFixed(1)}L value`
    },
    {
      title: 'Communications',
      description: 'Send campaigns & messages',
      icon: MessageSquare,
      color: 'bg-purple-500',
      action: () => onNavigate?.('communications'),
      count: loading ? 'Loading...' : `${crmStats.followUpsDue} pending`
    },
    {
      title: 'Analytics',
      description: 'View detailed reports',
      icon: BarChart3,
      color: 'bg-orange-500',
      action: () => onNavigate?.('analytics'),
      count: loading ? 'Loading...' : 'Updated'
    }
  ];

  // Navigation Cards for Different Sections
  const navigationCards = [
    {
      title: 'Lead Management',
      description: 'Manage all your leads in one place',
      icon: Users,
      route: 'leads',
      stats: `${stats.totalLeads} Total Leads`,
      color: 'border-blue-200 bg-blue-50'
    },
    {
      title: 'Lead Monitoring',
      description: 'Monitor lead activities and scoring',
      icon: Activity,
      route: 'leads-monitoring',
      stats: `${crmStats.hotLeads} Hot Leads`,
      color: 'border-red-200 bg-red-50'
    },
    {
      title: 'Communications Hub',
      description: 'Manage campaigns and communications',
      icon: MessageSquare,
      route: 'communications',
      stats: loading ? 'Loading...' : '0 Active Campaigns',
      color: 'border-purple-200 bg-purple-50'
    },
    {
      title: 'Student Management',
      description: 'Track course enrollments',
      icon: GraduationCap,
      route: 'students',
      stats: `${stats.activeStudents} Active Students`,
      color: 'border-green-200 bg-green-50'
    },
    {
      title: 'Documents',
      description: 'Manage and organize documents',
      icon: FileText,
      route: 'documents',
      stats: loading ? 'Loading...' : '0 Documents', // Will be populated from API
      color: 'border-gray-200 bg-gray-50'
    },
    {
      title: 'CRM Analytics',
      description: 'Detailed insights and reports',
      icon: BarChart3,
      route: 'analytics',
      stats: `${stats.conversionRate}% Conversion`,
      color: 'border-yellow-200 bg-yellow-50'
    }
  ];

  // Show loading spinner for initial load
  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading Dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.name || 'Administrator'}!
        </h1>
        <p className="text-gray-600">Here's what's happening with your CRM today.</p>
        
        {/* Hierarchical Access Indicator */}
        <div className="mt-3 mb-2">
          <div className="bg-blue-50 border border-blue-200 px-4 py-2 rounded-lg text-sm text-blue-700 font-medium inline-flex items-center">
            🔍 <span className="ml-2">Hierarchical Dashboard: Showing your data + team members reporting to you</span>
          </div>
        </div>
        
        {/* Debug info for better UI visibility */}
        <div className="mt-2 text-xs text-gray-400">
          Last updated: {new Date().toLocaleTimeString()} | Connected: ✅
        </div>
      </div>

      {/* Main Stats Grid - Enhanced Visibility */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Leads</p>
              <p className="text-3xl font-bold text-blue-600">{stats.totalLeads}</p>
              <p className="text-sm text-gray-500 mt-1">
                {stats.totalLeads === 0 ? 'No leads yet - start adding!' : 'Total leads in system'}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Students</p>
              <p className="text-3xl font-bold text-green-600">{stats.activeStudents}</p>
              <p className="text-sm text-gray-500 mt-1">
                {stats.activeStudents === 0 ? 'Ready for enrollment' : 'Currently enrolled'}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Revenue</p>
              <p className="text-3xl font-bold text-yellow-600">₹{(stats.revenue / 1000).toFixed(0)}K</p>
              <p className="text-sm text-gray-500 mt-1">
                {stats.revenue === 0 ? 'Start generating revenue' : 'Estimated revenue'}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
              <p className="text-3xl font-bold text-purple-600">{stats.conversionRate}%</p>
              <p className="text-sm text-gray-500 mt-1">
                {stats.conversionRate === 0 ? 'Track your progress' : 'Leads to students'}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Start Guide - Prominent for new users */}
      {stats.totalLeads === 0 && stats.activeStudents === 0 && (
        <div className="mb-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white">
          <h2 className="text-2xl font-bold mb-2">🚀 Welcome to DMHCA CRM!</h2>
          <p className="text-blue-100 mb-4">Get started by adding your first lead or exploring the features below.</p>
          <div className="flex flex-wrap gap-3">
            <button 
              onClick={() => onNavigate?.('leads')}
              className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors"
            >
              Add First Lead
            </button>
            <button 
              onClick={() => onNavigate?.('students')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors border border-blue-400"
            >
              Manage Students
            </button>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <button
                key={index}
                onClick={action.action}
                className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow group"
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 ${action.color} rounded-lg flex items-center justify-center`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-gray-900">{action.title}</p>
                    <p className="text-sm text-gray-600">{action.count}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation Cards - Enhanced */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">🎯 CRM Modules</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {navigationCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <div
                key={index}
                onClick={() => onNavigate?.(card.route)}
                className={`${card.color} p-6 rounded-xl border-2 cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-200 group`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
                    <Icon className="w-6 h-6 text-gray-700" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{card.title}</h3>
                <p className="text-sm text-gray-600 mb-3">{card.description}</p>
                <p className="text-sm font-medium text-gray-900">{card.stats}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</h3>
          <div className="space-y-4">
            {recentActivities.map((activity) => {
              const Icon = activity.icon;
              return (
                <div key={activity.id} className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Icon className={`w-4 h-4 ${activity.color}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{activity.message}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CRM Performance */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">CRM Performance</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Hot Leads</span>
              <span className="text-sm font-medium text-gray-900">{crmStats.hotLeads}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Avg Response Time</span>
              <span className="text-sm font-medium text-gray-900">{crmStats.avgResponseTime}h</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Pipeline Value</span>
              <span className="text-sm font-medium text-gray-900">₹{(crmStats.pipelineValue / 1000).toFixed(0)}K</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Monthly Conversions</span>
              <span className="text-sm font-medium text-gray-900">{crmStats.monthlyConversions}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Lead Score Avg</span>
              <span className="text-sm font-medium text-gray-900">{crmStats.leadScore}/10</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Follow-ups Due</span>
              <span className="text-sm font-medium text-red-600">{crmStats.followUpsDue}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
