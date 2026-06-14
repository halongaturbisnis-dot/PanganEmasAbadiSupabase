import { dbClient } from '../libs/database';
import { errorService } from './errorService';
import { format, eachDayOfInterval, isSameDay } from 'date-fns';
import { id } from 'date-fns/locale';
import { getTimezoneOffsetString } from '../utils/time';

export interface DailyFlow {
  label: string;
  Pembelian: number;
  Penerimaan: number;
  Reject: number;
  Selisih: number;
}

export interface QcPenyusutan {
  label: string;
  Penyusutan: number;
}

export interface StokAgregat {
  label: string;
  StokMasuk: number;
  StokKeluar: number; // Will just sum StokTerjual + StokTerbuang (or general outwards)
  StokRetur: number;
  StokTerbuang: number;
  StokTerjual: number;
  SisaStok: number;
}

export interface StokOpnameSelisih {
  label: string;
  Selisih: number;
}

export interface SuplierCombo {
  name: string;
  SumQty: number;
  Frekuensi: number;
}

export interface TopProduct {
  name: string;
  qty: number;
}

export interface LaporanProdukData {
  dailyFlowData: DailyFlow[];
  qcData: QcPenyusutan[];
  agregatData: StokAgregat[];
  opnameData: StokOpnameSelisih[];
  suplierData: SuplierCombo[];
  topSalesDesc: TopProduct[];
  topSalesAsc: TopProduct[];
  topRetur: TopProduct[];
  topTerbuang: TopProduct[];
}

