/**
 * Environment Configuration Validator
 */

export const config = {
  geminiApiKey: typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : '',
  groqApiKey: typeof process !== 'undefined' ? process.env.GROQ_API_KEY : '',
  // @ts-ignore
  appUrl: (import.meta as any).env?.VITE_APP_URL || (typeof process !== 'undefined' ? (process.env.VITE_APP_URL || process.env.APP_URL) : ''),
  
  tigris: {
    // @ts-ignore
    bucket: (import.meta as any).env?.VITE_TIGRIS_STORAGE_BUCKET || (typeof process !== 'undefined' ? (process.env.VITE_TIGRIS_STORAGE_BUCKET || process.env.TIGRIS_STORAGE_BUCKET) : ''),
    // @ts-ignore
    endpoint: (import.meta as any).env?.VITE_TIGRIS_STORAGE_ENDPOINT || (typeof process !== 'undefined' ? (process.env.VITE_TIGRIS_STORAGE_ENDPOINT || process.env.TIGRIS_STORAGE_ENDPOINT) : ''),
    // @ts-ignore
    accessKeyId: (import.meta as any).env?.VITE_TIGRIS_STORAGE_ACCESS_KEY_ID || (typeof process !== 'undefined' ? (process.env.VITE_TIGRIS_STORAGE_ACCESS_KEY_ID || process.env.TIGRIS_STORAGE_ACCESS_KEY_ID) : ''),
    // @ts-ignore
    secretAccessKey: (import.meta as any).env?.VITE_TIGRIS_STORAGE_SECRET_ACCESS_KEY || (typeof process !== 'undefined' ? (process.env.VITE_TIGRIS_STORAGE_SECRET_ACCESS_KEY || process.env.TIGRIS_STORAGE_SECRET_ACCESS_KEY) : ''),
  },

  turso: {
    // @ts-ignore
    url: (import.meta as any).env?.VITE_TURSO_DB_URL || (typeof process !== 'undefined' ? (process.env.VITE_TURSO_DB_URL || process.env.TURSO_DB_URL) : ''),
    // @ts-ignore
    authToken: (import.meta as any).env?.VITE_TURSO_DB_AUTH_TOKEN || (typeof process !== 'undefined' ? (process.env.VITE_TURSO_DB_AUTH_TOKEN || process.env.TURSO_DB_AUTH_TOKEN) : ''),
  },

  supabase: {
    // @ts-ignore
    url: (import.meta as any).env?.VITE_SUPABASE_URL || (typeof process !== 'undefined' ? (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL) : ''),
    // @ts-ignore
    anonKey: (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || (typeof process !== 'undefined' ? (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY) : ''),
    serviceRoleKey: typeof process !== 'undefined' ? process.env.SUPABASE_SERVICE_ROLE_KEY : '',
  },

  // @ts-ignore
  showDbSyncButton: (import.meta as any).env?.VITE_SHOW_DB_SYNC_BUTTON !== 'false',
  
  validate: () => {
    const isServer = typeof process !== 'undefined';
    
    // Server-only validation
    if (isServer) {
      const serverRequired = ['GEMINI_API_KEY'];
      serverRequired.forEach(key => {
        if (!process.env[key]) {
          console.warn(`[Config Warning]: Missing server-side environment variable ${key}`);
        }
      });
    }

    // Shared/Client validation (prefixed with VITE_)
    if (!config.supabase.url) console.warn('[Config Warning]: VITE_SUPABASE_URL is missing');
    if (!config.appUrl) console.warn('[Config Warning]: VITE_APP_URL is missing');
  }
};
