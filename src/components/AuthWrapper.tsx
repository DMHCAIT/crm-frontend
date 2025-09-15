import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import LoginForm from './LoginForm';
import { TokenManager } from '../lib/productionAuth';

interface AuthWrapperProps {
  children: React.ReactNode;
}

const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  const { isAuthenticated, loading, error, user } = useAuth();
  const [forceRender, setForceRender] = useState(0);
  
  // Debug log to track authentication state changes
  useEffect(() => {
    console.log('🔍 AuthWrapper state:', { isAuthenticated, loading, error, user });
  }, [isAuthenticated, loading, error, user]);

  // Additional check for authentication completion
  useEffect(() => {
    if (user && TokenManager.getToken() && !loading) {
      console.log('✅ User logged in successfully, forcing component re-render');
      setForceRender(prev => prev + 1);
    }
  }, [user, loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl shadow-xl p-8 max-w-md">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading DMHCA CRM</h2>
          <p className="text-gray-600 mb-4">Initializing your dashboard...</p>
          
          <div className="text-left bg-gray-50 p-3 rounded text-xs text-gray-600 mt-4">
            <p><strong>Debug Info:</strong></p>
            <p>Check browser console (F12) for logs</p>
            <p>Verify Supabase environment variables</p>
            <p>If stuck, try refreshing the page</p>
          </div>
          
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  if (error && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl shadow-xl p-8 max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-2xl">⚠️</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Connection Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-y-2">
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
            <button 
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              className="w-full bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors text-sm"
            >
              Clear Cache & Reload
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginForm key={forceRender} />;
  }

  return <div key={forceRender}>{children}</div>;
};

export default AuthWrapper;