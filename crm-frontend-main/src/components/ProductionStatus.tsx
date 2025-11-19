import React, { useState, useEffect } from 'react';
import { getApiClient } from '../lib/backend';
import { Wifi, WifiOff, AlertCircle } from 'lucide-react';

const ProductionStatus: React.FC = () => {
  const [status, setStatus] = useState<'checking' | 'connected' | 'disconnected' | 'error'>('checking');
  const [backendInfo, setBackendInfo] = useState<any>(null);

  useEffect(() => {
    checkBackendConnection();
    
    // Check every 30 seconds
    const interval = setInterval(checkBackendConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkBackendConnection = async () => {
    try {
      const API_BASE = import.meta.env.VITE_API_BASE_URL;
      
      // Test backend health first
      const healthResponse = await fetch(`${API_BASE}/health`);
      if (!healthResponse.ok) {
        throw new Error('Backend health check failed');
      }
      
      const healthData = await healthResponse.json();
      
      // Test authenticated endpoint
      const apiClient = getApiClient();
      const leads: any = await apiClient.getLeads();
      
      setStatus('connected');
      setBackendInfo({
        status: 'connected',
        backend: 'Railway API Server',
        database: healthData.services?.database || 'Connected',
        connection: 'Production API',
        leads_count: Array.isArray(leads) ? leads.length : 'Available',
        uptime: Math.floor(healthData.uptime || 0),
        version: healthData.version || '2.0.0'
      });
    } catch (error) {
      console.warn('⚠️ Backend connection failed:', error);
      setStatus('error');
      setBackendInfo({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        status: 'error'
      });
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'connected':
        return <Wifi className="w-4 h-4 text-green-500" />;
      case 'disconnected':
      case 'error':
        return <WifiOff className="w-4 h-4 text-red-500" />;
      case 'checking':
      default:
        return <AlertCircle className="w-4 h-4 text-yellow-500 animate-pulse" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'connected':
        return `Connected to Production (${backendInfo?.environment || 'production'})`;
      case 'disconnected':
        return 'Backend Offline';
      case 'error':
        return 'Connection Error';
      case 'checking':
      default:
        return 'Checking...';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'connected':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'disconnected':
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'checking':
      default:
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
    }
  };

  return (
    <div className={`inline-flex items-center space-x-2 px-3 py-2 rounded-lg border text-sm font-medium ${getStatusColor()}`}>
      {getStatusIcon()}
      <span>{getStatusText()}</span>
      {backendInfo?.version && (
        <span className="text-xs opacity-75">v{backendInfo.version}</span>
      )}
    </div>
  );
};

export default ProductionStatus;
