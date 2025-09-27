import React, { useState } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import { NotificationProvider } from './components/NotificationSystem';
import AuthWrapper from './components/AuthWrapper';
import { useAuth } from './hooks/useAuth';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import CRMPipeline from './components/CRMPipeline';
import LeadsManagement from './components/LeadsManagement';
import LeadsMonitoring from './components/LeadsMonitoring';
import FacebookLeadIntegration from './components/FacebookLeadIntegration';
import MultiChannelInbox from './components/MultiChannelInbox';
import CommunicationsHub from './components/CommunicationsHub';
import StudentsManagement from './components/StudentsManagement';
import Analytics from './components/Analytics';
import Documents from './components/Documents';
import Automations from './components/Automations';
import Integrations from './components/Integrations';
import UserProfile from './components/UserProfile';
import UserManagement from './components/UserManagement';
import Settings from './components/Settings';
import DataExport from './components/DataExport';

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
    'leads-monitoring': 2,
    'facebook-leads': 3,
    'inbox': 1,
    'communications': 1,
    'students': 1,
    'analytics': 2,
    'documents': 1,
    'automations': 3,
    'integrations': 3,
    'real-time-integrations': 3,
    'profile': 1,
    'user-management': 2,
    'settings': 3,
    'data-export': 2
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

      switch (activeSection) {
        case 'dashboard':
          return <Dashboard onNavigate={setActiveSection} />;
        case 'crm-pipeline':
          return <CRMPipeline />;
        case 'leads':
          return <LeadsManagement />;
        case 'leads-monitoring':
          return <LeadsMonitoring />;
        case 'facebook-leads':
          return <FacebookLeadIntegration />;
        case 'inbox':
          return <MultiChannelInbox />;
        case 'communications':
          return <CommunicationsHub />;
        case 'students':
          return <StudentsManagement />;
        case 'analytics':
          return <Analytics />;
        case 'documents':
          return <Documents />;
        case 'automations':
          return <Automations />;
        case 'integrations':
          return <Integrations />;
        case 'real-time-integrations':
          return <Integrations />;
        case 'profile':
          return <UserProfile />;
        case 'user-management':
          return <UserManagement />;
        case 'settings':
          return <Settings />;
        case 'data-export':
          return <DataExport />;
        default:
          return <Dashboard onNavigate={setActiveSection} />;
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
