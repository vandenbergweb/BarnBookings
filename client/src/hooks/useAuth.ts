import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { clearPricingCache } from "../lib/queryClient";

export function useAuth() {
  const { data: user, isLoading, error, refetch } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: (failureCount, error: any) => {
      // Retry once for potential session timing issues
      if (failureCount < 1 && error?.status !== 401) {
        console.log('Retrying auth check due to network error');
        return true;
      }
      return false;
    },
    retryDelay: 1000,
    staleTime: 0, // Always fresh check
    gcTime: 0, // Don't cache
  });

  // Clear pricing cache when user authentication succeeds
  useEffect(() => {
    if (user && !isLoading) {
      console.log('Authentication successful, clearing pricing cache for fresh data');
      clearPricingCache();
    }
  }, [!!user, isLoading]); // Use !!user to avoid dependency array issues

  // Debug logging
  console.log('useAuth hook:', {
    hasUser: !!user,
    isLoading,
    hasError: !!error,
    errorStatus: (error as any)?.status,
    timestamp: new Date().toISOString()
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
    refetch
  };
}
