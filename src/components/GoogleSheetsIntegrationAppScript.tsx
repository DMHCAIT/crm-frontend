import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  Download, 
  Settings, 
  CheckCircle, 
  AlertCircle,
  RefreshCw,
  BookOpen,
  Zap,
  Map,
  Link,
  Upload,
  Play,
  Pause,
  ExternalLink
} from 'lucide-react';
import { getApiClient } from '../lib/backend';

interface GoogleSheetColumn {
  name: string;
  index: number;
  mappedTo: string;
}

interface SheetData {
  spreadsheetName: string;
  sheetName: string;
  columns: string[];
  rowCount: number;
  lastUpdated: string;
}

interface SyncStats {
  totalImported: number;
  successCount: number;
  errorCount: number;
  lastSync: string;
  isRunning: boolean;
}

const GoogleSheetsIntegrationAppScript: React.FC = () => {
  const [activeTab, setActiveTab] = useState('setup');
  const [appsScriptUrl, setAppsScriptUrl] = useState<string>('');
  const [sheetName, setSheetName] = useState<string>('Sheet1');
  const [apiKey, setApiKey] = useState<string>(''); // Optional API key
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [autoSync, setAutoSync] = useState<boolean>(false);
  const [syncInterval, setSyncInterval] = useState<number>(5);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [sheetData, setSheetData] = useState<SheetData | null>(null);
  const [syncStats, setSyncStats] = useState<SyncStats>({
    totalImported: 0,
    successCount: 0,
    errorCount: 0,
    lastSync: '',
    isRunning: false
  });

  // Default field mapping - Google Sheet columns to CRM fields
  const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({
    'full_name': 'name',
    'email': 'email',
    'phone_number': 'phone',
    'country': 'country',
    'your_highest_qualification': 'qualification',
    'in_which_program_are_you_interested_?': 'course',
    'lead_status': 'status',
    'form_name': 'source',
    'Name': 'name',
    'Email': 'email',
    'Phone': 'phone',
    'Company': 'company',
    'Course': 'course'
  });

  const tabs = [
    { id: 'setup', label: 'Setup', icon: Settings },
    { id: 'mapping', label: 'Field Mapping', icon: Map },
    { id: 'sync', label: 'Sync Status', icon: RefreshCw },
    { id: 'guide', label: 'Apps Script Guide', icon: BookOpen }
  ];

  const crmFields = [
    { value: 'name', label: 'Lead Name / Full Name' },
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Phone Number' },
    { value: 'company', label: 'Company' },
    { value: 'course', label: 'Course / Program' },
    { value: 'qualification', label: 'Highest Qualification' },
    { value: 'branch', label: 'Branch' },
    { value: 'country', label: 'Country' },
    { value: 'city', label: 'City' },
    { value: 'designation', label: 'Designation' },
    { value: 'source', label: 'Source / Form Name' },
    { value: 'status', label: 'Status / Lead Status' },
    { value: 'notes', label: 'Notes' },
    { value: 'score', label: 'Score' },
    { value: 'ad_name', label: 'Ad Name' },
    { value: 'campaign_name', label: 'Campaign Name' }
  ];

  useEffect(() => {
    loadSavedSettings();
  }, []);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (autoSync && isConnected && !syncStats.isRunning) {
      intervalId = setInterval(() => {
        syncLeadsFromSheet();
      }, syncInterval * 60 * 1000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [autoSync, isConnected, syncInterval]);

  const loadSavedSettings = () => {
    const savedUrl = localStorage.getItem('google_appscript_url');
    const savedSheetName = localStorage.getItem('google_appscript_sheet_name');
    const savedApiKey = localStorage.getItem('google_appscript_api_key');
    const savedAutoSync = localStorage.getItem('google_appscript_auto_sync');
    const savedSyncInterval = localStorage.getItem('google_appscript_sync_interval');
    const savedMapping = localStorage.getItem('google_appscript_field_mapping');
    
    if (savedUrl) {
      setAppsScriptUrl(savedUrl);
      setIsConnected(true);
    }
    if (savedSheetName) setSheetName(savedSheetName);
    if (savedApiKey) setApiKey(savedApiKey);
    if (savedAutoSync) setAutoSync(savedAutoSync === 'true');
    if (savedSyncInterval) setSyncInterval(Number(savedSyncInterval));
    if (savedMapping) setFieldMapping(JSON.parse(savedMapping));
  };

  const saveSettings = () => {
    localStorage.setItem('google_appscript_url', appsScriptUrl);
    localStorage.setItem('google_appscript_sheet_name', sheetName);
    localStorage.setItem('google_appscript_api_key', apiKey);
    localStorage.setItem('google_appscript_auto_sync', autoSync.toString());
    localStorage.setItem('google_appscript_sync_interval', syncInterval.toString());
    localStorage.setItem('google_appscript_field_mapping', JSON.stringify(fieldMapping));
  };

  const buildAppsScriptUrl = (): string => {
    let url = appsScriptUrl;
    const params = new URLSearchParams();
    
    if (sheetName) params.append('sheet', sheetName);
    if (apiKey) params.append('apiKey', apiKey);
    
    return `${url}?${params.toString()}`;
  };

  const testConnection = async () => {
    if (!appsScriptUrl) {
      setError('Please provide your Apps Script URL');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const url = buildAppsScriptUrl();
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Failed to connect to Apps Script');
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      if (!data.success) {
        throw new Error('Invalid response from Apps Script');
      }

      setSheetData({
        spreadsheetName: data.spreadsheetName,
        sheetName: data.sheetName,
        columns: data.columns || [],
        rowCount: data.rowCount || 0,
        lastUpdated: data.lastUpdated
      });

      // Auto-map columns if they match
      const newMapping = { ...fieldMapping };
      data.columns?.forEach((col: string) => {
        if (fieldMapping[col]) {
          newMapping[col] = fieldMapping[col];
        }
      });
      setFieldMapping(newMapping);

      setIsConnected(true);
      setSuccess(`✅ Connected to "${data.spreadsheetName}" - Found ${data.rowCount} leads`);
      saveSettings();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed');
      setIsConnected(false);
    } finally {
      setLoading(false);
    }
  };

  const syncLeadsFromSheet = async () => {
    if (!isConnected || !appsScriptUrl) {
      setError('Please connect to Google Sheets first');
      return;
    }

    setSyncStats(prev => ({ ...prev, isRunning: true }));
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const url = buildAppsScriptUrl();
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Failed to fetch sheet data');
      }

      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }

      if (!result.data || result.data.length === 0) {
        throw new Error('No data found in sheet');
      }

      let successCount = 0;
      let errorCount = 0;

      const api = getApiClient();

      for (const row of result.data) {
        try {
          // Map row data to CRM lead format
          const leadData: any = {
            source: 'google_sheets',
            status: 'new',
            score: 0
          };

          // Map fields based on fieldMapping
          Object.keys(fieldMapping).forEach((sheetColumn) => {
            const crmField = fieldMapping[sheetColumn];
            if (crmField && row[sheetColumn]) {
              let value = row[sheetColumn];
              
              // Clean phone number - remove "p:" prefix from Facebook leads
              if (crmField === 'phone' && typeof value === 'string' && value.startsWith('p:')) {
                value = value.substring(2).trim();
              }
              
              // Skip test leads with dummy data
              if (typeof value === 'string' && (value.includes('<test lead:') || value.includes('dummy data'))) {
                return;
              }
              
              leadData[crmField] = value;
            }
          });
          
          // Skip if no name
          if (!leadData.name) {
            continue;
          }

          // Check if lead already exists (by email)
          if (leadData.email) {
            const existingLeads = await api.get('/leads', {
              params: { email: leadData.email }
            });
            
            if (existingLeads.data && existingLeads.data.length > 0) {
              // Update existing lead
              await api.put(`/leads/${existingLeads.data[0].id}`, leadData);
            } else {
              // Create new lead
              await api.post('/leads', leadData);
            }
          } else {
            // Create new lead without email check
            await api.post('/leads', leadData);
          }

          successCount++;
        } catch (err) {
          console.error('Error importing lead:', err);
          errorCount++;
        }
      }

      setSyncStats({
        totalImported: successCount + errorCount,
        successCount,
        errorCount,
        lastSync: new Date().toLocaleString(),
        isRunning: false
      });

      setSuccess(`✅ Successfully imported ${successCount} leads! ${errorCount > 0 ? `(${errorCount} errors)` : ''}`);
      saveSettings();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed');
      setSyncStats(prev => ({ ...prev, isRunning: false }));
    } finally {
      setLoading(false);
    }
  };

  const updateFieldMapping = (sheetColumn: string, crmField: string) => {
    setFieldMapping(prev => ({
      ...prev,
      [sheetColumn]: crmField
    }));
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <FileSpreadsheet className="w-12 h-12" />
              <div>
                <h1 className="text-2xl font-bold">Google Sheets Integration</h1>
                <p className="text-green-100">Using Apps Script - No OAuth Required! 🚀</p>
              </div>
            </div>
            {isConnected && (
              <div className="flex items-center space-x-2 bg-white/20 px-4 py-2 rounded-lg">
                <CheckCircle className="w-5 h-5" />
                <span>Connected</span>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b">
          <div className="flex space-x-1 p-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-green-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Alert Messages */}
        {error && (
          <div className="m-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="m-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 flex items-start space-x-3">
            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        {/* Setup Tab */}
        {activeTab === 'setup' && (
          <div className="p-6 space-y-6">
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
              <h3 className="font-semibold text-blue-900 mb-2">✨ Simpler Approach!</h3>
              <p className="text-blue-800">
                This uses Google Apps Script - no Google Console setup, no OAuth, no credentials needed!
                Just deploy your Apps Script and paste the URL below.
              </p>
            </div>

            <div className="space-y-4">
              {/* Apps Script URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Apps Script Web App URL *
                </label>
                <input
                  type="text"
                  value={appsScriptUrl}
                  onChange={(e) => setAppsScriptUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Get this URL after deploying your Apps Script as a Web App
                </p>
              </div>

              {/* Sheet Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sheet Name
                </label>
                <input
                  type="text"
                  value={sheetName}
                  onChange={(e) => setSheetName(e.target.value)}
                  placeholder="Sheet1"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  The exact name of the sheet tab (default: "Sheet1")
                </p>
              </div>

              {/* Optional API Key */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API Key (Optional)
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Leave empty if not configured"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Only needed if you added API key authentication to your Apps Script
                </p>
              </div>

              {/* Test Connection Button */}
              <button
                onClick={testConnection}
                disabled={loading || !appsScriptUrl}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Testing Connection...</span>
                  </>
                ) : (
                  <>
                    <Link className="w-5 h-5" />
                    <span>Test Connection</span>
                  </>
                )}
              </button>

              {/* Connection Info */}
              {sheetData && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-green-900 mb-2">✅ Connected!</h3>
                  <div className="space-y-1 text-sm text-green-800">
                    <p><strong>Spreadsheet:</strong> {sheetData.spreadsheetName}</p>
                    <p><strong>Sheet:</strong> {sheetData.sheetName}</p>
                    <p><strong>Columns Found:</strong> {sheetData.columns.length}</p>
                    <p><strong>Total Rows:</strong> {sheetData.rowCount}</p>
                    <p><strong>Last Updated:</strong> {new Date(sheetData.lastUpdated).toLocaleString()}</p>
                  </div>
                </div>
              )}

              {/* Auto Sync Settings */}
              {isConnected && (
                <div className="border-t pt-6 mt-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Auto-Sync Settings</h3>
                  
                  <div className="flex items-center space-x-3 mb-4">
                    <button
                      onClick={() => setAutoSync(!autoSync)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        autoSync ? 'bg-green-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          autoSync ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <span className="text-sm font-medium text-gray-700">
                      {autoSync ? 'Auto-Sync Enabled' : 'Auto-Sync Disabled'}
                    </span>
                  </div>

                  {autoSync && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sync every (minutes)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="60"
                        value={syncInterval}
                        onChange={(e) => setSyncInterval(Number(e.target.value))}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  )}

                  <button
                    onClick={saveSettings}
                    className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Save Settings
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Field Mapping Tab */}
        {activeTab === 'mapping' && (
          <div className="p-6 space-y-6">
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4">
              <p className="text-yellow-800">
                Map your Google Sheets columns to CRM fields. This tells the system where to put data from each column.
              </p>
            </div>

            {sheetData ? (
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Available Columns from Your Sheet:</h3>
                {sheetData.columns.map((column, index) => (
                  <div key={index} className="flex items-center space-x-4 p-4 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{column}</p>
                      <p className="text-xs text-gray-500">Sheet Column</p>
                    </div>
                    <div className="text-gray-400">→</div>
                    <div className="flex-1">
                      <select
                        value={fieldMapping[column] || ''}
                        onChange={(e) => updateFieldMapping(column, e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                      >
                        <option value="">Don't import</option>
                        {crmFields.map((field) => (
                          <option key={field.value} value={field.value}>
                            {field.label}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">CRM Field</p>
                    </div>
                  </div>
                ))}

                <button
                  onClick={saveSettings}
                  className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Save Field Mapping
                </button>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Map className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Connect to your Google Sheet first to see available columns</p>
              </div>
            )}
          </div>
        )}

        {/* Sync Status Tab */}
        {activeTab === 'sync' && (
          <div className="p-6 space-y-6">
            {/* Sync Button */}
            <button
              onClick={syncLeadsFromSheet}
              disabled={!isConnected || loading || syncStats.isRunning}
              className="w-full flex items-center justify-center space-x-2 px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {syncStats.isRunning ? (
                <>
                  <RefreshCw className="w-6 h-6 animate-spin" />
                  <span className="text-lg">Syncing...</span>
                </>
              ) : (
                <>
                  <Play className="w-6 h-6" />
                  <span className="text-lg">Start Manual Sync</span>
                </>
              )}
            </button>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-6 rounded-lg">
                <p className="text-sm text-blue-600 font-medium">Total Imported</p>
                <p className="text-3xl font-bold text-blue-900 mt-2">{syncStats.totalImported}</p>
              </div>
              <div className="bg-green-50 p-6 rounded-lg">
                <p className="text-sm text-green-600 font-medium">Successful</p>
                <p className="text-3xl font-bold text-green-900 mt-2">{syncStats.successCount}</p>
              </div>
              <div className="bg-red-50 p-6 rounded-lg">
                <p className="text-sm text-red-600 font-medium">Errors</p>
                <p className="text-3xl font-bold text-red-900 mt-2">{syncStats.errorCount}</p>
              </div>
            </div>

            {syncStats.lastSync && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Last Sync:</p>
                <p className="text-lg font-medium text-gray-900">{syncStats.lastSync}</p>
              </div>
            )}

            {/* Auto-Sync Status */}
            {autoSync && (
              <div className="bg-green-50 border-l-4 border-green-500 p-4">
                <div className="flex items-center space-x-2">
                  <Zap className="w-5 h-5 text-green-600" />
                  <p className="text-green-800 font-medium">
                    Auto-sync is enabled (every {syncInterval} minutes)
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Apps Script Guide Tab */}
        {activeTab === 'guide' && (
          <div className="p-6 space-y-6">
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-purple-900 mb-2">📘 Apps Script Setup Guide</h2>
              <p className="text-purple-700">
                Follow these steps to create your Google Apps Script web endpoint
              </p>
            </div>

            <div className="space-y-6">
              {/* Step 1 */}
              <div className="border-l-4 border-green-500 pl-4">
                <h3 className="font-bold text-lg text-gray-900 mb-2">Step 1: Open Apps Script</h3>
                <ol className="list-decimal list-inside space-y-2 text-gray-700">
                  <li>Open your Google Sheet</li>
                  <li>Click <strong>Extensions</strong> → <strong>Apps Script</strong></li>
                  <li>Delete any existing code</li>
                </ol>
              </div>

              {/* Step 2 */}
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-bold text-lg text-gray-900 mb-2">Step 2: Paste the Code</h3>
                <p className="text-gray-700 mb-2">Copy and paste this code:</p>
                <div className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm font-mono">
                  <pre>{`function doGet(e) {
  const sheetName = e.parameter.sheet || 'Sheet1';
  const sheet = SpreadsheetApp
    .getActiveSpreadsheet()
    .getSheetByName(sheetName);
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const leads = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const lead = {};
    headers.forEach((h, idx) => {
      lead[h] = row[idx] || '';
    });
    if (lead[headers[0]]) leads.push(lead);
  }
  
  return ContentService
    .createTextOutput(JSON.stringify({
      success: true,
      spreadsheetName: SpreadsheetApp
        .getActiveSpreadsheet().getName(),
      sheetName: sheetName,
      columns: headers,
      rowCount: leads.length,
      lastUpdated: new Date().toISOString(),
      data: leads
    }))
    .setMimeType(ContentService.MimeType.JSON);
}`}</pre>
                </div>
              </div>

              {/* Step 3 */}
              <div className="border-l-4 border-purple-500 pl-4">
                <h3 className="font-bold text-lg text-gray-900 mb-2">Step 3: Deploy as Web App</h3>
                <ol className="list-decimal list-inside space-y-2 text-gray-700">
                  <li>Click <strong>Deploy</strong> → <strong>New deployment</strong></li>
                  <li>Click gear icon ⚙️ next to "Select type"</li>
                  <li>Choose <strong>Web app</strong></li>
                  <li>Set "Execute as": <strong>Me</strong></li>
                  <li>Set "Who has access": <strong>Anyone</strong></li>
                  <li>Click <strong>Deploy</strong></li>
                  <li>Copy the Web App URL</li>
                </ol>
              </div>

              {/* Step 4 */}
              <div className="border-l-4 border-yellow-500 pl-4">
                <h3 className="font-bold text-lg text-gray-900 mb-2">Step 4: Test Your URL</h3>
                <p className="text-gray-700 mb-2">
                  Open the URL in your browser. You should see JSON output with your sheet data.
                </p>
                <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                  <p className="text-sm text-yellow-800 font-mono break-all">
                    https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec?sheet=Sheet1
                  </p>
                </div>
              </div>

              {/* Step 5 */}
              <div className="border-l-4 border-green-500 pl-4">
                <h3 className="font-bold text-lg text-gray-900 mb-2">Step 5: Use in CRM</h3>
                <ol className="list-decimal list-inside space-y-2 text-gray-700">
                  <li>Go to the <strong>Setup</strong> tab</li>
                  <li>Paste your Apps Script URL</li>
                  <li>Enter your sheet name</li>
                  <li>Click <strong>Test Connection</strong></li>
                  <li>Configure field mapping</li>
                  <li>Start syncing!</li>
                </ol>
              </div>

              {/* Documentation Link */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-900">Need more details?</p>
                    <p className="text-sm text-blue-700">
                      Check the <strong>GOOGLE-APPSCRIPT-IMPLEMENTATION.md</strong> file for complete documentation
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GoogleSheetsIntegrationAppScript;
