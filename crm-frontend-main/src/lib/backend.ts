/**
 * CRM Real-Time Backend Configuration
 * Complete backend setup with all real-time functionality
 * This file contains everything needed for the backend implementation
 */

import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';

// ===========================
// 1. ENVIRONMENT CONFIGURATION
// ===========================

interface EnvironmentConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  enableRealTime: boolean;
  enableNotifications: boolean;
  autoRefreshInterval: number;
  debugMode: boolean;
}

interface ApiConfig {
  baseUrl: string;
  backendUrl: string;
  timeout: number;
  headers: Record<string, string>;
}

export const getApiConfig = (): ApiConfig => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  const backendUrl = import.meta.env.VITE_API_BACKEND_URL;
  
  if (!baseUrl || !backendUrl) {
    throw new Error('API configuration missing: VITE_API_BASE_URL and VITE_API_BACKEND_URL must be set in environment variables');
  }
  
  return {
    baseUrl,
    backendUrl,
    timeout: 60000, // Increased to 60 seconds for better reliability
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  };
};

export const getEnvironmentConfig = (): EnvironmentConfig => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase configuration missing: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in environment variables');
  }
  
  return {
    supabaseUrl,
    supabaseAnonKey,
    enableRealTime: import.meta.env.VITE_ENABLE_REAL_TIME !== 'false',
    enableNotifications: import.meta.env.VITE_ENABLE_NOTIFICATIONS !== 'false',
    autoRefreshInterval: 30000,
    debugMode: import.meta.env.VITE_DEBUG_MODE === 'true'
  };
};

// ===========================
// 2. DATABASE TYPES
// ===========================

export interface DatabaseLead {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  email?: string;
  phone?: string;
  source: 'website' | 'social_media' | 'referral' | 'manual' | 'advertisement';
  status: 'hot' | 'followup' | 'warm' | 'not interested' | 'enrolled' | 'fresh' | 'junk';
  score: number;
  notes?: string;
  assigned_to?: string;
  estimatedValue?: number;
}

export interface DatabaseStudent {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  email?: string;
  phone?: string;
  course?: string;
  status: 'enrolled' | 'active' | 'completed' | 'dropped' | 'suspended';
  progress: number;
  notes?: string;
}

export interface DatabaseUser {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  username: string;
  email: string;
  phone?: string;
  office_phone?: string;
  role: 'super_admin' | 'senior_manager' | 'manager' | 'team_leader' | 'counselor';
  department?: string;
  designation?: string;
  location?: string;
  date_of_birth?: string;
  join_date?: string;
  status: 'active' | 'inactive' | 'suspended';
  reports_to?: string;
  profile_image?: string;
  branch?: 'Delhi' | 'Hyderabad' | 'Kashmir';
  company?: 'DMHCA' | 'IBMP';
  assignedTo?: string;
}

export interface DatabaseCommunication {
  id: string;
  created_at: string;
  type: 'email' | 'sms' | 'whatsapp' | 'call' | 'meeting';
  direction: 'inbound' | 'outbound';
  subject?: string;
  content?: string;
  recipient?: string;
  sender?: string;
  status: 'sent' | 'delivered' | 'read' | 'failed' | 'pending';
  lead_id?: string;
  student_id?: string;
}

export interface IntegrationStatus {
  id: string;
  created_at: string;
  updated_at: string;
  integration_name: string;
  status: 'connected' | 'disconnected' | 'error' | 'syncing';
  last_sync?: string;
  configuration: Record<string, any>;
}

export type Database = {
  public: {
    Tables: {
      leads: {
        Row: DatabaseLead;
        Insert: Omit<DatabaseLead, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<DatabaseLead, 'id' | 'created_at'>>;
      };
      students: {
        Row: DatabaseStudent;
        Insert: Omit<DatabaseStudent, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<DatabaseStudent, 'id' | 'created_at'>>;
      };
      communications: {
        Row: DatabaseCommunication;
        Insert: Omit<DatabaseCommunication, 'id' | 'created_at'>;
        Update: Partial<Omit<DatabaseCommunication, 'id' | 'created_at'>>;
      };
      integrations_status: {
        Row: IntegrationStatus;
        Insert: Omit<IntegrationStatus, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<IntegrationStatus, 'id' | 'created_at'>>;
      };
    };
  };
};

// ===========================
// 3. SUPABASE CLIENT SETUP
// ===========================

let supabaseClient: SupabaseClient<any> | null = null;

export const initializeSupabase = (): SupabaseClient<any> => {
  if (supabaseClient) {
    return supabaseClient;
  }

  const config = getEnvironmentConfig();
  
  if (!config.supabaseUrl || !config.supabaseAnonKey) {
    throw new Error('Supabase configuration missing. Please check your environment variables.');
  }

  supabaseClient = createClient<any>(config.supabaseUrl, config.supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  });

  // Supabase client initialized

  return supabaseClient;
};

// DEPRECATED: Frontend should use API endpoints, not direct database access
export const getSupabase = (): SupabaseClient<any> => {
  console.warn('⚠️  DEPRECATED: getSupabase() - Frontend should use getApiClient() for proper API-based communication');
  if (!supabaseClient) {
    return initializeSupabase();
  }
  return supabaseClient;
};

// ===========================
// 4. PRODUCTION API CLIENT (Railway Backend)
// ===========================

