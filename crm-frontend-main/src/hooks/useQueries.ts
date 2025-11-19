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

// Leads Hooks - Optimized for performance
export const useLeads = () => {
  return useQuery({
    queryKey: queryKeys.leads,
    queryFn: async () => {
      const apiClient = getApiClient();
      const data = await apiClient.getLeads();
      console.log(`✅ Fetched ${Array.isArray(data) ? data.length : 0} leads from API`);
      return data;
    },
    staleTime: 1000 * 60 * 2, // Cache for 2 minutes
    gcTime: 1000 * 60 * 10, // Keep in cache for 10 minutes
    refetchInterval: false, // No automatic background refetching
    refetchOnMount: false, // Use cache on mount if available
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
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leads });
      queryClient.invalidateQueries({ queryKey: queryKeys.lead(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
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
