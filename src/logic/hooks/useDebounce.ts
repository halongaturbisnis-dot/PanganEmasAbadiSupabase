import { useState, useEffect } from 'react';

/**
 * HOOKS/USEDEBOUNCE.TS
 * A hook that delays the update of a value until after a specified delay.
 * Useful for search inputs to prevent excessive API calls.
 */

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Update debounced value after delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cancel the timeout if value changes (also on unmount)
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
