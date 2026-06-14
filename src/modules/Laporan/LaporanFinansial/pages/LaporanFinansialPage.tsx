import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, FileDown, X } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { MainShell } from '../../../../ui/components/common/shells/MainShell';
import { useGlobalState } from '../../../../logic/context/GlobalContext';
import { finansialReportService, FinansialReportData } from '../../../../logic/services/finansialReportService';
import { DateRangePicker } from '../../../../ui/components/elements/DateRangePicker';
import { tokens } from '../../../../ui/styles/tokens';
import { formatCurrency } from '../../../../logic/utils/data';
import { formatDateTimeWithPipe, formatDate } from '../../../../logic/utils/date';
import { PageLoading } from '../../../../ui/components/LoadingState/PageLoading';
import { cn } from '../../../../logic/utils/cn';
import { Card } from '../../../../ui/components/common/Card';
import { AreaChart } from '../../../../ui/components/common/AreaChart';
import { PieChart } from '../../../../ui/components/common/PieChart';
import { ComposedChart, ComposedChartSeries } from '../../../../ui/components/common/ComposedChart';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../../ui/components/common/Table';
import { useNavigate, useLocation } from 'react-router-dom';
import { Tabs } from '../../../../ui/components/common/Tabs';
import { AIChat } from '../../../../ui/components/common/AIChat';
import { appAssets } from '../../../../ui/styles/assets';
import { PrimaryButton, SecondaryButton } from '../../../../ui/components/elements/Button';
import { LabaRugiContent } from '../components/LabaRugiContent';
import { EkuitasContent } from '../components/EkuitasContent';
import { ReportPrintTemplate } from '../components/ReportPrintTemplate';
import { downloadPdf } from '../../../../logic/utils/pdf';
import { EnhancedButton } from '../../../../ui/components/elements/EnhancedButton';

const formatTypeLabel = (typeStr: any) => {
  if (!typeStr) return '-';
  if (typeof typeStr === 'string' && typeStr.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(typeStr);
      return parsed.name || parsed.nama_akun || typeStr;
    } catch {
      return typeStr;
    }
  }
  if (typeof typeStr === 'object') {
    return typeStr.name || typeStr.nama_akun || JSON.stringify(typeStr);
  }
  return typeStr;
};

