import { useState, useEffect } from 'react';
import { api } from '../lib/api';

interface UseApiResult<T> {
  data: T | null;
  error: string | null;
  isLoading: boolean;
  refetch: () => void;
}

export function useApi<T>(url: string | null): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(!!url);
  const [counter, setCounter] = useState(0);

  useEffect(() => {
    if (!url) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    api.get<T>(url)
      .then((data: any) => setData(data.data || data))
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [url, counter]);

  return { data, error, isLoading, refetch: () => setCounter((c) => c + 1) };
}
