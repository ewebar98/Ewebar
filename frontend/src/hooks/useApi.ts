import { useQuery } from "@tanstack/react-query";

export function useApi<T>(key: string, fn: () => Promise<T>, deps: unknown[] = []) {
  // Generate a strictly unique and stable query key based on function code string and dependency inputs
  const fnKey = fn.toString().replace(/\s+/g, "");
  const queryKey = [fnKey, ...deps];

  const { data, isPending, error, refetch } = useQuery({
    queryKey,
    queryFn: fn,
    staleTime: 5 * 60 * 1000, // Cache results for 5 minutes before considering them stale
    gcTime: 10 * 60 * 1000,  // Keep unused cache data in memory for 10 minutes
    retry: 1, // Automatically retry failed queries once before showing an error
    refetchOnWindowFocus: false, // Disable automatic background fetches on window focus for consistent UX
  });

  return {
    data: data !== undefined ? (data as T) : null,
    loading: isPending,
    error: error as Error | null,
    refresh: refetch,
  };
}
