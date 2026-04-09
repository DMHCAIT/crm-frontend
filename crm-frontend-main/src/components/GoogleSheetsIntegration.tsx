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
  Pause
} from 'lucide-react';
import { getApiClient } from '../lib/backend';

interface GoogleSheetColumn {
  name: string;
  index: number;
  mappedTo: string;
}

interface SheetInfo {
  sheetId: number;
  title: string;
  index: number;
  rowCount: number;
  columnCount: number;
}

interface SheetData {
  spreadsheetId: string;
  spreadsheetName: string;
  sheetName: string;
  columns: GoogleSheetColumn[];
  rowCount: number;
}

interface SyncStats {
  totalImported: number;
  successCount: number;
  errorCount: number;
  lastSync: string;
  isRunning: boolean;
  errorDetails?: string[];
}

const GoogleSheetsIntegration: React.FC = () => {
  const [activeTab, setActiveTab] = useState('setup');
  const [googleAccessToken, setGoogleAccessToken] = useState<string>('');
  const [spreadsheetUrl, setSpreadsheetUrl] = useState<string>('');
  const [spreadsheetId, setSpreadsheetId] = useState<string>('');
  const [sheetName, setSheetName] = useState<string>('Sheet1');
  const [availableSheets, setAvailableSheets] = useState<SheetInfo[]>([]);
  const [selectedSheets, setSelectedSheets] = useState<string[]>([]);
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
    isRunning: false,
    errorDetails: []
  });

  // Default field mapping - Google Sheet columns to CRM fields
  const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({
    // Primary lead information
    'full_name': 'name',
    'email': 'email',
    'phone_number': 'phone',
    'country': 'country',
    
    // Course and qualification
    'your_highest_qualification': 'qualification',
    'in_which_program_are_you_interested_?': 'course',
    
    // Lead status and source
    'lead_status': 'status',
    'form_name': 'source',
    
    // Campaign tracking
    'ad_name': 'ad_name',
    'campaign_name': 'campaign_name',
    'adset_name': 'notes',
    'platform': 'notes',
    
    // Alternative column names (case variations)
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
    { id: 'guide', label: 'Setup Guide', icon: BookOpen }
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
      }, syncInterval * 60 * 1000); // Convert minutes to milliseconds
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [autoSync, isConnected, syncInterval]);

  const loadSavedSettings = () => {
    const savedToken = localStorage.getItem('google_sheets_access_token');
    const savedSpreadsheetId = localStorage.getItem('google_sheets_spreadsheet_id');
    const savedSheetName = localStorage.getItem('google_sheets_sheet_name');
    const savedAutoSync = localStorage.getItem('google_sheets_auto_sync');
    const savedSyncInterval = localStorage.getItem('google_sheets_sync_interval');
    const savedMapping = localStorage.getItem('google_sheets_field_mapping');
    const savedSelectedSheets = localStorage.getItem('google_sheets_selected_sheets');
    
    if (savedToken) {
      setGoogleAccessToken(savedToken);
      setIsConnected(true);
    }
    if (savedSpreadsheetId) {
      setSpreadsheetId(savedSpreadsheetId);
      setSpreadsheetUrl(`https://docs.google.com/spreadsheets/d/${savedSpreadsheetId}`);
    }
    if (savedSheetName) setSheetName(savedSheetName);
    if (savedAutoSync) setAutoSync(savedAutoSync === 'true');
    if (savedSyncInterval) setSyncInterval(Number(savedSyncInterval));
    if (savedMapping) setFieldMapping(JSON.parse(savedMapping));
    if (savedSelectedSheets) setSelectedSheets(JSON.parse(savedSelectedSheets));
  };

  const saveSettings = () => {
    localStorage.setItem('google_sheets_access_token', googleAccessToken);
    localStorage.setItem('google_sheets_spreadsheet_id', spreadsheetId);
    localStorage.setItem('google_sheets_sheet_name', sheetName);
    localStorage.setItem('google_sheets_auto_sync', autoSync.toString());
    localStorage.setItem('google_sheets_sync_interval', syncInterval.toString());
    localStorage.setItem('google_sheets_field_mapping', JSON.stringify(fieldMapping));
    localStorage.setItem('google_sheets_selected_sheets', JSON.stringify(selectedSheets));
  };

  const extractSpreadsheetId = (url: string): string => {
    // Extract ID from Google Sheets URL
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : url;
  };

  const handleSpreadsheetUrlChange = (url: string) => {
    setSpreadsheetUrl(url);
    const id = extractSpreadsheetId(url);
    setSpreadsheetId(id);
  };

  const initiateGoogleAuth = () => {
    // Google OAuth 2.0 setup
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID';
    const redirectUri = window.location.origin + '/oauth/google/callback';
    const scope = 'https://www.googleapis.com/auth/spreadsheets.readonly';
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=token&` +
      `scope=${encodeURIComponent(scope)}`;
    
    // Open OAuth popup
    const width = 600;
    const height = 700;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;
    
    const popup = window.open(
      authUrl,
      'Google OAuth',
      `width=${width},height=${height},left=${left},top=${top}`
    );

    // Listen for OAuth callback
    const checkPopup = setInterval(() => {
      try {
        if (popup && popup.closed) {
          clearInterval(checkPopup);
        }
        
        if (popup && popup.location.href.includes('access_token')) {
          const hash = popup.location.hash;
          const token = new URLSearchParams(hash.substring(1)).get('access_token');
          
          if (token) {
            setGoogleAccessToken(token);
            setIsConnected(true);
            setSuccess('Successfully connected to Google Sheets!');
            popup.close();
            clearInterval(checkPopup);
          }
        }
      } catch (e) {
        // Cross-origin error, popup still on Google domain
      }
    }, 500);
  };

  const testConnection = async () => {
    if (!googleAccessToken || !spreadsheetId) {
      setError('Please provide access token and spreadsheet ID');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Fetch spreadsheet metadata
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?includeGridData=false`,
        {
          headers: {
            'Authorization': `Bearer ${googleAccessToken}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to connect to Google Sheets. Please check your credentials.');
      }

      const data = await response.json();
      
      // Extract all sheets information
      const sheets: SheetInfo[] = data.sheets.map((sheet: any) => ({
        sheetId: sheet.properties.sheetId,
        title: sheet.properties.title,
        index: sheet.properties.index,
        rowCount: sheet.properties.gridProperties?.rowCount || 0,
        columnCount: sheet.properties.gridProperties?.columnCount || 0
      }));
      
      setAvailableSheets(sheets);
      
      // Auto-select all sheets by default if none selected
      if (selectedSheets.length === 0) {
        setSelectedSheets(sheets.map(s => s.title));
      }
      
      // Fetch sheet data with headers from first sheet or selected sheet
      const firstSheet = sheets[0]?.title || sheetName;
      const sheetResponse = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${firstSheet}!A1:Z1`,
        {
          headers: {
            'Authorization': `Bearer ${googleAccessToken}`
          }
        }
      );

      const sheetData = await sheetResponse.json();
      const headers = sheetData.values?.[0] || [];
      
      const columns: GoogleSheetColumn[] = headers.map((header: string, index: number) => ({
        name: header,
        index: index,
        mappedTo: fieldMapping[header] || ''
      }));

      setSheetData({
        spreadsheetId: data.spreadsheetId,
        spreadsheetName: data.properties.title,
        sheetName: firstSheet,
        columns: columns,
        rowCount: sheets[0]?.rowCount || 0
      });

      setIsConnected(true);
      setSuccess(`Successfully connected to "${data.properties.title}" - Found ${sheets.length} sheet(s)`);
      saveSettings();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed');
      setIsConnected(false);
    } finally {
      setLoading(false);
    }
  };

  const syncLeadsFromSheet = async () => {
    if (!isConnected || !spreadsheetId) {
      setError('Please connect to Google Sheets first');
      return;
    }

    if (selectedSheets.length === 0) {
      setError('Please select at least one sheet to sync');
      return;
    }

    setSyncStats(prev => ({ ...prev, isRunning: true }));
    setLoading(true);
    setError('');
    setSuccess('');

    let totalSuccessCount = 0;
    let totalErrorCount = 0;
    const errorDetails: string[] = [];
    const api = getApiClient();

    try {
      // Loop through all selected sheets
      for (const sheetName of selectedSheets) {
        try {
          // Fetch all data from the current sheet
          const response = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}`,
            {
              headers: {
                'Authorization': `Bearer ${googleAccessToken}`
              }
            }
          );

          if (!response.ok) {
            console.error(`Failed to fetch data from sheet: ${sheetName}`);
            continue;
          }

          const data = await response.json();
          const rows = data.values || [];
          
          if (rows.length < 2) {
            console.log(`No data found in sheet: ${sheetName}`);
            continue;
          }

          const headers = rows[0];
          const dataRows = rows.slice(1); // Skip header row

          // Import leads from this sheet to CRM
          for (const row of dataRows) {
            try {
              // Map row data to CRM lead format
              const leadData: any = {
                source: `google_sheets_${sheetName}`, // Track which sheet the lead came from
                status: 'new',
                score: 0
              };

              headers.forEach((header: string, index: number) => {
                const crmField = fieldMapping[header];
                if (crmField && row[index]) {
                  let value = row[index];
                  
                  // Clean phone number - remove "p:" prefix from Facebook leads
                  if (crmField === 'phone' && value.startsWith('p:')) {
                    value = value.substring(2).trim();
                  }
                  
                  // Skip test leads with dummy data
                  if (value.includes('<test lead:') || value.includes('dummy data')) {
                    return; // Skip this row
                  }
                  
                  leadData[crmField] = value;
                }
              });
              
              // Skip if this is a test lead
              if (!leadData.name || leadData.name.includes('<test lead:')) {
                continue;
              }

              // Check if lead already exists (by email or phone)
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

              totalSuccessCount++;
            } catch (err) {
              const errorMsg = err instanceof Error ? err.message : 'Unknown error';
              console.error('Error importing lead:', err);
              console.error('Lead data:', leadData);
              errorDetails.push(`Row error: ${errorMsg}`);
              totalErrorCount++;
            }
          }
        } catch (sheetError) {
          console.error(`Error processing sheet ${sheetName}:`, sheetError);
          totalErrorCount++;
        }
      }

      setSyncStats({
        totalImported: totalSuccessCount + totalErrorCount,
        successCount: totalSuccessCount,
        errorCount: totalErrorCount,
        lastSync: new Date().toLocaleString(),
        isRunning: false,
        errorDetails: errorDetails.slice(0, 10) // Keep only first 10 errors for display
      });

      if (totalSuccessCount > 0) {
        setSuccess(`Successfully imported ${totalSuccessCount} leads from ${selectedSheets.length} sheet(s)! ${totalErrorCount > 0 ? `(${totalErrorCount} errors)` : ''}`);
      }
      
      if (totalErrorCount > 0 && totalSuccessCount === 0) {
        setError(`Failed to import leads. Common issues: Backend API not responding, missing required fields, or authentication error. Check console for details.`);
      }
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
                <p className="text-green-100">Import leads automatically from Google Sheets</p>
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
              <p className="text-blue-800">
                Connect your Google Sheets to automatically import leads into your CRM. All new leads will be synced based on your configuration.
              </p>
            </div>

            <div className="space-y-4">
              {/* Google Authentication */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Google Authentication
                </label>
                <button
                  onClick={initiateGoogleAuth}
                  disabled={isConnected}
                  className={`w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg ${
                    isConnected
                      ? 'bg-green-100 text-green-800 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  <FileSpreadsheet className="w-5 h-5" />
                  <span>{isConnected ? 'Connected to Google' : 'Connect with Google'}</span>
                </button>
                <p className="text-xs text-gray-500 mt-1">
                  Click to authenticate with your Google account
                </p>
              </div>

              {/* Manual Token Input (Alternative) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Access Token (Manual)
                </label>
                <input
                  type="password"
                  value={googleAccessToken}
                  onChange={(e) => setGoogleAccessToken(e.target.value)}
                  placeholder="paste your Google Sheets API access token"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Alternatively, paste your access token manually
                </p>
              </div>

              {/* Spreadsheet URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Google Sheets URL
                </label>
                <input
                  type="text"
                  value={spreadsheetUrl}
                  onChange={(e) => handleSpreadsheetUrlChange(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Paste the full URL of your Google Sheet
                </p>
              </div>

              {/* Sheet Selection - Show after connection */}
              {isConnected && availableSheets.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Sheets to Import
                  </label>
                  <div className="border border-gray-300 rounded-lg p-4 space-y-2 max-h-60 overflow-y-auto">
                    {availableSheets.map((sheet) => (
                      <label key={sheet.sheetId} className="flex items-center space-x-3 hover:bg-gray-50 p-2 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedSheets.includes(sheet.title)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedSheets([...selectedSheets, sheet.title]);
                            } else {
                              setSelectedSheets(selectedSheets.filter(s => s !== sheet.title));
                            }
                          }}
                          className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                        />
                        <div className="flex-1">
                          <span className="text-sm font-medium text-gray-900">{sheet.title}</span>
                          <span className="text-xs text-gray-500 ml-2">({sheet.rowCount} rows)</span>
                        </div>
                      </label>
                    ))}
                  </div>
                  <div className="flex items-center space-x-2 mt-2">
                    <button
                      onClick={() => setSelectedSheets(availableSheets.map(s => s.title))}
                      className="text-xs text-green-600 hover:text-green-700 font-medium"
                    >
                      Select All
                    </button>
                    <span className="text-gray-400">|</span>
                    <button
                      onClick={() => setSelectedSheets([])}
                      className="text-xs text-gray-600 hover:text-gray-700 font-medium"
                    >
                      Deselect All
                    </button>
                    <span className="text-xs text-gray-500 ml-auto">
                      {selectedSheets.length} selected
                    </span>
                  </div>
                </div>
              )}

              {/* Sheet Name - Show before connection or as fallback */}
              {(!isConnected || availableSheets.length === 0) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sheet Name
                  </label>
                  <input
                    type="text"
                    value={sheetName}
                    onChange={(e) => setSheetName(e.target.value)}
                    placeholder="Sheet1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Name of the sheet tab (default: Sheet1)
                  </p>
                </div>
              )}

              {/* Auto Sync Settings */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">Auto-Sync</h3>
                    <p className="text-xs text-gray-500">Automatically sync leads at regular intervals</p>
                  </div>
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
                </div>

                {autoSync && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sync Interval (minutes)
                    </label>
                    <select
                      value={syncInterval}
                      onChange={(e) => setSyncInterval(Number(e.target.value))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value={1}>Every 1 minute</option>
                      <option value={5}>Every 5 minutes</option>
                      <option value={15}>Every 15 minutes</option>
                      <option value={30}>Every 30 minutes</option>
                      <option value={60}>Every hour</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4">
                <button
                  onClick={testConnection}
                  disabled={loading || !googleAccessToken || !spreadsheetId}
                  className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  <Link className="w-5 h-5" />
                  <span>{loading ? 'Testing...' : 'Test Connection'}</span>
                </button>

                <button
                  onClick={() => {
                    saveSettings();
                    setSuccess('Settings saved successfully!');
                  }}
                  disabled={!isConnected}
                  className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  <Settings className="w-5 h-5" />
                  <span>Save Settings</span>
                </button>
              </div>
            </div>

            {/* Connected Sheet Info */}
            {sheetData && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-2">Connected Sheet:</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><strong>Name:</strong> {sheetData.spreadsheetName}</p>
                  <p><strong>Sheet:</strong> {sheetData.sheetName}</p>
                  <p><strong>Columns:</strong> {sheetData.columns.length}</p>
                  <p><strong>Rows:</strong> ~{sheetData.rowCount}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Field Mapping Tab */}
        {activeTab === 'mapping' && (
          <div className="p-6">
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6">
              <p className="text-yellow-800">
                Map your Google Sheets columns to CRM fields. This ensures data is imported to the correct fields.
              </p>
            </div>

            {sheetData && sheetData.columns.length > 0 ? (
              <div className="space-y-4">
                {sheetData.columns.map((column) => (
                  <div key={column.index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700">
                        Sheet Column: <span className="font-bold text-blue-600">{column.name}</span>
                      </label>
                    </div>
                    <div className="flex-1">
                      <select
                        value={fieldMapping[column.name] || ''}
                        onChange={(e) => updateFieldMapping(column.name, e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      >
                        <option value="">-- Don't Import --</option>
                        {crmFields.map((field) => (
                          <option key={field.value} value={field.value}>
                            {field.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}

                <button
                  onClick={() => {
                    saveSettings();
                    setSuccess('Field mapping saved successfully!');
                  }}
                  className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
                >
                  Save Field Mapping
                </button>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Map className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Please connect to a Google Sheet first to see available columns</p>
              </div>
            )}
          </div>
        )}

        {/* Sync Status Tab */}
        {activeTab === 'sync' && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600 font-medium">Total Imported</p>
                    <p className="text-2xl font-bold text-blue-900">{syncStats.totalImported}</p>
                  </div>
                  <Download className="w-8 h-8 text-blue-400" />
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600 font-medium">Success</p>
                    <p className="text-2xl font-bold text-green-900">{syncStats.successCount}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
              </div>

              <div className="bg-red-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-red-600 font-medium">Errors</p>
                    <p className="text-2xl font-bold text-red-900">{syncStats.errorCount}</p>
                  </div>
                  <AlertCircle className="w-8 h-8 text-red-400" />
                </div>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-600 font-medium">Status</p>
                    <p className="text-sm font-bold text-purple-900">
                      {syncStats.isRunning ? 'Syncing...' : 'Idle'}
                    </p>
                  </div>
                  {syncStats.isRunning ? (
                    <RefreshCw className="w-8 h-8 text-purple-400 animate-spin" />
                  ) : (
                    <Pause className="w-8 h-8 text-purple-400" />
                  )}
                </div>
              </div>
            </div>

            {syncStats.lastSync && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>Last Sync:</strong> {syncStats.lastSync}
                </p>
              </div>
            )}

            {/* Error Details */}
            {syncStats.errorDetails && syncStats.errorDetails.length > 0 && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <h3 className="text-sm font-semibold text-red-800 mb-2 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Recent Errors (showing first 10)
                </h3>
                <div className="max-h-60 overflow-y-auto">
                  <ul className="text-xs text-red-700 space-y-1">
                    {syncStats.errorDetails.map((error, index) => (
                      <li key={index} className="border-b border-red-100 pb-1">
                        {index + 1}. {error}
                      </li>
                    ))}
                  </ul>
                </div>
                <p className="text-xs text-red-600 mt-3">
                  <strong>Tip:</strong> Open browser console (F12) for full error details
                </p>
              </div>
            )}

            <div className="space-y-4">
              <button
                onClick={syncLeadsFromSheet}
                disabled={loading || !isConnected || syncStats.isRunning}
                className="w-full bg-green-600 text-white px-6 py-4 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-lg font-semibold"
              >
                {loading || syncStats.isRunning ? (
                  <>
                    <RefreshCw className="w-6 h-6 animate-spin" />
                    <span>Syncing Leads...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-6 h-6" />
                    <span>Start Manual Sync</span>
                  </>
                )}
              </button>

              <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
                <p className="text-blue-800 text-sm">
                  {autoSync
                    ? `Automatic sync is enabled. Leads will be synced every ${syncInterval} minute(s).`
                    : 'Automatic sync is disabled. Use manual sync to import leads.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Setup Guide Tab */}
        {activeTab === 'guide' && (
          <div className="p-6 space-y-6">
            <div className="prose max-w-none">
              <h2 className="text-xl font-bold mb-4">Google Sheets Integration Setup Guide</h2>

              <div className="space-y-6">
                <div className="bg-blue-50 p-6 rounded-lg">
                  <h3 className="font-bold text-lg mb-3 flex items-center">
                    <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center mr-3">1</span>
                    Prepare Your Google Sheet
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-700 ml-11">
                    <li>ΓÇó Create a Google Sheet with your lead data</li>
                    <li>ΓÇó First row should contain column headers (Name, Email, Phone, etc.)</li>
                    <li>ΓÇó Each subsequent row represents one lead</li>
                    <li>ΓÇó Make sure the sheet is not empty</li>
                  </ul>
                </div>

                <div className="bg-green-50 p-6 rounded-lg">
                  <h3 className="font-bold text-lg mb-3 flex items-center">
                    <span className="bg-green-600 text-white w-8 h-8 rounded-full flex items-center justify-center mr-3">2</span>
                    Get Google Sheets API Access
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-700 ml-11">
                    <li>ΓÇó Go to Google Cloud Console: <a href="https://console.cloud.google.com" target="_blank" className="text-blue-600 underline">console.cloud.google.com</a></li>
                    <li>ΓÇó Create a new project or select existing one</li>
                    <li>ΓÇó Enable "Google Sheets API"</li>
                    <li>ΓÇó Create OAuth 2.0 credentials (Web application)</li>
                    <li>ΓÇó Add authorized redirect URI: {window.location.origin}/oauth/google/callback</li>
                    <li>ΓÇó Copy the Client ID to your .env file</li>
                  </ul>
                </div>

                <div className="bg-purple-50 p-6 rounded-lg">
                  <h3 className="font-bold text-lg mb-3 flex items-center">
                    <span className="bg-purple-600 text-white w-8 h-8 rounded-full flex items-center justify-center mr-3">3</span>
                    Connect Your Sheet
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-700 ml-11">
                    <li>ΓÇó Click "Connect with Google" to authenticate</li>
                    <li>ΓÇó Or paste your access token manually</li>
                    <li>ΓÇó Copy and paste your Google Sheets URL</li>
                    <li>ΓÇó Enter the sheet name (default: Sheet1)</li>
                    <li>ΓÇó Click "Test Connection"</li>
                  </ul>
                </div>

                <div className="bg-yellow-50 p-6 rounded-lg">
                  <h3 className="font-bold text-lg mb-3 flex items-center">
                    <span className="bg-yellow-600 text-white w-8 h-8 rounded-full flex items-center justify-center mr-3">4</span>
                    Map Your Fields
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-700 ml-11">
                    <li>ΓÇó Go to "Field Mapping" tab</li>
                    <li>ΓÇó Match each Google Sheet column to a CRM field</li>
                    <li>ΓÇó You can skip columns you don't want to import</li>
                    <li>ΓÇó Save your mapping configuration</li>
                  </ul>
                </div>

                <div className="bg-red-50 p-6 rounded-lg">
                  <h3 className="font-bold text-lg mb-3 flex items-center">
                    <span className="bg-red-600 text-white w-8 h-8 rounded-full flex items-center justify-center mr-3">5</span>
                    Sync Your Leads
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-700 ml-11">
                    <li>ΓÇó Go to "Sync Status" tab</li>
                    <li>ΓÇó Enable Auto-Sync for automatic imports</li>
                    <li>ΓÇó Or use Manual Sync to import on demand</li>
                    <li>ΓÇó Monitor sync statistics and errors</li>
                  </ul>
                </div>

                <div className="bg-gray-100 p-6 rounded-lg border-2 border-gray-300">
                  <h3 className="font-bold text-lg mb-3">≡ƒôï Environment Variable Required</h3>
                  <p className="text-sm text-gray-700 mb-2">Add this to your <code className="bg-gray-200 px-2 py-1 rounded">.env</code> file:</p>
                  <pre className="bg-gray-800 text-green-400 p-4 rounded-lg text-sm overflow-x-auto">
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GoogleSheetsIntegration;
