import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getApiClient } from '../lib/backend';

// Query Keys
export const queryKeys = {
  leads: ['leads'] as const,
  lead: (id: string) => ['leads', id] as const,
  students: ['students'] as const,
  student: (id: string) => ['students', id] as const,
  users: ['users'] as const,
  user: (id: string) => ['users', id] as const,
  dashboard: ['dashboard'] as const,
  analytics: ['analytics'] as const,
  assignableUsers: ['assignableUsers'] as const,
  communications: ['communications'] as const,
  notifications: ['notifications'] as const,
};

// Leads Hooks - Optimized for performance with pagination support
export const useLeads = (page: number = 1, pageSize: number = 100, filters?: any) => {
  return useQuery({
    queryKey: [...queryKeys.leads, page, pageSize, filters],
    queryFn: async () => {
      const apiClient = getApiClient();
      const data = await apiClient.getLeads(page, pageSize, filters);
      console.log(`✅ Fetched ${Array.isArray(data?.leads || data?.data) ? (data?.leads || data?.data).length : 0} leads from API (page ${page}, size ${pageSize})`);
      
      // Debug: Log first few leads with status details
      const leads = (data as any)?.leads || (data as any)?.data || [];
      console.log('🔍 DEBUG - First 3 leads status details:');
      leads.slice(0, 3).forEach((lead: any, i: number) => {
        console.log(`  Lead ${i + 1}: id=${lead.id}, name=${lead.name || lead.fullName}, status="${lead.status}"`);
      });
      
      // Debug: Check status distribution
      const statusCounts = leads.reduce((acc: any, lead: any) => {
        acc[lead.status] = (acc[lead.status] || 0) + 1;
        return acc;
      }, {});
      console.log('🔍 DEBUG - Status distribution in API response:', statusCounts);
      
      return data;
    },
    staleTime: 1000 * 30, // Cache for 30 seconds (reduced for faster updates)
    gcTime: 1000 * 60 * 5, // Keep in cache for 5 minutes
    refetchInterval: 1000 * 60, // Auto-refetch every 60 seconds for real-time updates
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchOnMount: 'always', // Always refetch on mount to get latest data
  });
};

export const useLead = (id: string) => {
  return useQuery({
    queryKey: queryKeys.lead(id),
    queryFn: async () => {
      const apiClient = getApiClient();
      return apiClient.getLeadById(id);
    },
    enabled: !!id,
  });
};

export const useCreateLead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (leadData: any) => {
      const apiClient = getApiClient();
      return apiClient.createLead(leadData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leads });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
};

export const useUpdateLead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const apiClient = getApiClient();
      return apiClient.updateLead(id, data);
    },
    onSuccess: (responseData, variables) => {
      // Update cache directly without refetching to prevent page reset
      // This is more efficient and preserves UI state (current page, selected lead)
      
      // Update all active leads queries in the cache
      queryClient.setQueriesData(
        { queryKey: queryKeys.leads },
        (oldData: any) => {
          if (!oldData) return oldData;
          
          // Handle different response structures
          const leads = oldData.leads || oldData.data || [];
          const updatedLeads = leads.map((lead: any) => 
            lead.id === variables.id ? { ...lead, ...variables.data } : lead
          );
          
          return {
            ...oldData,
            leads: updatedLeads,
            data: updatedLeads
          };
        }
      );
      
      // Update individual lead query if it exists
      queryClient.setQueryData(
        queryKeys.lead(variables.id),
        (oldData: any) => {
          if (!oldData) return oldData;
          return { ...oldData, ...variables.data };
        }
      );
      
      // Only invalidate dashboard (doesn't affect pagination)
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.dashboard,
        refetchType: 'none' // Don't trigger immediate refetch
      });
    },
  });
};

export const useBulkUpdateLeads = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      leadIds, 
      updateData, 
      operationType, 
      reason 
    }: { 
      leadIds: string[]; 
      updateData: any; 
      operationType?: string; 
      reason?: string;
    }) => {
      const apiClient = getApiClient();
      return apiClient.bulkUpdateLeads(leadIds, updateData, operationType, reason);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leads });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
};

export const useBulkDeleteLeads = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (leadIds: string[]) => {
      const apiClient = getApiClient();
      return apiClient.bulkDeleteLeads(leadIds);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leads });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
};

