import { dbClient } from '../libs/database';
import {
  IPembelian,
  IPembelianPayload,
  IPembelianProduk,
  IPembelianBiaya,
  TPembelianStatus,
  TPembelianPaymentType,
  TPembelianPaymentMethod,
  TPembelianShippingType,
  IPembelianFile
} from '../types/ITs_Pembelian';
import { errorService } from './errorService';
import { storageService } from './storage';
import { akunService } from './akunService';
import { suplierService } from './suplierService';
import { customerService } from './customerService';
import { liabilitasService } from './liabilitasService';
import { generateUUID } from '../utils/data';
import { getPageFetchLimit } from './fetchingCenter';

/**
 * PEMBELIAN SERVICE
 * Logic backend untuk modul Pembelian / Procurement.
 * Menangani operations CRUD lengkap, real-time recalculations, 
 * sinkronisasi dinamis Suplier & Customer baru, serta penyimpanan bukti fisik di Tigris Storage.
 */
export const pembelianService = {
  /**
   * Mengambil data pembelian dengan paginasi, pencarian, dan filter.
   * Mendukung LEFT JOIN untuk memuat nama suplier, customer, dan rekening penampung.
   */
  async getPaginated(
    page: number = 1,
    search: string = '',
    options?: {
      limit?: number;
      supplier_id?: string;
      customer_id?: string;
      payment_type?: TPembelianPaymentType;
      status?: TPembelianStatus;
      startDate?: string;
      endDate?: string;
      sortKey?: string;
      sortDir?: 'asc' | 'desc';
    }
  ): Promise<{ items: (IPembelian & { 
    supplier_name?: string; 
    customer_name?: string; 
    bank_and_cash_nama?: string; 
    is_processed_pengeluaran?: boolean; 
    has_paid_liabilitas?: boolean;
    total_produk_pembelian?: number;
    total_produk_diterima?: number;
  })[]; total: number }> {
    const fetchLimit = options?.limit || getPageFetchLimit('DaftarPembelian');
    const offset = (page - 1) * fetchLimit;

    const whereConditions: string[] = [];
    const params: any[] = [];

    // Filter Pencarian (PO number atau Deskripsi)
    if (search) {
      whereConditions.push(`(p.po_number LIKE ? OR p.additional_description LIKE ?)`);
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam);
    }

    // Filter Rentang Tanggal
    if (options?.startDate && options?.endDate) {
      whereConditions.push(`date(p.datetime) BETWEEN ? AND ?`);
      params.push(options.startDate, options.endDate);
    } else if (options?.startDate) {
      whereConditions.push(`date(p.datetime) >= ?`);
      params.push(options.startDate);
    } else if (options?.endDate) {
      whereConditions.push(`date(p.datetime) <= ?`);
      params.push(options.endDate);
    }

    // Filter Supplier
    if (options?.supplier_id) {
      whereConditions.push(`p.supplier_id = ?`);
      params.push(options.supplier_id);
    }

    // Filter Customer
    if (options?.customer_id) {
      whereConditions.push(`p.customer_id = ?`);
      params.push(options.customer_id);
    }

    // Filter Tipe Pembayaran
    if (options?.payment_type) {
      whereConditions.push(`p.payment_type = ?`);
      params.push(options.payment_type);
    }

    // Filter Status Transaksi
    if (options?.status) {
      whereConditions.push(`p.status = ?`);
      params.push(options.status);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Whitespace whitelist sorting keys
    const allowedSortKeys = ['datetime', 'po_number', 'grand_total_price', 'outstanding', 'created_at', 'supplier_name', 'customer_name'];
    let finalSortKey = 'p.datetime';
    
    if (allowedSortKeys.includes(options?.sortKey || '')) {
      if (options?.sortKey === 'supplier_name') {
        finalSortKey = 's.name';
      } else if (options?.sortKey === 'customer_name') {
        finalSortKey = 'c.name';
      } else {
        finalSortKey = `p.${options!.sortKey}`;
      }
    }
    const finalSortDir = options?.sortDir?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const sqlData = `
      SELECT p.*, s.name as supplier_name, c.name as customer_name, b.nama_akun as bank_and_cash_nama,
      (SELECT COUNT(*) FROM pengeluaran WHERE purchase_id = p.id) > 0 as is_processed_pengeluaran,
      (SELECT COUNT(*) FROM liabilitas_pembayaran lp JOIN liabilitas l ON lp.liabilitas_id = l.id WHERE l.purchase_id = p.id) > 0 as has_paid_liabilitas,
      (SELECT COUNT(*) FROM pengiriman WHERE purchase_id = p.id) > 0 as has_internal_shipping,
      (SELECT COUNT(*) FROM pembelian_produk WHERE purchase_id = p.id) as total_produk_pembelian,
      (SELECT COUNT(DISTINCT purchase_product_id) FROM penerimaan WHERE purchase_id = p.id) as total_produk_diterima
      FROM pembelian p
      LEFT JOIN suplier s ON p.supplier_id = s.id
      LEFT JOIN customer c ON p.customer_id = c.id
      LEFT JOIN bank_and_cash b ON p.bank_and_cash_id = b.id
      ${whereClause}
      ORDER BY ${finalSortKey} ${finalSortDir}
      LIMIT ? OFFSET ?
    `;

    const sqlCount = `
      SELECT COUNT(*) as total 
      FROM pembelian p
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
        items: dataRes.rows as unknown as (IPembelian & { 
          supplier_name?: string; 
          customer_name?: string; 
          bank_and_cash_nama?: string; 
          is_processed_pengeluaran?: boolean; 
          has_paid_liabilitas?: boolean;
          total_produk_pembelian?: number;
          total_produk_diterima?: number;
        })[],
        total: Number((countRes.rows[0] as any).total || 0)
      };
    } catch (error) {
      errorService.handle(error);
      return { items: [], total: 0 };
    }
  },

  /**
   * Mengambil data pembelian lengkap berdasarkan ID.
   * Menggabungkan data master (header), list produk (children), dan list biaya tambahan (children).
   */
  async getById(id: string): Promise<(IPembelianPayload & { 
    has_internal_shipping?: boolean;
    total_produk_pembelian?: number;
    total_produk_diterima?: number;
  }) | null> {
    const sqlHeader = `
      SELECT p.*, s.name as supplier_name, c.name as customer_name, b.nama_akun as bank_and_cash_nama,
      (SELECT COUNT(*) FROM pengiriman WHERE purchase_id = p.id) > 0 as has_internal_shipping,
      (SELECT COUNT(*) FROM pembelian_produk WHERE purchase_id = p.id) as total_produk_pembelian,
      (SELECT COUNT(DISTINCT purchase_product_id) FROM penerimaan WHERE purchase_id = p.id) as total_produk_diterima
      FROM pembelian p
      LEFT JOIN suplier s ON p.supplier_id = s.id
      LEFT JOIN customer c ON p.customer_id = c.id
      LEFT JOIN bank_and_cash b ON p.bank_and_cash_id = b.id
      WHERE p.id = ? LIMIT 1
    `;

    try {
      const headerRes = await dbClient.query(sqlHeader, [id]);
      if (headerRes.rows.length === 0) return null;

      const header = headerRes.rows[0] as unknown as IPembelian;

      // Ambil data child: Produk
      const productsRes = await dbClient.query(
        `SELECT * FROM pembelian_produk WHERE purchase_id = ? ORDER BY name ASC`,
        [id]
      );

      // Ambil data child: Biaya Tambahan
      const costsRes = await dbClient.query(
        `SELECT * FROM pembelian_biaya WHERE purchase_id = ? ORDER BY type ASC`,
        [id]
      );

      // Parse metadata lampiran file pendukung
      let filesList: IPembelianFile[] = [];
      try {
        filesList = JSON.parse(header.proof_fileurl || '[]');
      } catch (e) {
        console.warn('Gagal memproses parsing json proof_fileurl', e);
      }

      return {
        ...header,
        proof_fileurl: filesList,
        products: productsRes.rows as unknown as IPembelianProduk[],
        additional_costs: costsRes.rows as unknown as IPembelianBiaya[]
      };
    } catch (error) {
      errorService.handle(error);
      return null;
    }
  },

  /**
   * Membuat transaksi pembelian baru.
   * Otomatis mengunggah file baru ke Tigris, melakukan re-kalkulasi biaya secara real-time,
   * serta mendaftarkan Supplier dan Customer baru jika belum terdaftar.
   */
  async create(data: IPembelianPayload): Promise<IPembelianPayload | null> {
    try {
      const id = generateUUID();
      const session = akunService.getCurrentSession();
      const createdBy = session?.user_id || null;
      const timezone = 'Asia/Jakarta';

      // 1. Integrasi Dinamis Supplier (Poin Relasi a)
      // Jika supplier_id bukan UUID yang valid atau tidak terdaftar, otomatis buat baru
      let finalSupplierId = data.supplier_id || null;
      if (finalSupplierId && finalSupplierId.length > 5) {
        const checkSupplier = await dbClient.query(`SELECT id FROM suplier WHERE id = ? LIMIT 1`, [finalSupplierId]);
        if (checkSupplier.rows.length === 0) {
          // Buat supplier otomatis dengan parameter modular
          const automaticSupplier = await suplierService.create({
            name: finalSupplierId, // Nilai yang diketik sebagai Nama Supplier Baru
            telepon: '-',
            email: '',
            latlong: '0,0',
            alamat: '-'
          });
          if (automaticSupplier) {
            finalSupplierId = automaticSupplier.id;
          }
        }
      } else if (!finalSupplierId || finalSupplierId.length <= 5) {
        // Jika hanya nama pendek atau kosong, coba buat otomatis
        const automaticSupplier = await suplierService.create({
          name: finalSupplierId || 'Supplier Umum',
          telepon: '-',
          email: '',
          latlong: '0,0',
          alamat: '-'
        });
        if (automaticSupplier) {
          finalSupplierId = automaticSupplier.id;
        }
      }

      if (!finalSupplierId) {
        throw new Error('Supplier ID / Nama Supplier wajib diisi.');
      }

      // 2. Integrasi Dinamis Customer (Poin Relasi b)
      // Jika customer_id bukan UUID yang valid atau tidak terdaftar, otomatis buat baru
      let finalCustomerId = data.customer_id || null;
      
      if (data.shipping_type === TPembelianShippingType.INTERNAL) {
        // Jika Pengiriman Internal, Customer HARUS NULL
        finalCustomerId = null;
      } else if (finalCustomerId && finalCustomerId.trim() !== '') {
        const checkCustomer = await dbClient.query(`SELECT id FROM customer WHERE id = ? LIMIT 1`, [finalCustomerId]);
        if (checkCustomer.rows.length === 0) {
          // Buat customer otomatis dengan parameter default aman
          const automaticCustomer = await customerService.create({
            name: finalCustomerId, // Nilai yang diketik sebagai Nama Customer Baru
            company: '',
            telepon: '-',
            email: '',
            latlong: '0,0',
            alamat: '-',
            bidang_usaha: ''
          });
          if (automaticCustomer) {
            finalCustomerId = automaticCustomer.id;
          }
        }
      } else {
        // Fallback: Jika database masih memiliki constraint NOT NULL dan tipe adalah CUSTOMER, gunakan Customer Umum
        try {
          const generalCustomer = await customerService.getOrCreateGeneralCustomer();
          finalCustomerId = generalCustomer.id;
        } catch (err) {
          console.warn('Gagal mendapatkan Customer Umum:', err);
          finalCustomerId = null; 
        }
      }

      // 3. Manajemen file lampiran di Tigris (StorageRule.md)
      // Upload ditangani di sisi client/page untuk mendukung kompresi (fileProcessor.ts)
      const finalProofFiles = data.proof_fileurl || [];

      // 4. Perhitungan Akurat Produk (Poin Relasi c)
      let sumProductPrice = 0;
      if (data.products && data.products.length > 0) {
        data.products.forEach(prod => {
          sumProductPrice += (prod.qty || 0) * (prod.price_per_unit || 0);
        });
      }

      // 5. Perhitungan Akurat Biaya Tambahan (Poin Relasi d)
      let sumAddedCost = 0;
      if (data.additional_costs && data.additional_costs.length > 0) {
        data.additional_costs.forEach(cost => {
          sumAddedCost += cost.cost || 0;
        });
      }

      const grandTotalPrice = sumProductPrice + sumAddedCost;

      // 6. Penyesuaian Sisa Pembayaran (Outstanding) dan Deposit
      const isLunas = data.payment_type === TPembelianPaymentType.LUNAS;
      const finalDeposit = isLunas ? grandTotalPrice : (data.deposit || 0);
      const finalOutstanding = isLunas ? 0 : Math.max(0, grandTotalPrice - finalDeposit);
      const finalSlaDate = isLunas ? null : (data.sla_date || null);

      // 7. Simpan Transaksi Utama (Induk - pembelian)
      const sqlInsertHeader = `
        INSERT INTO pembelian (
          id, datetime, po_number, additional_description, supplier_id,
          sum_product_price, sum_added_cost, grand_total_price,
          payment_type, deposit, outstanding, sla_date,
          payment_method, bank_and_cash_id, shipping_type, customer_id,
          proof_fileurl, status, penjualan_id, created_by, created_timezone
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const headerParams = [
        id,
        data.datetime,
        data.po_number,
        data.additional_description || null,
        finalSupplierId,
        sumProductPrice,
        sumAddedCost,
        grandTotalPrice,
        data.payment_type,
        finalDeposit,
        finalOutstanding,
        finalSlaDate,
        data.payment_method,
        data.bank_and_cash_id,
        data.shipping_type,
        finalCustomerId,
        JSON.stringify(finalProofFiles),
        data.status || TPembelianStatus.COMPLETED,
        data.penjualan_id || null,
        createdBy,
        timezone
      ];

      await dbClient.query(sqlInsertHeader, headerParams);

      // 8. Simpan Transaksi Child: Produk Pembelian
      if (data.products && data.products.length > 0) {
        for (const prod of data.products) {
          const prodId = generateUUID();
          const itemSumPrice = (prod.qty || 0) * (prod.price_per_unit || 0);
          
          const sqlInsertProduct = `
            INSERT INTO pembelian_produk (
              id, purchase_id, datetime, po_number, category, sub_category,
              name, unit, qty, price_per_unit, sum_price, kadar_air,
              penjualan_produk_id, created_by, created_timezone
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;
          
          const productParams = [
            prodId,
            id,
            data.datetime,
            data.po_number,
            prod.category,
            prod.sub_category,
            prod.name,
            prod.unit,
            prod.qty,
            prod.price_per_unit,
            itemSumPrice,
            prod.kadar_air !== undefined && prod.kadar_air !== null ? prod.kadar_air : null,
            prod.penjualan_produk_id || null,
            createdBy,
            timezone
          ];

          await dbClient.query(sqlInsertProduct, productParams);
        }
      }

      // 9. Simpan Transaksi Child: Biaya Tambahan
      if (data.additional_costs && data.additional_costs.length > 0) {
        for (const cost of data.additional_costs) {
          const costId = generateUUID();
          
          const sqlInsertCost = `
            INSERT INTO pembelian_biaya (
              id, purchase_id, datetime, po_number, type, cost, description,
              created_by, created_timezone
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;

          const costParams = [
            costId,
            id,
            data.datetime,
            data.po_number,
            cost.type,
            cost.cost,
            cost.description,
            createdBy,
            timezone
          ];

          await dbClient.query(sqlInsertCost, costParams);
        }
      }

      const result = await this.getById(id);
      
      // 10. Integrasi Liabilitas (Hutang)
      if (result && result.payment_type === TPembelianPaymentType.TEMPO && result.outstanding > 0) {
        await liabilitasService.createFromPurchase(result as any);
      }

      return result;
    } catch (error) {
      errorService.handle(error);
      return null;
    }
  },

  /**
   * Memperbarui detail transaksi pembelian.
   * Menangani penggantian file, penghapusan file lama (anti-yatim), update supplier/customer dinamis,
   * serta pembaruan line items produk & tambahan biaya (Children Replacement).
   */
  async update(id: string, data: Partial<IPembelianPayload>): Promise<IPembelianPayload | null> {
    try {
      const existing = await this.getById(id);
      if (!existing) throw new Error('Data transaksi pembelian tidak ditemukan.');

      // Proteksi kredibilitas data jika sudah diproses pengiriman internal
      if (existing.has_internal_shipping && existing.shipping_type === 'Internal') {
        throw new Error('Data tidak dapat diubah karena sudah masuk proses pengiriman internal.');
      }

      const session = akunService.getCurrentSession();
      const updatedBy = session?.user_id || null;
      const timezone = 'Asia/Jakarta';

      // 1. Integrasi Dinamis Supplier jika berubah
      let finalSupplierId = data.supplier_id !== undefined ? (data.supplier_id || null) : existing.supplier_id;
      if (finalSupplierId && finalSupplierId !== existing.supplier_id) {
        const checkSupplier = await dbClient.query(`SELECT id FROM suplier WHERE id = ? LIMIT 1`, [finalSupplierId]);
        if (checkSupplier.rows.length === 0) {
          const automaticSupplier = await suplierService.create({
            name: finalSupplierId,
            telepon: '-',
            email: '',
            latlong: '0,0',
            alamat: '-'
          });
          if (automaticSupplier) {
            finalSupplierId = automaticSupplier.id;
          }
        }
      }

      // 2. Integrasi Dinamis Customer jika berubah
      let finalCustomerId = data.customer_id !== undefined ? (data.customer_id || null) : existing.customer_id;
      const currentShippingType = data.shipping_type || existing.shipping_type;

      if (currentShippingType === TPembelianShippingType.INTERNAL) {
        // Jika Pengiriman Internal, Customer HARUS NULL
        finalCustomerId = null;
      } else if (finalCustomerId && finalCustomerId !== existing.customer_id) {
        const checkCustomer = await dbClient.query(`SELECT id FROM customer WHERE id = ? LIMIT 1`, [finalCustomerId]);
        if (checkCustomer.rows.length === 0) {
          const automaticCustomer = await customerService.create({
            name: finalCustomerId,
            company: '',
            telepon: '-',
            email: '',
            latlong: '0,0',
            alamat: '-',
            bidang_usaha: ''
          });
          if (automaticCustomer) {
            finalCustomerId = automaticCustomer.id;
          }
        }
      } else if (finalCustomerId === null || finalCustomerId === '') {
        // Fallback: Jika ingin dikosongkan tapi DB masih NOT NULL dan tipe adalah CUSTOMER
        try {
          const generalCustomer = await customerService.getOrCreateGeneralCustomer();
          finalCustomerId = generalCustomer.id;
        } catch (err) {
          finalCustomerId = null;
        }
      }

      // 3. Manajemen file lampiran (StorageRule.md)
      // Cleanup orphan ditangani di sini, Upload ditangani di sisi client/page
      let currentProofFiles: IPembelianFile[] = existing.proof_fileurl || [];
      let preservedProofFiles: IPembelianFile[] = data.proof_fileurl || [];

      // Identifikasi file yatim yang harus dihapus secara permanen dari Tigris
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

      const finalProofUrlsJson = JSON.stringify(preservedProofFiles);

      // 4. Update Child Data: Produk (Jika dikirim di payload)
      const currentPO = data.po_number || existing.po_number;
      const currentDatetime = data.datetime || existing.datetime;

      if (data.products !== undefined) {
        // Hapus produk lama
        await dbClient.query(`DELETE FROM pembelian_produk WHERE purchase_id = ?`, [id]);
        // Masukkan produk baru
        for (const prod of data.products) {
          const prodId = generateUUID();
          const itemSumPrice = (prod.qty || 0) * (prod.price_per_unit || 0);

          const sqlInsertProduct = `
            INSERT INTO pembelian_produk (
              id, purchase_id, datetime, po_number, category, sub_category,
              name, unit, qty, price_per_unit, sum_price, kadar_air,
              penjualan_produk_id, created_by, created_timezone
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;

          await dbClient.query(sqlInsertProduct, [
            prodId,
            id,
            currentDatetime,
            currentPO,
            prod.category,
            prod.sub_category,
            prod.name,
            prod.unit,
            prod.qty,
            prod.price_per_unit,
            itemSumPrice,
            prod.kadar_air !== undefined && prod.kadar_air !== null ? prod.kadar_air : null,
            prod.penjualan_produk_id || null,
            updatedBy,
            timezone
          ]);
        }
      }

      // 5. Update Child Data: Biaya Tambahan (Jika dikirim di payload)
      if (data.additional_costs !== undefined) {
        // Hapus biaya lama
        await dbClient.query(`DELETE FROM pembelian_biaya WHERE purchase_id = ?`, [id]);
        // Masukkan biaya baru
        for (const cost of data.additional_costs) {
          const costId = generateUUID();

          const sqlInsertCost = `
            INSERT INTO pembelian_biaya (
              id, purchase_id, datetime, po_number, type, cost, description,
              created_by, created_timezone
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;

          await dbClient.query(sqlInsertCost, [
            costId,
            id,
            currentDatetime,
            currentPO,
            cost.type,
            cost.cost,
            cost.description,
            updatedBy,
            timezone
          ]);
        }
      }

      // 6. Ambil hasil akumulasi perhitungan terbaru pasca update children
      const finalProductsRes = await dbClient.query(`SELECT sum_price FROM pembelian_produk WHERE purchase_id = ?`, [id]);
      const finalCostsRes = await dbClient.query(`SELECT cost FROM pembelian_biaya WHERE purchase_id = ?`, [id]);

      const sumProductPrice = finalProductsRes.rows.reduce((sum, row: any) => sum + (row.sum_price || 0), 0);
      const sumAddedCost = finalCostsRes.rows.reduce((sum, row: any) => sum + (row.cost || 0), 0);
      const grandTotalPrice = sumProductPrice + sumAddedCost;

      const currentPaymentType = data.payment_type !== undefined ? data.payment_type : existing.payment_type;
      const isLunas = currentPaymentType === TPembelianPaymentType.LUNAS;
      
      const requestedDeposit = data.deposit !== undefined ? data.deposit : existing.deposit;
      const finalDeposit = isLunas ? grandTotalPrice : requestedDeposit;
      const finalOutstanding = isLunas ? 0 : Math.max(0, grandTotalPrice - finalDeposit);
      const finalSlaDate = isLunas ? null : (data.sla_date !== undefined ? data.sla_date : existing.sla_date);

      // 7. Update tabel Induk (pembelian)
      const updates: string[] = [];
      const params: any[] = [];

      const fieldsToUpdate: { field: string; val: any }[] = [
        { field: 'datetime', val: data.datetime },
        { field: 'po_number', val: data.po_number },
        { field: 'additional_description', val: data.additional_description },
        { field: 'supplier_id', val: finalSupplierId },
        { field: 'payment_type', val: currentPaymentType },
        { field: 'payment_method', val: data.payment_method },
        { field: 'bank_and_cash_id', val: data.bank_and_cash_id },
        { field: 'shipping_type', val: data.shipping_type },
        { field: 'customer_id', val: finalCustomerId },
        { field: 'status', val: data.status },
        { field: 'penjualan_id', val: data.penjualan_id },
      ];

      fieldsToUpdate.forEach(item => {
        if (item.val !== undefined) {
          updates.push(`${item.field} = ?`);
          params.push(item.val);
        }
      });

      // Kolom terhitung dan file wajib diselipkan ke perbaruan
      updates.push(
        `sum_product_price = ?`,
        `sum_added_cost = ?`,
        `grand_total_price = ?`,
        `deposit = ?`,
        `outstanding = ?`,
        `sla_date = ?`,
        `proof_fileurl = ?`
      );
      params.push(
        sumProductPrice,
        sumAddedCost,
        grandTotalPrice,
        finalDeposit,
        finalOutstanding,
        finalSlaDate,
        finalProofUrlsJson
      );

      // Audit trail update
      updates.push(`updated_by = ?`, `updated_timezone = ?`);
      params.push(updatedBy, timezone);

      params.push(id);
      const sqlUpdateHeader = `UPDATE pembelian SET ${updates.join(', ')} WHERE id = ?`;

      await dbClient.query(sqlUpdateHeader, params);

      return await this.getById(id);
    } catch (error) {
      errorService.handle(error);
      return null;
    }
  },

  /**
   * Menghapus transaksi pembelian secara permanen.
   * Melakukan cleanup fisik lampiran bukti di Tigris Storage.
   * Data anak di database (produk & biaya) akan ikut terhapus otomatis berkat ON DELETE CASCADE.
   */
  async delete(id: string): Promise<boolean> {
    try {
      const existing = await this.getById(id);
      if (!existing) throw new Error('Data transaksi pembelian tidak ditemukan.');

      // Proteksi kredibilitas data jika sudah diproses pengiriman internal
      if (existing.has_internal_shipping && existing.shipping_type === 'Internal') {
        throw new Error('Data tidak dapat dihapus karena sudah masuk proses pengiriman internal.');
      }

      // 1. Bersihkan fisik dokumen lampiran di Tigris (Anti-Yatim)
      if (existing.proof_fileurl && existing.proof_fileurl.length > 0) {
        for (const f of existing.proof_fileurl) {
          if (f.key) {
            try {
              await storageService.delete(f.key);
            } catch (err) {
              console.warn(`Gagal membersihkan lampiran: ${f.key}`, err);
            }
          }
        }
      }

      // 2. Hapus draf/record utama di database (Anak terhapus cascade otomatis)
      const sqlDelete = `DELETE FROM pembelian WHERE id = ?`;
      await dbClient.query(sqlDelete, [id]);

      return true;
    } catch (error) {
      errorService.handle(error);
      return false;
    }
  },

  /**
   * Membantu menghapus beberapa data transaksi pembelian sekaligus secara bulk.
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
  },

  async getDistinctProductNames(): Promise<{ label: string; value: string }[]> {
    try {
      const sql = `SELECT DISTINCT name FROM pembelian_produk WHERE name IS NOT NULL AND name != '' ORDER BY name ASC`;
      const res = await dbClient.query(sql);
      return res.rows.map((r: any) => ({ label: r.name, value: r.name }));
    } catch (error) {
      errorService.handle(error);
      return [];
    }
  },

  async getDistinctProductCategories(): Promise<{ label: string; value: string }[]> {
    try {
      const sql = `SELECT DISTINCT category FROM pembelian_produk WHERE category IS NOT NULL AND category != '' ORDER BY category ASC`;
      const res = await dbClient.query(sql);
      return res.rows.map((r: any) => ({ label: r.category, value: r.category }));
    } catch (error) {
      errorService.handle(error);
      return [];
    }
  },

  async getDistinctProductSubCategories(): Promise<{ label: string; value: string }[]> {
    try {
      const sql = `SELECT DISTINCT sub_category FROM pembelian_produk WHERE sub_category IS NOT NULL AND sub_category != '' ORDER BY sub_category ASC`;
      const res = await dbClient.query(sql);
      return res.rows.map((r: any) => ({ label: r.sub_category, value: r.sub_category }));
    } catch (error) {
      errorService.handle(error);
      return [];
    }
  },

  async isProcessedInPengeluaran(purchaseId: string): Promise<boolean> {
    try {
      const sql = `SELECT COUNT(*) as count FROM pengeluaran WHERE purchase_id = ?`;
      const res = await dbClient.query(sql, [purchaseId]);
      return Number((res.rows[0] as any).count || 0) > 0;
    } catch (error) {
      return false;
    }
  },

  async hasPaidLiabilitas(purchaseId: string): Promise<boolean> {
    try {
      const sql = `
        SELECT COUNT(*) as count 
        FROM liabilitas_pembayaran lp
        JOIN liabilitas l ON lp.liabilitas_id = l.id
        WHERE l.purchase_id = ?
      `;
      const res = await dbClient.query(sql, [purchaseId]);
      return Number((res.rows[0] as any).count || 0) > 0;
    } catch (error) {
      return false;
    }
  },

  async getDistinctCostTypes(): Promise<{ label: string; value: string }[]> {
    try {
      const sql = `SELECT DISTINCT type FROM pembelian_biaya WHERE type IS NOT NULL AND type != '' ORDER BY type ASC`;
      const res = await dbClient.query(sql);
      return res.rows.map((r: any) => ({ label: r.type, value: r.type }));
    } catch (error) {
      errorService.handle(error);
      return [];
    }
  }
};
