import { QueryClient } from '@tanstack/react-query';

// ==========================================
// OPTIMIZED TANSTACK QUERY CONFIGURATION
// - Fast data access with intelligent caching
// - Minimal network requests
// - Instant UI updates
// ==========================================
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 3 minutes before considering it stale
      staleTime: 1000 * 60 * 3,
      
      // Keep unused data in cache for 15 minutes
      gcTime: 1000 * 60 * 15,
      
      // Only retry failed requests once to avoid delays
      retry: 1,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 3000),
      
      // Don't refetch when window regains focus (saves bandwidth)
      refetchOnWindowFocus: false,
      
      // Do refetch when connection is restored
      refetchOnReconnect: true,
      
      // Don't refetch on component mount if data exists
      refetchOnMount: false,
      
      // Network mode - online by default
      networkMode: 'online',
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
      
      // Network mode for mutations
      networkMode: 'online',
    },
  },
});
