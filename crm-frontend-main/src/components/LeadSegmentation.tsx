import React, { useState, useMemo } from 'react';
import { useLeads } from '../hooks/useQueries';
import { useCunnektWhatsApp } from '../hooks/useCunnektWhatsApp';
import { 
  Filter, 
  Download, 
  Send, 
  Users, 
  Calendar,
  GraduationCap,
  MapPin,
  BookOpen,
  Clock,
  CheckSquare,
  Copy,
  ExternalLink,
  Smartphone,
  Sparkles,
  Save,
  Trash2,
  Edit2,
  Zap,
  MessageSquare,
  FileText,
  Plus,
  MessageCircle,
  RefreshCw
} from 'lucide-react';
import { useNotify } from './NotificationSystem';

interface Lead {
  id: string;
  name?: string;
  fullName?: string;
  phone?: string;
  whatsapp?: string;
  alternatePhone?: string;
  email?: string;
  country?: string;
  qualification?: string;
  course?: string;
  status?: string;
  createdAt?: string;
  created_at?: string;
}

interface SegmentFilters {
  countries: string[];
  qualifications: string[];
  courses: string[];
  leadAge: string; // '0-7', '8-30', '31-90', '90+', 'all'
  status: string[];
}

interface MessageTemplate {
  id: string;
  name: string;
  message: string;
  category: string;
  variables: string[];
  createdAt: string;
  lastUsed?: string;
}

interface Campaign {
  id: string;
  name: string;
  templateId: string;
  segmentFilters: SegmentFilters;
  targetLeads: number;
  status: 'draft' | 'scheduled' | 'sent' | 'failed';
  createdAt: string;
  scheduledAt?: string;
  sentAt?: string;
  successCount?: number;
  failedCount?: number;
}

