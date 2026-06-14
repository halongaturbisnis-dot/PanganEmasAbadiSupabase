/**
 * Database client bridge
 * Acts as a centralized logic layer for database interactions.
 */

import { apiClient } from '../api/client.js';

export const dbClient = {
  /**
   * Executes a raw SQL query via the server-side proxy.
   * This provides a compatibility layer for Supabase migration while preserving raw SQL support.
   * @param sql The SQL statement to execute.
   * @param args Optional arguments for the query.
   */
  query: async (sql: string, args: any[] = []) => {
    try {
      // Direct call to our backend proxy which handles Supabase/Turso switching
      const result = await apiClient.post<any>('/api/db/query', { sql, args });
      return result;
    } catch (error) {
      console.error('Database Client Error (Proxy):', error);
      throw error;
    }
  }
};
