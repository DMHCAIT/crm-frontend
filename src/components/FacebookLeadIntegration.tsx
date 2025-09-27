import React, { useState, useEffect } from 'react';
import FacebookWebhookManager from './FacebookWebhookManager';
import FacebookFieldMapper from './FacebookFieldMapper';
import FacebookSetupGuide from './FacebookSetupGuide';
import { 
  Facebook, 
  Download, 
  Settings, 
  CheckCircle, 
  AlertCircle,
  Users,
  TrendingUp,
  RefreshCw,
  BookOpen,
  Zap,
  Map
} from 'lucide-react';

interface FacebookLead {
  id: string;
  created_time: string;
  field_data: Array<{
    name: string;
    values: string[];
  }>;
  ad_id: string;
  ad_name: string;
  campaign_id: string;
  campaign_name: string;
  form_id: string;
  form_name: string;
}

interface FacebookForm {
  id: string;
  name: string;
  status: string;
  leads_count: number;
}

interface IntegrationStats {
  totalLeads: number;
  todayLeads: number;
  activeForms: number;
  lastSync: string;
}

const FacebookLeadIntegration: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [accessToken, setAccessToken] = useState<string>('');
  const [pageId, setPageId] = useState<string>('');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [autoSync, setAutoSync] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [forms, setForms] = useState<FacebookForm[]>([]);
  const [stats, setStats] = useState<IntegrationStats>({
    totalLeads: 0,
    todayLeads: 0,
    activeForms: 0,
    lastSync: ''
  });
  const [selectedForms, setSelectedForms] = useState<string[]>([]);

  // Field mapping configuration
  const fieldMapping = {
    'full_name': 'name',
    'email': 'email',
    'phone_number': 'phone',
    'company_name': 'company',
    'job_title': 'designation',
    'city': 'country',
    'custom_question_1': 'branch',
    'custom_question_2': 'qualification',
    'custom_question_3': 'course'
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Settings },
    { id: 'setup', label: 'Setup Guide', icon: BookOpen },
    { id: 'mapping', label: 'Field Mapping', icon: Map },
    { id: 'webhooks', label: 'Webhooks', icon: Zap }
  ];

  useEffect(() => {
    loadSavedSettings();
  }, []);

  const loadSavedSettings = () => {
    const savedToken = localStorage.getItem('facebook_access_token');
    const savedPageId = localStorage.getItem('facebook_page_id');
    const savedAutoSync = localStorage.getItem('facebook_auto_sync');
    
    if (savedToken) {
      setAccessToken(savedToken);
      setIsConnected(true);
    }
    if (savedPageId) setPageId(savedPageId);
    if (savedAutoSync) setAutoSync(savedAutoSync === 'true');
  };

  const saveSettings = () => {
    localStorage.setItem('facebook_access_token', accessToken);
    localStorage.setItem('facebook_page_id', pageId);
    localStorage.setItem('facebook_auto_sync', autoSync.toString());
  };

  const testConnection = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${pageId}?fields=name,access_token&access_token=${accessToken}`
      );

      if (!response.ok) {
        throw new Error('Failed to connect to Facebook. Please check your credentials.');
      }

      const data = await response.json();
      setIsConnected(true);
      setSuccess(`Successfully connected to Facebook page: ${data.name}`);
      saveSettings();
      await fetchLeadForms();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed');
      setIsConnected(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeadForms = async () => {
    if (!accessToken || !pageId) return;

    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${pageId}/leadgen_forms?fields=id,name,status,leads_count&access_token=${accessToken}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch lead forms');
      }

      const data = await response.json();
      setForms(data.data || []);
      
      // Update stats
      const activeForms = data.data?.filter((form: FacebookForm) => form.status === 'ACTIVE').length || 0;
      const totalLeads = data.data?.reduce((sum: number, form: FacebookForm) => sum + form.leads_count, 0) || 0;
      
      setStats(prev => ({
        ...prev,
        activeForms,
        totalLeads
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch forms');
    }
  };

  const fetchLeadsFromForm = async (formId: string) => {
    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${formId}/leads?fields=id,created_time,field_data,ad_id,ad_name,campaign_id,campaign_name&access_token=${accessToken}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch leads');
      }

      const data = await response.json();
      return data.data || [];
    } catch (err) {
      console.error('Error fetching leads:', err);
      return [];
    }
  };

  const syncLeads = async () => {
    if (!isConnected || selectedForms.length === 0) {
      setError('Please connect to Facebook and select forms to sync');
      return;
    }

    setLoading(true);
    setError('');
    let totalImported = 0;

    try {
      for (const formId of selectedForms) {
        const fbLeads = await fetchLeadsFromForm(formId);
        
        for (const fbLead of fbLeads) {
          const mappedLead = mapFacebookLeadToCRM(fbLead);
          await submitLeadToCRM(mappedLead);
          totalImported++;
        }
      }

      setSuccess(`Successfully imported ${totalImported} leads from Facebook`);
      setStats(prev => ({
        ...prev,
        todayLeads: totalImported,
        lastSync: new Date().toISOString()
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sync leads');
    } finally {
      setLoading(false);
    }
  };

  const mapFacebookLeadToCRM = (fbLead: FacebookLead) => {
    const mappedData: any = {
      source: 'Facebook Lead Ads',
      status: 'fresh',
      priority: 'Medium',
      fbLeadId: fbLead.id,
      fbAdId: fbLead.ad_id,
      fbCampaignId: fbLead.campaign_id,
      createdAt: fbLead.created_time
    };

    // Map Facebook fields to CRM fields
    fbLead.field_data.forEach(field => {
      const crmField = fieldMapping[field.name as keyof typeof fieldMapping];
      if (crmField && field.values && field.values.length > 0) {
        mappedData[crmField] = field.values[0];
      }
    });

    return mappedData;
  };

  const submitLeadToCRM = async (leadData: any) => {
    try {
      const token = localStorage.getItem('crm_auth_token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/leads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(leadData)
      });

      if (!response.ok) {
        throw new Error('Failed to save lead to CRM');
      }

      return await response.json();
    } catch (err) {
      console.error('Error saving lead:', err);
      throw err;
    }
  };

  const toggleFormSelection = (formId: string) => {
    setSelectedForms(prev => 
      prev.includes(formId) 
        ? prev.filter(id => id !== formId)
        : [...prev, formId]
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Connection Settings Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Settings className="h-5 w-5" />
                <h3 className="text-lg font-semibold">Connection Settings</h3>
                {isConnected && (
                  <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                    Connected
                  </span>
                )}
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="accessToken" className="block text-sm font-medium text-gray-700 mb-1">
                      Facebook Access Token
                    </label>
                    <input
                      id="accessToken"
                      type="password"
                      value={accessToken}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAccessToken(e.target.value)}
                      placeholder="Enter your Facebook access token"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="pageId" className="block text-sm font-medium text-gray-700 mb-1">
                      Facebook Page ID
                    </label>
                    <input
                      id="pageId"
                      value={pageId}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPageId(e.target.value)}
                      placeholder="Enter your Facebook page ID"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="autoSync"
                    checked={autoSync}
                    onChange={(e) => setAutoSync(e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="autoSync" className="text-sm text-gray-700">
                    Enable automatic lead sync
                  </label>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={testConnection}
                    disabled={loading || !accessToken || !pageId}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Testing...' : 'Test Connection'}
                  </button>
                  {isConnected && (
                    <button
                      onClick={fetchLeadForms}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 flex items-center space-x-2"
                    >
                      <RefreshCw className="h-4 w-4" />
                      <span>Refresh Forms</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Stats Dashboard */}
            {isConnected && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <div className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Leads</p>
                      <p className="text-2xl font-bold">{stats.totalLeads}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Today's Imports</p>
                      <p className="text-2xl font-bold">{stats.todayLeads}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Active Forms</p>
                      <p className="text-2xl font-bold">{stats.activeForms}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md">
                  <div className="flex items-center space-x-2">
                    <Download className="h-5 w-5 text-orange-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Last Sync</p>
                      <p className="text-sm font-bold">
                        {stats.lastSync ? new Date(stats.lastSync).toLocaleDateString() : 'Never'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Lead Forms Management */}
            {isConnected && forms.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold">Lead Forms</h3>
                  <p className="text-sm text-gray-600">Select forms to sync leads from</p>
                </div>
                
                <div className="space-y-3">
                  {forms.map((form) => (
                    <div key={form.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={selectedForms.includes(form.id)}
                          onChange={() => toggleFormSelection(form.id)}
                          className="rounded"
                        />
                        <div>
                          <h4 className="font-medium">{form.name}</h4>
                          <p className="text-sm text-gray-600">
                            {form.leads_count} leads • Status: {form.status}
                          </p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        form.status === 'ACTIVE' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {form.status}
                      </span>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4">
                  <button 
                    onClick={syncLeads} 
                    disabled={loading || selectedForms.length === 0}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Syncing...' : `Sync ${selectedForms.length} Forms`}
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      case 'setup':
        return <FacebookSetupGuide />;
      case 'mapping':
        return <FacebookFieldMapper />;
      case 'webhooks':
        return <FacebookWebhookManager />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <Facebook className="h-8 w-8 text-blue-600" />
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Facebook Lead Integration</h2>
          <p className="text-gray-600">Import leads directly from Facebook Lead Ads</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
        
        <div className="p-6">
          {renderTabContent()}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Success Alert */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex">
            <CheckCircle className="h-5 w-5 text-green-400" />
            <div className="ml-3">
              <p className="text-sm text-green-800">{success}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacebookLeadIntegration;