import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getApiClient } from '../lib/backend';
import { 
  Plus,
  Play,
  Pause,
  Settings,
  Mail,
  MessageSquare,
  Phone,
  Users,
  Eye,
  Edit3,
  Trash2,
  Calendar,
  Target,
  BarChart3,
  Send,
  CheckCircle,
  AlertCircle,
  Clock,
  RefreshCw,
  Filter,
  Search
} from 'lucide-react';

interface Campaign {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  description?: string;
  type: 'email' | 'sms' | 'whatsapp' | 'phone' | 'multi_channel';
  status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
  target_audience?: string;
  target_criteria?: Record<string, any>;
  subject?: string;
  content?: string;
  scheduled_at?: string;
  started_at?: string;
  completed_at?: string;
  total_recipients?: number;
  sent?: number;
  delivered?: number;
  opened?: number;
  clicked?: number;
  responded?: number;
  converted?: number;
  failed?: number;
  created_by?: string;
  is_automated?: boolean;
  tags?: string[];
}

const CampaignsManagement: React.FC = () => {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadCampaigns();
  }, [user]);

  const loadCampaigns = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const apiClient = getApiClient();
      const campaignsData = await apiClient.getCampaigns();
      setCampaigns(Array.isArray(campaignsData) ? campaignsData : []);
    } catch (error) {
      console.error('Error loading campaigns:', error);
      // Fallback sample data for development
      setCampaigns([
        {
          id: '1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          name: 'Fellowship Program Launch',
          description: 'Promoting new fellowship programs to qualified leads',
          type: 'email',
          status: 'active',
          target_audience: 'Qualified Medical Professionals',
          subject: 'Advanced Fellowship Programs Now Available',
          total_recipients: 1250,
          sent: 1250,
          delivered: 1198,
          opened: 456,
          clicked: 89,
          responded: 23,
          converted: 12,
          failed: 52,
          created_by: user?.id,
          is_automated: false,
          tags: ['fellowship', 'medical', 'education']
        },
        {
          id: '2',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          name: 'Follow-up WhatsApp Campaign',
          description: 'Automated follow-up messages for warm leads',
          type: 'whatsapp',
          status: 'active',
          target_audience: 'Warm Leads',
          total_recipients: 340,
          sent: 340,
          delivered: 338,
          opened: 287,
          clicked: 45,
          responded: 67,
          converted: 8,
          failed: 2,
          created_by: user?.id,
          is_automated: true,
          tags: ['follow-up', 'automation', 'whatsapp']
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'draft':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email':
        return Mail;
      case 'sms':
        return MessageSquare;
      case 'whatsapp':
        return MessageSquare;
      case 'phone':
        return Phone;
      case 'multi_channel':
        return Users;
      default:
        return Mail;
    }
  };

  const calculateMetrics = (campaign: Campaign) => {
    const deliveryRate = campaign.total_recipients ? 
      ((campaign.delivered || 0) / campaign.total_recipients * 100).toFixed(1) : '0';
    const openRate = campaign.delivered ? 
      ((campaign.opened || 0) / campaign.delivered * 100).toFixed(1) : '0';
    const clickRate = campaign.opened ? 
      ((campaign.clicked || 0) / campaign.opened * 100).toFixed(1) : '0';
    const conversionRate = campaign.total_recipients ? 
      ((campaign.converted || 0) / campaign.total_recipients * 100).toFixed(1) : '0';
    
    return { deliveryRate, openRate, clickRate, conversionRate };
  };

  const handleLaunchCampaign = async (campaignId: string) => {
    try {
      const apiClient = getApiClient();
      await apiClient.launchCampaign(campaignId);
      loadCampaigns(); // Reload to get updated status
    } catch (error) {
      console.error('Error launching campaign:', error);
    }
  };

  const handleDeleteCampaign = async (campaignId: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return;
    
    try {
      const apiClient = getApiClient();
      await apiClient.deleteCampaign(campaignId);
      loadCampaigns(); // Reload campaigns
    } catch (error) {
      console.error('Error deleting campaign:', error);
    }
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesFilter = activeFilter === 'all' || campaign.status === activeFilter;
    const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (campaign.description && campaign.description.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const filters = [
    { id: 'all', label: 'All Campaigns', count: campaigns.length },
    { id: 'active', label: 'Active', count: campaigns.filter(c => c.status === 'active').length },
    { id: 'draft', label: 'Draft', count: campaigns.filter(c => c.status === 'draft').length },
    { id: 'completed', label: 'Completed', count: campaigns.filter(c => c.status === 'completed').length }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
            <span className="ml-3 text-gray-600">Loading campaigns...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Campaign Management</h1>
              <p className="text-gray-600 mt-2">Create and manage marketing campaigns across all channels</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
              >
                <Plus className="w-5 h-5" />
                <span>Create Campaign</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Campaigns</p>
                <p className="text-2xl font-bold text-gray-900">{campaigns.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Campaigns</p>
                <p className="text-2xl font-bold text-gray-900">
                  {campaigns.filter(c => c.status === 'active').length}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Play className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Recipients</p>
                <p className="text-2xl font-bold text-gray-900">
                  {campaigns.reduce((sum, c) => sum + (c.total_recipients || 0), 0).toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg. Conversion</p>
                <p className="text-2xl font-bold text-gray-900">
                  {campaigns.length > 0 ? 
                    ((campaigns.reduce((sum, c) => sum + (c.converted || 0), 0) / 
                      campaigns.reduce((sum, c) => sum + (c.total_recipients || 0), 0)) * 100).toFixed(1) : '0'}%
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <Target className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-1">
                {filters.map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => setActiveFilter(filter.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                      activeFilter === filter.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {filter.label} ({filter.count})
                  </button>
                ))}
              </div>

              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search campaigns..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Campaigns List */}
        <div className="space-y-6">
          {filteredCampaigns.map((campaign) => {
            const metrics = calculateMetrics(campaign);
            const TypeIcon = getTypeIcon(campaign.type);

            return (
              <div key={campaign.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <TypeIcon className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{campaign.name}</h3>
                      <p className="text-gray-600 mt-1">{campaign.description}</p>
                      <div className="flex items-center space-x-4 mt-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(campaign.status)}`}>
                          {campaign.status.toUpperCase()}
                        </span>
                        <span className="text-sm text-gray-500">
                          {campaign.type.replace('_', ' ').toUpperCase()}
                        </span>
                        {campaign.is_automated && (
                          <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-700 rounded-full">
                            AUTOMATED
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {campaign.status === 'draft' && (
                      <button
                        onClick={() => handleLaunchCampaign(campaign.id)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                        title="Launch Campaign"
                      >
                        <Play className="w-5 h-5" />
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedCampaign(campaign)}
                      className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                      title="View Details"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedCampaign(campaign);
                        setShowEditModal(true);
                      }}
                      className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                      title="Edit Campaign"
                    >
                      <Edit3 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteCampaign(campaign.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      title="Delete Campaign"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Campaign Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6 pt-6 border-t border-gray-200">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{(campaign.total_recipients || 0).toLocaleString()}</p>
                    <p className="text-sm text-gray-500">Recipients</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{metrics.deliveryRate}%</p>
                    <p className="text-sm text-gray-500">Delivered</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{metrics.openRate}%</p>
                    <p className="text-sm text-gray-500">Opened</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">{metrics.clickRate}%</p>
                    <p className="text-sm text-gray-500">Clicked</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-orange-600">{metrics.conversionRate}%</p>
                    <p className="text-sm text-gray-500">Converted</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredCampaigns.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
            <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Campaigns Found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || activeFilter !== 'all' 
                ? 'No campaigns match your current filters.'
                : 'Get started by creating your first marketing campaign.'
              }
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create Campaign
            </button>
          </div>
        )}

        {/* Create Campaign Modal - Placeholder */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
              <h2 className="text-xl font-bold mb-4">Create New Campaign</h2>
              <p className="text-gray-600 mb-4">Campaign creation form would go here...</p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Campaign
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CampaignsManagement;