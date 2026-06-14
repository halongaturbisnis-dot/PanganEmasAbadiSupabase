import { dbClient } from '../libs/database.js';
import { ITs_Pemrosesan, IPemrosesanPayload, IPemrosesanUpdatePayload, ITs_PemrosesanLog, IPemrosesanLogPayload } from '../types/ITs_Pemrosesan.js';
import { errorService } from './errorService.js';
import { storageService } from './storage.js';
import { akunService } from './akunService.js';
import { generateUUID } from '../utils/data.js';
import { getPageFetchLimit } from './fetchingCenter.js';
import { getTimezoneIdentifier } from '../utils/time.js';

/**
 * PEMROSESAN SERVICE
 * Service untuk menangani logika bisnis modul Pemrosesan.
 * Mendukung pencatatan penyusutan, efisiensi, valuasi dinamis, dan logs iteratif.
 */

export const pemrosesanService = {
  /**
   * Mengambil data pemrosesan dengan paginasi dan filter.
   */
  async getPaginated(
    page: number = 1,
    options?: {
      limit?: number;
      pembelian_id?: string;
      pembelian_produk_id?: string;
      status?: ITs_Pemrosesan['status'];
      search?: string;
      sortKey?: string;
      sortDir?: 'asc' | 'desc';
      startDate?: string;
      endDate?: string;
    }
  ): Promise<{ items: ITs_Pemrosesan[]; total: number }> {
    const fetchLimit = options?.limit || getPageFetchLimit('DaftarPemrosesan');
    const offset = (page - 1) * fetchLimit;

    const whereConditions: string[] = [];
    const params: any[] = [];

    if (options?.pembelian_id) {
      whereConditions.push(`p.pembelian_id = ?`);
      params.push(options.pembelian_id);
    }

    if (options?.pembelian_produk_id) {
      whereConditions.push(`p.pembelian_produk_id = ?`);
      params.push(options.pembelian_produk_id);
    }

    if (options?.status) {
      whereConditions.push(`p.status = ?`);
      params.push(options.status);
    }

    if (options?.search) {
      whereConditions.push(`(pp.name LIKE ? OR p.jenis_pemrosesan LIKE ? OR p.keterangan LIKE ?)`);
      const s = `%${options.search}%`;
      params.push(s, s, s);
    }

    if (options?.startDate) {
      // Use updated_at for completed, otherwise datetime
      const isUTCField = options.status === 'completed';
      const dateField = isUTCField ? 'updated_at' : 'datetime';
      
      let startVal = `${options.startDate} 00:00:00`;
      if (isUTCField) {
        // Convert local date 00:00:00 to UTC ISO string for comparison
        const localDate = new Date(`${options.startDate}T00:00:00`);
        startVal = localDate.toISOString().replace('T', ' ').slice(0, 19);
      }
      
      whereConditions.push(`p.${dateField} >= ?`);
      params.push(startVal);
    }

    if (options?.endDate) {
      const isUTCField = options.status === 'completed';
      const dateField = isUTCField ? 'updated_at' : 'datetime';
      
      let endVal = `${options.endDate} 23:59:59`;
      if (isUTCField) {
        // Convert local date 23:59:59 to UTC ISO string for comparison
        const localDate = new Date(`${options.endDate}T23:59:59`);
        endVal = localDate.toISOString().slice(0, 10) === options.endDate ? localDate.toISOString().replace('T', ' ').slice(0, 19) : endVal;
        // Re-calculate to be sure
        const endD = new Date(`${options.endDate}T23:59:59`);
        endVal = endD.toISOString().replace('T', ' ').slice(0, 19);
      }
      
      whereConditions.push(`p.${dateField} <= ?`);
      params.push(endVal);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    const allowedSortKeys = ['datetime', 'qty_penyusutan', 'created_at', 'current_valuation'];
    const finalSortKey = allowedSortKeys.includes(options?.sortKey || '') ? options?.sortKey : 'datetime';
    const finalSortDir = options?.sortDir?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const sqlData = `
      SELECT 
        p.*, 
        pp.name AS nama_produk, 
        pp.unit,
        pp.category,
        pp.sub_category,
        COALESCE((SELECT SUM(sm.qty_in) FROM stok_masuk sm WHERE sm.processing_id = p.id), 0) as qty_masuk_stok,
        COALESCE((SELECT SUM(sm.total_price_in) FROM stok_masuk sm WHERE sm.processing_id = p.id), 0) as total_price_masuk_stok
      FROM pemrosesan p
      JOIN pembelian_produk pp ON p.pembelian_produk_id = pp.id
      ${whereClause} 
      ORDER BY p.${finalSortKey} ${finalSortDir} 
      LIMIT ? OFFSET ?
    `;
    const sqlCount = `
      SELECT COUNT(*) as total 
      FROM pemrosesan p
      JOIN pembelian_produk pp ON p.pembelian_produk_id = pp.id
      ${whereClause}
    `;

    const countParams = [...params];
    params.push(fetchLimit, offset);

    try {
      const [dataRes, countRes] = await Promise.all([
        dbClient.query(sqlData, params),
        dbClient.query(sqlCount, countParams)
      ]);

      return {
        items: dataRes.rows as unknown as ITs_Pemrosesan[],
        total: Number((countRes.rows[0] as any).total || 0)
      };
    } catch (error) {
      errorService.handle(error);
      return { items: [], total: 0 };
    }
  },

  /**
   * Detail pemrosesan berdasarkan ID termasuk logs.
   */
  async getById(id: string): Promise<ITs_Pemrosesan | null> {
    const sql = `SELECT * FROM pemrosesan WHERE id = ? LIMIT 1`;
    const sqlLogs = `SELECT * FROM pemrosesan_log WHERE pemrosesan_id = ? ORDER BY datetime ASC`;
    try {
      const result = await dbClient.query(sql, [id]);
      if (result.rows.length === 0) return null;
      
      const item = result.rows[0] as unknown as ITs_Pemrosesan;
      
      // Calculate dynamic stock entry sums
      const totalInSql = `SELECT COALESCE(SUM(qty_in), 0) as total_qty, COALESCE(SUM(total_price_in), 0) as total_price FROM stok_masuk WHERE processing_id = ?`;
      const totalInRes = await dbClient.query(totalInSql, [id]);
      const calculatedQtyMasukStok = Number((totalInRes.rows[0] as any).total_qty || 0);
      const totalPriceMasukStok = Number((totalInRes.rows[0] as any).total_price || 0);

      // Sync the column in SQLite table if it differs
      if (Number(item.qty_masuk_stok || 0) !== calculatedQtyMasukStok) {
        await dbClient.query(`UPDATE pemrosesan SET qty_masuk_stok = ? WHERE id = ?`, [calculatedQtyMasukStok, id]);
        item.qty_masuk_stok = calculatedQtyMasukStok;
      }

      const logsRes = await dbClient.query(sqlLogs, [id]);
      
      return {
        ...item,
        qty_masuk_stok: calculatedQtyMasukStok,
        total_price_masuk_stok: totalPriceMasukStok,
        logs: logsRes.rows as unknown as ITs_PemrosesanLog[]
      };
    } catch (error) {
      errorService.handle(error);
      return null;
    }
  },

  /**
   * Memulau Batch Pemrosesan Baru.
   */
  async create(data: IPemrosesanPayload): Promise<ITs_Pemrosesan | null> {
    try {
      const id = generateUUID();
      const session = akunService.getCurrentSession();
      const timezone = getTimezoneIdentifier();

      const sql = `
        INSERT INTO pemrosesan (
          id, pembelian_id, pembelian_produk_id, receiving_id,
          initial_valuation, current_valuation, current_unit_price,
          datetime, jenis_pemrosesan, qty_sebelum, qty_sesudah, qty_penyusutan, 
          kadar_air_post, status, created_by, created_timezone
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const params = [
        id,
        data.pembelian_id,
        data.pembelian_produk_id,
        data.receiving_id,
        data.initial_valuation,
        data.initial_valuation, // Valuasi awal = current saat baru mulai
        data.initial_qty > 0 ? data.initial_valuation / data.initial_qty : 0, // Unit price awal
        data.datetime,
        data.jenis_pemrosesan || 'Batch Baru',
        data.initial_qty, // qty_sebelum
        data.initial_qty, // qty_sesudah (saat baru mulai belum ada penyusutan)
        0, // penyusutan nol
        data.initial_moisture || 0, // kadar_air_post inisial
        'processing',
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
   * Menambahkan log proses iteratif.
   * Fungsi ini otomatis mengupdate parent (pemrosesan) terkait akumulasi Qty dan Valuasi.
   */
  async addLog(data: IPemrosesanLogPayload): Promise<ITs_Pemrosesan | null> {
    try {
      const logId = generateUUID();
      const session = akunService.getCurrentSession();
      const timezone = getTimezoneIdentifier();

      const qty_penyusutan_log = Math.max(0, data.qty_sebelum - data.qty_sesudah);

      // 1. Upload files if any
      const uploadedFiles: { url: string; key: string }[] = [];
      if (data.files && data.files.length > 0) {
        for (const file of data.files) {
          const result = await storageService.upload(file, 'processing');
          uploadedFiles.push(result);
        }
      }

      // 2. Insert Log
      const sqlLog = `
        INSERT INTO pemrosesan_log (
          id, pemrosesan_id, datetime, jenis_log, qty_sebelum, qty_sesudah, 
          qty_penyusutan, kadar_air_post, keterangan, proof_fileurl, 
          created_by, created_timezone
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      await dbClient.query(sqlLog, [
        logId, data.pemrosesan_id, data.datetime, data.jenis_log, 
        data.qty_sebelum, data.qty_sesudah, qty_penyusutan_log, 
        data.kadar_air_post || null, data.keterangan || null, 
        JSON.stringify(uploadedFiles), session?.user_id || null, timezone
      ]);

      // 3. Rekalkulasi Parent
      const parent = await this.getById(data.pemrosesan_id);
      if (!parent || !parent.logs) return null;

      // Logika: Qty Sebelum Batch adalah Qty Awal Penerimaan (tetap).
      // Qty Sesudah Batch adalah Qty Sebelum dikurangi Akumulasi Penyusutan dari SEMUA LOG.
      // Qty Penyusutan Batch adalah Akumulasi Penyusutan dari SEMUA LOG.
      
      const lastLog = parent.logs[parent.logs.length - 1];
      const totalPenyusutan = parent.logs.reduce((acc, curr) => acc + curr.qty_penyusutan, 0);
      const qtySesudah = parent.qty_sebelum - totalPenyusutan;
      
      // Valuasi Dinamis: Valuasi Awal tetap. current_valuation = initial_valuation (krn asumsi rugi qty, valuasi uang tetap)
      // TAPI harga per unit naik.
      const currentValuation = parent.initial_valuation;
      const currentUnitPrice = qtySesudah > 0 ? currentValuation / qtySesudah : 0;

      const sqlUpdateParent = `
        UPDATE pemrosesan SET
          qty_sesudah = ?,
          qty_penyusutan = ?,
          current_valuation = ?,
          current_unit_price = ?,
          kadar_air_post = ?,
          updated_by = ?,
          updated_timezone = ?
        WHERE id = ?
      `;
      
      await dbClient.query(sqlUpdateParent, [
        qtySesudah,
        totalPenyusutan,
        currentValuation,
        currentUnitPrice,
        lastLog.kadar_air_post || parent.kadar_air_post,
        session?.user_id || null,
        timezone,
        parent.id
      ]);

      return await this.getById(parent.id);
    } catch (error) {
      errorService.handle(error);
      return null;
    }
  },

  /**
   * Finalisasi batch pemrosesan.
   */
  async completeBatch(id: string): Promise<boolean> {
    try {
      const session = akunService.getCurrentSession();
      const timezone = getTimezoneIdentifier();
      
      await dbClient.query(
        `UPDATE pemrosesan SET status = 'completed', updated_by = ?, updated_timezone = ? WHERE id = ?`,
        [session?.user_id || null, timezone, id]
      );
      return true;
    } catch (error) {
      errorService.handle(error);
      return false;
    }
  },

  /**
   * Hapus record.
   */
  async delete(id: string): Promise<boolean> {
    try {
      const existing = await this.getById(id);
      if (!existing) return true;

      // Cleanup Storage for logs
      if (existing.logs) {
        for (const log of existing.logs) {
          const files: { url: string; key: string }[] = JSON.parse(log.proof_fileurl || '[]');
          for (const f of files) {
            await storageService.delete(f.key);
          }
        }
      }

      await dbClient.query(`DELETE FROM pemrosesan WHERE id = ?`, [id]);
      return true;
    } catch (error) {
      errorService.handle(error);
      return false;
    }
  }
};
