import { useState, useCallback, useEffect, useRef } from 'react';
import { getPageFetchLimit } from '../services/fetchingCenter';
import { useInfiniteScroll } from './useInfiniteScroll';

interface LazyFetchOptions<T> {
  pageKey: string;
  initialData?: T[];
  enabled?: boolean;
}

/**
 * HOOKS/USELAZYFETCH.TS
 * Specialized hook for Lazy Loading (Method 2) with integrated FetchingCenter.
 */
export function useLazyFetch<T>(
  fetchFn: (page: number, limit: number, signal?: AbortSignal) => Promise<{ data: T[]; total: number }>,
  options: LazyFetchOptions<T>
) {
  const [data, setData] = useState<T[]>(options.initialData || []);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const limit = getPageFetchLimit(options.pageKey);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchMore = useCallback(async (isInitial = false) => {
    if (!hasMore && !isInitial) return;
    
    // Cleanup previous request if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const currentPage = isInitial ? 1 : page;
      const result = await fetchFn(currentPage, limit, controller.signal);
      
      setData(prev => isInitial ? result.data : [...prev, ...result.data]);
      setTotal(result.total);
      setHasMore(data.length + result.data.length < result.total);
      setPage(prev => isInitial ? 2 : prev + 1);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    }
  }, [fetchFn, limit, page, hasMore, data.length]);

  // Use the underlying UI hook for intersection detection
  const { observerTarget, isLoading } = useInfiniteScroll(
    () => fetchMore(),
    { disabled: !hasMore || options.enabled === false }
  );

  // Initial load
  useEffect(() => {
    if (options.enabled !== false) {
      fetchMore(true);
    }
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [options.enabled]);

  const refresh = useCallback(() => {
    setPage(1);
    setHasMore(true);
    fetchMore(true);
  }, [fetchMore]);

  return {
    data,
    isLoading,
    total,
    hasMore,
    error,
    observerTarget,
    refresh
  };
}