class ProductionApiClient {
  private config: ApiConfig;

  constructor() {
    this.config = getApiConfig();
  }

  // Public getter for baseURL - used by direct fetch calls like bulk import
  get baseURL(): string {
    return this.config.backendUrl?.replace(/\/+$/, '') || '';
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    // Normalize backendUrl and endpoint to avoid duplicated segments like `/api/api/...`
    const rawBase = this.config.backendUrl || '';
    // remove trailing slashes from base
    const base = rawBase.replace(/\/+$/, '');
    // ensure endpoint starts with a single '/'
    let ep = endpoint || '';
    if (!ep.startsWith('/')) ep = `/${ep}`;
    // If both base already ends with '/api' and endpoint begins with '/api', drop the leading '/api' from endpoint
    if (base.endsWith('/api') && ep.startsWith('/api')) {
      ep = ep.replace(/^\/api/, '');
    }
    const url = `${base}${ep}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.warn(`⏰ Request timeout for ${endpoint}, aborting...`);
      controller.abort();
    }, 60000); // Increased timeout to 60 seconds

    // Get authentication token from localStorage
    const token = localStorage.getItem('crm_auth_token') || localStorage.getItem('token');
    
    const defaultOptions: RequestInit = {
      headers: {
        ...this.config.headers,
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      signal: controller.signal,
    };

    try {
      // API request initiated
      console.log(`🔄 API Request: ${endpoint}`);
      
      const response = await fetch(url, { ...defaultOptions, ...options });
      clearTimeout(timeoutId);
      
      // API response received
      console.log(`✅ API Response: ${endpoint} - ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ API Error ${response.status}:`, errorText);
        throw new Error(`API Error: ${response.status} - ${response.statusText}`);
      }

      const result = await response.json();
      // API request successful
      return result;
    } catch (error) {
      clearTimeout(timeoutId);
      
      // Handle different types of errors with user-friendly messages
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.warn(`⚠️ Request aborted for ${endpoint}:`, 'Request was cancelled or timed out');
          throw new Error(`Connection timeout. Please check your internet connection and try again.`);
        }
        
        // Network connection errors
        if (error.message.includes('fetch') || error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
          console.error(`🌐 Network error for ${endpoint}:`, error.message);
          throw new Error(`Unable to connect to server. Please check your internet connection or try again later.`);
        }
        
        // CORS errors
        if (error.message.includes('CORS') || error.message.includes('cross-origin')) {
          console.error(`🔒 CORS error for ${endpoint}:`, error.message);
          throw new Error(`Server configuration issue. Please contact support.`);
        }
      }
      
      console.error(`❌ API Request failed for ${endpoint}:`, error);
      
      // Generic error with helpful message
      if (error instanceof Error) {
        throw new Error(`Connection failed: ${error.message}. Please try refreshing the page.`);
      }
      
      throw new Error(`Unknown connection error. Please try again or contact support.`);
    }
  }

  // Health check
  async healthCheck() {
    return this.request('/api/health');
  }

  // Dashboard stats - Use optimized consolidated endpoint
  async getDashboardStats() {
    try {
      console.log('🔄 Fetching dashboard stats from optimized endpoint...');
      // Use the NEW consolidated dashboard-summary endpoint (10x faster, 1 request instead of 5-10)
      const response = await this.request('/api/dashboard-summary') as any;
      console.log('✅ Dashboard stats fetched successfully from consolidated endpoint:', response);
      // Backend returns { success: true, data: {...} }, return it directly
      return response;
    } catch (error) {
      console.warn('⚠️ Consolidated dashboard-summary endpoint not available, falling back to /api/dashboard');
      try {
        // Fallback to old dashboard endpoint
        const response = await this.request('/api/dashboard') as any;
        console.log('✅ Dashboard stats fetched from fallback endpoint:', response);
        return response;
      } catch (fallbackError) {
        console.warn('⚠️ Dashboard endpoint not available, using analytics fallback');
        try {
            // Final fallback to analytics endpoint
            const response = await this.request('/api/analytics/realtime') as {
              leads?: number;
              students?: number;
              communications?: number;
              revenue?: number;
              lastUpdated?: string;
            };
          
          // Transform the response to match expected format
          return {
            success: true,
            data: {
              totalLeads: response.leads || 0,
              activeLeads: response.leads || 0,
              newLeadsThisWeek: Math.floor((response.leads || 0) * 0.3),
              totalStudents: response.students || 0,
              activeStudents: response.students || 0,
              totalCommunications: response.communications || 0,
              totalDocuments: 0,
              conversionRate: (response.leads || 0) > 0 ? Math.round(((response.students || 0) / (response.leads || 1)) * 100) : 0,
              responseTime: '2.4h',
              lastUpdated: response.lastUpdated || new Date().toISOString()
            }
          };
        } catch (analyticsError) {
          console.warn('❌ All dashboard endpoints failed, using default data');
          return {
            success: true,
            data: {
              totalLeads: 0,
              activeLeads: 0,
              newLeadsThisWeek: 0,
              totalStudents: 0,
              activeStudents: 0,
              totalCommunications: 0,
              totalDocuments: 0,
              conversionRate: 0,
              responseTime: '2.4h',
              lastUpdated: new Date().toISOString()
            }
          };
        }
      }
    }
  }

  // Leads API - Direct connection to backend database with pagination support
  async getLeads(page: number = 1, pageSize: number = 100, filters?: any) {
    try {
      // Build query string with pagination and filters
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString()
      });
      
      // Add filter parameters if provided
      if (filters) {
        console.log('🔍 Raw filters being processed:', filters);
        if (filters.search) params.append('search', filters.search);
        if (filters.status && filters.status.length > 0 && !filters.status.includes('all')) {
          params.append('status', filters.status.join(','));
        }
        if (filters.country && filters.country !== 'all') params.append('country', filters.country);
        if (filters.source && filters.source !== 'all') params.append('source', filters.source);
        if (filters.assignedTo && filters.assignedTo.length > 0) {
          params.append('assignedTo', filters.assignedTo.join(','));
        }
        if (filters.qualification && filters.qualification !== 'all') params.append('qualification', filters.qualification);
        if (filters.course && filters.course !== 'all') params.append('course', filters.course);
        if (filters.company && filters.company !== 'all') params.append('company', filters.company);
        
        // Add updated date filter parameters
        if (filters.dateFilter && filters.dateFilter !== 'all') params.append('dateFilter', filters.dateFilter);
        if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
        if (filters.dateTo) params.append('dateTo', filters.dateTo);
        if (filters.dateFilterType && filters.dateFilterType !== 'on') params.append('dateFilterType', filters.dateFilterType);
        if (filters.specificDate) params.append('specificDate', filters.specificDate);
        
        // Add created date filter parameters
        if (filters.createdDateFilter && filters.createdDateFilter !== 'all') params.append('createdDateFilter', filters.createdDateFilter);
        if (filters.createdDateFrom) params.append('createdDateFrom', filters.createdDateFrom);
        if (filters.createdDateTo) params.append('createdDateTo', filters.createdDateTo);
        if (filters.createdDateFilterType && filters.createdDateFilterType !== 'on') params.append('createdDateFilterType', filters.createdDateFilterType);
        if (filters.createdSpecificDate) params.append('createdSpecificDate', filters.createdSpecificDate);
        
        // Add follow-up date filter parameters
        if (filters.followUpFilter && filters.followUpFilter !== 'all') params.append('followUpFilter', filters.followUpFilter);
        if (filters.followUpDateFrom) params.append('followUpDateFrom', filters.followUpDateFrom);
        if (filters.followUpDateTo) params.append('followUpDateTo', filters.followUpDateTo);
        if (filters.followUpDateType) params.append('followUpDateType', filters.followUpDateType);
        if (filters.followUpSpecificDate) params.append('followUpSpecificDate', filters.followUpSpecificDate);
        if (filters.showOverdueFollowUp === true) params.append('showOverdueFollowUp', 'true');
        
        console.log('📊 Follow-up filters being sent:', {
          followUpFilter: filters.followUpFilter,
          followUpDateFrom: filters.followUpDateFrom,
          followUpDateTo: filters.followUpDateTo,
          followUpDateType: filters.followUpDateType,
          followUpSpecificDate: filters.followUpSpecificDate,
          showOverdueFollowUp: filters.showOverdueFollowUp
        });
      }
      
      const queryString = params.toString();
      console.log(`🔄 Attempting to fetch leads from backend (page ${page}, size ${pageSize}) with filters: ${queryString}`);
      const response = await this.request(`/api/leads?${queryString}`);
      console.log('✅ Leads fetched successfully:', response);
      return response;
    } catch (error) {
      console.error('❌ Failed to fetch leads from database:', error);
      
      // Try alternative endpoint if main fails (fallback without filters for now)
      try {
        console.log('🔄 Trying alternative leads endpoint...');
        const fallbackResponse = await this.request(`/api/leads-simple?page=${page}&pageSize=${pageSize}`);
        console.log('✅ Fallback leads fetched successfully:', fallbackResponse);
        return fallbackResponse;
      } catch (fallbackError) {
        console.error('❌ Fallback leads endpoint also failed:', fallbackError);
        throw new Error('Unable to connect to leads database. Please check your connection.');
      }
    }
  }

  async createLead(leadData: any) {
    return this.request('/api/leads', {
      method: 'POST',
      body: JSON.stringify(leadData)
    });
  }

  async updateLead(id: string, leadData: any) {
    return this.request(`/api/leads?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(leadData)
    });
  }

  async deleteLead(id: string) {
    return this.request(`/api/leads?id=${id}`, {
      method: 'DELETE'
    });
  }

  async bulkUpdateLeads(leadIds: string[], updateData: any, operationType: string = 'update', reason?: string) {
    return this.request('/api/leads', {
      method: 'POST',
      body: JSON.stringify({
        operation: 'bulk_update',
        leadIds,
        updateData,
        operationType,
        reason,
        updatedBy: localStorage.getItem('crm_user_data') ? 
          JSON.parse(localStorage.getItem('crm_user_data') || '{}').id : 
          'system'
      })
    });
  }

  async bulkDeleteLeads(leadIds: string[]) {
    try {
      return this.request('/api/leads', {
        method: 'POST',
        body: JSON.stringify({
          operation: 'bulk_delete',
          leadIds,
          updatedBy: localStorage.getItem('crm_user_data') ? 
            JSON.parse(localStorage.getItem('crm_user_data') || '{}').id : 
            'system'
        })
      });
    } catch (error) {
      // Handle 404 errors gracefully during backend deployment
      if (error instanceof Error && error.message.includes('404')) {
        throw new Error('Delete functionality is temporarily unavailable. The backend is being updated. Please try again in a few minutes.');
      }
      throw error;
    }
  }

  // Students API - New endpoints
  async getStudents() {
    return this.request('/api/students');
  }

  async createStudent(studentData: any) {
    return this.request('/api/students', {
      method: 'POST',
      body: JSON.stringify(studentData)
    });
  }

  async updateStudent(id: string, studentData: any) {
    return this.request(`/api/students?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(studentData)
    });
  }

  async deleteStudent(id: string) {
    return this.request(`/api/students?id=${id}`, {
      method: 'DELETE'
    });
  }

  // Users API - New endpoints
  async getUsers() {
    return this.request('/users-supabase');
  }

  // Get users that current user can assign leads to (hierarchical filtering)
  async getAssignableUsers() {
    return this.request('/api/assignable-users');
  }

  // Debug assignable users (shows detailed hierarchy information)
  async debugAssignableUsers() {
    return this.request('/api/debug-assignable-users');
  }

  // Test user lookup methods - DEVELOPMENT ONLY
  async testUserLookup() {
    if (import.meta.env.DEV || import.meta.env.VITE_DEBUG_MODE === 'true') {
      return this.request('/test-user-lookup');
    } else {
      console.warn('testUserLookup is only available in development mode');
      return { error: 'Not available in production' };
    }
  }

  // Get subordinates for a specific user (reporting hierarchy)
  async getUserSubordinates(userId: string) {
    return this.request(`/users/${userId}/subordinates`);
  }

  // Get leads for a specific user and their team
  async getUserLeads(userId: string, includeTeam: boolean = true) {
    return this.request(`/users/${userId}/leads?includeTeam=${includeTeam}`);
  }

  async createUser(userData: any) {
    return this.request('/users-supabase', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  async updateUser(id: string, userData: any) {
    return this.request(`/users-supabase?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
  }

  async deleteUser(id: string) {
    return this.request(`/users-supabase?id=${id}`, {
      method: 'DELETE'
    });
  }

  // Get current user profile
  async getCurrentUser() {
    return this.request('/api/users/me');
  }

  // Get user activity stats for team/all users
  async getUserActivityStats() {
    return this.request('/api/user-activity-stats');
  }

  // Communications API - New endpoints
  async getCommunications(filters?: any) {
    const params = new URLSearchParams(filters).toString();
    return this.request(`/communications${params ? `?${params}` : ''}`);
  }

  async createCommunication(communicationData: any) {
    return this.request('/communications', {
      method: 'POST',
      body: JSON.stringify(communicationData)
    });
  }

  // Documents API - New endpoints
  async getDocuments(filters?: any) {
    const params = new URLSearchParams(filters).toString();
    return this.request(`/documents${params ? `?${params}` : ''}`);
  }

  async uploadDocument(formData: FormData) {
    return this.request('/documents', {
      method: 'POST',
      body: formData,
      headers: {} // Remove Content-Type to let browser set it for FormData
    });
  }

  // Payments API - Enhanced
  async getPayments(filters?: any) {
    const params = new URLSearchParams(filters).toString();
    return this.request(`/payments${params ? `?${params}` : ''}`);
  }

  async createPaymentOrder(paymentData: any) {
    return this.request('/payments/create-order', {
      method: 'POST',
      body: JSON.stringify(paymentData)
    });
  }

  // Integrations API - New endpoints
  async getIntegrationStatus() {
    return this.request('/integrations');
  }

  async testIntegration(integration: string) {
    return this.request('/integrations', {
      method: 'POST',
      body: JSON.stringify({ action: 'test', integration })
    });
  }

  // ===========================
  // EXTENDED API METHODS FOR FULL DATABASE SUPPORT
  // ===========================

  // Analytics Events API
  async getAnalyticsEvents(filters?: any) {
    const params = new URLSearchParams(filters).toString();
    return this.request(`/analytics/events${params ? `?${params}` : ''}`);
  }

  async createAnalyticsEvent(eventData: any) {
    return this.request('/analytics/events', {
      method: 'POST',
      body: JSON.stringify(eventData)
    });
  }

  async getAnalyticsDashboard(dateRange?: string) {
    return this.request(`/analytics/dashboard${dateRange ? `?range=${dateRange}` : ''}`);
  }

  // Campaigns API
  async getCampaigns(filters?: any) {
    const params = new URLSearchParams(filters).toString();
    return this.request(`/campaigns${params ? `?${params}` : ''}`);
  }

  async createCampaign(campaignData: any) {
    return this.request('/campaigns', {
      method: 'POST',
      body: JSON.stringify(campaignData)
    });
  }

  async updateCampaign(id: string, campaignData: any) {
    return this.request(`/campaigns/${id}`, {
      method: 'PUT',
      body: JSON.stringify(campaignData)
    });
  }

  async deleteCampaign(id: string) {
    return this.request(`/campaigns/${id}`, {
      method: 'DELETE'
    });
  }

  async launchCampaign(id: string) {
    return this.request(`/campaigns/${id}/launch`, {
      method: 'POST'
    });
  }

  // Communications API - Enhanced
  async updateCommunication(id: string, communicationData: any) {
    return this.request(`/communications/${id}`, {
      method: 'PUT',
      body: JSON.stringify(communicationData)
    });
  }

  async deleteCommunication(id: string) {
    return this.request(`/communications/${id}`, {
      method: 'DELETE'
    });
  }

  async getCommunicationHistory(entityId: string, entityType: 'lead' | 'student') {
    return this.request(`/communications/history?entityId=${entityId}&entityType=${entityType}`);
  }

  // Documents API - Enhanced
  async updateDocument(id: string, documentData: any) {
    return this.request(`/documents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(documentData)
    });
  }

  async deleteDocument(id: string) {
    return this.request(`/documents/${id}`, {
      method: 'DELETE'
    });
  }

  async verifyDocument(id: string, verificationData: any) {
    return this.request(`/documents/${id}/verify`, {
      method: 'POST',
      body: JSON.stringify(verificationData)
    });
  }

  async getDocumentsByStudent(studentId: string) {
    return this.request(`/documents/student/${studentId}`);
  }

  async getDocumentsByLead(leadId: string) {
    return this.request(`/documents/lead/${leadId}`);
  }

  // Payments API - Enhanced
  async updatePayment(id: string, paymentData: any) {
    return this.request(`/payments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(paymentData)
    });
  }

  async getPaymentsByStudent(studentId: string) {
    return this.request(`/payments/student/${studentId}`);
  }

  async processPayment(paymentId: string, paymentDetails: any) {
    return this.request(`/payments/${paymentId}/process`, {
      method: 'POST',
      body: JSON.stringify(paymentDetails)
    });
  }

  async refundPayment(paymentId: string, refundData: any) {
    return this.request(`/payments/${paymentId}/refund`, {
      method: 'POST',
      body: JSON.stringify(refundData)
    });
  }

  // Notifications API
  async getNotifications(userId?: string) {
    return this.request(`/notifications${userId ? `?userId=${userId}` : ''}`);
  }

  async createNotification(notificationData: any) {
    return this.request('/notifications', {
      method: 'POST',
      body: JSON.stringify(notificationData)
    });
  }

  async markNotificationAsRead(id: string) {
    return this.request(`/notifications/${id}/read`, {
      method: 'PUT'
    });
  }

  async deleteNotification(id: string) {
    return this.request(`/notifications/${id}`, {
      method: 'DELETE'
    });
  }

  // Notes API - Lead-specific notes
  async getNotes(entityId?: string, entityType?: 'lead' | 'student') {
    if (entityType === 'lead' && entityId) {
      // Use the dedicated lead-notes API endpoint
      return this.request(`/lead-notes/${entityId}`);
    }
    // Fallback to generic notes API for other cases
    const params = new URLSearchParams();
    if (entityId) params.append('entityId', entityId);
    if (entityType) params.append('entityType', entityType);
    return this.request(`/notes${params.toString() ? `?${params.toString()}` : ''}`);
  }

  async createNote(noteData: any) {
    // If it's a lead note, use the dedicated lead-notes API
    if (noteData.lead_id) {
      return this.request(`/lead-notes/${noteData.lead_id}`, {
        method: 'POST',
        body: JSON.stringify(noteData)
      });
    }
    // Fallback to generic notes API
    return this.request('/notes', {
      method: 'POST',
      body: JSON.stringify(noteData)
    });
  }

  async updateNote(id: string, noteData: any) {
    return this.request(`/notes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(noteData)
    });
  }

  async deleteNote(id: string) {
    return this.request(`/notes/${id}`, {
      method: 'DELETE'
    });
  }

  // Automation Workflows API
  async getAutomationWorkflows() {
    return this.request('/automation/workflows');
  }

  async createAutomationWorkflow(workflowData: any) {
    return this.request('/automation/workflows', {
      method: 'POST',
      body: JSON.stringify(workflowData)
    });
  }

  async updateAutomationWorkflow(id: string, workflowData: any) {
    return this.request(`/automation/workflows/${id}`, {
      method: 'PUT',
      body: JSON.stringify(workflowData)
    });
  }

  async deleteAutomationWorkflow(id: string) {
    return this.request(`/automation/workflows/${id}`, {
      method: 'DELETE'
    });
  }

  async executeWorkflow(id: string, triggerData?: any) {
    return this.request(`/automation/workflows/${id}/execute`, {
      method: 'POST',
      body: JSON.stringify(triggerData || {})
    });
  }

  // Integration Logs API
  async getIntegrationLogs(filters?: any) {
    const params = new URLSearchParams(filters).toString();
    return this.request(`/integration-logs${params ? `?${params}` : ''}`);
  }

  async createIntegrationLog(logData: any) {
    return this.request('/integration-logs', {
      method: 'POST',
      body: JSON.stringify(logData)
    });
  }

  // System Settings API
  async getSystemSettings(category?: string) {
    return this.request(`/system/settings${category ? `?category=${category}` : ''}`);
  }

  async updateSystemSetting(key: string, value: any) {
    return this.request('/system/settings', {
      method: 'PUT',
      body: JSON.stringify({ key, value })
    });
  }

  // User Profiles API - Enhanced
  async getUserProfile(userId?: string) {
    return this.request(`/users/profile${userId ? `?userId=${userId}` : ''}`);
  }

  async updateUserProfile(userId: string, profileData: any) {
    return this.request(`/users/profile/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
  }

  // User Sessions API
  async getUserSessions(userId?: string) {
    return this.request(`/users/sessions${userId ? `?userId=${userId}` : ''}`);
  }

  async revokeUserSession(sessionId: string) {
    return this.request(`/users/sessions/${sessionId}/revoke`, {
      method: 'DELETE'
    });
  }

  // WhatsApp API
  async sendWhatsAppMessage(to: string, message: string) {
    return this.request('/api/whatsapp/send', {
      method: 'POST',
      body: JSON.stringify({ to, message })
    });
  }

  // Facebook API
  async getFacebookLeads() {
    // Facebook leads endpoint doesn't exist
    console.warn('Facebook leads endpoint not available on backend');
    return [];
  }

  // Analytics API - Updated to match backend endpoint
  async getAnalytics(_period: string = '30d') {
    return this.request('/api/analytics/realtime');
  }

  // Enhanced Analytics API - Real-time analytics
  async getEnhancedAnalytics(timeframe: string = 'month') {
    return this.request(`/api/enhanced-analytics/realtime?timeframe=${timeframe}`);
  }

  async createPaymentLink(_amount: number, _description: string) {
    // Use the new payment order endpoint
    return this.createPaymentOrder({
      amount: _amount,
      description: _description
    });
  }
}

