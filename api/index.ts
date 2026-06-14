import "dotenv/config";
import express from "express";
import postgres from "postgres";
import { config } from "../src/logic/utils/config.js";
import { databaseActiveService } from "../src/logic/services/databaseActiveService.js";
import { dbClient as legacyDbClient } from "../src/logic/libs/database.js";
import { aiService } from "../src/logic/services/aiService.js";
import { getS3Client } from "../src/logic/libs/storageClient.js";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import type { Readable } from "stream";

// Initialize Postgres for Supabase
let sqlClient: any = null;
const getSqlClient = () => {
  if (sqlClient) return sqlClient;
  const { url } = config.supabase;
  if (!url) return null;
  
  // Transform Supabase URL to connection string if needed, 
  // but Supabase usually gives a connection string for direct Postgres.
  // Actually, we can use the project URL + service role key to connect via pooler if we have it,
  // or use the standard Postgres connection string from Supabase.
  // For now, let's assume VITE_SUPABASE_URL is the REST URL.
  // We actually need the Direct Connection String for 'postgres' library.
  // I'll check if we have a connection string env var.
  const connectionString = process.env.SUPABASE_DATABASE_URL || "";
  if (!connectionString) {
    console.warn("[Postgres Warning]: SUPABASE_DATABASE_URL is missing. Postgres operations will fail.");
    return null;
  }
  
  sqlClient = postgres(connectionString, {
    ssl: 'require',
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });
  return sqlClient;
};

// Validate config
config.validate();

const app = express();

// Migration block (same as server.ts)
let migrationPromise: Promise<void> | null = null;
async function runMigrations() {
  if (migrationPromise) return migrationPromise;
  migrationPromise = (async () => {
    const pg = getSqlClient();
    
    // Choose which client to use for internal migrations
    const executeQuery = async (sql: string, args: any[] = []) => {
      if (pg) {
        let pgSql = sql;
        let placeholderIndex = 1;
        while (pgSql.includes('?')) pgSql = pgSql.replace('?', `$${placeholderIndex++}`);
        return await pg.unsafe(pgSql, args);
      }
      return await legacyDbClient.query(sql, args);
    };

    const checkColumnExists = async (tableName: string, columnName: string) => {
      if (pg) {
        const result = await pg`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = ${tableName} AND column_name = ${columnName}
        `;
        return result.length > 0;
      } else {
        const tableInfo = await legacyDbClient.query(`PRAGMA table_info(${tableName})`);
        return (tableInfo?.rows || []).some((col: any) => col.name === columnName);
      }
    };

    try {
      if (await checkColumnExists("pemrosesan", "qty_masuk_stok") === false) {
        const type = pg ? "DOUBLE PRECISION" : "REAL";
        await executeQuery(`ALTER TABLE pemrosesan ADD COLUMN qty_masuk_stok ${type} NOT NULL DEFAULT 0`);
        console.log("[Migration] Column 'qty_masuk_stok' added successfully.");
      }
    } catch (err: any) {
      console.warn("[Migration Warning] Alter pemrosesan error:", err?.message || err);
    }

    try {
      if (await checkColumnExists("stok_berjalan", "is_active") === false) {
        const type = pg ? "BOOLEAN DEFAULT TRUE" : "INTEGER DEFAULT 1";
        await executeQuery(`ALTER TABLE stok_berjalan ADD COLUMN is_active ${type}`);
        console.log("[Migration] Column 'is_active' added successfully to stok_berjalan.");
      }
    } catch (err: any) {
      console.warn("[Migration Warning] Alter stok_berjalan error:", err?.message || err);
    }

    // Stok terbuang is already handled by main schema files, but we keep this for one-off automated safety
    // if not using the full sync yet.
    try {
      const exists = pg ? 
        (await pg`SELECT 1 FROM information_schema.tables WHERE table_name = 'stok_terbuang'`).length > 0 :
        false; // SQLite check is harder without a helper, but we usually run CREATE TABLE IF NOT EXISTS

      if (!exists) {
        if (pg) {
          // Skip if PG as it should come from the .sql file sync
        } else {
           await legacyDbClient.query(`
            CREATE TABLE IF NOT EXISTS stok_terbuang (
              id TEXT PRIMARY KEY DEFAULT (
                lower(hex(randomblob(4))) || '-' || 
                lower(hex(randomblob(2))) || '-4' || 
                substr(lower(hex(randomblob(2))), 2) || '-' || 
                substr('89ab', abs(random()) % 4 + 1, 1) || 
                substr(lower(hex(randomblob(2))), 2) || '-' || 
                lower(hex(randomblob(6)))
              ),
              sku TEXT NOT NULL,
              category TEXT NOT NULL,
              sub_category TEXT,
              name TEXT NOT NULL,
              unit TEXT NOT NULL,
              qty REAL NOT NULL CHECK(qty >= 0),
              price_per_unit_out REAL NOT NULL CHECK(price_per_unit_out >= 0),
              total_price_out REAL NOT NULL CHECK(total_price_out >= 0),
              proof_url TEXT,
              description TEXT,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              created_by TEXT,
              created_timezone TEXT DEFAULT 'Asia/Jakarta',
              updated_at DATETIME,
              updated_by TEXT,
              updated_timezone TEXT DEFAULT 'Asia/Jakarta',
              FOREIGN KEY (sku) REFERENCES stok_berjalan(sku) ON DELETE CASCADE ON UPDATE CASCADE
            )
          `);
          await legacyDbClient.query(`CREATE INDEX IF NOT EXISTS idx_stok_terbuang_sku ON stok_terbuang(sku)`);
        }
      }
    } catch (err: any) {
      console.error("[Migration Error] Stok terbuang check:", err?.message || err);
    }
  })();
  return migrationPromise;
}

