import { dbClient } from '../libs/database.js';
import { IStokOpname, IStokOpnamePayload } from '../types/ITs_StokOpname.js';
import { generateUUID } from '../utils/data.js';
import { errorService } from './errorService.js';
import { browserStorage } from '../utils/browserStorage.js';
import { getTimezoneIdentifier } from '../utils/time.js';
import { IAkunSession } from '../types/ITs_Akun.js';

export const stokOpnameService = {
  /**
   * Membuat tabel jika belum ada.
   */
  async initTable() {
    const sql = `
      CREATE TABLE IF NOT EXISTS stok_opname (
        id VARCHAR(36) PRIMARY KEY,
        no_so VARCHAR(50) NOT NULL,
        sku VARCHAR(100) NOT NULL,
        qty_system INTEGER NOT NULL,
        qty_actual INTEGER NOT NULL,
        qty_diff INTEGER NOT NULL,
        harga_per_unit REAL DEFAULT 0,
        total_valuasi_aktual REAL DEFAULT 0,
        total_valuasi_selisih REAL DEFAULT 0,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_by VARCHAR(36),
        created_timezone VARCHAR(50),
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_by VARCHAR(36),
        updated_timezone VARCHAR(50)
      );
    `;
    try {
      await dbClient.query(sql);
    } catch (error) {
      console.error('Failed to init stok_opname table', error);
    }
  },

  async getPaginated(
    page: number = 1,
    limit: number = 15,
    search: string = '',
    startDate?: string,
    endDate?: string
  ): Promise<{ items: IStokOpname[]; total: number }> {
    const offset = (page - 1) * limit;
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    const countParams: any[] = [];

    if (search) {
      whereClause += ` AND (so.no_so LIKE ? OR sb.name LIKE ? OR so.sku LIKE ?)`;
      const s = `%${search}%`;
      params.push(s, s, s);
      countParams.push(s, s, s);
    }

    if (startDate) {
      const localDate = new Date(`${startDate}T00:00:00`);
      const utcStart = localDate.toISOString().replace('T', ' ').slice(0, 19);
      whereClause += ` AND so.created_at >= ?`;
      params.push(utcStart);
      countParams.push(utcStart);
    }

    if (endDate) {
      const localDate = new Date(`${endDate}T23:59:59`);
      const utcEnd = localDate.toISOString().replace('T', ' ').slice(0, 19);
      whereClause += ` AND so.created_at <= ?`;
      params.push(utcEnd);
      countParams.push(utcEnd);
    }

    const sqlData = `
      SELECT so.*, sb.name as stok_name, sb.unit as stok_unit, sb.category as stok_category
      FROM stok_opname so
      LEFT JOIN stok_berjalan sb ON so.sku = sb.sku
      ${whereClause} 
      ORDER BY so.created_at DESC 
      LIMIT ? OFFSET ?
    `;
    
    const sqlCount = `
      SELECT COUNT(*) as total 
      FROM stok_opname so
      LEFT JOIN stok_berjalan sb ON so.sku = sb.sku
      ${whereClause}
    `;

    params.push(limit, offset);

    try {
      const [dataRes, countRes] = await Promise.all([
        dbClient.query(sqlData, params),
        dbClient.query(sqlCount, countParams)
      ]);

      const items = dataRes.rows as unknown as IStokOpname[];
      const total = Number((countRes.rows[0] as any).total || 0);

      return { items, total };
    } catch (error) {
      errorService.handle(error);
      return { items: [], total: 0 };
    }
  },

  async getById(id: string): Promise<IStokOpname | null> {
    const sql = `
      SELECT so.*, sb.name as stok_name, sb.unit as stok_unit, sb.category as stok_category
      FROM stok_opname so
      LEFT JOIN stok_berjalan sb ON so.sku = sb.sku
      WHERE so.id = ? LIMIT 1
    `;
    try {
      const result = await dbClient.query(sql, [id]);
      if (result.rows.length === 0) return null;
      return result.rows[0] as unknown as IStokOpname;
    } catch (error) {
      errorService.handle(error);
      return null;
    }
  },

  /**
   * Membuat pencatatan SO baru dan UPDATE stok berjalan (qty_so dan last_so_datetime).
   */
  async create(data: IStokOpnamePayload): Promise<IStokOpname | null> {
    const id = generateUUID();
    const session = this._getCurrentSession();
    const timezone = getTimezoneIdentifier();

    // Buat nomor SO contoh: SO/20260523/XXXX
    const dateObj = new Date();
    const yyyymmdd = dateObj.toISOString().slice(0,10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000).toString();
    const no_so = `SO/${yyyymmdd}/${randomSuffix}`;

    const qty_diff = Number(data.qty_actual) - Number(data.qty_system);

    const sqlSO = `
      INSERT INTO stok_opname (
        id, no_so, sku, qty_system, qty_actual, qty_diff, harga_per_unit, total_valuasi_aktual, total_valuasi_selisih, notes,
        created_by, created_timezone
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const paramsSO = [
      id,
      no_so,
      data.sku,
      data.qty_system,
      data.qty_actual,
      qty_diff,
      data.harga_per_unit,
      data.total_valuasi_aktual,
      data.total_valuasi_selisih,
      data.notes || '',
      session?.user_id || null,
      timezone
    ];

    try {
      // 1. Insert Stok Opname Record
      await dbClient.query(sqlSO, paramsSO);

      // 2. Update Stok Berjalan baseline (qty_so = qty_actual, last_so_datetime = current_datetime)
      const sqlUpdateStok = `
        UPDATE stok_berjalan 
        SET qty_so = ?, 
            last_so_datetime = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP,
            updated_by = ?,
            updated_timezone = ?
        WHERE sku = ?
      `;
      const paramsUpdateStok = [
        data.qty_actual,
        session?.user_id || null,
        timezone,
        data.sku
      ];
      await dbClient.query(sqlUpdateStok, paramsUpdateStok);

      return this.getById(id);
    } catch (error) {
      errorService.handle(error);
      return null;
    }
  },

  _getCurrentSession(): IAkunSession | null {
    return browserStorage.get<IAkunSession>('active_user');
  }
};