// Singleton instance
let apiClient: ProductionApiClient | null = null;

export const getApiClient = (): ProductionApiClient => {
  if (!apiClient) {
    apiClient = new ProductionApiClient();
  }
  return apiClient;
};

// ===========================
// 4. REAL-TIME SUBSCRIPTIONS
// ===========================

export interface RealTimeData {
  leads: number;
  students: number;
  communications: number;
  lastUpdate: Date;
  activeConnections: number;
}

export interface RealTimeCallbacks {
  onLeadsUpdate?: (payload: any) => void;
  onStudentsUpdate?: (payload: any) => void;
  onCommunicationsUpdate?: (payload: any) => void;
  onIntegrationsUpdate?: (payload: any) => void;
  onDataUpdate?: (data: RealTimeData) => void;
  onError?: (error: Error) => void;
}

export class RealTimeManager {
  private supabase: SupabaseClient<any>;
  private channels: RealtimeChannel[] = [];
  private callbacks: RealTimeCallbacks;
  private data: RealTimeData;
  private config: EnvironmentConfig;

  constructor(callbacks: RealTimeCallbacks = {}) {
    this.supabase = getSupabase();
    this.callbacks = callbacks;
    this.config = getEnvironmentConfig();
    this.data = {
      leads: 0,
      students: 0,
      communications: 0,
      lastUpdate: new Date(),
      activeConnections: 0
    };
  }

