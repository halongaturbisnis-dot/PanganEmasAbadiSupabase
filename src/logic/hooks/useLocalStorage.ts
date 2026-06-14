import { useState, useCallback } from 'react';
import { browserStorage } from '../utils/browserStorage';

/**
 * HOOKS/USELOCALSTORAGE.TS
 * A hook that syncs state with LocalStorage.
 */

export function useLocalStorage<T>(key: string, initialValue: T) {
  // Pass initial state function to useState so logic is only executed once
  const [storedValue, setStoredValue] = useState<T>(() => {
    const item = browserStorage.get<T>(key);
    return item !== null ? item : initialValue;
  });

  // Return a wrapped version of useState's setter function that
  // persists the new value to localStorage.
  const setValue = useCallback((value: T | ((val: T) => T), ttl?: number) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // Save state
      setStoredValue(valueToStore);
      
      // Save to local storage
      browserStorage.set(key, valueToStore, ttl);
    } catch (error) {
      console.error(error);
    }
  }, [key, storedValue]);

  const removeItem = useCallback(() => {
    browserStorage.remove(key);
    setStoredValue(initialValue);
  }, [key, initialValue]);

  return [storedValue, setValue, removeItem] as const;
}