// Students Hooks
export const useStudents = () => {
  return useQuery({
    queryKey: queryKeys.students,
    queryFn: async () => {
      const apiClient = getApiClient();
      return apiClient.getStudents();
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

export const useCreateStudent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (studentData: any) => {
      const apiClient = getApiClient();
      return apiClient.createStudent(studentData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.students });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
};

export const useUpdateStudent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const apiClient = getApiClient();
      return apiClient.updateStudent(id, data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.students });
      queryClient.invalidateQueries({ queryKey: queryKeys.student(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
};

// Users Hooks
export const useUsers = () => {
  return useQuery({
    queryKey: queryKeys.users,
    queryFn: async () => {
      const apiClient = getApiClient();
      return apiClient.getUsers();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useAssignableUsers = () => {
  return useQuery({
    queryKey: queryKeys.assignableUsers,
    queryFn: async () => {
      const apiClient = getApiClient();
      return apiClient.getAssignableUsers();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userData: any) => {
      const apiClient = getApiClient();
      return apiClient.createUser(userData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users });
      queryClient.invalidateQueries({ queryKey: queryKeys.assignableUsers });
    },
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const apiClient = getApiClient();
      return apiClient.updateUser(id, data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users });
      queryClient.invalidateQueries({ queryKey: queryKeys.user(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.assignableUsers });
    },
  });
};

// Dashboard Hooks
export const useDashboardStats = () => {
  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: async () => {
      const apiClient = getApiClient();
      return apiClient.getDashboardStats();
    },
    staleTime: 1000 * 60 * 1, // 1 minute
    refetchInterval: 1000 * 60 * 2, // Auto-refetch every 2 minutes
  });
};

// Analytics Hooks
export const useAnalytics = () => {
  return useQuery({
    queryKey: queryKeys.analytics,
    queryFn: async () => {
      const apiClient = getApiClient();
      return apiClient.getAnalytics();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Add Note Mutation
export const useAddNote = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ leadId, content, noteType = 'general' }: { 
      leadId: string; 
      content: string; 
      noteType?: string;
    }) => {
      // Import TokenManager here to avoid circular dependencies
      const { TokenManager } = await import('../lib/productionAuth');
      
      // Use the proper leads API addNote endpoint
      const backendUrl = import.meta.env.VITE_API_BASE_URL || 'https://crm-backend-fh34.onrender.com';
      const response = await fetch(`${backendUrl}/api/leads?action=addNote`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${TokenManager.getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          leadId,
          content,
          noteType
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to add note');
      }
      
      return result;
    },
    onSuccess: (result, variables) => {
      // Update cache directly without refetch to preserve UI state (page, panel)
      // This prevents panel closure when adding notes
      
      // Update all leads queries - add the note to the lead's notes array
      queryClient.setQueriesData(
        { queryKey: queryKeys.leads },
        (oldData: any) => {
          if (!oldData) return oldData;
          
          const leads = oldData.leads || oldData.data || [];
          const updatedLeads = leads.map((lead: any) => {
            if (lead.id === variables.leadId) {
              const newNote = result.note || {
                id: Date.now().toString(),
                content: variables.content,
                noteType: variables.noteType,
                createdAt: new Date().toISOString(),
                leadId: variables.leadId
              };
              return {
                ...lead,
                notes: [...(lead.notes || []), newNote]
              };
            }
            return lead;
          });
          
          return {
            ...oldData,
            leads: updatedLeads,
            data: updatedLeads
          };
        }
      );
      
      // Update individual lead query
      queryClient.setQueryData(
        queryKeys.lead(variables.leadId),
        (oldData: any) => {
          if (!oldData) return oldData;
          const newNote = result.note || {
            id: Date.now().toString(),
            content: variables.content,
            noteType: variables.noteType,
            createdAt: new Date().toISOString(),
            leadId: variables.leadId
          };
          return {
            ...oldData,
            notes: [...(oldData.notes || []), newNote]
          };
        }
      );
    },
  });
};

// Notifications Hooks
export const useNotifications = () => {
  return useQuery({
    queryKey: queryKeys.notifications,
    queryFn: async () => {
      const apiClient = getApiClient();
      return apiClient.getNotifications();
    },
    staleTime: 1000 * 60 * 1, // 1 minute
    refetchInterval: 1000 * 60 * 1, // Auto-refetch every 1 minute
  });
};
