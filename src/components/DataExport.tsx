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
  const [exportHistory, setExportHistory] = useState<any[]>([]);

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
      
      // Export data based on selections
      const exportPromises = selectedExports.map(async (exportId) => {
        const exportOption = exportOptions.find(opt => opt.id === exportId);
        if (!exportOption) return null;

        let endpoint = '';
        let filename = '';
        
        // Map export options to backend endpoints
        if (exportId.includes('leads')) {
          endpoint = '/leads';
          filename = `leads_export_${new Date().toISOString().split('T')[0]}`;
        } else if (exportId.includes('students')) {
          endpoint = '/students';
          filename = `students_export_${new Date().toISOString().split('T')[0]}`;
        } else if (exportId.includes('analytics')) {
          endpoint = '/analytics/export';
          filename = `analytics_export_${new Date().toISOString().split('T')[0]}`;
        } else if (exportId.includes('communications')) {
          endpoint = '/communications';
          filename = `communications_export_${new Date().toISOString().split('T')[0]}`;
        }

        if (!endpoint) return null;

        try {
          // Get data from API using the request method
          const response = await (apiClient as any).request(endpoint);
          
          // Convert data to selected format and trigger download
          const fileContent = convertDataToFormat(response, selectedFormat);
          const blob = new Blob([fileContent], { 
            type: getContentType(selectedFormat) 
          });
          
          // Create download link
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', `${filename}.${selectedFormat}`);
          document.body.appendChild(link);
          link.click();
          link.remove();
          window.URL.revokeObjectURL(url);

          return {
            name: exportOption.name,
            filename: `${filename}.${selectedFormat}`,
            size: blob.size
          };
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
          status: 'completed' as const,
          downloadUrl: '#',
          format: selectedFormat,
          fileCount: successfulExports.length
        };
        
        setExportHistory(prev => [newExport, ...prev]);
        setSelectedExports([]);
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
    } finally {
      setIsExporting(false);
    }
  };

  // Helper functions for data conversion
  const convertDataToFormat = (data: any, format: 'csv' | 'pdf' | 'xlsx'): string => {
    if (format === 'csv') {
      return convertToCSV(data);
    } else if (format === 'xlsx') {
      // For now, return CSV format - in production, use a library like xlsx
      return convertToCSV(data);
    } else if (format === 'pdf') {
      // For now, return JSON format - in production, use a PDF library
      return JSON.stringify(data, null, 2);
    }
    return JSON.stringify(data, null, 2);
  };

  const convertToCSV = (data: any): string => {
    if (!data || !Array.isArray(data.data || data)) {
      return 'No data available';
    }
    
    const items = data.data || data;
    if (items.length === 0) return 'No data available';
    
    // Get headers from first item
    const headers = Object.keys(items[0]);
    const csvHeaders = headers.join(',');
    
    // Convert data to CSV rows
    const csvRows = items.map((item: any) => 
      headers.map(header => {
        const value = item[header];
        // Escape quotes and wrap in quotes if contains comma
        const stringValue = String(value || '');
        return stringValue.includes(',') ? `"${stringValue.replace(/"/g, '""')}"` : stringValue;
      }).join(',')
    );
    
    return [csvHeaders, ...csvRows].join('\n');
  };

  const getContentType = (format: 'csv' | 'pdf' | 'xlsx'): string => {
    switch (format) {
      case 'csv': return 'text/csv';
      case 'pdf': return 'application/pdf';
      case 'xlsx': return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      default: return 'text/plain';
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
                      <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                        {exportItem.status}
                      </span>
                      <button className="text-blue-600 hover:text-blue-700 text-sm">
                        Download
                      </button>
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
