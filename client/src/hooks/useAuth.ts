import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    staleTime: 0, // Always fresh check
    gcTime: 0, // Don't cache
  });

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
    error
  };
}
