import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useDashboardStats, useLeads } from '../hooks/useQueries';
import { 
  TrendingUp, 
  Users, 
  GraduationCap, 
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
  const { data: dashboardResponse, isLoading: loadingDashboard } = useDashboardStats();
  // Get all leads for dashboard stats (using large page size to get all data)
  const { data: leadsResponse, isLoading: loadingLeads } = useLeads(1, 10000);
  
  const loading = loadingDashboard || loadingLeads;

  // ==========================================
  // OPTIMIZED CALCULATIONS WITH DSA TECHNIQUES
  // Memoize expensive calculations to prevent re-computation
  // ==========================================
  
  // Pre-process leads data once using Map for O(1) lookups
  const leadsData = useMemo(() => {
    // Handle different response formats from the paginated API
    if (leadsResponse) {
      if (Array.isArray(leadsResponse)) {
        return leadsResponse;
      }
      if ((leadsResponse as any).leads && Array.isArray((leadsResponse as any).leads)) {
        return (leadsResponse as any).leads;
      }
      if ((leadsResponse as any).data && Array.isArray((leadsResponse as any).data)) {
        return (leadsResponse as any).data;
      }
    }
    return [];
  }, [leadsResponse]);

  const leadsArray = useMemo(() => {
    return Array.isArray(leadsData) ? leadsData : [];
  }, [leadsData]);

  // Calculate stats with memoization - only recalculates when leadsArray changes
  const stats = useMemo(() => {
    console.log('📊 Dashboard: Calculating stats from', leadsArray.length, 'leads');
    const startTime = performance.now();
    
    // Use Set for O(1) lookups and counters for single-pass algorithm
    const statusCount = new Map<string, number>();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = today.getTime();
    
    let activeStudents = 0;
    let leadsUpdatedToday = 0;
    let totalRevenue = 0;
    let enrolled = 0;
    
    // Single pass O(n) algorithm instead of multiple filter operations
    leadsArray.forEach((lead: any) => {
      const status = lead.status;
      statusCount.set(status, (statusCount.get(status) || 0) + 1);
      
      // Count enrolled/active students
      if (status === 'Enrolled') {
        activeStudents++;
        enrolled++;
        // Calculate actual revenue from fees
        totalRevenue += lead.fees || lead.actualRevenue || 0;
      }
      
      // Count leads updated today
      if (lead.updatedAt) {
        const updateDate = new Date(lead.updatedAt);
        updateDate.setHours(0, 0, 0, 0);
        if (updateDate.getTime() === todayTimestamp) {
          leadsUpdatedToday++;
        }
      }
    });
    
    const conversionRate = leadsArray.length > 0 ? (enrolled / leadsArray.length) * 100 : 0;
    
    const endTime = performance.now();
    console.log(`✅ Dashboard stats calculated in ${(endTime - startTime).toFixed(2)}ms`);
    
    return {
      totalLeads: leadsArray.length,
      activeStudents,
      revenue: totalRevenue,
      conversionRate: parseFloat(conversionRate.toFixed(2)),
      leadsUpdatedToday
    };
  }, [leadsArray]);

  // Calculate CRM stats with memoization and efficient algorithms
  const crmStats = useMemo(() => {
    console.log('🔥 Dashboard: Calculating CRM stats');
    const startTime = performance.now();
    
    let hotLeads = 0;
    let warmLeads = 0;
    let followUpsDue = 0;
    let totalEstimatedValue = 0;
    let responseTimeSum = 0;
    let responseTimeCount = 0;
    
    const nowTimestamp = Date.now();
    
    // Single pass O(n) algorithm
    leadsArray.forEach((lead: any) => {
      // Count hot and warm leads
      if (lead.status === 'Hot') hotLeads++;
      if (lead.status === 'Warm') warmLeads++;
      
      // Calculate pipeline value from estimated values
      if (lead.estimatedValue) {
        totalEstimatedValue += lead.estimatedValue;
      }
      
      // Count overdue follow-ups
      if (lead.followUp && lead.status !== 'Enrolled' && lead.status !== 'Not Interested') {
        const followUpTimestamp = new Date(lead.followUp).getTime();
        if (followUpTimestamp < nowTimestamp) {
          followUpsDue++;
        }
      }
      
      // Calculate response time (time between creation and first update)
      if (lead.createdAt && lead.updatedAt) {
        const created = new Date(lead.createdAt).getTime();
        const updated = new Date(lead.updatedAt).getTime();
        const diff = updated - created;
        if (diff > 0 && diff < 30 * 24 * 60 * 60 * 1000) { // Less than 30 days
          responseTimeSum += diff;
          responseTimeCount++;
        }
      }
    });
    
    const avgResponseTime = responseTimeCount > 0 
      ? responseTimeSum / responseTimeCount / (1000 * 60 * 60) // Convert to hours
      : 0;
    
    const monthlyConversions = Math.round(stats.totalLeads * (stats.conversionRate / 100));
    
    const endTime = performance.now();
    console.log(`✅ CRM stats calculated in ${(endTime - startTime).toFixed(2)}ms`);
    
    return {
      hotLeads,
      warmLeads,
      avgResponseTime: parseFloat(avgResponseTime.toFixed(1)),
      pipelineValue: totalEstimatedValue,
      monthlyConversions,
      leadScore: hotLeads + warmLeads * 0.5, // Weighted score
      followUpsDue
    };
  }, [leadsArray, stats.totalLeads, stats.conversionRate]);

  // Memoize recent activities with efficient sorting
  const recentActivities = useMemo(() => {
    console.log('📋 Dashboard: Generating recent activities');
    
    // Sort by created date and take top 5 - O(n log n) but only once
    const sortedLeads = [...leadsArray]
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, 5);
    
    return sortedLeads.map((lead: any, index: number) => ({
      id: index + 1,
      type: 'lead',
      message: `New lead "${lead.fullName || lead.name || 'Unknown'}" added`,
      time: new Date(lead.createdAt || Date.now()).toLocaleString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: 'short'
      }),
      icon: UserPlus,
      color: 'text-blue-600'
    }));
  }, [leadsArray]);

  // All calculations are now memoized - no manual effects needed!

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
          Welcome back, {user?.name || (user as any)?.fullName || user?.username || 'User'}!
        </h1>
        <p className="text-gray-600">Here's what's happening with your CRM today.</p>
        
        {/* Hierarchical Access Indicator - Enhanced */}
        <div className="mt-3 mb-2 flex items-center space-x-2">
          <div className="bg-blue-50 border border-blue-200 rounded-md px-3 py-2 flex items-center space-x-2">
            <span className="text-lg">🏢</span>
            <div>
              <div className="text-sm text-blue-700 font-medium">
                {user?.role === 'super_admin' && 'Viewing All Organization Data'}
                {user?.role === 'senior_manager' && 'Viewing Your Team + All Subordinates'}
                {user?.role === 'manager' && 'Viewing Your Team + Subordinate Data'}
                {user?.role === 'team_leader' && 'Viewing Your + Team Member Data'}
                {user?.role === 'counselor' && 'Viewing Your Personal Data'}
              </div>
              {(user?.role === 'manager' || user?.role === 'senior_manager' || user?.role === 'team_leader') && (
                <div className="text-xs text-blue-600 mt-0.5">
                  � Dashboard metrics include your reporting hierarchy
                </div>
              )}
            </div>
          </div>
          {user?.company && (
            <div className="bg-green-50 border border-green-200 rounded-md px-2 py-1 flex items-center space-x-1">
              <span className="text-sm">🏛️</span>
              <span className="text-xs text-green-700 font-medium">{user.company}</span>
            </div>
          )}
        </div>
        
        {/* Debug info for better UI visibility */}
        <div className="mt-2 text-xs text-gray-400">
          Last updated: {new Date().toLocaleTimeString()} | Connected: ✅
        </div>
      </div>

      {/* Main Stats Grid - User-Specific Data */}
      <div className="mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Activity className="w-4 h-4" />
          <span>Showing data for: <strong>{user?.username || 'Your Account'}</strong></span>
          {user?.role !== 'super_admin' && (
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">User-Specific View</span>
          )}
          {user?.role === 'super_admin' && (
            <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">System-Wide View</span>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">My Leads</p>
              <p className="text-3xl font-bold text-blue-600">{stats.totalLeads}</p>
              <p className="text-sm text-gray-500 mt-1">
                {stats.totalLeads === 0 ? 'No leads assigned yet' : `${user?.role === 'super_admin' ? 'Total system leads' : 'Assigned to you'}`}
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
              <p className="text-sm font-medium text-gray-600">Updated Today</p>
              <p className="text-3xl font-bold text-green-600">{stats.leadsUpdatedToday}</p>
              <p className="text-sm text-gray-500 mt-1">
                {stats.leadsUpdatedToday === 0 ? 'No updates today' : `${user?.role === 'super_admin' ? 'System updates' : 'Your updates'}`}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Students</p>
              <p className="text-3xl font-bold text-yellow-600">{stats.activeStudents}</p>
              <p className="text-sm text-gray-500 mt-1">
                {stats.activeStudents === 0 ? 'Ready for enrollment' : `${user?.role === 'super_admin' ? 'Total enrolled' : 'Your enrollments'}`}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
              <p className="text-3xl font-bold text-purple-600">{stats.conversionRate}%</p>
              <p className="text-sm text-gray-500 mt-1">
                {stats.conversionRate === 0 ? 'Track your progress' : `${user?.role === 'super_admin' ? 'System average' : 'Your performance'}`}
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