export const laporanProdukService = {
  async getProdukReport(startDate: string, endDate: string, timezone: string = 'Asia/Jakarta'): Promise<LaporanProdukData | null> {
    try {
      const offsetHours = timezone === 'Asia/Jakarta' ? 7 : 
                         timezone === 'Asia/Makassar' ? 8 :
                         timezone === 'Asia/Jayapura' ? 9 : 0;
      const offset = `+${offsetHours} hours`;

      // Function untuk kolom UTC (e.g., created_at, updated_at) yang perlu dikonversi ke lokal
      const dateUtcFunc = (col: string) => `date(${col}, '${offset}')`;
      const datetimeUtcFunc = (col: string) => `datetime(${col}, '${offset}')`;

      // Function untuk kolom lokal (e.g., datetime dari input user) yang TIDAK perlu dikonversi
      const dateLocalFunc = (col: string) => `date(${col})`;
      const datetimeLocalFunc = (col: string) => `datetime(${col})`;

      // 0. Get list of products in stok_berjalan for Agregat filtering
      const resSb = await dbClient.query('SELECT name, sku FROM stok_berjalan');
      const sbList = resSb.rows as any[];
      const sbNames = new Set(sbList.map(i => i.name));
      const sbSkus = new Set(sbList.map(i => i.sku));

      // 1. Data Pembelian
      const sqlPembelian = `
        SELECT pp.qty, ${datetimeLocalFunc('p.datetime')} as created_at, p.id as p_id, s.name as supplier_name, p.status, pp.name as product_name
        FROM pembelian_produk pp
        JOIN pembelian p ON pp.purchase_id = p.id
        LEFT JOIN suplier s ON p.supplier_id = s.id
        WHERE ${dateLocalFunc('p.datetime')} BETWEEN date(?) AND date(?)
      `;
      const resPembelian = await dbClient.query(sqlPembelian, [startDate, endDate]);
      const pembelianData = resPembelian.rows as any[];

      // 2. Data Penerimaan (Penerimaan, Reject, Selisih vs Pembelian)
      const sqlPenerimaan = `
        SELECT p.qty_received_actual, p.qty_rejection, p.qty_diff, ${datetimeLocalFunc('p.datetime')} as created_at, pp.name as product_name
        FROM penerimaan p
        JOIN pembelian_produk pp ON p.purchase_product_id = pp.id
        WHERE ${dateLocalFunc('p.datetime')} BETWEEN date(?) AND date(?)
      `;
      const resPenerimaan = await dbClient.query(sqlPenerimaan, [startDate, endDate]);
      const penerimaanData = resPenerimaan.rows as any[];

      // 3. Data Pemrosesan (Penyusutan QC)
      const sqlPemrosesan = `
        SELECT p.qty_penyusutan, COALESCE(${datetimeUtcFunc('p.updated_at')}, ${datetimeLocalFunc('p.datetime')}) as created_at, pp.name as product_name
        FROM pemrosesan p
        JOIN pembelian_produk pp ON p.pembelian_produk_id = pp.id
        WHERE COALESCE(${dateUtcFunc('p.updated_at')}, ${dateLocalFunc('p.datetime')}) BETWEEN date(?) AND date(?)
        AND (p.qty_penyusutan > 0 OR p.status = 'completed')
      `;
      const resPemrosesan = await dbClient.query(sqlPemrosesan, [startDate, endDate]);
      const pemrosesanData = resPemrosesan.rows as any[];

      // 4. Stok Masuk
      const sqlStokMasuk = `
        SELECT sm.qty_in, ${datetimeUtcFunc('sm.created_at')} as created_at, sm.sku
        FROM stok_masuk sm
        WHERE ${dateUtcFunc('sm.created_at')} BETWEEN date(?) AND date(?)
      `;
      const resStokMasuk = await dbClient.query(sqlStokMasuk, [startDate, endDate]);
      const stokMasukData = resStokMasuk.rows as any[];

      // 5. Stok Terbuang
      const sqlStokTerbuang = `
        SELECT st.name, st.qty, ${datetimeUtcFunc('st.created_at')} as created_at
        FROM stok_terbuang st
        WHERE ${dateUtcFunc('st.created_at')} BETWEEN date(?) AND date(?)
      `;
      const resStokTerbuang = await dbClient.query(sqlStokTerbuang, [startDate, endDate]);
      const stokTerbuangData = resStokTerbuang.rows as any[];

      // 6. Stok Retur
      const sqlStokRetur = `
        SELECT sr.name, sr.qty, ${datetimeUtcFunc('sr.created_at')} as created_at
        FROM stok_retur sr
        WHERE ${dateUtcFunc('sr.created_at')} BETWEEN date(?) AND date(?)
      `;
      const resStokRetur = await dbClient.query(sqlStokRetur, [startDate, endDate]);
      const stokReturData = resStokRetur.rows as any[];

      // 7. Penjualan & Produk Terjual
      const sqlPenjualan = `
        SELECT pp.name, pp.qty, ${datetimeLocalFunc('p.datetime')} as created_at
        FROM penjualan_produk pp
        JOIN penjualan p ON pp.penjualan_id = p.id
        WHERE p.approval_status = 'Approved'
        AND ${dateLocalFunc('p.datetime')} BETWEEN date(?) AND date(?) 
      `;
      const resPenjualan = await dbClient.query(sqlPenjualan, [startDate, endDate]);
      const penjualanData = resPenjualan.rows as any[];

      // 7.B Penjualan Mixing
      const sqlPenjualanMixing = `
        SELECT ppm.name, ppm.qty_composition as qty, ${datetimeLocalFunc('p.datetime')} as created_at
        FROM penjualan_produk_mixing ppm
        JOIN penjualan p ON ppm.penjualan_id = p.id
        WHERE p.approval_status = 'Approved'
        AND ${dateLocalFunc('p.datetime')} BETWEEN date(?) AND date(?)
      `;
      const resPenjualanMixing = await dbClient.query(sqlPenjualanMixing, [startDate, endDate]);
      const penjualanMixingData = resPenjualanMixing.rows as any[];

      const allPenjualanData = [...penjualanData, ...penjualanMixingData];

      // 8. Stok Opname
      const sqlOpname = `
        SELECT so.qty_diff, ${datetimeUtcFunc('so.created_at')} as created_at, so.sku
        FROM stok_opname so
        WHERE ${dateUtcFunc('so.created_at')} BETWEEN date(?) AND date(?)
      `;
      const resOpname = await dbClient.query(sqlOpname, [startDate, endDate]);
      const opnameDataQuery = resOpname.rows as any[];

      // 9. Initial Balance before startDate
      const initialBalanceSql = `
        SELECT 
          IFNULL(SUM(qty_so), 0) as total_so,
          (
            SELECT IFNULL(SUM(sm.qty_in), 0) FROM stok_masuk sm 
            JOIN stok_berjalan sb2 ON sm.sku = sb2.sku 
            WHERE ${datetimeUtcFunc('sm.created_at')} >= IFNULL(${datetimeUtcFunc('sb2.last_so_datetime')}, '1970-01-01')
            AND ${dateUtcFunc('sm.created_at')} < date(?)
          ) as total_in,
          (
            SELECT IFNULL(SUM(p.qty_received_actual), 0) FROM penerimaan p 
            JOIN pembelian_produk pp ON p.purchase_product_id = pp.id 
            JOIN stok_berjalan sb2 ON pp.name = sb2.name 
            WHERE ${datetimeLocalFunc('p.datetime')} >= IFNULL(${datetimeUtcFunc('sb2.last_so_datetime')}, '1970-01-01')
            AND ${dateLocalFunc('p.datetime')} < date(?)
          ) as total_penerimaan,
          (
            SELECT IFNULL(SUM(sr.qty), 0) FROM stok_retur sr 
            JOIN stok_berjalan sb2 ON sr.name = sb2.name 
            WHERE ${datetimeUtcFunc('sr.created_at')} >= IFNULL(${datetimeUtcFunc('sb2.last_so_datetime')}, '1970-01-01')
            AND ${dateUtcFunc('sr.created_at')} < date(?)
          ) as total_retur,
          (
            SELECT IFNULL(SUM(st.qty), 0) FROM stok_terbuang st 
            JOIN stok_berjalan sb2 ON st.name = sb2.name 
            WHERE ${datetimeUtcFunc('st.created_at')} >= IFNULL(${datetimeUtcFunc('sb2.last_so_datetime')}, '1970-01-01')
            AND ${dateUtcFunc('st.created_at')} < date(?)
          ) as total_terbuang,
          (
            SELECT IFNULL(SUM(pp.qty), 0) FROM penjualan_produk pp 
            JOIN penjualan p ON pp.penjualan_id = p.id 
            JOIN stok_berjalan sb2 ON pp.name = sb2.name 
            WHERE p.approval_status = 'Approved' 
            AND ${datetimeLocalFunc('p.datetime')} >= IFNULL(${datetimeUtcFunc('sb2.last_so_datetime')}, '1970-01-01')
            AND ${dateLocalFunc('p.datetime')} < date(?)
          ) as total_terjual,
          (
            SELECT IFNULL(SUM(ppm.qty_composition), 0) FROM penjualan_produk_mixing ppm 
            JOIN penjualan p ON ppm.penjualan_id = p.id 
            JOIN stok_berjalan sb2 ON ppm.name = sb2.name 
            WHERE p.approval_status = 'Approved' 
            AND ${datetimeLocalFunc('p.datetime')} >= IFNULL(${datetimeUtcFunc('sb2.last_so_datetime')}, '1970-01-01')
            AND ${dateLocalFunc('p.datetime')} < date(?)
          ) as total_terjual_mixing,
          (
            SELECT IFNULL(SUM(so2.qty_diff), 0) FROM stok_opname so2 
            JOIN stok_berjalan sb2 ON so2.sku = sb2.sku 
            WHERE ${datetimeUtcFunc('so2.created_at')} >= IFNULL(${datetimeUtcFunc('sb2.last_so_datetime')}, '1970-01-01')
            AND ${dateUtcFunc('so2.created_at')} < date(?)
          ) as total_opname
        FROM stok_berjalan 
      `;
      const resInitial = await dbClient.query(initialBalanceSql, Array(7).fill(startDate));
      const initRow = resInitial.rows[0] as any;
      const initialBalance = 
        (initRow.total_so || 0) + 
        (initRow.total_in || 0) + 
        (initRow.total_penerimaan || 0) + 
        (initRow.total_retur || 0) + 
        (initRow.total_opname || 0) - 
        (initRow.total_terbuang || 0) - 
        (initRow.total_terjual || 0) - 
        (initRow.total_terjual_mixing || 0);

      // PROSES DATA
      
      const interval = eachDayOfInterval({ start: new Date(startDate), end: new Date(endDate) });
      
      const toDateKey = (dateStr: string) => {
        if (!dateStr) return '';
        // SQLite shifted results are 'yyyy-MM-dd HH:mm:ss'
        return dateStr.split(' ')[0];
      };

      const dailyFlowData: DailyFlow[] = [];
      const qcData: QcPenyusutan[] = [];
      const agregatData: StokAgregat[] = [];
      const opnameData: StokOpnameSelisih[] = [];

      let runningStock = initialBalance;

      interval.forEach(day => {
        const dateKey = format(day, 'yyyy-MM-dd');
        const label = format(day, 'dd MMM', { locale: id });
        
        // Flow: Pembelian, Penerimaan, Reject, Selisih
        const dayPembelian = pembelianData.filter(d => toDateKey(d.created_at) === dateKey);
        const dayPenerimaan = penerimaanData.filter(d => toDateKey(d.created_at) === dateKey);
        
        const sumPembelian = dayPembelian.reduce((acc, curr) => acc + (curr.qty || 0), 0);
        const sumPenerimaan = dayPenerimaan.reduce((acc, curr) => acc + (curr.qty_received_actual || 0), 0);
        const sumReject = dayPenerimaan.reduce((acc, curr) => acc + (curr.qty_rejection || 0), 0);
        const sumSelisih = dayPenerimaan.reduce((acc, curr) => acc + (curr.qty_diff || 0), 0);

        dailyFlowData.push({
          label,
          Pembelian: sumPembelian,
          Penerimaan: sumPenerimaan,
          Reject: sumReject,
          Selisih: sumSelisih
        });

        // QC:
        const dayPemrosesan = pemrosesanData.filter(d => toDateKey(d.created_at) === dateKey);
        const sumPenyusutan = dayPemrosesan.reduce((acc, curr) => acc + (curr.qty_penyusutan || 0), 0);
        qcData.push({ label, Penyusutan: sumPenyusutan });

        // Agregat: (HANYA PRODUK DI STOK BERJALAN)
        const dayStokMasuk = stokMasukData.filter(d => toDateKey(d.created_at) === dateKey);
        const dayStokRetur = stokReturData.filter(d => toDateKey(d.created_at) === dateKey);
        const dayStokTerbuang = stokTerbuangData.filter(d => toDateKey(d.created_at) === dateKey);
        const dayPenjualan = allPenjualanData.filter(d => toDateKey(d.created_at) === dateKey);
        const dayOpname = opnameDataQuery.filter(d => toDateKey(d.created_at) === dateKey);

        const dayStokMasukAgregat = dayStokMasuk.filter(d => sbSkus.has(d.sku));
        const dayStokReturAgregat = dayStokRetur.filter(d => sbNames.has(d.name));
        const dayStokTerbuangAgregat = dayStokTerbuang.filter(d => sbNames.has(d.name));
        const dayPenjualanAgregat = dayPenjualan.filter(d => sbNames.has(d.name));
        const dayOpnameAgregat = dayOpname.filter(d => sbSkus.has(d.sku));
        const dayPenerimaanAgregat = dayPenerimaan.filter(d => sbNames.has(d.product_name));

        const sumPenerimaanAgregat = dayPenerimaanAgregat.reduce((acc, curr) => acc + (curr.qty_received_actual || 0), 0);

        const sumMasuk = dayStokMasukAgregat.reduce((acc, curr) => acc + (curr.qty_in || 0), 0) + sumPenerimaanAgregat;
        const sumRetur = dayStokReturAgregat.reduce((acc, curr) => acc + (curr.qty || 0), 0);
        const sumTerbuang = dayStokTerbuangAgregat.reduce((acc, curr) => acc + (curr.qty || 0), 0);
        const sumTerjual = dayPenjualanAgregat.reduce((acc, curr) => acc + (curr.qty || 0), 0);
        const sumOpnameDiffAgregat = dayOpnameAgregat.reduce((acc, curr) => acc + (curr.qty_diff || 0), 0);
        
        runningStock += (sumMasuk + sumRetur + sumOpnameDiffAgregat) - (sumTerjual + sumTerbuang);

        agregatData.push({
          label,
          StokMasuk: sumMasuk,
          StokKeluar: sumTerjual + sumTerbuang,
          StokTerjual: sumTerjual,
          StokRetur: sumRetur,
          StokTerbuang: sumTerbuang,
          SisaStok: runningStock
        });

        // Opname:
        const sumOpnameDiffAll = dayOpname.reduce((acc, curr) => acc + (curr.qty_diff || 0), 0);
        opnameData.push({ label, Selisih: sumOpnameDiffAll });
      });

      // Suplier Combo
      const supplierMap = new Map<string, { SumQty: number, count: number }>();
      const supplierFreqMap = new Map<string, Set<string>>();

      pembelianData.forEach(p => {
        const sName = p.supplier_name || 'Tanpa Nama';
        const curr = supplierMap.get(sName) || { SumQty: 0, count: 0 };
        curr.SumQty += (p.qty || 0);
        supplierMap.set(sName, curr);

        if (!supplierFreqMap.has(sName)) supplierFreqMap.set(sName, new Set());
        supplierFreqMap.get(sName)!.add(p.p_id);
      });

      const suplierData: SuplierCombo[] = Array.from(supplierMap.keys()).map(name => ({
        name,
        SumQty: supplierMap.get(name)!.SumQty,
        Frekuensi: supplierFreqMap.get(name)!.size
      })).sort((a,b) => b.SumQty - a.SumQty).slice(0, 10);

      // Top Products (Sales, Retur, Terbuang)
      const topSalesDesc = Array.from(allPenjualanData.reduce((acc, curr) => {
        acc.set(curr.name, (acc.get(curr.name) || 0) + curr.qty);
        return acc;
      }, new Map<string, number>()).entries())
      .map(([name, qty]) => ({ name, qty }))
      .sort((a,b) => b.qty - a.qty);

      const topSalesAsc = [...topSalesDesc].reverse(); 
      
      const topRetur = Array.from(stokReturData.reduce((acc, curr) => {
        acc.set(curr.name, (acc.get(curr.name) || 0) + curr.qty);
        return acc;
      }, new Map<string, number>()).entries())
      .map(([name, qty]) => ({ name, qty }))
      .sort((a,b) => b.qty - a.qty).slice(0, 5);

      const topTerbuang = Array.from(stokTerbuangData.reduce((acc, curr) => {
        acc.set(curr.name, (acc.get(curr.name) || 0) + curr.qty);
        return acc;
      }, new Map<string, number>()).entries())
      .map(([name, qty]) => ({ name, qty }))
      .sort((a,b) => b.qty - a.qty).slice(0, 5);

      return {
        dailyFlowData,
        qcData,
        agregatData,
        opnameData,
        suplierData,
        topSalesDesc: topSalesDesc.slice(0, 5),
        topSalesAsc: topSalesAsc.slice(0, 5),
        topRetur,
        topTerbuang
      };

    } catch (e) {
      errorService.handle(e);
      return null;
    }
  }
};
