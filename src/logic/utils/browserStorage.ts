/**
 * UTILS/BROWSERSTORAGE.TS
 * Type-safe wrappers for LocalStorage and SessionStorage.
 */

export const browserStorage = {
  set: (key: string, value: any, ttl?: number): void => {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      const now = new Date();
      const item = {
        value,
        expiry: ttl ? now.getTime() + ttl : null,
      };
      localStorage.setItem(key, JSON.stringify(item));
    } catch (e) {
      console.error('Error saving to localStorage', e);
    }
  },

  get: <T>(key: string): T | null => {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    try {
      const value = localStorage.getItem(key);
      if (value === null) return null;

      const item = JSON.parse(value);
      const now = new Date();

      if (item.expiry && now.getTime() > item.expiry) {
        localStorage.removeItem(key);
        return null;
      }

      return item.value as T;
    } catch (e) {
      console.error('Error reading from localStorage', e);
      return null;
    }
  },

  remove: (key: string): void => {
    if (typeof window === 'undefined' || !window.localStorage) return;
    localStorage.removeItem(key);
  },

  clear: (): void => {
    if (typeof window === 'undefined' || !window.localStorage) return;
    localStorage.clear();
  },
};