// Middleware to run standard migrations in Vercel's serverless context asynchronously
app.use(async (req, res, next) => {
  runMigrations().catch(() => {});
  next();
});

// API routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

/**
 * DATABASE QUERY PROXY
 * Handles SQL queries from client services, converting them for Supabase/PostgreSQL compatibility.
 */
app.post("/api/db/query", express.json(), async (req, res) => {
  try {
    const { sql, args = [] } = req.body;
    if (!sql) return res.status(400).json({ error: "SQL query is required" });

    const pg = getSqlClient();
    
    // If we have Postgres enabled, use it
    if (pg) {
      // 1. Convert SQLite '?' placeholders to Postgres '$1, $2, ...'
      let pgSql = sql;
      let placeholderIndex = 1;
      while (pgSql.includes('?')) {
        pgSql = pgSql.replace('?', `$${placeholderIndex++}`);
      }

      // 2. Handle common SQLite/LibSQL quirks (e.g., randomblob for UUID)
      // If the query contains the complex randomblob UUID generator, replace with native PG gen_random_uuid()
      if (pgSql.includes('randomblob')) {
        pgSql = pgSql.replace(/\(lower\(hex\(randomblob\(4\)\)\).+?\)/g, 'gen_random_uuid()');
      }

      // 3. Execute on Postgres
      const results = await pg.unsafe(pgSql, args);
      
      // Postgrest/postgres returns results differently. Turso returns { rows: [] }.
      // We wrap it to maintain compatibility.
      return res.json({ 
        rows: Array.isArray(results) ? results : [results],
        columns: results.columns?.map((c: any) => ({ name: c.name })) || []
      });
    }

    // Fallback to legacy Turso if Postgres not configured
    const legacyResult = await legacyDbClient.query(sql, args);
    return res.json(legacyResult);

  } catch (error: any) {
    console.error("[Database Proxy Error]:", error?.message || error);
    res.status(500).json({ 
      error: "Gagal mengeksekusi query database", 
      message: error?.message || "Unknown Error" 
    });
  }
});

