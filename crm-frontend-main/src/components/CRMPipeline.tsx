import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useLeads } from '../hooks/useQueries';
import { STATUS_COLORS, STATUS_MESSAGES } from '../constants/crmConstants';
import { 
  TrendingUp, 
  Users, 
  Target, 
  DollarSign, 
  Clock,
  Star,
  CheckCircle,
  Activity,
  Zap
} from 'lucide-react';

interface PipelineStats {
  totalLeads: number;
  newLeads: number;
  hotLeads: number;
  qualifiedLeads: number;
  convertedLeads: number;
  conversionRate: number;
  avgResponseTime: number;
  revenue: number;
  avgDealSize: number;
  monthlyGrowth: number;
}

interface LeadActivity {
  id: string;
  leadName: string;
  activity: string;
  timestamp: string;
  status: string;
  counselor: string;
  nextFollowUp?: string;
}

// Helper functions
const getActivityMessage = (status: string): string => {
  return STATUS_MESSAGES[status as keyof typeof STATUS_MESSAGES] || 'Status updated';
};

const getStatusColor = (status: string) => {
  return STATUS_COLORS[status as keyof typeof STATUS_COLORS] || STATUS_COLORS['Not Interested'];
};

const getRelativeTime = (dateString: string): string => {
  if (!dateString) return 'Unknown';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
};