  async initialize(): Promise<void> {
    if (!this.config.enableRealTime) {
      console.warn('Real-time is disabled in configuration');
      return;
    }

    try {
      await this.setupLeadsSubscription();
      await this.setupStudentsSubscription();
      await this.setupCommunicationsSubscription();
      await this.setupIntegrationsSubscription();
      await this.loadInitialData();
      
      if (this.config.debugMode) {
        // Real-time manager initialized
      }
    } catch (error) {
      console.error('❌ Failed to initialize real-time manager:', error);
      this.callbacks.onError?.(error as Error);
    }
  }

  private async setupLeadsSubscription(): Promise<void> {
    const channel = this.supabase
      .channel('leads-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'leads' },
        (payload) => {
          if (this.config.debugMode) {
            // Leads update received
          }
          
          this.updateData();
          this.callbacks.onLeadsUpdate?.(payload);
          this.showNotification('Lead Update', 'New lead activity detected');
        }
      )
      .subscribe();

    this.channels.push(channel);
  }

  private async setupStudentsSubscription(): Promise<void> {
    const channel = this.supabase
      .channel('students-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'students' },
        (payload) => {
          if (this.config.debugMode) {
            // Students update received
          }
          
          this.updateData();
          this.callbacks.onStudentsUpdate?.(payload);
          this.showNotification('Student Update', 'Student information changed');
        }
      )
      .subscribe();

    this.channels.push(channel);
  }

