import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Add cache-busting for pricing-sensitive endpoints
    const url = queryKey.join("/") as string;
    const isPricingSensitive = url.includes("/spaces") || url.includes("/bundles");
    const fetchUrl = isPricingSensitive ? `${url}?t=${Date.now()}` : url;
    
    const res = await fetch(fetchUrl, {
      credentials: "include",
      cache: "no-cache", // Force fresh fetch
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 30000, // 30 seconds instead of Infinity
      gcTime: 60000, // 1 minute garbage collection
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

// Utility function to clear all pricing-related cache
export const clearPricingCache = () => {
  queryClient.invalidateQueries({ queryKey: ["/api/spaces"] });
  queryClient.invalidateQueries({ queryKey: ["/api/bundles"] });
  queryClient.removeQueries({ queryKey: ["/api/spaces"] });
  queryClient.removeQueries({ queryKey: ["/api/bundles"] });
};
