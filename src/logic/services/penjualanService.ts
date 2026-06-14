import { dbClient } from '../libs/database.js';
import { getTursoClient } from '../api/turso.js';
import { 
  ITs_Penjualan, 
  ITs_PenjualanProduk, 
  ITs_PenjualanProdukMixing, 
  ITs_PenjualanBiaya 
} from '../types/ITs_Penjualan.js';
import { generateUUID } from '../utils/data.js';
import { errorService } from './errorService.js';
import { browserStorage } from '../utils/browserStorage.js';
import { getTimezoneIdentifier } from '../utils/time.js';
import { IAkunSession } from '../types/ITs_Akun.js';

/**
 * PENJUALAN SERVICE
 * Main logic for Sales module, including nested transactions and financial snapshots.
 */

export const penjualanService = {
  /**
   * Fetch paginated list of sales with customer and bank name joins
   */
  async getPaginated(
    page: number = 1,
    limit: number = 15,
    search: string = '',
    status?: string,
    startDate?: string,
    endDate?: string
  ): Promise<{ items: (ITs_Penjualan & { customer_name?: string; bank_cash_source_name?: string })[]; total: number }> {
    const offset = (page - 1) * limit;
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    const countParams: any[] = [];

    if (search) {
      whereClause += ` AND (p.invoice_number LIKE ? OR p.sales_name LIKE ? OR p.keterangan LIKE ?)`;
      const s = `%${search}%`;
      params.push(s, s, s);
      countParams.push(s, s, s);
    }

    if (status) {
      whereClause += ` AND p.status = ?`;
      params.push(status);
      countParams.push(status);
    }

    if (startDate) {
      whereClause += ` AND date(p.datetime) >= ?`;
      params.push(startDate);
      countParams.push(startDate);
    }

    if (endDate) {
      whereClause += ` AND date(p.datetime) <= ?`;
      params.push(endDate);
      countParams.push(endDate);
    }

    const sqlData = `
      SELECT p.*, c.name as customer_name, b.nama_akun as bank_cash_source_name,
      (SELECT COUNT(*) FROM pembelian_produk WHERE penjualan_produk_id IN (SELECT id FROM penjualan_produk WHERE penjualan_id = p.id)) > 0 as is_dropship_locked
      FROM penjualan p
      LEFT JOIN customer c ON p.customer_id = c.id
      LEFT JOIN bank_and_cash b ON p.bank_cash_source_id = b.id
      ${whereClause} 
      ORDER BY p.datetime DESC 
      LIMIT ? OFFSET ?
    `;
    const sqlCount = `SELECT COUNT(*) as total FROM penjualan p ${whereClause}`;

    params.push(limit, offset);

    try {
      const [dataRes, countRes] = await Promise.all([
        dbClient.query(sqlData, params),
        dbClient.query(sqlCount, countParams)
      ]);

      const items = (dataRes.rows as any[]).map(row => ({
        ...row,
        payment_proof_fileurls: JSON.parse(row.payment_proof_fileurls || '[]')
      })) as (ITs_Penjualan & { customer_name?: string; bank_cash_source_name?: string })[];

      const total = Number((countRes.rows[0] as any).total || 0);

      return { items, total };
    } catch (error) {
      errorService.handle(error);
      return { items: [], total: 0 };
    }
  },

  /**
   * Fetch dropship items from Approved sales that are not yet fulfilled or cancelled
   */
  async getApprovedDropshipItems(): Promise<(ITs_PenjualanProduk & { penjualan_id: string; invoice_number: string; customer_name: string; customer_id: string; datetime: string })[]> {
    const sql = `
      SELECT 
        pp.*, 
        p.id as penjualan_id,
        p.invoice_number, 
        p.customer_id,
        p.datetime,
        c.name as customer_name
      FROM penjualan_produk pp
      JOIN penjualan p ON pp.penjualan_id = p.id
      LEFT JOIN customer c ON p.customer_id = c.id
      WHERE pp.is_dropship = 1
      AND p.status IN ('Confirmed', 'Completed') 
      AND p.approval_status = 'Approved'
      AND pp.id NOT IN (SELECT penjualan_produk_id FROM pembelian_produk WHERE penjualan_produk_id IS NOT NULL)
      ORDER BY p.datetime ASC
    `;
    try {
      const dbRes = await dbClient.query(sql, []);
      return dbRes.rows as any[];
    } catch (error) {
      errorService.handle(error);
      return [];
    }
  },

  /**
   * Get full details of a sale including nested items, mixing, and costs
   */
  async getById(id: string): Promise<ITs_Penjualan | null> {
    try {
      const sqlData = `
        SELECT p.*, c.name as customer_name, c.alamat as customer_address, c.telepon as customer_phone, c.company as customer_company, b.nama_akun as bank_cash_source_name, a.jabatan as approver_jabatan,
        (SELECT COUNT(*) FROM pembelian_produk WHERE penjualan_produk_id IN (SELECT id FROM penjualan_produk WHERE penjualan_id = p.id)) > 0 as is_dropship_locked
        FROM penjualan p
        LEFT JOIN customer c ON p.customer_id = c.id
        LEFT JOIN bank_and_cash b ON p.bank_cash_source_id = b.id
        LEFT JOIN akun a ON p.approver_id = a.id
        WHERE p.id = ? 
        LIMIT 1
      `;
      const saleRes = await dbClient.query(sqlData, [id]);
      if (saleRes.rows.length === 0) return null;

      const rawSale = saleRes.rows[0] as any;
      const sale: ITs_Penjualan = {
        ...rawSale,
        payment_proof_fileurls: JSON.parse(rawSale.payment_proof_fileurls || '[]')
      };

      // Fetch Items
      const itemsRes = await dbClient.query(`SELECT * FROM penjualan_produk WHERE penjualan_id = ?`, [id]);
      const items = itemsRes.rows as any[];

      // Fetch Costs
      const costsRes = await dbClient.query(`SELECT * FROM penjualan_biaya WHERE penjualan_id = ?`, [id]);
      sale.costs = costsRes.rows as any[];

      // For each item, fetch mixing composition if it's a mixing product
      sale.items = await Promise.all(items.map(async (item) => {
        if (item.is_mixing) {
          const mixingRes = await dbClient.query(`SELECT * FROM penjualan_produk_mixing WHERE penjualan_produk_id = ?`, [item.id]);
          return {
            ...item,
            is_mixing: !!item.is_mixing,
            mixing_composition: mixingRes.rows as any[]
          } as ITs_PenjualanProduk;
        }
        return { ...item, is_mixing: !!item.is_mixing } as ITs_PenjualanProduk;
      }));

      return sale;
    } catch (error) {
      errorService.handle(error);
      return null;
    }
  },

  /**
   * Create a new sale with all child relations in a single transaction
   */
  async create(data: Partial<ITs_Penjualan>, items: any[], costs: any[]): Promise<ITs_Penjualan | null> {
    const client = getTursoClient();
    const saleId = generateUUID();
    const session = this._getCurrentSession();
    const timezone = getTimezoneIdentifier();

    // 1. Calculate Totals
    const sum_product_price = items.reduce((acc, item) => acc + (item.unit_selling_price * item.qty), 0);
    const sum_added_cost = costs.reduce((acc, cost) => acc + cost.nominal, 0);
    
    let discount_amount = 0;
    if (data.discount_type === 'percent') {
      discount_amount = (sum_product_price * (data.discount_value || 0)) / 100;
    } else {
      discount_amount = data.discount_value || 0;
    }

    const grand_total = (sum_product_price + sum_added_cost) - discount_amount;
    const outstanding = data.payment_type === 'Tempo' ? grand_total - (data.deposit || 0) : 0;

    const queries: any[] = [];

    // 2. Primary Sale Query
    queries.push({
      sql: `INSERT INTO penjualan (
        id, datetime, sales_id, sales_name, invoice_number, customer_id,
        sum_product_price, sum_added_cost, discount_type, discount_value, discount_amount, grand_total,
        payment_type, deposit, outstanding, sla_date,
        payment_method, bank_cash_source_id, payment_proof_fileurls, keterangan, status,
        approver_id, approver_name, approval_status,
        created_by, created_timezone
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        saleId, data.datetime || new Date().toISOString(), data.sales_id || null, data.sales_name || null,
        data.invoice_number, data.customer_id,
        sum_product_price, sum_added_cost, data.discount_type || 'price', data.discount_value || 0, discount_amount, grand_total,
        data.payment_type, data.deposit || 0, outstanding, data.sla_date || null,
        data.payment_method, data.bank_cash_source_id, JSON.stringify(data.payment_proof_fileurls || []),
        data.keterangan || null, data.status || 'Draft',
        data.approver_id || null, data.approver_name || null, data.approval_status || 'Pending',
        session?.user_id || null, timezone
      ]
    });

    // 3. Process Items & Mixing
    for (const item of items) {
      const itemId = generateUUID();
      const total_selling_price = item.unit_selling_price * item.qty;
      const total_base_price = item.unit_base_price * item.qty;
      const margin_amount = total_selling_price - total_base_price;
      const margin_percentage = total_selling_price > 0 ? (margin_amount / total_selling_price) * 100 : 0;

      queries.push({
        sql: `INSERT INTO penjualan_produk (
          id, penjualan_id, is_mixing, is_dropship, sku, name, kategori, sub_kategori, unit, qty,
          unit_selling_price, unit_base_price, total_selling_price, total_base_price,
          margin_amount, margin_percentage,
          created_by, created_timezone
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          itemId, saleId, item.is_mixing ? 1 : 0, item.is_dropship ? 1 : 0, item.sku || null, item.name, item.kategori || null, item.sub_kategori || null, item.unit, item.qty,
          item.unit_selling_price, item.unit_base_price, total_selling_price, total_base_price,
          margin_amount, margin_percentage,
          session?.user_id || null, timezone
        ]
      });

      // Mixing details
      if (item.is_mixing && item.mixing_composition) {
        for (const mix of item.mixing_composition) {
          queries.push({
            sql: `INSERT INTO penjualan_produk_mixing (
              id, penjualan_id, penjualan_produk_id, sku, name, unit,
              qty_composition, total_qty, base_price_snapshot, total_base_price,
              created_by, created_timezone
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [
              generateUUID(), saleId, itemId, mix.sku, mix.name, mix.unit,
              mix.qty_composition, mix.qty_composition, 
              mix.base_price_snapshot, mix.base_price_snapshot * mix.qty_composition,
              session?.user_id || null, timezone
            ]
          });
        }
      }
    }

    // 4. Process Costs
    for (const cost of costs) {
      queries.push({
        sql: `INSERT INTO penjualan_biaya (
          id, penjualan_id, nama_biaya, nominal, keterangan,
          created_by, created_timezone
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [
          generateUUID(), saleId, cost.nama_biaya, cost.nominal, cost.keterangan || null,
          session?.user_id || null, timezone
        ]
      });
    }

    try {
      await client.batch(queries, "write");
      return this.getById(saleId);
    } catch (error) {
      errorService.handle(error);
      return null;
    }
  },

  /**
   * Update an existing sale. Replaces child items and costs (Children Replacement strategy).
   */
  async update(id: string, data: Partial<ITs_Penjualan>, items?: any[], costs?: any[]): Promise<ITs_Penjualan | null> {
    const client = getTursoClient();
    const session = this._getCurrentSession();
    const timezone = getTimezoneIdentifier();

    const queries: any[] = [];

    // 1. Calculate and update header if needed
    if (items || costs || data.discount_value !== undefined || data.deposit !== undefined || data.payment_type !== undefined) {
      const existing = await this.getById(id);
      if (!existing) return null;

      const finalItems = items || existing.items || [];
      const finalCosts = costs || existing.costs || [];
      
      const sum_product_price = finalItems.reduce((acc, item) => acc + (item.unit_selling_price * item.qty), 0);
      const sum_added_cost = finalCosts.reduce((acc, cost) => acc + cost.nominal, 0);
      
      const discountType = data.discount_type || existing.discount_type || 'price';
      const discountValue = data.discount_value !== undefined ? data.discount_value : (existing.discount_value || 0);

      let discount_amount = 0;
      if (discountType === 'percent') {
        discount_amount = (sum_product_price * discountValue) / 100;
      } else {
        discount_amount = discountValue;
      }

      const grand_total = (sum_product_price + sum_added_cost) - discount_amount;
      const payType = data.payment_type || existing.payment_type;
      const deposit = data.deposit !== undefined ? data.deposit : (existing.deposit || 0);
      const outstanding = payType === 'Tempo' ? grand_total - deposit : 0;

      const updates: string[] = [];
      const args: any[] = [];

      const fieldsMap: Record<string, any> = {
        datetime: data.datetime,
        sales_id: data.sales_id,
        sales_name: data.sales_name,
        invoice_number: data.invoice_number,
        customer_id: data.customer_id,
        sum_product_price,
        sum_added_cost,
        discount_type: discountType,
        discount_value: discountValue,
        discount_amount,
        grand_total,
        payment_type: payType,
        deposit,
        outstanding,
        sla_date: data.sla_date,
        payment_method: data.payment_method,
        bank_cash_source_id: data.bank_cash_source_id,
        payment_proof_fileurls: data.payment_proof_fileurls ? JSON.stringify(data.payment_proof_fileurls) : undefined,
        keterangan: data.keterangan,
        status: data.status,
        approver_id: data.approver_id,
        approver_name: data.approver_name,
        approval_status: data.approval_status,
        updated_at: new Date().toISOString(),
        updated_by: session?.user_id || null,
        updated_timezone: timezone
      };

      for (const [key, val] of Object.entries(fieldsMap)) {
        if (val !== undefined) {
          updates.push(`${key} = ?`);
          args.push(val);
        }
      }

      if (updates.length > 0) {
        args.push(id);
        queries.push({
          sql: `UPDATE penjualan SET ${updates.join(', ')} WHERE id = ?`,
          args
        });
      }

      // 2. Refresh Items if provided
      if (items) {
        queries.push({ sql: `DELETE FROM penjualan_produk WHERE penjualan_id = ?`, args: [id] });
        queries.push({ sql: `DELETE FROM penjualan_produk_mixing WHERE penjualan_id = ?`, args: [id] });
        
        for (const item of items) {
          const itemId = generateUUID();
          const total_selling_price = item.unit_selling_price * item.qty;
          const total_base_price = (item.unit_base_price || 0) * item.qty;
          const margin_amount = total_selling_price - total_base_price;
          const margin_percentage = total_selling_price > 0 ? (margin_amount / total_selling_price) * 100 : 0;

          queries.push({
            sql: `INSERT INTO penjualan_produk (
              id, penjualan_id, is_mixing, is_dropship, sku, name, kategori, sub_kategori, unit, qty,
              unit_selling_price, unit_base_price, total_selling_price, total_base_price,
              margin_amount, margin_percentage,
              created_at, created_by, created_timezone
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [
              itemId, id, item.is_mixing ? 1 : 0, item.is_dropship ? 1 : 0, item.sku || null, item.name, item.kategori || null, item.sub_kategori || null, item.unit, item.qty,
              item.unit_selling_price, item.unit_base_price || 0, total_selling_price, total_base_price,
              margin_amount, margin_percentage,
              item.created_at || new Date().toISOString(), session?.user_id || null, timezone
            ]
          });

          if (item.is_mixing && item.mixing_composition) {
            for (const mix of item.mixing_composition) {
              queries.push({
                sql: `INSERT INTO penjualan_produk_mixing (
                  id, penjualan_id, penjualan_produk_id, sku, name, unit,
                  qty_composition, total_qty, base_price_snapshot, total_base_price,
                  created_by, created_timezone
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                args: [
                  generateUUID(), id, itemId, mix.sku, mix.name, mix.unit,
                  mix.qty_composition, mix.qty_composition, 
                  mix.base_price_snapshot, mix.base_price_snapshot * mix.qty_composition,
                  session?.user_id || null, timezone
                ]
              });
            }
          }
        }
      }

      // 3. Refresh Costs if provided
      if (costs) {
        queries.push({ sql: `DELETE FROM penjualan_biaya WHERE penjualan_id = ?`, args: [id] });
        for (const cost of costs) {
          queries.push({
            sql: `INSERT INTO penjualan_biaya (
              id, penjualan_id, nama_biaya, nominal, keterangan,
              created_at, created_by, created_timezone
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [
              generateUUID(), id, cost.nama_biaya, cost.nominal, cost.keterangan || null,
              cost.created_at || new Date().toISOString(), session?.user_id || null, timezone
            ]
          });
        }
      }
    }

    try {
      if (queries.length > 0) {
        await client.batch(queries, "write");
      }
      return this.getById(id);
    } catch (error) {
      errorService.handle(error);
      return null;
    }
  },

  /**
   * Delete a sale and all its relations (Cascading by foreign keys preferred, but batch cleanup here as well)
   */
  async delete(id: string): Promise<boolean> {
    const client = getTursoClient();
    try {
      // Due to CASCADE ON DELETE in DDL, deleting from 'penjualan' should be enough.
      // But we use a batch just in case or for future auditing needs.
      await client.execute({
        sql: `DELETE FROM penjualan WHERE id = ?`,
        args: [id]
      });
      return true;
    } catch (error) {
      errorService.handle(error);
      return false;
    }
  },

  /**
   * Process invoice approval
   */
  async approve(
    id: string, 
    status: 'Approved' | 'Rejected', 
    signatureUrl?: string, 
    note?: string,
    invoicePdfUrl?: string
  ): Promise<ITs_Penjualan | null> {
    const session = this._getCurrentSession();
    const timezone = getTimezoneIdentifier();
    
    const sql = `
      UPDATE penjualan SET
        approval_status = ?,
        approval_signature_url = ?,
        approval_at = CURRENT_TIMESTAMP,
        approval_note = ?,
        status = ?,
        invoice_pdf_url = COALESCE(?, invoice_pdf_url),
        updated_at = CURRENT_TIMESTAMP,
        updated_by = ?,
        updated_timezone = ?
      WHERE id = ?
    `;
    
    // If approved, status might change to 'Confirmed' or stay as is depending on flow.
    // The user mentioned "preview data penjualannya terlebih dulu, kemudian harus tanda tangan ... klik status Approve/Reject"
    const headerStatus = status === 'Approved' ? 'Confirmed' : 'Cancelled';

    try {
      await dbClient.query(sql, [
        status, 
        signatureUrl || null, 
        note || null, 
        headerStatus,
        invoicePdfUrl || null,
        session?.user_id || null, 
        timezone, 
        id
      ]);
      
      const result = await this.getById(id);
      
      // Integrasi Piutang (Receivable) jika pembayaran Tempo dan disetujui
      if (status === 'Approved' && result && result.payment_type === 'Tempo') {
        const { piutangService } = await import('./piutangService');
        await piutangService.createFromSales(result as any);
      }

      return result;
    } catch (error) {
      errorService.handle(error);
      return null;
    }
  },

  /**
   * Check if any item in this sale has been processed in a purchase (dropship context)
   */
  async checkIsDropshipLocked(id: string): Promise<boolean> {
    const sql = `
      SELECT COUNT(*) as count 
      FROM pembelian_produk 
      WHERE penjualan_produk_id IN (SELECT id FROM penjualan_produk WHERE penjualan_id = ?)
      LIMIT 1
    `;
    try {
      const res = await dbClient.query(sql, [id]);
      return Number((res.rows[0] as any).count || 0) > 0;
    } catch (error) {
      errorService.handle(error);
      return false;
    }
  },

  /**
   * Fetch paginated list of sales for approval workflow
   */
  async getPaginatedApprovals(
    page: number = 1,
    limit: number = 15,
    search: string = '',
    isHistory: boolean = false,
    approverId?: string,
    startDate?: string,
    endDate?: string
  ): Promise<{ items: (ITs_Penjualan & { customer_name?: string; bank_cash_source_name?: string })[]; total: number }> {
    const offset = (page - 1) * limit;
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    const countParams: any[] = [];

    // Filter by approval status: Pending for new, Approved/Rejected for history
    if (isHistory) {
      whereClause += ` AND p.approval_status IN ('Approved', 'Rejected')`;
    } else {
      whereClause += ` AND p.approval_status = 'Pending'`;
    }

    // Filter by approver if provided
    if (approverId) {
      whereClause += ` AND p.approver_id = ?`;
      params.push(approverId);
      countParams.push(approverId);
    }

    if (search) {
      whereClause += ` AND (p.invoice_number LIKE ? OR p.sales_name LIKE ? OR p.keterangan LIKE ?)`;
      const s = `%${search}%`;
      params.push(s, s, s);
      countParams.push(s, s, s);
    }

    if (startDate) {
      whereClause += ` AND date(p.datetime) >= ?`;
      params.push(startDate);
      countParams.push(startDate);
    }

    if (endDate) {
      whereClause += ` AND date(p.datetime) <= ?`;
      params.push(endDate);
      countParams.push(endDate);
    }

    const sqlData = `
      SELECT p.*, c.name as customer_name, b.nama_akun as bank_cash_source_name,
      (SELECT COUNT(*) FROM pembelian_produk WHERE penjualan_produk_id IN (SELECT id FROM penjualan_produk WHERE penjualan_id = p.id)) > 0 as is_dropship_locked
      FROM penjualan p
      LEFT JOIN customer c ON p.customer_id = c.id
      LEFT JOIN bank_and_cash b ON p.bank_cash_source_id = b.id
      ${whereClause} 
      ORDER BY p.datetime DESC 
      LIMIT ? OFFSET ?
    `;
    const sqlCount = `SELECT COUNT(*) as total FROM penjualan p ${whereClause}`;

    params.push(limit, offset);

    try {
      const [dataRes, countRes] = await Promise.all([
        dbClient.query(sqlData, params),
        dbClient.query(sqlCount, countParams)
      ]);

      const items = (dataRes.rows as any[]).map(row => ({
        ...row,
        payment_proof_fileurls: JSON.parse(row.payment_proof_fileurls || '[]')
      })) as (ITs_Penjualan & { customer_name?: string; bank_cash_source_name?: string })[];

      const total = Number((countRes.rows[0] as any).total || 0);

      return { items, total };
    } catch (error) {
      errorService.handle(error);
      return { items: [], total: 0 };
    }
  },

  /**
   * Helper: Get current active session
   */
  _getCurrentSession(): IAkunSession | null {
    return browserStorage.get<IAkunSession>('active_user');
  }
};
