import { dbClient } from '../libs/database';
import { ITs_Penerimaan, IPenerimaanSortingType } from '../types/ITs_Penerimaan';
import { storageService } from './storage';
import { generateUUID } from '../utils/data';
import { errorService } from './errorService';
import { akunService } from './akunService';

/**
 * PENERIMAAN SERVICE
 * Logic backend untuk modul Penerimaan (Receipt).
 * Menangani CRUD, Integrasi Storage, dan Relasi dengan Pembelian/Pengiriman.
 */

export const penerimaanService = {
  /**
   * Mengambil semua data penerimaan.
   */
  async getAll(): Promise<ITs_Penerimaan[]> {
    const sql = `SELECT * FROM penerimaan ORDER BY datetime DESC`;
    try {
      const result = await dbClient.query(sql);
      return result.rows as any[] as ITs_Penerimaan[];
    } catch (error) {
      errorService.handle(error);
      return [];
    }
  },

  /**
   * Mengambil data penerimaan dengan paginasi.
   */
  async getPaginated(
    page: number = 1, 
    limit: number = 15, 
    search: string = '', 
    sortKey: string = 'datetime', 
    sortDir: 'asc' | 'desc' | null = 'desc',
    startDate?: string,
    endDate?: string
  ): Promise<{ items: any[], total: number }> {
    const offset = (page - 1) * limit;
    let whereConditions: string[] = [];
    const params: any[] = [];
    
    if (search) {
      whereConditions.push(`(pr.rejected_reason LIKE ? OR pr.description LIKE ? OR pr.sorting_type LIKE ? OR pp.name LIKE ? OR p.po_number LIKE ?)`);
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam, searchParam, searchParam);
    }

    if (startDate) {
      whereConditions.push(`date(pr.datetime) >= ?`);
      params.push(startDate);
    }

    if (endDate) {
      whereConditions.push(`date(pr.datetime) <= ?`);
      params.push(endDate);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    let orderClause = `ORDER BY pr.datetime DESC`;
    if (sortKey && sortDir) {
      const allowedKeys = ['datetime', 'qty_received_actual', 'accepted_valuation', 'sorting_type'];
      if (allowedKeys.includes(sortKey)) {
        orderClause = `ORDER BY pr.${sortKey} ${sortDir.toUpperCase()}`;
      }
    }
    
    const sqlData = `
      SELECT 
        pr.*,
        pp.name as nama_produk,
        pp.unit,
        pp.qty as purchase_qty,
        pp.category,
        pp.sub_category,
        p.po_number as kode_pembelian,
        p.datetime as po_date
      FROM penerimaan pr
      JOIN pembelian_produk pp ON pr.purchase_product_id = pp.id
      JOIN pembelian p ON pr.purchase_id = p.id
      ${whereClause} 
      ${orderClause} 
      LIMIT ? OFFSET ?
    `;
    const sqlCount = `
      SELECT COUNT(*) as total 
      FROM penerimaan pr
      JOIN pembelian_produk pp ON pr.purchase_product_id = pp.id
      JOIN pembelian p ON pr.purchase_id = p.id
      ${whereClause}
    `;
    
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
   * Mengambil data penerimaan berdasarkan ID.
   */
  async getById(id: string): Promise<ITs_Penerimaan | null> {
    const sql = `SELECT * FROM penerimaan WHERE id = ? LIMIT 1`;
    try {
      const result = await dbClient.query(sql, [id]);
      if (result.rows.length === 0) return null;
      return result.rows[0] as any as ITs_Penerimaan;
    } catch (error) {
      errorService.handle(error);
      return null;
    }
  },

  /**
   * Membuat data penerimaan baru.
   */
  async create(
    data: Omit<ITs_Penerimaan, 'id' | 'created_at' | 'updated_at'>, 
    receiptFiles?: File[], 
    rejectFiles?: File[]
  ): Promise<ITs_Penerimaan | null> {
    const id = generateUUID();
    
    try {
      // 0. Audit - Creation
      const session = akunService.getCurrentSession();
      if (session) {
        data.created_by = session.user_id;
        data.created_timezone = 'Asia/Jakarta';
      }

      // 1. Upload Bukti Penerimaan (Mandatory)
      if (receiptFiles && receiptFiles.length > 0) {
        const uploadPromises = receiptFiles.map(file => storageService.upload(file, 'penerimaan/receipts'));
        const uploadResults = await Promise.all(uploadPromises);
        data.receipt_proof_url = JSON.stringify(uploadResults.map(res => res.url));
      }

      // 2. Upload Bukti Reject (Optional)
      if (rejectFiles && rejectFiles.length > 0) {
        const uploadPromises = rejectFiles.map(file => storageService.upload(file, 'penerimaan/rejections'));
        const uploadResults = await Promise.all(uploadPromises);
        data.rejected_proof_url = JSON.stringify(uploadResults.map(res => res.url));
      }

      // 3. Prepare Query
      const sql = `
        INSERT INTO penerimaan (
          id, purchase_id, purchase_product_id, shipping_id, datetime,
          sorting_type, qty_rejection, rejected_valuation, rejected_reason,
          rejected_proof_url, qty_received_actual, qty_diff, accepted_valuation,
          price_per_unit_accepted, actual_moisture, description, receipt_proof_url,
          created_by, created_timezone
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const params = [
        id, data.purchase_id, data.purchase_product_id, data.shipping_id, data.datetime,
        data.sorting_type, data.qty_rejection || 0, data.rejected_valuation || 0, data.rejected_reason || null,
        data.rejected_proof_url || null, data.qty_received_actual, data.qty_diff || 0, data.accepted_valuation,
        data.price_per_unit_accepted, data.actual_moisture || null, data.description || null, data.receipt_proof_url,
        data.created_by || null, data.created_timezone || 'Asia/Jakarta'
      ];

      await dbClient.query(sql, params);
      return this.getById(id);
    } catch (error) {
      errorService.handle(error);
      return null;
    }
  },

  /**
   * Mengupdate data penerimaan.
   */
  async update(
    id: string, 
    data: Partial<ITs_Penerimaan>, 
    receiptFiles?: File[], 
    rejectFiles?: File[]
  ): Promise<ITs_Penerimaan | null> {
    try {
      const existing = await this.getById(id);
      if (!existing) throw new Error('Data penerimaan tidak ditemukan');

      // 0. Audit - Update
      const session = akunService.getCurrentSession();
      if (session) {
        data.updated_by = session.user_id;
        data.updated_timezone = 'Asia/Jakarta';
      }

      // 1. Handle File Updates (Simple approach: If new files, they replace/add)
      // Note: In real app, we might need more granular logic to delete specific files
      if (receiptFiles && receiptFiles.length > 0) {
        const uploadPromises = receiptFiles.map(file => storageService.upload(file, 'penerimaan/receipts'));
        const uploadResults = await Promise.all(uploadPromises);
        data.receipt_proof_url = JSON.stringify(uploadResults.map(res => res.url));
      }

      if (rejectFiles && rejectFiles.length > 0) {
        const uploadPromises = rejectFiles.map(file => storageService.upload(file, 'penerimaan/rejections'));
        const uploadResults = await Promise.all(uploadPromises);
        data.rejected_proof_url = JSON.stringify(uploadResults.map(res => res.url));
      }

      // 2. Dynamic Update
      const updates: string[] = [];
      const params: any[] = [];

      const fieldsToUpdate: (keyof ITs_Penerimaan)[] = [
        'datetime', 'sorting_type', 'qty_rejection', 'rejected_valuation', 'rejected_reason',
        'rejected_proof_url', 'qty_received_actual', 'qty_diff', 'accepted_valuation',
        'price_per_unit_accepted', 'actual_moisture', 'description', 'receipt_proof_url',
        'updated_by', 'updated_timezone'
      ];

      fieldsToUpdate.forEach(field => {
        if (data[field] !== undefined) {
          updates.push(`${field} = ?`);
          params.push(data[field]);
        }
      });

      if (updates.length === 0) return existing;

      params.push(id);
      const sql = `UPDATE penerimaan SET ${updates.join(', ')} WHERE id = ?`;
      
      await dbClient.query(sql, params);
      return this.getById(id);
    } catch (error) {
      errorService.handle(error);
      return null;
    }
  },

  /**
   * Menghapus data penerimaan.
   */
  async delete(id: string): Promise<boolean> {
    try {
      const existing = await this.getById(id);
      if (!existing) return false;

      // Hapus file di storage
      const deleteFiles = async (urlJson: string | undefined) => {
        if (!urlJson) return;
        try {
          const urls: string[] = JSON.parse(urlJson);
          for (const url of urls) {
            const key = url.split('.io/').pop();
            if (key) await storageService.delete(key);
          }
        } catch (e) {
          console.error("Failed to delete files:", e);
        }
      };

      await Promise.all([
        deleteFiles(existing.receipt_proof_url),
        deleteFiles(existing.rejected_proof_url)
      ]);

      const sql = `DELETE FROM penerimaan WHERE id = ?`;
      await dbClient.query(sql, [id]);
      return true;
    } catch (error) {
      errorService.handle(error);
      return false;
    }
  },

  /**
   * Mengambil daftar produk pembelian yang siap diterima.
   * (Kriteria: Pengiriman Internal dan belum ada di table penerimaan)
   */
  async getPending(): Promise<any[]> {
    const sql = `
      SELECT 
        pp.id as purchase_product_id,
        pp.purchase_id as purchase_id,
        pp.name as nama_produk,
        pp.qty as purchase_qty,
        pp.price_per_unit as harga_satuan,
        pp.unit,
        pp.category,
        pp.sub_category,
        pp.kadar_air,
        p.po_number as kode_pembelian,
        p.datetime as po_date,
        p.supplier_id,
        s.name as supplier_name,
        sh.id as shipping_id,
        sh.shipping_type,
        sh.datetime as shipping_date
      FROM pembelian_produk pp
      JOIN pembelian p ON pp.purchase_id = p.id
      LEFT JOIN suplier s ON p.supplier_id = s.id
      JOIN pengiriman sh ON sh.purchase_id = p.id
      WHERE p.shipping_type = 'Internal'
      AND NOT EXISTS (
        SELECT 1 FROM penerimaan pr 
        WHERE pr.shipping_id = sh.id 
        AND pr.purchase_product_id = pp.id
      )
      ORDER BY p.datetime ASC
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
   * Mengambil daftar produk yang sudah diterima tetapi belum masuk ke tahap pemrosesan.
   */
  async getReadyForProcessing(): Promise<any[]> {
    const sql = `
      SELECT 
        pr.*,
        pp.name as nama_produk,
        pp.unit,
        pp.qty as purchase_qty,
        pp.category,
        pp.sub_category,
        p.po_number as kode_pembelian,
        p.datetime as po_date
      FROM penerimaan pr
      JOIN pembelian_produk pp ON pr.purchase_product_id = pp.id
      JOIN pembelian p ON pr.purchase_id = p.id
      WHERE pr.sorting_type = 'QC' 
      AND pr.id NOT IN (SELECT receiving_id FROM pemrosesan)
      ORDER BY pr.datetime DESC
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
   * Mengambil daftar semua produk yang sudah diterima (History).
   */
  async getReceived(): Promise<any[]> {
    const sql = `
      SELECT 
        pr.*,
        pp.name as nama_produk,
        pp.unit,
        pp.qty as purchase_qty,
        pp.category,
        pp.sub_category,
        p.po_number as kode_pembelian,
        p.datetime as po_date
      FROM penerimaan pr
      JOIN pembelian_produk pp ON pr.purchase_product_id = pp.id
      JOIN pembelian p ON pr.purchase_id = p.id
      ORDER BY pr.datetime DESC
    `;

    try {
      const result = await dbClient.query(sql);
      return result.rows as any[];
    } catch (error) {
      errorService.handle(error);
      return [];
    }
  }
};
