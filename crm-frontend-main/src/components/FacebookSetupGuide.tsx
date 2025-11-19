import React, { useState } from 'react';
import { 
  BookOpen, 
  ExternalLink, 
  CheckCircle, 
  AlertTriangle, 
  Copy, 
  Eye, 
  EyeOff,
  Key,
  Webhook
} from 'lucide-react';

const FacebookSetupGuide: React.FC = () => {
  const [activeStep, setActiveStep] = useState(1);
  const [showTokens, setShowTokens] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const steps = [
    {
      id: 1,
      title: 'Create Facebook App',
      description: 'Set up your Facebook app for lead ads integration'
    },
    {
      id: 2,
      title: 'Configure Lead Ads',
      description: 'Enable and configure Lead Ads API permissions'
    },
    {
      id: 3,
      title: 'Setup Webhooks',
      description: 'Configure real-time lead notifications'
    },
    {
      id: 4,
      title: 'Get Access Tokens',
      description: 'Generate and configure access tokens'
    },
    {
      id: 5,
      title: 'Test Integration',
      description: 'Verify your setup is working correctly'
    }
  ];

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const openLink = (url: string) => {
    window.open(url, '_blank');
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-2">Step 1: Create Facebook App</h4>
              <ol className="text-sm text-blue-700 space-y-2 list-decimal list-inside">
                <li>Go to Facebook for Developers and create a new app</li>
                <li>Choose "Business" as your app type</li>
                <li>Add "Lead Ads" product to your app</li>
                <li>Complete the basic app setup with your business details</li>
              </ol>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => openLink('https://developers.facebook.com/apps/')}
                className="flex items-center justify-center space-x-2 p-4 border-2 border-blue-200 rounded-lg hover:bg-blue-50"
              >
                <ExternalLink className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-blue-600">Facebook Developers</span>
              </button>

              <button
                onClick={() => openLink('https://developers.facebook.com/docs/lead-ads')}
                className="flex items-center justify-center space-x-2 p-4 border-2 border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <BookOpen className="h-5 w-5 text-gray-600" />
                <span className="font-medium text-gray-600">Lead Ads Documentation</span>
              </button>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-700">
                  <p className="font-medium mb-1">Important Notes:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Your app needs to be approved for Lead Ads API access</li>
                    <li>You must have a Facebook Business Manager account</li>
                    <li>Your business must be verified on Facebook</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-2">Step 2: Configure Lead Ads Permissions</h4>
              <ol className="text-sm text-blue-700 space-y-2 list-decimal list-inside">
                <li>In your Facebook app, go to "App Review" → "Permissions and Features"</li>
                <li>Request access to "leads_retrieval" permission</li>
                <li>Submit your app for review with required documentation</li>
                <li>Wait for approval (can take 7-14 business days)</li>
              </ol>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-800 mb-2">Required Permissions</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h5 className="font-medium text-gray-700 mb-2">Standard Permissions</h5>
                  <ul className="text-gray-600 space-y-1">
                    <li>✓ pages_show_list</li>
                    <li>✓ pages_read_engagement</li>
                    <li>✓ leads_retrieval</li>
                  </ul>
                </div>
                <div>
                  <h5 className="font-medium text-gray-700 mb-2">Advanced Permissions</h5>
                  <ul className="text-gray-600 space-y-1">
                    <li>✓ pages_manage_metadata</li>
                    <li>✓ business_management</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-2">Step 3: Setup Webhooks</h4>
              <ol className="text-sm text-blue-700 space-y-2 list-decimal list-inside">
                <li>Go to Products → Webhooks in your Facebook app</li>
                <li>Create a webhook subscription for "Page"</li>
                <li>Use the callback URL and verify token below</li>
                <li>Subscribe to the "leadgen" field</li>
                <li>Test the webhook endpoint</li>
              </ol>
            </div>

            <div className="space-y-3">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Callback URL</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={`${import.meta.env.VITE_API_BASE_URL}/api/facebook/webhook`}
                    readOnly
                    className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-md font-mono text-sm"
                  />
                  <button
                    onClick={() => copyToClipboard(`${import.meta.env.VITE_API_BASE_URL}/api/facebook/webhook`, 'webhook')}
                    className="flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    <Copy className="h-4 w-4" />
                    <span>{copied === 'webhook' ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Verify Token</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value="crm_webhook_token_2024"
                    readOnly
                    className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-md font-mono text-sm"
                  />
                  <button
                    onClick={() => copyToClipboard('crm_webhook_token_2024', 'token')}
                    className="flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    <Copy className="h-4 w-4" />
                    <span>{copied === 'token' ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={() => openLink('https://developers.facebook.com/docs/graph-api/webhooks')}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              <Webhook className="h-4 w-4" />
              <span>Webhooks Documentation</span>
            </button>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-2">Step 4: Get Access Tokens</h4>
              <ol className="text-sm text-blue-700 space-y-2 list-decimal list-inside">
                <li>Go to Tools → Graph API Explorer</li>
                <li>Select your app and generate a User Access Token</li>
                <li>Add required permissions (leads_retrieval, pages_show_list)</li>
                <li>Exchange for a Long-Lived Page Access Token</li>
                <li>Copy your tokens and configure them in the CRM</li>
              </ol>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">Your Access Tokens</label>
                <button
                  onClick={() => setShowTokens(!showTokens)}
                  className="flex items-center space-x-1 text-sm text-gray-500 hover:text-gray-700"
                >
                  {showTokens ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  <span>{showTokens ? 'Hide' : 'Show'}</span>
                </button>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Page Access Token</label>
                  <input
                    type={showTokens ? 'text' : 'password'}
                    placeholder="Enter your Facebook Page Access Token"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Page ID</label>
                  <input
                    type="text"
                    placeholder="Enter your Facebook Page ID"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => openLink('https://developers.facebook.com/tools/explorer/')}
                className="flex items-center justify-center space-x-2 p-4 border-2 border-blue-200 rounded-lg hover:bg-blue-50"
              >
                <Key className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-blue-600">Graph API Explorer</span>
              </button>

              <button
                onClick={() => openLink('https://developers.facebook.com/docs/facebook-login/access-tokens')}
                className="flex items-center justify-center space-x-2 p-4 border-2 border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <BookOpen className="h-5 w-5 text-gray-600" />
                <span className="font-medium text-gray-600">Access Tokens Guide</span>
              </button>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-2">Step 5: Test Your Integration</h4>
              <ol className="text-sm text-blue-700 space-y-2 list-decimal list-inside">
                <li>Create a test Lead Ad campaign in Facebook Ads Manager</li>
                <li>Submit a test lead through your form</li>
                <li>Verify the lead appears in your CRM</li>
                <li>Check webhook logs for any errors</li>
                <li>Test field mapping and data accuracy</li>
              </ol>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div className="text-sm text-green-700">
                  <p className="font-medium mb-1">Testing Checklist:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>✓ Facebook app is live and approved</li>
                    <li>✓ Webhook receives test events successfully</li>
                    <li>✓ Lead data maps correctly to CRM fields</li>
                    <li>✓ No errors in integration logs</li>
                    <li>✓ Real-time notifications are working</li>
                  </ul>
                </div>
              </div>
            </div>

            <button
              onClick={() => openLink('https://business.facebook.com/adsmanager')}
              className="flex items-center justify-center space-x-2 w-full p-4 border-2 border-green-200 rounded-lg hover:bg-green-50"
            >
              <ExternalLink className="h-5 w-5 text-green-600" />
              <span className="font-medium text-green-600">Facebook Ads Manager</span>
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-6">
        <BookOpen className="h-6 w-6 text-purple-600" />
        <div>
          <h3 className="text-lg font-semibold">Facebook Lead Ads Setup Guide</h3>
          <p className="text-sm text-gray-600">Complete setup instructions for Facebook integration</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="mb-6">
        <div className="flex items-center space-x-4 overflow-x-auto pb-2">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center space-x-2 whitespace-nowrap">
              <button
                onClick={() => setActiveStep(step.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeStep === step.id
                    ? 'bg-purple-100 text-purple-700 border-2 border-purple-300'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  activeStep === step.id ? 'bg-purple-600 text-white' : 'bg-gray-400 text-white'
                }`}>
                  {step.id}
                </span>
                <span>{step.title}</span>
              </button>
              {index < steps.length - 1 && (
                <div className="w-8 h-px bg-gray-300"></div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="min-h-96">
        {renderStepContent()}
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-6 pt-6 border-t border-gray-200">
        <button
          onClick={() => setActiveStep(Math.max(1, activeStep - 1))}
          disabled={activeStep === 1}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <span className="text-sm text-gray-500">
          Step {activeStep} of {steps.length}
        </span>
        <button
          onClick={() => setActiveStep(Math.min(steps.length, activeStep + 1))}
          disabled={activeStep === steps.length}
          className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default FacebookSetupGuide;