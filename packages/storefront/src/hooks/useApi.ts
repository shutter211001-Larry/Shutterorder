import useSWR, { preload } from 'swr';
import { api } from '../lib/api';

interface UseApiResult<T> {
  data: T | null;
  error: string | null;
  isLoading: boolean;
  refetch: () => void;
}

const fetcher = (url: string) => api.get<any>(url).then(res => res.data || res);

export function preloadApi(url: string) {
  preload(url, fetcher);
}

export function useApi<T>(url: string | null): UseApiResult<T> {
  const { data, error, isLoading, mutate } = useSWR<T>(url, url ? fetcher : null, {
    revalidateOnFocus: false, // Don't aggressively revalidate on tab focus to save bandwidth
    keepPreviousData: true,   // Keep old data while fetching new to prevent UI flashing
  });

  return { 
    data: data || null, 
    error: error?.message || null, 
    isLoading, 
    refetch: () => mutate() 
  };
}
