import { useState, useCallback } from 'react';

/**
 * HOOKS/USEASYNC.TS
 * A hook to handle asynchronous operations with loading and error states.
 */

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useAsync<T>(asyncFunction: (...args: any[]) => Promise<T>) {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(async (...args: any[]) => {
    setState({ data: null, loading: true, error: null });
    try {
      const response = await asyncFunction(...args);
      setState({ data: response, loading: false, error: null });
      return response;
    } catch (err: any) {
      setState({ data: null, loading: false, error: err.message || 'Something went wrong' });
      throw err;
    }
  }, [asyncFunction]);

  return { ...state, execute };
}
