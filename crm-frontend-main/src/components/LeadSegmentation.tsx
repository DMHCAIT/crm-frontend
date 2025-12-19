import React, { useState, useMemo } from 'react';
import { useLeads } from '../hooks/useQueries';
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
  Smartphone
} from 'lucide-react';
import { useNotify } from '../hooks/useNotify';

interface Lead {
  id: string;
  name?: string;
  fullName?: string;
  phone?: string;
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

const LeadSegmentation: React.FC = () => {
  const notify = useNotify();
  
  // Fetch all leads
  const { data: leadsData, isLoading } = useLeads(1, 10000, {});
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
    const phoneNumbers = leadsToExport
      .map(l => l.phone)
      .filter(Boolean)
      .join('\n');

    if (!phoneNumbers) {
      notify.error('No Phone Numbers', 'Selected leads have no phone numbers');
      return;
    }

    navigator.clipboard.writeText(phoneNumbers);
    notify.success('Copied!', `${leadsToExport.length} phone numbers copied to clipboard`);
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
              <p className="text-sm text-gray-600">With Phone</p>
              <p className="text-2xl font-bold text-purple-600">
                {filteredLeads.filter(l => selectedLeads.includes(l.id) && l.phone).length}
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
                Copy Phone Numbers
              </button>

              <button
                onClick={() => setShowWhatsAppModal(true)}
                disabled={selectedLeads.length === 0}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4 mr-2" />
                WhatsApp Campaign ({selectedLeads.filter(id => filteredLeads.find(l => l.id === id)?.phone).length})
              </button>
            </div>
          </div>

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
                <p className="text-sm text-blue-900">
                  <strong>{selectedLeads.filter(id => filteredLeads.find(l => l.id === id)?.phone).length}</strong> leads with phone numbers selected
                </p>
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
                  <strong>Note:</strong> WhatsApp Business API integration required. Phone numbers will be copied to clipboard for manual sending or bulk API usage.
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
    </div>
  );
};

export default LeadSegmentation;
