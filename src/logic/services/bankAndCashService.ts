import { dbClient } from '../libs/database';
import { IBankAndCash, TBankAndCashType } from '../types/ITs_BankAndCash';
import { errorService } from './errorService';
import { akunService } from './akunService';
import { generateUUID } from '../utils/data';
import { getPageFetchLimit } from './fetchingCenter';

/**
 * BANK AND CASH SERVICE
 * Logic backend untuk modul Kas & Bank.
 * Menangani CRUD dan Integrasi Database Turso sesuai BankAndCashTable.sql.
 */

export const bankAndCashService = {
  /**
   * Mengambil semua data Kas & Bank.
   * Urutan: Default pertama, lalu Nama Akun ASC.
   */
  async getAll(): Promise<IBankAndCash[]> {
    const sql = `SELECT * FROM bank_and_cash ORDER BY is_default DESC, nama_akun ASC`;
    try {
      const result = await dbClient.query(sql);
      return result.rows as unknown as IBankAndCash[];
    } catch (error) {
      errorService.handle(error);
      return [];
    }
  },

  /**
   * Mengambil data Kas & Bank dengan paginasi dan pencarian.
   */
  async getPaginated(
    page: number = 1,
    search: string = '',
    limit?: number,
    sortKey: string = 'nama_akun',
    sortDir: 'asc' | 'desc' = 'asc'
  ): Promise<{ items: IBankAndCash[]; total: number }> {
    // 1. Determine limit
    const fetchLimit = limit || getPageFetchLimit('DaftarBankAndCash');
    const offset = (page - 1) * fetchLimit;

    // 2. Build Query
    let whereClause = '';
    const params: any[] = [];
    const countParams: any[] = [];

    if (search) {
      whereClause = `WHERE nama_akun LIKE ? OR nama_bank LIKE ? OR nomor_rekening LIKE ? OR nama_pemilik LIKE ?`;
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam, searchParam);
      countParams.push(searchParam, searchParam, searchParam, searchParam);
    }

    // White list for sort keys
    const allowedSortKeys = ['nama_akun', 'tipe', 'nama_bank', 'nomor_rekening', 'created_at'];
    const finalSortKey = allowedSortKeys.includes(sortKey) ? sortKey : 'nama_akun';
    const finalSortDir = sortDir?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    
    const sqlData = `
      SELECT * FROM bank_and_cash 
      ${whereClause} 
      ORDER BY ${finalSortKey} ${finalSortDir} 
      LIMIT ? OFFSET ?
    `;
    const sqlCount = `SELECT COUNT(*) as total FROM bank_and_cash ${whereClause}`;

    params.push(fetchLimit, offset);

    try {
      const [dataRes, countRes] = await Promise.all([
        dbClient.query(sqlData, params),
        dbClient.query(sqlCount, countParams)
      ]);

      const items = dataRes.rows as unknown as IBankAndCash[];
      const total = Number((countRes.rows[0] as any).total || 0);

      return { items, total };
    } catch (error) {
      errorService.handle(error);
      return { items: [], total: 0 };
    }
  },

  /**
   * Mengambil detail berdasarkan ID.
   */
  async getById(id: string): Promise<IBankAndCash | null> {
    const sql = `SELECT * FROM bank_and_cash WHERE id = ? LIMIT 1`;
    try {
      const result = await dbClient.query(sql, [id]);
      if (result.rows.length === 0) return null;
      return result.rows[0] as unknown as IBankAndCash;
    } catch (error) {
      errorService.handle(error);
      return null;
    }
  },

  /**
   * Membuat akun baru.
   */
  async create(data: Omit<IBankAndCash, 'id' | 'created_at' | 'updated_at' | 'is_deletable'>): Promise<IBankAndCash | null> {
    const id = generateUUID();
    
    try {
      // 1. Audit Trail - Creation
      const session = akunService.getCurrentSession();
      const createdBy = session?.user_id || null;
      const timezone = 'Asia/Jakarta';

      // 2. Proteksi: Tipe Kas hanya boleh 1 (Data Default)
      // Walaupun frontend membatasi, backend tetap memvalidasi untuk integritas
      if (data.tipe === TBankAndCashType.KAS) {
         throw new Error('Tipe Kas sudah ada dan tidak boleh ditambah lagi.');
      }

      const sql = `
        INSERT INTO bank_and_cash (
          id, nama_akun, tipe, nama_bank, nomor_rekening, nama_pemilik,
          is_default, created_by, created_timezone
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const params = [
        id,
        data.nama_akun,
        data.tipe,
        data.nama_bank || null,
        data.nomor_rekening || null,
        data.nama_pemilik || null,
        data.is_default || 0,
        createdBy,
        timezone
      ];

      await dbClient.query(sql, params);

      // Handle is_default logic: if this new one is default, others are not
      if (data.is_default === 1) {
        await this.setOnlyOneDefault(id);
      }

      return await this.getById(id);
    } catch (error) {
      errorService.handle(error);
      return null;
    }
  },

  /**
   * Memperbarui data.
   */
  async update(id: string, data: Partial<IBankAndCash>): Promise<IBankAndCash | null> {
    try {
      const existing = await this.getById(id);
      if (!existing) throw new Error('Data tidak ditemukan');

      // 1. Audit Trail - Update
      const session = akunService.getCurrentSession();
      const updatedBy = session?.user_id || null;
      const timezone = 'Asia/Jakarta';

      // 2. Build Dynamic Query
      const updates: string[] = [];
      const params: any[] = [];

      const fieldsToUpdate: (keyof IBankAndCash)[] = [
        'nama_akun', 'nama_bank', 'nomor_rekening', 'nama_pemilik', 'is_default'
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
        const sql = `UPDATE bank_and_cash SET ${updates.join(', ')} WHERE id = ?`;
        await dbClient.query(sql, params);

        // Handle is_default logic
        if (data.is_default === 1) {
          await this.setOnlyOneDefault(id);
        }
      }

      return await this.getById(id);
    } catch (error) {
      errorService.handle(error);
      return null;
    }
  },

  /**
   * Menghapus data.
   * Tidak boleh menghapus data yang diproteksi (is_deletable = 0).
   */
  async delete(id: string): Promise<boolean> {
    try {
      const existing = await this.getById(id);
      if (!existing) throw new Error('Data tidak ditemukan');
      
      // Proteksi data default/sistem
      if (existing.is_deletable === 0) {
        throw new Error('Data ini diproteksi oleh sistem dan tidak boleh dihapus.');
      }

      const sql = `DELETE FROM bank_and_cash WHERE id = ?`;
      await dbClient.query(sql, [id]);
      return true;
    } catch (error) {
      errorService.handle(error);
      return false;
    }
  },

  /**
   * Memastikan hanya satu akun yang menjadi default.
   */
  async setOnlyOneDefault(activeId: string): Promise<void> {
    const sql = `UPDATE bank_and_cash SET is_default = 0 WHERE id != ?`;
    await dbClient.query(sql, [activeId]);
  },

  /**
   * Mengambil data Jurnal Transaksi (Pemasukan & Pengeluaran) untuk akun tertentu.
   * Digunakan untuk audit/detail account view.
   */
  async getJournalByBankCashId(id: string): Promise<any[]> {
    const sqlPemasukan = `
      SELECT 'Pemasukan' as transaction_source, id, transaction_date, amount, type, description, created_at 
      FROM pemasukan WHERE bank_and_cash_id = ?
    `;
    const sqlPengeluaran = `
      SELECT 'Pengeluaran' as transaction_source, id, transaction_date, amount, type, description, created_at 
      FROM pengeluaran WHERE bank_and_cash_id = ?
    `;

    try {
      const [resIn, resOut] = await Promise.all([
        dbClient.query(sqlPemasukan, [id]),
        dbClient.query(sqlPengeluaran, [id])
      ]);

      const merged = [
        ...(resIn.rows as any[]).map(row => ({ 
          ...row, 
          id: row.id,
          transaction_source: row.transaction_source,
          type: row.type,
          description: row.description,
          debit: 0, 
          kredit: row.amount 
        })),
        ...(resOut.rows as any[]).map(row => ({ 
          ...row, 
          id: row.id,
          transaction_source: row.transaction_source,
          type: row.type,
          description: row.description,
          debit: row.amount, 
          kredit: 0 
        }))
      ];

      // Sort ASC for balance calculation
      merged.sort((a, b) => {
        const dateA = new Date(a.transaction_date).getTime();
        const dateB = new Date(b.transaction_date).getTime();
        if (dateA !== dateB) return dateA - dateB;
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });

      // Calculate running balance
      // Saldo = Previous + Kredit (Masuk) - Debit (Keluar)
      let currentBalance = 0;
      const journal = merged.map(item => {
        currentBalance += (item.kredit - item.debit);
        return {
          ...item,
          balance: currentBalance
        };
      });

      // Show newest first
      return journal.reverse();
    } catch (error) {
      errorService.handle(error);
      return [];
    }
  }
};