app.post("/api/ai/analyze-report", express.json(), async (req, res) => {
  try {
    const { startDate, endDate, mode, question, history } = req.body;
    if (!startDate || !endDate || typeof startDate !== 'string' || typeof endDate !== 'string') {
      res.status(400).json({ error: "Parameter startDate dan endDate wajib disertakan dalam format YYYY-MM-DD." });
      return;
    }

    const promptData = await aiService.generateFinancialReportPrompt(startDate, endDate);

    const stream = await aiService.streamAnalysis(
      promptData, 
      (mode as any) === 'deep' ? 'deep' : 'standard', 
      question,
      history
    );

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        if (trimmed === 'data: [DONE]') {
          res.write('data: [DONE]\n\n');
          continue;
        }
        if (trimmed.startsWith('data: ')) {
          try {
            const jsonStr = trimmed.slice(6);
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content || '';
            if (content) {
              res.write(`data: ${JSON.stringify({ content })}\n\n`);
            }
          } catch (e) {
            // Ignore
          }
        }
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err: any) {
    console.error("[AI Server Error]:", err?.message || err);
    if (!res.headersSent) {
      res.status(500).json({ error: err?.message || "Internal server error" });
    } else {
      res.write(`data: ${JSON.stringify({ error: err?.message || "Internal server error" })}\n\n`);
      res.end();
    }
  }
});

app.all("/api/ping", async (req, res) => {
  console.log("[Vercel CRON] Received keep-alive ping request");
  try {
    const result = await databaseActiveService.ping('CRON');
    res.json({ 
      success: true, 
      message: "Keep-alive ping processed", 
      result 
    });
  } catch (error: any) {
    console.error("[Vercel CRON Error]:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/database/ping", async (req, res) => {
  const result = await databaseActiveService.ping('MANUAL');
  res.json(result);
});

import { databaseSupabaseService } from "../src/logic/services/databaseSupabaseService.js";

// ... existing code ...

app.post("/api/db/sync", async (req, res) => {
  try {
    const { target = 'auto' } = req.query; // 'supabase', 'turso', or 'auto'
    
    let result;
    if (target === 'supabase' || (target === 'auto' && process.env.SUPABASE_DATABASE_URL)) {
      console.log("[Sync] Triggering Supabase Migration/Sync...");
      result = await databaseSupabaseService.syncToSupabase();
    } else {
      console.log("[Sync] Triggering Turso Sync...");
      result = await databaseActiveService.syncAllSchemas();
    }

    return res.json({
      success: result.success,
      message: result.message,
      details: result.details
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Gagal menyelaraskan database",
      error: error.message
    });
  }
});

app.get("/api/proxy-image", async (req, res) => {
  try {
    const { url } = req.query;
    if (!url || typeof url !== 'string') {
      res.status(400).send('No url provided');
      return;
    }
    const fetchResponse = await fetch(url);
    if (!fetchResponse.ok) {
      res.status(fetchResponse.status).send('Failed to fetch image');
      return;
    }
    
    // Support both Node native fetch (.arrayBuffer) and node-fetch v2 (.buffer)
    let buffer;
    if (typeof fetchResponse.arrayBuffer === 'function') {
      const ab = await fetchResponse.arrayBuffer();
      buffer = Buffer.from(ab);
    } else if (typeof (fetchResponse as any).buffer === 'function') {
      buffer = await (fetchResponse as any).buffer();
    } else {
      throw new Error('Unsupported fetch response type');
    }

    res.setHeader('Content-Type', fetchResponse.headers.get('content-type') || 'image/jpeg');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.send(buffer);
  } catch (err: any) {
    console.error("[Proxy Image Error]", err);
    res.status(500).send(err.message);
  }
});

// Tigris Private Storage Proxy
app.get("/api/images/*", async (req, res) => {
  try {
    const key = req.params[0];
    const bucketName = config.tigris.bucket;

    if (!bucketName) {
      console.error("[Tigris Proxy Error]: Bucket name is missing in configuration");
      res.status(500).send("Storage bucket not configured");
      return;
    }

    const s3Client = getS3Client();
    const response = await s3Client.send(new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    }));

    if (response.ContentType) res.setHeader("Content-Type", response.ContentType);
    if (response.ContentLength) res.setHeader("Content-Length", response.ContentLength);
    
    // Caching header for better performance
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");

    if (response.Body) {
      (response.Body as Readable).pipe(res);
    } else {
      res.status(404).send("File not found in storage body");
    }
  } catch (error: any) {
    if (error.name === "NoSuchKey") {
      res.status(404).send("File not found (NoSuchKey)");
    } else {
      console.error("[Tigris Proxy Error]:", error?.message || error);
      res.status(500).send(`Failed to fetch image from storage: ${error?.message || 'Unknown Error'}`);
    }
  }
});

export default app;
