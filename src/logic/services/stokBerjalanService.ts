import { dbClient } from '../libs/database.js';
import { IStokBerjalan, IStokBerjalanPayload } from '../types/ITs_StokBerjalan.js';
import { generateUUID } from '../utils/data.js';
import { errorService } from './errorService.js';
import { browserStorage } from '../utils/browserStorage.js';
import { getTimezoneIdentifier } from '../utils/time.js';
import { IAkunSession } from '../types/ITs_Akun.js';

/**
 * SQL FRAGMENTS UNTUK FIELD VIRTUAL (AGREGASI OPTIMIZED)
 * Digunakan untuk mengambil data agregasi dalam satu kali query SELECT.
 */
const VIRTUAL_FIELDS_SQL = `
  , (SELECT COALESCE(SUM(sm_in.qty_in), 0) FROM stok_masuk sm_in WHERE sm_in.sku = stok_berjalan.sku AND (stok_berjalan.last_so_datetime IS NULL OR sm_in.created_at > stok_berjalan.last_so_datetime)) as v_qty_in
  , (
    COALESCE((
      SELECT SUM(sol_pp.qty) 
      FROM penjualan_produk sol_pp 
      JOIN penjualan sol_p ON sol_pp.penjualan_id = sol_p.id 
      WHERE sol_pp.sku = stok_berjalan.sku AND sol_pp.is_mixing = 0 AND sol_pp.is_dropship = 0 
      AND sol_p.status IN ('Confirmed', 'Completed') 
      AND (stok_berjalan.last_so_datetime IS NULL OR sol_p.datetime > stok_berjalan.last_so_datetime)
    ), 0) + 
    COALESCE((
      SELECT SUM(sol_ppm.qty_composition) 
      FROM penjualan_produk_mixing sol_ppm 
      JOIN penjualan sol_p2 ON sol_ppm.penjualan_id = sol_p2.id 
      WHERE sol_ppm.sku = stok_berjalan.sku 
      AND sol_p2.status IN ('Confirmed', 'Completed') 
      AND (stok_berjalan.last_so_datetime IS NULL OR sol_p2.datetime > stok_berjalan.last_so_datetime)
    ), 0)
  ) as v_qty_terjual
  , (SELECT COALESCE(SUM(st_w.qty), 0) FROM stok_terbuang st_w WHERE st_w.sku = stok_berjalan.sku AND (stok_berjalan.last_so_datetime IS NULL OR st_w.created_at > stok_berjalan.last_so_datetime)) as v_qty_waste
  , (SELECT COALESCE(SUM(sr_r.qty), 0) FROM stok_retur sr_r WHERE sr_r.sku = stok_berjalan.sku AND (stok_berjalan.last_so_datetime IS NULL OR sr_r.created_at > stok_berjalan.last_so_datetime)) as v_qty_retur
  , (
    SELECT sub_pr.price FROM (
        SELECT p_in.price_per_unit_accepted as price, p_in.created_at as dt 
        FROM penerimaan p_in 
        JOIN pembelian_produk pp_in ON p_in.purchase_product_id = pp_in.id 
        WHERE pp_in.name = stok_berjalan.name
        UNION ALL
        SELECT sm_pr.new_running_stock_price_per_unit as price, sm_pr.created_at as dt 
        FROM stok_masuk sm_pr 
        WHERE sm_pr.sku = stok_berjalan.sku
    ) sub_pr ORDER BY dt DESC LIMIT 1
  ) as v_price_running
`;

/**
 * STOK BERJALAN SERVICE
 * Logic backend untuk modul Stok Berjalan (Running Stock).
 * Menangani CRUD dan kalkulasi stok dinamis (virtual columns).
 */

export const stokBerjalanService = {
  /**
   * Mengambil semua data stok berjalan dengan kalkulasi field virtual.
   */
  async getAll(activeOnly: boolean = false): Promise<IStokBerjalan[]> {
    const sql = activeOnly 
      ? `SELECT * ${VIRTUAL_FIELDS_SQL} FROM stok_berjalan WHERE is_active = 1 ORDER BY name ASC`
      : `SELECT * ${VIRTUAL_FIELDS_SQL} FROM stok_berjalan ORDER BY name ASC`;
    try {
      const result = await dbClient.query(sql);
      const rows = result.rows as any[];
      
      return Promise.all(rows.map(row => this._populateVirtualFields(row)));
    } catch (error) {
      errorService.handle(error);
      return [];
    }
  },

  /**
   * Mengambil data stok berjalan paged dengan pencarian.
   */
  async getPaginated(
    page: number = 1,
    limit: number = 15,
    search: string = '',
    category?: string,
    is_active?: number
  ): Promise<{ items: IStokBerjalan[]; total: number }> {
    const offset = (page - 1) * limit;
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    const countParams: any[] = [];

    if (is_active !== undefined) {
      whereClause += ` AND is_active = ?`;
      params.push(is_active);
      countParams.push(is_active);
    }

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

    const sqlData = `SELECT * ${VIRTUAL_FIELDS_SQL} FROM stok_berjalan ${whereClause} ORDER BY name ASC LIMIT ? OFFSET ?`;
    const sqlCount = `SELECT COUNT(*) as total FROM stok_berjalan ${whereClause}`;

    params.push(limit, offset);

    try {
      const [dataRes, countRes] = await Promise.all([
        dbClient.query(sqlData, params),
        dbClient.query(sqlCount, countParams)
      ]);

      const items = await Promise.all((dataRes.rows as any[]).map(row => this._populateVirtualFields(row)));
      const total = Number((countRes.rows[0] as any).total || 0);

      return { items, total };
    } catch (error) {
      errorService.handle(error);
      return { items: [], total: 0 };
    }
  },

  /**
   * Mengambil satu data stok berjalan berdasarkan SKU.
   */
  async getBySku(sku: string): Promise<IStokBerjalan | null> {
    const sql = `SELECT * ${VIRTUAL_FIELDS_SQL} FROM stok_berjalan WHERE sku = ? LIMIT 1`;
    try {
      const result = await dbClient.query(sql, [sku]);
      if (result.rows.length === 0) return null;
      return this._populateVirtualFields(result.rows[0] as any);
    } catch (error) {
      errorService.handle(error);
      return null;
    }
  },

  /**
   * Mengambil satu data stok berjalan berdasarkan ID.
   */
  async getById(id: string): Promise<IStokBerjalan | null> {
    const sql = `SELECT * ${VIRTUAL_FIELDS_SQL} FROM stok_berjalan WHERE id = ? LIMIT 1`;
    try {
      const result = await dbClient.query(sql, [id]);
      if (result.rows.length === 0) return null;
      return this._populateVirtualFields(result.rows[0] as any);
    } catch (error) {
      errorService.handle(error);
      return null;
    }
  },

  /**
   * Membuat master stok baru.
   */
  async create(data: IStokBerjalanPayload): Promise<IStokBerjalan | null> {
    const id = generateUUID();
    const session = this._getCurrentSession();
    const timezone = getTimezoneIdentifier();

    const sql = `
      INSERT INTO stok_berjalan (
        id, sku, category, sub_category, name, unit, 
        last_so_datetime, qty_so, base_price, is_active,
        created_by, created_timezone
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      id,
      data.sku,
      data.category,
      data.sub_category,
      data.name,
      data.unit,
      data.last_so_datetime || null,
      data.qty_so || 0,
      data.base_price || 0,
      1, // Active by default
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
   * Memperbarui master stok.
   */
  async update(id: string, data: Partial<IStokBerjalanPayload>): Promise<IStokBerjalan | null> {
    const session = this._getCurrentSession();
    const timezone = getTimezoneIdentifier();

    try {
      const existing = await this.getById(id);
      if (!existing) throw new Error('Produk stok tidak ditemukan');

      const updates: string[] = [];
      const params: any[] = [];

      const fields: (keyof IStokBerjalanPayload)[] = [
        'sku', 'category', 'sub_category', 'name', 'unit', 
        'last_so_datetime', 'qty_so', 'base_price', 'is_active'
      ];

      fields.forEach(field => {
        if (data[field] !== undefined) {
          updates.push(`${field} = ?`);
          params.push(data[field]);
        }
      });

      if (updates.length > 0) {
        updates.push(`updated_by = ?`);
        params.push(session?.user_id || null);
        updates.push(`updated_timezone = ?`);
        params.push(timezone);

        params.push(id);
        const sql = `UPDATE stok_berjalan SET ${updates.join(', ')} WHERE id = ?`;
        await dbClient.query(sql, params);
      }

      return this.getById(id);
    } catch (error) {
      errorService.handle(error);
      return null;
    }
  },

  /**
   * Menghapus master stok.
   */
  async delete(id: string): Promise<boolean> {
    const existing = await this.getById(id);
    if (!existing) return false;

    // Soft delete if the item is active, hard delete if already inactive (or just always soft delete)
    // Actually just always soft delete or switch status to 0
    const sql = `UPDATE stok_berjalan SET is_active = 0 WHERE id = ?`;
    try {
      await dbClient.query(sql, [id]);
      return true;
    } catch (error) {
      errorService.handle(error);
      return false;
    }
  },

  /**
   * HELPER: Mengisi field virtual berdasarkan data transaksi riil.
   * Mendukung mapping sinkron jika kolom virtual sudah ada dari query atau fallback async jika belum ada.
   */
  async _populateVirtualFields(row: any): Promise<IStokBerjalan> {
    // Jika data virtual sudah ada di row (hasil query optimasi), lakukan mapping sinkron
    if (row.v_qty_in !== undefined) {
      return this._mapVirtualFields(row);
    }

    const lastSO = row.last_so_datetime;
    const sku = row.sku;
    const name = row.name;

    // Filter waktu: Jika ada SO terakhir, ambil transaksi setelahnya saja
    // Standard comparison for TIMESTAMPTZ columns in PostgreSQL
    const timeFilterSm = lastSO ? `AND sm.created_at > ?` : '';
    const timeFilterSr = lastSO ? `AND sr.created_at > ?` : '';
    const timeFilterSt = lastSO ? `AND st.created_at > ?` : '';
    
    // 1. Qty Masuk (In): HANYA dari Stok Masuk (Manual/Kontrak + Antrian Penerimaan & Pemrosesan yang sudah divalidasi)
    const sqlIn = `
      SELECT COALESCE(SUM(sm.qty_in), 0) as qty_stok_masuk
      FROM stok_masuk sm
      WHERE sm.sku = ? ${timeFilterSm}
    `;

    // 2. Qty Terjual (Out): Modul Penjualan
    const sqlOut = `
      SELECT (
        -- Normal items
        (SELECT COALESCE(SUM(pp.qty), 0) 
         FROM penjualan_produk pp 
         JOIN penjualan p ON pp.penjualan_id = p.id
         WHERE pp.sku = ? 
         AND pp.is_mixing = 0 
         AND pp.is_dropship = 0
         AND p.status IN ('Confirmed', 'Completed')
         ${lastSO ? `AND p.datetime > ?` : ''})
        +
        -- Components of mixing items
        (SELECT COALESCE(SUM(ppm.qty_composition), 0)
         FROM penjualan_produk_mixing ppm
         JOIN penjualan p ON ppm.penjualan_id = p.id
         WHERE ppm.sku = ?
         AND p.status IN ('Confirmed', 'Completed')
         ${lastSO ? `AND p.datetime > ?` : ''})
      ) as qty
    `;

    // 3. Qty Terbuang: HANYA dari Stok Terbuang
    const sqlTerbuang = `
      SELECT COALESCE(SUM(st.qty), 0) as qty
      FROM stok_terbuang st
      WHERE st.sku = ? ${timeFilterSt}
    `;

    // 4. Running Price: Ambil dari harga penerimaan terbaru ATAU stok masuk terbaru
    const sqlPrice = `
      SELECT price FROM (
        SELECT p.price_per_unit_accepted as price, p.created_at as dt
        FROM penerimaan p 
        JOIN pembelian_produk pp ON p.purchase_product_id = pp.id 
        WHERE pp.name = ?
        UNION ALL
        SELECT sm.new_running_stock_price_per_unit as price, sm.created_at as dt
        FROM stok_masuk sm
        WHERE sm.sku = ?
      ) ORDER BY dt DESC LIMIT 1
    `;

    // 5. Qty Retur: Dari Stok Retur (Stok Kembali Masuk)
    const sqlRetur = `
      SELECT COALESCE(SUM(sr.qty), 0) as qty
      FROM stok_retur sr
      WHERE sr.sku = ? ${timeFilterSr}
    `;

    try {
      // Siapkan params untuk setiap query
      const paramsIn = [sku]; if (lastSO) paramsIn.push(lastSO);
      const paramsTerbuang = [sku]; if (lastSO) paramsTerbuang.push(lastSO);
      const paramsRetur = [sku]; if (lastSO) paramsRetur.push(lastSO);
      
      const paramsOut = [sku]; 
      if (lastSO) paramsOut.push(lastSO);
      paramsOut.push(sku);
      if (lastSO) paramsOut.push(lastSO);

      const [inRes, outRes, terbuangRes, priceRes, returRes] = await Promise.all([
        dbClient.query(sqlIn, paramsIn),
        dbClient.query(sqlOut, paramsOut),
        dbClient.query(sqlTerbuang, paramsTerbuang),
        dbClient.query(sqlPrice, [name, sku]),
        dbClient.query(sqlRetur, paramsRetur),
      ]);

      const inData = inRes.rows[0] as any;
      const qty_in = Number(inData.qty_stok_masuk || 0);
      
      const qty_terjual = Number((outRes.rows[0] as any).qty || 0);
      
      const qty_terbuang = Number((terbuangRes.rows[0] as any).qty || 0);
      
      const qty_retur = Number((returRes.rows[0] as any).qty || 0);
      
      const price_running = priceRes.rows.length > 0 
        ? Number((priceRes.rows[0] as any).price) 
        : Number(row.base_price || 0);

      const qty_current = Number(row.qty_so || 0) + qty_in + qty_retur - qty_terjual - qty_terbuang;
      const total_valuation = qty_current * price_running;

      return {
        ...row,
        qty_in_after_so: qty_in,
        qty_retur_after_so: qty_retur,
        qty_out_after_so: qty_terjual, // Legacy property maintained for type compatibility
        qty_waste_after_so: qty_terbuang, // Legacy property maintained for type compatibility
        qty_terjual: qty_terjual, // Real sales quantity from Penjualan module
        qty_terbuang_only: qty_terbuang, // Explicitly bounds Stok Terbuang to stok_terbuang module
        price_per_unit_running: price_running,
        total_valuation_running: total_valuation,
        qty_current: qty_current
      } as IStokBerjalan;
    } catch (e) {
      console.warn('Virtual fields calculation failed for', name, e);
      return {
        ...row,
        qty_in_after_so: 0,
        qty_retur_after_so: 0,
        qty_out_after_so: 0,
        qty_waste_after_so: 0,
        qty_terjual: 0,
        qty_terbuang_only: 0,
        price_per_unit_running: Number(row.base_price || 0),
        total_valuation_running: 0,
        qty_current: Number(row.qty_so || 0)
      } as IStokBerjalan;
    }
  },

  /**
   * Mapper sinkron untuk mengonversi hasil query virtual menjadi interface IStokBerjalan.
   */
  _mapVirtualFields(row: any): IStokBerjalan {
    const qty_in = Number(row.v_qty_in || 0);
    const qty_terjual = Number(row.v_qty_terjual || 0);
    const qty_terbuang = Number(row.v_qty_waste || 0);
    const qty_retur = Number(row.v_qty_retur || 0);
    
    // Gunakan v_price_running jika tersedia, fallback ke base_price
    const price_running = row.v_price_running !== undefined && row.v_price_running !== null
      ? Number(row.v_price_running) 
      : Number(row.base_price || 0);

    const qty_current = Number(row.qty_so || 0) + qty_in + qty_retur - qty_terjual - qty_terbuang;
    const total_valuation = qty_current * price_running;

    return {
      ...row,
      qty_in_after_so: qty_in,
      qty_retur_after_so: qty_retur,
      qty_out_after_so: qty_terjual,
      qty_waste_after_so: qty_terbuang,
      qty_terjual: qty_terjual,
      qty_terbuang_only: qty_terbuang,
      price_per_unit_running: price_running,
      total_valuation_running: total_valuation,
      qty_current: qty_current
    } as IStokBerjalan;
  },

  /**
   * Mengambil session aktif dari storage.
   */
  _getCurrentSession(): IAkunSession | null {
    return browserStorage.get<IAkunSession>('active_user');
  }
};
