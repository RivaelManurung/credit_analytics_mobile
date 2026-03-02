import { QueryClient } from '@tanstack/react-query';

/**
 * Global QueryClient instance.
 * Configuration:
 * - staleTime: 5 minutes (data stays "fresh" for 5 mins, no auto-refetch)
 * - gcTime: 10 minutes (cached data stays in memory for 10 mins)
 * - retry: false (for smoother UX, avoid infinite loading on simple failures)
 */
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5,
            gcTime: 1000 * 60 * 10,
            retry: 1,
            refetchOnWindowFocus: false,
        },
    },
});
