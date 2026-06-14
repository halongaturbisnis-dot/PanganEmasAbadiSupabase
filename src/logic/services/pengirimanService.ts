import { dbClient } from '../libs/database.js';
import { 
  IPengiriman, 
  IPengirimanPayload, 
  TPengirimanStatus,
  IPengirimanFile
} from '../types/ITs_Pengiriman.js';
import { errorService } from './errorService.js';
import { storageService } from './storage.js';
import { akunService } from './akunService.js';
import { generateUUID } from '../utils/data.js';
import { getPageFetchLimit } from './fetchingCenter.js';

/**
 * PENGIRIMAN SERVICE
 * Logic backend untuk modul Pengiriman (Logistik).
 * Menangani operations CRUD lengkap dan sinkronisasi dengan modul Pembelian.
 */
export const pengirimanService = {
  /**
   * Mengambil data pengiriman dengan paginasi, pencarian, dan filter.
   * Mendukung LEFT JOIN untuk memuat info dasar dari modul Pembelian.
   * Ditambahkan logic filter untuk status penerimaan (Dalam Pengiriman vs Selesai).
   */
  async getPaginated(
    page: number = 1,
    search: string = '',
    options?: {
      limit?: number;
      purchase_id?: string;
      status?: TPengirimanStatus;
      sortKey?: string;
      sortDir?: 'asc' | 'desc';
      mode?: 'shipped' | 'done'; // shipped = partial/none received, done = all received
      startDate?: string;
      endDate?: string;
    }
  ): Promise<{ items: (IPengiriman & { po_number?: string; supplier_name?: string })[]; total: number }> {
    const fetchLimit = options?.limit || getPageFetchLimit('DaftarPengiriman');
    const offset = (page - 1) * fetchLimit;

    const whereConditions: string[] = [`p.shipping_type = 'Internal'`];
    const params: any[] = [];

    // Filter Tanggal
    if (options?.startDate) {
      whereConditions.push(`date(s.datetime) >= ?`);
      params.push(options.startDate);
    }
    if (options?.endDate) {
      whereConditions.push(`date(s.datetime) <= ?`);
      params.push(options.endDate);
    }

    // Filter Pencarian (PO number, Driver, atau Nopol)
    if (search) {
      whereConditions.push(`(p.po_number LIKE ? OR s.vehicle_number LIKE ? OR s.driver_name LIKE ?)`);
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam);
    }

    // Filter Purchase ID
    if (options?.purchase_id) {
      whereConditions.push(`s.purchase_id = ?`);
      params.push(options.purchase_id);
    }

    // Filter Status
    if (options?.status) {
      whereConditions.push(`s.status = ?`);
      params.push(options.status);
    }

    // Filter Mode Penerimaan (SYARAT dari User)
    // total_products: jumlah item di pembelian_produk
    // received_products: jumlah item unik yang sudah masuk ke penerimaan
    let receivingClause = '';
    if (options?.mode === 'shipped') {
      receivingClause = `AND (SELECT COUNT(DISTINCT purchase_product_id) FROM penerimaan WHERE purchase_id = p.id) < (SELECT COUNT(*) FROM pembelian_produk WHERE purchase_id = p.id)`;
    } else if (options?.mode === 'done') {
      receivingClause = `AND (SELECT COUNT(DISTINCT purchase_product_id) FROM penerimaan WHERE purchase_id = p.id) >= (SELECT COUNT(*) FROM pembelian_produk WHERE purchase_id = p.id)`;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')} ${receivingClause}` : receivingClause ? `WHERE 1=1 ${receivingClause}` : '';

    // Sort order whitelist
    const allowedSortKeys = ['datetime', 'vehicle_number', 'driver_name', 'status', 'created_at', 'po_number', 'supplier_name', 'customer_name'];
    let finalSortKey = 's.datetime';
    
    if (options?.sortKey === 'po_number') finalSortKey = 'p.po_number';
    else if (options?.sortKey === 'supplier_name') finalSortKey = 'sup.name';
    else if (options?.sortKey === 'customer_name') finalSortKey = 'c.name';
    else if (allowedSortKeys.includes(options?.sortKey || '')) finalSortKey = `s.${options!.sortKey}`;
    
    const finalSortDir = options?.sortDir?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const sqlData = `
      SELECT s.*, p.po_number, p.datetime as purchase_date, sup.name as supplier_name, c.name as customer_name,
      (SELECT COUNT(*) FROM pembelian_produk WHERE purchase_id = p.id) as total_produk_pembelian,
      (SELECT COUNT(DISTINCT purchase_product_id) FROM penerimaan WHERE purchase_id = p.id) as total_produk_diterima
      FROM pengiriman s
      LEFT JOIN pembelian p ON s.purchase_id = p.id
      LEFT JOIN suplier sup ON p.supplier_id = sup.id
      LEFT JOIN customer c ON p.customer_id = c.id
      ${whereClause}
      ORDER BY ${finalSortKey} ${finalSortDir}
      LIMIT ? OFFSET ?
    `;

    const sqlCount = `
      SELECT COUNT(*) as total 
      FROM pengiriman s
      LEFT JOIN pembelian p ON s.purchase_id = p.id
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
        items: dataRes.rows as unknown as (IPengiriman & { po_number?: string; supplier_name?: string })[],
        total: Number((countRes.rows[0] as any).total || 0)
      };
    } catch (error) {
      errorService.handle(error);
      return { items: [], total: 0 };
    }
  },

  /**
   * Mengambil data Pembelian yang belum diproses untuk pengiriman.
   * Digunakan untuk tab 'Belum Dikirim' di PengirimanPage.
   * SYARAT: shipping_type = 'Internal'
   */
  async getUnprocessedPurchases(
    page: number = 1,
    search: string = '',
    options?: { 
      limit?: number;
      sortKey?: string;
      sortDir?: 'asc' | 'desc';
      startDate?: string;
      endDate?: string;
    }
  ): Promise<{ items: any[]; total: number }> {
    const fetchLimit = options?.limit || getPageFetchLimit('DaftarPembelian');
    const offset = (page - 1) * fetchLimit;

    const whereConditions: string[] = [
      `p.id NOT IN (SELECT purchase_id FROM pengiriman)`,
      `p.shipping_type = 'Internal'`
    ];
    const params: any[] = [];

    // Filter Tanggal
    if (options?.startDate) {
      whereConditions.push(`date(p.datetime) >= ?`);
      params.push(options.startDate);
    }
    if (options?.endDate) {
      whereConditions.push(`date(p.datetime) <= ?`);
      params.push(options.endDate);
    }

    if (search) {
      whereConditions.push(`(p.po_number LIKE ? OR s.name LIKE ?)`);
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam);
    }

    const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

    // Sort order whitelist
    const allowedSortKeys = ['datetime', 'po_number', 'supplier_name', 'customer_name'];
    let finalSortKey = 'p.datetime';
    
    if (options?.sortKey === 'po_number') finalSortKey = 'p.po_number';
    else if (options?.sortKey === 'supplier_name') finalSortKey = 's.name';
    else if (options?.sortKey === 'customer_name') finalSortKey = 'c.name';
    else if (options?.sortKey === 'datetime') finalSortKey = 'p.datetime';
    
    const finalSortDir = options?.sortDir?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const sqlData = `
      SELECT p.*, s.name as supplier_name, c.name as customer_name
      FROM pembelian p
      LEFT JOIN suplier s ON p.supplier_id = s.id
      LEFT JOIN customer c ON p.customer_id = c.id
      ${whereClause}
      ORDER BY ${finalSortKey} ${finalSortDir}
      LIMIT ? OFFSET ?
    `;

    const sqlCount = `
      SELECT COUNT(*) as total 
      FROM pembelian p
      LEFT JOIN suplier s ON p.supplier_id = s.id
      LEFT JOIN customer c ON p.customer_id = c.id
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
        items: dataRes.rows,
        total: Number((countRes.rows[0] as any).total || 0)
      };
    } catch (error) {
      errorService.handle(error);
      return { items: [], total: 0 };
    }
  },
  async getById(id: string): Promise<IPengirimanPayload | null> {
    const sql = `
      SELECT s.*, p.po_number, sup.name as supplier_name,
      (SELECT COUNT(*) FROM pembelian_produk WHERE purchase_id = p.id) as total_produk_pembelian,
      (SELECT COUNT(DISTINCT purchase_product_id) FROM penerimaan WHERE purchase_id = p.id) as total_produk_diterima
      FROM pengiriman s
      LEFT JOIN pembelian p ON s.purchase_id = p.id
      LEFT JOIN suplier sup ON p.supplier_id = sup.id
      WHERE s.id = ? LIMIT 1
    `;

    try {
      const res = await dbClient.query(sql, [id]);
      if (res.rows.length === 0) return null;

      const record = res.rows[0] as unknown as IPengiriman;

      // Parse attachment metadata (JSON String to Array)
      let filesList: IPengirimanFile[] = [];
      try {
        filesList = JSON.parse(record.proof_fileurl || '[]');
      } catch (e) {
        console.warn('Gagal parsing JSON proof_fileurl', e);
      }

      return {
        ...record,
        proof_fileurl: filesList
      };
    } catch (error) {
      errorService.handle(error);
      return null;
    }
  },

  /**
   * Mengambil semua pengiriman yang terkait dengan pembelian tertentu.
   */
  async getByPurchaseId(purchaseId: string): Promise<IPengiriman[]> {
    try {
      const sql = `SELECT * FROM pengiriman WHERE purchase_id = ? ORDER BY datetime DESC`;
      const res = await dbClient.query(sql, [purchaseId]);
      return res.rows as unknown as IPengiriman[];
    } catch (error) {
      errorService.handle(error);
      return [];
    }
  },

  /**
   * Membuat record pengiriman baru.
   */
  async create(data: IPengirimanPayload): Promise<IPengirimanPayload | null> {
    try {
      const id = generateUUID();
      const session = akunService.getCurrentSession();
      const createdBy = session?.user_id || null;
      const timezone = 'Asia/Jakarta';

      // 1. Validasi Purchase ID
      const checkPurchase = await dbClient.query(`SELECT id FROM pembelian WHERE id = ? LIMIT 1`, [data.purchase_id]);
      if (checkPurchase.rows.length === 0) {
        throw new Error('ID Pembelian tidak valid atau tidak ditemukan.');
      }

      // 2. Persiapkan data file bukti
      const finalProofFiles = data.proof_fileurl || [];

      const sql = `
        INSERT INTO pengiriman (
          id, purchase_id, datetime, shipping_type, description,
          vehicle_number, vehicle_type, driver_name, driver_phone,
          status, proof_fileurl, created_by, created_timezone
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const params = [
        id,
        data.purchase_id,
        data.datetime,
        data.shipping_type,
        data.description || null,
        data.vehicle_number || null,
        data.vehicle_type || null,
        data.driver_name || null,
        data.driver_phone || null,
        data.status || TPengirimanStatus.PENDING,
        JSON.stringify(finalProofFiles),
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
   * Memperbarui data pengiriman.
   * Menangani penggantian file dan pembersihan file lama (Anti-Orphan).
   */
  async update(id: string, data: Partial<IPengirimanPayload>): Promise<IPengirimanPayload | null> {
    try {
      const existing = await this.getById(id);
      if (!existing) throw new Error('Data pengiriman tidak ditemukan.');

      const session = akunService.getCurrentSession();
      const updatedBy = session?.user_id || null;
      const timezone = 'Asia/Jakarta';

      // 1. Manajemen file bukti (Cleanup jika file dihapus/diganti)
      let preservedFiles: IPengirimanFile[] = data.proof_fileurl !== undefined ? data.proof_fileurl : existing.proof_fileurl;
      
      if (data.proof_fileurl !== undefined) {
        const oldFiles: IPengirimanFile[] = existing.proof_fileurl || [];
        // Cari file yang ada di data lama tapi tidak ada di data baru (untuk dihapus dari storage)
        const filesToDelete = oldFiles.filter(old => !preservedFiles.some(cur => cur.key === old.key));
        
        for (const f of filesToDelete) {
          if (f.key) {
            try {
              await storageService.delete(f.key);
            } catch (err) {
              console.warn(`Gagal menghapus file orphan: ${f.key}`, err);
            }
          }
        }
      }

      // 2. Persiapkan query update dinamis
      const updates: string[] = [];
      const params: any[] = [];

      const fieldsToUpdate: { field: string; val: any }[] = [
        { field: 'purchase_id', val: data.purchase_id },
        { field: 'datetime', val: data.datetime },
        { field: 'shipping_type', val: data.shipping_type },
        { field: 'description', val: data.description },
        { field: 'vehicle_number', val: data.vehicle_number },
        { field: 'vehicle_type', val: data.vehicle_type },
        { field: 'driver_name', val: data.driver_name },
        { field: 'driver_phone', val: data.driver_phone },
        { field: 'status', val: data.status },
      ];

      fieldsToUpdate.forEach(item => {
        if (item.val !== undefined) {
          updates.push(`${item.field} = ?`);
          params.push(item.val);
        }
      });

      // Update proof files (selalu diupdate jika payload mengirim data proof)
      if (data.proof_fileurl !== undefined) {
        updates.push(`proof_fileurl = ?`);
        params.push(JSON.stringify(preservedFiles));
      }

      // Audit trail
      updates.push(`updated_by = ?`, `updated_timezone = ?`);
      params.push(updatedBy, timezone);

      if (updates.length > 0) {
        params.push(id);
        const sql = `UPDATE pengiriman SET ${updates.join(', ')} WHERE id = ?`;
        await dbClient.query(sql, params);
      }

      return await this.getById(id);
    } catch (error) {
      errorService.handle(error);
      return null;
    }
  },

  /**
   * Menghapus record pengiriman secara permanen.
   * Melakukan cleanup fisik dokumen di storage.
   */
  async delete(id: string): Promise<boolean> {
    try {
      const existing = await this.getById(id);
      if (!existing) return true; // Sudah tidak ada

      // 1. Cleanup Storage (Anti-Yatim)
      const files = existing.proof_fileurl || [];
      for (const f of files) {
        if (f.key) {
          try {
            await storageService.delete(f.key);
          } catch (err) {
            console.warn(`Gagal membersihkan lampiran pengiriman: ${f.key}`, err);
          }
        }
      }

      // 2. Hapus dari database
      const sql = `DELETE FROM pengiriman WHERE id = ?`;
      await dbClient.query(sql, [id]);

      return true;
    } catch (error) {
      errorService.handle(error);
      return false;
    }
  }
};