const CRMPipeline: React.FC = () => {
  const { user } = useAuth();
  const { data: leadsData, isLoading: loadingLeads } = useLeads();
  const [timeRange, setTimeRange] = useState('7d');

  // ==========================================
  // OPTIMIZED PIPELINE WITH DSA TECHNIQUES
  // Real-time calculations from backend data
  // ==========================================
  
  // Pre-process leads array with deduplication
  const leadsArray = useMemo(() => {
    const leads = Array.isArray(leadsData) ? leadsData : [];
    
    // Remove duplicates using Map for O(n) deduplication
    const uniqueMap = new Map();
    leads.forEach((lead: any) => {
      if (!uniqueMap.has(lead.id)) {
        uniqueMap.set(lead.id, lead);
      }
    });
    
    return Array.from(uniqueMap.values());
  }, [leadsData]);

  // Calculate time range boundaries once
  const timeRangeBoundaries = useMemo(() => {
    const now = Date.now();
    let startTime = now;
    
    switch (timeRange) {
      case '24h':
        startTime = now - (24 * 60 * 60 * 1000);
        break;
      case '7d':
        startTime = now - (7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startTime = now - (30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startTime = now - (7 * 24 * 60 * 60 * 1000);
    }
    
    return { start: startTime, end: now };
  }, [timeRange]);

  // Calculate pipeline stats with efficient single-pass algorithm - O(n)
  const pipelineStats = useMemo((): PipelineStats => {
    console.log('🎯 CRMPipeline: Calculating stats for', leadsArray.length, 'leads');
    const startTime = performance.now();
    
    // Use Sets for O(1) status checks
    const hotStatuses = new Set(['Hot', 'hot']);
    const warmStatuses = new Set(['Warm', 'warm']);
    const qualifiedStatuses = new Set(['Qualified', 'qualified', 'Follow Up', 'follow_up', 'Warm', 'warm']);
    const convertedStatuses = new Set(['Enrolled', 'enrolled', 'won']);
    
    // Counters for single-pass algorithm
    let newLeadsCount = 0;
    let hotLeadsCount = 0;
    let qualifiedLeadsCount = 0;
    let convertedLeadsCount = 0;
    let totalRevenue = 0;
    let responseTimeSum = 0;
    let responseTimeCount = 0;
    
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    
    // Single pass O(n) through all leads
    leadsArray.forEach((lead: any) => {
      const status = lead.status;
      const createdTimestamp = new Date(lead.createdAt || lead.created_at).getTime();
      
      // Count new leads (created in last 7 days)
      if (createdTimestamp >= sevenDaysAgo) {
        newLeadsCount++;
      }
      
      // Count by status
      if (hotStatuses.has(status)) {
        hotLeadsCount++;
      }
      if (qualifiedStatuses.has(status)) {
        qualifiedLeadsCount++;
      }
      if (convertedStatuses.has(status)) {
        convertedLeadsCount++;
        // Calculate revenue from converted leads
        totalRevenue += lead.fees || lead.actualRevenue || lead.value || 0;
      }
      
      // Calculate response time
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
    
    const conversionRate = leadsArray.length > 0 
      ? (convertedLeadsCount / leadsArray.length) * 100 
      : 0;
    
    const avgDealSize = convertedLeadsCount > 0 
      ? totalRevenue / convertedLeadsCount 
      : 0;
    
    // Calculate monthly growth (comparing current month vs previous)
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
    
    let currentMonthLeads = 0;
    let prevMonthLeads = 0;
    
    leadsArray.forEach((lead: any) => {
      const created = new Date(lead.createdAt || lead.created_at).getTime();
      if (created >= currentMonthStart) {
        currentMonthLeads++;
      } else if (created >= prevMonthStart && created < currentMonthStart) {
        prevMonthLeads++;
      }
    });
    
    const monthlyGrowth = prevMonthLeads > 0 
      ? ((currentMonthLeads - prevMonthLeads) / prevMonthLeads) * 100 
      : 0;
    
    const endTime = performance.now();
    console.log(`✅ Pipeline stats calculated in ${(endTime - startTime).toFixed(2)}ms`);
    
    return {
      totalLeads: leadsArray.length,
      newLeads: newLeadsCount,
      hotLeads: hotLeadsCount,
      qualifiedLeads: qualifiedLeadsCount,
      convertedLeads: convertedLeadsCount,
      conversionRate: parseFloat(conversionRate.toFixed(2)),
      avgResponseTime: parseFloat(avgResponseTime.toFixed(1)),
      revenue: totalRevenue,
      avgDealSize: parseFloat(avgDealSize.toFixed(2)),
      monthlyGrowth: parseFloat(monthlyGrowth.toFixed(2))
    };
  }, [leadsArray]);

  // Calculate recent activities with efficient sorting - O(n log n)
  const recentActivities = useMemo((): LeadActivity[] => {
    console.log('🎯 CRMPipeline: Calculating recent activities');
    const startTime = performance.now();
    
    const { start: startTimestamp, end: endTimestamp } = timeRangeBoundaries;
    
    // Filter leads in time range, sort, and map to activities
    const activities = leadsArray
      .filter((lead: any) => {
        if (!lead.id || !(lead.fullName || lead.name)) return false;
        const lastContactTimestamp = new Date(
          lead.lastContact || lead.last_contact || lead.updatedAt || 
          lead.updated_at || lead.createdAt || lead.created_at
        ).getTime();
        return lastContactTimestamp >= startTimestamp && lastContactTimestamp <= endTimestamp;
      })
      .sort((a: any, b: any) => {
        // Sort descending by last contact/update time
        const timeA = new Date(
          a.lastContact || a.last_contact || a.updatedAt || 
          a.updated_at || a.createdAt || a.created_at
        ).getTime();
        const timeB = new Date(
          b.lastContact || b.last_contact || b.updatedAt || 
          b.updated_at || b.createdAt || b.created_at
        ).getTime();
        return timeB - timeA;
      })
      .slice(0, 5) // Take top 5
      .map((lead: any, index: number) => ({
        id: `activity-${lead.id}-${index}`,
        leadName: lead.fullName || lead.name || 'Unknown Lead',
        activity: getActivityMessage(lead.status),
        timestamp: getRelativeTime(
          lead.lastContact || lead.last_contact || lead.updatedAt || 
          lead.updated_at || lead.createdAt || lead.created_at
        ),
        status: lead.status || 'fresh',
        counselor: lead.assignedTo || lead.assignedCounselor || lead.assigned_to || 'Unassigned'
      }));
    
    // Remove duplicates using Map for O(n) deduplication
    const uniqueMap = new Map();
    activities.forEach(activity => {
      const key = `${activity.leadName}-${activity.activity}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, activity);
      }
    });
    
    const uniqueActivities = Array.from(uniqueMap.values());
    
    const endTime = performance.now();
    console.log(`✅ Recent activities calculated in ${(endTime - startTime).toFixed(2)}ms`);
    
    return uniqueActivities;
  }, [leadsArray, timeRangeBoundaries]);

  // Loading state from TanStack Query
  const loading = loadingLeads;

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-lg h-32"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">CRM Pipeline</h1>
          <p className="text-gray-600 mt-2">Monitor leads, track conversions, and manage your sales pipeline</p>
          <div className="mt-2 flex items-center space-x-2">
            <div className="bg-blue-50 border border-blue-200 rounded-md px-3 py-1.5 flex items-center space-x-2">
              <span className="text-lg">📊</span>
              <div>
                <div className="text-sm text-blue-700 font-medium">
                  {user?.role === 'super_admin' && 'All Pipeline Data'}
                  {user?.role === 'senior_manager' && 'Team Pipeline: Your + All subordinates'}
                  {user?.role === 'manager' && 'Team Pipeline: Your + Subordinate data'}
                  {user?.role === 'team_leader' && 'Team Pipeline: Your + Team data'}
                  {user?.role === 'counselor' && 'Personal Pipeline Data'}
                </div>
                {(user?.role === 'manager' || user?.role === 'senior_manager' || user?.role === 'team_leader') && (
                  <div className="text-xs text-blue-600 mt-0.5">
                    � Metrics include your reporting hierarchy
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
        </div>
        
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Zap className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Pipeline Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Leads</p>
              <p className="text-2xl font-bold text-gray-900">{pipelineStats.totalLeads}</p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
          <div className="mt-2 flex items-center">
            <span className="text-green-600 text-sm font-medium">+{pipelineStats.newLeads} new</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Hot Leads</p>
              <p className="text-2xl font-bold text-orange-600">{pipelineStats.hotLeads}</p>
            </div>
            <Star className="h-8 w-8 text-orange-600" />
          </div>
          <div className="mt-2 flex items-center">
            <span className="text-gray-600 text-sm">Immediate attention</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
              <p className="text-2xl font-bold text-green-600">{pipelineStats.conversionRate}%</p>
            </div>
            <Target className="h-8 w-8 text-green-600" />
          </div>
          <div className="mt-2 flex items-center">
            <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
            <span className="text-green-600 text-sm font-medium">+{pipelineStats.monthlyGrowth}%</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Response Time</p>
              <p className="text-2xl font-bold text-blue-600">{pipelineStats.avgResponseTime}h</p>
            </div>
            <Clock className="h-8 w-8 text-blue-600" />
          </div>
          <div className="mt-2 flex items-center">
            <span className="text-gray-600 text-sm">Average</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Revenue</p>
              <p className="text-2xl font-bold text-green-600">₹{(pipelineStats.revenue / 100000).toFixed(1)}L</p>
            </div>
            <DollarSign className="h-8 w-8 text-green-600" />
          </div>
          <div className="mt-2 flex items-center">
            <span className="text-gray-600 text-sm">₹{Math.round(pipelineStats.avgDealSize / 1000)}K avg</span>
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Recent Activities</h2>
              <p className="text-gray-600 mt-1">Latest lead interactions and updates</p>
            </div>
            <Activity className="h-6 w-6 text-gray-400" />
          </div>
        </div>
        
        <div className="p-6">
          {recentActivities.length > 0 ? (
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getStatusColor(activity.status)}`}>
                      {activity.status === 'enrolled' ? <CheckCircle className="h-5 w-5" /> :
                       activity.status === 'hot' ? <Star className="h-5 w-5" /> :
                       <Users className="h-5 w-5" />}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{activity.leadName}</p>
                      <p className="text-sm text-gray-600">{activity.activity}</p>
                      <p className="text-xs text-gray-500">by {activity.counselor}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">{activity.timestamp}</p>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(activity.status)}`}>
                      {activity.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No recent activities found</p>
              <p className="text-gray-500 text-sm mt-1">Activities will appear here as leads are updated</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CRMPipeline;
