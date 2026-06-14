/**
 * SERVICES/DATASERVICE.TS
 * High-level services for data management, caching, and mapping.
 */

import { browserStorage } from '../utils/browserStorage.js';

// 1. Data Cache Wrapper
export const cacheData = <T>(key: string, data: T, expiryMinutes: number = 60) => {
  const cacheObj = {
    value: data,
    expiry: Date.now() + expiryMinutes * 60 * 1000,
  };
  browserStorage.set(key, cacheObj);
};

// 2. Get Cached Data
export const getCachedData = <T>(key: string): T | null => {
  const cacheObj = browserStorage.get<{ value: T; expiry: number }>(key);
  if (!cacheObj) return null;

  if (Date.now() > cacheObj.expiry) {
    browserStorage.remove(key);
    return null;
  }
  return cacheObj.value;
};

// 3. Batch Action Processor
export const processBatch = async <T, R>(
  items: T[],
  action: (item: T) => Promise<R>,
  concurrency: number = 3
): Promise<R[]> => {
  const results: R[] = [];
  const chunks = [];
  
  for (let i = 0; i < items.length; i += concurrency) {
    chunks.push(items.slice(i, i + concurrency));
  }

  for (const chunk of chunks) {
    const chunkResults = await Promise.all(chunk.map(action));
    results.push(...chunkResults);
  }

  return results;
};

// 4. Transform API Response to Frontend Model
// (Place for mapping complex backend data to simple UI objects)
export const mapResponseToModel = <T, R>(data: T, mapper: (input: T) => R): R => {
  return mapper(data);
};
