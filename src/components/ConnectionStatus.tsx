import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, AlertTriangle, CheckCircle } from 'lucide-react';
import { getApiClient } from '../lib/backend';

interface ConnectionStatusProps {
  className?: string;
}

type ConnectionStatus = 'checking' | 'connected' | 'disconnected' | 'error';

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ className = '' }) => {
  const [status, setStatus] = useState<ConnectionStatus>('checking');
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const checkConnection = async () => {
    try {
      setStatus('checking');
      const apiClient = getApiClient();
      
      // Try to make a simple API call
      await apiClient.healthCheck();
      
      setStatus('connected');
      setErrorMessage('');
      setLastCheck(new Date());
    } catch (error) {
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Connection failed');
      setLastCheck(new Date());
    }
  };

  useEffect(() => {
    checkConnection();
    
    // Check connection every 30 seconds
    const interval = setInterval(checkConnection, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = () => {
    switch (status) {
      case 'checking':
        return <Wifi className="w-4 h-4 animate-pulse text-yellow-500" />;
      case 'connected':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <WifiOff className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'checking':
        return 'Checking...';
      case 'connected':
        return 'Connected';
      case 'error':
        return 'Connection Error';
      default:
        return 'Disconnected';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'checking':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'connected':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (status === 'connected') {
    // Only show a small indicator when connected
    return (
      <div className={`flex items-center space-x-1 ${className}`}>
        {getStatusIcon()}
        <span className="text-xs text-green-600">Online</span>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <div className={`flex items-center justify-between p-3 rounded-lg border ${getStatusColor()}`}>
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <div>
            <div className="font-medium text-sm">{getStatusText()}</div>
            {status === 'error' && (
              <div className="text-xs mt-1">{errorMessage}</div>
            )}
            {lastCheck && (
              <div className="text-xs opacity-75">
                Last checked: {lastCheck.toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>
        
        {status === 'error' && (
          <button
            onClick={checkConnection}
            className="px-3 py-1 text-xs bg-white border border-current rounded hover:bg-opacity-50 transition-colors"
          >
            Retry
          </button>
        )}
      </div>
      
      {status === 'error' && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
          <strong>Troubleshooting:</strong>
          <ul className="mt-1 ml-4 list-disc space-y-1">
            <li>Check your internet connection</li>
            <li>Try refreshing the page</li>
            <li>The server may be temporarily unavailable</li>
            <li>Contact support if the issue persists</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default ConnectionStatus;