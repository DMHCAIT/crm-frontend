import React, { useState, useEffect } from 'react';
import { 
  Webhook, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  Copy, 
  ExternalLink,
  Settings
} from 'lucide-react';

interface WebhookStatus {
  isActive: boolean;
  lastReceived: string | null;
  totalReceived: number;
  errors: number;
  url: string;
}

const FacebookWebhookManager: React.FC = () => {
  const [webhookStatus, setWebhookStatus] = useState<WebhookStatus>({
    isActive: false,
    lastReceived: null,
    totalReceived: 0,
    errors: 0,
    url: ''
  });
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadWebhookStatus();
    // Poll webhook status every 30 seconds
    const interval = setInterval(loadWebhookStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadWebhookStatus = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/facebook/webhook/status`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('crm_auth_token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setWebhookStatus(data);
      }
    } catch (error) {
      console.error('Failed to load webhook status:', error);
    }
  };

  const testWebhook = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/facebook/webhook/test`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('crm_auth_token')}`
        }
      });

      if (response.ok) {
        await loadWebhookStatus();
      }
    } catch (error) {
      console.error('Webhook test failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyWebhookUrl = () => {
    const url = `${import.meta.env.VITE_API_BASE_URL}/api/facebook/webhook`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openFacebookDeveloperConsole = () => {
    window.open('https://developers.facebook.com/apps/', '_blank');
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Webhook className="h-6 w-6 text-purple-600" />
          <div>
            <h3 className="text-lg font-semibold">Facebook Webhook</h3>
            <p className="text-sm text-gray-600">Real-time lead notifications</p>
          </div>
        </div>
        <button
          onClick={testWebhook}
          disabled={loading}
          className="flex items-center space-x-2 px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-400"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Test</span>
        </button>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center space-x-2">
            {webhookStatus.isActive ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-500" />
            )}
            <div>
              <p className="text-sm font-medium text-gray-600">Status</p>
              <p className="text-lg font-bold">
                {webhookStatus.isActive ? 'Active' : 'Inactive'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <div>
            <p className="text-sm font-medium text-gray-600">Total Received</p>
            <p className="text-lg font-bold">{webhookStatus.totalReceived}</p>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <div>
            <p className="text-sm font-medium text-gray-600">Errors</p>
            <p className="text-lg font-bold text-red-600">{webhookStatus.errors}</p>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <div>
            <p className="text-sm font-medium text-gray-600">Last Received</p>
            <p className="text-sm font-bold">
              {webhookStatus.lastReceived 
                ? new Date(webhookStatus.lastReceived).toLocaleString()
                : 'Never'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Webhook URL */}
      <div className="border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium">Webhook URL</h4>
          <div className="flex space-x-2">
            <button
              onClick={copyWebhookUrl}
              className="flex items-center space-x-1 px-2 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            >
              <Copy className="h-4 w-4" />
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
        </div>
        <div className="bg-gray-50 p-3 rounded border font-mono text-sm">
          {import.meta.env.VITE_API_BASE_URL}/api/facebook/webhook
        </div>
      </div>

      {/* Setup Instructions */}
      <div className="border border-blue-200 bg-blue-50 rounded-lg p-4">
        <h4 className="font-medium text-blue-800 mb-3">Facebook Webhook Setup Instructions</h4>
        <div className="text-sm text-blue-700 space-y-2">
          <div className="flex items-start space-x-2">
            <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">1</span>
            <p>Go to Facebook Developers Console and select your app</p>
          </div>
          <div className="flex items-start space-x-2">
            <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">2</span>
            <p>Navigate to Products → Webhooks → Page</p>
          </div>
          <div className="flex items-start space-x-2">
            <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">3</span>
            <p>Add the webhook URL above and set verify token: <code className="bg-blue-100 px-1 rounded">crm_webhook_token_2024</code></p>
          </div>
          <div className="flex items-start space-x-2">
            <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">4</span>
            <p>Subscribe to <strong>leadgen</strong> field</p>
          </div>
        </div>
        
        <button
          onClick={openFacebookDeveloperConsole}
          className="mt-4 flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <ExternalLink className="h-4 w-4" />
          <span>Open Facebook Console</span>
        </button>
      </div>

      {/* Webhook Events Log */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium mb-3">Recent Webhook Events</h4>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {/* This would be populated with actual webhook events */}
          <div className="text-sm text-gray-500 text-center py-8">
            No recent webhook events
          </div>
        </div>
      </div>

      {/* Configuration Tips */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <Settings className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div className="text-sm">
            <h4 className="font-medium text-yellow-800 mb-1">Configuration Tips</h4>
            <ul className="text-yellow-700 space-y-1 list-disc list-inside">
              <li>Ensure your Facebook app has Lead Ads permissions</li>
              <li>Test webhook connection before going live</li>
              <li>Monitor webhook events for debugging</li>
              <li>Keep your access token updated and secure</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacebookWebhookManager;