import { dbClient } from '../libs/database';
import { 
  ILiabilitas, 
  ILiabilitasPayload, 
  ILiabilitasPembayaran, 
  ILiabilitasPembayaranPayload, 
  TLiabilitasCategory, 
  TLiabilitasStatus 
} from '../types/ITs_Liabilitas';
import { IPembelianPayload } from '../types/ITs_Pembelian';
import { TPengeluaranStatus } from '../types/ITs_Pengeluaran';
import { errorService } from './errorService';
import { akunService } from './akunService';
import { pengeluaranService } from './pengeluaranService';
import { generateUUID } from '../utils/data';
import { getPageFetchLimit } from './fetchingCenter';

export const liabilitasService = {
  async getPaginated(
    page: number = 1,
    search: string = '',
    options?: {
      limit?: number;
      category?: TLiabilitasCategory;
      status?: TLiabilitasStatus;
      sortKey?: string;
      sortDir?: 'asc' | 'desc';
    }
  ): Promise<{ items: ILiabilitas[]; total: number }> {
    const fetchLimit = options?.limit || getPageFetchLimit('DaftarLiabilitas');
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

    const sqlData = `SELECT * FROM liabilitas ${whereClause} ORDER BY ${finalSortKey} ${finalSortDir} LIMIT ? OFFSET ?`;
    const sqlCount = `SELECT COUNT(*) as total FROM liabilitas ${whereClause}`;

    try {
      const [dataRes, countRes] = await Promise.all([
        dbClient.query(sqlData, [...params, fetchLimit, offset]),
        dbClient.query(sqlCount, params)
      ]);

      return {
        items: dataRes.rows as unknown as ILiabilitas[],
        total: Number((countRes.rows[0] as any).total || 0)
      };
    } catch (error) {
      errorService.handle(error);
      return { items: [], total: 0 };
    }
  },

  async getById(id: string): Promise<(ILiabilitas & { payments: ILiabilitasPembayaran[] }) | null> {
    try {
      const res = await dbClient.query(`SELECT * FROM liabilitas WHERE id = ? LIMIT 1`, [id]);
      if (res.rows.length === 0) return null;

      const header = res.rows[0] as unknown as ILiabilitas;
      const payments = await dbClient.query(`SELECT * FROM liabilitas_pembayaran WHERE liabilitas_id = ? ORDER BY payment_date DESC`, [id]);

      return {
        ...header,
        payments: payments.rows as unknown as ILiabilitasPembayaran[]
      };
    } catch (error) {
      errorService.handle(error);
      return null;
    }
  },

  async create(data: ILiabilitasPayload): Promise<ILiabilitas | null> {
    try {
      const id = data.id || generateUUID();
      const session = akunService.getCurrentSession();
      const timezone = 'Asia/Jakarta';

      const sql = `
        INSERT INTO liabilitas (
          id, datetime, name, description, category, purchase_id, entity_name,
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
        data.purchase_id || null,
        data.entity_name,
        data.principal_amount,
        data.principal_amount, // Initial outstanding = principal
        data.due_date || null,
        data.status || TLiabilitasStatus.ACTIVE,
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
   * CREATE FROM PURCHASE
   * Dipanggil otomatis dari pembelianService ketika ada pembelian tempo
   */
  async createFromPurchase(purchase: IPembelianPayload & { id: string; supplier_name?: string }): Promise<void> {
    if (!purchase.outstanding || purchase.outstanding <= 0) return;

    await this.create({
      datetime: purchase.datetime,
      name: `Hutang Pembelian ${purchase.po_number}`,
      description: `Otomatis dari Pembelian PO ${purchase.po_number}`,
      category: TLiabilitasCategory.PEMBELIAN,
      purchase_id: purchase.id,
      entity_name: purchase.supplier_name || 'Supplier',
      principal_amount: purchase.outstanding,
      due_date: purchase.sla_date || null,
      status: TLiabilitasStatus.ACTIVE,
      created_by: purchase.created_by,
      created_timezone: purchase.created_timezone || 'Asia/Jakarta'
    });
  },

  async update(id: string, data: Partial<ILiabilitasPayload>): Promise<ILiabilitas | null> {
    try {
      const existing = await this.getById(id);
      if (!existing) throw new Error('Data liabilitas tidak ditemukan.');

      const session = akunService.getCurrentSession();
      const timezone = 'Asia/Jakarta';

      const updates: string[] = [];
      const params: any[] = [];

      const fields: (keyof ILiabilitasPayload)[] = [
        'datetime', 'name', 'description', 'category', 'purchase_id', 'entity_name', 'principal_amount', 'due_date', 'status'
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

        await dbClient.query(`UPDATE liabilitas SET ${updates.join(', ')} WHERE id = ?`, params);
        
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

  async addPayment(data: ILiabilitasPembayaranPayload): Promise<ILiabilitasPembayaran | null> {
    try {
      const liabilitas = await this.getById(data.liabilitas_id);
      if (!liabilitas) throw new Error('Induk liabilitas tidak ditemukan.');

      const id = generateUUID();
      const session = akunService.getCurrentSession();
      const timezone = 'Asia/Jakarta';

      // 0. Handle File Uploads
      const uploadedFiles: { url: string; key: string }[] = [];
      if (data.files && data.files.length > 0) {
        const { storageService } = await import('./storage');
        for (const file of data.files) {
          const result = await storageService.upload(file, 'liabilitas_payments');
          uploadedFiles.push(result);
        }
      }
      const proofUrlsJson = uploadedFiles.length > 0 ? JSON.stringify(uploadedFiles) : null;

      // 1. Buat data Pengeluaran otomatis
      const expense = await pengeluaranService.create({
        id: generateUUID(),
        transaction_date: data.payment_date,
        bank_and_cash_id: data.bank_and_cash_id,
        type: 'Pembayaran Hutang',
        description: data.description 
          ? `(${liabilitas.name}) ${data.description}` 
          : `(${liabilitas.name}) Pembayaran cicilan hutang`,
        amount: data.amount,
        proof_urls: uploadedFiles,
        files: undefined, // Payload expect 'files' field for create, but we already uploaded
        status: TPengeluaranStatus.CLEAR, // Langsung clear karena ini pembayaran hutang riil
        purchase_id: liabilitas.purchase_id || undefined
      });

      // 2. Simpan Pembayaran Liabilitas
      const sql = `
        INSERT INTO liabilitas_pembayaran (
          id, liabilitas_id, payment_date, amount, payment_method, 
          bank_and_cash_id, expense_id, description, proof_urls, next_sla,
          created_by, created_timezone
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      try {
        await dbClient.query(sql, [
          id,
          data.liabilitas_id,
          data.payment_date,
          data.amount,
          data.payment_method,
          data.bank_and_cash_id,
          expense?.id || null,
          data.description || null,
          proofUrlsJson,
          data.next_sla || null,
          session?.user_id || null,
          timezone
        ]);
      } catch (insertError: any) {
        console.error('Gagal simpan pembayaran liabilitas:', insertError);
        throw insertError;
      }

      // 3. Update Next SLA (due_date) if provided
      if (data.next_sla) {
        await dbClient.query(`UPDATE liabilitas SET due_date = ? WHERE id = ?`, [data.next_sla, data.liabilitas_id]);
      }

      // 4. Rekalkulasi Outstanding
      await this.recalculateOutstanding(data.liabilitas_id);

      const res = await dbClient.query(`SELECT * FROM liabilitas_pembayaran WHERE id = ?`, [id]);
      return res.rows[0] as unknown as ILiabilitasPembayaran;
    } catch (error) {
      errorService.handle(error);
      return null;
    }
  },

  async recalculateOutstanding(id: string): Promise<void> {
    const liab = await dbClient.query(`SELECT principal_amount FROM liabilitas WHERE id = ?`, [id]);
    const pays = await dbClient.query(`SELECT SUM(amount) as total_paid FROM liabilitas_pembayaran WHERE liabilitas_id = ?`, [id]);

    const principal = Number((liab.rows[0] as any).principal_amount || 0);
    const paid = Number((pays.rows[0] as any).total_paid || 0);
    const outstanding = Math.max(0, principal - paid);
    const status = outstanding <= 0 ? TLiabilitasStatus.SETTLED : TLiabilitasStatus.ACTIVE;

    await dbClient.query(
      `UPDATE liabilitas SET paid_amount = ?, outstanding_amount = ?, status = ? WHERE id = ?`,
      [paid, outstanding, status, id]
    );
  },

  async delete(id: string): Promise<boolean> {
    try {
      await dbClient.query(`DELETE FROM liabilitas WHERE id = ?`, [id]);
      return true;
    } catch (error) {
      errorService.handle(error);
      return false;
    }
  },

  async deletePayment(paymentId: string): Promise<boolean> {
    try {
      const payRes = await dbClient.query(`SELECT liabilitas_id, expense_id FROM liabilitas_pembayaran WHERE id = ?`, [paymentId]);
      if (payRes.rows.length === 0) return false;

      const { liabilitas_id, expense_id } = payRes.rows[0] as any;

      // 1. Hapus pengeluaran terkait
      if (expense_id) {
        await pengeluaranService.delete(expense_id);
      }

      // 2. Hapus pembayaran
      await dbClient.query(`DELETE FROM liabilitas_pembayaran WHERE id = ?`, [paymentId]);

      // 3. Rekalkulasi
      await this.recalculateOutstanding(liabilitas_id);

      return true;
    } catch (error) {
      errorService.handle(error);
      return false;
    }
  }
};
