import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  MessageSquare, 
  BarChart3, 
  FileText, 
  Settings,
  Stethoscope,
  Zap,
  Link,
  Inbox,
  User,
  Target,
  Activity,
  Download,
  Facebook,
  Shield
} from 'lucide-react';

interface SidebarProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeSection, setActiveSection }) => {
  const { user } = useAuth();
  
  // Role hierarchy for access control
  const roleHierarchy = {
    'super_admin': { level: 5, label: 'Super Admin' },
    'senior_manager': { level: 4, label: 'Senior Manager' },
    'manager': { level: 3, label: 'Manager' },
    'team_leader': { level: 2, label: 'Team Leader' },
    'counselor': { level: 1, label: 'Counselor' }
  };

  // Define menu items with access levels
  const allMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, minLevel: 1 },
    { id: 'crm-pipeline', label: 'CRM Pipeline', icon: Target, minLevel: 1 },
    { id: 'leads', label: 'Lead Management', icon: Users, minLevel: 1 },
    { id: 'leads-monitoring', label: 'Lead Monitoring', icon: Activity, minLevel: 2 },
    { id: 'facebook-leads', label: 'Facebook Integration', icon: Facebook, minLevel: 3 },
    { id: 'inbox', label: 'Unified Inbox', icon: Inbox, minLevel: 1 },
    { id: 'communications', label: 'Communications Hub', icon: MessageSquare, minLevel: 1 },
    { id: 'students', label: 'Course Enrollments', icon: GraduationCap, minLevel: 1 },
    { id: 'analytics', label: 'CRM Analytics', icon: BarChart3, minLevel: 2 },
    { id: 'documents', label: 'Documents', icon: FileText, minLevel: 1 },
    { id: 'automations', label: 'Automations', icon: Zap, minLevel: 3 },
    { id: 'integrations', label: 'Integrations', icon: Link, minLevel: 3 },
    { id: 'data-export', label: 'Data Export', icon: Download, minLevel: 2 },
    { id: 'profile', label: 'Profile', icon: User, minLevel: 1 },
    { id: 'user-management', label: 'User Management', icon: Shield, minLevel: 2 },
    { id: 'super-admin-analytics', label: 'User Activity Analytics', icon: BarChart3, minLevel: 5 },
    { id: 'settings', label: 'Settings', icon: Settings, minLevel: 3 }
  ];

  // Get current user's access level
  const currentUserRole = user?.role || 'counselor';
  const currentUserLevel = roleHierarchy[currentUserRole as keyof typeof roleHierarchy]?.level || 1;

  // Filter menu items based on user's access level
  const menuItems = allMenuItems.filter(item => currentUserLevel >= item.minLevel);

  return (
    <div className="w-64 bg-white shadow-lg border-r border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
            <Stethoscope className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">DMHCA CRM</h1>
            <p className="text-sm text-gray-500">Delhi Medical Healthcare</p>
          </div>
        </div>
        
        {/* User Role Badge */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-blue-900">
                {roleHierarchy[currentUserRole as keyof typeof roleHierarchy]?.label || 'User'}
              </p>
              <p className="text-xs text-blue-600">
                Access Level {currentUserLevel} • {menuItems.length} pages available
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <nav className="p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            const isAccessible = currentUserLevel >= item.minLevel;
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive 
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  
                  {/* Access Level Indicator */}
                  <div className="flex items-center space-x-1">
                    {item.minLevel > 1 && (
                      <span className={`px-1.5 py-0.5 text-xs rounded-full font-medium ${
                        isAccessible 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        L{item.minLevel}
                      </span>
                    )}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
        
        {/* Access Legend */}
        <div className="mt-6 p-3 bg-gray-50 rounded-lg">
          <h4 className="text-xs font-semibold text-gray-700 mb-2">Access Levels</h4>
          <div className="space-y-1 text-xs text-gray-600">
            <div className="flex justify-between">
              <span>L1: Basic Access</span>
              <span className="text-gray-500">Counselor+</span>
            </div>
            <div className="flex justify-between">
              <span>L2: Team Features</span>
              <span className="text-gray-500">Team Leader+</span>
            </div>
            <div className="flex justify-between">
              <span>L3: Management</span>
              <span className="text-gray-500">Manager+</span>
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Sidebar;