  private async setupCommunicationsSubscription(): Promise<void> {
    const channel = this.supabase
      .channel('communications-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'communications' },
        (payload) => {
          if (this.config.debugMode) {
            // Communications update received
          }
          
          this.updateData();
          this.callbacks.onCommunicationsUpdate?.(payload);
          this.showNotification('New Message', 'Communication activity detected');
        }
      )
      .subscribe();

    this.channels.push(channel);
  }

  private async setupIntegrationsSubscription(): Promise<void> {
    const channel = this.supabase
      .channel('integrations-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'integrations_status' },
        (payload) => {
          if (this.config.debugMode) {
            // Integrations update received
          }
          
          this.callbacks.onIntegrationsUpdate?.(payload);
          this.showNotification('Integration Update', 'Integration status changed');
        }
      )
      .subscribe();

    this.channels.push(channel);
  }

  private async loadInitialData(): Promise<void> {
    try {
      const [leadsCount, studentsCount, communicationsCount] = await Promise.all([
        this.supabase.from('leads').select('*', { count: 'exact', head: true }),
        this.supabase.from('students').select('*', { count: 'exact', head: true }),
        this.supabase.from('communications').select('*', { count: 'exact', head: true })
      ]);

      this.data = {
        leads: leadsCount.count || 0,
        students: studentsCount.count || 0,
        communications: communicationsCount.count || 0,
        lastUpdate: new Date(),
        activeConnections: this.channels.length
      };

      this.callbacks.onDataUpdate?.(this.data);
    } catch (error) {
      console.error('Failed to load initial data:', error);
    }
  }

