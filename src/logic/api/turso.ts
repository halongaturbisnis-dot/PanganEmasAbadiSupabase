import { createClient, Client } from "@libsql/client/web";
import { config } from "../utils/config.js";

let clientInstance: Client | null = null;

/**
 * Lazy Initializer for Turso DB Client
 * Prevents crash if env variables are missing at startup.
 */
export const getTursoClient = (): Client => {
  if (clientInstance) return clientInstance;

  const { url, authToken } = config.turso;

  if (!url) {
    console.warn("[Turso Warning]: Database URL is missing. Operations will fail.");
  }

  clientInstance = createClient({
    url: url || "",
    authToken: authToken || "",
  });

  return clientInstance;
};

/**
 * Generic requester for Turso LibSQL client
 */
export const tursoRequest = async (sql: string, args: any[] = []) => {
  const client = getTursoClient();
  try {
    const result = await client.execute({ sql, args });
    return result;
  } catch (error) {
    console.error("Turso Execution Error:", error);
    throw error;
  }
};
