import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getApiClient } from '../lib/backend';
import { STATUS_OPTIONS, STATUS_COLORS } from '../constants/crmConstants';
import { 
  Search, 
  Filter,
  Phone,
  Mail,
  MessageSquare,
  User,
  TrendingUp,
  MoreHorizontal,
  Target,
  AlertCircle,
  Activity,
  Award,
  Zap,
  ChevronDown,
  ChevronUp,
  BarChart3
} from 'lucide-react';

interface Lead {
  id: string;
  name: string;
  fullName?: string;  // Add fullName field for API compatibility
  email: string;
  phone: string;
  course: string;
  source: string;
  status: string;
  experience: string;
  location: string;
  notes: string;
  createdAt: string;
  assignedCounselor: string;
  createdBy: string;
  company?: string;  // Company field for DMHCA/IBMP separation
  score?: number;
  lastContact?: string;
  nextFollowUp?: string;
  communicationsCount?: number;
}

const LeadsMonitoring: React.FC = () => {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const [filterSource, setFilterSource] = useState('all');
  const [sortBy, setSortBy] = useState('score');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showFilters, setShowFilters] = useState(false);

  // Monitoring stats
  const [monitoringStats, setMonitoringStats] = useState({
    totalLeads: 0,
    responseRate: 0,
    avgScore: 0,
    overdueTasks: 0,
    hotLeads: 0,
    recentConversions: 0
  });

  useEffect(() => {
    loadLeads();
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [leads, searchQuery, filterStatus, filterSource, sortBy, sortOrder]);

  const loadLeads = async () => {
    try {
      setLoading(true);
      
      // Get real data from backend API (proper architecture)
      console.log('🔍 LeadsMonitoring: Fetching leads data...');
      const apiClient = getApiClient();
      const leadsData: any = await apiClient.getLeads();
      console.log('🔍 LeadsMonitoring: Raw API response:', leadsData);
      
      // Convert API data to frontend format - handle new response format
      let leadsArray = [];
      if (leadsData && leadsData.success && leadsData.leads) {
        leadsArray = leadsData.leads;
        console.log('✅ LeadsMonitoring: Using leadsData.leads format:', leadsArray.length, 'leads');
      } else if (Array.isArray(leadsData)) {
        leadsArray = leadsData;
        console.log('✅ LeadsMonitoring: Using array format:', leadsArray.length, 'leads');
      } else {
        leadsArray = leadsData?.data || [];
        console.log('✅ LeadsMonitoring: Using leadsData.data format:', leadsArray.length, 'leads');
      }
      const formattedLeads: Lead[] = (leadsArray || []).map((lead: any) => ({
        id: lead.id || `LEAD-${Date.now()}-${Math.random().toString(36).substr(2, 3)}`,
        name: lead.fullName || lead.name || 'Unknown Lead',
        email: lead.email || '',
        phone: lead.phone || '',
        course: lead.course || 'Not specified',
        source: lead.source || 'Unknown',
        status: lead.status || 'fresh',
        experience: lead.experience || 'Not specified',
        location: lead.location || 'Not specified',
        notes: lead.notes || '',
        createdAt: lead.created_at || lead.createdAt || new Date().toISOString(),
        assignedCounselor: lead.assignedTo || lead.assignedCounselor || lead.assigned_to || 'Unassigned',
        createdBy: lead.created_by || lead.createdBy || 'System',
        score: lead.score || 0,
        lastContact: lead.last_contact || lead.lastContact || lead.updated_at || lead.updatedAt || new Date().toISOString(),
        nextFollowUp: lead.next_follow_up || lead.nextFollowUp || '',
        communicationsCount: lead.communications_count || lead.communicationsCount || 0
      }));

      setLeads(formattedLeads);
      
      // Calculate monitoring stats from real data
      const stats = {
        totalLeads: formattedLeads.length,
        responseRate: 85.2, // This would come from analytics API
        avgScore: formattedLeads.length > 0 ? 
          formattedLeads.reduce((sum, lead) => sum + (lead.score || 0), 0) / formattedLeads.length : 0,
        overdueTasks: formattedLeads.filter(lead => {
          if (!lead.nextFollowUp) return false;
          return new Date(lead.nextFollowUp) < new Date();
        }).length,
        hotLeads: formattedLeads.filter(lead => lead.status === 'hot').length,
        recentConversions: formattedLeads.filter(lead => {
          if (lead.status !== 'enrolled') return false;
          const daysDiff = (Date.now() - new Date(lead.createdAt).getTime()) / (1000 * 60 * 60 * 24);
          return daysDiff <= 7;
        }).length
      };

      setMonitoringStats(stats);
      
    } catch (error) {
      console.error('Error loading leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...leads];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(lead =>
        (lead.name || lead.fullName || '').toLowerCase().includes(query) ||
        (lead.email || '').toLowerCase().includes(query) ||
        (lead.phone || '').includes(query) ||
        (lead.course || '').toLowerCase().includes(query) ||
        (lead.location || '').toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(lead => lead.status === filterStatus);
    }



    // Apply source filter
    if (filterSource !== 'all') {
      filtered = filtered.filter(lead => lead.source === filterSource);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[sortBy as keyof Lead];
      let bValue = b[sortBy as keyof Lead];

      if (sortBy === 'score') {
        aValue = a.score || 0;
        bValue = b.score || 0;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });

    setFilteredLeads(filtered);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getStatusColor = (status: string) => {
    return STATUS_COLORS[status as keyof typeof STATUS_COLORS] || STATUS_COLORS['Not Interested'];
  };



  const isOverdue = (nextFollowUp: string) => {
    return new Date(nextFollowUp) < new Date();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50">
      {/* Header with monitoring stats */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Lead Monitoring Dashboard</h1>
            <div className="mt-1">
              <div className="bg-blue-50 border border-blue-200 px-2 py-1 rounded-md text-xs text-blue-600 font-medium inline-flex items-center">
                🔍 <span className="ml-1">Hierarchical View</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span>Analytics</span>
            </button>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Leads</p>
                <p className="text-xl font-bold text-gray-900">{monitoringStats.totalLeads}</p>
              </div>
              <User className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Response Rate</p>
                <p className="text-xl font-bold text-gray-900">{monitoringStats.responseRate}%</p>
              </div>
              <Activity className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Score</p>
                <p className="text-xl font-bold text-gray-900">{Math.round(monitoringStats.avgScore)}</p>
              </div>
              <Target className="w-8 h-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overdue Tasks</p>
                <p className="text-xl font-bold text-red-600">{monitoringStats.overdueTasks}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Hot Leads</p>
                <p className="text-xl font-bold text-orange-600">{monitoringStats.hotLeads}</p>
              </div>
              <Zap className="w-8 h-8 text-orange-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Conversions</p>
                <p className="text-xl font-bold text-emerald-600">{monitoringStats.recentConversions}</p>
              </div>
              <Award className="w-8 h-8 text-emerald-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Lead Monitoring</h3>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
            {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        <div className="flex items-center space-x-4 mb-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search leads by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="score">Sort by Score</option>
            <option value="createdAt">Sort by Date</option>
            <option value="name">Sort by Name</option>
            <option value="status">Sort by Status</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            {sortOrder === 'asc' ? <TrendingUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                {STATUS_OPTIONS.map(status => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
              <select
                value={filterSource}
                onChange={(e) => setFilterSource(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Sources</option>
                <option value="Website">Website</option>
                <option value="Facebook Ads">Facebook Ads</option>
                <option value="Google Ads">Google Ads</option>
                <option value="Education Fair">Education Fair</option>
                <option value="Referral">Referral</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lead
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Next Follow-up
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned To
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <User className="w-4 h-4 text-gray-500" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{lead.name}</div>
                        <div className="text-sm text-gray-500">{lead.email}</div>
                        <div className="text-sm text-gray-500">{lead.phone}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getScoreColor(lead.score || 0)}`}>
                      {lead.score || 0}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(lead.status)}`}>
                      {lead.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {lead.lastContact ? formatDate(lead.lastContact) : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {lead.nextFollowUp ? (
                      <div className={`text-sm ${isOverdue(lead.nextFollowUp) ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                        {formatDate(lead.nextFollowUp)}
                        {isOverdue(lead.nextFollowUp) && (
                          <span className="block text-xs text-red-500">Overdue</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">Not scheduled</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {lead.assignedCounselor}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button className="text-blue-600 hover:text-blue-900">
                        <Phone className="w-4 h-4" />
                      </button>
                      <button className="text-green-600 hover:text-green-900">
                        <Mail className="w-4 h-4" />
                      </button>
                      <button className="text-purple-600 hover:text-purple-900">
                        <MessageSquare className="w-4 h-4" />
                      </button>
                      <button className="text-gray-600 hover:text-gray-900">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredLeads.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200 mt-6">
          <Target className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No leads found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your search criteria or filters.
          </p>
        </div>
      )}
    </div>
  );
};

export default LeadsMonitoring;
