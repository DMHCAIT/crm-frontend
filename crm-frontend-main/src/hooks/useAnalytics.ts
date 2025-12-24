// Hook for lead scoring and analytics
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getApiClient } from '../lib/backend';

// Fetch lead score
export const useLeadScore = (leadId: string | null) => {
  return useQuery({
    queryKey: ['leadScore', leadId],
    queryFn: async () => {
      if (!leadId) return null;
      const apiClient = getApiClient();
      const response = await apiClient.get(`/lead-scoring/${leadId}`);
      return response.data.data;
    },
    enabled: !!leadId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Calculate lead score
export const useCalculateLeadScore = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (leadId: string) => {
      const apiClient = getApiClient();
      const response = await apiClient.post('/lead-scoring/calculate', { leadId });
      return response.data.data;
    },
    onSuccess: (data, leadId) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['leadScore', leadId] });
    },
  });
};

// Calculate all lead scores
export const useCalculateAllScores = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (limit: number = 1000) => {
      const apiClient = getApiClient();
      const response = await apiClient.post('/lead-scoring/calculate-all', { limit });
      return response.data.data;
    },
    onSuccess: () => {
      // Invalidate all lead scores
      queryClient.invalidateQueries({ queryKey: ['leadScore'] });
      queryClient.invalidateQueries({ queryKey: ['topLeads'] });
      queryClient.invalidateQueries({ queryKey: ['atRiskLeads'] });
    },
  });
};

// Fetch top scoring leads
export const useTopLeads = (limit: number = 50) => {
  return useQuery({
    queryKey: ['topLeads', limit],
    queryFn: async () => {
      const apiClient = getApiClient();
      const response = await apiClient.get(`/lead-scoring/top-leads?limit=${limit}`);
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000,
  });
};

// Fetch at-risk leads (high churn)
export const useAtRiskLeads = (limit: number = 50) => {
  return useQuery({
    queryKey: ['atRiskLeads', limit],
    queryFn: async () => {
      const apiClient = getApiClient();
      const response = await apiClient.get(`/lead-scoring/at-risk?limit=${limit}`);
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000,
  });
};

// Track analytics event
export const useTrackEvent = () => {
  return useMutation({
    mutationFn: async (eventData: {
      type: string;
      leadId?: string;
      metadata?: any;
      duration?: number;
    }) => {
      const apiClient = getApiClient();
      const response = await apiClient.post('/analytics-events', eventData);
      return response.data.data;
    },
  });
};

// Track multiple events
export const useTrackEventBatch = () => {
  return useMutation({
    mutationFn: async (events: any[]) => {
      const apiClient = getApiClient();
      const response = await apiClient.post('/analytics-events/batch', { events });
      return response.data.data;
    },
  });
};

// Fetch analytics events
export const useAnalyticsEvents = (filters: {
  event_type?: string;
  user_id?: string;
  lead_id?: string;
  from_date?: string;
  to_date?: string;
  limit?: number;
  offset?: number;
}) => {
  const queryString = new URLSearchParams(
    Object.entries(filters).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null) {
        acc[key] = String(value);
      }
      return acc;
    }, {} as Record<string, string>)
  ).toString();

  return useQuery({
    queryKey: ['analyticsEvents', filters],
    queryFn: async () => {
      const apiClient = getApiClient();
      const response = await apiClient.get(`/analytics-events?${queryString}`);
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Fetch event summary
export const useEventSummary = (days: number = 30) => {
  return useQuery({
    queryKey: ['eventSummary', days],
    queryFn: async () => {
      const apiClient = getApiClient();
      const response = await apiClient.get(`/analytics-events/summary?days=${days}`);
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000,
  });
};

// Fetch recent activities
export const useRecentActivities = (limit: number = 50) => {
  return useQuery({
    queryKey: ['recentActivities', limit],
    queryFn: async () => {
      const apiClient = getApiClient();
      const response = await apiClient.get(`/analytics-events/recent?limit=${limit}`);
      return response.data.data;
    },
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

// Fetch user activity
export const useUserActivity = (userId?: string, days: number = 7) => {
  return useQuery({
    queryKey: ['userActivity', userId, days],
    queryFn: async () => {
      const apiClient = getApiClient();
      const url = userId 
        ? `/analytics-events/user-activity?user_id=${userId}&days=${days}`
        : `/analytics-events/user-activity?days=${days}`;
      const response = await apiClient.get(url);
      return response.data.data;
    },
    enabled: !!userId || days > 0,
    staleTime: 2 * 60 * 1000,
  });
};

// Fetch revenue forecast
export const useRevenueForecast = () => {
  return useQuery({
    queryKey: ['revenueForecast'],
    queryFn: async () => {
      const apiClient = getApiClient();
      const response = await apiClient.get('/enhanced-analytics/revenue-forecast');
      return response.data.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Fetch pipeline velocity
export const usePipelineVelocity = (days: number = 90) => {
  return useQuery({
    queryKey: ['pipelineVelocity', days],
    queryFn: async () => {
      const apiClient = getApiClient();
      const response = await apiClient.get(`/enhanced-analytics/pipeline-velocity?days=${days}`);
      return response.data.data;
    },
    staleTime: 10 * 60 * 1000,
  });
};

export default {
  useLeadScore,
  useCalculateLeadScore,
  useCalculateAllScores,
  useTopLeads,
  useAtRiskLeads,
  useTrackEvent,
  useTrackEventBatch,
  useAnalyticsEvents,
  useEventSummary,
  useRecentActivities,
  useUserActivity,
  useRevenueForecast,
  usePipelineVelocity,
};