  private updateData(): void {
    this.data.lastUpdate = new Date();
    this.loadInitialData(); // Refresh counts
  }

  private showNotification(title: string, body: string): void {
    if (!this.config.enableNotifications) return;

    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(title, {
          body,
          icon: '/favicon.ico',
          badge: '/favicon.ico'
        });
      } else if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification(title, { body, icon: '/favicon.ico' });
          }
        });
      }
    }
  }

  getData(): RealTimeData {
    return { ...this.data };
  }

  getConnectionStatus(): 'connected' | 'disconnected' | 'connecting' {
    if (this.channels.length === 0) return 'disconnected';
    
    const connectedChannels = this.channels.filter(channel => 
      channel.state === 'joined'
    );
    
    if (connectedChannels.length === this.channels.length) {
      return 'connected';
    } else if (connectedChannels.length > 0) {
      return 'connecting';
    } else {
      return 'disconnected';
    }
  }

  async disconnect(): Promise<void> {
    for (const channel of this.channels) {
      await this.supabase.removeChannel(channel);
    }
    this.channels = [];
    
    if (this.config.debugMode) {
      // Real-time manager disconnected
    }
  }
}

// ===========================
// 5. DATABASE OPERATIONS
// ===========================

export class DatabaseManager {
  private supabase: SupabaseClient<any>;

