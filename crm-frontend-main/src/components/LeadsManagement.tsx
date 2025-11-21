import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getApiClient } from '../lib/backend';
import { TokenManager } from '../lib/productionAuth';
import { useNotify } from './NotificationSystem';
import { STATUS_OPTIONS, STATUS_COLORS, QUALIFICATION_OPTIONS } from '../constants/crmConstants';
import { useLeads, useBulkUpdateLeads, useBulkDeleteLeads } from '../hooks/useQueries';
import { 
  Search, 
  Plus,
  Filter,
  Phone,
  Mail,
  Clock,
  CheckCircle,
  Edit3,
  Edit2,
  Target,
  Calendar,
  Activity,
  X,
  ChevronDown,
  ChevronUp,
  Trash2,
  TrendingUp,
  Users,
  ArrowRight,
  UserCheck,
  FileDown,
  FileUp,
  ArrowUpDown,
  User,
  MessageSquare,
  BarChart3,
  PieChart,
  TrendingDown,
  AlertTriangle,
  Timer,
  Eye,
  Bell,
  Zap,
  RefreshCw,
  Bug,
  Building
} from 'lucide-react';

// Types and Interfaces
interface Lead {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  country: string;
  branch: string;
  qualification: string;
  source: string;
  course: string;
  status: string;
  assignedTo: string;
  followUp: string;
  company: string;
  createdAt: string;
  updatedAt: string;
  updated_by?: string; // Who last updated the lead (username)
  notes: Note[];
  fees?: number; // Optional fees field for enrolled students
  estimatedValue?: number; // Estimated value for warm/hot leads
  actualRevenue?: number; // Actual revenue when enrolled
  currency?: 'USD' | 'INR'; // Currency based on company (IBMP = USD, DMHCA = INR)
}

interface AssignableUser {
  id: string;
  name: string;
  email: string;
  role: string;
  username?: string;
  display_name?: string;
}

interface NewLeadForm {
  fullName: string;
  email: string;
  phone: string;
  country: string;
  branch: string;
  qualification: string;
  source: string;
  course: string;
  status: string;
  assignedTo: string;
  followUp: string;
  company: string;
}

interface Note {
  id: string;
  content: string;
  timestamp: string;
  author: string;
}

interface LeadActivity {
  id: string;
  lead_id: string;
  activity_type: string;
  description: string;
  old_value?: string;
  new_value?: string;
  performed_by: string;
  timestamp: string;
  created_at: string;
}

interface CombinedItem extends Note {
  type: 'note' | 'activity';
  activityType?: string;
  oldValue?: string;
  newValue?: string;
}

interface LeadStats {
  total: number;
  hot: number;
  warm: number;
  followup: number;
  converted: number;
  thisMonth: number;
}

interface UserActivityStats {
  userId: string;
  username: string;
  role: string;
  totalLeads: number;
  updatedToday: number;
  updatedThisWeek: number;
  updatedThisMonth: number;
  hotLeads: number;
  warmLeads: number;
  enrolledLeads: number;
  totalRevenue: number;
  estimatedRevenue: number;
}

// Currency Utility Functions
const getCurrencyByCompany = (company: string): 'USD' | 'INR' => {
  const companyLower = company?.toLowerCase() || '';
  if (companyLower.includes('ibmp')) {
    return 'USD';
  }
  return 'INR'; // Default to INR for DMHCA and others
};

const formatCurrency = (amount: number, currency: 'USD' | 'INR'): string => {
  if (currency === 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  } else {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  }
};

const getDefaultCoursePrice = (company: string, course: string): number => {
  const currency = getCurrencyByCompany(company);
  
  if (currency === 'USD') {
    // IBMP course prices in USD
    switch (course?.toLowerCase()) {
      case 'mba': return 15000;
      case 'bba': return 12000;
      case 'mca': return 8000;
      case 'bca': return 6000;
      default: return 10000;
    }
  } else {
    // DMHCA course prices in INR
    switch (course?.toLowerCase()) {
      case 'mba': return 120000;
      case 'bba': return 80000;
      case 'mca': return 75000;
      case 'bca': return 60000;
      default: return 70000;
    }
  }
};

