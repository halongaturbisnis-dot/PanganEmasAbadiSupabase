import { dbClient } from '../libs/database.js';
import { errorService } from './errorService.js';
import { stokBerjalanService } from './stokBerjalanService.js';
import { format, eachDayOfInterval, isSameDay } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

export interface FinansialTrendData {
  label: string;
  totalDebit: number; // Pemasukan
  totalKredit: number; // Pengeluaran
  totalBalance: number; // Pemasukan - Pengeluaran
}

export interface BankBalanceTrendData {
  label: string;
  [bankName: string]: string | number; // For ComposedChart dynamically
}

export interface HutangPiutangTrendData {
  label: string;
  hutang: number; 
  piutang: number; // Represented dynamically (maybe negative for stacked bipolar)
}

export interface FinansialBreakdownData {
  label: string;
  nominal: number;
}

export interface KPISummary {
  totalSaldoAkhir: number;
  netCashFlow: number;
  totalPiutang: number;
  totalHutang: number;
}

export interface AgingData {
  label: string; // '0-30 Hari', '31-60 Hari', '61-90 Hari', '>90 Hari'
  piutang: number;
  hutang: number;
}

export interface MutasiData {
  id: string;
  transaction_date: string;
  jenis: 'Pemasukan' | 'Pengeluaran';
  bank_name: string;
  nominal: number;
  type: string; // Kategori
  description: string;
  created_by_name: string;
  updated_by_name: string;
}

export interface FinansialLabaRugi {
  pendapatanPenjualan: number;
  pendapatanPiutang: number;
  pendapatanLainLainList: FinansialBreakdownData[];
  totalPendapatanLainLain: number;
  
  pengeluaranPembelian: number;
  pengeluaranHutang: number;
  pengeluaranLainLainList: FinansialBreakdownData[];
  totalPengeluaranLainLain: number;

  setoranModalList: FinansialBreakdownData[];
  totalSetoranModal: number;

  totalPendapatanOperasional: number;
  totalPengeluaranOperasional: number;
  marginProfitOperasional: number;
}

export interface FinansialEkuitas {
  asetPiutang: number;
  asetValuasiStok: number;
  asetCashflowNet: number;
  totalAset: number;

  kewajibanHutang: number;
  totalKewajiban: number;

  totalEkuitas: number;
}

export interface FinansialReportData {
  kpiSummary: KPISummary;
  agingData: AgingData[];
  trendData: FinansialTrendData[];
  bankBalanceTrend: BankBalanceTrendData[];
  hutangPiutangTrend: HutangPiutangTrendData[];
  expenseBreakdown: FinansialBreakdownData[];
  incomeBreakdown: FinansialBreakdownData[];
  availableBanks: string[];
  mutasiData: MutasiData[];
  labaRugi: FinansialLabaRugi;
  ekuitas: FinansialEkuitas;
}

