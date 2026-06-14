import { dbClient } from '../libs/database.js';
import { IPemasaran, IPemasaranActivityType } from '../types/ITs_Pemasaran.js';
import { errorService } from './errorService.js';
import { akunService } from './akunService.js';
import { generateUUID } from '../utils/data.js';
import { getPageFetchLimit } from './fetchingCenter.js';
import { getActualTime, getTimezoneIdentifier } from '../utils/time.js';
import { storageService } from './storage.js';
import { customerService } from './customerService.js';
import { ICustomer } from '../types/ITs_Customer.js';

export interface IPemasaranWithCustomer extends IPemasaran {
  customer_name: string;
  customer_company: string | null;
  customer_telepon?: string;
  customer_alamat?: string;
  customer_email?: string | null;
  customer_bidang_usaha?: string | null;
}

/**
 * PEMASARAN SERVICE
 * Backend logic for the Pemasaran (Marketing) module.
 * Standardized according to DatabaseRule.md, TimeRule.md, StorageRule.md, and FetchingRule.md.
 */
export const pemasaranService = {
  /**
   * Retrieves all pemasaran records with joined customer details.
   */
  async getAll(): Promise<IPemasaranWithCustomer[]> {
    const sql = `
      SELECT p.*, c.name as customer_name, c.company as customer_company, c.telepon as customer_telepon, c.alamat as customer_alamat, c.email as customer_email, c.bidang_usaha as customer_bidang_usaha
      FROM pemasaran p
      LEFT JOIN customer c ON p.customer_id = c.id
      ORDER BY p.visit_date DESC
    `;
    try {
      const result = await dbClient.query(sql);
      return result.rows as unknown as IPemasaranWithCustomer[];
    } catch (error) {
      errorService.handle(error);
      return [];
    }
  },

  /**
   * Retrieves paginated pemasaran records with filter/search options.
   * Leverages getPageFetchLimit from fetchingCenter.
   */
  async getPaginated(
    page: number = 1,
    search: string = '',
    limit?: number,
    sortKey: string = 'visit_date',
    sortDir: 'asc' | 'desc' = 'desc',
    createdBy?: string
  ): Promise<{ items: IPemasaranWithCustomer[]; total: number }> {
    const fetchLimit = limit || getPageFetchLimit('DaftarPemasaran');
    const offset = (page - 1) * fetchLimit;

    // Build Search Query safely
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    const countParams: any[] = [];

    if (createdBy) {
      whereClause += ` AND p.created_by = ?`;
      params.push(createdBy);
      countParams.push(createdBy);
    }

    if (search) {
      whereClause += ` AND (
        p.sales_username LIKE ? 
        OR p.activity_type LIKE ? 
        OR p.alamat LIKE ? 
        OR p.description LIKE ? 
        OR c.name LIKE ? 
        OR c.company LIKE ?
      )`;
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam, searchParam, searchParam, searchParam);
      countParams.push(searchParam, searchParam, searchParam, searchParam, searchParam, searchParam);
    }

    // Sort key whitelist against SQL Injection
    const allowedSortKeys = ['visit_date', 'sales_username', 'activity_type', 'alamat', 'created_at', 'customer_name'];
    let finalSortKey = allowedSortKeys.includes(sortKey) ? sortKey : 'visit_date';
    
    // Remap customer_name to c.name for SQL ordering
    if (finalSortKey === 'customer_name') {
      finalSortKey = 'c.name';
    } else {
      finalSortKey = `p.${finalSortKey}`;
    }

    const finalSortDir = sortDir.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const sqlData = `
      SELECT p.*, c.name as customer_name, c.company as customer_company, c.telepon as customer_telepon, c.alamat as customer_alamat, c.email as customer_email, c.bidang_usaha as customer_bidang_usaha
      FROM pemasaran p
      LEFT JOIN customer c ON p.customer_id = c.id
      ${whereClause}
      ORDER BY ${finalSortKey} ${finalSortDir}
      LIMIT ? OFFSET ?
    `;

    const sqlCount = `
      SELECT COUNT(*) as total 
      FROM pemasaran p
      LEFT JOIN customer c ON p.customer_id = c.id
      ${whereClause}
    `;

    params.push(fetchLimit, offset);

    try {
      const [dataRes, countRes] = await Promise.all([
        dbClient.query(sqlData, params),
        dbClient.query(sqlCount, countParams)
      ]);

      const items = dataRes.rows as unknown as IPemasaranWithCustomer[];
      const total = Number((countRes.rows[0] as any).total || 0);

      return { items, total };
    } catch (error) {
      errorService.handle(error);
      return { items: [], total: 0 };
    }
  },

  /**
   * Retrieves unique sales usernames from the pemasaran records.
   */
  async getUniqueSalesUsernames(): Promise<string[]> {
    const sql = `SELECT DISTINCT sales_username FROM pemasaran ORDER BY sales_username ASC`;
    try {
      const result = await dbClient.query(sql);
      return result.rows.map((row: any) => row.sales_username);
    } catch (error) {
      errorService.handle(error);
      return [];
    }
  },

  /**
   * Retrieves data for Laporan Pemasaran based on filters.
   */
  async getReportData(
    salesUsernames: string[],
    startDate: string,
    endDate: string
  ): Promise<IPemasaranWithCustomer[]> {
    let whereClause = `WHERE p.visit_date BETWEEN ? AND ?`;
    const params: any[] = [startDate, endDate];

    if (salesUsernames.length > 0 && !salesUsernames.includes('all')) {
      const placeholders = salesUsernames.map(() => '?').join(', ');
      whereClause += ` AND p.sales_username IN (${placeholders})`;
      params.push(...salesUsernames);
    }

    const sql = `
      SELECT p.*, c.name as customer_name, c.company as customer_company, c.telepon as customer_telepon, c.alamat as customer_alamat, c.email as customer_email, c.bidang_usaha as customer_bidang_usaha
      FROM pemasaran p
      LEFT JOIN customer c ON p.customer_id = c.id
      ${whereClause}
      ORDER BY p.visit_date DESC
    `;

    try {
      const result = await dbClient.query(sql, params);
      return result.rows as unknown as IPemasaranWithCustomer[];
    } catch (error) {
      errorService.handle(error);
      return [];
    }
  },

  /**
   * Retrieves detail of one pemasaran record based on ID.
   */
  async getById(id: string): Promise<IPemasaranWithCustomer | null> {
    const sql = `
      SELECT p.*, c.name as customer_name, c.company as customer_company, c.telepon as customer_telepon, c.alamat as customer_alamat, c.email as customer_email, c.bidang_usaha as customer_bidang_usaha
      FROM pemasaran p
      LEFT JOIN customer c ON p.customer_id = c.id
      WHERE p.id = ? 
      LIMIT 1
    `;
    try {
      const result = await dbClient.query(sql, [id]);
      if (result.rows.length === 0) return null;
      return result.rows[0] as unknown as IPemasaranWithCustomer;
    } catch (error) {
      errorService.handle(error);
      return null;
    }
  },

  /**
   * Creates a new pemasaran record.
   * Supports inline new customer auto-creation if `newCustomerData` is provided.
   * Handles user session and actual secure times from TimeRule.md.
   */
  async create(
    data: Omit<IPemasaran, 'id' | 'created_at' | 'updated_at' | 'customer_id' | 'proof_url'> & { 
      customer_id?: string;
      proof_url?: string;
    },
    photoFile?: File,
    newCustomerData?: Omit<ICustomer, 'id' | 'created_at' | 'updated_at'>
  ): Promise<IPemasaranWithCustomer | null> {
    const id = generateUUID();
    let finalCustomerId = data.customer_id || '';
    let proof_url = data.proof_url || '';

    try {
      // 1. Relasi Database: Auto-create customer if requested
      if (newCustomerData && !finalCustomerId) {
        const createdCustomer = await customerService.create(newCustomerData);
        if (createdCustomer) {
          finalCustomerId = createdCustomer.id;
        } else {
          throw new Error('Gagal menambahkan customer baru secara otomatis');
        }
      }

      if (!finalCustomerId) {
        throw new Error('Customer ID wajib diisi atau buat data customer baru');
      }

      // 2. Storage Upload (StorageRule.md)
      if (photoFile) {
        const uploadRes = await storageService.upload(photoFile, 'pemasaran-proof');
        proof_url = uploadRes.url;
      }

      if (!proof_url) {
        throw new Error('Unggahan gambar foto bukti kunjungan wajib ada');
      }

      // 3. Security, Time & Session Check (TimeRule.md)
      const session = akunService.getCurrentSession();
      const createdBy = session?.user_id || null;
      const timezone = getTimezoneIdentifier();

      // Ensure visit_date is synchronized with correct actual network time if empty
      const visitDate = data.visit_date || new Date(getActualTime()).toISOString();

      const sql = `
        INSERT INTO pemasaran (
          id, visit_date, sales_username, activity_type, customer_id,
          description, latlong_visiting, alamat, proof_url,
          created_by, created_timezone
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const params = [
        id,
        visitDate,
        data.sales_username,
        data.activity_type,
        finalCustomerId,
        data.description || null,
        data.latlong_visiting,
        data.alamat,
        proof_url,
        createdBy,
        timezone
      ];

      await dbClient.query(sql, params);
      return await this.getById(id);
    } catch (error) {
      errorService.handle(error);
      return null;
    }
  },

  /**
   * Updates an existing pemasaran record.
   * Correctly implements updating audit trail & storage file replacements to avoid orphan files.
   */
  async update(
    id: string,
    data: Partial<Omit<IPemasaran, 'id' | 'created_at'>>,
    photoFile?: File
  ): Promise<IPemasaranWithCustomer | null> {
    try {
      const existing = await this.getById(id);
      if (!existing) throw new Error('Data kunjungan pemasaran tidak ditemukan');

      let proof_url = data.proof_url ?? existing.proof_url;

      // 1. Manage file cleanup upon update to avoid orphan files (StorageRule.md)
      if (photoFile) {
        const oldKey = existing.proof_url ? existing.proof_url.split('.io/').pop() : null;
        const uploadRes = await storageService.upload(photoFile, 'pemasaran-proof');
        proof_url = uploadRes.url;
        
        if (oldKey) {
          await storageService.delete(oldKey);
        }
        data.proof_url = proof_url;
      }

      // 2. Audit Trail - Update
      const session = akunService.getCurrentSession();
      const updatedBy = session?.user_id || null;
      const timezone = getTimezoneIdentifier();

      // 3. Dynamically Construct Update Query safely
      const updates: string[] = [];
      const params: any[] = [];

      const fieldsToUpdate: (keyof IPemasaran)[] = [
        'visit_date', 'sales_username', 'activity_type', 'customer_id',
        'description', 'latlong_visiting', 'alamat', 'proof_url'
      ];

      fieldsToUpdate.forEach(field => {
        if (data[field] !== undefined) {
          updates.push(`${field} = ?`);
          params.push(data[field]);
        }
      });

      if (updates.length > 0) {
        updates.push(`updated_by = ?`, `updated_timezone = ?`);
        params.push(updatedBy, timezone);

        params.push(id);
        const sql = `UPDATE pemasaran SET ${updates.join(', ')} WHERE id = ?`;
        await dbClient.query(sql, params);
      }

      return await this.getById(id);
    } catch (error) {
      errorService.handle(error);
      return null;
    }
  },

  /**
   * Deletes a pemasaran record and cleans up Tigris Storage to protect space bounds.
   */
  async delete(id: string): Promise<boolean> {
    try {
      const existing = await this.getById(id);
      if (!existing) return false;

      // 1. Delete associated asset file from storage (StorageRule.md)
      if (existing.proof_url) {
        const oldKey = existing.proof_url.split('.io/').pop();
        if (oldKey) {
          await storageService.delete(oldKey);
        }
      }

      // 2. Delete database row
      const sql = `DELETE FROM pemasaran WHERE id = ?`;
      await dbClient.query(sql, [id]);
      return true;
    } catch (error) {
      errorService.handle(error);
      return false;
    }
  }
};