const LeadSegmentation: React.FC = () => {
  const notify = useNotify();
  const { sendBulk, testConnection, campaigns, responses, saveCampaign } = useCunnektWhatsApp();
  
  // Fetch ALL leads without pagination for accurate segmentation
  // Use 50000 as the maximum safe page size (server-capped)
  const { data: leadsData, isLoading } = useLeads(1, 50000, {});
  const allLeads = (leadsData?.leads || leadsData?.data || []) as Lead[];

  // Filter states
  const [filters, setFilters] = useState<SegmentFilters>({
    countries: [],
    qualifications: [],
    courses: [],
    leadAge: 'all',
    status: []
  });

  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [whatsappMessage, setWhatsappMessage] = useState('');
  
  // Advanced Marketing States
  const [showAdvancedSection, setShowAdvancedSection] = useState(false);
  const [activeTab, setActiveTab] = useState<'templates' | 'campaigns' | 'responses'>('templates');
  const [templates, setTemplates] = useState<MessageTemplate[]>([
    {
      id: '1',
      name: 'Course Interest Follow-up',
      message: 'Hi {name}! 👋\n\nWe noticed you showed interest in {course}. Our program is perfect for {qualification} graduates.\n\nWould you like to schedule a free consultation?',
      category: 'follow-up',
      variables: ['name', 'course', 'qualification'],
      createdAt: new Date().toISOString()
    },
    {
      id: '2',
      name: 'Re-engagement Campaign',
      message: 'Hello {name},\n\nIt\'s been a while since we last connected. We have exciting updates about {course} that might interest you!\n\nLet us know if you\'d like more information.',
      category: 'reengagement',
      variables: ['name', 'course'],
      createdAt: new Date().toISOString()
    }
  ]);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    message: '',
    category: 'general'
  });
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    templateId: '',
    scheduledAt: ''
  });

  // Calculate lead age in days
  const getLeadAgeDays = (lead: Lead): number => {
    const createdDate = new Date(lead.createdAt || lead.created_at || new Date());
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - createdDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Get unique values for filters
  const uniqueCountries = useMemo(() => {
    const countries = allLeads
      .map(l => l.country)
      .filter(Boolean)
      .filter((v, i, a) => a.indexOf(v) === i)
      .sort();
    return countries as string[];
  }, [allLeads]);

  const uniqueQualifications = useMemo(() => {
    const qualifications = allLeads
      .map(l => l.qualification)
      .filter(Boolean)
      .filter((v, i, a) => a.indexOf(v) === i)
      .sort();
    return qualifications as string[];
  }, [allLeads]);

  const uniqueCourses = useMemo(() => {
    const courses = allLeads
      .map(l => l.course)
      .filter(Boolean)
      .filter((v, i, a) => a.indexOf(v) === i)
      .sort();
    return courses as string[];
  }, [allLeads]);

  const uniqueStatuses = useMemo(() => {
    const statuses = allLeads
      .map(l => l.status)
      .filter(Boolean)
      .filter((v, i, a) => a.indexOf(v) === i)
      .sort();
    return statuses as string[];
  }, [allLeads]);

  // Filter leads based on selected criteria
  const filteredLeads = useMemo(() => {
    return allLeads.filter(lead => {
      // Country filter
      if (filters.countries.length > 0 && !filters.countries.includes(lead.country || '')) {
        return false;
      }

      // Qualification filter
      if (filters.qualifications.length > 0 && !filters.qualifications.includes(lead.qualification || '')) {
        return false;
      }

      // Course filter
      if (filters.courses.length > 0 && !filters.courses.includes(lead.course || '')) {
        return false;
      }

      // Status filter
      if (filters.status.length > 0 && !filters.status.includes(lead.status || '')) {
        return false;
      }

      // Lead age filter
      if (filters.leadAge !== 'all') {
        const ageDays = getLeadAgeDays(lead);
        switch (filters.leadAge) {
          case '0-7':
            if (ageDays > 7) return false;
            break;
          case '8-30':
            if (ageDays < 8 || ageDays > 30) return false;
            break;
          case '31-90':
            if (ageDays < 31 || ageDays > 90) return false;
            break;
          case '90+':
            if (ageDays < 90) return false;
            break;
        }
      }

      return true;
    });
  }, [allLeads, filters]);

  // Segmentation statistics
  const segmentStats = useMemo(() => {
    const stats: any = {
      byCountry: {},
      byQualification: {},
      byCourse: {},
      byLeadAge: {
        '0-7 days': 0,
        '8-30 days': 0,
        '31-90 days': 0,
        '90+ days': 0
      },
      byStatus: {}
    };

    filteredLeads.forEach(lead => {
      // Country stats
      if (lead.country) {
        stats.byCountry[lead.country] = (stats.byCountry[lead.country] || 0) + 1;
      }

      // Qualification stats
      if (lead.qualification) {
        stats.byQualification[lead.qualification] = (stats.byQualification[lead.qualification] || 0) + 1;
      }

      // Course stats
      if (lead.course) {
        stats.byCourse[lead.course] = (stats.byCourse[lead.course] || 0) + 1;
      }

      // Status stats
      if (lead.status) {
        stats.byStatus[lead.status] = (stats.byStatus[lead.status] || 0) + 1;
      }

      // Lead age stats
      const ageDays = getLeadAgeDays(lead);
      if (ageDays <= 7) {
        stats.byLeadAge['0-7 days']++;
      } else if (ageDays <= 30) {
        stats.byLeadAge['8-30 days']++;
      } else if (ageDays <= 90) {
        stats.byLeadAge['31-90 days']++;
      } else {
        stats.byLeadAge['90+ days']++;
      }
    });

    return stats;
  }, [filteredLeads]);

  // Toggle filter selection
  const toggleFilter = (filterType: keyof SegmentFilters, value: string) => {
    setFilters(prev => {
      const currentArray = prev[filterType] as string[];
      if (currentArray.includes(value)) {
        return {
          ...prev,
          [filterType]: currentArray.filter(v => v !== value)
        };
      } else {
        return {
          ...prev,
          [filterType]: [...currentArray, value]
        };
      }
    });
  };

  // Select/Deselect all leads
  const toggleSelectAll = () => {
    if (selectedLeads.length === filteredLeads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(filteredLeads.map(l => l.id));
    }
  };

  // Toggle individual lead selection
  const toggleLeadSelection = (leadId: string) => {
    if (selectedLeads.includes(leadId)) {
      setSelectedLeads(selectedLeads.filter(id => id !== leadId));
    } else {
      setSelectedLeads([...selectedLeads, leadId]);
    }
  };

  // Export selected leads as CSV
  const exportToCSV = () => {
    const leadsToExport = filteredLeads.filter(l => selectedLeads.includes(l.id));
    
    if (leadsToExport.length === 0) {
      notify.error('No Leads Selected', 'Please select at least one lead to export');
      return;
    }

    const headers = ['Name', 'Phone', 'Email', 'Country', 'Qualification', 'Course', 'Status', 'Lead Age (Days)'];
    const rows = leadsToExport.map(lead => [
      lead.name || lead.fullName || '',
      lead.phone || '',
      lead.email || '',
      lead.country || '',
      lead.qualification || '',
      lead.course || '',
      lead.status || '',
      getLeadAgeDays(lead).toString()
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lead-segment-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    notify.success('Export Successful', `${leadsToExport.length} leads exported to CSV`);
  };

  // Copy phone numbers for WhatsApp
  const copyPhoneNumbers = () => {
    const leadsToExport = filteredLeads.filter(l => selectedLeads.includes(l.id));
    
    // Get all available phone numbers (WhatsApp preferred, then phone, then alternate)
    const phoneNumbers = leadsToExport
      .map(l => {
        const phones = [];
        // Priority 1: WhatsApp number (most likely to work)
        if (l.whatsapp) phones.push(l.whatsapp);
        // Priority 2: Primary phone
        if (l.phone && l.phone !== l.whatsapp) phones.push(l.phone);
        // Priority 3: Alternate phone
        if (l.alternatePhone && l.alternatePhone !== l.phone && l.alternatePhone !== l.whatsapp) {
          phones.push(l.alternatePhone);
        }
        return phones.length > 0 ? phones.join(', ') : null;
      })
      .filter(Boolean)
      .join('\n');

    if (!phoneNumbers) {
      notify.error('No Phone Numbers', 'Selected leads have no phone numbers');
      return;
    }

    navigator.clipboard.writeText(phoneNumbers);
    const leadCount = phoneNumbers.split('\n').length;
    notify.success('Copied!', `${leadCount} phone numbers copied to clipboard (WhatsApp numbers prioritized)`);
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      countries: [],
      qualifications: [],
      courses: [],
      leadAge: 'all',
      status: []
    });
    setSelectedLeads([]);
  };

  // Template Management Functions
  const saveTemplate = () => {
    if (!newTemplate.name || !newTemplate.message) {
      notify.error('Please fill in template name and message');
      return;
    }

    const variables = extractVariables(newTemplate.message);
    
    if (editingTemplate) {
      setTemplates(templates.map(t => 
        t.id === editingTemplate.id 
          ? { ...t, ...newTemplate, variables }
          : t
      ));
      notify.success('Template updated successfully');
    } else {
      const template: MessageTemplate = {
        id: Date.now().toString(),
        ...newTemplate,
        variables,
        createdAt: new Date().toISOString()
      };
      setTemplates([...templates, template]);
      notify.success('Template created successfully');
    }
    
    setShowTemplateModal(false);
    setEditingTemplate(null);
    setNewTemplate({ name: '', message: '', category: 'general' });
  };

  const deleteTemplate = (id: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      setTemplates(templates.filter(t => t.id !== id));
      notify.success('Template deleted');
    }
  };

  const editTemplate = (template: MessageTemplate) => {
    setEditingTemplate(template);
    setNewTemplate({
      name: template.name,
      message: template.message,
      category: template.category
    });
    setShowTemplateModal(true);
  };

  const extractVariables = (message: string): string[] => {
    const matches = message.match(/\{([^}]+)\}/g);
    return matches ? matches.map(m => m.slice(1, -1)) : [];
  };

  // Campaign Management Functions
  const createCampaign = async () => {
    if (!newCampaign.name || !newCampaign.templateId) {
      notify.error('Please fill in campaign name and select a template');
      return;
    }

    const campaign: Campaign = {
      id: Date.now().toString(),
      name: newCampaign.name,
      templateId: newCampaign.templateId,
      segmentFilters: { ...filters },
      targetLeads: selectedLeads.length,
      status: newCampaign.scheduledAt ? 'scheduled' : 'draft',
      createdAt: new Date().toISOString(),
      scheduledAt: newCampaign.scheduledAt || undefined
    };

    // Save campaign to database
    try {
      await saveCampaign.mutateAsync({
        name: campaign.name,
        template: templates.find(t => t.id === campaign.templateId)?.message || '',
        segmentFilters: campaign.segmentFilters,
        leadCount: campaign.targetLeads
      });
      notify.success('Campaign created successfully');
    } catch (error) {
      console.error('Save campaign error:', error);
      notify.error('Failed to save campaign');
    }
    
    setShowCampaignModal(false);
    setNewCampaign({ name: '', templateId: '', scheduledAt: '' });
  };
  const publishCampaign = async (campaignId: string) => {
    const campaign = (campaigns.data?.campaigns || []).find((c: any) => c.id === campaignId);
    if (!campaign) return;

    // Get leads with valid phone/WhatsApp numbers
    const selectedLeadsData = filteredLeads.filter(lead => {
      if (!selectedLeads.includes(lead.id)) return false;
      // Include if they have WhatsApp, phone, or alternate phone
      return lead.whatsapp || lead.phone || lead.alternatePhone;
    });
    
    const template = templates.find(t => t.id === campaign.templateId);
    
    if (!template) {
      notify.error('Template not found');
      return;
    }

    if (selectedLeadsData.length === 0) {
      notify.error('No leads with valid phone numbers');
      return;
    }

    // Show confirmation
    if (!confirm(`Send WhatsApp campaign to ${selectedLeadsData.length} leads via Cunnekt API?`)) {
      return;
    }

    notify.info('Sending Campaign', `Sending messages to ${selectedLeadsData.length} leads...`);

    try {
      // Send via Cunnekt API
      const result = await sendBulk.mutateAsync({
        leads: selectedLeadsData,
        message: template.message,
        campaignId: campaignId
      });

      // Update template last used
      setTemplates(templates.map(t => 
        t.id === campaign.templateId 
          ? { ...t, lastUsed: new Date().toISOString() }
          : t
      ));

      // Refetch campaigns to get updated status
      campaigns.refetch();

      notify.success(
        'Campaign Published!', 
        `✅ ${result.results.success} sent, ❌ ${result.results.failed} failed`
      );

      // Copy results for user review
      const resultText = result.results.details
        .map((d: any) => `${d.name} (${d.phone}): ${d.status}${d.error ? ' - ' + d.error : ''}`)
        .join('\n');
      
      navigator.clipboard.writeText(resultText);
      notify.info('Results copied to clipboard');

    } catch (error: any) {
      console.error('Campaign publish error:', error);
      
      // Refetch to update status
      campaigns.refetch();

      notify.error('Campaign Failed', error.message || 'Failed to send messages');
    }
  };

  const deleteCampaign = async (id: string) => {
    if (confirm('Are you sure you want to delete this campaign?')) {
      // TODO: Add delete campaign API endpoint
      notify.success('Campaign deleted');
      campaigns.refetch();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading leads...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Lead Segmentation & Remarketing</h1>
        <p className="text-gray-600">Segment leads by country, qualification, course, and age for targeted WhatsApp campaigns</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Leads</p>
              <p className="text-2xl font-bold text-gray-900">{allLeads.length}</p>
            </div>
            <Users className="w-10 h-10 text-blue-500 opacity-20" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Filtered Leads</p>
              <p className="text-2xl font-bold text-blue-600">{filteredLeads.length}</p>
            </div>
            <Filter className="w-10 h-10 text-blue-500 opacity-20" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Selected</p>
              <p className="text-2xl font-bold text-green-600">{selectedLeads.length}</p>
            </div>
            <CheckSquare className="w-10 h-10 text-green-500 opacity-20" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">With Contact</p>
              <p className="text-2xl font-bold text-purple-600">
                {filteredLeads.filter(l => selectedLeads.includes(l.id) && (l.whatsapp || l.phone || l.alternatePhone)).length}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                WhatsApp: {filteredLeads.filter(l => selectedLeads.includes(l.id) && l.whatsapp).length}
              </p>
            </div>
            <Smartphone className="w-10 h-10 text-purple-500 opacity-20" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Filters Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <Filter className="w-5 h-5 mr-2 text-blue-600" />
                Segment Filters
              </h2>
              <button
                onClick={clearFilters}
                className="text-sm text-red-600 hover:text-red-700 font-medium"
              >
                Clear All
              </button>
            </div>

            {/* Lead Age Filter */}
            <div className="mb-6">
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4 mr-2 text-gray-500" />
                Lead Age
              </label>
              <select
                value={filters.leadAge}
                onChange={(e) => setFilters({...filters, leadAge: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Ages</option>
                <option value="0-7">Fresh (0-7 days)</option>
                <option value="8-30">Recent (8-30 days)</option>
                <option value="31-90">Warm (31-90 days)</option>
                <option value="90+">Cold (90+ days)</option>
              </select>
            </div>

            {/* Country Filter */}
            <div className="mb-6">
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                Country ({filters.countries.length} selected)
              </label>
              <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2 space-y-1">
                {uniqueCountries.map(country => (
                  <label key={country} className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.countries.includes(country)}
                      onChange={() => toggleFilter('countries', country)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{country}</span>
                    <span className="ml-auto text-xs text-gray-500">
                      ({allLeads.filter(l => l.country === country).length})
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Qualification Filter */}
            <div className="mb-6">
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <GraduationCap className="w-4 h-4 mr-2 text-gray-500" />
                Qualification ({filters.qualifications.length} selected)
              </label>
              <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2 space-y-1">
                {uniqueQualifications.map(qual => (
                  <label key={qual} className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.qualifications.includes(qual)}
                      onChange={() => toggleFilter('qualifications', qual)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{qual}</span>
                    <span className="ml-auto text-xs text-gray-500">
                      ({allLeads.filter(l => l.qualification === qual).length})
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Course Filter */}
            <div className="mb-6">
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <BookOpen className="w-4 h-4 mr-2 text-gray-500" />
                Course Interested ({filters.courses.length} selected)
              </label>
              <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2 space-y-1">
                {uniqueCourses.map(course => (
                  <label key={course} className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.courses.includes(course)}
                      onChange={() => toggleFilter('courses', course)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{course}</span>
                    <span className="ml-auto text-xs text-gray-500">
                      ({allLeads.filter(l => l.course === course).length})
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Status Filter */}
            <div className="mb-6">
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <Filter className="w-4 h-4 mr-2 text-gray-500" />
                Status ({filters.status.length} selected)
              </label>
              <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2 space-y-1">
                {uniqueStatuses.map(status => (
                  <label key={status} className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.status.includes(status)}
                      onChange={() => toggleFilter('status', status)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{status}</span>
                    <span className="ml-auto text-xs text-gray-500">
                      ({allLeads.filter(l => l.status === status).length})
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-2">
          {/* Statistics */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Segmentation Statistics</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* By Lead Age */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  By Lead Age
                </h4>
                <div className="space-y-2">
                  {Object.entries(segmentStats.byLeadAge).map(([age, count]) => (
                    <div key={age} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{age}</span>
                      <span className="text-sm font-medium text-gray-900">{count as number}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* By Status */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">By Status</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {Object.entries(segmentStats.byStatus)
                    .sort((a, b) => (b[1] as number) - (a[1] as number))
                    .slice(0, 5)
                    .map(([status, count]) => (
                      <div key={status} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{status}</span>
                        <span className="text-sm font-medium text-gray-900">{count as number}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex flex-wrap gap-3">
              <button
                onClick={toggleSelectAll}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <CheckSquare className="w-4 h-4 mr-2" />
                {selectedLeads.length === filteredLeads.length ? 'Deselect All' : 'Select All'}
              </button>

              <button
                onClick={exportToCSV}
                disabled={selectedLeads.length === 0}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV ({selectedLeads.length})
              </button>

              <button
                onClick={copyPhoneNumbers}
                disabled={selectedLeads.length === 0}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Phones
              </button>

              <button
                onClick={() => testConnection.refetch()}
                disabled={testConnection.isFetching}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center disabled:opacity-50"
              >
                <Smartphone className="w-4 h-4 mr-2" />
                {testConnection.isFetching ? 'Testing...' : 'Test Cunnekt API'}
              </button>

              <button
                onClick={() => setShowAdvancedSection(!showAdvancedSection)}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all flex items-center ml-auto"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Advanced Marketing
              </button>
            </div>
            
            {/* Connection Status */}
            {testConnection.data && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  ✅ {testConnection.data.message}
                </p>
              </div>
            )}
            {testConnection.error && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">
                  ❌ Connection failed: {(testConnection.error as any).message}
                </p>
              </div>
            )}
          </div>

          {/* Advanced Marketing Section */}
          {showAdvancedSection && (
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg shadow-lg border-2 border-purple-200 p-6 mb-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <Sparkles className="w-6 h-6 text-purple-600 mr-2" />
                  <h2 className="text-2xl font-bold text-gray-900">Advanced Marketing Hub</h2>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setActiveTab('templates')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      activeTab === 'templates'
                        ? 'bg-purple-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-purple-100'
                    }`}
                  >
                    <MessageSquare className="w-4 h-4 inline mr-2" />
                    Templates
                  </button>
                  <button
                    onClick={() => setActiveTab('campaigns')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      activeTab === 'campaigns'
                        ? 'bg-purple-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-purple-100'
                    }`}
                  >
                    <Zap className="w-4 h-4 inline mr-2" />
                    Campaigns
                  </button>
                  <button
                    onClick={() => setActiveTab('responses')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      activeTab === 'responses'
                        ? 'bg-purple-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-purple-100'
                    }`}
                  >
                    <MessageCircle className="w-4 h-4 inline mr-2" />
                    Responses
                    {responses?.data?.responses?.length > 0 && (
                      <span className="ml-1 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                        {responses.data.responses.length}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Templates Tab */}
              {activeTab === 'templates' && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Message Templates</h3>
                    <button
                      onClick={() => {
                        setEditingTemplate(null);
                        setNewTemplate({ name: '', message: '', category: 'general' });
                        setShowTemplateModal(true);
                      }}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      New Template
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {templates.map(template => (
                      <div key={template.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-semibold text-gray-900">{template.name}</h4>
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{template.category}</span>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => editTemplate(template)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteTemplate(template.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap line-clamp-3">{template.message}</p>
                        <div className="mt-3 flex flex-wrap gap-1">
                          {template.variables.map(v => (
                            <span key={v} className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                              {'{'+v+'}'}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Campaigns Tab */}
              {activeTab === 'campaigns' && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Marketing Campaigns</h3>
                    <button
                      onClick={() => setShowCampaignModal(true)}
                      disabled={selectedLeads.length === 0}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Campaign
                    </button>
                  </div>

                  {campaigns.isLoading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                      <p className="mt-4 text-gray-600">Loading campaigns...</p>
                    </div>
                  ) : (campaigns.data?.campaigns || []).length === 0 ? (
                    <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
                      <Zap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-2">No campaigns created yet</p>
                      <p className="text-sm text-gray-500">Create your first campaign to start remarketing</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {(campaigns.data?.campaigns || []).map((campaign: any) => {
                        const template = templates.find(t => t.id === campaign.templateId);
                        return (
                          <div key={campaign.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-2">
                                  <h4 className="font-semibold text-gray-900">{campaign.name}</h4>
                                  <span className={`text-xs px-2 py-1 rounded-full ${
                                    campaign.status === 'sent' ? 'bg-green-100 text-green-700' :
                                    campaign.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                                    campaign.status === 'failed' ? 'bg-red-100 text-red-700' :
                                    'bg-gray-100 text-gray-700'
                                  }`}>
                                    {campaign.status}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600">Template: {template?.name || 'Unknown'}</p>
                                <p className="text-sm text-gray-600">Target Leads: {campaign.targetLeads}</p>
                                {campaign.successCount !== undefined && (
                                  <div className="mt-2 space-y-1">
                                    <p className="text-sm text-green-600">✅ Sent: {campaign.successCount}</p>
                                    {campaign.failedCount !== undefined && campaign.failedCount > 0 && (
                                      <p className="text-sm text-red-600">❌ Failed: {campaign.failedCount}</p>
                                    )}
                                  </div>
                                )}
                              </div>
                              <div className="flex space-x-2">
                                {campaign.status === 'draft' || campaign.status === 'scheduled' ? (
                                  <button
                                    onClick={() => publishCampaign(campaign.id)}
                                    disabled={sendBulk.isPending}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    <Send className="w-4 h-4 mr-2" />
                                    {sendBulk.isPending ? 'Sending...' : 'Publish via Cunnekt'}
                                  </button>
                                ) : null}
                                <button
                                  onClick={() => deleteCampaign(campaign.id)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Responses Tab */}
              {activeTab === 'responses' && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">WhatsApp Responses</h3>
                    <button
                      onClick={() => responses.refetch()}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      <RefreshCw className="w-4 h-4 inline mr-2" />
                      Refresh
                    </button>
                  </div>

                  {responses.isLoading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                      <p className="mt-4 text-gray-600">Loading responses...</p>
                    </div>
                  ) : responses.data?.responses?.length > 0 ? (
                    <div className="space-y-4">
                      {responses.data.responses.map((response: any) => (
                        <div key={response.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <MessageCircle className="w-5 h-5 text-green-600" />
                                <span className="font-semibold text-gray-900">Lead ID: {response.lead_id}</span>
                                <span className="text-sm text-gray-500">
                                  {new Date(response.sent_at).toLocaleString()}
                                </span>
                              </div>
                              <div className="bg-gray-50 rounded-lg p-3 mb-2">
                                <p className="text-gray-800 whitespace-pre-wrap">{response.content}</p>
                              </div>
                              <div className="flex items-center space-x-4 text-sm text-gray-600">
                                <span>📱 {response.recipient}</span>
                                {response.campaign_id && (
                                  <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded">
                                    Campaign #{response.campaign_id}
                                  </span>
                                )}
                                <span className={`px-2 py-1 rounded ${
                                  response.status === 'sent' ? 'bg-green-100 text-green-700' :
                                  response.status === 'delivered' ? 'bg-blue-100 text-blue-700' :
                                  response.status === 'read' ? 'bg-purple-100 text-purple-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                  {response.status}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600">No responses yet</p>
                      <p className="text-sm text-gray-500 mt-2">
                        Responses from leads will appear here when they reply to your messages
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Leads Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Filtered Leads ({filteredLeads.length})
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedLeads.length === filteredLeads.length && filteredLeads.length > 0}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Country</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qualification</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Age</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredLeads.slice(0, 100).map(lead => (
                    <tr key={lead.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedLeads.includes(lead.id)}
                          onChange={() => toggleLeadSelection(lead.id)}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{lead.name || lead.fullName || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{lead.phone || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{lead.country || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{lead.qualification || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{lead.course || 'N/A'}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                          {lead.status || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{getLeadAgeDays(lead)} days</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredLeads.length > 100 && (
                <div className="p-4 text-center text-sm text-gray-500 bg-gray-50">
                  Showing first 100 of {filteredLeads.length} leads. Use export to get all.
                </div>
              )}
              {filteredLeads.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  <Filter className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>No leads match the selected filters</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* WhatsApp Campaign Modal */}
      {showWhatsAppModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                <Send className="w-6 h-6 mr-2 text-green-600" />
                WhatsApp Remarketing Campaign
              </h3>
            </div>
            <div className="p-6">
              <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-900 mb-2">
                  <strong>{selectedLeads.filter(id => {
                    const lead = filteredLeads.find(l => l.id === id);
                    return lead && (lead.whatsapp || lead.phone || lead.alternatePhone);
                  }).length}</strong> leads with contact numbers selected
                </p>
                <div className="text-xs text-blue-700 space-y-1">
                  <p>• WhatsApp: {selectedLeads.filter(id => filteredLeads.find(l => l.id === id)?.whatsapp).length}</p>
                  <p>• Phone: {selectedLeads.filter(id => filteredLeads.find(l => l.id === id)?.phone).length}</p>
                  <p>• Alternate: {selectedLeads.filter(id => filteredLeads.find(l => l.id === id)?.alternatePhone).length}</p>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Campaign Message Template
                </label>
                <textarea
                  value={whatsappMessage}
                  onChange={(e) => setWhatsappMessage(e.target.value)}
                  placeholder="Hi {name}, we noticed you were interested in {course}..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  rows={6}
                />
                <p className="mt-2 text-xs text-gray-500">
                  Variables: {'{name}'}, {'{course}'}, {'{qualification}'}, {'{country}'}
                </p>
              </div>

              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200 mb-4">
                <p className="text-sm text-yellow-900">
                  <strong>Note:</strong> Phone numbers will be copied with priority: WhatsApp → Phone → Alternate. Perfect for WhatsApp Business API or bulk messaging tools.
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowWhatsAppModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    copyPhoneNumbers();
                    setShowWhatsAppModal(false);
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Phone Numbers
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                <MessageSquare className="w-6 h-6 mr-2 text-purple-600" />
                {editingTemplate ? 'Edit Template' : 'Create New Template'}
              </h3>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template Name *
                </label>
                <input
                  type="text"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                  placeholder="e.g., Follow-up Campaign"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={newTemplate.category}
                  onChange={(e) => setNewTemplate({ ...newTemplate, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="general">General</option>
                  <option value="follow-up">Follow-up</option>
                  <option value="reengagement">Re-engagement</option>
                  <option value="promotion">Promotion</option>
                  <option value="reminder">Reminder</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message Template *
                </label>
                <textarea
                  value={newTemplate.message}
                  onChange={(e) => setNewTemplate({ ...newTemplate, message: e.target.value })}
                  placeholder="Hi {name}! We noticed you showed interest in {course}..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  rows={8}
                />
                <p className="mt-2 text-xs text-gray-500">
                  Available variables: {'{name}'}, {'{course}'}, {'{qualification}'}, {'{country}'}
                </p>
              </div>

              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200 mb-4">
                <p className="text-sm text-purple-900">
                  <strong>Preview Variables:</strong> {extractVariables(newTemplate.message).map(v => '{'+v+'}').join(', ') || 'None detected'}
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowTemplateModal(false);
                    setEditingTemplate(null);
                    setNewTemplate({ name: '', message: '', category: 'general' });
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={saveTemplate}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {editingTemplate ? 'Update' : 'Create'} Template
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Campaign Modal */}
      {showCampaignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                <Zap className="w-6 h-6 mr-2 text-purple-600" />
                Create Marketing Campaign
              </h3>
            </div>
            <div className="p-6">
              <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-900">
                  <strong>{selectedLeads.length}</strong> leads selected from current segment
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Campaign Name *
                </label>
                <input
                  type="text"
                  value={newCampaign.name}
                  onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                  placeholder="e.g., Q4 Course Promotion"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Message Template *
                </label>
                <select
                  value={newCampaign.templateId}
                  onChange={(e) => setNewCampaign({ ...newCampaign, templateId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="">-- Select Template --</option>
                  {templates.map(template => (
                    <option key={template.id} value={template.id}>
                      {template.name} ({template.category})
                    </option>
                  ))}
                </select>
              </div>

              {newCampaign.templateId && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Template Preview:</h4>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">
                    {templates.find(t => t.id === newCampaign.templateId)?.message}
                  </p>
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Schedule Campaign (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={newCampaign.scheduledAt}
                  onChange={(e) => setNewCampaign({ ...newCampaign, scheduledAt: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
                <p className="mt-1 text-xs text-gray-500">Leave empty to create as draft</p>
              </div>

              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200 mb-4">
                <p className="text-sm text-yellow-900">
                  <strong>Note:</strong> Campaign will use current segment filters ({filters.countries.length} countries, {filters.qualifications.length} qualifications, {filters.courses.length} courses)
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowCampaignModal(false);
                    setNewCampaign({ name: '', templateId: '', scheduledAt: '' });
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={createCampaign}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Create Campaign
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadSegmentation;
