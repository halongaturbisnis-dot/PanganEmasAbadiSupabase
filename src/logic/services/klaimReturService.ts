import { dbClient } from '../libs/database';
import { getTursoClient } from '../api/turso';
import { ITs_KlaimRetur, ITs_KlaimReturItem } from '../types/ITs_KlaimRetur';
import { generateUUID } from '../utils/data';
import { errorService } from './errorService';
import { browserStorage } from '../utils/browserStorage';
import { getTimezoneIdentifier } from '../utils/time';
import { IAkunSession } from '../types/ITs_Akun';
import { ITs_Penjualan, ITs_PenjualanProduk } from '../types/ITs_Penjualan';

/**
 * KLAIM RETUR SERVICE
 * Logic for Return Claim module, including invoice selection and item mapping.
 */

export const klaimReturService = {
  /**
   * Fetch paginated list of Return Claims
   */
  async getPaginated(
    page: number = 1,
    limit: number = 15,
    search: string = '',
    status?: string,
    sortBy: string = 'datetime',
    sortOrder: 'asc' | 'desc' = 'desc',
    startDate?: string,
    endDate?: string
  ): Promise<{ items: (ITs_KlaimRetur & { customer_name?: string })[]; total: number }> {
    await this._initializeTables();
    const offset = (page - 1) * limit;
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    const countParams: any[] = [];

    if (search) {
      whereClause += ` AND (kr.invoice_number LIKE ? OR kr.description LIKE ?)`;
      const s = `%${search}%`;
      params.push(s, s);
      countParams.push(s, s);
    }

    if (status) {
      whereClause += ` AND kr.status = ?`;
      params.push(status);
      countParams.push(status);
    }

    if (startDate) {
      whereClause += ` AND date(kr.datetime) >= ?`;
      params.push(startDate);
      countParams.push(startDate);
    }

    if (endDate) {
      whereClause += ` AND date(kr.datetime) <= ?`;
      params.push(endDate);
      countParams.push(endDate);
    }

    // Validate sort column to prevent SQL injection
    const allowedSortCols = ['datetime', 'invoice_number', 'status', 'id'];
    const finalSortBy = allowedSortCols.includes(sortBy) ? sortBy : 'datetime';
    
    const sqlData = `
      SELECT kr.*, c.name as customer_name
      FROM klaim_retur kr
      LEFT JOIN customer c ON kr.customer_id = c.id
      ${whereClause} 
      ORDER BY kr.${finalSortBy} ${sortOrder === 'asc' ? 'ASC' : 'DESC'} 
      LIMIT ? OFFSET ?
    `;
    const sqlCount = `SELECT COUNT(*) as total FROM klaim_retur kr ${whereClause}`;

    params.push(limit, offset);

    try {
      const [dataRes, countRes] = await Promise.all([
        dbClient.query(sqlData, params),
        dbClient.query(sqlCount, countParams)
      ]);

      const items = (dataRes.rows as any[]).map(row => row) as (ITs_KlaimRetur & { customer_name?: string })[];
      const total = Number((countRes.rows[0] as any).total || 0);

      return { items, total };
    } catch (error) {
      errorService.handle(error);
      return { items: [], total: 0 };
    }
  },

  /**
   * Get full details of a Return Claim including its items
   */
  async getById(id: string): Promise<ITs_KlaimRetur | null> {
    await this._initializeTables();
    try {
      const sqlHeader = `
        SELECT kr.*, c.name as customer_name, p.invoice_number as penjualan_invoice
        FROM klaim_retur kr
        LEFT JOIN customer c ON kr.customer_id = c.id
        LEFT JOIN penjualan p ON kr.penjualan_id = p.id
        WHERE kr.id = ?
        LIMIT 1
      `;
      const headerRes = await dbClient.query(sqlHeader, [id]);
      if (headerRes.rows.length === 0) return null;

      const claim = headerRes.rows[0] as any as ITs_KlaimRetur;

      const itemsRes = await dbClient.query(`SELECT * FROM klaim_retur_item WHERE klaim_retur_id = ?`, [id]);
      claim.items = (itemsRes.rows as any[]).map(row => row) as ITs_KlaimReturItem[];

      return claim;
    } catch (error) {
      errorService.handle(error);
      return null;
    }
  },

  /**
   * Create a new Return Claim with items in a transaction
   */
  async create(data: Partial<ITs_KlaimRetur>, items: Partial<ITs_KlaimReturItem>[]): Promise<ITs_KlaimRetur | null> {
    await this._initializeTables();
    const client = getTursoClient();
    const claimId = generateUUID();
    const session = this._getCurrentSession();
    const timezone = getTimezoneIdentifier();

    // Calculate sum total refund from items
    const sum_total_refund_nominal = items.reduce((acc, item) => {
        if (item.policy === 'Refund') {
            return acc + (item.refund_nominal || 0);
        }
        return acc;
    }, 0);

    const queries: any[] = [];

    // 1. Insert Header
    queries.push({
      sql: `INSERT INTO klaim_retur (
        id, datetime, invoice_number, penjualan_id, customer_id,
        sum_total_refund_nominal, description, proof_url, status,
        created_by, created_timezone
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        claimId, 
        data.datetime || new Date().toISOString(), 
        data.invoice_number, 
        data.penjualan_id, 
        data.customer_id,
        sum_total_refund_nominal, 
        data.description || null, 
        data.proof_url || null, 
        data.status || 'Pending',
        session?.user_id || null, 
        timezone
      ]
    });

    // 2. Insert Items
    for (const item of items) {
      queries.push({
        sql: `INSERT INTO klaim_retur_item (
          id, klaim_retur_id, penjualan_produk_id, name, unit, qty,
          reason, proof_url, policy, refund_nominal,
          created_by, created_timezone
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          generateUUID(), 
          claimId, 
          item.penjualan_produk_id, 
          item.name, 
          item.unit, 
          item.qty,
          item.reason || null, 
          item.proof_url || null, 
          item.policy || 'Refund', 
          item.refund_nominal || 0,
          session?.user_id || null, 
          timezone
        ]
      });
    }

    try {
      await client.batch(queries, "write");
      return this.getById(claimId);
    } catch (error) {
      errorService.handle(error);
      return null;
    }
  },

  /**
   * Update a Return Claim (Header + Refresh Items)
   */
  async update(id: string, data: Partial<ITs_KlaimRetur>, items?: Partial<ITs_KlaimReturItem>[]): Promise<ITs_KlaimRetur | null> {
    await this._initializeTables();
    const client = getTursoClient();
    const session = this._getCurrentSession();
    const timezone = getTimezoneIdentifier();
    const queries: any[] = [];

    // Calculate sum total if items are provided
    let sumTotal = data.sum_total_refund_nominal;
    if (items) {
        sumTotal = items.reduce((acc, item) => {
            if (item.policy === 'Refund') return acc + (item.refund_nominal || 0);
            return acc;
        }, 0);
    }

    // 1. Prepare Header Update
    const updates: string[] = [];
    const args: any[] = [];
    const fieldsMap: Record<string, any> = {
      description: data.description,
      proof_url: data.proof_url,
      status: data.status,
      sum_total_refund_nominal: sumTotal,
      updated_by: session?.user_id || null,
      updated_timezone: timezone
    };

    for (const [key, val] of Object.entries(fieldsMap)) {
      if (val !== undefined) {
        updates.push(`${key} = ?`);
        args.push(val);
      }
    }

    if (updates.length > 0) {
      args.push(id);
      queries.push({
        sql: `UPDATE klaim_retur SET ${updates.join(', ')} WHERE id = ?`,
        args
      });
    }

    // 2. Refresh Items if provided
    if (items) {
      queries.push({ sql: `DELETE FROM klaim_retur_item WHERE klaim_retur_id = ?`, args: [id] });
      for (const item of items) {
        queries.push({
          sql: `INSERT INTO klaim_retur_item (
            id, klaim_retur_id, penjualan_produk_id, name, unit, qty,
            reason, proof_url, policy, refund_nominal,
            created_by, created_timezone
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            generateUUID(), 
            id, 
            item.penjualan_produk_id, 
            item.name, 
            item.unit, 
            item.qty,
            item.reason || null, 
            item.proof_url || null, 
            item.policy || 'Refund', 
            item.refund_nominal || 0,
            session?.user_id || null, 
            timezone
          ]
        });
      }
    }

    try {
      if (queries.length > 0) {
        await client.batch(queries, "write");
      }
      return this.getById(id);
    } catch (error) {
      errorService.handle(error);
      return null;
    }
  },

  /**
   * Delete Many Return Claims
   */
  async deleteMany(ids: string[]): Promise<boolean> {
    await this._initializeTables();
    try {
      const sql = `DELETE FROM klaim_retur WHERE id IN (${ids.map(() => '?').join(',')})`;
      await dbClient.query(sql, ids);
      return true;
    } catch (error) {
      errorService.handle(error);
      return false;
    }
  },

  /**
   * Delete Return Claim
   */
  async delete(id: string): Promise<boolean> {
    await this._initializeTables();
    try {
      await dbClient.query(`DELETE FROM klaim_retur WHERE id = ?`, [id]);
      return true;
    } catch (error) {
      errorService.handle(error);
      return false;
    }
  },

  /**
   * HELPER: Get Approved Invoices for selection
   */
  async getApprovedInvoices(search: string = ''): Promise<ITs_Penjualan[]> {
    await this._initializeTables();
    try {
      let sql = `
        SELECT p.*, c.name as customer_name, c.id as customer_id
        FROM penjualan p
        LEFT JOIN customer c ON p.customer_id = c.id
        WHERE p.approval_status = 'Approved'
      `;
      const params: any[] = [];
      if (search) {
        sql += ` AND (p.invoice_number LIKE ?)`;
        params.push(`%${search}%`);
      }
      sql += ` ORDER BY p.datetime DESC LIMIT 20`;
      
      const res = await dbClient.query(sql, params);
      return res.rows as any[];
    } catch (error) {
      errorService.handle(error);
      return [];
    }
  },

  /**
   * HELPER: Get Products for a specific invoice
   */
  async getInvoiceProducts(penjualan_id: string): Promise<ITs_PenjualanProduk[]> {
    try {
      const sql = `SELECT * FROM penjualan_produk WHERE penjualan_id = ?`;
      const res = await dbClient.query(sql, [penjualan_id]);
      return res.rows as any[];
    } catch (error) {
      errorService.handle(error);
      return [];
    }
  },

  /**
   * Helper: Get current active session
   */
  _getCurrentSession(): IAkunSession | null {
    return browserStorage.get<IAkunSession>('active_user');
  },

  _initPromise: null as Promise<void> | null,

  /**
   * Initialization: Ensures tables exist
   */
  async _initializeTables() {
    if (this._initPromise) return this._initPromise;

    this._initPromise = (async () => {
      try {
        // Check if table exists
        const check = await dbClient.query("SELECT name FROM sqlite_master WHERE type='table' AND name='klaim_retur'");
        if (check.rows.length === 0) {
          console.log("Initializing Klaim Retur Tables...");
          const queries = [
            `CREATE TABLE IF NOT EXISTS klaim_retur (
                id TEXT PRIMARY KEY,
                datetime DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                invoice_number TEXT NOT NULL,
                penjualan_id TEXT NOT NULL,
                customer_id TEXT NOT NULL,
                sum_total_refund_nominal REAL NOT NULL DEFAULT 0,
                description TEXT,
                proof_url TEXT,
                status TEXT DEFAULT 'Pending' CHECK(status IN ('Pending', 'Approved', 'Rejected', 'Completed')),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                created_by TEXT,
                created_timezone TEXT DEFAULT 'Asia/Jakarta',
                updated_at DATETIME,
                updated_by TEXT,
                updated_timezone TEXT DEFAULT 'Asia/Jakarta',
                FOREIGN KEY (penjualan_id) REFERENCES penjualan(id) ON DELETE CASCADE ON UPDATE CASCADE,
                FOREIGN KEY (customer_id) REFERENCES customer(id) ON DELETE CASCADE ON UPDATE CASCADE
            )`,
            `CREATE INDEX IF NOT EXISTS idx_klaim_retur_invoice_number ON klaim_retur(invoice_number)`,
            `CREATE INDEX IF NOT EXISTS idx_klaim_retur_penjualan_id ON klaim_retur(penjualan_id)`,
            `CREATE INDEX IF NOT EXISTS idx_klaim_retur_customer_id ON klaim_retur(customer_id)`,
            `CREATE TABLE IF NOT EXISTS klaim_retur_item (
                id TEXT PRIMARY KEY,
                klaim_retur_id TEXT NOT NULL,
                penjualan_produk_id TEXT NOT NULL,
                name TEXT NOT NULL,
                unit TEXT NOT NULL,
                qty REAL NOT NULL,
                reason TEXT,
                proof_url TEXT,
                policy TEXT NOT NULL CHECK(policy IN ('Replace', 'Refund')),
                refund_nominal REAL DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                created_by TEXT,
                created_timezone TEXT DEFAULT 'Asia/Jakarta',
                updated_at DATETIME,
                updated_by TEXT,
                updated_timezone TEXT DEFAULT 'Asia/Jakarta',
                FOREIGN KEY (klaim_retur_id) REFERENCES klaim_retur(id) ON DELETE CASCADE ON UPDATE CASCADE,
                FOREIGN KEY (penjualan_produk_id) REFERENCES penjualan_produk(id) ON DELETE CASCADE ON UPDATE CASCADE
            )`,
            `CREATE INDEX IF NOT EXISTS idx_klaim_retur_item_header ON klaim_retur_item(klaim_retur_id)`,
            `CREATE INDEX IF NOT EXISTS idx_klaim_retur_item_produk ON klaim_retur_item(penjualan_produk_id)`
          ];
          
          const client = getTursoClient();
          await client.batch(queries.map(q => ({ sql: q, args: [] })), "write");
          console.log("Klaim Retur Tables Initialized Successfully.");
        }
      } catch (error) {
        console.error("Failed to initialize Klaim Retur tables:", error);
        this._initPromise = null; // Reset promise to allow retry
        throw error;
      }
    })();

    return this._initPromise;
  }
};