const LeadsManagement: React.FC = () => {
  const { user } = useAuth();
  const notify = useNotify();
  
  // Pagination States (must come first)
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const bulkUpdateMutation = useBulkUpdateLeads();
  const bulkDeleteMutation = useBulkDeleteLeads();
  
  // Process server response to get leads array and pagination info
  const serverResponse = leadsData || {};
  const leads = Array.isArray((serverResponse as any).leads) ? (serverResponse as any).leads : 
                Array.isArray((serverResponse as any).data) ? (serverResponse as any).data : 
                Array.isArray(leadsData) ? leadsData : [];
  const pagination = (serverResponse as any).pagination || null;
  const totalRecords = pagination?.totalRecords || leads.length;
  const loading = leadsLoading;
  
  // State Management
  const [users, setUsers] = useState<any[]>([]);
  const [importLoading, setImportLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [editingLead, setEditingLead] = useState<string | null>(null);
  const [editedLead, setEditedLead] = useState<Partial<Lead>>({});
  const [showFilters, setShowFilters] = useState(false);
  const [newNote, setNewNote] = useState<{[key: string]: string}>({});
  const [leadActivities, setLeadActivities] = useState<{[key: string]: LeadActivity[]}>({});
  
  // New states for compact view and detail panel
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showBulkTransferModal, setShowBulkTransferModal] = useState(false);
  const [bulkTransferCounselor, setBulkTransferCounselor] = useState('');
  const [bulkTransferReason, setBulkTransferReason] = useState('');
  
  // Bulk Company Change states
  const [showBulkCompanyModal, setShowBulkCompanyModal] = useState(false);
  const [bulkCompanyTarget, setBulkCompanyTarget] = useState('');
  
  // Team Workload Distribution states
  const [selectedTeamMember, setSelectedTeamMember] = useState<any | null>(null);
  const [teamMemberLeads, setTeamMemberLeads] = useState<Lead[]>([]);
  
  // Popup notification states - DISABLED
  const [showOverduePopup, setShowOverduePopup] = useState(false); // Permanently disabled
  const [overdueLeads, setOverdueLeads] = useState<Lead[]>([]);
  const [popupNotifications, setPopupNotifications] = useState<any[]>([]);
  const [showTeamMemberModal, setShowTeamMemberModal] = useState(false);
  const [loadingTeamMemberLeads, setLoadingTeamMemberLeads] = useState(false);

  // User Activity Stats
  const [userActivityStats, setUserActivityStats] = useState<UserActivityStats[]>([]);
  const [showUserActivityPanel, setShowUserActivityPanel] = useState(false);

  // Dynamic Configuration States - From API
  const [statusOptions] = useState(STATUS_OPTIONS);
  const [countryOptions] = useState([
    // Asian Countries
    {code: 'IN', name: 'India', phoneCode: '+91'},
    {code: 'CN', name: 'China', phoneCode: '+86'},
    {code: 'JP', name: 'Japan', phoneCode: '+81'},
    {code: 'KR', name: 'South Korea', phoneCode: '+82'},
    {code: 'ID', name: 'Indonesia', phoneCode: '+62'},
    {code: 'PK', name: 'Pakistan', phoneCode: '+92'},
    {code: 'BD', name: 'Bangladesh', phoneCode: '+880'},
    {code: 'PH', name: 'Philippines', phoneCode: '+63'},
    {code: 'VN', name: 'Vietnam', phoneCode: '+84'},
    {code: 'TH', name: 'Thailand', phoneCode: '+66'},
    {code: 'MY', name: 'Malaysia', phoneCode: '+60'},
    {code: 'SG', name: 'Singapore', phoneCode: '+65'},
    {code: 'LK', name: 'Sri Lanka', phoneCode: '+94'},
    {code: 'NP', name: 'Nepal', phoneCode: '+977'},
    {code: 'MM', name: 'Myanmar', phoneCode: '+95'},
    {code: 'KH', name: 'Cambodia', phoneCode: '+855'},
    {code: 'LA', name: 'Laos', phoneCode: '+856'},
    {code: 'BN', name: 'Brunei', phoneCode: '+673'},
    {code: 'TW', name: 'Taiwan', phoneCode: '+886'},
    {code: 'HK', name: 'Hong Kong', phoneCode: '+852'},
    {code: 'MO', name: 'Macau', phoneCode: '+853'},
    {code: 'MN', name: 'Mongolia', phoneCode: '+976'},
    {code: 'KZ', name: 'Kazakhstan', phoneCode: '+7'},
    {code: 'UZ', name: 'Uzbekistan', phoneCode: '+998'},
    {code: 'KG', name: 'Kyrgyzstan', phoneCode: '+996'},
    {code: 'TJ', name: 'Tajikistan', phoneCode: '+992'},
    {code: 'TM', name: 'Turkmenistan', phoneCode: '+993'},
    {code: 'AF', name: 'Afghanistan', phoneCode: '+93'},
    {code: 'BT', name: 'Bhutan', phoneCode: '+975'},
    {code: 'MV', name: 'Maldives', phoneCode: '+960'},

    // Middle East Countries
    {code: 'AE', name: 'United Arab Emirates', phoneCode: '+971'},
    {code: 'SA', name: 'Saudi Arabia', phoneCode: '+966'},
    {code: 'QA', name: 'Qatar', phoneCode: '+974'},
    {code: 'KW', name: 'Kuwait', phoneCode: '+965'},
    {code: 'BH', name: 'Bahrain', phoneCode: '+973'},
    {code: 'OM', name: 'Oman', phoneCode: '+968'},
    {code: 'YE', name: 'Yemen', phoneCode: '+967'},
    {code: 'IQ', name: 'Iraq', phoneCode: '+964'},
    {code: 'IR', name: 'Iran', phoneCode: '+98'},
    {code: 'SY', name: 'Syria', phoneCode: '+963'},
    {code: 'LB', name: 'Lebanon', phoneCode: '+961'},
    {code: 'JO', name: 'Jordan', phoneCode: '+962'},
    {code: 'PS', name: 'Palestine', phoneCode: '+970'},
    {code: 'IL', name: 'Israel', phoneCode: '+972'},
    {code: 'TR', name: 'Turkey', phoneCode: '+90'},
    {code: 'CY', name: 'Cyprus', phoneCode: '+357'},

    // Other Popular Countries
    {code: 'US', name: 'United States', phoneCode: '+1'},
    {code: 'CA', name: 'Canada', phoneCode: '+1'},
    {code: 'GB', name: 'United Kingdom', phoneCode: '+44'},
    {code: 'AU', name: 'Australia', phoneCode: '+61'},
    {code: 'NZ', name: 'New Zealand', phoneCode: '+64'},
    {code: 'DE', name: 'Germany', phoneCode: '+49'},
    {code: 'FR', name: 'France', phoneCode: '+33'},
    {code: 'IT', name: 'Italy', phoneCode: '+39'},
    {code: 'ES', name: 'Spain', phoneCode: '+34'},
    {code: 'NL', name: 'Netherlands', phoneCode: '+31'},
    {code: 'CH', name: 'Switzerland', phoneCode: '+41'},
    {code: 'SE', name: 'Sweden', phoneCode: '+46'},
    {code: 'NO', name: 'Norway', phoneCode: '+47'},
    {code: 'DK', name: 'Denmark', phoneCode: '+45'},
    {code: 'FI', name: 'Finland', phoneCode: '+358'},
    {code: 'BE', name: 'Belgium', phoneCode: '+32'},
    {code: 'AT', name: 'Austria', phoneCode: '+43'},
    {code: 'IE', name: 'Ireland', phoneCode: '+353'},
    {code: 'RU', name: 'Russia', phoneCode: '+7'},
    {code: 'BR', name: 'Brazil', phoneCode: '+55'},
    {code: 'ZA', name: 'South Africa', phoneCode: '+27'},
    {code: 'EG', name: 'Egypt', phoneCode: '+20'},
    {code: 'NG', name: 'Nigeria', phoneCode: '+234'},
    {code: 'KE', name: 'Kenya', phoneCode: '+254'},
    {code: 'ET', name: 'Ethiopia', phoneCode: '+251'}
  ]);
  const [qualificationOptions] = useState<string[]>([...QUALIFICATION_OPTIONS]);
  const [assignableUsers, setAssignableUsers] = useState<AssignableUser[]>([]);
  
  // Default course options with proper prefixes - comprehensive list
  const defaultCourseOptions = {
    fellowship: [
      'Fellowship in Emergency Medicine',
      'Fellowship in Aesthetic Medicine',
      'Fellowship in Anesthesiology',
      'Fellowship in Cardiology',
      'Fellowship in Critical Care Medicine',
      'Fellowship in Dermatology',
      'Fellowship in Endocrinology',
      'Fellowship in Family Medicine',
      'Fellowship in Gastroenterology',
      'Fellowship in General Surgery',
      'Fellowship in Geriatrics',
      'Fellowship in Hematology',
      'Fellowship in Infectious Diseases',
      'Fellowship in Internal Medicine',
      'Fellowship in Nephrology',
      'Fellowship in Neurology',
      'Fellowship in Obstetrics and Gynecology',
      'Fellowship in Oncology',
      'Fellowship in Ophthalmology',
      'Fellowship in Orthopedics',
      'Fellowship in Otolaryngology',
      'Fellowship in Pathology',
      'Fellowship in Pediatrics',
      'Fellowship in Psychiatry',
      'Fellowship in Pulmonology',
      'Fellowship in Radiology'
    ],
    pgDiploma: [
      'PG Diploma in Emergency Medicine',
      'PG Diploma in Aesthetic Medicine',
      'PG Diploma in Clinical Cardiology',
      'PG Diploma in Critical Care Medicine',
      'PG Diploma in Dermatology',
      'PG Diploma in Endocrinology',
      'PG Diploma in Family Medicine',
      'PG Diploma in Geriatrics',
      'PG Diploma in Hospital Administration',
      'PG Diploma in Internal Medicine',
      'PG Diploma in Nephrology',
      'PG Diploma in Neurology',
      'PG Diploma in Obstetrics and Gynecology',
      'PG Diploma in Orthopedics',
      'PG Diploma in Pediatrics',
      'PG Diploma in Psychiatry',
      'PG Diploma in Pulmonology',
      'PG Diploma in Radiology'
    ],
    all: [] as string[]
  };
  
  const [courseOptions] = useState<{fellowship: string[], pgDiploma: string[], all: string[]}>(
    {
      ...defaultCourseOptions,
      all: [...defaultCourseOptions.fellowship, ...defaultCourseOptions.pgDiploma]
    }
  );
  
  // Filter States
  const [dateFilter, setDateFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  
  // Enhanced Date Filter States
  const [dateFilterType, setDateFilterType] = useState<'on' | 'after' | 'before' | 'between'>('on');
  const [specificDate, setSpecificDate] = useState('');
  
  // Created Date Filter States
  const [createdDateFilter, setCreatedDateFilter] = useState('all');
  const [createdDateFrom, setCreatedDateFrom] = useState('');
  const [createdDateTo, setCreatedDateTo] = useState('');
  const [createdDateFilterType, setCreatedDateFilterType] = useState<'on' | 'after' | 'before' | 'between'>('on');
  const [createdSpecificDate, setCreatedSpecificDate] = useState('');
  
  const [statusFilter, setStatusFilter] = useState<string[]>(['all']);
  const [countryFilter, setCountryFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [assignedToFilter, setAssignedToFilter] = useState<string[]>(['all']);
  const [qualificationFilter, setQualificationFilter] = useState('all');
  const [showOverdueOnly, setShowOverdueOnly] = useState(false);
  const [excludeSystemUpdates, setExcludeSystemUpdates] = useState(true); // New: exclude system updates by default
  const [courseFilter, setCourseFilter] = useState('all');
  const [companyFilter, setCompanyFilter] = useState('all');
  
  // Updated Today Tracking with persistence
  const [leadsUpdatedToday, setLeadsUpdatedToday] = useState<string[]>(() => {
    // Check if we're on a new day and clear old data
    const today = new Date().toDateString();
    const savedDate = localStorage.getItem('crm-updated-today-date');
    
    if (savedDate === today) {
      const saved = localStorage.getItem('crm-leads-updated-today');
      return saved ? JSON.parse(saved) : [];
    } else {
      // Clear old data for new day
      localStorage.removeItem('crm-leads-updated-today');
      localStorage.removeItem('crm-last-update-time');
      localStorage.setItem('crm-updated-today-date', today);
      return [];
    }
  });
  
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(() => {
    const saved = localStorage.getItem('crm-last-update-time');
    return saved ? new Date(saved) : null;
  });

  // Add Lead Modal States
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
  
  // Expanded sections state
  const [showExpandedAlerts, setShowExpandedAlerts] = useState(false);
  const [showExpandedInsights, setShowExpandedInsights] = useState(false);
  const [newLead, setNewLead] = useState<NewLeadForm>({
    fullName: '',
    email: '',
    phone: '',
    country: '',
    branch: '',
    qualification: '',
    source: '',
    course: '',
    status: 'Fresh',
    assignedTo: '',
    followUp: '',
    company: ''
  });

  // ==========================================
  // SERVER-SIDE FILTERING - Build filter object
  // ==========================================
  const filterParams = useMemo(() => ({
    search: searchQuery,
    status: statusFilter,
    country: countryFilter,
    source: sourceFilter,
    assignedTo: assignedToFilter,
    qualification: qualificationFilter,
    course: courseFilter,
    company: companyFilter,
    dateFilter: dateFilter
  }), [searchQuery, statusFilter, countryFilter, sourceFilter, assignedToFilter, qualificationFilter, courseFilter, companyFilter, dateFilter]);

  // TanStack Query hooks with server-side pagination and filtering
  const { data: leadsData, isLoading: leadsLoading, refetch: refetchLeads } = useLeads(currentPage, itemsPerPage, filterParams);
  const bulkUpdateMutation = useBulkUpdateLeads();
  const bulkDeleteMutation = useBulkDeleteLeads();

  // ==========================================
  // SERVER-SIDE PAGINATION - No longer using client-side slice
  // The data is already paginated on the server
  // ==========================================
  
  // For server-side pagination, we'll use leads directly from server
  const paginatedLeads = leads; // Server already returns paginated data
  const totalItems = pagination?.totalRecords || totalRecords || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const hasNextPage = pagination?.hasNextPage || currentPage < totalPages;
  const hasPrevPage = pagination?.hasPrevPage || currentPage > 1;
  
  // Calculate display indices for pagination info
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + paginatedLeads.length, totalItems);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, countryFilter, sourceFilter, assignedToFilter, dateFilter, qualificationFilter, courseFilter, companyFilter]);

  // Refetch data when pagination changes
  useEffect(() => {
    refetchLeads();
  }, [currentPage, itemsPerPage, refetchLeads]);

  // Effects
  useEffect(() => {
    loadLeads();
    loadUsers();
  }, []);

  // Helper function to check if a lead update was a real user update (not system/import)
  const isRealUserUpdate = (lead: Lead): boolean => {
    // If no updatedAt, it's only been created, not updated
    if (!lead.updatedAt) return false;
    
    // Check if the update was from system processes
    const systemUpdaters = ['System', 'Import System', 'Admin', 'system', 'import'];
    const updatedBy = lead.updated_by?.toLowerCase() || '';
    
    // If updated by system processes, not a real user update
    if (systemUpdaters.some(sys => updatedBy.includes(sys.toLowerCase()))) {
      return false;
    }
    
    // Check if lead was imported/transferred recently (same day as creation but with updatedAt)
    const createdDate = new Date(lead.createdAt);
    const updatedDate = new Date(lead.updatedAt);
    const timeDiff = updatedDate.getTime() - createdDate.getTime();
    const oneDayMs = 24 * 60 * 60 * 1000;
    
    // If updated within 1 hour of creation and source indicates import, likely not a real update
    if (timeDiff < (60 * 60 * 1000) && (
      lead.source?.includes('Import') ||
      lead.source?.includes('CSV') ||
      lead.source?.includes('Excel') ||
      lead.source?.includes('Transfer')
    )) {
      return false;
    }
    
    // Check notes for system activities
    const hasSystemNotes = lead.notes?.some(note => 
      note.content?.includes('Imported from') ||
      note.content?.includes('Transferred from') ||
      note.content?.includes('Bulk import') ||
      note.content?.includes('CSV import') ||
      note.content?.includes('System update') ||
      note.author?.toLowerCase().includes('system')
    );
    
    if (hasSystemNotes && timeDiff < oneDayMs) {
      return false;
    }
    
    return true;
  };

  // No longer needed - filteredLeads is computed via useMemo automatically

  // Update user activity stats when leads or users change
  useEffect(() => {
    setUserActivityStats(calculateUserActivityStats());
  }, [leads, assignableUsers]);

  // Data Loading - Now using TanStack Query (cached and optimized)
  const loadLeads = async () => {
    try {
      // Just refetch from TanStack Query cache/API
      await refetchLeads();
      console.log(`✅ Leads refreshed from TanStack Query cache`);
    } catch (error) {
      console.error('❌ Error refreshing leads:', error);
      alert('Unable to refresh leads. Please check your connection.');
    }
  };

  // Load users for dropdowns
  const loadUsers = async () => {
    try {
      const apiClient = getApiClient();
      // Use hierarchical assignable users API instead of all users
      const assignableUsersResponse = await apiClient.getAssignableUsers();
      
      console.log(`🔍 Loaded assignable users from API:`, assignableUsersResponse);
      console.log(`🔍 Current user for assignable users context:`, user);
      
      // Handle response format
      let usersArray: any[] = [];
      if (Array.isArray(assignableUsersResponse)) {
        usersArray = assignableUsersResponse;
      } else if (assignableUsersResponse && (assignableUsersResponse as any).success) {
        // Check multiple possible response formats
        if (Array.isArray((assignableUsersResponse as any).users)) {
          usersArray = (assignableUsersResponse as any).users;
        } else if (Array.isArray((assignableUsersResponse as any).data)) {
          usersArray = (assignableUsersResponse as any).data;
        }
      }
      
      if (usersArray.length > 0) {
        setUsers(usersArray);
        // Format assignable users with proper hierarchy filtering
        const assignableUsersList = usersArray.map((user: any) => ({
          id: user.id,
          name: user.name || user.username,
          username: user.username,
          email: user.email,
          role: user.role || 'User',
          display_name: user.display_name || `${user.name || user.username} (${user.role})`
        }));
        setAssignableUsers(assignableUsersList);
        console.log(`✅ Set ${assignableUsersList.length} assignable users based on hierarchy:`, assignableUsersList);
        console.log('🔍 Dropdown will show:', {
          currentUserRole: user?.role,
          willShowCurrentUser: assignableUsersList.some(u => u.username === user?.username || u.email === user?.email),
          willShowSubordinates: (user?.role === 'manager' || user?.role === 'senior_manager' || user?.role === 'team_leader') && 
                                assignableUsersList.filter(u => u.username !== user?.username && u.email !== user?.email).length > 0,
          willShowAllUsers: user?.role === 'super_admin' && 
                           assignableUsersList.filter(u => u.username !== user?.username && u.email !== user?.email).length > 0
        });
      } else {
        setUsers([]);
        setAssignableUsers([]);
        console.log(`⚠️ No assignable users loaded or invalid format:`, assignableUsersResponse);
      }
    } catch (error) {
      console.error('❌ Error loading assignable users:', error);
      setUsers([]);
      setAssignableUsers([]);
    }
  };

  // Team Member Functions
  const handleTeamMemberClick = async (teamMember: any) => {
    setSelectedTeamMember(teamMember);
    setShowTeamMemberModal(true);
    setLoadingTeamMemberLeads(true);
    
    try {
      const apiClient = getApiClient();
      // Get leads for this specific user and their team
      const response = await apiClient.getUserLeads(teamMember.id, true);
      
      const leadsData = (response as any)?.leads || [];
      const transformedLeads = leadsData.map((lead: any) => ({
        id: lead.id || lead._id || String(Math.random()),
        fullName: lead.name || lead.fullName || 'Unknown',
        email: lead.email || '',
        phone: lead.phone || '',
        country: lead.country || 'Unknown',
        branch: lead.branch || 'Main',
        qualification: lead.qualification || '',
        source: lead.source || 'manual',
        course: lead.course || 'MBBS',
        status: lead.status || 'Fresh',
        assignedTo: lead.assigned_to || lead.assignedTo || 'Unassigned',
        followUp: lead.follow_up || lead.followUp || '',
        createdAt: lead.created_at || lead.createdAt || new Date().toISOString(),
        updatedAt: lead.updated_at || lead.updatedAt || new Date().toISOString(),
        notes: Array.isArray(lead.notes) ? lead.notes : []
      }));
      
      setTeamMemberLeads(transformedLeads);
      console.log(`📊 Loaded ${transformedLeads.length} leads for ${teamMember.name}`);
      
    } catch (error) {
      console.error('❌ Error loading team member leads:', error);
      setTeamMemberLeads([]);
    } finally {
      setLoadingTeamMemberLeads(false);
    }
  };

  const handleTransferTeamMemberLead = async (leadId: string, targetUserId: string) => {
    try {
      const apiClient = getApiClient();
      const targetUser = assignableUsers.find(u => u.id === targetUserId);
      
      if (!targetUser) {
        alert('Target user not found');
        return;
      }
      
      // Update the lead assignment
      await apiClient.updateLead(leadId, {
        assignedTo: targetUser.username,
        assigned_to: targetUser.username,
        assignedcounselor: targetUser.username
      });
      
      // Refresh the team member leads
      if (selectedTeamMember) {
        await handleTeamMemberClick(selectedTeamMember);
      }
      
      // Refresh main leads list
      await loadLeads();
      
      notify.success('Lead Transferred', `Lead transferred to ${targetUser.name} successfully`);
      
    } catch (error) {
      console.error('❌ Error transferring lead:', error);
      notify.error('Transfer Failed', 'Failed to transfer lead');
    }
  };

  // Calculate User Activity Statistics
  const calculateUserActivityStats = (): UserActivityStats[] => {
    if (!assignableUsers.length || !leads.length) return [];

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    return assignableUsers.map(user => {
      // Get all leads assigned to this user
      const userLeads = leads.filter(lead => 
        lead.assignedTo === user.username || 
        lead.assignedTo === user.name ||
        lead.assignedTo === user.display_name
      );

      // Calculate updates (leads modified by this user)
      const updatedToday = userLeads.filter(lead => {
        const updatedDate = new Date(lead.updatedAt);
        return updatedDate >= todayStart;
      }).length;

      const updatedThisWeek = userLeads.filter(lead => {
        const updatedDate = new Date(lead.updatedAt);
        return updatedDate >= weekStart;
      }).length;

      const updatedThisMonth = userLeads.filter(lead => {
        const updatedDate = new Date(lead.updatedAt);
        return updatedDate >= monthStart;
      }).length;

      // Calculate lead status counts
      const hotLeads = userLeads.filter(lead => lead.status === 'Hot').length;
      const warmLeads = userLeads.filter(lead => lead.status === 'Warm').length;
      const enrolledLeads = userLeads.filter(lead => lead.status === 'Enrolled').length;

      // Calculate revenue (actual from enrolled + estimated from hot/warm)
      const actualRevenue = userLeads
        .filter(lead => lead.status === 'Enrolled' && lead.fees)
        .reduce((sum, lead) => sum + (lead.fees || 0), 0);

      const estimatedRevenue = userLeads
        .filter(lead => (lead.status === 'Hot' || lead.status === 'Warm') && lead.estimatedValue)
        .reduce((sum, lead) => sum + (lead.estimatedValue || 0), 0);

      const totalRevenue = actualRevenue + (estimatedRevenue * 0.3); // 30% probability for warm/hot leads

      return {
        userId: user.id,
        username: user.username || user.display_name || user.name,
        role: user.role,
        totalLeads: userLeads.length,
        updatedToday,
        updatedThisWeek,
        updatedThisMonth,
        hotLeads,
        warmLeads,
        enrolledLeads,
        totalRevenue, // Use the calculated total revenue (actual + 30% of estimated)
        estimatedRevenue
      };
    }).sort((a, b) => b.updatedToday - a.updatedToday); // Sort by today's updates
  };

  // ==========================================
  // OPTIMIZED FILTERING WITH DSA TECHNIQUES
  // ==========================================
  
  // Memoize expensive computations to prevent re-calculations
  const leadsMap = useMemo(() => {
    // Create a Map for O(1) lookup performance
    const map = new Map();
    leads.forEach(lead => {
      map.set(lead.id, lead);
    });
    return map;
  }, [leads]);

  // Pre-compute searchable text for each lead (O(n) once, then O(1) access)
  const leadsSearchIndex = useMemo(() => {
    const index = new Map();
    leads.forEach(lead => {
      const searchText = [
        lead.fullName,
        lead.email,
        lead.phone,
        lead.id,
        lead.country,
        lead.course,
        lead.status
      ].join('|').toLowerCase();
      index.set(lead.id, searchText);
    });
    return index;
  }, [leads]);

  // Optimized date comparison functions (avoid repeated new Date() calls)
  const getDateComparison = useCallback((dateStr: string) => {
    const date = new Date(dateStr);
    return {
      timestamp: date.getTime(),
      dateOnly: new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
    };
  }, []);

  // TEMPORARY: Disable client-side filtering for server-side pagination
  // TODO: Implement proper server-side filtering integration
  const filteredLeads = useMemo(() => {
    console.log('🔍 Using server-side filtered data (client filtering disabled)');
    console.log('📊 Raw paginated leads data:', paginatedLeads?.slice(0, 3)); // Log first 3 leads for debugging
    
    // Debug: Check status distribution
    if (paginatedLeads?.length > 0) {
      const statusCounts = paginatedLeads.reduce((acc: any, lead: Lead) => {
        acc[lead.status] = (acc[lead.status] || 0) + 1;
        return acc;
      }, {});
      console.log('📈 Status distribution in data:', statusCounts);
    }
    
    // Return server-filtered data directly (no client-side filtering)
    // Server-side filtering will be applied through API parameters
    console.log(`✅ Using ${paginatedLeads.length} server-filtered leads`);
    return paginatedLeads;
  }, [paginatedLeads]);

  // ==========================================
  // OPTIMIZED CALLBACKS - Prevent unnecessary re-renders
  // ==========================================
  const handleSelectAll = useCallback(() => {
    if (selectedLeads.length === filteredLeads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(filteredLeads.map((lead: Lead) => lead.id));
    }
  }, [selectedLeads.length, filteredLeads]);

  const handleLeadSelect = useCallback((leadId: string) => {
    setSelectedLeads((prev: string[]) => 
      prev.includes(leadId) 
        ? prev.filter((id: string) => id !== leadId)
        : [...prev, leadId]
    );
  }, []);

  const handleEditLead = (lead: Lead) => {
    setEditingLead(lead.id);
    setEditedLead(lead);
  };

  const handleSaveLead = async () => {
    try {
      if (!editingLead || !editedLead) {
        console.error('No lead being edited');
        return;
      }

      console.log(`🔍 Saving lead ${editingLead} to backend...`);
      
      // Save to backend API first
      const apiClient = getApiClient();
      const updateData = {
        ...editedLead,
        updatedAt: new Date().toISOString()
      };
      
      await apiClient.updateLead(editingLead, updateData);
      console.log('✅ Lead saved to backend successfully');
      
      // Query will auto-update via cache invalidation in the mutation
      
      // Track this lead as updated today with persistence
      if (editingLead && !leadsUpdatedToday.includes(editingLead)) {
        const newUpdatedList = [...leadsUpdatedToday, editingLead];
        setLeadsUpdatedToday(newUpdatedList);
        localStorage.setItem('crm-leads-updated-today', JSON.stringify(newUpdatedList));
      }
      const newUpdateTime = new Date();
      setLastUpdateTime(newUpdateTime);
      localStorage.setItem('crm-last-update-time', newUpdateTime.toISOString());
      
      setEditingLead(null);
      setEditedLead({});
      
      // Show success notification
      notify.success('Lead Updated', 'Lead information has been saved successfully');
      
      console.log('✅ Lead update completed successfully');
    } catch (error) {
      console.error('❌ Error saving lead:', error);
      // Show error notification
      notify.error('Save Failed', 'Unable to save lead updates. Please try again.');
    }
  };

  const handleCancelEdit = () => {
    setEditingLead(null);
    setEditedLead({});
  };

  // Load notes for a specific lead (simplified - notes now come with leads data)
  const loadNotesForLead = async (leadId: string) => {
    console.log(`� Loading notes for lead: ${leadId} (using simplified architecture)`);
    
    // Notes are now loaded with the leads data automatically
    const currentLead = leads.find(l => l.id === leadId);
    if (currentLead && currentLead.notes) {
      console.log(`✅ Found ${currentLead.notes.length} notes for lead ${leadId} in current data`);
      setLastUpdateTime(new Date()); // Force re-render
      return;
    }
    
    // If notes aren't loaded yet, refresh the entire leads list
    console.log(`🔄 Refreshing leads data to get notes for lead ${leadId}`);
    await loadLeads();
  };

  // Load activities for a specific lead
  const loadActivitiesForLead = async (leadId: string) => {
    try {
      console.log(`📋 Loading activities for lead: ${leadId}`);
      
      const backendUrl = import.meta.env.VITE_API_BASE_URL || 'https://crm-backend-fh34.onrender.com';
      const response = await fetch(`${backendUrl}/api/lead-activities?leadId=${leadId}&limit=50`, {
        headers: {
          'Authorization': `Bearer ${TokenManager.getToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.activities) {
        console.log(`✅ Loaded ${data.activities.length} activities for lead ${leadId}`);
        setLeadActivities(prev => ({
          ...prev,
          [leadId]: data.activities
        }));
      } else {
        console.warn(`⚠️ No activities found for lead ${leadId}`);
        setLeadActivities(prev => ({
          ...prev,
          [leadId]: []
        }));
      }
    } catch (error) {
      console.error(`❌ Error loading activities for lead ${leadId}:`, error);
      setLeadActivities(prev => ({
        ...prev,
        [leadId]: []
      }));
    }
  };

  const handleAddNote = async (leadId: string) => {
    const noteContent = newNote[leadId];
    if (!noteContent?.trim()) return;

    try {
      // Use the proper leads API addNote endpoint with real user authentication
      const backendUrl = import.meta.env.VITE_API_BASE_URL || 'https://crm-backend-fh34.onrender.com';
      const response = await fetch(`${backendUrl}/api/leads?action=addNote`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${TokenManager.getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          leadId: leadId,
          content: noteContent,
          noteType: 'general'
        })
      });

      console.log('🔍 Response status:', response.status, response.statusText);
      console.log('🔍 Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Response not OK:', response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const result = await response.json();
      console.log('✅ Response JSON:', result);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to add note');
      }

      console.log('✅ Note saved successfully');
      
      // Show success notification
      notify.success('Note Saved', 'Your note has been added successfully');
      
      // Query will auto-update via cache invalidation
      
      // Track this lead as updated today when note is added
      if (!leadsUpdatedToday.includes(leadId)) {
        const newUpdatedList = [...leadsUpdatedToday, leadId];
        setLeadsUpdatedToday(newUpdatedList);
        localStorage.setItem('crm-leads-updated-today', JSON.stringify(newUpdatedList));
      }
      
      const newUpdateTime = new Date();
      setLastUpdateTime(newUpdateTime);
      localStorage.setItem('crm-last-update-time', newUpdateTime.toISOString());
      
      setNewNote((prev: {[key: string]: string}) => ({ ...prev, [leadId]: '' }));
      
    } catch (error) {
      console.error('❌ Error saving note:', error);
      notify.error('Note Save Failed', 'Unable to save your note. Please check your connection and try again.');
    }
  };

  const getUniqueValues = (field: keyof Omit<Lead, 'notes'>) => {
    return [...new Set((leads || []).map((lead: Lead) => lead[field] as string).filter(Boolean))];
  };

  const quickStatusFilter = (status: string) => {
    if (statusFilter.includes(status) && status !== 'all') {
      // If clicking the same filter (except 'all'), toggle it off
      setStatusFilter(['all']);
      setDateFilter('all'); // Also reset date filter when toggling status
    } else {
      // Apply the new filter
      setStatusFilter([status]);
      if (status !== 'all') {
        setDateFilter('all'); // Reset date filter when applying status filter
      }
    }
  };

  // Quick company filter function
  const quickCompanyFilter = (company: string) => {
    if (companyFilter === company && company !== 'all') {
      // If already filtering by this company, switch back to all
      setCompanyFilter('all');
    } else {
      // Apply the new company filter
      setCompanyFilter(company);
      if (company !== 'all') {
        setDateFilter('all'); // Reset other filters when applying company filter
      }
    }
  };

  // Filter to show only leads updated today (toggle on/off)
  const setFilterToUpdatedToday = () => {
    if (dateFilter === 'updated_today') {
      // If already filtering by updated today, switch back to all
      setDateFilter('all');
    } else {
      // If not filtering by updated today, switch to it
      setDateFilter('updated_today');
      setStatusFilter(['all']); // Reset status filter to show all updated leads
    }
  };

  // Reset the daily update counter
  const resetDailyCounter = () => {
    setLeadsUpdatedToday([]);
    setLastUpdateTime(null);
    localStorage.removeItem('crm-leads-updated-today');
    localStorage.removeItem('crm-last-update-time');
  };

  // Filter to show only recently imported leads (last 24 hours)
  const setFilterToRecentlyImported = () => {
    if (dateFilter === 'recently_imported') {
      // If already filtering by recently imported, switch back to all
      setDateFilter('all');
    } else {
      // If not filtering by recently imported, switch to it
      setDateFilter('recently_imported');
      setStatusFilter(['all']); // Reset status filter to show all imported leads
    }
  };

  // Get count of recently imported leads (last 24 hours)
  const getRecentlyImportedCount = () => {
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
    
    return leads.filter(lead => {
      const createdAt = new Date(lead.createdAt);
      return createdAt >= twentyFourHoursAgo && (
        // Check if lead was created by import process
        lead.source === 'Import' ||
        lead.source === 'CSV Import' ||
        lead.source === 'Excel Import' ||
        lead.assignedTo === 'Import System' ||
        // Check notes array for import-related content
        lead.notes?.some((note: any) => 
          note.content?.includes('Imported from CSV') ||
          note.content?.includes('Imported from Excel') ||
          note.content?.includes('Bulk import') ||
          note.content?.includes('CSV file') ||
          note.content?.includes('Excel file')
        )
      );
    }).length;
  };

  // Clear all filters - Reset to default state
  const clearAllFilters = () => {
    setSearchQuery('');
    setDateFilter('all');
    setStatusFilter(['all']);
    setCountryFilter('all');
    setSourceFilter('all');
    setAssignedToFilter(['all']);
    setQualificationFilter('all');
    setCourseFilter('all');
    setCompanyFilter('all');
    setShowOverdueOnly(false);
    setDateFrom('');
    setDateTo('');
    setSpecificDate('');
    setDateFilterType('on');
    setExcludeSystemUpdates(true); // Reset to default (exclude system updates)
    
    // Also clear any temporary filter states if they exist
    console.log('✅ All filters cleared - showing all leads');
  };

  // Check if any filters are currently active
  const hasActiveFilters = () => {
    return searchQuery !== '' ||
           dateFilter !== 'all' ||
           !statusFilter.includes('all') ||
           countryFilter !== 'all' ||
           sourceFilter !== 'all' ||
           !assignedToFilter.includes('all') ||
           qualificationFilter !== 'all' ||
           courseFilter !== 'all' ||
           companyFilter !== 'all' ||
           showOverdueOnly ||
           dateFrom !== '' ||
           dateTo !== '' ||
           specificDate !== '';
  };

  // Add Lead Functions
  const handleAddLead = () => {
    setShowAddLeadModal(true);
  };

  const handleSaveNewLead = async () => {
    // 🚨 DEBUG: Log current user information
    console.log('🔍 Current user during lead creation:', {
      user: user,
      username: user?.username,
      name: user?.name,
      email: user?.email,
      role: user?.role
    });
    console.log('🔍 Assignment value (newLead.assignedTo):', newLead.assignedTo);
    try {
      // Validate required fields
      if (!newLead.fullName || !newLead.email || !newLead.phone || !newLead.company) {
        alert('Please fill in all required fields (Full Name, Email, Phone, Company)');
        return;
      }

      // Validate company selection
      if (!['DMHCA', 'IBMP'].includes(newLead.company)) {
        alert('Please select a valid company (DMHCA or IBMP)');
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newLead.email || '')) {
        alert('Please enter a valid email address');
        return;
      }

      // Check for duplicate email
      const existingLead = leads.find((lead: Lead) => lead.email.toLowerCase() === (newLead.email || '').toLowerCase());
      if (existingLead) {
        alert('A lead with this email already exists!');
        return;
      }

      // Prepare lead data for database insertion - include ALL fields
      const leadData = {
        fullName: newLead.fullName,
        // 'name' field removed - doesn't exist in database schema
        email: newLead.email,
        phone: newLead.phone,
        country: newLead.country,
        branch: newLead.branch,
        qualification: newLead.qualification,
        source: (newLead.source || 'manual') as 'website' | 'social_media' | 'referral' | 'manual' | 'advertisement',
        course: newLead.course,
        status: (newLead.status || 'Fresh') as 'Hot' | 'Follow Up' | 'Warm' | 'Not Interested' | 'Enrolled' | 'Fresh' | 'Junk',
        assignedTo: newLead.assignedTo || user?.username || user?.name || 'Unassigned',
        assigned_to: newLead.assignedTo || user?.username || user?.name || 'Unassigned', // For backend compatibility
        followUp: newLead.followUp,

        score: 50, // Default score for new leads
        notes: `Lead created via manual entry by ${user?.name || 'System'}`,
      };

      // Create via backend API (proper architecture)
      const apiClient = getApiClient();
      const response: any = await apiClient.createLead(leadData);
      
      // Extract lead data from response (backend returns { success: true, data: {...} })
      const createdLead = response.data || response;
      
      // Transform API response to component format
      const leadToAdd: Lead = {
        id: createdLead.id || Date.now().toString(),
        fullName: createdLead.fullName || newLead.fullName || '',
        email: createdLead.email || newLead.email || '',
        phone: createdLead.phone || newLead.phone || '',
        country: newLead.country || 'India',
        branch: newLead.branch || 'Main',
        qualification: createdLead.qualification || newLead.qualification || '',
        source: createdLead.source || newLead.source || 'Manual Entry',
        course: newLead.course || 'MBBS',
        status: createdLead.status || newLead.status || 'Fresh',
        assignedTo: createdLead.assignedTo || newLead.assignedTo || user?.username || user?.name || 'Unassigned',
        followUp: newLead.followUp || '',
        company: createdLead.company || newLead.company || '',
        createdAt: createdLead.createdAt || new Date().toISOString(),
        updatedAt: createdLead.updatedAt || new Date().toISOString(),
        notes: [{
          id: `note-${Date.now()}`,
          content: `Lead created via manual entry by ${user?.name || 'System'}`,
          author: user?.name || 'System',
          timestamp: createdLead.created_at || new Date().toISOString()
        }]
      };

      // Query will auto-update via cache invalidation after backend save

      // Track as updated today with persistence
      const newUpdatedList = [...leadsUpdatedToday, leadToAdd.id];
      setLeadsUpdatedToday(newUpdatedList);
      localStorage.setItem('crm-leads-updated-today', JSON.stringify(newUpdatedList));
      
      const newUpdateTime = new Date();
      setLastUpdateTime(newUpdateTime);
      localStorage.setItem('crm-last-update-time', newUpdateTime.toISOString());

      // Reset form and close modal
      setNewLead({
        fullName: '',
        email: '',
        phone: '',
        country: '',
        branch: '',
        qualification: '',
        source: '',
        course: '',
        status: 'Fresh',
        assignedTo: '',
        followUp: '',
        company: ''
      });
      setShowAddLeadModal(false);

      // Show success notification
      notify.leadCreated(newLead.fullName || 'New Lead');
      // Lead created successfully
      
    } catch (error: any) {
      console.error('❌ Error adding lead:', error);
      
      // Show specific error message if available
      let errorMessage = 'Unable to create lead. Please try again.';
      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.error) {
        errorMessage = error.error;
      } else if (error?.details) {
        errorMessage = error.details;
      }
      
      // Show error notification
      notify.error('Lead Creation Failed', errorMessage);
    }
  };

  const handleCancelAddLead = () => {
    setNewLead({
      fullName: '',
      email: '',
      phone: '',
      country: '',
      branch: '',
      qualification: '',
      source: '',
      course: '',
      status: 'Fresh',
      assignedTo: '',
      followUp: '',
      company: ''
    });
    setShowAddLeadModal(false);
  };

  // Check if user has manager permissions or above
  const isManager = () => {
    return user?.role === 'manager' || user?.role === 'senior_manager' || user?.role === 'super_admin';
  };

  // Handle lead selection for detail view
  const handleLeadClick = async (leadId: string) => {
    console.log(`🔄 Lead clicked: ${leadId}`);
    
    // First set the selected lead and show panel
    setSelectedLeadId(leadId);
    setShowDetailPanel(true);
    
    // Scroll the selected lead into view smoothly after a brief delay
    setTimeout(() => {
      const leadElement = document.querySelector(`[data-lead-id="${leadId}"]`);
      if (leadElement) {
        leadElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center',
          inline: 'nearest'
        });
      }
    }, 100);
    
    console.log(`🔄 Loading notes and activities for lead: ${leadId}`);
    // Load notes and activities for the selected lead and wait for completion
    await loadNotesForLead(leadId);
    await loadActivitiesForLead(leadId);
    
    console.log(`🔄 Notes and activities loading completed for lead: ${leadId}`);
    
    // Force a state update to ensure the UI re-renders with the updated notes
    setLastUpdateTime(new Date());
  };

  // Handle lead transfer (using bulk transfer modal for individual leads)
  const handleTransferLead = (leadId: string) => {
    setSelectedLeads([leadId]);
    setShowBulkTransferModal(true);
  };

  // Export leads to CSV
  const handleExportLeads = () => {
    const csvContent = [
      ['ID', 'Full Name', 'Email', 'Phone', 'Country', 'Branch', 'Qualification', 'Source', 'Course', 'Status', 'Assigned To', 'Follow Up', 'Company', 'Notes', 'Created At', 'Updated At'],
      ...filteredLeads.map((lead: Lead) => [
        lead.id,
        lead.fullName,
        lead.email,
        lead.phone,
        lead.country,
        lead.branch,
        lead.qualification,
        lead.source,
        lead.course,
        lead.status,
        lead.assignedTo,
        lead.followUp,
        lead.company || '',
        // Extract notes content from notes array and clean up for CSV
        (() => {
          const notes = (lead as any).notes;
          if (Array.isArray(notes) && notes.length > 0) {
            return notes.map((note: any) => note.content || '').join(' | ').replace(/"/g, '""');
          } else if (typeof notes === 'string' && notes.trim()) {
            return notes.replace(/"/g, '""');
          }
          return '';
        })(),
        lead.createdAt,
        lead.updatedAt
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Import leads from CSV
  const handleImportLeads = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type - accept both CSV and Excel files
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.csv') && !fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
      alert('Please select a CSV file (.csv) or Excel file (.xlsx, .xls)');
      return;
    }

    setImportLoading(true);
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const csv = e.target?.result as string;
        const lines = csv.split('\n').filter(line => line.trim()); // Remove empty lines
        
        if (lines.length < 2) {
          alert('CSV file must contain at least a header row and one data row');
          setImportLoading(false);
          return;
        }

        // Parse header row to understand column mapping
        const headerValues: string[] = [];
        let current = '';
        let inQuotes = false;
        const headerLine = lines[0];
        
        for (let j = 0; j < headerLine.length; j++) {
          const char = headerLine[j];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            headerValues.push(current.trim().toLowerCase());
            current = '';
          } else {
            current += char;
          }
        }
        headerValues.push(current.trim().toLowerCase());

        // Create column mapping
        const getColumnIndex = (possibleNames: string[]) => {
          for (const name of possibleNames) {
            const index = headerValues.findIndex(h => h.includes(name.toLowerCase()));
            if (index !== -1) return index;
          }
          return -1;
        };

        const columnMap = {
          fullName: getColumnIndex(['full name', 'name', 'fullname']),
          email: getColumnIndex(['email', 'e-mail']),
          phone: getColumnIndex(['phone', 'mobile', 'contact']),
          country: getColumnIndex(['country']),
          branch: getColumnIndex(['branch']),
          qualification: getColumnIndex(['qualification', 'education']),
          source: getColumnIndex(['source']),
          course: getColumnIndex(['course']),
          status: getColumnIndex(['status']),
          assignedTo: getColumnIndex(['assigned to', 'assigned', 'assignedto', 'counselor']),
          followUp: getColumnIndex(['follow up', 'followup', 'follow-up']),
          company: getColumnIndex(['company', 'organization', 'org']),
          notes: getColumnIndex(['notes', 'note', 'comments', 'comment', 'remarks', 'remark'])
        };

        // Validate that we have at least name and email
        if (columnMap.fullName === -1 || columnMap.email === -1) {
          alert('CSV must contain at least "Full Name" and "Email" columns.\n\nFound columns: ' + headerValues.join(', '));
          setImportLoading(false);
          return;
        }
        
        const apiClient = getApiClient();
        let successCount = 0;
        let errorCount = 0;
        const errors: string[] = [];

        // Process leads one by one to handle duplicates and validation
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i];
          if (!line.trim()) continue;

          try {
            // Better CSV parsing - handle quoted values with commas
            const values: string[] = [];
            let current = '';
            let inQuotes = false;
            
            for (let j = 0; j < line.length; j++) {
              const char = line[j];
              if (char === '"') {
                inQuotes = !inQuotes;
              } else if (char === ',' && !inQuotes) {
                values.push(current.trim());
                current = '';
              } else {
                current += char;
              }
            }
            values.push(current.trim()); // Add the last value
            
            // Get values using column mapping
            const fullName = columnMap.fullName >= 0 ? values[columnMap.fullName] || '' : '';
            const email = columnMap.email >= 0 ? values[columnMap.email] || '' : '';

            // Skip if no name or email
            if (!fullName || !email) {
              errorCount++;
              errors.push(`Row ${i + 1}: Missing name or email`);
              continue;
            }

            // Check for duplicate email
            const existingLead = leads.find((lead: Lead) => 
              lead.email.toLowerCase() === email.toLowerCase()
            );
            
            if (existingLead) {
              errorCount++;
              errors.push(`Row ${i + 1}: Email ${email} already exists`);
              continue;
            }

            // Prepare lead data for API - use exact values from CSV, leave empty if not provided
            const companyValue = columnMap.company >= 0 ? values[columnMap.company] || '' : '';
            // Validate company value - if provided, must be DMHCA or IBMP
            let validatedCompany = '';
            if (companyValue) {
              const normalizedCompany = companyValue.toUpperCase().trim();
              if (normalizedCompany === 'DMHCA' || normalizedCompany === 'IBMP') {
                validatedCompany = normalizedCompany;
              } else {
                // If invalid company value, throw error
                throw new Error(`Invalid company value "${companyValue}". Must be either "DMHCA" or "IBMP"`);
              }
            }
            
            const leadData = {
              fullName: fullName,
              email: email,
              phone: columnMap.phone >= 0 ? values[columnMap.phone] || '' : '',
              country: columnMap.country >= 0 ? values[columnMap.country] || '' : '',
              branch: columnMap.branch >= 0 ? values[columnMap.branch] || '' : '',
              qualification: columnMap.qualification >= 0 ? values[columnMap.qualification] || '' : '',
              source: columnMap.source >= 0 ? (values[columnMap.source] || (fileName.includes('.xlsx') || fileName.includes('.xls') ? 'Excel Import' : 'CSV Import')) : (fileName.includes('.xlsx') || fileName.includes('.xls') ? 'Excel Import' : 'CSV Import'),
              course: columnMap.course >= 0 ? values[columnMap.course] || '' : '',
              status: columnMap.status >= 0 ? values[columnMap.status] || '' : '',
              assignedTo: columnMap.assignedTo >= 0 ? values[columnMap.assignedTo] || '' : '',
              followUp: columnMap.followUp >= 0 ? values[columnMap.followUp] || '' : '',
              company: validatedCompany, // Will be empty string if not provided or invalid
              notes: (() => {
                // Get notes from CSV if available
                const csvNotes = columnMap.notes >= 0 ? values[columnMap.notes] || '' : '';
                // Create import timestamp note
                const importNote = `Imported from ${fileName.includes('.xlsx') || fileName.includes('.xls') ? 'Excel' : 'CSV'} file on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`;
                
                // Combine CSV notes with import note
                if (csvNotes.trim()) {
                  return `${csvNotes.trim()}\n\n--- System Note ---\n${importNote}`;
                } else {
                  return importNote;
                }
              })()
            };

            // Save to backend
            await apiClient.createLead(leadData);
            successCount++;

          } catch (error) {
            errorCount++;
            errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }

        // Show results
        let message = `Import completed!\n${successCount} leads imported successfully`;
        if (errorCount > 0) {
          message += `\n${errorCount} leads failed to import`;
          if (errors.length > 0) {
            message += '\n\nFirst few errors:\n' + errors.slice(0, 5).join('\n');
          }
        }
        
        alert(message);
        
        // Refresh leads list to show imported data
        await loadLeads();

      } catch (error) {
        console.error('Import error:', error);
        alert(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setImportLoading(false);
        // Reset file input
        event.target.value = '';
      }
    };
    
    reader.readAsText(file);
    
    // Reset file input
    event.target.value = '';
  };

  // Handle bulk status update - Using TanStack Query mutation
  const handleBulkStatusUpdate = async (newStatus: string) => {
    if (!newStatus) return;
    
    if (selectedLeads.length === 0) {
      alert('Please select leads to update');
      return;
    }
    
    try {
      console.log(`🔄 Starting bulk status update for ${selectedLeads.length} leads to status: ${newStatus}`);
      
      // Use TanStack Query mutation
      const result = await bulkUpdateMutation.mutateAsync({
        leadIds: selectedLeads,
        updateData: { status: newStatus },
        operationType: 'bulk_status_update',
        reason: `Status changed to ${newStatus}`
      }) as any;
      
      console.log('✅ Bulk status update response:', result);

      if (result && (result.success || result.updatedCount >= 0)) {
        // Refetch leads data immediately to show updated values
        await refetchLeads();
        
        // Clear selection after update
        setSelectedLeads([]);
        
        // Show success message
        const updatedCount = result.updatedCount || selectedLeads.length;
        notify.success('Status Updated', `${updatedCount} leads updated to ${newStatus}`);
      } else {
        console.error('❌ Status update failed:', result);
        alert(`Failed to update leads: ${result?.error || result?.message || 'Unknown error'}`);
        notify.error('Update Failed', `Failed to update leads: ${result?.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ Bulk status update error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to update leads: ${errorMessage}`);
      notify.error('Update Failed', `Failed to update leads: ${errorMessage}`);
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedLeads.length === 0) {
      alert('Please select leads to delete');
      return;
    }
    
    if (window.confirm(`Are you sure you want to delete ${selectedLeads.length} lead(s)? This action cannot be undone.`)) {
      try {
        console.log('🗑️ Starting bulk delete for lead IDs:', selectedLeads);
        
        // Use TanStack Query mutation
        const result = await bulkDeleteMutation.mutateAsync(selectedLeads) as any;
        console.log('🗑️ Bulk delete response:', result);

        if (result && (result.success || result.deletedCount >= 0)) {
          setSelectedLeads([]);
          
          // Close detail panel if selected lead is deleted
          if (selectedLeadId && selectedLeads.includes(selectedLeadId)) {
            setSelectedLeadId(null);
            setShowDetailPanel(false);
          }

          // Show success message
          const deletedCount = result.deletedCount || selectedLeads.length;
          alert(`${deletedCount} lead(s) deleted successfully`);
          notify.success('Leads Deleted', `${deletedCount} leads deleted successfully`);
        } else {
          console.error('❌ Delete failed:', result);
          alert(`Failed to delete leads: ${result?.error || result?.message || 'Unknown error'}`);
          notify.error('Delete Failed', `Failed to delete leads: ${result?.error || 'Unknown error'}`);
        }
      } catch (error) {
        console.error('❌ Delete error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        alert(`Failed to delete leads: ${errorMessage}`);
        notify.error('Delete Failed', `Failed to delete leads: ${errorMessage}`);
      }
    }
  };

  // Handle individual delete - Using TanStack Query mutation
  const handleIndividualDelete = async (leadId: string) => {
    if (window.confirm('Are you sure you want to delete this lead? This action cannot be undone.')) {
      try {
        console.log('🗑️ Starting individual delete for lead ID:', leadId);
        
        // Use TanStack Query mutation
        const result = await bulkDeleteMutation.mutateAsync([leadId]) as any;
        console.log('🗑️ Individual delete response:', result);

        if (result && (result.success || result.deletedCount >= 0)) {
          // Close detail panel if this lead is being viewed
          if (selectedLeadId === leadId) {
            setSelectedLeadId(null);
            setShowDetailPanel(false);
          }

          // Remove from selected leads if it was selected
          setSelectedLeads(prev => prev.filter(id => id !== leadId));

          alert('Lead deleted successfully');
          notify.success('Lead Deleted', 'Lead deleted successfully');
        } else {
          console.error('❌ Delete failed:', result);
          alert(`Failed to delete lead: ${result?.error || result?.message || 'Unknown error'}`);
          notify.error('Delete Failed', `Failed to delete lead: ${result?.error || 'Unknown error'}`);
        }
      } catch (error) {
        console.error('❌ Individual delete error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        alert(`Failed to delete lead: ${errorMessage}`);
        notify.error('Delete Failed', `Failed to delete lead: ${errorMessage}`);
      }
    }
  };

  // Handle bulk transfer
  const handleBulkTransfer = async () => {
    if (!bulkTransferCounselor) {
      alert('Please select a counselor to transfer leads to.');
      return;
    }

    if (window.confirm(`Are you sure you want to transfer ${selectedLeads.length} lead(s) to ${bulkTransferCounselor}?`)) {
      try {
        // Save to backend API first
        const apiClient = getApiClient();
        const updateData = { assignedTo: bulkTransferCounselor };
        
        await apiClient.bulkUpdateLeads(
          selectedLeads, 
          updateData, 
          'transfer', 
          bulkTransferReason
        );


        console.log('✅ Bulk transfer saved to backend successfully');
        
        // Query will auto-update via cache invalidation after backend save
        
        // Track transferred leads as updated today with persistence
        const newUpdatedLeads = selectedLeads.filter((id: string) => !leadsUpdatedToday.includes(id));
        if (newUpdatedLeads.length > 0) {
          const updatedList = [...leadsUpdatedToday, ...newUpdatedLeads];
          setLeadsUpdatedToday(updatedList);
          localStorage.setItem('crm-leads-updated-today', JSON.stringify(updatedList));
        }
        setLastUpdateTime(new Date());
        
        // Show success message
        alert(`Successfully transferred ${selectedLeads.length} lead(s) to ${bulkTransferCounselor}`);
        
      } catch (error) {
        console.error('❌ Error during bulk transfer:', error);
        alert('Failed to transfer leads. Please check your connection and try again.');
        return; // Don't reset the form if there was an error
      }
      
      // Reset form and close modal only after successful transfer
      setBulkTransferCounselor('');
      setBulkTransferReason('');
      setShowBulkTransferModal(false);
      setSelectedLeads([]);
      
      // Close detail panel if selected lead was transferred
      if (selectedLeadId && selectedLeads.includes(selectedLeadId)) {
        setSelectedLeadId(null);
        setShowDetailPanel(false);
      }
    }
  };

  // Handle bulk company change
  const handleBulkCompanyChange = async () => {
    if (!bulkCompanyTarget) {
      alert('Please select a company to change to');
      return;
    }

    if (window.confirm(`Are you sure you want to change ${selectedLeads.length} lead(s) to ${bulkCompanyTarget} company?`)) {
      try {
        // Update each lead's company in the backend
        const updateData = { company: bulkCompanyTarget };
        
        const apiClient = getApiClient();
        await apiClient.bulkUpdateLeads(
          selectedLeads,
          updateData,
          `Bulk company change to ${bulkCompanyTarget}`
        );
        
        console.log('✅ Bulk company change saved to backend successfully');

        // Query will auto-update via cache invalidation
        
        // Show success message
        notify.success(`Successfully changed ${selectedLeads.length} lead(s) to ${bulkCompanyTarget} company`);

        alert(`Successfully changed ${selectedLeads.length} lead(s) to ${bulkCompanyTarget} company`);
        
      } catch (error) {
        console.error('❌ Error during bulk company change:', error);
        alert('Failed to change company. Please check your connection and try again.');
        return; // Don't reset the form if there was an error
      }
      
      // Reset form and close modal only after successful change
      setBulkCompanyTarget('');
      setShowBulkCompanyModal(false);
      setSelectedLeads([]);
      
      // Close detail panel if selected lead was changed
      if (selectedLeadId && selectedLeads.includes(selectedLeadId)) {
        setSelectedLeadId(null);
        setShowDetailPanel(false);
      }
    }
  };

  const calculateStats = (): LeadStats => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return {
      total: (leads || []).length,
      hot: (leads || []).filter((lead: Lead) => lead.status === 'Hot').length,
      warm: (leads || []).filter((lead: Lead) => lead.status === 'Warm').length,
      followup: (leads || []).filter((lead: Lead) => lead.status === 'Follow Up').length,
      converted: (leads || []).filter((lead: Lead) => lead.status === 'Enrolled').length,
      thisMonth: (leads || []).filter((lead: Lead) => {
        const leadDate = lead.updatedAt ? new Date(lead.updatedAt) : new Date(lead.createdAt);
        return leadDate.getMonth() === currentMonth && leadDate.getFullYear() === currentYear;
      }).length
    };
  };

  // Individual status count functions for filter buttons
  const getHotLeadsCount = () => (leads || []).filter((lead: Lead) => lead.status === 'Hot').length;
  const getWarmLeadsCount = () => (leads || []).filter((lead: Lead) => lead.status === 'Warm').length;
  const getFollowUpLeadsCount = () => (leads || []).filter((lead: Lead) => lead.status === 'Follow Up').length;
  const getFreshLeadsCount = () => (leads || []).filter((lead: Lead) => lead.status === 'Fresh').length;
  const getAllLeadsCount = () => (leads || []).length;

  // Company count functions for filter buttons
  const getDMHCALeadsCount = () => (leads || []).filter((lead: Lead) => lead.company === 'DMHCA').length;
  const getIBMPLeadsCount = () => (leads || []).filter((lead: Lead) => lead.company === 'IBMP').length;

  // Advanced Monitoring Functions
  const getAdvancedMetrics = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    // Lead velocity metrics
    const todayLeads = leads.filter((lead: Lead) => {
      const leadDate = lead.updatedAt ? new Date(lead.updatedAt) : new Date(lead.createdAt);
      const leadDateOnly = new Date(leadDate.getFullYear(), leadDate.getMonth(), leadDate.getDate());
      return leadDateOnly.getTime() === today.getTime();
    });
    
    const yesterdayLeads = leads.filter((lead: Lead) => {
      const leadDate = lead.updatedAt ? new Date(lead.updatedAt) : new Date(lead.createdAt);
      const leadDateOnly = new Date(leadDate.getFullYear(), leadDate.getMonth(), leadDate.getDate());
      return leadDateOnly.getTime() === yesterday.getTime();
    });
    
    const weekLeads = leads.filter((lead: Lead) => {
      const leadDate = lead.updatedAt ? new Date(lead.updatedAt) : new Date(lead.createdAt);
      return leadDate >= weekAgo;
    });
    
    // Conversion metrics
    const convertedLeads = leads.filter((lead: Lead) => lead.status === 'Enrolled');
    const conversionRate = leads.length > 0 ? (convertedLeads.length / leads.length * 100) : 0;
    
    // Response time metrics - Fixed to match notification logic
    const followupDueLeads = leads.filter((lead: Lead) => {
      if (!lead.followUp) return false;
      const followupDate = new Date(lead.followUp);
      const now = new Date();
      return followupDate < now && lead.status !== 'Enrolled' && lead.status !== 'Not Interested';
    });
    
    // Assignment distribution
    const assignmentDistribution = leads.reduce((acc: Record<string, number>, lead: Lead) => {
      const assignee = lead.assignedTo || 'Unassigned';
      acc[assignee] = (acc[assignee] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Source performance
    const sourcePerformance = leads.reduce((acc: Record<string, {total: number, converted: number}>, lead: Lead) => {
      const source = lead.source || 'Unknown';
      if (!acc[source]) {
        acc[source] = { total: 0, converted: 0 };
      }
      acc[source].total++;
      if (lead.status === 'enrolled') {
        acc[source].converted++;
      }
      return acc;
    }, {} as Record<string, { total: number, converted: number }>);
    
    // Activity metrics
    const lastActivity = leads.reduce((latest: Date, lead: Lead) => {
      const leadUpdate = new Date(lead.updatedAt);
      return leadUpdate > latest ? leadUpdate : latest;
    }, new Date(0));
    
    return {
      todayCount: todayLeads.length,
      yesterdayCount: yesterdayLeads.length,
      weekCount: weekLeads.length,
      conversionRate: Math.round(conversionRate * 10) / 10,
      followupDue: followupDueLeads.length,
      assignmentDistribution,
      sourcePerformance,
      lastActivity,
      leadVelocity: todayLeads.length - yesterdayLeads.length, // Change from yesterday
      averageLeadsPerDay: Math.round(weekLeads.length / 7 * 10) / 10
    };
  };

  // Real-time monitoring alerts
  const getMonitoringAlerts = () => {
    const metrics = getAdvancedMetrics();
    const alerts = [];
    
    // Check for overdue followups
    if (metrics.followupDue > 0) {
      alerts.push({
        type: 'warning',
        message: `${metrics.followupDue} leads have overdue followups`,
        action: 'View Overdue',
        icon: AlertTriangle
      });
    }
    
    // Check for low lead velocity
    if (metrics.leadVelocity < -2) {
      alerts.push({
        type: 'danger',
        message: `Lead generation down ${Math.abs(metrics.leadVelocity)} from yesterday`,
        action: 'Check Sources',
        icon: TrendingDown
      });
    }
    
    // Check for unassigned leads
    const unassigned = metrics.assignmentDistribution['Unassigned'] || 0;
    if (unassigned > 5) {
      alerts.push({
        type: 'warning',
        message: `${unassigned} leads are unassigned`,
        action: 'Assign Now',
        icon: UserCheck
      });
    }
    
    // Check for low conversion rate
    if (metrics.conversionRate < 5 && leads.length > 20) {
      alerts.push({
        type: 'info',
        message: `Conversion rate is ${metrics.conversionRate}% - consider optimization`,
        action: 'View Analytics',
        icon: BarChart3
      });
    }
    
    return alerts;
  };

  // Check for overdue follow-ups and trigger popup notifications
  const checkOverdueFollowups = () => {
    const now = new Date();
    const overdue = leads.filter((lead: Lead) => {
      if (!lead.followUp) return false;
      const followUpDate = new Date(lead.followUp);
      // Ensure we're comparing dates properly and excluding completed/uninterested leads
      return followUpDate < now && lead.status !== 'Enrolled' && lead.status !== 'Not Interested';
    });

    console.log(`🔍 Overdue check: Found ${overdue.length} overdue leads out of ${leads.length} total leads`);
    
    setOverdueLeads(overdue);

    // Only trigger popup notifications if there are actual overdue leads
    if (overdue.length > 0) {
      const newNotifications = overdue.map(lead => ({
        id: `overdue-${lead.id}`,
        type: 'overdue',
        title: '🔔 Overdue Follow-up!',
        message: `${lead.fullName} (${lead.email}) has an overdue follow-up`,
        leadId: lead.id,
        timestamp: new Date(),
        urgency: 'high'
      }));

      // Only show notifications for leads that weren't already notified recently
      const recentNotifications = newNotifications.filter(notif => {
        const existingNotif = popupNotifications.find(p => p.leadId === notif.leadId);
        if (!existingNotif) return true;
        
        // Show again if it's been more than 5 minutes since last notification (matching reminder interval)
        const timeSince = new Date().getTime() - existingNotif.timestamp.getTime();
        return timeSince > 300000; // 5 minutes in milliseconds
      });

      if (recentNotifications.length > 0) {
        setPopupNotifications(prev => [...prev, ...recentNotifications]);
      }
      if (recentNotifications.length > 0) {
        setPopupNotifications(prev => [...prev, ...recentNotifications]);
        // setShowOverduePopup(true); // DISABLED - No more popup notifications
      }
    }

    return overdue;
  };

  // Send desktop notification for overdue follow-ups
  const sendDesktopNotification = (title: string, body: string, leadId?: string) => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: leadId || 'overdue-followup',
        requireInteraction: true
      });

      notification.onclick = () => {
        window.focus();
        if (leadId) {
          setSelectedLeadId(leadId);
          setShowDetailPanel(true);
        }
        notification.close();
      };

      // Auto close after 10 seconds
      setTimeout(() => notification.close(), 10000);
    }
  };

  // Auto-refresh overdue follow-ups every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (leads.length > 0) {
        console.log('🔄 Checking for overdue follow-ups (5-min interval)...');
        const overdue = checkOverdueFollowups();
        
        // Only send notifications if there are actual overdue leads
        if (overdue.length > 0) {
          console.log(`📢 Found ${overdue.length} overdue leads, sending notifications...`);
          
          // Send desktop notifications for critical overdue leads (>3 days)
          const criticalOverdue = overdue.filter((lead: Lead) => {
            const daysOverdue = Math.floor((new Date().getTime() - new Date(lead.followUp!).getTime()) / (1000 * 60 * 60 * 24));
            return daysOverdue >= 3;
          });

          criticalOverdue.forEach((lead: Lead) => {
            const daysOverdue = Math.floor((new Date().getTime() - new Date(lead.followUp!).getTime()) / (1000 * 60 * 60 * 24));
            sendDesktopNotification(
              `🚨 Critical: ${lead.fullName} - ${daysOverdue} days overdue!`,
              `Follow-up was due ${daysOverdue} days ago. Contact immediately.`,
              lead.id
            );
          });
          
          // Send popup notification for all overdue leads - DISABLED
          if (overdue.length > 5) {
            // setPopupNotifications(prev => [...prev, {
            //   id: `bulk-overdue-${Date.now()}`,
            //   type: 'bulk-overdue',
            //   title: '⚠️ Urgent: Overdue Follow-ups!',
            //   message: `You have ${overdue.length} overdue follow-ups!`,
            //   timestamp: new Date(),
            //   urgency: 'high'
            // }]);
            console.log(`📊 ${overdue.length} overdue follow-ups detected (popup disabled)`);
          }
        } else {
          console.log('✅ No overdue follow-ups found');
        }
      }
    }, 300000); // 5 minutes (300000ms)

    return () => clearInterval(interval);
  }, [leads]);

  // Initial check when leads are loaded
  useEffect(() => {
    if (leads.length > 0) {
      setTimeout(checkOverdueFollowups, 2000); // Wait 2 seconds after leads load
    }
  }, [leads]);

  // Performance insights
  const getPerformanceInsights = () => {
    const metrics = getAdvancedMetrics();
    const insights = [];
    
    // Best performing source
    const sourceEntries = Object.entries(metrics.sourcePerformance) as [string, {total: number, converted: number}][];
    const bestSource = sourceEntries
      .filter(([_, data]) => data.total >= 3)
      .sort((a, b) => (b[1].converted / b[1].total) - (a[1].converted / a[1].total))[0];
    
    if (bestSource) {
      const rate = Math.round((bestSource[1].converted / bestSource[1].total) * 100);
      insights.push({
        type: 'success',
        title: 'Top Performing Source',
        message: `${bestSource[0]} has ${rate}% conversion rate`,
        icon: TrendingUp
      });
    }
    
    // Most active counselor
    const counselorEntries = Object.entries(metrics.assignmentDistribution) as [string, number][];
    const topCounselor = counselorEntries
      .filter(([name]) => name !== 'Unassigned')
      .sort((a, b) => b[1] - a[1])[0];
    
    if (topCounselor) {
      insights.push({
        type: 'info',
        title: 'Most Active Counselor',
        message: `${topCounselor[0]} managing ${topCounselor[1]} leads`,
        icon: User
      });
    }
    
    // Recent activity
    const timeSinceLastActivity = Date.now() - metrics.lastActivity.getTime();
    const hoursSince = Math.floor(timeSinceLastActivity / (1000 * 60 * 60));
    
    if (hoursSince < 1) {
      insights.push({
        type: 'success',
        title: 'Recent Activity',
        message: 'Leads updated within the last hour',
        icon: Zap
      });
    } else if (hoursSince > 24) {
      insights.push({
        type: 'warning',
        title: 'Low Activity',
        message: `No lead updates for ${hoursSince} hours`,
        icon: Timer
      });
    }
    
    return insights;
  };

  const stats = calculateStats();
  const advancedMetrics = getAdvancedMetrics();
  const monitoringAlerts = getMonitoringAlerts();
  const performanceInsights = getPerformanceInsights();

  // Get leads updated today count
  const getLeadsUpdatedTodayCount = () => {
    return leadsUpdatedToday.length;
  };

  // Get counts for different updated leads filters
  const getUpdatedThisWeekCount = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Go to Sunday
    
    return (leads || []).filter(lead => {
      const leadUpdated = lead.updatedAt ? new Date(lead.updatedAt) : new Date(lead.createdAt);
      return leadUpdated >= startOfWeek;
    }).length;
  };

  const getUpdatedThisMonthCount = () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    return (leads || []).filter(lead => {
      const leadUpdated = lead.updatedAt ? new Date(lead.updatedAt) : new Date(lead.createdAt);
      return leadUpdated >= startOfMonth;
    }).length;
  };

  const getUpdatedYesterdayCount = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    return (leads || []).filter(lead => {
      const leadUpdated = lead.updatedAt ? new Date(lead.updatedAt) : new Date(lead.createdAt);
      const updatedDateOnly = new Date(leadUpdated.getFullYear(), leadUpdated.getMonth(), leadUpdated.getDate());
      return updatedDateOnly.getTime() === yesterday.getTime();
    }).length;
  };

  // Get counts for Created Date filters
  const getCreatedTodayCount = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return (leads || []).filter(lead => {
      const leadCreated = new Date(lead.createdAt);
      const createdDateOnly = new Date(leadCreated.getFullYear(), leadCreated.getMonth(), leadCreated.getDate());
      return createdDateOnly.getTime() === today.getTime();
    }).length;
  };

  const getCreatedYesterdayCount = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    return (leads || []).filter(lead => {
      const leadCreated = new Date(lead.createdAt);
      const createdDateOnly = new Date(leadCreated.getFullYear(), leadCreated.getMonth(), leadCreated.getDate());
      return createdDateOnly.getTime() === yesterday.getTime();
    }).length;
  };

  const getCreatedThisWeekCount = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Go to Sunday
    
    return (leads || []).filter(lead => {
      const leadCreated = new Date(lead.createdAt);
      return leadCreated >= startOfWeek;
    }).length;
  };

  const getCreatedThisMonthCount = () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    return (leads || []).filter(lead => {
      const leadCreated = new Date(lead.createdAt);
      return leadCreated >= startOfMonth;
    }).length;
  };

  const getCreatedLastMonthCount = () => {
    const now = new Date();
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    endOfLastMonth.setHours(23, 59, 59, 999);
    
    return (leads || []).filter(lead => {
      const leadCreated = new Date(lead.createdAt);
      return leadCreated >= startOfLastMonth && leadCreated <= endOfLastMonth;
    }).length;
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Lead Management</h1>
            <p className="text-gray-600 mt-1">Manage and track all your leads in one place</p>
            {/* Hierarchical Access Indicator - Enhanced */}
            <div className="mt-2 flex items-center space-x-2">
              <div className="bg-blue-50 border border-blue-200 rounded-md px-3 py-1.5 flex items-center space-x-2">
                <UserCheck className="w-4 h-4 text-blue-600" />
                <div>
                  <span className="text-sm text-blue-700 font-medium">
                    {user?.role === 'super_admin' && 'All Leads Access'}
                    {user?.role === 'senior_manager' && 'Manager View: Your leads + All team leads'}
                    {user?.role === 'manager' && 'Manager View: Your leads + Team leads'}
                    {user?.role === 'team_leader' && `Team Leader View: Your leads + Team members (${assignableUsers.filter(u => u.username !== user?.username).length} subordinates)`}
                    {user?.role === 'counselor' && 'Personal View: Your assigned leads'}
                  </span>
                  {(user?.role === 'manager' || user?.role === 'senior_manager' || user?.role === 'team_leader') && (
                    <div className="text-xs text-blue-600 mt-0.5">
                      🏢 Viewing leads from your reporting hierarchy
                      {user?.role === 'team_leader' && assignableUsers.filter(u => u.username !== user?.username).length === 0 && (
                        <span className="ml-1 text-red-600 font-semibold">⚠️ No team members found</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              {user?.company && (
                <div className="bg-green-50 border border-green-200 rounded-md px-2 py-1 flex items-center space-x-1">
                  <span className="text-lg">🏛️</span>
                  <span className="text-xs text-green-700 font-medium">
                    {user.company}
                  </span>
                </div>
              )}
              {/* Team Leader Debug Info */}
              {user?.role === 'team_leader' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md px-2 py-1 flex items-center space-x-1">
                  <span className="text-lg">👥</span>
                  <div className="text-xs">
                    <div className="text-yellow-700 font-medium">
                      Total Leads: {leads.length} | Team Access: {assignableUsers.length} users
                    </div>
                    <div className="text-yellow-600">
                      Your leads: {leads.filter(l => l.assignedTo === user?.username).length} | 
                      Team leads: {leads.filter(l => l.assignedTo !== user?.username && assignableUsers.some(u => u.username === l.assignedTo)).length}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-600">
              {selectedLeads.length} of {filteredLeads.length} selected
            </span>
            
            {/* Import/Export Buttons */}
            <div className="flex items-center space-x-2">
              {/* Debug Button for Hierarchy Issues - DEVELOPMENT ONLY */}
              {(import.meta.env.DEV || import.meta.env.VITE_DEBUG_MODE === 'true') && (user?.role === 'super_admin' || assignableUsers.length === 0) && (
                <button 
                  onClick={async () => {
                    try {
                      const apiClient = getApiClient();
                      
                      console.log('🧪 TESTING USER LOOKUP...');
                      const testInfo = await apiClient.testUserLookup() as any;
                      console.log('🧪 USER LOOKUP TEST:', testInfo);
                      
                      console.log('🔍 HIERARCHY DEBUG...');
                      const debugInfo = await apiClient.debugAssignableUsers() as any;
                      console.log('🔍 HIERARCHY DEBUG INFO:', debugInfo);
                      
                      // Show summary
                      const testResults = testInfo?.testResults;
                      const userFound = testResults?.userLookupAttempts?.find((attempt: any) => attempt.found);
                      const subordinateResults = Object.values(testResults?.subordinateResults || {}) as any[];
                      const subordinateCount = subordinateResults.find((result: any) => result?.subordinateCount > 0)?.subordinateCount || 0;
                      
                      alert(`🧪 USER LOOKUP & HIERARCHY DEBUG\n\n` +
                            `JWT User: ${testResults?.jwtToken?.username || 'N/A'}\n` +
                            `Database Users: ${testResults?.totalUsersInDB || 'N/A'}\n` +
                            `User Found: ${userFound ? 'YES' : 'NO'}\n` +
                            `Method: ${userFound?.method || 'None worked'}\n` +
                            `Subordinates: ${subordinateCount}\n` +
                            `Assignable Users: ${assignableUsers.length}\n\n` +
                            `Check browser console for full details!`);
                      
                    } catch (error) {
                      console.error('Debug failed:', error);
                      alert('Debug failed. Check console for errors.');
                    }
                  }}
                  className="bg-orange-600 text-white px-3 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center space-x-1 text-xs"
                  title="Debug hierarchy and assignable users"
                >
                  <Bug className="w-3 h-3" />
                  <span>Debug</span>
                </button>
              )}
              <button 
                onClick={handleExportLeads}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 text-sm"
              >
                <FileDown className="w-4 h-4" />
                <span>Export</span>
              </button>

              <button 
                onClick={() => setShowUserActivityPanel(!showUserActivityPanel)}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 text-sm ${
                  showUserActivityPanel 
                    ? 'bg-purple-700 text-white' 
                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>User Activity</span>
              </button>
              
              <label className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 text-sm ${
                importLoading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
              } text-white`}>
                <FileUp className="w-4 h-4" />
                <span>{importLoading ? 'Importing...' : 'Import'}</span>
                <input 
                  type="file" 
                  accept=".csv,.xlsx,.xls" 
                  onChange={handleImportLeads}
                  disabled={importLoading}
                  className="hidden"
                />
              </label>

              <button
                onClick={() => alert(
                  'CSV/Excel Import Instructions:\n\n' +
                  '✅ FLEXIBLE IMPORT - Column order doesn\'t matter!\n\n' +
                  '📋 REQUIRED COLUMNS:\n' +
                  '   • Full Name (or "Name")\n' +
                  '   • Email (must be unique)\n\n' +
                  '📋 OPTIONAL COLUMNS (use exact data from your file):\n' +
                  '   • Phone, Country, Branch, Qualification\n' +
                  '   • Source, Course, Status, Assigned To\n' +
                  '   • Follow Up Date, Company (DMHCA/IBMP)\n' +
                  '   • Notes (imported and preserved)\n\n' +
                  '🔧 SUPPORTED FORMATS:\n' +
                  '   • CSV files (.csv)\n' +
                  '   • Excel files (.xlsx, .xls)\n\n' +
                  '⚙️ HOW IT WORKS:\n' +
                  '   • Uses whatever data you provide\n' +
                  '   • Empty fields stay empty (no defaults)\n' +
                  '   • Duplicate emails are skipped\n' +
                  '   • All data saved to database\n\n' +
                  '💡 TIP: Export leads first to see the format!'
                )}
                className="text-gray-500 hover:text-gray-700 p-2"
                title="Import Help"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </div>
            
            <button 
              onClick={handleAddLead}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 shadow-sm"
            >
              <Plus className="w-5 h-5" />
              <span>Add Lead</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Leads</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Hot Leads</p>
                <p className="text-2xl font-bold text-red-600">{stats.hot}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-red-600" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Warm Leads</p>
                <p className="text-2xl font-bold text-orange-600">{stats.warm}</p>
              </div>
              <Activity className="h-8 w-8 text-orange-600" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Follow-ups</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.followup}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-green-600">{stats.thisMonth}</p>
              </div>
              <Calendar className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Converted</p>
                <p className="text-2xl font-bold text-purple-600">{stats.converted}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-purple-600" />
            </div>
          </div>

          {/* New Updated Today Card */}
          <div className="bg-white p-4 rounded-lg shadow-sm border-2 border-cyan-200 bg-gradient-to-br from-cyan-50 to-blue-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-cyan-700">Updated Today</p>
                <p className="text-2xl font-bold text-cyan-600">{getLeadsUpdatedTodayCount()}</p>
                {lastUpdateTime && (
                  <p className="text-xs text-cyan-500 mt-1">
                    Last: {lastUpdateTime.toLocaleTimeString()}
                  </p>
                )}
                {getLeadsUpdatedTodayCount() > 0 && (
                  <button
                    onClick={resetDailyCounter}
                    className="text-xs text-cyan-600 hover:text-cyan-800 underline mt-1"
                  >
                    Reset counter
                  </button>
                )}
              </div>
              <Edit3 className="h-8 w-8 text-cyan-600" />
            </div>
          </div>

          {/* Overdue Follow-ups Card - Clickable Filter */}
          <div 
            className={`p-4 rounded-lg shadow-sm border cursor-pointer transition-all transform hover:scale-105 ${
              showOverdueOnly 
                ? 'border-red-500 bg-red-50 shadow-md' 
                : overdueLeads.length > 0 
                  ? 'border-red-200 bg-red-50 hover:bg-red-100' 
                  : 'border-gray-200 bg-white hover:bg-gray-50'
            }`}
            onClick={() => {
              setShowOverdueOnly(!showOverdueOnly);
                if (!showOverdueOnly) {
                // Reset other filters when showing overdue only
                setSearchQuery('');
                setStatusFilter(['all']);
              }
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${
                  overdueLeads.length > 0 ? 'text-red-700' : 'text-gray-600'
                }`}>
                  {showOverdueOnly ? '🔍 Showing ' : ''}Overdue Follow-ups
                </p>
                <p className={`text-2xl font-bold ${
                  overdueLeads.length > 0 ? 'text-red-600' : 'text-gray-400'
                }`}>
                  {overdueLeads.length}
                </p>
                {overdueLeads.length > 0 && (
                  <p className="text-xs text-red-500 font-medium animate-pulse">
                    {showOverdueOnly ? 'Click to show all' : 'Click to filter'}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-center">
                <AlertTriangle className={`h-8 w-8 ${
                  overdueLeads.length > 0 ? 'text-red-600 animate-bounce' : 'text-gray-400'
                }`} />
                {overdueLeads.length > 0 && (
                  <span className="text-xs bg-red-500 text-white px-2 py-1 rounded-full mt-1">
                    URGENT
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Advanced Monitoring Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          
          {/* Real-time Alerts */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div 
              className="flex items-center justify-between mb-4 cursor-pointer hover:bg-gray-50 -m-2 p-2 rounded-lg transition-colors"
              onClick={() => setShowExpandedAlerts(!showExpandedAlerts)}
            >
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Bell className="w-5 h-5 mr-2 text-red-500" />
                Monitoring Alerts
                {showExpandedAlerts ? (
                  <ChevronUp className="w-4 h-4 ml-2 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 ml-2 text-gray-400" />
                )}
              </h3>
              <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                {monitoringAlerts.length}
              </span>
            </div>
            
            {monitoringAlerts.length === 0 ? (
              <div className="text-center py-4">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-gray-600">All systems normal</p>
              </div>
            ) : showExpandedAlerts ? (
              <div className="space-y-3">
                {monitoringAlerts.map((alert, index) => {
                  const IconComponent = alert.icon;
                  return (
                    <div key={index} className={`p-3 rounded-lg border-l-4 ${
                      alert.type === 'danger' ? 'border-red-500 bg-red-50' :
                      alert.type === 'warning' ? 'border-yellow-500 bg-yellow-50' :
                      'border-blue-500 bg-blue-50'
                    }`}>
                      <div className="flex items-start">
                        <IconComponent className={`w-5 h-5 mr-2 mt-0.5 ${
                          alert.type === 'danger' ? 'text-red-500' :
                          alert.type === 'warning' ? 'text-yellow-500' :
                          'text-blue-500'
                        }`} />
                        <div className="flex-1">
                          <p className="text-sm text-gray-800">{alert.message}</p>
                          <button className={`text-xs mt-1 font-medium ${
                            alert.type === 'danger' ? 'text-red-600' :
                            alert.type === 'warning' ? 'text-yellow-600' :
                            'text-blue-600'
                          }`}>
                            {alert.action} →
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div className="mt-4 pt-3 border-t border-gray-200">
                  <button className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                    View All Alerts →
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {monitoringAlerts.slice(0, 2).map((alert, index) => {
                  const IconComponent = alert.icon;
                  return (
                    <div key={index} className={`p-2 rounded-lg border-l-4 ${
                      alert.type === 'danger' ? 'border-red-500 bg-red-50' :
                      alert.type === 'warning' ? 'border-yellow-500 bg-yellow-50' :
                      'border-blue-500 bg-blue-50'
                    }`}>
                      <div className="flex items-center">
                        <IconComponent className={`w-4 h-4 mr-2 ${
                          alert.type === 'danger' ? 'text-red-500' :
                          alert.type === 'warning' ? 'text-yellow-500' :
                          'text-blue-500'
                        }`} />
                        <p className="text-xs text-gray-800 truncate">{alert.message}</p>
                      </div>
                    </div>
                  );
                })}
                {monitoringAlerts.length > 2 && (
                  <div className="text-center pt-2">
                    <span className="text-xs text-gray-500">+{monitoringAlerts.length - 2} more alerts</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Performance Metrics */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-blue-500" />
                Performance Metrics
              </h3>
              <button className="text-xs text-blue-600 hover:text-blue-800">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Conversion Rate</span>
                <div className="flex items-center">
                  <span className="text-lg font-bold text-green-600">{advancedMetrics.conversionRate}%</span>
                  {advancedMetrics.conversionRate > 10 ? (
                    <TrendingUp className="w-4 h-4 text-green-500 ml-1" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500 ml-1" />
                  )}
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Leads Today</span>
                <div className="flex items-center">
                  <span className="text-lg font-bold text-blue-600">{advancedMetrics.todayCount}</span>
                  <span className={`text-xs ml-2 px-2 py-1 rounded-full ${
                    advancedMetrics.leadVelocity > 0 ? 'bg-green-100 text-green-800' :
                    advancedMetrics.leadVelocity < 0 ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {advancedMetrics.leadVelocity > 0 ? '+' : ''}{advancedMetrics.leadVelocity}
                  </span>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Overdue Followups</span>
                <span className={`text-lg font-bold ${
                  advancedMetrics.followupDue > 0 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {advancedMetrics.followupDue}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Avg/Day (Week)</span>
                <span className="text-lg font-bold text-purple-600">{advancedMetrics.averageLeadsPerDay}</span>
              </div>
            </div>
          </div>

          {/* Performance Insights */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div 
              className="flex items-center justify-between mb-4 cursor-pointer hover:bg-gray-50 -m-2 p-2 rounded-lg transition-colors"
              onClick={() => setShowExpandedInsights(!showExpandedInsights)}
            >
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Eye className="w-5 h-5 mr-2 text-purple-500" />
                Insights
                {showExpandedInsights ? (
                  <ChevronUp className="w-4 h-4 ml-2 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 ml-2 text-gray-400" />
                )}
              </h3>
              <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                {performanceInsights.length}
              </span>
            </div>
            
            {performanceInsights.length === 0 ? (
              <div className="text-center py-4">
                <PieChart className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">No insights available</p>
              </div>
            ) : showExpandedInsights ? (
              <div className="space-y-4">
                {performanceInsights.map((insight, index) => {
                  const IconComponent = insight.icon;
                  return (
                    <div key={index} className={`p-3 rounded-lg ${
                      insight.type === 'success' ? 'bg-green-50 border border-green-200' :
                      insight.type === 'warning' ? 'bg-yellow-50 border border-yellow-200' :
                      'bg-blue-50 border border-blue-200'
                    }`}>
                      <div className="flex items-start">
                        <IconComponent className={`w-5 h-5 mr-2 mt-0.5 ${
                          insight.type === 'success' ? 'text-green-500' :
                          insight.type === 'warning' ? 'text-yellow-500' :
                          'text-blue-500'
                        }`} />
                        <div>
                          <p className="text-sm font-medium text-gray-800">{insight.title}</p>
                          <p className="text-xs text-gray-600">{insight.message}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div className="mt-4 pt-3 border-t border-gray-200">
                  <button className="text-xs text-purple-600 hover:text-purple-800 font-medium">
                    View Detailed Analytics →
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {performanceInsights.slice(0, 2).map((insight, index) => {
                  const IconComponent = insight.icon;
                  return (
                    <div key={index} className={`p-2 rounded-lg ${
                      insight.type === 'success' ? 'bg-green-50 border border-green-200' :
                      insight.type === 'warning' ? 'bg-yellow-50 border border-yellow-200' :
                      'bg-blue-50 border border-blue-200'
                    }`}>
                      <div className="flex items-center">
                        <IconComponent className={`w-4 h-4 mr-2 ${
                          insight.type === 'success' ? 'text-green-500' :
                          insight.type === 'warning' ? 'text-yellow-500' :
                          'text-blue-500'
                        }`} />
                        <div>
                          <p className="text-xs font-medium text-gray-800 truncate">{insight.title}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {performanceInsights.length > 2 && (
                  <div className="text-center pt-2">
                    <span className="text-xs text-gray-500">+{performanceInsights.length - 2} more insights</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Team Workload Distribution - Enhanced with Hierarchical Team Members */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center justify-between">
            <div className="flex items-center">
              <Users className="w-5 h-5 mr-2 text-indigo-500" />
              Team Workload Distribution
            </div>
            <div className="text-sm text-gray-500">
              {(user?.role === 'manager' || user?.role === 'senior_manager' || user?.role === 'team_leader') && (
                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs">
                  👥 Including Subordinates ({assignableUsers.length})
                </span>
              )}
              {user?.role === 'counselor' && (
                <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                  📋 Personal View
                </span>
              )}
            </div>
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 max-h-[300px] overflow-y-auto pr-2">
            {assignableUsers.map((teamUser) => {
              const userLeadCount = leads.filter(lead => 
                lead.assignedTo === teamUser.username || lead.assignedTo === teamUser.name
              ).length;
              
              // Determine if this is the current user or a subordinate
              const isCurrentUser = teamUser.username === user?.username || teamUser.email === user?.email;
              const isSubordinate = !isCurrentUser;
              
              return (
                <div 
                  key={teamUser.id} 
                  className="text-center cursor-pointer hover:bg-gray-50 rounded-lg p-2 transition-colors duration-200"
                  onClick={() => handleTeamMemberClick(teamUser)}
                  title={`Click to view ${teamUser.name}'s leads${isSubordinate ? ' (Reports to you)' : ' (You)'}`}
                >
                  <div className={`rounded-lg p-4 mb-2 transition-colors ${
                    isCurrentUser 
                      ? 'bg-green-100 hover:bg-green-200' 
                      : 'bg-indigo-100 hover:bg-indigo-200'
                  }`}>
                    <div className="flex items-center justify-center mb-2">
                      <User className={`w-8 h-8 mx-auto ${
                        isCurrentUser ? 'text-green-600' : 'text-indigo-600'
                      }`} />
                      {isSubordinate && (
                        <span className="ml-1 text-xs">👤</span>
                      )}
                      {isCurrentUser && (
                        <span className="ml-1 text-xs">🎯</span>
                      )}
                    </div>
                    <span className={`text-2xl font-bold ${
                      isCurrentUser ? 'text-green-800' : 'text-indigo-800'
                    }`}>
                      {userLeadCount}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 truncate" title={teamUser.name}>
                    {teamUser.name}
                    {isCurrentUser && <span className="text-green-600 ml-1">(You)</span>}
                  </p>
                  <p className="text-xs text-gray-400 truncate" title={teamUser.role}>
                    {teamUser.role}
                    {isSubordinate && <span className="text-blue-600 ml-1">↳</span>}
                  </p>
                </div>
              );
            })}
          </div>
          
          {assignableUsers.length === 0 && (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">No team members found</p>
              <p className="text-xs text-gray-500 mt-1">
                {user?.role === 'counselor' ? 'Only your personal leads are visible' : 'Check user hierarchy setup'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* User Activity Panel */}
      {showUserActivityPanel && (
        <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <BarChart3 className="w-5 h-5 text-purple-600 mr-2" />
                  User Activity & Lead Updates
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Shows lead update counts for users in your reporting hierarchy
                </p>
              </div>
              <button
                onClick={() => setShowUserActivityPanel(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="p-4">
            {userActivityStats.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-3 text-sm font-medium text-gray-700">User</th>
                      <th className="text-left py-2 px-3 text-sm font-medium text-gray-700">Role</th>
                      <th className="text-center py-2 px-3 text-sm font-medium text-gray-700">Total Leads</th>
                      <th className="text-center py-2 px-3 text-sm font-medium text-gray-700">Updated Today</th>
                      <th className="text-center py-2 px-3 text-sm font-medium text-gray-700">This Week</th>
                      <th className="text-center py-2 px-3 text-sm font-medium text-gray-700">This Month</th>
                      <th className="text-center py-2 px-3 text-sm font-medium text-gray-700">Hot/Warm</th>
                      <th className="text-center py-2 px-3 text-sm font-medium text-gray-700">Enrolled</th>
                      <th className="text-center py-2 px-3 text-sm font-medium text-gray-700">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userActivityStats.map((stats, index) => (
                      <tr key={stats.userId} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                        <td className="py-3 px-3">
                          <div>
                            <div className="font-medium text-gray-900">{stats.username}</div>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            stats.role === 'super_admin' ? 'bg-purple-100 text-purple-800' :
                            stats.role === 'senior_manager' ? 'bg-blue-100 text-blue-800' :
                            stats.role === 'manager' ? 'bg-green-100 text-green-800' :
                            stats.role === 'team_leader' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {stats.role.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center font-medium">{stats.totalLeads}</td>
                        <td className="py-3 px-3 text-center">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            stats.updatedToday > 5 ? 'bg-green-100 text-green-800' :
                            stats.updatedToday > 2 ? 'bg-yellow-100 text-yellow-800' :
                            stats.updatedToday > 0 ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {stats.updatedToday}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center text-gray-700">{stats.updatedThisWeek}</td>
                        <td className="py-3 px-3 text-center text-gray-700">{stats.updatedThisMonth}</td>
                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center justify-center space-x-1">
                            <span className="text-red-600 font-medium">🔥{stats.hotLeads}</span>
                            <span className="text-orange-600 font-medium">🌡️{stats.warmLeads}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="text-green-600 font-medium">✅{stats.enrolledLeads}</span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <div className="text-xs">
                            <div className="font-medium text-green-600">
                              {formatCurrency(stats.totalRevenue, user?.company === 'IBMP' ? 'USD' : 'INR')}
                            </div>
                            {stats.estimatedRevenue > 0 && (
                              <div className="text-gray-500">
                                Est: {formatCurrency(stats.estimatedRevenue, user?.company === 'IBMP' ? 'USD' : 'INR')}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>No user activity data available</p>
                <p className="text-sm mt-1">User activity will appear here once leads and users are loaded</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Status Filters */}
      <div className="mb-4 flex flex-wrap gap-3">
        <div className="text-sm font-medium text-gray-700 flex items-center mr-4">
          <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            🎯 Quick Status Filters:
          </span>
        </div>
        
        <button
          onClick={() => quickStatusFilter('Hot')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            statusFilter.includes('Hot') 
              ? 'bg-red-100 text-red-800 border-2 border-red-300 shadow-md' 
              : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50 hover:shadow-sm'
          }`}
        >
          🔥 Hot ({getHotLeadsCount()})
        </button>
        <button
          onClick={() => quickStatusFilter('Warm')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            statusFilter.includes('Warm') 
              ? 'bg-orange-100 text-orange-800 border-2 border-orange-300 shadow-md' 
              : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50 hover:shadow-sm'
          }`}
        >
          🌡️ Warm ({getWarmLeadsCount()})
        </button>
        <button
          onClick={() => quickStatusFilter('Follow Up')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            statusFilter.includes('Follow Up') 
              ? 'bg-yellow-100 text-yellow-800 border-2 border-yellow-300 shadow-md' 
              : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50 hover:shadow-sm'
          }`}
        >
          📅 Follow-up ({getFollowUpLeadsCount()})
        </button>
        <button
          onClick={() => quickStatusFilter('Fresh')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            statusFilter.includes('Fresh') 
              ? 'bg-green-100 text-green-800 border-2 border-green-300 shadow-md' 
              : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50 hover:shadow-sm'
          }`}
        >
          🌱 Fresh ({getFreshLeadsCount()})
        </button>
        <button
          onClick={() => quickStatusFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            statusFilter.includes('all') 
              ? 'bg-blue-100 text-blue-800 border-2 border-blue-300 shadow-md' 
              : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50 hover:shadow-sm'
          }`}
        >
          📊 All ({getAllLeadsCount()})
        </button>
        
      </div>

      {/* Updated Leads Date Filters */}
      <div className="mb-4 flex flex-wrap gap-3">
        <div className="text-sm font-medium text-gray-700 flex items-center mr-4">
          <span className="bg-gradient-to-r from-cyan-600 to-purple-600 bg-clip-text text-transparent">
            📅 Filter by Updated Date:
          </span>
        </div>
        
        {/* Updated Today Filter */}
        <button
          onClick={() => setFilterToUpdatedToday()}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            dateFilter === 'updated_today' 
              ? 'bg-cyan-100 text-cyan-800 border-2 border-cyan-300 shadow-md' 
              : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50 hover:shadow-sm'
          }`}
        >
          {dateFilter === 'updated_today' 
            ? `✅ Showing Updated Today (${getLeadsUpdatedTodayCount()})` 
            : `✏️ Updated Today (${getLeadsUpdatedTodayCount()})`
          }
        </button>

        {/* Updated Yesterday Filter */}
        <button
          onClick={() => setDateFilter(dateFilter === 'updated_yesterday' ? 'all' : 'updated_yesterday')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            dateFilter === 'updated_yesterday' 
              ? 'bg-orange-100 text-orange-800 border-2 border-orange-300 shadow-md' 
              : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50 hover:shadow-sm'
          }`}
        >
          {dateFilter === 'updated_yesterday' 
            ? `✅ Updated Yesterday (${getUpdatedYesterdayCount()})` 
            : `📝 Updated Yesterday (${getUpdatedYesterdayCount()})`
          }
        </button>

        {/* Updated This Week Filter */}
        <button
          onClick={() => setDateFilter(dateFilter === 'updated_this_week' ? 'all' : 'updated_this_week')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            dateFilter === 'updated_this_week' 
              ? 'bg-blue-100 text-blue-800 border-2 border-blue-300 shadow-md' 
              : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50 hover:shadow-sm'
          }`}
        >
          {dateFilter === 'updated_this_week' 
            ? `✅ Updated This Week (${getUpdatedThisWeekCount()})` 
            : `📅 Updated This Week (${getUpdatedThisWeekCount()})`
          }
        </button>

        {/* Updated This Month Filter */}
        <button
          onClick={() => setDateFilter(dateFilter === 'updated_this_month' ? 'all' : 'updated_this_month')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            dateFilter === 'updated_this_month' 
              ? 'bg-indigo-100 text-indigo-800 border-2 border-indigo-300 shadow-md' 
              : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50 hover:shadow-sm'
          }`}
        >
          {dateFilter === 'updated_this_month' 
            ? `✅ Updated This Month (${getUpdatedThisMonthCount()})` 
            : `📆 Updated This Month (${getUpdatedThisMonthCount()})`
          }
        </button>

        {/* Recently Imported Filter */}
        <button
          onClick={() => setFilterToRecentlyImported()}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            dateFilter === 'recently_imported' 
              ? 'bg-purple-100 text-purple-800 border-2 border-purple-300 shadow-md' 
              : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50 hover:shadow-sm'
          }`}
        >
          {dateFilter === 'recently_imported' 
            ? `✅ Showing Recently Imported (${getRecentlyImportedCount()})` 
            : `📥 Recently Imported (${getRecentlyImportedCount()})`
          }
        </button>

        {/* Clear All Filters Button */}
        {hasActiveFilters() && (
          <button
            onClick={clearAllFilters}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 hover:border-red-300 hover:shadow-sm"
          >
            🗑️ Clear All Filters
          </button>
        )}
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters() && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center text-sm text-gray-700">
              <Filter className="w-4 h-4 mr-2 text-gray-500" />
              <span className="font-medium">Active Filters:</span>
              <div className="ml-2 flex flex-wrap gap-1">
                {searchQuery && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                    Search: "{searchQuery}"
                  </span>
                )}
                {dateFilter !== 'all' && (
                  <span className="bg-cyan-100 text-cyan-800 px-2 py-1 rounded text-xs">
                    Date: {dateFilter.replace('_', ' ')}
                  </span>
                )}
                {!statusFilter.includes('all') && statusFilter.length > 0 && (
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                    Status: {statusFilter.join(', ')}
                  </span>
                )}
                {countryFilter !== 'all' && (
                  <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">
                    Country: {countryFilter}
                  </span>
                )}
                {companyFilter !== 'all' && (
                  <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">
                    Company: {companyFilter}
                  </span>
                )}
                {!assignedToFilter.includes('all') && (
                  <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded text-xs">
                    Assigned: {assignedToFilter.join(', ')}
                  </span>
                )}
                {showOverdueOnly && (
                  <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">
                    Overdue Only
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={clearAllFilters}
              className="text-xs text-red-600 hover:text-red-800 font-medium"
            >
              Clear All
            </button>
          </div>
        </div>
      )}

      {/* Company Filters */}
      <div className="mb-4 flex flex-wrap gap-3">
        <div className="text-sm font-medium text-gray-700 flex items-center mr-4">
          <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            🏢 Filter by Company:
          </span>
        </div>
        
        <button
          onClick={() => quickCompanyFilter('DMHCA')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            companyFilter === 'DMHCA' 
              ? 'bg-blue-100 text-blue-800 border-2 border-blue-300 shadow-md' 
              : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50 hover:shadow-sm'
          }`}
        >
          🏥 DMHCA ({getDMHCALeadsCount()})
        </button>

        <button
          onClick={() => quickCompanyFilter('IBMP')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            companyFilter === 'IBMP' 
              ? 'bg-green-100 text-green-800 border-2 border-green-300 shadow-md' 
              : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50 hover:shadow-sm'
          }`}
        >
          🎓 IBMP ({getIBMPLeadsCount()})
        </button>

        <button
          onClick={() => quickCompanyFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            companyFilter === 'all' 
              ? 'bg-gray-100 text-gray-800 border-2 border-gray-300 shadow-md' 
              : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50 hover:shadow-sm'
          }`}
        >
          🌐 All Companies ({getAllLeadsCount()})
        </button>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search leads by name, email, phone, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 hover:text-gray-600 transition-colors"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Clear All Filters Button */}
          {hasActiveFilters() && (
            <button
              onClick={clearAllFilters}
              className="flex items-center space-x-2 px-4 py-3 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 hover:border-red-300 transition-colors"
              title="Clear all active filters"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Clear All Filters</span>
            </button>
          )}

          {/* Overdue Filter Indicator */}
          {showOverdueOnly && (
            <div className="flex items-center bg-red-100 border border-red-300 rounded-lg px-4 py-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
              <span className="text-red-700 font-medium">Showing Overdue Follow-ups Only</span>
              <button
                onClick={() => setShowOverdueOnly(false)}
                className="ml-3 text-red-600 hover:text-red-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Team Hierarchy Summary - Only for managers/team leaders */}
          {(user?.role === 'manager' || user?.role === 'senior_manager' || user?.role === 'team_leader') && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Users className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-medium text-blue-800">Team Lead Visibility</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-700">
                    {filteredLeads.filter(lead => lead.assignedTo?.toLowerCase() === user?.username?.toLowerCase()).length}
                  </div>
                  <div className="text-blue-600">Your Leads</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-700">
                    {filteredLeads.filter(lead => lead.assignedTo?.toLowerCase() !== user?.username?.toLowerCase()).length}
                  </div>
                  <div className="text-green-600">Team Leads</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-700">
                    {filteredLeads.length}
                  </div>
                  <div className="text-gray-600">Total Visible</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-orange-700">
                    {assignableUsers.length}
                  </div>
                  <div className="text-orange-600">Team Size</div>
                </div>
              </div>
            </div>
          )}

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Filter className="w-4 h-4" />
            <span>Advanced Filters</span>
            {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📅 Date Filter - Updated Leads
                </label>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value="all">🌐 All Time</option>
                  <optgroup label="📊 Updated Leads">
                    <option value="updated_today">✏️ Updated Today ({getLeadsUpdatedTodayCount()})</option>
                    <option value="updated_yesterday">📝 Updated Yesterday ({getUpdatedYesterdayCount()})</option>
                    <option value="updated_this_week">📅 Updated This Week ({getUpdatedThisWeekCount()})</option>
                    <option value="updated_last_week">📋 Updated Last Week</option>
                    <option value="updated_this_month">📆 Updated This Month ({getUpdatedThisMonthCount()})</option>
                  </optgroup>
                  <optgroup label="🗓️ General Date Filters">
                    <option value="today">📍 Updated Today</option>
                    <option value="yesterday">⏮️ Updated Yesterday</option>
                    <option value="week">🗓️ Updated Last 7 Days</option>
                    <option value="month">📅 Updated Last 30 Days</option>
                  </optgroup>
                  <optgroup label="🔧 Advanced">
                    <option value="custom">📊 Custom Last Updated Range</option>
                    <option value="advanced">⚙️ Advanced Date Filter</option>
                  </optgroup>
                </select>
              </div>

              {/* System Updates Toggle - FIXED: Prevents imported/transferred leads from showing as "updated" */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="excludeSystemUpdates"
                  checked={excludeSystemUpdates}
                  onChange={(e) => setExcludeSystemUpdates(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="excludeSystemUpdates" className="ml-2 block text-sm text-gray-700">
                  📋 Exclude System Updates (imports/transfers)
                </label>
              </div>

              {dateFilter === 'custom' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">From Date (Last Updated)</label>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">To Date (Last Updated)</label>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </>
              )}

              {dateFilter === 'advanced' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Filter Type</label>
                    <select
                      value={dateFilterType}
                      onChange={(e) => setDateFilterType(e.target.value as 'on' | 'after' | 'before' | 'between')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="on">On Specific Date</option>
                      <option value="after">After Date</option>
                      <option value="before">Before Date</option>
                      <option value="between">Between Dates</option>
                    </select>
                  </div>
                  {dateFilterType === 'between' ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">From Date (Updated)</label>
                        <input
                          type="date"
                          value={dateFrom}
                          onChange={(e) => setDateFrom(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">To Date (Updated)</label>
                        <input
                          type="date"
                          value={dateTo}
                          onChange={(e) => setDateTo(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {dateFilterType === 'on' ? 'Select Date' : 
                         dateFilterType === 'after' ? 'After Date' : 'Before Date'}
                      </label>
                      <input
                        type="date"
                        value={specificDate}
                        onChange={(e) => setSpecificDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  )}
                </>
              )}

              {/* Created Date Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🎯 Created Date Filter
                </label>
                <select
                  value={createdDateFilter}
                  onChange={(e) => setCreatedDateFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value="all">🌐 All Created Dates</option>
                  <optgroup label="📅 Recent Created">
                    <option value="created_today">🆕 Created Today ({getCreatedTodayCount()})</option>
                    <option value="created_yesterday">📆 Created Yesterday ({getCreatedYesterdayCount()})</option>
                    <option value="created_this_week">📅 Created This Week ({getCreatedThisWeekCount()})</option>
                    <option value="created_last_week">📋 Created Last Week</option>
                    <option value="created_this_month">🗓️ Created This Month ({getCreatedThisMonthCount()})</option>
                    <option value="created_last_month">📊 Created Last Month ({getCreatedLastMonthCount()})</option>
                  </optgroup>
                  <optgroup label="🔧 Advanced Created">
                    <option value="created_custom">📊 Custom Created Range</option>
                    <option value="created_advanced">⚙️ Advanced Created Filter</option>
                  </optgroup>
                </select>
              </div>

              {createdDateFilter === 'created_custom' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">From Date (Created)</label>
                    <input
                      type="date"
                      value={createdDateFrom}
                      onChange={(e) => setCreatedDateFrom(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">To Date (Created)</label>
                    <input
                      type="date"
                      value={createdDateTo}
                      onChange={(e) => setCreatedDateTo(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </>
              )}

              {createdDateFilter === 'created_advanced' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Created Filter Type</label>
                    <select
                      value={createdDateFilterType}
                      onChange={(e) => setCreatedDateFilterType(e.target.value as 'on' | 'after' | 'before' | 'between')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="on">Created On Specific Date</option>
                      <option value="after">Created After Date</option>
                      <option value="before">Created Before Date</option>
                      <option value="between">Created Between Dates</option>
                    </select>
                  </div>
                  {createdDateFilterType === 'between' ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">From Date (Created)</label>
                        <input
                          type="date"
                          value={createdDateFrom}
                          onChange={(e) => setCreatedDateFrom(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">To Date (Created)</label>
                        <input
                          type="date"
                          value={createdDateTo}
                          onChange={(e) => setCreatedDateTo(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {createdDateFilterType === 'on' ? 'Select Created Date' : 
                         createdDateFilterType === 'after' ? 'Created After Date' : 'Created Before Date'}
                      </label>
                      <input
                        type="date"
                        value={createdSpecificDate}
                        onChange={(e) => setCreatedSpecificDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  )}
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-auto p-2 border border-gray-200 rounded">
                  <label className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      checked={statusFilter.includes('all')}
                      onChange={(e) => {
                        if (e.target.checked) setStatusFilter(['all']);
                        else setStatusFilter([]);
                      }}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                    <span>All Status</span>
                  </label>
                  {(statusOptions || []).map((status: string) => (
                    <label key={status} className="flex items-center space-x-2 text-sm">
                      <input
                        type="checkbox"
                        checked={statusFilter.includes(status)}
                        onChange={(e) => {
                          setStatusFilter(prev => {
                            // If 'all' is currently selected, clear it first
                            const base = prev.includes('all') ? [] : [...prev];
                            if (e.target.checked) {
                              // add status
                              return Array.from(new Set([...base, status]));
                            } else {
                              // remove status
                              return base.filter(s => s !== status);
                            }
                          });
                        }}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                      />
                      <span>{status}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                <select
                  value={countryFilter}
                  onChange={(e) => setCountryFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Countries</option>
                  {countryOptions.map(country => (
                    <option key={country.code} value={country.name}>{country.name} ({country.phoneCode})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Source</label>
                <select
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Sources</option>
                  {getUniqueValues('source').map(source => (
                    <option key={source} value={source}>{source}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 flex items-center justify-between">
                  <span>Assigned To (Multi-Select)</span>
                  {(user?.role === 'manager' || user?.role === 'senior_manager' || user?.role === 'team_leader') && (
                    <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      👥 Team View
                    </span>
                  )}
                </label>
                <p className="text-xs text-gray-600 mb-2">Hold Ctrl/Cmd to select multiple users</p>
                <select
                  multiple
                  value={assignedToFilter}
                  onChange={(e) => {
                    const selectedValues = Array.from(e.target.selectedOptions, option => option.value);
                    setAssignedToFilter(selectedValues);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[150px] max-h-[200px] overflow-y-auto"
                  size={8}
                >
                  <option value="all">All Assigned ({assignableUsers.length} users)</option>
                  
                  {/* Show ALL assignable users - Simplified Logic */}
                  {assignableUsers.map((teamUser) => {
                    const filterValue = teamUser.username || teamUser.name;
                    const isCurrentUser = teamUser.username === user?.username || teamUser.email === user?.email;
                    
                    // Determine the display label based on relationship
                    let displayLabel = '';
                    if (isCurrentUser) {
                      displayLabel = `🎯 ${teamUser.name} (You - ${teamUser.role})`;
                    } else if (user?.role === 'super_admin') {
                      displayLabel = `👥 ${teamUser.name} (${teamUser.role})`;
                    } else {
                      displayLabel = `👤 ${teamUser.name} (${teamUser.role})`;
                    }
                    
                    return (
                      <option key={teamUser.id} value={filterValue}>
                        {displayLabel}
                      </option>
                    );
                  })}
                  
                  {/* For counselors showing personal view only */}
                  {user?.role === 'counselor' && assignableUsers.length <= 1 && (
                    <option disabled>─── Personal View Only ───</option>
                  )}
                  
                  {/* Show unassigned option */}
                  <option value="unassigned">🚫 Unassigned Leads</option>
                  
                  {/* Fallback to existing assigned users if no hierarchy data */}
                  {assignableUsers.length === 0 && (() => {
                    const uniqueAssigned = getUniqueValues('assignedTo');
                    console.log(`🔍 Using fallback assigned users:`, uniqueAssigned);
                    return uniqueAssigned.map(assigned => (
                      <option key={assigned} value={assigned}>{assigned}</option>
                    ));
                  })()}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Qualification</label>
                <select
                  value={qualificationFilter}
                  onChange={(e) => setQualificationFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Qualifications</option>
                  {qualificationOptions.map(qualification => (
                    <option key={qualification} value={qualification}>{qualification}</option>
                  ))}
                  {/* Include any additional qualifications from leads data not in predefined list */}
                  {getUniqueValues('qualification')
                    .filter(qual => !qualificationOptions.includes(qual))
                    .map(qualification => (
                      <option key={`custom-${qualification}`} value={qualification}>{qualification}</option>
                    ))
                  }
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Course</label>
                <select
                  value={courseFilter}
                  onChange={(e) => setCourseFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Courses</option>
                  <optgroup label="Fellowship Courses">
                    {(courseOptions.fellowship || []).map((course: string) => (
                      <option key={`fellowship-${course}`} value={course}>{course}</option>
                    ))}
                  </optgroup>
                  <optgroup label="PG Diploma Courses">
                    {(courseOptions.pgDiploma || []).map((course: string) => (
                      <option key={`pgdiploma-${course}`} value={course}>{course}</option>
                    ))}
                  </optgroup>
                  {/* No fallback to database values - always use proper course options */}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content - Compact Layout with Detail Panel */}
      <div className="flex gap-6">
        {/* Leads List - Compact View */}
        <div className={`${showDetailPanel ? 'w-2/3' : 'w-full'} transition-all duration-300`}>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            {/* Enhanced Header with bulk actions */}
            <div className="p-4 border-b border-gray-200 space-y-3">
              {/* Top row - Title and selection info */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Leads Management ({paginatedLeads.length} on page)
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Total accessible leads: <span className="font-semibold text-blue-600">{totalItems}</span>
                    {user?.role !== 'super_admin' && (
                      <span className="ml-2 text-gray-500 text-xs">
                        (Your hierarchy view)
                      </span>
                    )}
                    {user?.role === 'super_admin' && (
                      <span className="ml-2 text-green-600 text-xs">
                        (All database leads)
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={selectedLeads.length === filteredLeads.length && filteredLeads.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-600">
                    {selectedLeads.length > 0 ? `${selectedLeads.length} selected` : `Select all`}
                  </span>
                </div>
              </div>

              {/* Enhanced Bulk Actions Row */}
              {selectedLeads.length > 0 && (
                <div className="flex items-center justify-between bg-blue-50 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-blue-900">
                      {selectedLeads.length} lead{selectedLeads.length > 1 ? 's' : ''} selected
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {/* Bulk Status Update */}
                    <select
                      value=""
                      onChange={(e) => {
                        handleBulkStatusUpdate(e.target.value);
                        e.target.value = ''; // Reset dropdown after selection
                      }}
                      className="px-3 py-1.5 border border-blue-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    >
                      <option value="" disabled>Update Status</option>
                      {statusOptions.map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>

                    {/* Bulk Delete */}
                    <button
                      onClick={handleBulkDelete}
                      disabled={selectedLeads.length === 0}
                      className={`px-3 py-1.5 rounded-lg flex items-center space-x-1 text-sm ${
                        selectedLeads.length === 0 
                          ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                          : 'bg-red-600 text-white hover:bg-red-700'
                      }`}
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete ({selectedLeads.length})</span>
                    </button>

                    {/* Bulk Transfer - Only for managers */}
                    {isManager() && (
                      <button
                        onClick={() => setShowBulkTransferModal(true)}
                        className="bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 flex items-center space-x-1 text-sm"
                      >
                        <ArrowUpDown className="w-4 h-4" />
                        <span>Transfer</span>
                      </button>
                    )}

                    {/* Bulk Company Change */}
                    <button
                      onClick={() => setShowBulkCompanyModal(true)}
                      className="bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700 flex items-center space-x-1 text-sm"
                      title="Change company for selected leads"
                    >
                      <Building className="w-4 h-4" />
                      <span>Company</span>
                    </button>

                    {/* Clear Selection */}
                    <button
                      onClick={() => setSelectedLeads([])}
                      className="text-gray-500 hover:text-gray-700 px-2 py-1.5 text-sm"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Pagination Controls - Top */}
            {totalPages > 1 && (
              <div className="border-t border-gray-200 px-4 py-4 bg-gray-50">
                <div className="flex items-center justify-between">
                  {/* Left: Showing info and page size selector */}
                  <div className="flex items-center space-x-4">
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                      <span className="font-medium">{endIndex}</span> of{' '}
                      <span className="font-medium">{totalItems}</span> leads
                    </p>
                    
                    {/* Items per page selector */}
                    <div className="flex items-center space-x-2">
                      <label className="text-sm text-gray-600">Per page:</label>
                      <select
                        value={itemsPerPage}
                        onChange={(e) => {
                          setItemsPerPage(Number(e.target.value));
                          setCurrentPage(1);
                        }}
                        className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                        <option value={200}>200</option>
                      </select>
                    </div>
                  </div>

                  {/* Right: Page navigation */}
                  <div className="flex items-center space-x-2">
                    {/* First page button */}
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className={`px-3 py-1 rounded-lg text-sm font-medium ${
                        currentPage === 1
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                      }`}
                    >
                      First
                    </button>

                    {/* Previous button */}
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className={`px-3 py-1 rounded-lg text-sm font-medium ${
                        currentPage === 1
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                      }`}
                    >
                      Previous
                    </button>

                    {/* Page numbers */}
                    <div className="flex items-center space-x-1">
                      {(() => {
                        const pages = [];
                        const showPages = 5; // Show 5 page numbers at a time
                        let startPage = Math.max(1, currentPage - Math.floor(showPages / 2));
                        let endPage = Math.min(totalPages, startPage + showPages - 1);
                        
                        // Adjust start if we're near the end
                        if (endPage - startPage < showPages - 1) {
                          startPage = Math.max(1, endPage - showPages + 1);
                        }

                        // Show first page if not in range
                        if (startPage > 1) {
                          pages.push(
                            <button
                              key={1}
                              onClick={() => setCurrentPage(1)}
                              className="px-3 py-1 rounded-lg text-sm font-medium bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
                            >
                              1
                            </button>
                          );
                          if (startPage > 2) {
                            pages.push(<span key="start-ellipsis" className="px-2 text-gray-500">...</span>);
                          }
                        }

                        // Show page numbers
                        for (let i = startPage; i <= endPage; i++) {
                          pages.push(
                            <button
                              key={i}
                              onClick={() => setCurrentPage(i)}
                              className={`px-3 py-1 rounded-lg text-sm font-medium ${
                                currentPage === i
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                              }`}
                            >
                              {i}
                            </button>
                          );
                        }

                        // Show last page if not in range
                        if (endPage < totalPages) {
                          if (endPage < totalPages - 1) {
                            pages.push(<span key="end-ellipsis" className="px-2 text-gray-500">...</span>);
                          }
                          pages.push(
                            <button
                              key={totalPages}
                              onClick={() => setCurrentPage(totalPages)}
                              className="px-3 py-1 rounded-lg text-sm font-medium bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
                            >
                              {totalPages}
                            </button>
                          );
                        }

                        return pages;
                      })()}
                    </div>

                    {/* Next button */}
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className={`px-3 py-1 rounded-lg text-sm font-medium ${
                        currentPage === totalPages
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                      }`}
                    >
                      Next
                    </button>

                    {/* Last page button */}
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className={`px-3 py-1 rounded-lg text-sm font-medium ${
                        currentPage === totalPages
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                      }`}
                    >
                      Last
                    </button>

                    {/* Go to page input */}
                    <div className="flex items-center space-x-2 ml-4 pl-4 border-l border-gray-300">
                      <label className="text-sm text-gray-600">Go to:</label>
                      <input
                        type="number"
                        min={1}
                        max={totalPages}
                        value={currentPage}
                        onChange={(e) => {
                          const page = parseInt(e.target.value);
                          if (page >= 1 && page <= totalPages) {
                            setCurrentPage(page);
                          }
                        }}
                        className="w-16 px-2 py-1 border border-gray-300 rounded-lg text-sm text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <span className="text-sm text-gray-500">of {totalPages}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Enhanced Systematic Leads List */}
            <div className="divide-y divide-gray-100">
              {paginatedLeads.map((lead: Lead) => (
                <div 
                  key={lead.id}
                  data-lead-id={lead.id}
                  className={`p-4 hover:bg-gray-50 transition-all duration-200 ${
                    selectedLeadId === lead.id 
                      ? 'bg-blue-50 border-l-4 border-blue-500 shadow-sm ring-1 ring-blue-200' 
                      : 'hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      <input
                        type="checkbox"
                        checked={selectedLeads.includes(lead.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleLeadSelect(lead.id);
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      
                      {/* Lead Info Grid - More Systematic Layout */}
                      <div className="grid grid-cols-4 gap-4 flex-1 cursor-pointer" onClick={() => handleLeadClick(lead.id)}>
                        {/* Primary Info Column */}
                        <div className="space-y-1">
                          {editingLead === lead.id ? (
                            <>
                              <input
                                type="text"
                                value={editedLead.fullName || lead.fullName}
                                onChange={(e) => setEditedLead(prev => ({ ...prev, fullName: e.target.value }))}
                                className="font-medium text-gray-900 bg-white border border-gray-300 rounded px-2 py-1 text-sm w-full"
                                onClick={(e) => e.stopPropagation()}
                                placeholder="Full Name"
                              />
                              <select
                                value={editedLead.status || lead.status}
                                onChange={(e) => setEditedLead(prev => ({ ...prev, status: e.target.value }))}
                                className="text-sm font-medium bg-white border border-gray-300 rounded px-2 py-1 w-full"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <option value="">Select Status</option>
                                {(statusOptions || STATUS_OPTIONS).map(status => (
                                  <option key={status} value={status}>
                                    {status}
                                  </option>
                                ))}
                              </select>
                              <input
                                type="date"
                                value={editedLead.followUp || lead.followUp || ''}
                                onChange={(e) => setEditedLead(prev => ({ ...prev, followUp: e.target.value }))}
                                className="text-xs text-gray-600 bg-white border border-gray-300 rounded px-2 py-1 w-full"
                                onClick={(e) => e.stopPropagation()}
                                title="Follow Up Date"
                              />
                            </>
                          ) : (
                            <>
                              <div className="flex items-center space-x-2">
                                <h3 className="font-medium text-gray-900">{lead.fullName}</h3>
                                {/* Hierarchy indicator */}
                                {lead.assignedTo && lead.assignedTo.toLowerCase() !== user?.username?.toLowerCase() && (
                                  <span 
                                    className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                    title={`Team member lead: ${lead.assignedTo}`}
                                  >
                                    👥
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500">#{lead.id}</p>
                              <div className="flex items-center space-x-1">
                                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                                  STATUS_COLORS[lead.status as keyof typeof STATUS_COLORS] || STATUS_COLORS['Fresh']
                                }`}>
                                  {lead.status}
                                </span>
                              </div>
                              {lead.followUp && (
                                <p className="text-xs text-gray-600 flex items-center">
                                  <Calendar className="w-3 h-3 mr-1" />
                                  Follow: {new Date(lead.followUp).toLocaleDateString()}
                                </p>
                              )}
                            </>
                          )}
                        </div>

                        {/* Contact Info Column */}
                        <div className="space-y-1">
                          {editingLead === lead.id ? (
                            <>
                              <input
                                type="email"
                                value={editedLead.email || lead.email}
                                onChange={(e) => setEditedLead(prev => ({ ...prev, email: e.target.value }))}
                                className="text-sm text-gray-600 bg-white border border-gray-300 rounded px-2 py-1 w-full"
                                onClick={(e) => e.stopPropagation()}
                              />
                              <input
                                type="tel"
                                value={editedLead.phone || lead.phone}
                                onChange={(e) => setEditedLead(prev => ({ ...prev, phone: e.target.value }))}
                                className="text-sm text-gray-500 bg-white border border-gray-300 rounded px-2 py-1 w-full"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </>
                          ) : (
                            <>
                              <p className="text-sm text-gray-600 flex items-center">
                                <Mail className="w-3 h-3 mr-1" />
                                {lead.email}
                              </p>
                              <p className="text-sm text-gray-500 flex items-center">
                                <Phone className="w-3 h-3 mr-1" />
                                {lead.phone}
                              </p>
                            </>
                          )}
                        </div>

                        {/* Academic Info Column */}
                        <div className="space-y-1">
                          {editingLead === lead.id ? (
                            <>
                              <select
                                value={editedLead.country || lead.country}
                                onChange={(e) => setEditedLead(prev => ({ ...prev, country: e.target.value }))}
                                className="text-sm text-gray-600 bg-white border border-gray-300 rounded px-2 py-1 w-full"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {countryOptions.map(country => (
                                  <option key={country.code} value={country.name}>
                                    {country.name}
                                  </option>
                                ))}
                              </select>
                              <select
                                value={editedLead.qualification || lead.qualification}
                                onChange={(e) => setEditedLead(prev => ({ ...prev, qualification: e.target.value }))}
                                className="text-sm text-gray-500 bg-white border border-gray-300 rounded px-2 py-1 w-full"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <option value="">Select Qualification</option>
                                {qualificationOptions.map(qualification => (
                                  <option key={qualification} value={qualification}>
                                    {qualification}
                                  </option>
                                ))}
                              </select>
                              <select
                                value={editedLead.course || lead.course}
                                onChange={(e) => setEditedLead(prev => ({ ...prev, course: e.target.value }))}
                                className="text-xs text-gray-400 bg-white border border-gray-300 rounded px-2 py-1 w-full"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <option value="">Select Course</option>
                                <option value="MBBS">MBBS</option>
                                <option value="BDS">BDS</option>
                                <option value="BAMS">BAMS</option>
                                <option value="BHMS">BHMS</option>
                                <option value="BUMS">BUMS</option>
                                <option value="B.Sc Nursing">B.Sc Nursing</option>
                                <option value="Paramedical">Paramedical</option>
                              </select>
                              <select
                                value={editedLead.company || lead.company || ''}
                                onChange={(e) => setEditedLead(prev => ({ ...prev, company: e.target.value }))}
                                className="text-xs font-medium text-indigo-600 bg-white border border-gray-300 rounded px-2 py-1 w-full"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <option value="">Select Company</option>
                                <option value="DMHCA">🏥 DMHCA</option>
                                <option value="IBMP">🎓 IBMP</option>
                              </select>
                            </>
                          ) : (
                            <>
                              <p className="text-sm text-gray-600">{lead.country}</p>
                              <p className="text-sm text-gray-500">{lead.qualification}</p>
                              <p className="text-xs text-gray-400">{lead.course}</p>
                              {lead.company && (
                                <p className="text-xs font-medium text-indigo-600">
                                  {lead.company === 'DMHCA' ? '🏥 DMHCA' : '🎓 IBMP'}
                                </p>
                              )}
                            </>
                          )}
                        </div>

                        {/* Assignment & Date Column */}
                        <div className="space-y-1">
                          {editingLead === lead.id ? (
                            <>
                              <select
                                value={editedLead.assignedTo || lead.assignedTo}
                                onChange={(e) => setEditedLead(prev => ({ ...prev, assignedTo: e.target.value }))}
                                className="text-sm text-gray-600 bg-white border border-gray-300 rounded px-2 py-1 w-full"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <option value="">Unassigned</option>
                                {users.map(user => (
                                  <option key={user.id} value={user.email}>{user.name}</option>
                                ))}
                              </select>
                              <select
                                value={editedLead.status || lead.status}
                                onChange={(e) => setEditedLead(prev => ({ ...prev, status: e.target.value }))}
                                className="text-sm text-gray-600 bg-white border border-gray-300 rounded px-2 py-1 w-full"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {STATUS_OPTIONS.map(status => (
                                  <option key={status} value={status}>
                                    {status === 'Hot' && '🔥 '}
                                    {status === 'Warm' && '🌡️ '}
                                    {status === 'Follow Up' && '📞 '}
                                    {status === 'Not Interested' && '❌ '}
                                    {status === 'Enrolled' && '✅ '}
                                    {status === 'Fresh' && '🆕 '}
                                    {status === 'Junk' && '🗑️ '}
                                    {status}
                                  </option>
                                ))}
                              </select>
                              <input
                                type="datetime-local"
                                value={(() => {
                                  const followUpDate = editedLead.followUp || lead.followUp;
                                  if (!followUpDate) return '';
                                  const date = new Date(followUpDate);
                                  if (isNaN(date.getTime())) return '';
                                  const year = date.getFullYear();
                                  const month = String(date.getMonth() + 1).padStart(2, '0');
                                  const day = String(date.getDate()).padStart(2, '0');
                                  const hours = String(date.getHours()).padStart(2, '0');
                                  const minutes = String(date.getMinutes()).padStart(2, '0');
                                  return `${year}-${month}-${day}T${hours}:${minutes}`;
                                })()}
                                onChange={(e) => setEditedLead(prev => ({ ...prev, followUp: e.target.value }))}
                                className="text-xs text-gray-500 bg-white border border-gray-300 rounded px-2 py-1 w-full"
                                onClick={(e) => e.stopPropagation()}
                                placeholder="Follow-up date"
                              />
                            </>
                          ) : (
                            <>
                              <p className="text-sm text-gray-600 font-medium">{lead.assignedTo}</p>
                              <div className="flex items-center space-x-1">
                                <span 
                                  className={`inline-block w-2 h-2 rounded-full ${STATUS_COLORS[lead.status as keyof typeof STATUS_COLORS] || 'bg-gray-300'}`}
                                ></span>
                                <p className="text-sm text-gray-600">{lead.status}</p>
                              </div>
                              {lead.followUp && (
                                <p className="text-xs text-gray-500">
                                  Follow: {new Date(lead.followUp).toLocaleDateString()}
                                </p>
                              )}
                            </>
                          )}
                          <p className="text-xs text-gray-500">{new Date(lead.createdAt).toLocaleDateString()}</p>
                          <p className="text-xs text-gray-400">{lead.source}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex items-center space-x-2 ml-4">
                      {editingLead === lead.id ? (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSaveLead();
                            }}
                            className="text-green-600 hover:text-green-800 p-1"
                            title="Save changes"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCancelEdit();
                            }}
                            className="text-gray-500 hover:text-gray-700 p-1"
                            title="Cancel editing"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditLead(lead);
                            }}
                            className="text-blue-600 hover:text-blue-800 p-1"
                            title="Edit lead"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleIndividualDelete(lead.id);
                            }}
                            className="text-red-600 hover:text-red-800 p-1"
                            title="Delete lead"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          {isManager() && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTransferLead(lead.id);
                              }}
                              className="text-purple-600 hover:text-purple-800 p-1"
                              title="Transfer lead"
                            >
                              <ArrowUpDown className="w-4 h-4" />
                            </button>
                          )}
                          <ArrowRight className="w-4 h-4 text-gray-400" />
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls - Bottom (Simplified) */}
            {totalPages > 1 && (
              <div className="border-t border-gray-200 px-4 py-3 bg-gray-50 rounded-b-xl">
                <div className="flex items-center justify-center space-x-4">
                  {/* Simple Navigation */}
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className={`px-3 py-1 rounded-lg text-sm font-medium ${
                      currentPage === 1
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                    }`}
                  >
                    ← Previous
                  </button>

                  <span className="text-sm text-gray-600 font-medium">
                    Page {currentPage} of {totalPages}
                  </span>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1 rounded-lg text-sm font-medium ${
                      currentPage === totalPages
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                    }`}
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Detail Panel - Compact size for better usability */}
        {showDetailPanel && selectedLeadId && (
          <div className="w-1/3 bg-white rounded-xl shadow-lg border border-gray-200 sticky top-1 mb-6 overflow-y-auto" style={{height: 'calc(80vh - 2rem)', maxHeight: 'calc(80vh - 2rem)'}}>
            {(() => {
              const selectedLead = leads.find((l: Lead) => l.id === selectedLeadId);
              
              console.log(`🎯 Lead details render - Lead ID: ${selectedLeadId}`);
              console.log(`🎯 Found selectedLead:`, !!selectedLead);
              console.log(`🎯 Selected lead notes:`, selectedLead?.notes?.length || 0);
              console.log(`🎯 Last update time:`, lastUpdateTime?.getTime());
              
              if (!selectedLead) return null;
              
              return (
                <div>
                  {/* Enhanced Detail Header - Sticky Panel */}
                  <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex items-center justify-between sticky top-0 z-10">
                    <div className="flex items-center space-x-3">
                      <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">Lead Details</h3>
                        <p className="text-blue-100 text-sm">ID: #{selectedLead.id} • Always Visible</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowDetailPanel(false)}
                      className="text-blue-100 hover:text-white transition-colors p-1 rounded-lg hover:bg-white hover:bg-opacity-20"
                      title="Close Detail Panel"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Lead Information */}
                  <div className="p-4 space-y-4">
                    {/* Primary Contact Info */}
                    <div className="bg-gray-50 rounded-lg p-3">
                      <h4 className="font-semibold text-gray-900 text-base mb-2 flex items-center">
                        <User className="w-4 h-4 mr-2 text-blue-600" />
                        Contact Information
                      </h4>
                      <div className="space-y-2">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                          {editingLead === selectedLead.id ? (
                            <input
                              type="text"
                              value={editedLead.fullName || selectedLead.fullName}
                              onChange={(e) => setEditedLead(prev => ({ ...prev, fullName: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          ) : (
                            <div className="flex items-center justify-between">
                              <span className="text-gray-900 font-medium">{selectedLead.fullName}</span>
                              <button
                                onClick={() => handleEditLead(selectedLead)}
                                className="text-blue-600 hover:text-blue-800 p-1"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            {editingLead === selectedLead.id ? (
                              <input
                                type="email"
                                value={editedLead.email || selectedLead.email}
                                onChange={(e) => setEditedLead(prev => ({ ...prev, email: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            ) : (
                              <div className="flex items-center space-x-2 text-gray-700">
                                <Mail className="w-4 h-4 text-gray-400" />
                                <span>{selectedLead.email}</span>
                              </div>
                            )}
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                            {editingLead === selectedLead.id ? (
                              <input
                                type="tel"
                                value={editedLead.phone || selectedLead.phone}
                                onChange={(e) => setEditedLead(prev => ({ ...prev, phone: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            ) : (
                              <div className="flex items-center space-x-2 text-gray-700">
                                <Phone className="w-4 h-4 text-gray-400" />
                                <span>{selectedLead.phone}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Academic Details */}
                    <div className="bg-gray-50 rounded-lg p-3">
                      <h4 className="font-semibold text-gray-900 text-base mb-2 flex items-center">
                        <Calendar className="w-4 h-4 mr-2 text-green-600" />
                        Academic Information
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                          {editingLead === selectedLead.id ? (
                            <select
                              value={editedLead.country || selectedLead.country}
                              onChange={(e) => {
                                const selectedCountryName = e.target.value;
                                const selectedCountry = countryOptions.find(c => c.name === selectedCountryName);
                                const phoneCode = selectedCountry?.phoneCode || '';
                                
                                setEditedLead(prev => ({ 
                                  ...prev, 
                                  country: selectedCountryName,
                                  phone: phoneCode
                                }));
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              {countryOptions.map(country => (
                                <option key={country.code} value={country.name}>
                                  {country.name} ({country.phoneCode})
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-gray-700">{selectedLead.country}</span>
                          )}
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
                          {editingLead === selectedLead.id ? (
                            <input
                              type="text"
                              value={editedLead.branch || selectedLead.branch}
                              onChange={(e) => setEditedLead(prev => ({ ...prev, branch: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          ) : (
                            <span className="text-gray-700">{selectedLead.branch}</span>
                          )}
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Qualification</label>
                          {editingLead === selectedLead.id ? (
                            <select
                              value={editedLead.qualification || selectedLead.qualification}
                              onChange={(e) => setEditedLead(prev => ({ ...prev, qualification: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="">Select Qualification</option>
                              {qualificationOptions.map(qualification => (
                                <option key={qualification} value={qualification}>
                                  {qualification}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-gray-700">{selectedLead.qualification}</span>
                          )}
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
                          {editingLead === selectedLead.id ? (
                            <select
                              value={editedLead.course || selectedLead.course}
                              onChange={(e) => setEditedLead(prev => ({ ...prev, course: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="">Select Course</option>
                              <optgroup label="Fellowship Courses">
                                {(courseOptions.fellowship || []).map((course: string) => (
                                  <option key={`fellowship-${course}`} value={course}>{course}</option>
                                ))}
                              </optgroup>
                              <optgroup label="PG Diploma Courses">
                                {(courseOptions.pgDiploma || []).map((course: string) => (
                                  <option key={`pgdiploma-${course}`} value={course}>{course}</option>
                                ))}
                              </optgroup>
                              {/* No fallback to database values - always use proper course options */}
                            </select>
                          ) : (
                            <span className="text-gray-700">{selectedLead.course}</span>
                          )}
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                          {editingLead === selectedLead.id ? (
                            <select
                              value={editedLead.company || selectedLead.company || ''}
                              onChange={(e) => setEditedLead(prev => ({ ...prev, company: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="">Select Company</option>
                              <option value="DMHCA">🏥 DMHCA</option>
                              <option value="IBMP">🎓 IBMP</option>
                            </select>
                          ) : (
                            <span className="text-gray-700">
                              {selectedLead.company ? (
                                selectedLead.company === 'DMHCA' ? '🏥 DMHCA' : '🎓 IBMP'
                              ) : (
                                <span className="text-gray-400 italic">Not specified</span>
                              )}
                            </span>
                          )}
                        </div>
                        
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                          {editingLead === selectedLead.id ? (
                            <select
                              value={editedLead.source || selectedLead.source}
                              onChange={(e) => setEditedLead(prev => ({ ...prev, source: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="Website">Website</option>
                              <option value="Facebook Ads">Facebook Ads</option>
                              <option value="Google Ads">Google Ads</option>
                              <option value="Referral">Referral</option>
                              <option value="Walk-in">Walk-in</option>
                              <option value="Phone Call">Phone Call</option>
                            </select>
                          ) : (
                            <span className="text-gray-700">{selectedLead.source}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Status & Assignment Management */}
                    <div className="bg-gray-50 rounded-lg p-3">
                      <h4 className="font-semibold text-gray-900 text-base mb-2 flex items-center">
                        <Activity className="w-4 h-4 mr-2 text-purple-600" />
                        Status & Assignment
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                          <select
                            value={editedLead.status || selectedLead.status}
                            onChange={(e) => {
                              const newStatus = e.target.value;
                              setEditedLead(prev => ({ ...prev, status: newStatus }));
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            {(statusOptions || []).map(status => (
                              <option key={status} value={status}>
                                {status === 'Hot' && '🔥 '}
                                {status === 'Warm' && '🌡️ '}
                                {status === 'Follow Up' && '📞 '}
                                {status === 'Not Interested' && '❌ '}
                                {status === 'Enrolled' && '✅ '}
                                {status === 'Fresh' && '🆕 '}
                                {status === 'Junk' && '🗑️ '}
                                {status}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Fees Field - Only show when status is Enrolled */}
                        {(editedLead.status || selectedLead.status) === 'Enrolled' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              💰 Course Fees ({getCurrencyByCompany(editedLead.company || selectedLead.company) === 'USD' ? '$' : '₹'})
                            </label>
                            <input
                              type="number"
                              value={editedLead.fees || selectedLead.fees || ''}
                              onChange={(e) => {
                                const feesValue = e.target.value ? parseFloat(e.target.value) : undefined;
                                const currency = getCurrencyByCompany(editedLead.company || selectedLead.company);
                                setEditedLead(prev => ({ 
                                  ...prev, 
                                  fees: feesValue,
                                  actualRevenue: feesValue,
                                  currency: currency
                                }));
                              }}
                              placeholder={`Enter course fees amount in ${getCurrencyByCompany(editedLead.company || selectedLead.company)}`}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                              min="0"
                              step={getCurrencyByCompany(editedLead.company || selectedLead.company) === 'USD' ? '1' : '100'}
                            />
                            <div className="mt-1 flex justify-between text-xs text-gray-500">
                              <span>Amount paid for course enrollment in {getCurrencyByCompany(editedLead.company || selectedLead.company)}</span>
                              <span className="text-green-600 font-medium">
                                Revenue: {formatCurrency(editedLead.fees || selectedLead.fees || 0, getCurrencyByCompany(editedLead.company || selectedLead.company))}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Estimated Value Field - Show for Warm and Hot leads */}
                        {((editedLead.status || selectedLead.status) === 'Hot' || (editedLead.status || selectedLead.status) === 'Warm') && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              📈 Estimated Value ({getCurrencyByCompany(editedLead.company || selectedLead.company) === 'USD' ? '$' : '₹'})
                            </label>
                            <input
                              type="number"
                              value={editedLead.estimatedValue || selectedLead.estimatedValue || ''}
                              onChange={(e) => {
                                const estimatedValue = e.target.value ? parseFloat(e.target.value) : undefined;
                                setEditedLead(prev => ({ ...prev, estimatedValue }));
                              }}
                              placeholder={`Estimated course value in ${getCurrencyByCompany(editedLead.company || selectedLead.company)}`}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                              min="0"
                              step={getCurrencyByCompany(editedLead.company || selectedLead.company) === 'USD' ? '1' : '100'}
                            />
                            <div className="mt-1 flex justify-between text-xs text-gray-500">
                              <span>Potential revenue from this lead</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const defaultValue = getDefaultCoursePrice(editedLead.company || selectedLead.company, editedLead.course || selectedLead.course);
                                  setEditedLead(prev => ({ ...prev, estimatedValue: defaultValue }));
                                }}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                Use default for {editedLead.course || selectedLead.course}
                              </button>
                            </div>
                          </div>
                        )}

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Assigned to</label>
                          {editingLead === selectedLead.id ? (
                            <select
                              value={editedLead.assignedTo || selectedLead.assignedTo}
                              onChange={(e) => setEditedLead(prev => ({ ...prev, assignedTo: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="">Unassigned</option>
                              {assignableUsers.map(user => (
                                <option key={user.id} value={user.username || user.name || user.email}>
                                  {user.name} ({user.role})
                                </option>
                              ))}
                            </select>
                          ) : (
                            <div className="flex items-center justify-between">
                              <span className="text-gray-700 font-medium">{selectedLead.assignedTo}</span>
                              {isManager() && (
                                <button
                                  onClick={() => handleTransferLead(selectedLead.id)}
                                  className="text-blue-600 hover:text-blue-800 text-sm flex items-center space-x-1"
                                >
                                  <UserCheck className="w-4 h-4" />
                                  <span>Transfer</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Follow Up Date</label>
                          <input
                            type="datetime-local"
                            value={(() => {
                              const followUpDate = editedLead.followUp || selectedLead.followUp;
                              if (!followUpDate) return '';
                              
                              // Convert date to datetime-local format (yyyy-MM-ddTHH:mm)
                              const date = new Date(followUpDate);
                              if (isNaN(date.getTime())) return '';
                              
                              // Format to datetime-local format
                              const year = date.getFullYear();
                              const month = String(date.getMonth() + 1).padStart(2, '0');
                              const day = String(date.getDate()).padStart(2, '0');
                              const hours = String(date.getHours()).padStart(2, '0');
                              const minutes = String(date.getMinutes()).padStart(2, '0');
                              
                              return `${year}-${month}-${day}T${hours}:${minutes}`;
                            })()}
                            onChange={(e) => {
                              const newFollowUp = e.target.value;
                              setEditedLead(prev => ({ ...prev, followUp: newFollowUp }));
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            {selectedLead.followUp && new Date(selectedLead.followUp) > new Date() 
                              ? `⏰ Reminder set for ${new Date(selectedLead.followUp).toLocaleString()}`
                              : selectedLead.followUp && new Date(selectedLead.followUp) <= new Date()
                              ? '🔔 Follow-up is overdue!'
                              : 'No follow-up scheduled'
                            }
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Edit Actions */}
                    {editingLead === selectedLead.id && (
                      <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                        <button
                          onClick={handleCancelEdit}
                          className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveLead}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>Save Changes</span>
                        </button>
                      </div>
                    )}



                    {/* Notes & Activities Section */}
                    <div className="bg-gray-50 rounded-lg p-3" key={`notes-${selectedLead.id}-${lastUpdateTime?.getTime()}`}>
                      {(() => {
                        // Combine notes and activities
                        const notes = selectedLead.notes || [];
                        const activities = leadActivities[selectedLead.id] || [];
                        
                        // Transform activities to match note structure for display
                        const activityItems: CombinedItem[] = activities.map(activity => ({
                          id: `activity-${activity.id}`,
                          content: activity.description,
                          timestamp: activity.timestamp || activity.created_at,
                          author: activity.performed_by,
                          type: 'activity' as const,
                          activityType: activity.activity_type,
                          oldValue: activity.old_value,
                          newValue: activity.new_value
                        }));
                        
                        // Transform notes to include type
                        const noteItems: CombinedItem[] = notes.map((note: any) => ({
                          ...note,
                          type: 'note' as const
                        }));
                        
                        // Combine and sort by timestamp (newest first)
                        const allItems: CombinedItem[] = [...noteItems, ...activityItems].sort((a, b) => 
                          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                        );
                        
                        const totalCount = allItems.length;
                        const notesCount = noteItems.length;
                        const activitiesCount = activityItems.length;
                        
                        return (
                          <>
                            <h4 className="font-semibold text-gray-900 text-base mb-2 flex items-center">
                              <MessageSquare className="w-4 h-4 mr-2 text-orange-600" />
                              Notes & Activities ({totalCount})
                              <span className="ml-2 text-xs text-gray-500 font-normal">
                                ({notesCount} notes, {activitiesCount} activities)
                              </span>
                            </h4>
                            <div className="space-y-2 max-h-40 overflow-y-auto">
                              {allItems.length > 0 ? allItems.map((item) => (
                                <div 
                                  key={item.id} 
                                  className={`p-2 rounded border shadow-sm ${
                                    item.type === 'note' 
                                      ? 'bg-white border-gray-200' 
                                      : item.activityType === 'transfer' || item.activityType === 'assignment_change'
                                      ? 'bg-purple-50 border-purple-200'
                                      : item.activityType === 'status_change'
                                      ? 'bg-blue-50 border-blue-200'
                                      : item.activityType === 'lead_created'
                                      ? 'bg-green-50 border-green-200'
                                      : 'bg-yellow-50 border-yellow-200'
                                  }`}
                                >
                                  <div className="flex items-start justify-between mb-1">
                                    <div className="flex items-center space-x-1">
                                      {item.type === 'note' ? (
                                        <MessageSquare className="w-4 h-4 text-gray-500 mt-0.5" />
                                      ) : item.activityType === 'transfer' || item.activityType === 'assignment_change' ? (
                                        <ArrowUpDown className="w-4 h-4 text-purple-500 mt-0.5" />
                                      ) : item.activityType === 'status_change' ? (
                                        <Edit3 className="w-4 h-4 text-blue-500 mt-0.5" />
                                      ) : item.activityType === 'lead_created' ? (
                                        <Plus className="w-4 h-4 text-green-500 mt-0.5" />
                                      ) : (
                                        <Clock className="w-4 h-4 text-yellow-500 mt-0.5" />
                                      )}
                                      <span className="text-xs font-medium text-gray-600 capitalize">
                                        {item.type === 'note' ? 'Note' : item.activityType?.replace('_', ' ')}
                                      </span>
                                    </div>
                                    <span className="text-xs text-gray-500">
                                      {new Date(item.timestamp).toLocaleString()}
                                    </span>
                                  </div>
                                  
                                  <p className="text-xs text-gray-900 mb-1">{item.content}</p>
                                  
                                  {/* Show old/new values for activities if available */}
                                  {item.type === 'activity' && (item.oldValue || item.newValue) && (
                                    <div className="text-xs text-gray-600 bg-gray-100 rounded p-1 mt-1">
                                      {item.oldValue && (
                                        <div><span className="font-medium">From:</span> {item.oldValue}</div>
                                      )}
                                      {item.newValue && (
                                        <div><span className="font-medium">To:</span> {item.newValue}</div>
                                      )}
                                    </div>
                                  )}
                                  
                                  <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                                    <span className="font-medium">{item.author}</span>
                                    <span className={`px-1 py-0.5 rounded text-xs ${
                                      item.type === 'note' 
                                        ? 'bg-gray-100 text-gray-600' 
                                        : 'bg-blue-100 text-blue-600'
                                    }`}>
                                      {item.type === 'note' ? 'Note' : 'Activity'}
                                    </span>
                                  </div>
                                </div>
                              )) : (
                                <p className="text-gray-500 text-sm italic">No notes or activities yet</p>
                              )}
                            </div>
                          </>
                        );
                      })()}
                    </div>
                    
                    {/* Add Note */}
                    <div className="mt-2">
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          placeholder="Add a note..."
                          value={newNote[selectedLead.id] || ''}
                          onChange={(e) => setNewNote(prev => ({
                            ...prev,
                            [selectedLead.id]: e.target.value
                          }))}
                          className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleAddNote(selectedLead.id);
                            }
                          }}
                        />
                        <button
                          onClick={() => handleAddNote(selectedLead.id)}
                          className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm flex items-center space-x-1"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Transfer Lead</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Transfer to Counselor
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="">Select Counselor</option>
                  {assignableUsers.map((user) => (
                    <option key={user.id} value={user.username || user.name || user.email}>
                      {user.name} ({user.role})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Transfer Reason (Optional)
                </label>
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter reason for transfer..."
                />
              </div>
            </div>
            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowTransferModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Handle transfer logic here
                  // Transfer lead initiated
                  setShowTransferModal(false);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Transfer Lead
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Bulk Transfer Modal */}
      {showBulkTransferModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg mx-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <ArrowUpDown className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Bulk Transfer
                  </h3>
                  <p className="text-sm text-gray-500">
                    Transfer {selectedLeads.length} lead{selectedLeads.length > 1 ? 's' : ''} to another counselor
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowBulkTransferModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Selected leads summary */}
            <div className="mb-6 bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">Selected Leads</h4>
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                  {selectedLeads.length} leads
                </span>
              </div>
              <div className="max-h-32 overflow-y-auto space-y-2">
                {selectedLeads.map(leadId => {
                  const lead = leads.find((l: Lead) => l.id === leadId);
                  return lead ? (
                    <div key={leadId} className="flex justify-between items-center bg-white p-2 rounded border">
                      <div>
                        <span className="font-medium text-sm text-gray-900">{lead.fullName}</span>
                        <p className="text-xs text-gray-500">{lead.email}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Currently assigned to:</p>
                        <span className="text-sm font-medium text-gray-700">{lead.assignedTo}</span>
                      </div>
                    </div>
                  ) : null;
                })}
              </div>
            </div>

            {/* Transfer Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="flex items-center space-x-1">
                    <UserCheck className="w-4 h-4" />
                    <span>Transfer to Counselor</span>
                    <span className="text-red-500">*</span>
                  </span>
                </label>
                <select 
                  value={bulkTransferCounselor}
                  onChange={(e) => setBulkTransferCounselor(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Counselor</option>
                  {assignableUsers.map((user) => (
                    <option key={user.id} value={user.username || user.name || user.email}>
                      {user.name} ({user.role})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="flex items-center space-x-1">
                    <MessageSquare className="w-4 h-4" />
                    <span>Transfer Reason</span>
                    <span className="text-gray-400">(Optional)</span>
                  </span>
                </label>
                <textarea
                  value={bulkTransferReason}
                  onChange={(e) => setBulkTransferReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter reason for bulk transfer (e.g., workload redistribution, specialization, etc.)"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowBulkTransferModal(false);
                  setBulkTransferCounselor('');
                  setBulkTransferReason('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkTransfer}
                disabled={!bulkTransferCounselor}
                className={`px-6 py-2 rounded-lg font-medium flex items-center space-x-2 ${
                  bulkTransferCounselor 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <ArrowUpDown className="w-4 h-4" />
                <span>Transfer {selectedLeads.length} Lead{selectedLeads.length > 1 ? 's' : ''}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Company Change Modal */}
      {showBulkCompanyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg mx-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <Building className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Change Company
                  </h3>
                  <p className="text-sm text-gray-500">
                    Change company for {selectedLeads.length} lead{selectedLeads.length > 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowBulkCompanyModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <div className="space-y-4">
              {/* Company Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="flex items-center space-x-1">
                    <Building className="w-4 h-4" />
                    <span>Select Company</span>
                    <span className="text-red-500">*</span>
                  </span>
                </label>
                <select
                  value={bulkCompanyTarget}
                  onChange={(e) => setBulkCompanyTarget(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="">Select Company...</option>
                  <option value="DMHCA">DMHCA</option>
                  <option value="IBMP">IBMP</option>
                </select>
              </div>

              {/* Preview */}
              {bulkCompanyTarget && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                  <p className="text-sm text-purple-800">
                    <strong>{selectedLeads.length}</strong> lead{selectedLeads.length > 1 ? 's' : ''} will be changed to <strong>{bulkCompanyTarget}</strong> company
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowBulkCompanyModal(false);
                  setBulkCompanyTarget('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkCompanyChange}
                disabled={!bulkCompanyTarget}
                className={`px-6 py-2 rounded-lg font-medium flex items-center space-x-2 ${
                  bulkCompanyTarget 
                    ? 'bg-purple-600 text-white hover:bg-purple-700' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <Building className="w-4 h-4" />
                <span>Change {selectedLeads.length} Lead{selectedLeads.length > 1 ? 's' : ''}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Lead Modal */}
      {showAddLeadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Add New Lead</h2>
                <p className="text-sm text-gray-600 mt-1">Enter lead information to add to your CRM</p>
              </div>
              <button
                onClick={handleCancelAddLead}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newLead.fullName || ''}
                    onChange={(e) => setNewLead({...newLead, fullName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter full name"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={newLead.email || ''}
                    onChange={(e) => setNewLead({...newLead, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter email address"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={newLead.phone || ''}
                    onChange={(e) => setNewLead({...newLead, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter phone number"
                  />
                </div>

                {/* Country */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                  <select
                    value={newLead.country || ''}
                    onChange={(e) => {
                      const selectedCountryName = e.target.value;
                      const selectedCountry = countryOptions.find(c => c.name === selectedCountryName);
                      const phoneCode = selectedCountry?.phoneCode || '';
                      
                      setNewLead({
                        ...newLead, 
                        country: selectedCountryName,
                        phone: phoneCode
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Country</option>
                    {countryOptions.map(country => (
                      <option key={country.code} value={country.name}>
                        {country.name} ({country.phoneCode})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Branch */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Branch</label>
                  <select
                    value={newLead.branch || ''}
                    onChange={(e) => setNewLead({...newLead, branch: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Branch</option>
                    <option value="Delhi">Delhi</option>
                    <option value="Hyderabad">Hyderabad</option>
                    <option value="Kashmir">Kashmir</option>
                    
                    <option value="Online">Online</option>
                  </select>
                </div>

                {/* Qualification */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Qualification</label>
                  <select
                    value={newLead.qualification || ''}
                    onChange={(e) => setNewLead({...newLead, qualification: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Qualification</option>
                    {qualificationOptions.map(qualification => (
                      <option key={qualification} value={qualification}>
                        {qualification}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Source */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Lead Source</label>
                  <select
                    value={newLead.source || ''}
                    onChange={(e) => setNewLead({...newLead, source: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Source</option>
                    <option value="Website">Website</option>
                    <option value="Facebook Ads">Facebook Ads</option>
                    <option value="Google Ads">Google Ads</option>
                    <option value="Referral">Referral</option>
                    <option value="Walk-in">Walk-in</option>
                    <option value="Phone Call">Phone Call</option>
                    <option value="Email">Email</option>
                    <option value="Manual Entry">Manual Entry</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Course */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Course Interest</label>
                  <select
                    value={newLead.course || ''}
                    onChange={(e) => setNewLead({...newLead, course: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Course</option>
                    {courseOptions.fellowship && courseOptions.fellowship.length > 0 && (
                      <optgroup label="Fellowship Courses">
                        {courseOptions.fellowship.map(course => (
                          <option key={course} value={course}>{course}</option>
                        ))}
                      </optgroup>
                    )}
                    {courseOptions.pgDiploma && courseOptions.pgDiploma.length > 0 && (
                      <optgroup label="PG Diploma Courses">
                        {courseOptions.pgDiploma.map(course => (
                          <option key={course} value={course}>{course}</option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={newLead.status || statusOptions[0] || 'fresh'}
                    onChange={(e) => setNewLead({...newLead, status: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {(statusOptions || []).map(status => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Assigned To */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Assign To</label>
                  <select
                    value={newLead.assignedTo || ''}
                    onChange={(e) => setNewLead({...newLead, assignedTo: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Auto-assign to me</option>
                    {assignableUsers.map(user => (
                      <option key={user.id} value={user.username}>
                        {user.name} ({user.role})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Company */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newLead.company || ''}
                    onChange={(e) => setNewLead({...newLead, company: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Company</option>
                    <option value="DMHCA">🏥 DMHCA</option>
                    <option value="IBMP">🎓 IBMP</option>
                  </select>
                </div>

                {/* Follow-up Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Follow-up Date</label>
                  <input
                    type="date"
                    value={newLead.followUp || ''}
                    onChange={(e) => setNewLead({...newLead, followUp: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end space-x-3">
              <button
                onClick={handleCancelAddLead}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNewLead}
                disabled={loading}
                className={`px-6 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                  loading 
                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Adding Lead...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Add Lead</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* No leads found */}
      {filteredLeads.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200 mt-6">
          <Target className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No leads found</h3>
          <p className="text-gray-500 mb-4">
            Try adjusting your search criteria or filters to find more leads.
          </p>
          <button 
            onClick={handleAddLead}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Your First Lead
          </button>
        </div>
      )}

      {/* Team Member Modal */}
      {showTeamMemberModal && selectedTeamMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {selectedTeamMember.name}'s Leads
                  </h2>
                  <p className="text-sm text-gray-600">
                    {selectedTeamMember.role} • {teamMemberLeads.length} leads
                    {teamMemberLeads.length > 5 && (
                      <span className="text-blue-600 ml-2">• Scroll to see all</span>
                    )}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowTeamMemberModal(false);
                  setSelectedTeamMember(null);
                  setTeamMemberLeads([]);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content - Enhanced scrolling */}
            <div className="flex-1 overflow-hidden relative">
              {loadingTeamMemberLeads ? (
                <div className="flex items-center justify-center h-full">
                  <div className="flex flex-col items-center space-y-4">
                    <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
                    <p className="text-gray-600">Loading {selectedTeamMember.name}'s leads...</p>
                  </div>
                </div>
              ) : teamMemberLeads.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No leads found</h3>
                    <p className="text-gray-500">
                      {selectedTeamMember.name} doesn't have any leads assigned yet.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  <div className="p-6 space-y-4">{/* Scrollable leads list */}
                    {teamMemberLeads.map((lead, index) => (
                      <div 
                        key={lead.id} 
                        className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow cursor-pointer hover:bg-blue-50"
                        onClick={() => {
                          // Open lead details
                          setSelectedLeadId(lead.id);
                          setShowDetailPanel(true);
                          setShowTeamMemberModal(false);
                          // Load notes and activities for the lead
                          loadNotesForLead(lead.id);
                          loadActivitiesForLead(lead.id);
                        }}
                        title="Click to view lead details"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <span className="text-sm text-gray-500 font-mono">#{index + 1}</span>
                              <h4 className="text-lg font-semibold text-gray-900">{lead.fullName}</h4>
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                lead.status === 'Enrolled' ? 'bg-green-100 text-green-800' :
                                lead.status === 'Hot' ? 'bg-red-100 text-red-800' :
                                lead.status === 'Warm' ? 'bg-orange-100 text-orange-800' :
                                lead.status === 'Follow Up' ? 'bg-yellow-100 text-yellow-800' :
                                lead.status === 'Fresh' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {lead.status}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                              <div>
                                <p className="text-xs text-gray-500">Email</p>
                                <p className="text-sm text-gray-900">{lead.email || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Phone</p>
                                <p className="text-sm text-gray-900">{lead.phone || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Course</p>
                                <p className="text-sm text-gray-900">{lead.course}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Source</p>
                                <p className="text-sm text-gray-900 capitalize">{lead.source}</p>
                              </div>
                            </div>
                            
                            {/* Revenue Information */}
                            <div className="mb-3">
                              {lead.status === 'Enrolled' && lead.actualRevenue ? (
                                <div className="flex items-center space-x-2">
                                  <p className="text-xs text-green-600 font-medium">Revenue:</p>
                                  <p className="text-sm text-green-800 font-bold">
                                    {formatCurrency(lead.actualRevenue, getCurrencyByCompany(lead.company))}
                                  </p>
                                  <span className="text-xs text-gray-500">({lead.company})</span>
                                </div>
                              ) : (lead.status === 'Hot' || lead.status === 'Warm') && lead.estimatedValue ? (
                                <div className="flex items-center space-x-2">
                                  <p className="text-xs text-orange-600 font-medium">Estimated Value:</p>
                                  <p className="text-sm text-orange-800 font-bold">
                                    {formatCurrency(lead.estimatedValue, getCurrencyByCompany(lead.company))}
                                  </p>
                                  <span className="text-xs text-gray-500">({lead.company})</span>
                                </div>
                              ) : (
                                <div className="flex items-center space-x-2">
                                  <p className="text-xs text-gray-500">Potential Value:</p>
                                  <p className="text-sm text-gray-700">
                                    {formatCurrency(getDefaultCoursePrice(lead.company, lead.course), getCurrencyByCompany(lead.company))}
                                  </p>
                                  <span className="text-xs text-gray-500">({lead.company})</span>
                                </div>
                              )}
                            </div>
                            
                            {lead.followUp && (
                              <div className="mb-3">
                                <p className="text-xs text-gray-500">Follow-up Date</p>
                                <p className="text-sm text-gray-900">{new Date(lead.followUp).toLocaleDateString()}</p>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex flex-col space-y-2 ml-4">
                            <button
                              onClick={() => {
                                // Open edit modal for this specific lead
                                setSelectedLeadId(lead.id);
                                setShowDetailPanel(true);
                                // Close the team member modal to show the edit panel
                                setShowTeamMemberModal(false);
                                // Load notes and activities for the lead
                                loadNotesForLead(lead.id);
                                loadActivitiesForLead(lead.id);
                              }}
                              className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                            >
                              <Edit2 className="w-3 h-3 inline mr-1" />
                              Edit
                            </button>
                            
                            <select
                              className="text-xs px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              onChange={(e) => {
                                if (e.target.value) {
                                  handleTransferTeamMemberLead(lead.id, e.target.value);
                                  e.target.value = ''; // Reset selection
                                }
                              }}
                              defaultValue=""
                            >
                              <option value="">Transfer to...</option>
                              {assignableUsers
                                .filter(user => user.id !== selectedTeamMember.id)
                                .map(user => (
                                  <option key={user.id} value={user.id}>
                                    {user.name}
                                  </option>
                                ))
                              }
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Overdue Follow-up Popup Notifications - DISABLED */}
      {false && showOverduePopup && popupNotifications.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 transform animate-pulse">
            <div className="bg-red-500 text-white px-6 py-4 rounded-t-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Bell className="w-6 h-6 mr-3 animate-bounce" />
                  <h3 className="text-lg font-bold">⚠️ Urgent: Overdue Follow-ups!</h3>
                </div>
                <button
                  onClick={() => {
                    setShowOverduePopup(false);
                    setPopupNotifications([]);
                  }}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="text-center mb-4">
                <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-2" />
                <p className="text-gray-700 font-medium">
                  You have {overdueLeads.length} overdue follow-up{overdueLeads.length !== 1 ? 's' : ''}!
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  These leads require immediate attention
                </p>
              </div>

              <div className="max-h-64 overflow-y-auto space-y-3">
                {overdueLeads.slice(0, 5).map((lead: Lead) => {
                  const daysOverdue = Math.floor((new Date().getTime() - new Date(lead.followUp!).getTime()) / (1000 * 60 * 60 * 24));
                  return (
                    <div key={lead.id} className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{lead.fullName}</h4>
                          <p className="text-sm text-gray-600">{lead.email}</p>
                          <p className="text-xs text-red-600 font-medium mt-1">
                            🔥 {daysOverdue} day{daysOverdue !== 1 ? 's' : ''} overdue
                          </p>
                          <p className="text-xs text-gray-500">
                            Due: {new Date(lead.followUp!).toLocaleDateString()}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedLeadId(lead.id);
                            setShowDetailPanel(true);
                            setShowOverduePopup(false);
                            // Load notes and activities for the lead
                            loadNotesForLead(lead.id);
                            loadActivitiesForLead(lead.id);
                          }}
                          className="ml-3 bg-red-500 text-white px-3 py-1 rounded text-xs hover:bg-red-600 transition-colors"
                        >
                          View Lead
                        </button>
                      </div>
                    </div>
                  );
                })}
                
                {overdueLeads.length > 5 && (
                  <div className="text-center text-sm text-gray-500 mt-3">
                    ... and {overdueLeads.length - 5} more overdue leads
                  </div>
                )}
              </div>

              <div className="mt-6 flex space-x-3">
                <button
                  onClick={() => {
                    // Reset all filters and show search for overdue leads
                    setSearchQuery('');
                    setStatusFilter(['all']);
                    setCountryFilter('all');
                    setSourceFilter('all');
                    setAssignedToFilter(['all']);
                    setQualificationFilter('all');
                    setShowOverdueOnly(true);
                    setShowOverduePopup(false);
                    
                    // Scroll to leads table
                    setTimeout(() => {
                      document.querySelector('.leads-table')?.scrollIntoView({ behavior: 'smooth' });
                    }, 100);
                  }}
                  className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors font-medium"
                >
                  View All Overdue
                </button>
                <button
                  onClick={() => {
                    setShowOverduePopup(false);
                    // Set reminder to show again in 30 minutes
                    setTimeout(() => {
                      if (overdueLeads.length > 0) {
                        setShowOverduePopup(true);
                      }
                    }, 1800000); // 30 minutes
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Remind Later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Notification Permission Request */}
      {typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default' && (
        <div className="fixed bottom-4 right-4 bg-blue-500 text-white p-4 rounded-lg shadow-lg z-40">
          <div className="flex items-center space-x-3">
            <Bell className="w-5 h-5" />
            <div className="flex-1">
              <p className="text-sm font-medium">Enable Desktop Notifications</p>
              <p className="text-xs opacity-90">Get alerts for overdue follow-ups</p>
            </div>
            <button
              onClick={() => {
                Notification.requestPermission().then(permission => {
                  if (permission === 'granted') {
                    new Notification('CRM Notifications Enabled!', {
                      body: 'You\'ll now receive alerts for overdue follow-ups',
                      icon: '/favicon.ico'
                    });
                  }
                });
              }}
              className="bg-white text-blue-500 px-3 py-1 rounded text-xs font-medium hover:bg-gray-100 transition-colors"
            >
              Enable
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadsManagement;
