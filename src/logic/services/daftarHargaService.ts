import { dbClient } from '../libs/database';
import { IDaftarHarga, IDaftarHargaPayload } from '../types/ITs_DaftarHarga';
import { generateUUID } from '../utils/data';
import { errorService } from './errorService';
import { browserStorage } from '../utils/browserStorage';
import { getTimezoneIdentifier } from '../utils/time';
import { IAkunSession } from '../types/ITs_Akun';

/**
 * DAFTAR HARGA SERVICE
 * Logic backend untuk modul Daftar Harga (Price List).
 * Menangani CRUD dan integrasi harga bertingkat (Tiered Pricing).
 * Berbasis pada data SKU dari Stok Berjalan.
 */

export const daftarHargaService = {
  /**
   * Mengambil semua data daftar harga.
   */
  async getAll(): Promise<IDaftarHarga[]> {
    const sql = `SELECT * FROM daftar_harga ORDER BY name ASC`;
    try {
      const result = await dbClient.query(sql);
      return (result.rows as any[]).map(row => this._mapFromDb(row));
    } catch (error) {
      errorService.handle(error);
      return [];
    }
  },

  /**
   * Mengambil data daftar harga paged dengan pencarian.
   */
  async getPaginated(
    page: number = 1,
    limit: number = 15,
    search: string = '',
    category?: string
  ): Promise<{ items: IDaftarHarga[]; total: number }> {
    const offset = (page - 1) * limit;
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    const countParams: any[] = [];

    if (search) {
      whereClause += ` AND (name LIKE ? OR sku LIKE ? OR category LIKE ? OR sub_category LIKE ?)`;
      const s = `%${search}%`;
      params.push(s, s, s, s);
      countParams.push(s, s, s, s);
    }

    if (category) {
      whereClause += ` AND category = ?`;
      params.push(category);
      countParams.push(category);
    }

    const sqlData = `SELECT * FROM daftar_harga ${whereClause} ORDER BY name ASC LIMIT ? OFFSET ?`;
    const sqlCount = `SELECT COUNT(*) as total FROM daftar_harga ${whereClause}`;

    params.push(limit, offset);

    try {
      const [dataRes, countRes] = await Promise.all([
        dbClient.query(sqlData, params),
        dbClient.query(sqlCount, countParams)
      ]);

      const items = (dataRes.rows as any[]).map(row => this._mapFromDb(row));
      const total = Number((countRes.rows[0] as any).total || 0);

      return { items, total };
    } catch (error) {
      errorService.handle(error);
      return { items: [], total: 0 };
    }
  },

  /**
   * Mengambil satu data daftar harga berdasarkan ID.
   */
  async getById(id: string): Promise<IDaftarHarga | null> {
    const sql = `SELECT * FROM daftar_harga WHERE id = ? LIMIT 1`;
    try {
      const result = await dbClient.query(sql, [id]);
      if (result.rows.length === 0) return null;
      return this._mapFromDb(result.rows[0] as any);
    } catch (error) {
      errorService.handle(error);
      return null;
    }
  },

  /**
   * Mengambil satu data daftar harga berdasarkan SKU.
   */
  async getBySku(sku: string): Promise<IDaftarHarga | null> {
    const sql = `SELECT * FROM daftar_harga WHERE sku = ? LIMIT 1`;
    try {
      const result = await dbClient.query(sql, [sku]);
      if (result.rows.length === 0) return null;
      return this._mapFromDb(result.rows[0] as any);
    } catch (error) {
      errorService.handle(error);
      return null;
    }
  },

  /**
   * Membuat daftar harga baru.
   */
  async create(data: IDaftarHargaPayload): Promise<IDaftarHarga | null> {
    const id = generateUUID();
    const session = this._getCurrentSession();
    const timezone = getTimezoneIdentifier();

    const sql = `
      INSERT INTO daftar_harga (
        id, sku, product_id, category, sub_category, name, unit, 
        tiered_pricing,
        created_by, created_timezone
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      id,
      data.sku,
      data.product_id,
      data.category,
      data.sub_category,
      data.name,
      data.unit,
      JSON.stringify(data.tiered_pricing || []),
      session?.user_id || null,
      timezone
    ];

    try {
      await dbClient.query(sql, params);
      return this.getById(id);
    } catch (error) {
      errorService.handle(error);
      return null;
    }
  },

  /**
   * Memperbarui daftar harga.
   */
  async update(id: string, data: Partial<IDaftarHargaPayload>): Promise<IDaftarHarga | null> {
    const session = this._getCurrentSession();
    const timezone = getTimezoneIdentifier();

    try {
      const existing = await this.getById(id);
      if (!existing) throw new Error('Daftar harga tidak ditemukan');

      const updates: string[] = [];
      const params: any[] = [];

      const fields: (keyof IDaftarHargaPayload)[] = [
        'sku', 'product_id', 'category', 'sub_category', 'name', 'unit', 'tiered_pricing'
      ];

      fields.forEach(field => {
        if (data[field] !== undefined) {
          updates.push(`${field} = ?`);
          if (field === 'tiered_pricing') {
            params.push(JSON.stringify(data[field]));
          } else {
            params.push(data[field]);
          }
        }
      });

      if (updates.length > 0) {
        updates.push(`updated_by = ?`);
        params.push(session?.user_id || null);
        updates.push(`updated_timezone = ?`);
        params.push(timezone);

        params.push(id);
        const sql = `UPDATE daftar_harga SET ${updates.join(', ')} WHERE id = ?`;
        await dbClient.query(sql, params);
      }

      return this.getById(id);
    } catch (error) {
      errorService.handle(error);
      return null;
    }
  },

  /**
   * Menghapus daftar harga.
   */
  async delete(id: string): Promise<boolean> {
    const sql = `DELETE FROM daftar_harga WHERE id = ?`;
    try {
      await dbClient.query(sql, [id]);
      return true;
    } catch (error) {
      errorService.handle(error);
      return false;
    }
  },

  /**
   * HELPER: Pemetaan data dari DB ke Interface (Parsing JSON).
   */
  _mapFromDb(row: any): IDaftarHarga {
    try {
      return {
        ...row,
        tiered_pricing: typeof row.tiered_pricing === 'string' 
          ? JSON.parse(row.tiered_pricing) 
          : (row.tiered_pricing || [])
      };
    } catch (e) {
      console.warn('Failed to parse tiered_pricing JSON', e);
      return {
        ...row,
        tiered_pricing: []
      };
    }
  },

  /**
   * Mengambil session aktif dari storage.
   */
  _getCurrentSession(): IAkunSession | null {
    return browserStorage.get<IAkunSession>('active_user');
  }
};
