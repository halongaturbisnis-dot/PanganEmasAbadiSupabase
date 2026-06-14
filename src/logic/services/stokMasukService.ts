import { dbClient } from '../libs/database.js';
import { IStokMasuk, IStokMasukPayload } from '../types/ITs_StokMasuk.js';
import { generateUUID } from '../utils/data.js';
import { errorService } from './errorService.js';
import { browserStorage } from '../utils/browserStorage.js';
import { getTimezoneIdentifier } from '../utils/time.js';
import { IAkunSession } from '../types/ITs_Akun.js';
import { stokBerjalanService } from './stokBerjalanService.js';

/**
 * STOK MASUK SERVICE
 * Logic backend untuk modul Stok Masuk.
 * Menangani CRUD dan kalkulasi Moving Average Price.
 */

export const stokMasukService = {
  /**
   * Mengambil semua data stok masuk.
   */
  async getAll(): Promise<IStokMasuk[]> {
    const sql = `SELECT * FROM stok_masuk ORDER BY created_at DESC`;
    try {
      const result = await dbClient.query(sql);
      return result.rows as any[];
    } catch (error) {
      errorService.handle(error);
      return [];
    }
  },

  /**
   * Mengambil data stok masuk paged.
   */
  async getPaginated(
    page: number = 1,
    limit: number = 15,
    search: string = '',
    startDate?: string,
    endDate?: string
  ): Promise<{ items: IStokMasuk[]; total: number }> {
    const offset = (page - 1) * limit;
    let whereConditions: string[] = ['1=1'];
    const params: any[] = [];
    
    if (search) {
      whereConditions.push(`(stok_masuk.name LIKE ? OR stok_masuk.sku LIKE ? OR stok_masuk.category LIKE ? OR stok_masuk.purchase_id LIKE ? OR stok_masuk.receiving_id LIKE ?)`);
      const s = `%${search}%`;
      params.push(s, s, s, s, s);
    }

    if (startDate) {
      const localDate = new Date(`${startDate}T00:00:00`);
      const utcStart = localDate.toISOString().replace('T', ' ').slice(0, 19);
      whereConditions.push(`stok_masuk.created_at >= ?`);
      params.push(utcStart);
    }

    if (endDate) {
      const localDate = new Date(`${endDate}T23:59:59`);
      const utcEnd = localDate.toISOString().replace('T', ' ').slice(0, 19);
      whereConditions.push(`stok_masuk.created_at <= ?`);
      params.push(utcEnd);
    }

    const whereClause = `WHERE ${whereConditions.join(' AND ')}`;
    const sqlData = `SELECT stok_masuk.*, pembelian.po_number as kode_pembelian FROM stok_masuk LEFT JOIN pembelian ON stok_masuk.purchase_id = pembelian.id ${whereClause} ORDER BY stok_masuk.created_at DESC LIMIT ? OFFSET ?`;
    const sqlCount = `SELECT COUNT(*) as total FROM stok_masuk ${whereClause}`;

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
   * Mengambil satu data stok masuk berdasarkan ID.
   */
  async getById(id: string): Promise<IStokMasuk | null> {
    const sql = `SELECT * FROM stok_masuk WHERE id = ? LIMIT 1`;
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
   * Mendapatkan record stok masuk terakhir untuk SKU tertentu.
   */
  async getLastBySku(sku: string): Promise<IStokMasuk | null> {
    const sql = `SELECT * FROM stok_masuk WHERE sku = ? ORDER BY created_at DESC LIMIT 1`;
    try {
      const result = await dbClient.query(sql, [sku]);
      if (result.rows.length === 0) return null;
      return result.rows[0] as any;
    } catch (error) {
      errorService.handle(error);
      return null;
    }
  },

  /**
   * Membuat record stok masuk baru (dengan kalkulasi Moving Average Price).
   */
  async create(data: IStokMasukPayload): Promise<IStokMasuk | null> {
    const id = generateUUID();
    const session = this._getCurrentSession();
    const timezone = getTimezoneIdentifier();

    try {
      // 1. Ambil status terakhir dari Stok Berjalan untuk SKU ini
      const runningStock = await stokBerjalanService.getBySku(data.sku);
      
      let newMovingAverage = 0;
      const qtyIn = Number(data.qty_in || 0);
      const totalPriceIn = Number(data.total_price_in || 0);

      if (runningStock) {
        const currentQty = Number(runningStock.qty_current || 0);
        const currentPrice = Number(runningStock.price_per_unit_running || 0);

        // RUMUS: ((sisa kuantiti * harga satuan) + Total Price in) / (Qty stok masuk + Sisa Kuantiti)
        const totalValuationOld = currentQty * currentPrice;
        const totalQtyNew = qtyIn + currentQty;

        if (totalQtyNew > 0) {
          newMovingAverage = Math.round((totalValuationOld + totalPriceIn) / totalQtyNew);
        } else {
          newMovingAverage = Math.round(data.price_per_unit_in); // Fallback jika stok nol
        }

        // Sinkronisasi Dinamis base_price di Tabel stok_berjalan
        await stokBerjalanService.update(runningStock.id, {
          base_price: newMovingAverage,
        });
      } else {
        // Jika SKU belum ada di master stok, gunakan harga masuk pertama kali
        newMovingAverage = Math.round(data.price_per_unit_in);

        // Otomatis daftarkan SKU baru ke Stok Berjalan
        await stokBerjalanService.create({
          sku: data.sku,
          category: data.category,
          sub_category: data.sub_category || '',
          name: data.name,
          unit: data.unit,
          qty_so: 0,
          base_price: Math.round(data.price_per_unit_in),
        } as any);
      }

      const sql = `
        INSERT INTO stok_masuk (
          id, purchase_id, purchase_product_id, receiving_id, processing_id,
          sku, category, sub_category, name, unit,
          qty_in, price_per_unit_in, total_price_in,
          new_running_stock_price_per_unit, description,
          created_by, created_timezone
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const params = [
        id,
        data.purchase_id || null,
        data.purchase_product_id || null,
        data.receiving_id || null,
        data.processing_id || null,
        data.sku,
        data.category,
        data.sub_category,
        data.name,
        data.unit,
        qtyIn,
        data.price_per_unit_in,
        totalPriceIn,
        newMovingAverage,
        data.description || null,
        session?.user_id || null,
        timezone
      ];

      await dbClient.query(sql, params);
      if (data.processing_id) {
        await this.syncQtyMasukStokForPemrosesan(data.processing_id);
      }
      return this.getById(id);
    } catch (error) {
      errorService.handle(error);
      return null;
    }
  },

  /**
   * Memperbarui record stok masuk.
   * Catatan: Memperbarui stok masuk historis berisiko merusak moving average berikutnya.
   */
  async update(id: string, data: Partial<IStokMasukPayload>): Promise<IStokMasuk | null> {
    const session = this._getCurrentSession();
    const timezone = getTimezoneIdentifier();

    try {
      const existing = await this.getById(id);
      const oldProcessingId = existing?.processing_id;

      const updates: string[] = [];
      const params: any[] = [];

      const fields: (keyof IStokMasukPayload)[] = [
        'purchase_id', 'purchase_product_id', 'receiving_id', 'processing_id',
        'sku', 'category', 'sub_category', 'name', 'unit',
        'qty_in', 'price_per_unit_in', 'total_price_in',
        'new_running_stock_price_per_unit', 'description'
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
        const sql = `UPDATE stok_masuk SET ${updates.join(', ')} WHERE id = ?`;
        await dbClient.query(sql, params);
      }

      if (oldProcessingId) {
        await this.syncQtyMasukStokForPemrosesan(oldProcessingId);
      }
      if (data.processing_id && data.processing_id !== oldProcessingId) {
        await this.syncQtyMasukStokForPemrosesan(data.processing_id);
      }

      return this.getById(id);
    } catch (error) {
      errorService.handle(error);
      return null;
    }
  },

  /**
   * Menghapus record stok masuk.
   */
  async delete(id: string): Promise<boolean> {
    const sql = `DELETE FROM stok_masuk WHERE id = ?`;
    try {
      const existing = await this.getById(id);
      const processingId = existing?.processing_id;

      await dbClient.query(sql, [id]);

      if (processingId) {
        await this.syncQtyMasukStokForPemrosesan(processingId);
      }
      return true;
    } catch (error) {
      errorService.handle(error);
      return false;
    }
  },

  /**
   * Mensinkronkan qty_masuk_stok pada tabel pemrosesan berdasarkan data stok_masuk terkini.
   */
  async syncQtyMasukStokForPemrosesan(processingId: string): Promise<void> {
    try {
      const sumRes = await dbClient.query(`SELECT COALESCE(SUM(qty_in), 0) as total FROM stok_masuk WHERE processing_id = ?`, [processingId]);
      const totalIn = Number((sumRes.rows[0] as any).total || 0);
      await dbClient.query(`UPDATE pemrosesan SET qty_masuk_stok = ? WHERE id = ?`, [totalIn, processingId]);
    } catch (error) {
      console.error("[Sync Error] Failed to sync qty_masuk_stok for pemrosesan:", error);
    }
  },

  /**
   * Mengambil daftar item penerimaan/pemrosesan yang belum sepenuhnya dicatat di stok masuk (Antrian).
   * Group 1: Non QC dari Penerimaan.
   * Group 2: Produk dari Pemrosesan (QC).
   */
  async getQueue(): Promise<any[]> {
    const sql = `
      SELECT * FROM (
        -- Group 1: Non QC dari Penerimaan
        SELECT 
          'penerimaan' as source_type,
          pr.id as receiving_id,
          NULL as processing_id,
          pr.purchase_id,
          pr.purchase_product_id,
          pr.qty_received_actual as qty_max,
          (SELECT COALESCE(SUM(qty_in), 0) FROM stok_masuk WHERE receiving_id = pr.id AND processing_id IS NULL) as qty_already_in,
          pr.price_per_unit_accepted as price_per_unit_in,
          pr.accepted_valuation as total_price_in,
          pr.datetime as receipt_date,
          pp.name,
          (SELECT sku FROM stok_berjalan WHERE name = pp.name AND category = pp.category AND sub_category = pp.sub_category LIMIT 1) as sku,
          pp.category,
          pp.sub_category,
          pp.unit,
          p.po_number as kode_pembelian
        FROM penerimaan pr
        JOIN pembelian_produk pp ON pr.purchase_product_id = pp.id
        JOIN pembelian p ON pr.purchase_id = p.id
        WHERE pr.sorting_type != 'QC'

        UNION ALL

        -- Group 2: Produk dari Pemrosesan (QC)
        SELECT 
          'pemrosesan' as source_type,
          pr.receiving_id,
          pr.id as processing_id,
          pr.pembelian_id as purchase_id,
          pr.pembelian_produk_id as purchase_product_id,
          pr.qty_sesudah as qty_max,
          (SELECT COALESCE(SUM(qty_in), 0) FROM stok_masuk WHERE processing_id = pr.id) as qty_already_in,
          pr.current_unit_price as price_per_unit_in,
          pr.current_valuation as total_price_in,
          pr.datetime as receipt_date,
          pp.name,
          (SELECT sku FROM stok_berjalan WHERE name = pp.name AND category = pp.category AND sub_category = pp.sub_category LIMIT 1) as sku,
          pp.category,
          pp.sub_category,
          pp.unit,
          p.po_number as kode_pembelian
        FROM pemrosesan pr
        JOIN pembelian_produk pp ON pr.pembelian_produk_id = pp.id
        JOIN pembelian p ON pr.pembelian_id = p.id
        -- Dihapus kondisi pr.status IN ('completed', 'processing') karena kata user: "ngga peduli dia sedang processing atau completed statusnya"
      ) 
      WHERE (qty_max - qty_already_in) > 0
      ORDER BY receipt_date DESC
    `;
    
    try {
      const result = await dbClient.query(sql);
      return result.rows as any[];
    } catch (error) {
      errorService.handle(error);
      return [];
    }
  },

  /**
   * Mengambil detail satu item antrian berdasarkan receiving_id dan processing_id.
   */
  async getQueueItemByIds(receivingId: string, processingId: string | null): Promise<any | null> {
    const processingFilter = processingId ? `pr.id = ?` : `pr.id = ? AND processing_id IS NULL`; // This logic is slightly wrong since we join different tables.
    
    // Better to re-run the union with a filter or split.
    const queue = await this.getQueue();
    return queue.find(q => q.receiving_id === receivingId && q.processing_id === processingId) || null;
  },

  /**
   * Mengambil session aktif dari storage.
   */
  _getCurrentSession(): IAkunSession | null {
    return browserStorage.get<IAkunSession>('active_user');
  }
};
