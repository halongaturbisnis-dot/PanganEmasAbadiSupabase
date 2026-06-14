import { dbClient } from '../libs/database';
import { IPengeluaran, IPengeluaranPayload, TPengeluaranStatus } from '../types/ITs_Pengeluaran';
import { errorService } from './errorService';
import { storageService } from './storage';
import { akunService } from './akunService';
import { generateUUID } from '../utils/data';
import { getPageFetchLimit } from './fetchingCenter';

/**
 * PENGELUARAN SERVICE
 * Logic backend untuk modul Pengeluaran (Expenses).
 * Menangani CRUD, Audit Trail, dan Manajemen File di Tigris Storage.
 */

/**
 * Helper JSON untuk Pengeluaran Type
 * Mengkonversi format string tunggal ke versi JSON if possible
 */
export const helperParsePengeluaranType = (typeString: string | undefined): { name: string, classification: 'Operasional' | 'Aset' } => {
  if (!typeString) return { name: '', classification: 'Operasional' };
  try {
    const parsed = JSON.parse(typeString);
    if (parsed && typeof parsed === 'object' && parsed.name) {
      return {
        name: parsed.name,
        classification: parsed.classification || 'Operasional'
      };
    }
  } catch (e) {
    // Falls back to regular string if it is not a JSON
  }
  return { name: typeString, classification: 'Operasional' };
};

export const helperStringifyPengeluaranType = (name: string, classification: 'Operasional' | 'Aset'): string => {
  return JSON.stringify({ name, classification });
};

