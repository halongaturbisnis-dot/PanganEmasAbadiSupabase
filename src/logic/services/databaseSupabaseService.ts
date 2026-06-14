import { config } from '../utils/config.js';
import postgres from 'postgres';
import fs from 'fs';
import path from 'path';

/**
 * SERVICES/DATABASESUPABASESERVICE.TS
 * Service to handle Supabase/PostgreSQL specific operations including schema migration.
 */

export const databaseSupabaseService = {
  /**
   * Synchronizes all database schemas to Supabase
   */
  async syncToSupabase(): Promise<{ success: boolean; message: string; details: any[] }> {
    const details: any[] = [];
    const connectionString = process.env.SUPABASE_DATABASE_URL;
    
    if (!connectionString) {
      return { success: false, message: 'SUPABASE_DATABASE_URL is not configured', details };
    }

    const sql = postgres(connectionString, { ssl: 'require' });

    try {
      const databaseDir = path.join(process.cwd(), 'database');
      if (!fs.existsSync(databaseDir)) {
        throw new Error('Database directory not found');
      }

      // Preparation: Ensure extensions
      // gen_random_uuid in PG 13+ is built-in, but pgcrypto sometimes needed for older or specific funcs.
      // We also ensure common functions
      await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`;
      await sql`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`;

      // Helper function for triggers
      await sql.unsafe(`
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = CURRENT_TIMESTAMP;
            RETURN NEW;
        END;
        $$ language 'plpgsql';
      `);

      const files = fs.readdirSync(databaseDir)
        .filter(f => f.endsWith('.sql'))
        .sort((a, b) => {
          // Priority to StokBerjalan as it is referenced by many
          if (a.toLowerCase().includes('berjalan')) return -1;
          if (b.toLowerCase().includes('berjalan')) return 1;
          return a.localeCompare(b);
        });

      for (const file of files) {
        try {
          const content = fs.readFileSync(path.join(databaseDir, file), 'utf-8');
          
          // Execute the content directly as it's already in PG dialect
          // We split by semicolons if needed? Postgres lib handles multi-statement in unsafe()
          await sql.unsafe(content);

          details.push({ file, status: 'SUCCESS' });
        } catch (err: any) {
          console.error(`Migration error in ${file}:`, err.message);
          details.push({ file, status: 'FAILED', error: err.message });
        }
      }

      const allSuccess = details.every(d => d.status === 'SUCCESS');
      return { 
        success: allSuccess, 
        message: allSuccess ? 'Penyelarasan skema database Supabase berhasil' : 'Beberapa skema gagal diselaraskan',
        details 
      };
    } catch (error: any) {
      return { success: false, message: error.message, details };
    } finally {
      await sql.end();
    }
  }
};
