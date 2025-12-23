import React, { useState, Suspense, lazy } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import { NotificationProvider } from './components/NotificationSystem';
import AuthWrapper from './components/AuthWrapper';
import { useAuth } from './hooks/useAuth';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ConnectionStatus from './components/ConnectionStatus';

// Lazy load heavy components to reduce initial bundle size
const Dashboard = lazy(() => import('./components/Dashboard'));
const CRMPipeline = lazy(() => import('./components/CRMPipeline'));
const LeadsManagement = lazy(() => import('./components/LeadsManagement'));
const LeadsMonitoring = lazy(() => import('./components/LeadsMonitoring'));
const FacebookLeadIntegration = lazy(() => import('./components/FacebookLeadIntegration'));
const StudentsManagement = lazy(() => import('./components/StudentsManagement'));
const Analytics = lazy(() => import('./components/Analytics'));
const Integrations = lazy(() => import('./components/Integrations'));
const UserProfile = lazy(() => import('./components/UserProfile'));
const UserManagement = lazy(() => import('./components/UserManagement'));
const Settings = lazy(() => import('./components/Settings'));
const DataExport = lazy(() => import('./components/DataExport'));
const ScheduledExports = lazy(() => import('./components/ScheduledExports'));
const AdvancedAnalyticsCharts = lazy(() => import('./components/AdvancedAnalyticsCharts'));
const LeadSegmentation = lazy(() => import('./components/LeadSegmentation'));

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="flex flex-col items-center space-y-4">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-gray-600 animate-pulse">Loading...</p>
    </div>
  </div>
);

// Protected Component Wrapper
const ProtectedComponent: React.FC = () => {
  const { user } = useAuth();
  
  return (
    <div className="p-8 text-center bg-red-50 border border-red-200 rounded-lg">
      <div className="text-red-600 mb-4">
        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-red-800 mb-2">Access Denied</h3>
      <p className="text-red-600 mb-4">
        You don't have permission to access this page.
      </p>
      <p className="text-sm text-red-500">
        Current Role: <strong>{user?.role || 'Unknown'}</strong> • Contact your supervisor for access.
      </p>
    </div>
  );
};

const App: React.FC = () => {
  const [activeSection, setActiveSection] = useState('dashboard');

  // Application initialization
  React.useEffect(() => {
    // CRM Frontend v1.1.0 initialized
  }, []);

  // Role hierarchy for access control
  const roleHierarchy = {
    'super_admin': { level: 5 },
    'senior_manager': { level: 4 },
    'manager': { level: 3 },
    'team_leader': { level: 2 },
    'counselor': { level: 1 }
  };

  // Page access requirements
  const pageAccessLevels: { [key: string]: number } = {
    'dashboard': 1,
    'crm-pipeline': 1,
    'leads': 1,
    'leads-monitoring': 1,
    'lead-segmentation': 5, // Super Admin only - Advanced Marketing & Bulk WhatsApp
    'facebook-leads': 3,
    'students': 1,
    'analytics': 2,
    'integrations': 3,
    'real-time-integrations': 3,
    'profile': 1,
    'user-management': 2,
    'settings': 3,
    'data-export': 2,
    'scheduled-exports': 2,
    'advanced-analytics': 2
  };

  const renderActiveSection = () => {
    // This will be called inside AuthWrapper where useAuth is available
    const AppContent = () => {
      const { user } = useAuth();
      const currentUserRole = user?.role || 'counselor';
      const currentUserLevel = roleHierarchy[currentUserRole as keyof typeof roleHierarchy]?.level || 1;
      const requiredLevel = pageAccessLevels[activeSection] || 1;

      // Check if user has access to current page
      if (currentUserLevel < requiredLevel) {
        return <ProtectedComponent />;
      }

      // Wrap each component with Suspense for lazy loading
      switch (activeSection) {
        case 'dashboard':
          return <Suspense fallback={<PageLoader />}><Dashboard onNavigate={setActiveSection} /></Suspense>;
        case 'crm-pipeline':
          return <Suspense fallback={<PageLoader />}><CRMPipeline /></Suspense>;
        case 'leads':
          return <Suspense fallback={<PageLoader />}><LeadsManagement /></Suspense>;
        case 'leads-monitoring':
          return <Suspense fallback={<PageLoader />}><LeadsMonitoring /></Suspense>;
        case 'lead-segmentation':
          return <Suspense fallback={<PageLoader />}><LeadSegmentation /></Suspense>;
        case 'facebook-leads':
          return <Suspense fallback={<PageLoader />}><FacebookLeadIntegration /></Suspense>;
        case 'students':
          return <Suspense fallback={<PageLoader />}><StudentsManagement /></Suspense>;
        case 'analytics':
          return <Suspense fallback={<PageLoader />}><Analytics /></Suspense>;
        case 'integrations':
          return <Suspense fallback={<PageLoader />}><Integrations /></Suspense>;
        case 'real-time-integrations':
          return <Suspense fallback={<PageLoader />}><Integrations /></Suspense>;
        case 'profile':
          return <Suspense fallback={<PageLoader />}><UserProfile /></Suspense>;
        case 'user-management':
          return <Suspense fallback={<PageLoader />}><UserManagement /></Suspense>;
        case 'settings':
          return <Suspense fallback={<PageLoader />}><Settings /></Suspense>;
        case 'data-export':
          return <Suspense fallback={<PageLoader />}><DataExport /></Suspense>;
        case 'scheduled-exports':
          return <Suspense fallback={<PageLoader />}><ScheduledExports /></Suspense>;
        case 'advanced-analytics':
          return <Suspense fallback={<PageLoader />}><AdvancedAnalyticsCharts /></Suspense>;
        default:
          return <Suspense fallback={<PageLoader />}><Dashboard onNavigate={setActiveSection} /></Suspense>;
      }
    };

    return <AppContent />;
  };

  return (
    <ErrorBoundary>
      <NotificationProvider>
        <AuthWrapper>
          <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <Sidebar 
              activeSection={activeSection} 
              setActiveSection={setActiveSection} 
            />
            
            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <Header />
              
              {/* Connection Status */}
              <div className="px-6 py-2">
                <ConnectionStatus className="w-full" />
              </div>
              
              {/* Page Content */}
              <main className="flex-1 overflow-y-auto">
                <div className="p-6">
                  {renderActiveSection()}
                </div>
              </main>
            </div>
          </div>
        </AuthWrapper>
      </NotificationProvider>
    </ErrorBoundary>
  );
};

export default App;
