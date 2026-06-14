/**
 * SERVICES/DATABASEACTIVESERVICE.TS
 * Service to handle database keep-alive (ping) logic.
 */

import { dbClient } from '../libs/database.js';

export const databaseActiveService = {
  /**
   * Performs a ping to the database by inserting a record into PingMonitoring.
   * @param triggeredBy The source of the trigger ('CRON', 'SYSTEM', 'MANUAL')
   */
  async ping(triggeredBy: string = 'CRON'): Promise<{ success: boolean; message: string }> {
    const sql = `
      INSERT INTO PingMonitoring (id, status, message, triggered_by, ping_at)
      VALUES ('singleton-ping-monitor', ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        status = excluded.status,
        message = excluded.message,
        triggered_by = excluded.triggered_by,
        ping_at = excluded.ping_at
    `;
    
    try {
      await dbClient.query(sql, ['SUCCESS', 'Database is active', triggeredBy]);
      console.log(`[${new Date().toISOString()}] Database Ping Successful triggered by ${triggeredBy}`);
      return { success: true, message: 'Ping successful' };
    } catch (error: any) {
      const errorMessage = error?.message || 'Unknown error occurred during ping';
      console.error(`[${new Date().toISOString()}] Database Ping Failed:`, errorMessage);
      
      // Fallback: log the failure if possible, or just return result
      try {
        // Attempt to log failure to DB (might fail if DB is down)
        await dbClient.query(sql, ['FAILED', errorMessage, triggeredBy]);
      } catch (innerError) {
        // Silent fail if DB is completely unreachable
      }
      
      return { success: false, message: errorMessage };
    }
  },

  /**
   * Gets the last successful ping time from the database.
   */
  async getLastPing() {
    const sql = `SELECT * FROM PingMonitoring WHERE status = 'SUCCESS' ORDER BY ping_at DESC LIMIT 1`;
    try {
      const result = await dbClient.query(sql);
      return result;
    } catch (error) {
      console.error('Failed to fetch last ping:', error);
      return null;
    }
  },

  /**
   * Synchronizes all database schemas from the /database folder
   */
  async syncAllSchemas(): Promise<{ success: boolean; message: string; details: any[] }> {
    const details: any[] = [];
    try {
      const fs = await import('fs');
      const path = await import('path');
      const { getTursoClient } = await import('../api/turso.js');

      const databaseDir = path.join(process.cwd(), 'database');
      if (!fs.existsSync(databaseDir)) {
        throw new Error(`Database directory not found at: ${databaseDir}`);
      }

      // Read all files in /database folder
      const files = fs.readdirSync(databaseDir);
      const sqlFiles = files
        .filter((file) => file.endsWith('.sql'))
        .sort((a, b) => {
          // Sort to run dependencies first if necessary (e.g., table with foreign keys after referenced tables)
          // For simplicity and standard alphabetical flow, PingMonitoring is usually at the end.
          if (a === 'PingMonitoring.sql') return 1;
          if (b === 'PingMonitoring.sql') return -1;
          return a.localeCompare(b);
        });

      const client = getTursoClient();

      for (const file of sqlFiles) {
        const filePath = path.join(databaseDir, file);
        const sqlContent = fs.readFileSync(filePath, 'utf-8');

        // Check if there are destructive SQL commands like dropping main tables without shadow patterns
        // Our SQL files use the "Shadow Table Re-creation" pattern, which is safe and idempotent.
        // We will execute the entire .sql file contents using executeMultiple to preserve triggers/transactions.
        try {
          await client.executeMultiple(sqlContent);
          details.push({
            file,
            status: 'SUCCESS',
            message: 'Successfully executed schema and structures'
          });
        } catch (execError: any) {
          console.error(`Failed to execute SQL file: ${file}`, execError);
          details.push({
            file,
            status: 'FAILED',
            message: execError?.message || 'Execution error'
          });
        }
      }

      const overallSuccess = details.every(d => d.status === 'SUCCESS');
      return {
        success: overallSuccess,
        message: overallSuccess ? 'All database schemas synced successfully.' : 'Some schemas failed to sync.',
        details
      };
    } catch (error: any) {
      console.error('Schema Sync Error:', error);
      return {
        success: false,
        message: error?.message || 'Internal error during synchronization',
        details
      };
    }
  }
};