export const finansialReportService = {
  async getFinansialReport(startDate: string, endDate: string): Promise<FinansialReportData | null> {
    try {
      // 1. Fetch Pemasukan
      const sqlPemasukan = `
        SELECT p.*, 
          bac.nama_akun as bank_name,
          c.username as created_by_name,
          u.username as updated_by_name
        FROM pemasukan p
        LEFT JOIN bank_and_cash bac ON p.bank_and_cash_id = bac.id
        LEFT JOIN akun c ON p.created_by = c.id
        LEFT JOIN akun u ON p.updated_by = u.id
        WHERE date(p.transaction_date) BETWEEN date(?) AND date(?)
      `;
      const pemasukanRes = await dbClient.query(sqlPemasukan, [startDate, endDate]);
      const pemasukan = pemasukanRes.rows as any[];

      // 2. Fetch Pengeluaran
      const sqlPengeluaran = `
        SELECT p.*, 
          bac.nama_akun as bank_name,
          c.username as created_by_name,
          u.username as updated_by_name
        FROM pengeluaran p
        LEFT JOIN bank_and_cash bac ON p.bank_and_cash_id = bac.id
        LEFT JOIN akun c ON p.created_by = c.id
        LEFT JOIN akun u ON p.updated_by = u.id
        WHERE date(p.transaction_date) BETWEEN date(?) AND date(?)
      `;
      const pengeluaranRes = await dbClient.query(sqlPengeluaran, [startDate, endDate]);
      const pengeluaran = pengeluaranRes.rows as any[];

      // Fetch Penjualan for Laba Rugi
      const sqlPenjualan = `
        SELECT sum(grand_total) as val FROM penjualan 
        WHERE date(datetime) BETWEEN date(?) AND date(?)
      `;
      const penjualanRes = await dbClient.query(sqlPenjualan, [startDate, endDate]);
      const pendapatanPenjualan = Number(penjualanRes.rows[0]?.val || 0);

      // Fetch Pembelian for Laba Rugi
      const sqlPembelian = `
        SELECT sum(grand_total_price) as val FROM pembelian 
        WHERE date(datetime) BETWEEN date(?) AND date(?)
      `;
      const pembelianRes = await dbClient.query(sqlPembelian, [startDate, endDate]);
      const pengeluaranPembelian = Number(pembelianRes.rows[0]?.val || 0);

      // 3. Fetch Piutang (Piutang Harian means new piutang created that day)
      const sqlPiutang = `
        SELECT * FROM piutang 
        WHERE date(datetime) BETWEEN date(?) AND date(?)
      `;
      const piutangRes = await dbClient.query(sqlPiutang, [startDate, endDate]);
      const piutangs = piutangRes.rows as any[];

      // 4. Fetch Hutang (Liabilitas) (Hutang Harian means new hutang created that day)
      const sqlLiabilitas = `
        SELECT * FROM liabilitas 
        WHERE date(datetime) BETWEEN date(?) AND date(?)
      `;
      const liabilitasRes = await dbClient.query(sqlLiabilitas, [startDate, endDate]);
      const liabilitas = liabilitasRes.rows as any[];

      // 5. Generate daily trends
      const interval = eachDayOfInterval({ start: new Date(startDate), end: new Date(endDate) });
      const toDateObj = (dateStr: string) => {
        if (!dateStr) return new Date(0);
        // Map string to standard ISO format locally, without converting to UTC
        const normalized = dateStr.includes('T') ? dateStr : dateStr.replace(' ', 'T');
        // Prevent appending 'Z' if it's already a clean local datetime string from SQLite
        return new Date(normalized);
      };

      const trendData: FinansialTrendData[] = [];
      const bankBalanceTrend: BankBalanceTrendData[] = [];
      const hutangPiutangTrend: HutangPiutangTrendData[] = [];

      // Maps for breakdowns
      const expenseMap = new Map<string, number>();
      const incomeMap = new Map<string, number>();
      
      // Laba Rugi variables
      let pendapatanPiutang = 0;
      let totalSetoranModal = 0;
      const pendapatanLainMap = new Map<string, number>();
      const setoranModalMap = new Map<string, number>();
      
      let pengeluaranHutang = 0;
      const pengeluaranLainMap = new Map<string, number>();

      const mutasiPattern = /mutasi|antar kas/i;

      const availableBanksSet = new Set<string>();
      pemasukan.forEach(p => {
         const name = p.bank_name || 'Kas';
         availableBanksSet.add(name);
         
         let parsedType: any = {};
         let categoryGroup = p.type || 'Pemasukan Lainnya';
         if (typeof categoryGroup === 'object') {
           parsedType = categoryGroup;
           categoryGroup = parsedType.name || parsedType.nama_akun || JSON.stringify(parsedType);
         } else if (typeof categoryGroup === 'string' && categoryGroup.trim().startsWith('{')) {
           try {
             parsedType = JSON.parse(categoryGroup);
             categoryGroup = parsedType.name || parsedType.nama_akun || categoryGroup;
           } catch(e) {
             const m = categoryGroup.match(/"(?:name|nama_akun)"\s*:\s*"([^"]+)"/);
             if (m) categoryGroup = m[1];
           }
         }
         
         const classification = parsedType.classification || '';

         incomeMap.set(categoryGroup, (incomeMap.get(categoryGroup) || 0) + p.amount);

         const lCat = categoryGroup.toLowerCase();
         if (mutasiPattern.test(lCat) || mutasiPattern.test(p.description?.toLowerCase() || '')) {
             // Ignore mutasi from Laba/Rugi
         } else if (classification === 'Operasional' && !lCat.includes('penjualan produk') && !lCat.includes('penerimaan piutang')) {
             pendapatanLainMap.set(categoryGroup, (pendapatanLainMap.get(categoryGroup) || 0) + p.amount);
         } else if (lCat.includes('piutang')) {
             pendapatanPiutang += p.amount;
         } else if (lCat.includes('modal') || lCat.includes('pinjaman') || lCat.includes('investasi') || lCat.includes('suntikan')) {
             totalSetoranModal += p.amount;
             setoranModalMap.set(categoryGroup, (setoranModalMap.get(categoryGroup) || 0) + p.amount);
         }
      });
      
      pengeluaran.forEach(p => {
         const name = p.bank_name || 'Kas';
         availableBanksSet.add(name);
         
         let parsedType: any = {};
         let categoryGroup = p.type || 'Pengeluaran Lainnya';
         if (typeof categoryGroup === 'object') {
           parsedType = categoryGroup;
           categoryGroup = parsedType.name || parsedType.nama_akun || JSON.stringify(parsedType);
         } else if (typeof categoryGroup === 'string' && categoryGroup.trim().startsWith('{')) {
           try {
             parsedType = JSON.parse(categoryGroup);
             categoryGroup = parsedType.name || parsedType.nama_akun || categoryGroup;
           } catch(e) {
             const m = categoryGroup.match(/"(?:name|nama_akun)"\s*:\s*"([^"]+)"/);
             if (m) categoryGroup = m[1];
           }
         }

         const classification = parsedType.classification || '';

         expenseMap.set(categoryGroup, (expenseMap.get(categoryGroup) || 0) + p.amount);

         const lCat = categoryGroup.toLowerCase();
         if (mutasiPattern.test(lCat) || mutasiPattern.test(p.description?.toLowerCase() || '')) {
             // Ignore mutasi from Laba/Rugi
         } else if (classification === 'Operasional' && !lCat.includes('pembelian') && !lCat.includes('hutang') && !lCat.includes('pembayaran hutang')) {
             pengeluaranLainMap.set(categoryGroup, (pengeluaranLainMap.get(categoryGroup) || 0) + p.amount);
         } else if (lCat.includes('hutang') || lCat.includes('liabilitas')) {
             pengeluaranHutang += p.amount;
         }
      });
      const availableBanks = Array.from(availableBanksSet);

      interval.forEach(day => {
        const label = format(day, 'dd MMM', { locale: localeId });
        
        // Match day
        const dayPemasukan = pemasukan.filter(p => isSameDay(toDateObj(p.transaction_date), day));
        const dayPengeluaran = pengeluaran.filter(p => isSameDay(toDateObj(p.transaction_date), day));
        const dayPiutang = piutangs.filter(p => isSameDay(toDateObj(p.datetime), day));
        const dayLiabilitas = liabilitas.filter(l => isSameDay(toDateObj(l.datetime), day));

        // 1. AreaChart (Debit, Kredit, Balance daily net)
        const totalDebit = dayPemasukan.reduce((acc, p) => acc + p.amount, 0); // Income
        const totalKredit = dayPengeluaran.reduce((acc, p) => acc + p.amount, 0); // Expense
        const totalBalance = totalDebit - totalKredit; // Daily Net Flow

        trendData.push({ label, totalDebit, totalKredit, totalBalance });

        // 2. Multi Line Chart (Balance per Bank)
        // Note: this represents daily delta (net additions) per bank. 
        // For true balance we would need the cumulative sum including past data before the date range. But let's show daily cash flow per bank for the trend.
        const bankTrendObject: BankBalanceTrendData = { label };
        availableBanks.forEach(b => {
           const bPemasukan = dayPemasukan.filter(p => (p.bank_name || 'Kas') === b).reduce((acc, p) => acc + p.amount, 0);
           const bPengeluaran = dayPengeluaran.filter(p => (p.bank_name || 'Kas') === b).reduce((acc, p) => acc + p.amount, 0);
           bankTrendObject[b] = bPemasukan - bPengeluaran; 
        });
        bankBalanceTrend.push(bankTrendObject);

        // 3. Stacked Bar Chart (Hutang vs Piutang)
        // Hutang mapped as negative to create stacked bipolar effect in Recharts
        const hutang = dayLiabilitas.reduce((acc, l) => acc + l.principal_amount, 0);
        const piutang = dayPiutang.reduce((acc, p) => acc + p.principal_amount, 0);
        hutangPiutangTrend.push({ label, hutang: -hutang, piutang });
      });

      const expenseBreakdown = Array.from(expenseMap.entries())
        .map(([label, nominal]) => ({ label, nominal }))
        .sort((a, b) => b.nominal - a.nominal);

      const incomeBreakdown = Array.from(incomeMap.entries())
        .map(([label, nominal]) => ({ label, nominal }))
        .sort((a, b) => b.nominal - a.nominal);

      const pendapatanLainLainList = Array.from(pendapatanLainMap.entries())
        .map(([label, nominal]) => ({ label, nominal }))
        .sort((a, b) => b.nominal - a.nominal);
      const totalPendapatanLainLain = pendapatanLainLainList.reduce((acc, c) => acc + c.nominal, 0);

      const pengeluaranLainLainList = Array.from(pengeluaranLainMap.entries())
        .map(([label, nominal]) => ({ label, nominal }))
        .sort((a, b) => b.nominal - a.nominal);
      const totalPengeluaranLainLain = pengeluaranLainLainList.reduce((acc, c) => acc + c.nominal, 0);

      const setoranModalList = Array.from(setoranModalMap.entries())
        .map(([label, nominal]) => ({ label, nominal }))
        .sort((a, b) => b.nominal - a.nominal);

      const totalPendapatanOperasional = pendapatanPenjualan + totalPendapatanLainLain;
      const totalPengeluaranOperasional = pengeluaranPembelian + totalPengeluaranLainLain;

      const labaRugi: FinansialLabaRugi = {
        pendapatanPenjualan,
        pendapatanPiutang,
        pendapatanLainLainList,
        totalPendapatanLainLain,
        pengeluaranPembelian,
        pengeluaranHutang,
        pengeluaranLainLainList,
        totalPengeluaranLainLain,
        setoranModalList,
        totalSetoranModal,
        totalPendapatanOperasional,
        totalPengeluaranOperasional,
        marginProfitOperasional: totalPendapatanOperasional - totalPengeluaranOperasional
      };

      // 6. Global KPI & Aging Data
      const resSaldo = await dbClient.query(`
        SELECT 
          (SELECT COALESCE(SUM(amount), 0) FROM pemasukan) 
          - 
          (SELECT COALESCE(SUM(amount), 0) FROM pengeluaran) as total_saldo
      `);
      const totalSaldoAkhir = Number((resSaldo.rows[0] as any).total_saldo || 0);

      const netCashFlow = pemasukan.reduce((acc, p) => acc + p.amount, 0) - pengeluaran.reduce((acc, p) => acc + p.amount, 0);

      const piutangGlobalRes = await dbClient.query(`SELECT outstanding_amount, datetime FROM piutang WHERE outstanding_amount > 0`);
      const piutangGlobals = piutangGlobalRes.rows as any[];
      const totalPiutang = piutangGlobals.reduce((acc, p) => acc + (p.outstanding_amount || 0), 0);

      const hutangGlobalRes = await dbClient.query(`SELECT outstanding_amount, datetime FROM liabilitas WHERE outstanding_amount > 0`);
      const hutangGlobals = hutangGlobalRes.rows as any[];
      const totalHutang = hutangGlobals.reduce((acc, h) => acc + (h.outstanding_amount || 0), 0);

      const kpiSummary: KPISummary = {
        totalSaldoAkhir,
        netCashFlow,
        totalPiutang,
        totalHutang
      };

      const now = new Date();
      now.setHours(0, 0, 0, 0);
      
      const agingBuckets = {
        '0-30 Hari': { piutang: 0, hutang: 0 },
        '31-60 Hari': { piutang: 0, hutang: 0 },
        '61-90 Hari': { piutang: 0, hutang: 0 },
        '>90 Hari': { piutang: 0, hutang: 0 },
      };

      const calculateAgeBucket = (datetimeStr: string) => {
        const dt = toDateObj(datetimeStr);
        dt.setHours(0, 0, 0, 0);
        const diffTime = Math.abs(now.getTime() - dt.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays <= 30) return '0-30 Hari';
        if (diffDays <= 60) return '31-60 Hari';
        if (diffDays <= 90) return '61-90 Hari';
        return '>90 Hari';
      };

      piutangGlobals.forEach(p => {
        const bucket = calculateAgeBucket(p.datetime);
        agingBuckets[bucket].piutang += (p.outstanding_amount || 0);
      });

      hutangGlobals.forEach(h => {
        const bucket = calculateAgeBucket(h.datetime);
        // We use positive values for charting but logic needs them separate
        agingBuckets[bucket].hutang += (h.outstanding_amount || 0); 
      });

      const agingData: AgingData[] = [
        { label: '0-30 Hari', piutang: agingBuckets['0-30 Hari'].piutang, hutang: -agingBuckets['0-30 Hari'].hutang },
        { label: '31-60 Hari', piutang: agingBuckets['31-60 Hari'].piutang, hutang: -agingBuckets['31-60 Hari'].hutang },
        { label: '61-90 Hari', piutang: agingBuckets['61-90 Hari'].piutang, hutang: -agingBuckets['61-90 Hari'].hutang },
        { label: '>90 Hari', piutang: agingBuckets['>90 Hari'].piutang, hutang: -agingBuckets['>90 Hari'].hutang },
      ];

      const mutasiData: MutasiData[] = [
        ...pemasukan.map(p => ({
          id: p.id,
          transaction_date: p.transaction_date,
          jenis: 'Pemasukan' as const,
          bank_name: p.bank_name || '-',
          nominal: p.amount,
          type: p.type || '-',
          description: p.description || '-',
          created_by_name: p.created_by_name || 'System',
          updated_by_name: p.updated_by_name || 'System',
        })),
        ...pengeluaran.map(p => ({
          id: p.id,
          transaction_date: p.transaction_date,
          jenis: 'Pengeluaran' as const,
          bank_name: p.bank_name || '-',
          nominal: p.amount,
          type: p.type || '-',
          description: p.description || '-',
          created_by_name: p.created_by_name || 'System',
          updated_by_name: p.updated_by_name || 'System',
        }))
      ].sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime());

      // 7. Laporan Ekuitas
      const stokList = await stokBerjalanService.getAll();
      const asetValuasiStok = stokList.reduce((acc, sum) => acc + (sum.total_valuation_running > 0 ? sum.total_valuation_running : 0), 0);
      
      const asetPiutang = totalPiutang;
      const asetCashflowNet = totalSaldoAkhir;
      
      const totalAset = asetPiutang + asetValuasiStok + asetCashflowNet;

      const kewajibanHutang = totalHutang;
      const totalKewajiban = kewajibanHutang;

      const totalEkuitas = totalAset - totalKewajiban;

      const ekuitas: FinansialEkuitas = {
        asetPiutang,
        asetValuasiStok,
        asetCashflowNet,
        totalAset,
        kewajibanHutang,
        totalKewajiban,
        totalEkuitas,
      };

      return {
        kpiSummary,
        agingData,
        trendData,
        bankBalanceTrend,
        hutangPiutangTrend,
        expenseBreakdown,
        incomeBreakdown,
        availableBanks,
        mutasiData,
        labaRugi,
        ekuitas
      };
    } catch (error) {
      errorService.handle(error);
      return null;
    }
  }
};
