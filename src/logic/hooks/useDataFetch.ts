import { useState, useEffect, useCallback, useRef } from 'react';

interface DataFetchOptions {
  pollingInterval?: number;
  enabled?: boolean;
}

/**
 * Custom hook for fetching data with standard state management and cleanup.
 * Prevents memory leaks using AbortController.
 */
export function useDataFetch<T>(
  fetchFn: (signal?: AbortSignal) => Promise<T>,
  options: DataFetchOptions = { enabled: true }
) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(options.enabled ?? true);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async (isAutoRefresh = false) => {
    // Abort previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    if (!isAutoRefresh) setIsLoading(true);
    setError(null);

    try {
      const result = await fetchFn(controller.signal);
      setData(result);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, [fetchFn]);

  useEffect(() => {
    if (options.enabled === false) {
      setIsLoading(false);
      return;
    }

    fetchData();

    // Polling setup
    let interval: NodeJS.Timeout | null = null;
    if (options.pollingInterval) {
      interval = setInterval(() => fetchData(true), options.pollingInterval);
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (interval) clearInterval(interval);
    };
  }, [fetchData, options.enabled, options.pollingInterval]);

  return {
    data,
    isLoading,
    error,
    refetch: () => fetchData(),
  };
}
