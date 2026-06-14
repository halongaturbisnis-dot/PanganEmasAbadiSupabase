/**
 * UTILS/DATA.TS
 * Pure utility functions for data transformation, searching, and sorting.
 */

// 1. Safe Deep Clone
export const deepClone = <T>(obj: T): T => {
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch {
    return obj;
  }
};

// 2. Debounce Function
export const debounce = <T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

// 3. Simple Search Filter
export const searchFilter = <T>(
  items: T[],
  query: string,
  keys: (keyof T)[]
): T[] => {
  if (!query) return items;
  const lowercaseQuery = query.toLowerCase();
  
  return items.filter((item) =>
    keys.some((key) => {
      const value = item[key];
      return value && String(value).toLowerCase().includes(lowercaseQuery);
    })
  );
};

// 4. Dynamic Sorter
export const dynamicSort = <T>(
  items: T[],
  key: keyof T,
  order: 'asc' | 'desc' = 'asc'
): T[] => {
  return [...items].sort((a, b) => {
    const valA = a[key];
    const valB = b[key];

    if (valA === valB) return 0;
    
    const comparison = valA > valB ? 1 : -1;
    return order === 'asc' ? comparison : -comparison;
  });
};

// 5. Group Array by Key
export const groupBy = <T>(
  items: T[],
  key: keyof T
): Record<string, T[]> => {
  return items.reduce((acc, item) => {
    const groupKey = String(item[key]);
    if (!acc[groupKey]) acc[groupKey] = [];
    acc[groupKey].push(item);
    return acc;
  }, {} as Record<string, T[]>);
};

// 6. Currency Formatter (Indonesian Desktop-First)
export const formatCurrency = (amount: number, locale: string = 'id-ID', currency: string = 'IDR'): string => {
  const formatted = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
  }).format(amount);
  
  // Ensure a space between the currency symbol and the nominal, if it lacks one
  return formatted.replace(/^([^\d\s]+)\s?([\d.,]+)/ui, '$1 $2');
};

// 7. Number Formatter (Thousands separator)
export const formatNumber = (num: number, locale: string = 'id-ID'): string => {
  return new Intl.NumberFormat(locale).format(num);
};

// 8. String Manipulators
export const toSlug = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-');
};

export const truncateText = (text: string, length: number, suffix: string = '...'): string => {
  if (text.length <= length) return text;
  return text.substring(0, length).trim() + suffix;
};

export const toTitleCase = (text: string): string => {
  return text.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());
};

// 9. UUID v4 Generator
export const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};
