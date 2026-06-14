import { dbClient } from '../libs/database';
import {
  IPenyerahan,
  IPenyerahanPayload,
  IPenyerahanFile,
  TPenyerahanType,
  TPenyerahanStatus
} from '../types/ITs_Penyerahan';
import { errorService } from './errorService';
import { storageService } from './storage';
import { akunService } from './akunService';
import { generateUUID } from '../utils/data';
import { getPageFetchLimit } from './fetchingCenter';
import { ITs_Penjualan } from '../types/ITs_Penjualan';
import { penjualanService } from './penjualanService';

export const penyerahanService = {
  /**
   * Mengambil data penyerahan dengan paginasi, pencarian, dan filter.
   * Melakukan LEFT JOIN ke tabel penjualan untuk mendapatkan info customer dan invoice number.
   */
  async getPaginated(
    page: number = 1,
    search: string = '',
    options?: {
      limit?: number;
      status?: TPenyerahanStatus;
      penyerahan_type?: TPenyerahanType;
      driver_user_id?: string;
      sortKey?: string;
      sortDir?: 'asc' | 'desc';
      startDate?: string;
      endDate?: string;
    }
  ): Promise<{ items: (IPenyerahan & { invoice_number?: string; customer_name?: string })[]; total: number }> {
    const fetchLimit = options?.limit || getPageFetchLimit('DaftarPenyerahan');
    const offset = (page - 1) * fetchLimit;

    const whereConditions: string[] = [];
    const params: any[] = [];

    // Filter Pencarian (customer name, invoice_number, surat_jalan_number)
    if (search) {
      whereConditions.push(`(p.surat_jalan_number LIKE ? OR pj.invoice_number LIKE ? OR c.name LIKE ?)`);
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam);
    }

    // Filter Status Transaksi
    if (options?.status) {
      whereConditions.push(`p.status = ?`);
      params.push(options.status);
    }

    // Filter Tipe Penyerahan
    if (options?.penyerahan_type) {
      whereConditions.push(`p.penyerahan_type = ?`);
      params.push(options.penyerahan_type);
    }

    // Filter Khusus Driver
    if (options?.driver_user_id) {
      whereConditions.push(`p.driver_user_id = ?`);
      params.push(options.driver_user_id);
    }

    // Filter Tanggal
    const dateField = options?.status === TPenyerahanStatus.COMPLETED ? 'p.handover_datetime' : 'p.datetime';

    if (options?.startDate) {
      whereConditions.push(`date(${dateField}) >= ?`);
      params.push(options.startDate);
    }

    if (options?.endDate) {
      whereConditions.push(`date(${dateField}) <= ?`);
      params.push(options.endDate);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const allowedSortKeys = ['datetime', 'handover_datetime', 'created_at', 'status'];
    const finalSortKey = allowedSortKeys.includes(options?.sortKey || '') ? `p.${options!.sortKey}` : 'p.datetime';
    const finalSortDir = options?.sortDir?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const sqlData = `
      SELECT p.*, pj.invoice_number, pj.datetime as invoice_datetime, c.name as customer_name
      FROM penyerahan p
      LEFT JOIN penjualan pj ON p.penjualan_id = pj.id
      LEFT JOIN customer c ON pj.customer_id = c.id
      ${whereClause}
      ORDER BY ${finalSortKey} ${finalSortDir}
      LIMIT ? OFFSET ?
    `;

    const sqlCount = `
      SELECT COUNT(*) as total 
      FROM penyerahan p
      LEFT JOIN penjualan pj ON p.penjualan_id = pj.id
      LEFT JOIN customer c ON pj.customer_id = c.id
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
        items: dataRes.rows as unknown as (IPenyerahan & { invoice_number?: string; customer_name?: string })[],
        total: Number((countRes.rows[0] as any).total || 0)
      };
    } catch (error) {
      errorService.handle(error);
      return { items: [], total: 0 };
    }
  },

  /**
   * Mendapatkan daftar Penjualan Murni yang perlu diserahkan (Paginated).
   */
  async getAntrianPenjualanPaginated(
    page: number = 1,
    search: string = '',
    options?: { limit?: number; startDate?: string; endDate?: string }
  ): Promise<{ items: (ITs_Penjualan & { penyerahan_id?: string; penyerahan_status?: string })[]; total: number }> {
    const fetchLimit = options?.limit || getPageFetchLimit('DaftarPenjualan');
    const offset = (page - 1) * fetchLimit;

    const whereConditions: string[] = [`pj.approval_status = 'Approved'`];
    const params: any[] = [];

    // Filter Penjualan yg tidak ada penyerahan ATAU penyerahannya dibatalkan
    whereConditions.push(`(p.id IS NULL OR p.status = 'Cancelled')`);

    if (search) {
      whereConditions.push(`(pj.invoice_number LIKE ? OR c.name LIKE ?)`);
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam);
    }

    if (options?.startDate) {
      whereConditions.push(`date(pj.datetime) >= ?`);
      params.push(options.startDate);
    }

    if (options?.endDate) {
      whereConditions.push(`date(pj.datetime) <= ?`);
      params.push(options.endDate);
    }

    const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

    const sqlData = `
      SELECT pj.*, p.id as penyerahan_id, p.status as penyerahan_status, p.penyerahan_type as penyerahan_type, c.name as customer_name
      FROM penjualan pj
      LEFT JOIN penyerahan p ON pj.id = p.penjualan_id
      LEFT JOIN customer c ON pj.customer_id = c.id
      ${whereClause}
      ORDER BY pj.datetime ASC
      LIMIT ? OFFSET ?
    `;

    const sqlCount = `
      SELECT COUNT(*) as total
      FROM penjualan pj
      LEFT JOIN penyerahan p ON pj.id = p.penjualan_id
      LEFT JOIN customer c ON pj.customer_id = c.id
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
        items: dataRes.rows as unknown as (ITs_Penjualan & { penyerahan_id?: string; penyerahan_status?: string })[],
        total: Number((countRes.rows[0] as any).total || 0)
      };
    } catch (error) {
      errorService.handle(error);
      return { items: [], total: 0 };
    }
  },

  /**
   * Mendapatkan daftar Penjualan Murni yang perlu diserahkan.
   * Mengambil data Penjualan dengan approval_status = 'Approved' 
   * yang BELUM memiliki Penyerahan / memiliki Penyerahan tapi belum 'Completed'.
   */
  async getAntrianPenjualan(search: string = ''): Promise<(ITs_Penjualan & { penyerahan_id?: string; penyerahan_status?: string })[]> {
    const whereConditions: string[] = [`pj.approval_status = 'Approved'`];
    const params: any[] = [];

    // Filter Penjualan yg tidak ada penyerahan ATAU penyerahannya dibatalkan
    whereConditions.push(`(p.id IS NULL OR p.status = 'Cancelled')`);

    if (search) {
      whereConditions.push(`(pj.invoice_number LIKE ? OR c.name LIKE ?)`);
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam);
    }

    const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

    // Limit antrian maximum 100 for performance
    const sql = `
      SELECT pj.*, p.id as penyerahan_id, p.status as penyerahan_status, p.penyerahan_type as penyerahan_type, c.name as customer_name
      FROM penjualan pj
      LEFT JOIN penyerahan p ON pj.id = p.penjualan_id
      LEFT JOIN customer c ON pj.customer_id = c.id
      ${whereClause}
      ORDER BY pj.datetime ASC
      LIMIT 100
    `;

    try {
      const res = await dbClient.query(sql, params);
      return res.rows as unknown as (ITs_Penjualan & { penyerahan_id?: string; penyerahan_status?: string })[];
    } catch (error) {
      errorService.handle(error);
      return [];
    }
  },

  /**
   * Menggenerasi nomor surat jalan berikutnya dengan pola SJ/YYMMDD/XXXX
   */
  async generateNextSuratJalanNumber(): Promise<string> {
    const today = new Date();
    const yymmdd = today.toISOString().slice(2, 10).replace(/-/g, '');
    const prefix = `SJ/${yymmdd}/`;
    
    const sql = `SELECT COUNT(*) as total FROM penyerahan WHERE surat_jalan_number LIKE ?`;
    try {
      const res = await dbClient.query(sql, [`${prefix}%`]);
      const nextNum = (Number((res.rows[0] as any).total) || 0) + 1;
      return `${prefix}${String(nextNum).padStart(4, '0')}`;
    } catch (error) {
       // Fallback if DB fails
       return `${prefix}${Math.floor(1000 + Math.random() * 9000)}`;
    }
  },

  /**
   * Mengambil data lengkap berdasarkan ID Penyerahan
   */
  async getById(id: string): Promise<IPenyerahanPayload | null> {
    const sql = `
      SELECT p.*, pj.invoice_number, c.name as customer_name 
      FROM penyerahan p
      LEFT JOIN penjualan pj ON p.penjualan_id = pj.id
      LEFT JOIN customer c ON pj.customer_id = c.id
      WHERE p.id = ? LIMIT 1
    `;

    try {
      const res = await dbClient.query(sql, [id]);
      if (res.rows.length === 0) return null;

      const header = res.rows[0] as unknown as IPenyerahan;
      let filesList: IPenyerahanFile[] = [];
      try {
        filesList = JSON.parse(header.proof_fileurls || '[]');
      } catch (e) {
        console.warn('Gagal memproses parsing json proof_fileurls', e);
      }

      // Fetch Penjualan details (with items)
      const penjualan = await penjualanService.getById(header.penjualan_id);

      return {
        ...header,
        proof_fileurls: filesList,
        penjualan_data: penjualan
      };
    } catch (error) {
      errorService.handle(error);
      return null;
    }
  },

  /**
   * Membuat data penyerahan baru
   */
  async create(data: IPenyerahanPayload): Promise<IPenyerahanPayload | null> {
    try {
      const id = generateUUID();
      const session = akunService.getCurrentSession();
      const createdBy = session?.user_id || null;
      const timezone = 'Asia/Jakarta';

      const finalProofFiles = data.proof_fileurls || [];
      const proof_fileurls_json = JSON.stringify(finalProofFiles);

      const sqlInsert = `
        INSERT INTO penyerahan (
          id, penjualan_id, penyerahan_type, surat_jalan_number,
          datetime, handover_datetime, recipient_name, description,
          shipping_method, vehicle_number, driver_name, driver_phone, driver_user_id,
          resi_number, status, proof_fileurls, created_by, created_timezone,
          handover_lat, handover_lng, handover_distance, handover_address
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const params = [
        id,
        data.penjualan_id,
        data.penyerahan_type,
        data.surat_jalan_number || null,
        data.datetime,
        data.handover_datetime || null,
        data.recipient_name || null,
        data.description || null,
        data.shipping_method || null,
        data.vehicle_number || null,
        data.driver_name || null,
        data.driver_phone || null,
        data.driver_user_id || null,
        data.resi_number || null,
        data.status || TPenyerahanStatus.PENDING,
        proof_fileurls_json,
        createdBy,
        timezone,
        data.handover_lat || null,
        data.handover_lng || null,
        data.handover_distance || null,
        data.handover_address || null,
      ];

      await dbClient.query(sqlInsert, params);
      return await this.getById(id);
    } catch (error) {
      errorService.handle(error);
      return null;
    }
  },

  /**
   * Update data penyerahan
   */
  async update(id: string, data: Partial<IPenyerahanPayload>): Promise<IPenyerahanPayload | null> {
    try {
      const existing = await this.getById(id);
      if (!existing) throw new Error('Data penyerahan tidak ditemukan.');

      const session = akunService.getCurrentSession();
      const updatedBy = session?.user_id || null;
      const timezone = 'Asia/Jakarta';

      // Storage cleanup for yatim files
      let currentProofFiles: IPenyerahanFile[] = existing.proof_fileurls || [];
      let preservedProofFiles: IPenyerahanFile[] = data.proof_fileurls || [];

      // If payload explicitly provided proof_fileurls, do cleanup
      let finalProofUrlsJson = JSON.stringify(currentProofFiles);
      if (data.proof_fileurls !== undefined) {
        const filesToDelete = currentProofFiles.filter(oldFile =>
          !preservedProofFiles.some(preserved => preserved.key === oldFile.key)
        );

        for (const f of filesToDelete) {
          if (f.key) {
            try {
              await storageService.delete(f.key);
            } catch (err) {
              console.warn(`Gagal menghapus file orphan Tigris: ${f.key}`, err);
            }
          }
        }
        finalProofUrlsJson = JSON.stringify(preservedProofFiles);
      }

      const updates: string[] = [];
      const params: any[] = [];

      const fieldsToUpdate: { field: string; val: any }[] = [
        { field: 'penyerahan_type', val: data.penyerahan_type },
        { field: 'surat_jalan_number', val: data.surat_jalan_number },
        { field: 'datetime', val: data.datetime },
        { field: 'handover_datetime', val: data.handover_datetime },
        { field: 'recipient_name', val: data.recipient_name },
        { field: 'description', val: data.description },
        { field: 'shipping_method', val: data.shipping_method },
        { field: 'vehicle_number', val: data.vehicle_number },
        { field: 'driver_name', val: data.driver_name },
        { field: 'driver_phone', val: data.driver_phone },
        { field: 'driver_user_id', val: data.driver_user_id },
        { field: 'resi_number', val: data.resi_number },
        { field: 'status', val: data.status },
        { field: 'handover_lat', val: data.handover_lat },
        { field: 'handover_lng', val: data.handover_lng },
        { field: 'handover_distance', val: data.handover_distance },
        { field: 'handover_address', val: data.handover_address },
      ];

      fieldsToUpdate.forEach(item => {
        if (item.val !== undefined) {
          updates.push(`${item.field} = ?`);
          params.push(item.val);
        }
      });

      if (data.proof_fileurls !== undefined) {
        updates.push(`proof_fileurls = ?`);
        params.push(finalProofUrlsJson);
      }

      updates.push(`updated_by = ?`, `updated_timezone = ?`);
      params.push(updatedBy, timezone);

      params.push(id);
      const sqlUpdate = `UPDATE penyerahan SET ${updates.join(', ')} WHERE id = ?`;

      if (updates.length > 2) { // more than just updated_by and timezone
        await dbClient.query(sqlUpdate, params);
      }

      return await this.getById(id);
    } catch (error) {
      errorService.handle(error);
      return null;
    }
  },

  /**
   * Menghapus penyerahan (permanen) beserta lampirannya
   */
  async delete(id: string): Promise<boolean> {
    try {
      const existing = await this.getById(id);
      if (!existing) throw new Error('Data penyerahan tidak ditemukan.');

      // 1. Bersihkan fisik dokumen lampiran di Tigris
      if (existing.proof_fileurls && existing.proof_fileurls.length > 0) {
        for (const f of existing.proof_fileurls) {
          if (f.key) {
            try {
              await storageService.delete(f.key);
            } catch (err) {
              console.warn(`Gagal membersihkan lampiran: ${f.key}`, err);
            }
          }
        }
      }

      // 2. Hapus draf/record
      const sqlDelete = `DELETE FROM penyerahan WHERE id = ?`;
      await dbClient.query(sqlDelete, [id]);

      return true;
    } catch (error) {
      errorService.handle(error);
      return false;
    }
  },

  /**
   * Menghapus batch
   */
  async deleteMany(ids: string[]): Promise<boolean> {
    try {
      if (ids.length === 0) return true;
      for (const id of ids) {
        await this.delete(id);
      }
      return true;
    } catch (error) {
      errorService.handle(error);
      return false;
    }
  }
};
