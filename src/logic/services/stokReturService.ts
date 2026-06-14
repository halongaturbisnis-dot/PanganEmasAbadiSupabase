import { dbClient } from '../libs/database';
import { IStokRetur, IStokReturPayload } from '../types/ITs_StokRetur';
import { generateUUID } from '../utils/data';
import { errorService } from './errorService';
import { browserStorage } from '../utils/browserStorage';
import { getTimezoneIdentifier } from '../utils/time';
import { IAkunSession } from '../types/ITs_Akun';
import { stokBerjalanService } from './stokBerjalanService';

/**
 * STOK RETUR SERVICE
 * Backend logic untuk modul Stok Retur (Stock Return).
 * Menangani transaksi pengembalian stok dengan integritas referensial dari master Stok Berjalan.
 */

export const stokReturService = {
  /**
   * Mengambil semua catatan transaksi stok retur.
   */
  async getAll(): Promise<IStokRetur[]> {
    const sql = `SELECT * FROM stok_retur ORDER BY created_at DESC`;
    try {
      const result = await dbClient.query(sql);
      return result.rows as any[];
    } catch (error) {
      errorService.handle(error);
      return [];
    }
  },

  /**
   * Mengambil data stok retur paged dengan pencarian terintegrasi.
   */
  async getPaginated(
    page: number = 1,
    limit: number = 15,
    search: string = '',
    startDate?: string,
    endDate?: string
  ): Promise<{ items: IStokRetur[]; total: number }> {
    const offset = (page - 1) * limit;
    let whereConditions: string[] = ['1=1'];
    const params: any[] = [];
    
    if (search) {
      whereConditions.push(`(sku LIKE ? OR name LIKE ? OR category LIKE ? OR sub_category LIKE ? OR description LIKE ?)`);
      const s = `%${search}%`;
      params.push(s, s, s, s, s);
    }

    if (startDate) {
      const localDate = new Date(`${startDate}T00:00:00`);
      const utcStart = localDate.toISOString().replace('T', ' ').slice(0, 19);
      whereConditions.push(`created_at >= ?`);
      params.push(utcStart);
    }

    if (endDate) {
      const localDate = new Date(`${endDate}T23:59:59`);
      const utcEnd = localDate.toISOString().replace('T', ' ').slice(0, 19);
      whereConditions.push(`created_at <= ?`);
      params.push(utcEnd);
    }

    const whereClause = `WHERE ${whereConditions.join(' AND ')}`;
    const sqlData = `SELECT * FROM stok_retur ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    const sqlCount = `SELECT COUNT(*) as total FROM stok_retur ${whereClause}`;

    const countParams = [...params];
    params.push(limit, offset);

    try {
      const [dataRes, countRes] = await Promise.all([
        dbClient.query(sqlData, params),
        dbClient.query(sqlCount, countParams)
      ]);

      const items = dataRes.rows as any[];
      const total = Number((countRes.rows[0] as any).total || 0);

      return { items, total };
    } catch (error) {
      errorService.handle(error);
      return { items: [], total: 0 };
    }
  },

  /**
   * Mengambil detail transaksi stok retur tunggal berdasarkan ID.
   */
  async getById(id: string): Promise<IStokRetur | null> {
    const sql = `SELECT * FROM stok_retur WHERE id = ? LIMIT 1`;
    try {
      const result = await dbClient.query(sql, [id]);
      if (result.rows.length === 0) return null;
      return result.rows[0] as any;
    } catch (error) {
      errorService.handle(error);
      return null;
    }
  },

  /**
   * Mengambil semua transaksi stok retur untuk SKU tertentu.
   */
  async getBySku(sku: string): Promise<IStokRetur[]> {
    const sql = `SELECT * FROM stok_retur WHERE sku = ? ORDER BY created_at DESC`;
    try {
      const result = await dbClient.query(sql, [sku]);
      return result.rows as any[];
    } catch (error) {
      errorService.handle(error);
      return [];
    }
  },

  /**
   * Membuat transaksi stok retur baru.
   * Secara otomatis melengkapi informasi produk (category, name, unit, dan price_per_unit_in)
   * dengan menarik data referensi master dari Stok Berjalan sesuai dengan SKU yang dipilih.
   */
  async create(data: IStokReturPayload): Promise<IStokRetur | null> {
    const id = generateUUID();
    const session = this._getCurrentSession();
    const timezone = getTimezoneIdentifier();

    try {
      // 1. Ambil data master referensi produk dari Stok Berjalan sesuai SKU (MANDATORY)
      const runningStock = await stokBerjalanService.getBySku(data.sku);
      if (!runningStock) {
        throw new Error(`SKU "${data.sku}" tidak ditemukan dalam master data Stok Berjalan.`);
      }

      // 2. Isi data atribut secara otomatis mengikut SKU (Sesuai Kebutuhan Relasi Database)
      const category = runningStock.category;
      const sub_category = runningStock.sub_category || '';
      const name = runningStock.name;
      const unit = runningStock.unit;
      
      // Gunakan price_per_unit_running terbaru atau fallback ke base_price master produk
      const price_per_unit_in = runningStock.price_per_unit_running || runningStock.base_price || 0;
      
      // Hitung total harga retur secara otomatis (total_price_in = qty * price_per_unit_in)
      const qty = Number(data.qty || 0);
      const total_price_in = qty * price_per_unit_in;

      // 3. Persistensi ke database stok_retur
      const sqlInsert = `
        INSERT INTO stok_retur (
          id, sku, category, sub_category, name, unit,
          qty, price_per_unit_in, total_price_in, description,
          created_by, created_timezone
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const params = [
        id,
        data.sku,
        category,
        sub_category,
        name,
        unit,
        qty,
        price_per_unit_in,
        total_price_in,
        data.description || null,
        session?.user_id || null,
        timezone
      ];

      await dbClient.query(sqlInsert, params);

      // Mengembalikan record setelah di-insert
      return this.getById(id);
    } catch (error) {
      errorService.handle(error);
      return null;
    }
  },

  /**
   * Mengubah informasi transaksi stok retur histori.
   */
  async update(id: string, data: Partial<IStokReturPayload>): Promise<IStokRetur | null> {
    const session = this._getCurrentSession();
    const timezone = getTimezoneIdentifier();

    try {
      const existing = await this.getById(id);
      if (!existing) {
        throw new Error('Transaksi Stok Retur tidak ditemukan');
      }

      const updates: string[] = [];
      const params: any[] = [];

      // Updateable fields
      const fields: (keyof IStokReturPayload)[] = [
        'sku', 'qty', 'description'
      ];

      // Jika SKU diubah, kita harus me-refresh field atribut master
      let skuToLookup = data.sku || existing.sku;
      let qtyToUse = data.qty !== undefined ? Number(data.qty) : existing.qty;
      let priceToUse = existing.price_per_unit_in;
      
      if (data.sku && data.sku !== existing.sku) {
        const runningStock = await stokBerjalanService.getBySku(data.sku);
        if (!runningStock) {
          throw new Error(`SKU "${data.sku}" tidak ditemukan dalam master data Stok Berjalan.`);
        }
        
        updates.push(`sku = ?`);
        params.push(data.sku);
        
        updates.push(`category = ?`);
        params.push(runningStock.category);
        
        updates.push(`sub_category = ?`);
        params.push(runningStock.sub_category || '');
        
        updates.push(`name = ?`);
        params.push(runningStock.name);
        
        updates.push(`unit = ?`);
        params.push(runningStock.unit);

        priceToUse = runningStock.price_per_unit_running || runningStock.base_price || 0;
        updates.push(`price_per_unit_in = ?`);
        params.push(priceToUse);
      }

      if (data.qty !== undefined) {
        updates.push(`qty = ?`);
        params.push(qtyToUse);
      }

      // Rekalkulasi total_price_in jika SKU atau Qty berubah
      if (data.sku !== undefined || data.qty !== undefined) {
        const total_price_in = qtyToUse * priceToUse;
        updates.push(`total_price_in = ?`);
        params.push(total_price_in);
      }

      if (data.description !== undefined) {
        updates.push(`description = ?`);
        params.push(data.description || null);
      }

      if (updates.length > 0) {
        updates.push(`updated_by = ?`);
        params.push(session?.user_id || null);
        updates.push(`updated_timezone = ?`);
        params.push(timezone);

        params.push(id);
        const sqlUpdate = `UPDATE stok_retur SET ${updates.join(', ')} WHERE id = ?`;
        await dbClient.query(sqlUpdate, params);
      }

      return this.getById(id);
    } catch (error) {
      errorService.handle(error);
      return null;
    }
  },

  /**
   * Menghapus transaksi stok retur dari sistem.
   */
  async delete(id: string): Promise<boolean> {
    const sql = `DELETE FROM stok_retur WHERE id = ?`;
    try {
      await dbClient.query(sql, [id]);
      return true;
    } catch (error) {
      errorService.handle(error);
      return false;
    }
  },

  /**
   * HELPER: Mendapatkan session aktif pengguna dari browser local storage.
   */
  _getCurrentSession(): IAkunSession | null {
    return browserStorage.get<IAkunSession>('active_user');
  }
};
