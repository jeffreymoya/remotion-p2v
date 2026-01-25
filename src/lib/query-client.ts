import { QueryClient } from "@tanstack/react-query";

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Stale after 30 seconds
        staleTime: 30 * 1000,
        // Cache for 5 minutes
        gcTime: 5 * 60 * 1000,
        // Retry once on failure
        retry: 1,
        // Refetch on window focus in production only
        refetchOnWindowFocus: process.env.NODE_ENV === "production",
      },
      mutations: {
        // Retry mutations once
        retry: 1,
      },
    },
  });
}