export const pengeluaranService = {
  /**
   * Mengambil data pengeluaran dengan paginasi, pencarian, dan pemfilteran.
   */
  async getPaginated(
    page: number = 1,
    search: string = '',
    options?: {
      limit?: number;
      bank_and_cash_id?: string;
      status?: TPengeluaranStatus;
      sortKey?: string;
      sortDir?: 'asc' | 'desc';
      startDate?: string;
      endDate?: string;
    }
  ): Promise<{ items: IPengeluaran[]; total: number }> {
    const fetchLimit = options?.limit || getPageFetchLimit('DaftarPengeluaran');
    const offset = (page - 1) * fetchLimit;

    let whereConditions: string[] = [];
    const params: any[] = [];

    // Filter Pencarian (Type atau Description)
    if (search) {
      whereConditions.push(`(type LIKE ? OR description LIKE ?)`);
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam);
    }

    // Filter berdasarkan Sumber Dana
    if (options?.bank_and_cash_id) {
      whereConditions.push(`bank_and_cash_id = ?`);
      params.push(options.bank_and_cash_id);
    }

    // Filter berdasarkan Status
    if (options?.status) {
      whereConditions.push(`status = ?`);
      params.push(options.status);
    }

    // Filter berdasarkan Tanggal
    if (options?.startDate) {
      whereConditions.push(`date(transaction_date) >= ?`);
      params.push(options.startDate);
    }

    if (options?.endDate) {
      whereConditions.push(`date(transaction_date) <= ?`);
      params.push(options.endDate);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    // Sort logic
    const allowedSortKeys = ['transaction_date', 'amount', 'type', 'created_at'];
    const finalSortKey = allowedSortKeys.includes(options?.sortKey || '') ? options?.sortKey : 'transaction_date';
    const finalSortDir = options?.sortDir?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const sqlData = `
      SELECT * FROM pengeluaran 
      ${whereClause} 
      ORDER BY ${finalSortKey} ${finalSortDir} 
      LIMIT ? OFFSET ?
    `;
    const sqlCount = `SELECT COUNT(*) as total FROM pengeluaran ${whereClause}`;

    const countParams = [...params];
    params.push(fetchLimit, offset);

    try {
      const [dataRes, countRes] = await Promise.all([
        dbClient.query(sqlData, params),
        dbClient.query(sqlCount, countParams)
      ]);

      return {
        items: dataRes.rows as unknown as IPengeluaran[],
        total: Number((countRes.rows[0] as any).total || 0)
      };
    } catch (error) {
      errorService.handle(error);
      return { items: [], total: 0 };
    }
  },

  /**
   * Mendapatkan detail pengeluaran berdasarkan ID.
   */
  async getById(id: string): Promise<IPengeluaran | null> {
    const sql = `SELECT * FROM pengeluaran WHERE id = ? LIMIT 1`;
    try {
      const result = await dbClient.query(sql, [id]);
      if (result.rows.length === 0) return null;
      return result.rows[0] as unknown as IPengeluaran;
    } catch (error) {
      errorService.handle(error);
      return null;
    }
  },

  /**
   * Membuat transaksi pengeluaran baru.
   * Termasuk proses upload file ke Tigris.
   */
  async create(data: IPengeluaranPayload): Promise<IPengeluaran | null> {
    try {
      const id = generateUUID();
      const session = akunService.getCurrentSession();
      const timezone = 'Asia/Jakarta';

      // 1. Handle File Uploads (StorageRule.md)
      // Folder 'expenses' sesuai dengan istilah teknis di request pengguna
      const uploadedFiles: { url: string; key: string }[] = data.proof_urls || [];
      if (data.files && data.files.length > 0) {
        for (const file of data.files) {
          const result = await storageService.upload(file, 'expenses');
          uploadedFiles.push(result);
        }
      }

      const sql = `
        INSERT INTO pengeluaran (
          id, transaction_date, bank_and_cash_id, type, description, 
          amount, proof_urls, status, purchase_id, created_by, created_timezone
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const params = [
        id,
        data.transaction_date,
        data.bank_and_cash_id,
        data.type,
        data.description,
        data.amount,
        JSON.stringify(uploadedFiles),
        data.status || TPengeluaranStatus.CLEAR,
        data.purchase_id || null,
        session?.user_id || null,
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
   * Memperbarui data pengeluaran.
   * Menangani penggantian file (cleanup orphan files).
   */
  async update(id: string, data: Partial<IPengeluaranPayload>): Promise<IPengeluaran | null> {
    try {
      const existing = await this.getById(id);
      if (!existing) throw new Error('Data pengeluaran tidak ditemukan.');

      const session = akunService.getCurrentSession();
      const timezone = 'Asia/Jakarta';

      // 1. Refactored File Update Logic (Sync & Diffing)
      let currentProofFiles: { url: string; key: string }[] = JSON.parse(existing.proof_urls || '[]');
      let preservedProofFiles: { url: string; key: string }[] = data.proof_urls || [];

      // A. Identifikasi file yang dihapus (Ada di DB tapi TIDAK ada di payload data.proof_urls)
      const filesToDelete = currentProofFiles.filter(oldFile => 
        !preservedProofFiles.some(preserved => preserved.key === oldFile.key)
      );

      // B. Cleanup physical files from storage
      for (const f of filesToDelete) {
        try {
          await storageService.delete(f.key);
        } catch (err) {
          console.warn(`Gagal menghapus file orphan: ${f.key}`, err);
        }
      }

      // C. Upload new files if any
      const newUploadedFiles: { url: string; key: string }[] = [];
      if (data.files && data.files.length > 0) {
        for (const file of data.files) {
          const result = await storageService.upload(file, 'expenses');
          newUploadedFiles.push(result);
        }
      }

      // D. Final merge: preserved existing files + newly uploaded files
      const finalProofUrlsList = [...preservedProofFiles, ...newUploadedFiles];
      const finalProofUrlsJson = JSON.stringify(finalProofUrlsList);

      // 2. Build Dynamic Update
      const updates: string[] = [];
      const params: any[] = [];

      const fieldsToUpdate: (keyof IPengeluaranPayload)[] = [
        'transaction_date', 'bank_and_cash_id', 'type', 'description', 'amount', 'status', 'purchase_id'
      ];

      fieldsToUpdate.forEach(field => {
        if (data[field] !== undefined) {
          updates.push(`${field} = ?`);
          params.push(data[field]);
        }
      });

      // Always update proof_urls to reflect the synced state
      updates.push(`proof_urls = ?`);
      params.push(finalProofUrlsJson);

      if (updates.length > 0) {
        updates.push(`updated_by = ?`, `updated_timezone = ?`);
        params.push(session?.user_id || null, timezone);
        
        params.push(id);
        const sql = `UPDATE pengeluaran SET ${updates.join(', ')} WHERE id = ?`;
        await dbClient.query(sql, params);
      }

      return await this.getById(id);
    } catch (error) {
      errorService.handle(error);
      return null;
    }
  },

  /**
   * Menghapus transaksi pengeluaran dan file terkait di storage.
   */
  async delete(id: string): Promise<boolean> {
    try {
      const existing = await this.getById(id);
      if (!existing) throw new Error('Data tidak ditemukan.');

      // 1. Cleanup Storage (Anti-Yatim Piatu)
      const files: { url: string; key: string }[] = JSON.parse(existing.proof_urls || '[]');
      for (const f of files) {
        await storageService.delete(f.key);
      }

      // 2. Delete Database Record
      const sql = `DELETE FROM pengeluaran WHERE id = ?`;
      await dbClient.query(sql, [id]);
      
      return true;
    } catch (error) {
      errorService.handle(error);
      return false;
    }
  },

  /**
   * Menghapus banyak transaksi sekaligus.
   */
  async deleteMany(ids: string[]): Promise<boolean> {
    try {
      if (ids.length === 0) return true;
      
      // Ambil data untuk cleanup storage
      const placeholders = ids.map(() => '?').join(',');
      const sqlGet = `SELECT proof_urls FROM pengeluaran WHERE id IN (${placeholders})`;
      const result = await dbClient.query(sqlGet, ids);
      
      for (const row of result.rows) {
        const files: { url: string; key: string }[] = JSON.parse((row as any).proof_urls || '[]');
        for (const f of files) {
          await storageService.delete(f.key);
        }
      }

      const sqlDelete = `DELETE FROM pengeluaran WHERE id IN (${placeholders})`;
      await dbClient.query(sqlDelete, ids);
      
      return true;
    } catch (error) {
      errorService.handle(error);
      return false;
    }
  },

  /**
   * Mengambil "Permintaan Pengeluaran" dari tabel Pembelian.
   * Yaitu data Pembelian yang memiliki Deposit > 0 atau Lunas, tapi belum ada di tabel Pengeluaran.
   */
  async getRequestsPaginated(
    page: number = 1,
    search: string = '',
    options?: { limit?: number }
  ): Promise<{ items: any[]; total: number }> {
    const fetchLimit = options?.limit || getPageFetchLimit('PermintaanPengeluaran');
    const offset = (page - 1) * fetchLimit;

    let whereClause = '';
    const params: any[] = [];

    // Logika Permintaan:
    // 1. Pembelian yang deposit > 0 OR payment_type = 'lunas' (yang berarti sdh ada uang keluar)
    // 2. Pembelian tersebut BELUM ada di tabel pengeluaran (purchase_id NOT IN pengeluaran)
    
    whereClause = `
      WHERE (p.deposit > 0 OR p.payment_type = 'lunas')
      AND p.id NOT IN (SELECT purchase_id FROM pengeluaran WHERE purchase_id IS NOT NULL)
    `;

    if (search) {
      whereClause += ` AND (p.po_number LIKE ? OR s.name LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    const sqlData = `
      SELECT p.*, s.name as supplier_name, p.created_by, p.updated_by
      FROM pembelian p
      LEFT JOIN suplier s ON p.supplier_id = s.id
      ${whereClause}
      ORDER BY p.datetime DESC
      LIMIT ? OFFSET ?
    `;

    const sqlCount = `
      SELECT COUNT(*) as total 
      FROM pembelian p
      LEFT JOIN suplier s ON p.supplier_id = s.id
      ${whereClause}
    `;

    try {
      const [dataRes, countRes] = await Promise.all([
        dbClient.query(sqlData, [...params, fetchLimit, offset]),
        dbClient.query(sqlCount, params)
      ]);

      return {
        items: dataRes.rows,
        total: Number((countRes.rows[0] as any).total || 0)
      };
    } catch (error) {
      errorService.handle(error);
      return { items: [], total: 0 };
    }
  }
};