export const LaporanFinansialPage: React.FC = () => {
  const { state } = useGlobalState();
  const isMobile = state.viewport.isMobile;
  const navigate = useNavigate();
  const location = useLocation();

  // State Filters: Default 30 hari terakhir
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(new Date().setDate(new Date().getDate() - 29)),
    to: new Date()
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<FinansialReportData | null>(null);

  const fetchData = async () => {
    if (!date?.from || !date?.to) return;
    setIsLoading(true);
    
    // Format to YYYY-MM-DD for API
    const startStr = format(date.from, 'yyyy-MM-dd');
    const endStr = format(date.to, 'yyyy-MM-dd');
    
    const reportData = await finansialReportService.getFinansialReport(startStr, endStr);
    setData(reportData);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [date]);

  // Generate Bank Line Series Dynamically
  const bankColors = [
    tokens.semantic.colors.light.ColorPrimary,
    tokens.semantic.colors.light.ColorSecondary,
    '#FF9500', '#5856D6', '#FF2D55', '#AF52DE', '#FFCC00'
  ];
  
  const bankLineSeries: ComposedChartSeries[] = (data?.availableBanks || []).map((b, idx) => ({
    type: 'line',
    dataKey: b,
    name: b,
    color: bankColors[idx % bankColors.length],
    isCurrency: true
  }));

  const hasTrendData = data && data.trendData.some(t => t.totalDebit > 0 || t.totalKredit > 0 || t.totalBalance !== 0);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('keuangan');
  const [isExporting, setIsExporting] = useState<string | null>(null);

  const handleExportPdf = async (reportType: 'labarugi' | 'ekuitas' | 'all') => {
    if (!data) return;
    setIsExporting(reportType);
    
    let reportTitle = '';
    let elementId = '';
    
    if (reportType === 'labarugi') {
      reportTitle = 'Laporan Laba Rugi';
      elementId = 'print-laba-rugi';
    } else if (reportType === 'ekuitas') {
      reportTitle = 'Laporan Ekuitas';
      elementId = 'print-ekuitas';
    } else {
      reportTitle = 'Laporan Finansial Lengkap';
      elementId = 'print-all';
    }

    const filename = `${reportTitle.replace(/\s/g, '_')}_${format(new Date(), 'yyyyMMdd')}.pdf`;
    
    try {
      await downloadPdf(elementId, { filename });
    } catch (error) {
      console.error(error);
    } finally {
      setIsExporting(null);
    }
  };

  const tabs = [
    { id: 'keuangan', label: 'Laporan Keuangan' },
    { id: 'labarugi', label: 'Laba Rugi' },
  ];

  const getSubtitleFormat = () => {
    if (!date?.from || !date?.to) return '';
    return `${format(date.from, "dd MMM yyyy", { locale: localeId })} - ${format(date.to, "dd MMM yyyy", { locale: localeId })}`;
  };

  return (
    <MainShell 
      title="Laporan Finansial"
      subtitle={getSubtitleFormat()}
      onBack={() => navigate('/')}
      actions={
        <div className="flex items-center gap-SpacingSmall">
          <div className={cn("flex flex-col gap-SpacingNano", isMobile ? "items-start" : "items-end")}>
            <div className="flex items-center gap-2 text-TextColorMuted">
              <CalendarIcon size={12} className="opacity-70" />
              <span className="text-[0.625rem] font-bold uppercase tracking-widest text-Slate400">Rentang Waktu</span>
            </div>
            <DateRangePicker 
              date={date} 
              onDateChange={setDate} 
            />
          </div>
        </div>
      }
      hideSearch
      hideDownload
    >
      <div className="flex flex-col gap-SpacingSmall">
        
        {/* Tab Navigation */}
        <div className="bg-white p-SpacingSmall rounded-xl mb-SpacingTiny">
          <Tabs 
            tabs={tabs} 
            activeTab={activeTab} 
            onChange={(id) => setActiveTab(id as string)}
            variant="underline"
          />
        </div>

        {isLoading ? (
          <PageLoading text="Mengolah data finansial waktu nyata..." />
        ) : (
          <>
            {activeTab !== 'keuangan' && data && (
              <div className="w-full flex justify-end px-SpacingTiny mb-SpacingTiny">
                <PrimaryButton
                  icon={<FileDown className="w-4 h-4" />}
                  onClick={() => handleExportPdf('all')}
                  isLoading={isExporting === 'all'}
                >
                  Download Laporan Lengkap
                </PrimaryButton>
              </div>
            )}

            {activeTab === 'keuangan' ? (
              <>
                {/* 0. Top-Level KPI Scorecards */}
                {data && (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-SpacingSmall">
    
    {/* Card 1: Total Saldo Akhir - Border Hijau */}
    <Card className="p-SpacingSmall flex flex-col gap-SpacingTiny justify-center border border-slate-200 shadow-sm border-b-4 border-b-ColorPrimary">
      <span className="text-FontSizeNano font-bold text-TextColorBase uppercase tracking-tight">
        Total Saldo Akhir
      </span>
      <span className="text-FontSizeLg font-extrabold text-TextColorBase">
        {formatCurrency(data.kpiSummary.totalSaldoAkhir)}
      </span>
      <span className="text-[10px] text-TextColorMuted">
        Keseluruhan Kas & Bank
      </span>
    </Card>

    {/* Card 2: Net Cash Flow - Border Biru */}
    <Card className="p-SpacingSmall flex flex-col gap-SpacingTiny justify-center border border-slate-200 shadow-sm border-b-4 border-b-ColorSecondary">
      <span className="text-FontSizeNano font-bold text-TextColorBase uppercase tracking-tight">
        Net Cash Flow
      </span>
      <span className="text-FontSizeLg font-extrabold text-TextColorBase">
        {data.kpiSummary.netCashFlow > 0 ? '+' : ''}{formatCurrency(data.kpiSummary.netCashFlow)}
      </span>
      <span className="text-[10px] text-TextColorMuted">
        Periode terpilih
      </span>
    </Card>

    {/* Card 3: Total Piutang (AR) - Border Sky/Biru Muda */}
    <Card className="p-SpacingSmall flex flex-col gap-SpacingTiny justify-center border border-slate-200 shadow-sm border-b-4 border-b-blue-500">
      <span className="text-FontSizeNano font-bold text-TextColorBase uppercase tracking-tight">
        Total Piutang (AR)
      </span>
      <span className="text-FontSizeLg font-extrabold text-TextColorBase">
        {formatCurrency(data.kpiSummary.totalPiutang)}
      </span>
      <span className="text-[10px] text-TextColorMuted">
        Outstanding Belum Lunas
      </span>
    </Card>

    {/* Card 4: Total Hutang (AP) - Border Violet/Ungu */}
    <Card className="p-SpacingSmall flex flex-col gap-SpacingTiny justify-center border border-slate-200 shadow-sm border-b-4 border-b-red-500">
      <span className="text-FontSizeNano font-bold text-TextColorBase uppercase tracking-tight">
        Total Hutang (AP)
      </span>
      <span className="text-FontSizeLg font-extrabold text-TextColorBase">
        {formatCurrency(data.kpiSummary.totalHutang)}
      </span>
      <span className="text-[10px] text-TextColorMuted">
        Kewajiban Belum Dibayar
      </span>
    </Card>

  </div>
)}

            {/* 1. AreaChart: Total Debit, Total Kredit, Total Balance Harian */}
            <Card className="p-SpacingSmall flex flex-col gap-SpacingSmall">
              <div className="flex flex-col gap-1">
                <h3 className="text-FontSizeSm font-bold text-TextColorBase">Arus Kas Harian (Debit vs Kredit)</h3>
              </div>
              <div className="flex-1 w-full min-h-[15.625rem] flex flex-col bg-transparent border-none shadow-none relative overflow-hidden z-0">
                {hasTrendData ? (
                <AreaChart 
                  data={data.trendData}
                  xAxisDataKey="label"
                  isMobile={isMobile}
                  height="100%"
                  series={[
                    { dataKey: 'totalKredit', name: 'Total Kredit (Out)', strokeColor: '#FF453A', fillColor: '#FF453A', stackId: 'a', isCurrency: true },
                    { dataKey: 'totalDebit', name: 'Total Debit (In)', strokeColor: '#30D158', fillColor: '#30D158', stackId: 'a', isCurrency: true },
                    { dataKey: 'totalBalance', name: 'Net Balance', strokeColor: '#0A84FF', fillColor: 'transparent', isCurrency: true }
                  ]}
                />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center opacity-30">
                  <p className="text-FontSizeBase font-bold text-TextColorBase">Data Arus Kas Tidak Ditemukan</p>
                  <p className="text-FontSizeNano">Silakan sesuaikan filter tanggal.</p>
                </div>
              )}
              </div>
            </Card>

            {data && (
              <div className="flex flex-col gap-SpacingSmall w-full">
                
                {/* 2. Multi Line Chart: Balance Harian per Data Kas & Bank */}
                <Card className="p-SpacingSmall flex flex-col gap-SpacingSmall">
                  <div className="flex flex-col gap-1">
                    <h3 className="text-FontSizeSm font-bold text-TextColorBase">Net Arus Kas Harian per Akun Bank & Kas</h3>
                  </div>
                  <div className="w-full h-[18.75rem] pt-SpacingBase">
                    {data.bankBalanceTrend.length > 0 && data.availableBanks.length > 0 ? (
                      <ComposedChart 
                        data={data.bankBalanceTrend}
                        xAxisDataKey="label"
                        isMobile={isMobile}
                        height="100%"
                        series={bankLineSeries}
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-TextColorMuted text-FontSizeNano opacity-50 italic">
                        Belum ada data transaksi bank/kas
                      </div>
                    )}
                  </div>
                </Card>

                {/* 3. Stacked Bar Chart berlawanan: Hutang vs Piutang Harian */}
                <Card className="p-SpacingSmall flex flex-col gap-SpacingSmall">
                  <div className="flex flex-col gap-1">
                    <h3 className="text-FontSizeSm font-bold text-TextColorBase flex items-center gap-2">
                      Kemunculan Hutang vs Piutang Baru Harian
                    </h3>
                  </div>
                  <div className="w-full h-[18.75rem] pt-SpacingBase">
                    {data.hutangPiutangTrend.some(t => t.hutang < 0 || t.piutang > 0) ? (
                      <ComposedChart 
                        data={data.hutangPiutangTrend}
                        xAxisDataKey="label"
                        isMobile={isMobile}
                        height="100%"
                        stackOffset="sign"
                        series={[
                          {
                            type: 'bar',
                            dataKey: 'piutang',
                            name: 'Piutang Baru (+)',
                            color: '#2563EB', // Blue-600
                            stackId: 'a',
                            isCurrency: true
                          },
                          {
                            type: 'bar',
                            dataKey: 'hutang',
                            name: 'Hutang Baru (-)',
                            color: '#DC2626', // Red-600
                            stackId: 'a',
                            isCurrency: true
                          }
                        ]}
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-TextColorMuted text-FontSizeNano opacity-50 italic">
                        Belum ada data Hutang/Piutang pada periode ini
                      </div>
                    )}
                  </div>
                </Card>

                {/* 4. AR & AP Aging Chart
                <Card className="p-SpacingSmall flex flex-col gap-SpacingSmall">
                  <div className="flex flex-col gap-1">
                    <h3 className="text-FontSizeSm font-bold text-TextColorBase flex items-center gap-2">
                      AR & AP Aging Report (Umur Piutang & Hutang)
                    </h3>
                  </div>
                  <div className="w-full h-[18.75rem] pt-SpacingBase">
                    {data.agingData.some(t => t.hutang < 0 || t.piutang > 0) ? (
                      <ComposedChart 
                        data={data.agingData}
                        xAxisDataKey="label"
                        isMobile={isMobile}
                        height="100%"
                        series={[
                          {
                            type: 'bar',
                            dataKey: 'piutang',
                            name: 'Piutang (AR)',
                            color: '#3B82F6', // Blue-500
                            stackId: 'a',
                            isCurrency: true
                          },
                          {
                            type: 'bar',
                            dataKey: 'hutang',
                            name: 'Hutang (AP)',
                            color: '#EF4444', // Red-500
                            stackId: 'a',
                            isCurrency: true
                          }
                        ]}
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-TextColorMuted text-FontSizeNano opacity-50 italic">
                        Belum ada data Hutang/Piutang tersisa
                      </div>
                    )}
                  </div>
                </Card> */}

                {/* 5. Pie/Bar Charts Breakdown: Distribusi Pemasukan & Pengeluaran */}
                <div className={cn(
                  "grid gap-SpacingSmall",
                  isMobile ? "grid-cols-1" : "grid-cols-2"
                )}>
                  
                  {/* Income Breakdown */}
                  <Card className="p-SpacingSmall flex flex-col gap-SpacingSmall">
                    <div className="w-full text-left">
                      <h3 className="text-FontSizeSm font-bold text-TextColorBase flex items-center gap-2">
                        Distribusi Pemasukan
                      </h3>
                    </div>
                    <div className={cn("w-full pt-SpacingSmall flex-1 flex items-center")}>
                      {data.incomeBreakdown.some(i => i.nominal > 0) ? (
                        <PieChart 
                          data={data.incomeBreakdown.map(i => ({ 
                            label: i.label, 
                            value: i.nominal 
                          }))}
                          isMobile={isMobile}
                          height="15.625rem"
                          valueFormatter={(v) => formatCurrency(v)}
                        />
                      ) : (
                        <div className="h-[15.625rem] w-full flex items-center justify-center text-TextColorMuted text-FontSizeNano opacity-50 italic">
                          Data pemasukan tidak tersedia
                        </div>
                      )}
                    </div>
                  </Card>

                  {/* Expense Breakdown */}
                  <Card className="p-SpacingSmall flex flex-col gap-SpacingSmall">
                    <div className="w-full text-left">
                      <h3 className="text-FontSizeSm font-bold text-TextColorBase flex items-center gap-2">
                        Distribusi Pengeluaran
                      </h3>
                    </div>
                    <div className={cn("w-full pt-SpacingSmall flex-1 flex items-center")}>
                      {data.expenseBreakdown.some(e => e.nominal > 0) ? (
                        <PieChart 
                          data={data.expenseBreakdown.map(e => ({ 
                            label: e.label, 
                            value: e.nominal
                          }))}
                          isMobile={isMobile}
                          height="15.625rem"
                          valueFormatter={(v) => formatCurrency(v)}
                        />
                      ) : (
                        <div className="h-[15.625rem] w-full flex items-center justify-center text-TextColorMuted text-FontSizeNano opacity-50 italic">
                          Data pengeluaran tidak tersedia
                        </div>
                      )}
                    </div>
                  </Card>

                </div>
              </div>
            )}
            
            {/* 6. Tabel Mutasi/Ledger Konsolidasi */}
{data && (
  <div className="flex flex-col gap-SpacingSmall mt-SpacingSmall">
    <div className="flex flex-col gap-1 px-SpacingTiny">
      <h3 className="text-FontSizeSm font-bold text-TextColorBase">Buku Besar / Ledger Konsolidasi</h3>
      <p className="text-FontSizeNano text-TextColorMuted">
        Riwayat transaksi finansial berdasarkan periode yang di-filter.
      </p>
    </div>
    
    <div className="w-full relative mt-SpacingSmall bg-white rounded-xl overflow-hidden shadow-sm border border-slate-100">
      <Table id="ledger-table" noBorder={true}>
        <TableHeader>
          <TableRow isHeader>
            <TableHead className="!text-FontSizeXs text-left">Tanggal</TableHead>
            <TableHead className="!text-FontSizeXs text-left">Jenis</TableHead>
            <TableHead className="!text-FontSizeXs text-left w-32">Kategori</TableHead>
            <TableHead className="!text-FontSizeXs text-left">Kas & Bank</TableHead>
            <TableHead className="!text-FontSizeXs text-right">Nominal</TableHead>
            <TableHead className="!text-FontSizeXs text-left">Keterangan</TableHead>
            <TableHead className="!text-FontSizeXs text-left">Penanggung Jawab</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.mutasiData.length > 0 ? (
            data.mutasiData.map((row) => {
              const isPemasukan = row.jenis === 'Pemasukan';
              
              const urlPath = `/finansial/${row.jenis.toLowerCase()}/detail/${row.id}`;
              const referrerTag = encodeURIComponent(location.pathname + location.search);

              return (
                <TableRow 
                  key={`${row.jenis}-${row.id}`} 
                  className="cursor-pointer group"
                  onClick={() => navigate(`${urlPath}?referrer=${referrerTag}`)}
                >
                  <TableCell className="align-top !text-FontSizeXs text-left">
                    <span className="font-medium text-TextColorBase">{formatDateTimeWithPipe(row.transaction_date)}</span>
                  </TableCell>
                  
                  {/* Kolom Jenis: Menggunakan text-!red-500 (huruf kecil) */}
                  <TableCell className="align-top !text-FontSizeXs text-left">
                    <span className={cn("font-bold", isPemasukan ? "text-ColorPrimary" : "text-FeedbackColorError")}>
                      {row.jenis}
                    </span>
                  </TableCell>
                  
                  <TableCell className="align-top !text-FontSizeXs text-left w-32">
                    <span className="font-medium text-TextColorBase truncate line-clamp-1 block">{formatTypeLabel(row.type)}</span>
                  </TableCell>
                  
                  <TableCell className="align-top !text-FontSizeXs text-left">
                    <span className="text-TextColorMuted">{row.bank_name}</span>
                  </TableCell>
                  
                  {/* Kolom Nominal: Menggunakan cn() dan text-!red-500 / text-red-600 (huruf kecil semua) */}
                  <TableCell className="align-top text-right font-extrabold whitespace-nowrap !text-FontSizeXs">
                    <span className={cn(isPemasukan ? "text-ColorPrimary" : "text-FeedbackColorError")}>
                      {isPemasukan ? '+' : '-'}{formatCurrency(row.nominal)}
                    </span>
                  </TableCell>
                  
                  <TableCell className="align-top text-TextColorMuted max-w-[200px] truncate !text-FontSizeXs text-left">
                    {row.description}
                  </TableCell>
                  
                  <TableCell className="align-top !text-FontSizeXs text-left">
                    <div className="flex flex-col gap-0.5 bg-Emerald50 p-1.5 rounded-md border-l-4 border-Emerald500 text-FontSizeNano">
                      <span><span className="text-TextColorBase">Dibuat oleh</span> <span className="font-bold text-TextColorBase">{row.created_by_name}</span></span>
                      <span><span className="text-TextColorBase">Diperbarui oleh</span> <span className="font-bold text-TextColorBase">{row.updated_by_name}</span></span>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-SpacingBase text-TextColorMuted italic text-FontSizeSm">
                Tidak ada riwayat mutasi pada periode ini
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  </div>
)}
          </>
        ) : (
          <>
            {/* Laba Rugi Tab Content */}
            {data && data.labaRugi && (
              <Card className="p-SpacingSmall flex flex-col gap-SpacingSmall">
                <div className={cn("flex gap-SpacingSmall", isMobile ? "flex-col items-start" : "justify-between items-start")}>
                  <div className="flex flex-col gap-1 w-full">
                    <h3 className="text-FontSizeSm font-bold text-TextColorBase">Laporan Laba Rugi (Profit & Loss)</h3>
                    <p className="text-FontSizeNano text-TextColorMuted">
                      Perhitungan keuntungan atau kerugian operasional selama periode terpilih.
                    </p>
                  </div>
                  <div className={cn(isMobile && "w-full")}>
                    <SecondaryButton
                      className={cn(isMobile && "w-full justify-center")}
                      onClick={() => handleExportPdf('labarugi')}
                      isLoading={isExporting === 'labarugi'}
                      icon={<FileDown className="w-3.5 h-3.5" />}>
                      Download Laporan Laba Rugi
                    </SecondaryButton>
                  </div>
                </div>
                
                <LabaRugiContent data={data.labaRugi} />
              </Card>
            )}

            {data && data.ekuitas && (
              <Card className="p-SpacingSmall flex flex-col gap-SpacingSmall">
                <div className={cn("flex gap-SpacingSmall", isMobile ? "flex-col items-start" : "justify-between items-start")}>
                  <div className="flex flex-col gap-1 w-full">
                    <h3 className="text-FontSizeSm font-bold text-TextColorBase">Laporan Ekuitas (Posisi Keuangan)</h3>
                    <p className="text-FontSizeNano text-TextColorMuted">
                      Ringkasan posisi aset lancar berserta kewajiban untuk mengetahui nilai kekayaan bersih saat ini.
                    </p>
                  </div>
                  <div className={cn(isMobile && "w-full")}>
                    <SecondaryButton
                      className={cn(isMobile && "w-full justify-center")}
                      onClick={() => handleExportPdf('ekuitas')}
                      isLoading={isExporting === 'ekuitas'}
                      icon={<FileDown className="w-3.5 h-3.5" />}>
                      Download Laporan Ekuitas
                    </SecondaryButton>
                  </div>
                </div>
                
                <EkuitasContent data={data.ekuitas} />
              </Card>
            )}
          </>
        )}
          </>
        )}
      </div>

      {/* Hidden Print Container for High-Fidelity PDF Generation */}
      <div 
        id="print-wrapper" 
        className="fixed top-[-9999px] left-[-9999px] pointer-events-none opacity-0 z-[-1]"
        aria-hidden="true"
      >
        {data && (
          <>
            <ReportPrintTemplate 
              id="print-laba-rugi"
              title="Laporan Laba Rugi"
              type="labarugi"
              dateRange={{ from: date?.from, to: date?.to }}
              data={data.labaRugi}
            />
            <ReportPrintTemplate 
              id="print-ekuitas"
              title="Laporan Ekuitas"
              type="ekuitas"
              dateRange={{ from: date?.from, to: date?.to }}
              data={data.ekuitas}
            />

            {/* Template Gabungan */}
            <div id="print-all" className="flex flex-col bg-white">
              <ReportPrintTemplate 
                id="all-lr"
                title="Laporan Laba Rugi"
                type="labarugi"
                dateRange={{ from: date?.from, to: date?.to }}
                data={data.labaRugi}
              />
              <div 
                className="pdf-page-break" 
                style={{ 
                  height: '1px', 
                  width: '100%', 
                  pageBreakAfter: 'always',
                  breakAfter: 'page' 
                }} 
              />
              <ReportPrintTemplate 
                id="all-ek"
                title="Laporan Ekuitas"
                type="ekuitas"
                dateRange={{ from: date?.from, to: date?.to }}
                data={data.ekuitas}
              />
            </div>
          </>
        )}
      </div>

            {/* Floating AI Button - Revised Animation */}
      <button 
        onClick={() => setIsChatOpen(true)}
        className="fixed bottom-6 right-6 w-16 h-16 z-[100] group focus:outline-none"
        style={{
          // Menghapus background, menambah filter drop shadow agar menonjol dari background halaman
          filter: 'drop-shadow(0px 10px 15px rgba(0, 70, 145, 0.3))',
          // Animasi default: Bernapas naik turun pelan (3 detik siklus)
          animation: 'float-idle 3s ease-in-out infinite',
          cursor: 'pointer'
        }}
        // Tambahkan style tag di dalam return atau gunakan global CSS. 
        // Di sini saya gunakan inline style untuk animasi keyframes agar mudah copy-paste.
      >
        <style>{`
          @keyframes float-idle {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
          }
          
          .group:hover .robot-img {
            /* Animasi saat hover: Naik tinggi, sedikit scale, dan senyum/gerak */
            animation: hover-pop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          }

          @keyframes hover-pop {
            0% { transform: translateY(0) scale(1) rotate(0deg); }
            40% { transform: translateY(-20px) scale(1.1) rotate(-5deg); } /* Naik & miring kiri */
            60% { transform: translateY(-25px) scale(1.1) rotate(5deg); }  /* Miring kanan (kibasan) */
            80% { transform: translateY(-20px) scale(1.1) rotate(-2deg); }
            100% { transform: translateY(-20px) scale(1.1) rotate(0deg); } /* Posisi akhir hover */
          }
        `}</style>
        
        <img 
          src={appAssets.MaindiAI} 
          alt="Maindi AI" 
          className="robot-img w-full h-full object-contain transition-transform duration-300"
        />
      </button>

      {/* Chat Modal */}
      {isChatOpen && (
        <div className="fixed inset-0 bg-black/50 z-[110] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl h-[80vh] rounded-2xl flex flex-col shadow-2xl relative">
            <button 
              onClick={() => setIsChatOpen(false)}
              className="absolute top-4 right-4 p-2 bg-rose-100 text-rose-600 rounded-full hover:bg-rose-200 z-[120]"
            >
              <X size={20} />
            </button>
            <div className="flex-1 overflow-hidden p-0 m-0">
                {date?.from && date?.to && (
                  <AIChat 
                    startDate={format(date.from, 'yyyy-MM-dd')}
                    endDate={format(date.to, 'yyyy-MM-dd')}
                  />
                )}
            </div>
          </div>
        </div>
      )}

    </MainShell>
  );
};