  constructor() {
    this.supabase = getSupabase();
  }

  // LEADS OPERATIONS
  async getLeads(limit = 30000, offset = 0): Promise<DatabaseLead[]> {
    const { data, error } = await this.supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data || [];
  }

  async createLead(lead: Omit<DatabaseLead, 'id' | 'created_at' | 'updated_at'>): Promise<DatabaseLead> {
    const { data, error } = await this.supabase
      .from('leads')
      .insert(lead)
      .select()
      .single();

    if (error) throw error;
    return data as DatabaseLead;
  }

  async updateLead(id: string, updates: Partial<Omit<DatabaseLead, 'id' | 'created_at'>>): Promise<DatabaseLead> {
    const { data, error } = await this.supabase
      .from('leads')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as DatabaseLead;
  }

  async deleteLead(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('leads')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // STUDENTS OPERATIONS
  async getStudents(limit = 30000, offset = 0): Promise<DatabaseStudent[]> {
    const { data, error } = await this.supabase
      .from('students')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data || [];
  }

  async createStudent(student: Omit<DatabaseStudent, 'id' | 'created_at' | 'updated_at'>): Promise<DatabaseStudent> {
    const { data, error } = await this.supabase
      .from('students')
      .insert(student)
      .select()
      .single();

    if (error) throw error;
    return data as DatabaseStudent;
  }

  async updateStudent(id: string, updates: Partial<Omit<DatabaseStudent, 'id' | 'created_at'>>): Promise<DatabaseStudent> {
    const { data, error } = await this.supabase
      .from('students')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as DatabaseStudent;
  }

  async deleteStudent(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('students')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // USER OPERATIONS
  async getUsers(limit = 30000, offset = 0): Promise<DatabaseUser[]> {
    try {
      // First try to get from custom users table
      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.warn('Users table not found, falling back to auth.users');
        // Fallback to auth.users if custom table doesn't exist
        const { data: authData, error: authError } = await this.supabase.auth.admin.listUsers();
        
        if (authError) throw authError;
        
        // Transform auth users to our interface
        const transformedUsers: DatabaseUser[] = authData.users.map(user => ({
          id: user.id,
          created_at: user.created_at,
          updated_at: user.updated_at || user.created_at,
          name: user.user_metadata?.name || user.email?.split('@')[0] || 'Unknown',
          username: user.user_metadata?.username || user.email?.split('@')[0] || 'unknown',
          email: user.email || '',
          phone: user.user_metadata?.phone,
          office_phone: user.user_metadata?.office_phone,
          role: user.user_metadata?.role || 'counselor',
          department: user.user_metadata?.department,
          designation: user.user_metadata?.designation,
          location: user.user_metadata?.location,
          date_of_birth: user.user_metadata?.date_of_birth,
          join_date: user.user_metadata?.join_date || user.created_at,
          status: user.email_confirmed_at ? 'active' : 'inactive',
          reports_to: user.user_metadata?.reports_to,
          profile_image: user.user_metadata?.profile_image
        }));
        
        return transformedUsers.slice(offset, offset + limit);
      }
      
      return data || [];
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  }

  async createUser(user: Omit<DatabaseUser, 'id' | 'created_at' | 'updated_at'>): Promise<DatabaseUser> {
    // DEPRECATED: Use getApiClient().createUser() instead for proper backend integration
    console.warn('⚠️ DatabaseManager.createUser() is deprecated. Use getApiClient().createUser() for proper password hashing and validation.');
    
    // Fallback to direct database insertion (no password hashing!)
    const { data, error } = await this.supabase
      .from('users')
      .insert(user)
      .select()
      .single();

    if (error) throw error;
    return data as DatabaseUser;
  }

  async updateUser(id: string, updates: Partial<Omit<DatabaseUser, 'id' | 'created_at'>>): Promise<DatabaseUser> {
    // DEPRECATED: Use getApiClient().updateUser() instead for proper backend integration
    console.warn('⚠️ DatabaseManager.updateUser() is deprecated. Use getApiClient().updateUser() for proper password hashing and validation.');
    
    // Fallback to direct database update (no password hashing!)
    const { data, error } = await this.supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as DatabaseUser;
  }

  async deleteUser(id: string): Promise<void> {
    // Note: This only deletes from users table, not auth.users
    // In production, you'd need proper user deactivation
    const { error } = await this.supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // COMMUNICATIONS OPERATIONS
  async getCommunications(limit = 30000, offset = 0): Promise<DatabaseCommunication[]> {
    const { data, error } = await this.supabase
      .from('communications')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data || [];
  }

  async createCommunication(communication: Omit<DatabaseCommunication, 'id' | 'created_at'>): Promise<DatabaseCommunication> {
    const { data, error } = await this.supabase
      .from('communications')
      .insert(communication)
      .select()
      .single();

    if (error) throw error;
    return data as DatabaseCommunication;
  }

  // INTEGRATIONS OPERATIONS
  async getIntegrationStatus(): Promise<IntegrationStatus[]> {
    const { data, error } = await this.supabase
      .from('integrations_status')
      .select('*')
      .order('integration_name');

    if (error) throw error;
    return data || [];
  }

  async updateIntegrationStatus(name: string, status: IntegrationStatus['status'], config?: Record<string, any>): Promise<IntegrationStatus> {
    const updates: any = { status, last_sync: new Date().toISOString() };
    if (config) updates.configuration = config;

    const { data, error } = await this.supabase
      .from('integrations_status')
      .update(updates)
      .eq('integration_name', name)
      .select()
      .single();

    if (error) throw error;
    return data as IntegrationStatus;
  }

  // ANALYTICS OPERATIONS
  async getAnalytics(dateRange?: { start: string; end: string }) {
    const query = this.supabase.from('leads').select('status, source, created_at');
    
    if (dateRange) {
      query.gte('created_at', dateRange.start);
      query.lte('created_at', dateRange.end);
    }

    const { data: leads, error: leadsError } = await query;
    if (leadsError) throw leadsError;

    const { data: students, error: studentsError } = await this.supabase
      .from('students')
      .select('status, progress, created_at');
    if (studentsError) throw studentsError;

    const { data: communications, error: communicationsError } = await this.supabase
      .from('communications')
      .select('type, status, created_at');
    if (communicationsError) throw communicationsError;

    return {
      leads: leads || [],
      students: students || [],
      communications: communications || [],
      summary: {
        totalLeads: leads?.length || 0,
        totalStudents: students?.length || 0,
        totalCommunications: communications?.length || 0
      }
    };
  }
}

// ===========================
// 6. AUTHENTICATION (DEPRECATED - Use lib/productionAuth.ts instead)
// ===========================

// Authentication is now handled by ProductionAuthService in lib/productionAuth.ts
// This section is kept for reference but should not be used

// ===========================
// 7. INTEGRATION SERVICES
// ===========================

export class IntegrationManager {
  private db: DatabaseManager;

  constructor() {
    this.db = new DatabaseManager();
  }

  async testConnection(integrationName: string): Promise<boolean> {
    try {
      // Simulate connection test
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await this.db.updateIntegrationStatus(integrationName, 'connected');
      return true;
    } catch (error) {
      await this.db.updateIntegrationStatus(integrationName, 'error');
      return false;
    }
  }

  async syncIntegration(integrationName: string): Promise<void> {
    await this.db.updateIntegrationStatus(integrationName, 'syncing');
    
    try {
      // Simulate sync process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await this.db.updateIntegrationStatus(integrationName, 'connected');
    } catch (error) {
      await this.db.updateIntegrationStatus(integrationName, 'error');
      throw error;
    }
  }

  async disconnectIntegration(integrationName: string): Promise<void> {
    await this.db.updateIntegrationStatus(integrationName, 'disconnected');
  }
}

// ===========================
// 8. EXPORT MAIN CLASSES
// ===========================

// Default singleton instances
let realTimeManager: RealTimeManager | null = null;

export const getRealTimeManager = (callbacks?: RealTimeCallbacks): RealTimeManager => {
  if (!realTimeManager) {
    realTimeManager = new RealTimeManager(callbacks);
  }
  return realTimeManager;
};

// ARCHITECTURAL NOTE: Frontend should ONLY use API client, never direct database access
// These functions are deprecated and will be removed to enforce proper separation

// DEPRECATED FUNCTIONS REMOVED
// Use getApiClient() for all backend communication
// Use getAuthService() from lib/productionAuth.ts for authentication

// Initialize backend on import
export const initializeBackend = async () => {
  try {
    initializeSupabase();
    // CRM Backend initialized
  } catch (error) {
    console.error('❌ Failed to initialize CRM Backend:', error);
    throw error;
  }
};

// Main export - Only API client, no direct database access
export default {
  initializeBackend,
  getApiClient, // Only API client for proper frontend-backend separation
  // Note: Direct database access removed for proper architecture
  // getDatabaseManager,  // REMOVED - Frontend should not access DB directly
  // getSupabase          // REMOVED - Frontend should not access DB directly
};
