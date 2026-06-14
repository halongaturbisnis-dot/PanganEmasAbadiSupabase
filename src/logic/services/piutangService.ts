import { dbClient } from '../libs/database';
import { 
  IPiutang, 
  IPiutangPayload, 
  IPiutangPembayaran, 
  IPiutangPembayaranPayload, 
  TPiutangCategory, 
  TPiutangStatus 
} from '../types/ITs_Piutang';
import { ITs_Penjualan as IPenjualanPayload } from '../types/ITs_Penjualan';
import { TPemasukanStatus } from '../types/ITs_Pemasukan';
import { errorService } from './errorService';
import { akunService } from './akunService';
import { pemasukanService } from './pemasukanService';
import { generateUUID } from '../utils/data';
import { getPageFetchLimit } from './fetchingCenter';

export const piutangService = {
  async getPaginated(
    page: number = 1,
    search: string = '',
    options?: {
      limit?: number;
      category?: TPiutangCategory;
      status?: TPiutangStatus;
      sortKey?: string;
      sortDir?: 'asc' | 'desc';
    }
  ): Promise<{ items: IPiutang[]; total: number }> {
    const fetchLimit = options?.limit || getPageFetchLimit('DaftarPiutang');
    const offset = (page - 1) * fetchLimit;

    let whereConditions: string[] = [];
    const params: any[] = [];

    if (search) {
      whereConditions.push(`(name LIKE ? OR entity_name LIKE ? OR description LIKE ?)`);
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam);
    }

    if (options?.category) {
      whereConditions.push(`category = ?`);
      params.push(options.category);
    }

    if (options?.status) {
      whereConditions.push(`status = ?`);
      params.push(options.status);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    const allowedSortKeys = ['datetime', 'due_date', 'principal_amount', 'outstanding_amount', 'created_at'];
    const finalSortKey = allowedSortKeys.includes(options?.sortKey || '') ? options?.sortKey : 'datetime';
    const finalSortDir = options?.sortDir?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const sqlData = `SELECT * FROM piutang ${whereClause} ORDER BY ${finalSortKey} ${finalSortDir} LIMIT ? OFFSET ?`;
    const sqlCount = `SELECT COUNT(*) as total FROM piutang ${whereClause}`;

    try {
      const [dataRes, countRes] = await Promise.all([
        dbClient.query(sqlData, [...params, fetchLimit, offset]),
        dbClient.query(sqlCount, params)
      ]);

      return {
        items: dataRes.rows as unknown as IPiutang[],
        total: Number((countRes.rows[0] as any).total || 0)
      };
    } catch (error) {
      errorService.handle(error);
      return { items: [], total: 0 };
    }
  },

  async getById(id: string): Promise<(IPiutang & { payments: IPiutangPembayaran[] }) | null> {
    try {
      const res = await dbClient.query(`SELECT * FROM piutang WHERE id = ? LIMIT 1`, [id]);
      if (res.rows.length === 0) return null;

      const header = res.rows[0] as unknown as IPiutang;
      const payments = await dbClient.query(`SELECT * FROM piutang_pembayaran WHERE piutang_id = ? ORDER BY payment_date DESC`, [id]);

      return {
        ...header,
        payments: payments.rows as unknown as IPiutangPembayaran[]
      };
    } catch (error) {
      errorService.handle(error);
      return null;
    }
  },

  async create(data: IPiutangPayload): Promise<IPiutang | null> {
    try {
      const id = data.id || generateUUID();
      const session = akunService.getCurrentSession();
      const timezone = 'Asia/Jakarta';

      const sql = `
        INSERT INTO piutang (
          id, datetime, name, description, category, sales_id, entity_name,
          principal_amount, outstanding_amount, due_date, status,
          created_by, created_timezone
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const params = [
        id,
        data.datetime,
        data.name,
        data.description || null,
        data.category,
        data.sales_id || null,
        data.entity_name,
        data.principal_amount,
        data.principal_amount, // Initial outstanding = principal
        data.due_date || null,
        data.status || TPiutangStatus.ACTIVE,
        session?.user_id || null,
        timezone
      ];

      await dbClient.query(sql, params);
      return this.getById(id);
    } catch (error) {
      errorService.handle(error);
      return null;
    }
  },

  /**
   * CREATE FROM SALES
   * Dipanggil otomatis dari penjualanService ketika ada penjualan tempo
   */
  async createFromSales(sales: IPenjualanPayload & { id: string; customer_name?: string }): Promise<void> {
    // If outstanding <= 0, don't create receivable
    const outstanding = (sales.grand_total || 0) - (sales.deposit || 0);
    if (outstanding <= 0) return;

    await this.create({
      datetime: sales.datetime,
      name: `Piutang Penjualan ${sales.invoice_number}`,
      description: `Otomatis dari Penjualan Invoice ${sales.invoice_number}`,
      category: TPiutangCategory.PENJUALAN,
      sales_id: sales.id,
      entity_name: sales.customer_name || 'Customer',
      principal_amount: outstanding,
      due_date: sales.sla_date || null,
      status: TPiutangStatus.ACTIVE,
      created_by: sales.created_by || null,
      created_timezone: sales.created_timezone || 'Asia/Jakarta'
    });
  },

  async update(id: string, data: Partial<IPiutangPayload>): Promise<IPiutang | null> {
    try {
      const existing = await this.getById(id);
      if (!existing) throw new Error('Data piutang tidak ditemukan.');

      const session = akunService.getCurrentSession();
      const timezone = 'Asia/Jakarta';

      const updates: string[] = [];
      const params: any[] = [];

      const fields: (keyof IPiutangPayload)[] = [
        'datetime', 'name', 'description', 'category', 'sales_id', 'entity_name', 'principal_amount', 'due_date', 'status'
      ];

      fields.forEach(f => {
        if (data[f] !== undefined) {
          updates.push(`${f} = ?`);
          params.push(data[f]);
        }
      });

      if (updates.length > 0) {
        updates.push(`updated_by = ?`, `updated_timezone = ?`);
        params.push(session?.user_id || null, timezone);
        params.push(id);

        await dbClient.query(`UPDATE piutang SET ${updates.join(', ')} WHERE id = ?`, params);
        
        // Recalculate outstanding if principal_amount changed
        if (data.principal_amount !== undefined) {
          await this.recalculateOutstanding(id);
        }
      }

      return this.getById(id);
    } catch (error) {
      errorService.handle(error);
      return null;
    }
  },

  async addPayment(data: IPiutangPembayaranPayload): Promise<IPiutangPembayaran | null> {
    try {
      const piutang = await this.getById(data.piutang_id);
      if (!piutang) throw new Error('Induk piutang tidak ditemukan.');

      const id = generateUUID();
      const session = akunService.getCurrentSession();
      const timezone = 'Asia/Jakarta';

      // 0. Handle File Uploads
      const uploadedFiles: { url: string; key: string }[] = [];
      if (data.files && data.files.length > 0) {
        const { storageService } = await import('./storage');
        for (const file of data.files) {
          const result = await storageService.upload(file, 'piutang_payments');
          uploadedFiles.push(result);
        }
      }
      const proofUrlsJson = uploadedFiles.length > 0 ? JSON.stringify(uploadedFiles) : null;

      // 1. Buat data Pemasukan otomatis
      const income = await pemasukanService.create({
        id: generateUUID(),
        transaction_date: data.payment_date,
        bank_and_cash_id: data.bank_and_cash_id,
        type: 'Penerimaan Piutang',
        description: data.description 
          ? `(${piutang.name}) ${data.description}` 
          : `(${piutang.name}) Penerimaan cicilan piutang`,
        amount: data.amount,
        proof_urls: uploadedFiles,
        files: undefined, // Payload expect 'files' field for create, but we already uploaded
        status: TPemasukanStatus.CLEAR, // Langsung clear karena ini pembayaran piutang riil
        sales_id: piutang.sales_id || undefined
      });

      // 2. Simpan Pembayaran Piutang
      const sql = `
        INSERT INTO piutang_pembayaran (
          id, piutang_id, payment_date, amount, payment_method, 
          bank_and_cash_id, income_id, description, proof_urls, next_sla,
          created_by, created_timezone
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      try {
        await dbClient.query(sql, [
          id,
          data.piutang_id,
          data.payment_date,
          data.amount,
          data.payment_method,
          data.bank_and_cash_id,
          income?.id || null,
          data.description || null,
          proofUrlsJson,
          data.next_sla || null,
          session?.user_id || null,
          timezone
        ]);
      } catch (insertError: any) {
        console.error('Gagal simpan pembayaran piutang:', insertError);
        throw insertError;
      }

      // 3. Update Next SLA (due_date) if provided
      if (data.next_sla) {
        await dbClient.query(`UPDATE piutang SET due_date = ? WHERE id = ?`, [data.next_sla, data.piutang_id]);
      }

      // 4. Rekalkulasi Outstanding
      await this.recalculateOutstanding(data.piutang_id);

      const res = await dbClient.query(`SELECT * FROM piutang_pembayaran WHERE id = ?`, [id]);
      return res.rows[0] as unknown as IPiutangPembayaran;
    } catch (error) {
      errorService.handle(error);
      return null;
    }
  },

  async recalculateOutstanding(id: string): Promise<void> {
    const p = await dbClient.query(`SELECT principal_amount FROM piutang WHERE id = ?`, [id]);
    const pays = await dbClient.query(`SELECT SUM(amount) as total_paid FROM piutang_pembayaran WHERE piutang_id = ?`, [id]);

    const principal = Number((p.rows[0] as any).principal_amount || 0);
    const paid = Number((pays.rows[0] as any).total_paid || 0);
    const outstanding = Math.max(0, principal - paid);
    const status = outstanding <= 0 ? TPiutangStatus.SETTLED : TPiutangStatus.ACTIVE;

    await dbClient.query(
      `UPDATE piutang SET paid_amount = ?, outstanding_amount = ?, status = ? WHERE id = ?`,
      [paid, outstanding, status, id]
    );
  },

  async delete(id: string): Promise<boolean> {
    try {
      await dbClient.query(`DELETE FROM piutang WHERE id = ?`, [id]);
      return true;
    } catch (error) {
      errorService.handle(error);
      return false;
    }
  },

  async deletePayment(paymentId: string): Promise<boolean> {
    try {
      const payRes = await dbClient.query(`SELECT piutang_id, income_id FROM piutang_pembayaran WHERE id = ?`, [paymentId]);
      if (payRes.rows.length === 0) return false;

      const { piutang_id, income_id } = payRes.rows[0] as any;

      // 1. Hapus pemasukan terkait
      if (income_id) {
        await pemasukanService.delete(income_id);
      }

      // 2. Hapus pembayaran
      await dbClient.query(`DELETE FROM piutang_pembayaran WHERE id = ?`, [paymentId]);

      // 3. Rekalkulasi
      await this.recalculateOutstanding(piutang_id);

      return true;
    } catch (error) {
      errorService.handle(error);
      return false;
    }
  }
};
