import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../utils/config.js';

/**
 * API/SUPABASE.TS
 * Supabase client initialization with Lazy Initialization.
 */

let supabaseInstance: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient => {
  if (supabaseInstance) return supabaseInstance;

  const { url, anonKey, serviceRoleKey } = config.supabase;
  const key = serviceRoleKey || anonKey;

  if (!url || !key) {
    console.warn("[Supabase Warning]: Supabase URL or Key is missing.");
  }

  supabaseInstance = createClient(url || '', key || '');
  return supabaseInstance;
};
