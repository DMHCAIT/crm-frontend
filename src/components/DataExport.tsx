import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getApiClient } from '../lib/backend';
import { Download, FileText, Users, BarChart3, Filter, CheckCircle } from 'lucide-react';
import { LoadingSpinner } from './LoadingComponents';

interface ExportOption {
  id: string;
  name: string;
  description: string;
  icon: any;
  format: 'csv' | 'pdf' | 'xlsx';
  dataType: 'leads' | 'students' | 'analytics' | 'documents';
}

interface ExportFilters {
  dateRange: 'last_7_days' | 'last_30_days' | 'last_90_days' | 'custom';
  customStartDate?: string;
  customEndDate?: string;
  status?: string[];
  source?: string[];
  includeNotes?: boolean;
  includeDocuments?: boolean;
}

interface ExportHistoryItem {
  id: string;
  date: string;
  exports: string;
  status: 'processing' | 'completed' | 'failed';
  downloadUrl: string;
  format: 'csv' | 'pdf' | 'xlsx';
  fileCount: number;
  jobIds?: string[];
}

const DataExport: React.FC = () => {
  const { user } = useAuth();
  const [selectedExports, setSelectedExports] = useState<string[]>([]);
  const [selectedFormat, setSelectedFormat] = useState<'csv' | 'pdf' | 'xlsx'>('csv');
  const [filters, setFilters] = useState<ExportFilters>({
    dateRange: 'last_30_days',
    includeNotes: true,
    includeDocuments: false
  });
  const [isExporting, setIsExporting] = useState(false);
  const [exportHistory, setExportHistory] = useState<ExportHistoryItem[]>([]);

  const exportOptions: ExportOption[] = [
    {
      id: 'leads_csv',
      name: 'Leads Data (CSV)',
      description: 'Complete leads information with contact details and status',
      icon: Users,
      format: 'csv',
      dataType: 'leads'
    },
    {
      id: 'leads_pdf',
      name: 'Leads Report (PDF)',
      description: 'Formatted leads report with charts and summaries',
      icon: FileText,
      format: 'pdf',
      dataType: 'leads'
    },
    {
      id: 'students_csv',
      name: 'Students Data (CSV)',
      description: 'Student records with enrollment and academic information',
      icon: Users,
      format: 'csv',
      dataType: 'students'
    },
    {
      id: 'analytics_pdf',
      name: 'Analytics Report (PDF)',
      description: 'Comprehensive analytics with charts and insights',
      icon: BarChart3,
      format: 'pdf',
      dataType: 'analytics'
    },
    {
      id: 'documents_xlsx',
      name: 'Document Inventory (Excel)',
      description: 'Complete document registry with metadata',
      icon: FileText,
      format: 'xlsx',
      dataType: 'documents'
    }
  ];

  const handleExportSelection = (exportId: string) => {
    setSelectedExports(prev => 
      prev.includes(exportId) 
        ? prev.filter(id => id !== exportId)
        : [...prev, exportId]
    );
  };

  const handleExport = async () => {
    if (selectedExports.length === 0) return;

    if (!user) return;

    setIsExporting(true);
    try {
      const apiClient = getApiClient();
      
      // Prepare date filtering based on filters state
      let dateFilter = '';
      if (filters.dateRange === 'custom') {
        if (!filters.customStartDate || !filters.customEndDate) {
          alert('Please select both start and end dates for custom date range');
          setIsExporting(false);
          return;
        }
        dateFilter = 'custom';
      } else {
        // Convert UI date range to backend format
        const dateRangeMap = {
          'last_7_days': '7d',
          'last_30_days': '30d',
          'last_90_days': '90d'
        };
        dateFilter = dateRangeMap[filters.dateRange] || '30d';
      }
      
      // Export data based on selections
      const exportPromises = selectedExports.map(async (exportId) => {
        const exportOption = exportOptions.find(opt => opt.id === exportId);
        if (!exportOption) return null;

        let endpoint = '';
        let filename = '';
        let exportData: any = {};
        
        // Map export options to backend endpoints and prepare export data
        if (exportId.includes('leads')) {
          endpoint = '/data-export/leads';
          filename = `leads_export_${new Date().toISOString().split('T')[0]}`;
          exportData = {
            format: selectedFormat,
            date_range: dateFilter,
            ...(filters.dateRange === 'custom' && {
              start_date: filters.customStartDate,
              end_date: filters.customEndDate
            }),
            include_communications: true
          };
        } else if (exportId.includes('students')) {
          endpoint = '/data-export/students';
          filename = `students_export_${new Date().toISOString().split('T')[0]}`;
          exportData = {
            format: selectedFormat,
            date_range: dateFilter,
            ...(filters.dateRange === 'custom' && {
              start_date: filters.customStartDate,
              end_date: filters.customEndDate
            }),
            include_payments: true,
            include_documents: true
          };
        } else if (exportId.includes('analytics')) {
          endpoint = '/data-export/analytics';
          filename = `analytics_export_${new Date().toISOString().split('T')[0]}`;
          exportData = {
            format: selectedFormat,
            date_range: dateFilter,
            ...(filters.dateRange === 'custom' && {
              start_date: filters.customStartDate,
              end_date: filters.customEndDate
            })
          };
        } else if (exportId.includes('communications')) {
          endpoint = '/data-export/communications';
          filename = `communications_export_${new Date().toISOString().split('T')[0]}`;
          exportData = {
            format: selectedFormat,
            date_range: dateFilter,
            ...(filters.dateRange === 'custom' && {
              start_date: filters.customStartDate,
              end_date: filters.customEndDate
            })
          };
        }

        if (!endpoint) return null;

        try {
          // Start export job using POST request to the enhanced data export API
          const response = await (apiClient as any).request(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(exportData)
          });

          if (response.success) {
            // Export job started successfully
            console.log(`Export job started for ${exportOption.name}:`, response);
            
            return {
              name: exportOption.name,
              filename: `${filename}.${selectedFormat}`,
              jobId: response.job_id,
              estimatedTime: response.estimated_time,
              status: 'processing'
            };
          } else {
            console.error(`Failed to start export for ${exportOption.name}:`, response);
            return null;
          }
        } catch (error) {
          console.error(`Failed to export ${exportOption.name}:`, error);
          return null;
        }
      });

      const results = await Promise.all(exportPromises);
      const successfulExports = results.filter(r => r !== null);

      // Add to history
      if (successfulExports.length > 0) {
        const newExport = {
          id: Date.now().toString(),
          date: new Date().toISOString(),
          exports: successfulExports.map(r => r.name).join(', '),
          status: 'processing' as const,
          downloadUrl: '#',  // Will be updated when job completes
          format: selectedFormat,
          fileCount: successfulExports.length,
          jobIds: successfulExports.map(r => r.jobId).filter(Boolean)
        };
        
        setExportHistory(prev => [newExport, ...prev]);
        setSelectedExports([]);
        
        // Show success message
        alert(`Export jobs started successfully! ${successfulExports.length} export(s) are being processed. Check the Export History section for updates.`);
      } else {
        alert('No exports could be started. Please check your selections and try again.');
      }
    } catch (error) {
      console.error('Export failed:', error);
      
      // Add failed export to history
      const failedExport = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        exports: selectedExports.map(id => exportOptions.find(opt => opt.id === id)?.name).join(', '),
        status: 'failed' as const,
        downloadUrl: '#',
        format: selectedFormat,
        fileCount: 0
      };
      
      setExportHistory(prev => [failedExport, ...prev]);
      alert('Export failed. Please try again or contact support if the issue persists.');
    } finally {
      setIsExporting(false);
    }
  };

  // Check export job status
  const checkExportStatus = async (jobId: string, exportHistoryId: string) => {
    try {
      const apiClient = getApiClient();
      const response = await (apiClient as any).request(`/data-export/status/${jobId}`);
      
      if (response.success) {
        const job = response.job;
        
        // Update export history with current status
        setExportHistory(prev => prev.map(export_ => 
          export_.id === exportHistoryId 
            ? {
                ...export_,
                status: job.status,
                downloadUrl: job.status === 'completed' ? job.download_url : '#'
              }
            : export_
        ));
        
        return job;
      }
    } catch (error) {
      console.error('Failed to check export status:', error);
    }
    return null;
  };

  // Download completed export
  const downloadExport = async (jobId: string, filename: string) => {
    try {
      const apiClient = getApiClient();
      const response = await (apiClient as any).request(`/data-export/download/${jobId}`, {
        method: 'GET'
      });
      
      if (response && response.data) {
        // Create blob and download
        const blob = new Blob([response.data], { 
          type: response.contentType || 'application/octet-stream'
        });
        
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Failed to download export:', error);
      alert('Failed to download export. Please try again.');
    }
  };

  const getFormatColor = (format: string) => {
    switch (format) {
      case 'csv': return 'bg-green-100 text-green-800';
      case 'pdf': return 'bg-red-100 text-red-800';
      case 'xlsx': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Data Export</h1>
          <p className="text-gray-600 mt-1">Export your CRM data in various formats</p>
        </div>
        <button
          onClick={handleExport}
          disabled={selectedExports.length === 0 || isExporting}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isExporting ? (
            <LoadingSpinner size="sm" color="white" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          <span>{isExporting ? 'Exporting...' : 'Export Selected'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Export Options */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Data to Export</h2>
            
            {/* Format Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Export Format</label>
              <div className="flex space-x-4">
                {(['csv', 'xlsx', 'pdf'] as const).map((format) => (
                  <label key={format} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="exportFormat"
                      value={format}
                      checked={selectedFormat === format}
                      onChange={(e) => setSelectedFormat(e.target.value as 'csv' | 'pdf' | 'xlsx')}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{format.toUpperCase()}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {exportOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = selectedExports.includes(option.id);
                
                return (
                  <div
                    key={option.id}
                    className={`
                      border rounded-lg p-4 cursor-pointer transition-all
                      ${isSelected 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                    onClick={() => handleExportSelection(option.id)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`
                        w-10 h-10 rounded-lg flex items-center justify-center
                        ${isSelected ? 'bg-blue-100' : 'bg-gray-100'}
                      `}>
                        <Icon className={`w-5 h-5 ${isSelected ? 'text-blue-600' : 'text-gray-600'}`} />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-medium text-gray-900">{option.name}</h3>
                          <span className={`px-2 py-1 text-xs rounded ${getFormatColor(option.format)}`}>
                            {option.format.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{option.description}</p>
                      </div>
                      
                      {isSelected && (
                        <CheckCircle className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Export History */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Exports</h2>
            
            {exportHistory.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No exports yet</p>
            ) : (
              <div className="space-y-3">
                {exportHistory.map((exportItem) => (
                  <div key={exportItem.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{exportItem.exports}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(exportItem.date).toLocaleDateString()} at {new Date(exportItem.date).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs rounded ${
                        exportItem.status === 'completed' ? 'bg-green-100 text-green-800' :
                        exportItem.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                        exportItem.status === 'failed' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {exportItem.status}
                      </span>
                      {exportItem.status === 'completed' && exportItem.downloadUrl !== '#' && (
                        <button 
                          onClick={() => downloadExport(exportItem.jobIds?.[0] || '', exportItem.exports.replace(/[^a-zA-Z0-9]/g, '_') + '.' + exportItem.format)}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          Download
                        </button>
                      )}
                      {exportItem.status === 'processing' && exportItem.jobIds?.[0] && (
                        <button 
                          onClick={() => exportItem.jobIds?.[0] && checkExportStatus(exportItem.jobIds[0], exportItem.id)}
                          className="text-orange-600 hover:text-orange-700 text-sm font-medium"
                        >
                          Check Status
                        </button>
                      )}
                      {exportItem.status === 'failed' && (
                        <span className="text-red-600 text-sm">
                          Failed
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Filter className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Export Filters</h2>
            </div>

            <div className="space-y-4">
              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date Range
                </label>
                <select
                  value={filters.dateRange}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value as any }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="last_7_days">Last 7 days</option>
                  <option value="last_30_days">Last 30 days</option>
                  <option value="last_90_days">Last 90 days</option>
                  <option value="custom">Custom range</option>
                </select>
              </div>

              {filters.dateRange === 'custom' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={filters.customStartDate || ''}
                      onChange={(e) => setFilters(prev => ({ ...prev, customStartDate: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={filters.customEndDate || ''}
                      onChange={(e) => setFilters(prev => ({ ...prev, customEndDate: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              )}

              {/* Include Options */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-700">Include Additional Data</h3>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.includeNotes || false}
                    onChange={(e) => setFilters(prev => ({ ...prev, includeNotes: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Include Notes</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.includeDocuments || false}
                    onChange={(e) => setFilters(prev => ({ ...prev, includeDocuments: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Include Documents</span>
                </label>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Preview</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Selected Items:</span>
                <span className="text-sm font-medium text-gray-900">{selectedExports.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Date Range:</span>
                <span className="text-sm font-medium text-gray-900">
                  {filters.dateRange.replace('_', ' ')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Estimated Size:</span>
                <span className="text-sm font-medium text-gray-900">
                  {selectedExports.length * 2.5}MB
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataExport;
