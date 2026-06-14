import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar as CalendarIcon, ChevronDown, Rocket, TrendingUp, Users, Wallet, Package, List } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { format, addDays } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { MainShell } from '../../../../ui/components/common/shells/MainShell';
import { useGlobalState } from '../../../../logic/context/GlobalContext';
import { 
  reportService, 
  TrendData, 
  TopProductData, 
  CustomerTypeData, 
  PaymentTypeData, 
  ProductTypeData,
  PaymentSourceData,
  ShippingTypeData,
  KlaimReturTrendData
} from '../../../../logic/services/reportService';
import { DateRangePicker } from '../../../../ui/components/elements/DateRangePicker';
import { tokens } from '../../../../ui/styles/tokens';
import { formatCurrency } from '../../../../logic/utils/data';
import { PageLoading } from '../../../../ui/components/LoadingState/PageLoading';
import { cn } from '../../../../logic/utils/cn';
import { Card } from '../../../../ui/components/common/Card';
import { AreaChart } from '../../../../ui/components/common/AreaChart';
import { BarChart } from '../../../../ui/components/common/BarChart';
import { DonutChart } from '../../../../ui/components/common/DonutChart';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../../../../ui/components/common/Table';
import { ITs_Penjualan } from '../../../../logic/types/ITs_Penjualan';
import { Landmark } from 'lucide-react';
import { ComposedChart } from '../../../../ui/components/common/ComposedChart';

const parseSafeDate = (dateStr?: string | null): Date => {
  if (!dateStr) return new Date(0);
  const normalized = dateStr.includes('T') ? dateStr : dateStr.replace(' ', 'T');
  return new Date(normalized);
};

export const LaporanPenjualanPage: React.FC = () => {
  const { state } = useGlobalState();
  const isMobile = state.viewport.isMobile;
  const navigate = useNavigate();

  // State Filters: Default 30 hari terakhir
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(new Date().setDate(new Date().getDate() - 29)),
    to: new Date()
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [topProducts, setTopProducts] = useState<TopProductData[]>([]);
  const [customerTypes, setCustomerTypes] = useState<CustomerTypeData[]>([]);
  const [paymentTypes, setPaymentTypes] = useState<PaymentTypeData[]>([]);
  const [productTypes, setProductTypes] = useState<ProductTypeData[]>([]);
  const [paymentSources, setPaymentSources] = useState<PaymentSourceData[]>([]);
  const [shippingTypes, setShippingTypes] = useState<ShippingTypeData[]>([]);
  const [klaimReturTrend, setKlaimReturTrend] = useState<KlaimReturTrendData[]>([]);
  const [sales, setSales] = useState<(ITs_Penjualan & { customer_name: string })[]>([]);

  const fetchData = async () => {
    if (!date?.from || !date?.to) return;
    setIsLoading(true);
    
    // Format to YYYY-MM-DD for API
    const startStr = format(date.from, 'yyyy-MM-dd');
    const endStr = format(date.to, 'yyyy-MM-dd');
    
    const data = await reportService.getSalesReport(startStr, endStr);
    if (data) {
      setTrendData(data.dailyTrend);
      setTopProducts(data.topByRevenue);
      setCustomerTypes(data.customerTypeStats);
      setPaymentTypes(data.paymentTypeStats);
      setProductTypes(data.productTypeStats);
      setPaymentSources(data.paymentSourceStats);
      setShippingTypes(data.shippingTypeStats);
      setKlaimReturTrend(data.klaimReturTrend);
      setSales(data.sales || []);
    }
    setIsLoading(false);
  };

  const getSubtitleFormat = () => {
    if (!date?.from || !date?.to) return '';
    return `${format(date.from, "dd MMM yyyy", { locale: localeId })} - ${format(date.to, "dd MMM yyyy", { locale: localeId })}`;
  };

  useEffect(() => {
    fetchData();
  }, [date]);

  return (
    <MainShell 
      title="Laporan Penjualan"
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
        {isLoading ? (
          <PageLoading text="Mengolah data laporan penjualan..." />
        ) : (
          <>
            <Card className="p-SpacingSmall flex flex-col gap-SpacingSmall">
          <div className="flex flex-col gap-1">
            <h3 className="text-FontSizeSm font-bold text-TextColorBase">Trend Penjualan</h3>
          </div>
          <div className="flex-1 w-full min-h-[15.625rem] flex flex-col bg-transparent border-none shadow-none relative overflow-hidden z-0">
          {trendData.length > 0 ? (
            <AreaChart 
              data={trendData}
              xAxisDataKey="label"
              isMobile={isMobile}
              height="100%"
              series={[
                { dataKey: 'totalPiutang', name: 'Total Piutang', strokeColor: '#FF453A', fillColor: '#FF453A', stackId: 'a', isCurrency: true },
                { dataKey: 'totalPayment', name: 'Total Pembayaran', strokeColor: '#30D158', fillColor: '#30D158', stackId: 'a', isCurrency: true },
                { dataKey: 'totalSales', name: 'Total Penjualan', strokeColor: '#0A84FF', fillColor: '#0A84FF', stackId: 'a', isCurrency: true }
              ]}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center opacity-30">
              <p className="text-FontSizeBase font-bold text-TextColorBase">Data Trend Tidak Ditemukan</p>
              <p className="text-FontSizeNano">Silakan sesuaikan filter tanggal.</p>
            </div>
          )}
        </div>
        </Card>

        {/* Additional Stats Grid */}
        <div className="flex flex-col gap-SpacingSmall w-full">
            
                        {/* Row 1: Bar Charts with Dynamic 50/50 Split */}
            <div className={cn(
              "grid gap-SpacingSmall w-full",
              // PERUBAHAN: Gunakan grid 2 kolom agar otomatis terbagi sama besar (50% - 50%)
              // Gunakan md: atau lg: untuk breakpoint non-mobile
              "grid-cols-1 md:grid-cols-2" 
            )}>
              
              {/* 1. Horizontal Bar Chart - Produk Terjual Terbanyak (Nominal) */}
              <Card className={cn(
                "p-SpacingSmall flex flex-col gap-SpacingSmall",
                // PERUBAHAN: Cukup 1 kolom penuh, karena parent sudah membagi 2
                "col-span-1" 
              )}>
                <div className="flex flex-col gap-1">
                  <h3 className="text-FontSizeSm font-bold text-TextColorBase">Penjualan Produk Terbanyak</h3>
                </div>
                
                <div className="w-full">
                  {topProducts.length > 0 ? (
                    <BarChart 
                      data={topProducts.slice(0, 5)}
                      dataKey="revenue"
                      labelKey="name"
                      layout="vertical"
                      height="18.75rem"
                    />
                  ) : (
                    <div className="h-[18.75rem] flex items-center justify-center text-TextColorMuted text-FontSizeNano opacity-50">Belum ada data produk</div>
                  )}
                </div>
              </Card>

              {/* 2. Bar Chart Fully Rounded - Nominal Penjualan berdasarkan Tipe Produk */}
              <Card className={cn(
                "p-SpacingSmall flex flex-col gap-SpacingSmall",
                // PERUBAHAN: Cukup 1 kolom penuh
                "col-span-1" 
              )}>
                <div className="flex flex-col gap-1">
                  <h3 className="text-FontSizeSm font-bold text-TextColorBase flex items-center gap-2">
                    Penjualan Tipe Produk
                  </h3>
                </div>
                <div className="w-full pt-SpacingBase">
                  {productTypes.some(p => p.nominal > 0) ? (
                    <BarChart 
                      data={productTypes}
                      dataKey="nominal"
                      labelKey="type"
                      layout="horizontal"
                      height="15.625rem"
                      radius={[20, 20, 20, 20]}
                    />
                  ) : (
                    <div className="h-[15.625rem] flex items-center justify-center text-TextColorMuted text-FontSizeNano opacity-50">Belum ada data penjualan produk</div>
                  )}
                </div>
              </Card>
            </div>

            {/* 2 & 3. Doughnut Charts - Customer, Payment Type, & Payment Source */}
            <div className={cn(
              "grid gap-SpacingSmall",
              isMobile ? "grid-cols-1" : "grid-cols-3"
            )}>
              
              {/* Customer Type Doughnut */}
              <Card className="p-SpacingSmall flex flex-col gap-SpacingSmall justify-center">
                <div className="w-full text-left">
                  <h3 className="text-FontSizeSm font-bold text-TextColorBase flex items-center gap-2">
                    Jenis Customer
                  </h3>
                </div>
                <div className={cn("w-full pt-SpacingSmall")}>
                  <DonutChart 
                    data={customerTypes.map(c => ({ label: c.type, count: c.count, percentage: c.percentage }))}
                    isMobile={isMobile}
                    height="12rem"
                    centerLabel="Total"
                  />
                </div>
              </Card>

              {/* Payment Type Doughnut */}
              <Card className="p-SpacingSmall flex flex-col gap-SpacingSmall justify-center">
                <div className="w-full text-left">
                  <h3 className="text-FontSizeSm font-bold text-TextColorBase flex items-center gap-2">
                    Jenis Pembayaran
                  </h3>
                </div>
                <div className={cn("w-full pt-SpacingSmall")}>
                  <DonutChart 
                    data={paymentTypes.map(p => ({ label: p.type, count: p.count, percentage: p.percentage }))}
                    isMobile={isMobile}
                    height="12rem"
                    centerLabel="Invoices"
                  />
                </div>
              </Card>

              {/* Payment Source Doughnut */}
              <Card className="p-SpacingSmall flex flex-col gap-SpacingSmall justify-center">
                <div className="w-full text-left">
                  <h3 className="text-FontSizeSm font-bold text-TextColorBase flex items-center gap-2">
                    Sumber Transaksi
                  </h3>
                </div>
                <div className={cn("w-full pt-SpacingSmall")}>
                  <DonutChart 
                    data={paymentSources.map(s => ({ label: s.label, count: s.count, percentage: s.percentage }))}
                    isMobile={isMobile}
                    height="12rem"
                    centerLabel="Transaksi"
                  />
                </div>
              </Card>

            </div>
            
            {/* Row 3: Shipping Stats & Klaim Retur Combined Chart */}
            <div className={cn(
              "grid gap-SpacingSmall",
              isMobile ? "grid-cols-1" : "grid-cols-2"
            )}>
              {/* Shipping Type Pie/Donut Chart */}
              <Card className="p-SpacingSmall flex flex-col gap-SpacingSmall">
                <div className="w-full text-left">
                  <h3 className="text-FontSizeSm font-bold text-TextColorBase flex items-center gap-2">
                    Jenis Pengiriman (Loco/Franco)
                  </h3>
                </div>
                <div className={cn("w-full pt-SpacingSmall flex-1 flex items-center")}>
                  {shippingTypes.some(s => s.count > 0) ? (
                    <DonutChart 
                      data={shippingTypes.map(s => ({ label: s.type, count: s.count, percentage: s.percentage }))}
                      isMobile={isMobile}
                      height="15.625rem"
                      centerLabel="Total"
                      colors={[tokens.semantic.colors.light.ColorPrimary, tokens.semantic.colors.light.ColorSecondary]}
                    />
                  ) : (
                    <div className="h-[15.625rem] w-full flex items-center justify-center text-TextColorMuted text-FontSizeNano opacity-50 italic">
                      Data pengiriman tidak tersedia
                    </div>
                  )}
                </div>
              </Card>

              {/* Klaim Retur Combined Line & Bar Chart */}
              <Card className="p-SpacingSmall flex flex-col gap-SpacingSmall">
                <div className="w-full text-left">
                  <h3 className="text-FontSizeSm font-bold text-TextColorBase flex items-center gap-2">
                    Trend Klaim Retur
                  </h3>
                </div>
                <div className="w-full h-[15.625rem] pt-SpacingBase">
                  {klaimReturTrend.some(k => k.totalCount > 0 || k.totalRefund > 0) ? (
                    <ComposedChart 
                      data={klaimReturTrend}
                      xAxisDataKey="label"
                      isMobile={isMobile}
                      height="100%"
                      series={[
                        {
                          type: 'bar',
                          dataKey: 'totalCount',
                          name: 'Total Klaim',
                          color: tokens.semantic.colors.light.ColorSecondary,
                          yAxisId: 'right'
                        },
                        {
                          type: 'line',
                          dataKey: 'totalRefund',
                          name: 'Nominal Refund',
                          color: tokens.semantic.colors.light.ColorPrimary,
                          yAxisId: 'left',
                          isCurrency: true
                        }
                      ]}
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-TextColorMuted text-FontSizeNano opacity-50 italic">
                      Belum ada data klaim retur periode ini
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Approved Sales Table */}
            {/* PERUBAHAN: Approved Sales Table TANPA Card */}
            
            {/* Judul Section (Manual Styling) */}
            <div className="flex flex-col gap-1">
              <h3 className="text-FontSizeSm font-bold text-TextColorBase flex items-center gap-2">
                Data Penjualan
              </h3>
              <div className="h-px bg-BorderBase w-full"></div> {/* Optional: Garis pemisah */}
            </div>
              
            {/* Container Tabel (Tanpa Card) */}
            <div className="w-full overflow-x-auto">
              {/* Pastikan Table menyesuaikan lebar kontainer */}
              <Table id="approved-sales-table" className="w-full">
                <TableHeader>
                  <TableRow isHeader>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>No Invoice</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Sales</TableHead>
                    <TableHead>Approver</TableHead>
                    <TableHead>Nominal Penjualan</TableHead>
                    <TableHead>Nominal Bayar</TableHead>
                    <TableHead>Nominal Piutang</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.length > 0 ? (
                    sales.map((row) => (
                      <TableRow 
                        key={row.id} 
                        className="cursor-pointer"
                        onClick={() => navigate(`/penjualan/penjualan/detail/${row.id}?referrer=/laporan/penjualan`)}
                      >
                        <TableCell className="whitespace-nowrap">
                          {row.datetime ? format(parseSafeDate(row.datetime), 'dd/MM/yyyy HH:mm') : '-'}
                        </TableCell>
                        <TableCell className="!text-FontSizeXs !text-center font-bold text-ColorPrimary">{row.invoice_number}</TableCell>
                        <TableCell className="!text-FontSizeXs !text-center font-medium">{row.customer_name || '-'}</TableCell>
                        <TableCell>{row.sales_name || '-'}</TableCell>
                        <TableCell>{row.approver_name || '-'}</TableCell>
                        <TableCell className="!text-FontSizeXs !text-center text-blue-600 font-bold">{formatCurrency(row.grand_total)}</TableCell>
                        <TableCell className="!text-FontSizeXs !text-center text-green-600 font-bold">{formatCurrency(row.deposit)}</TableCell>
                        <TableCell className="!text-FontSizeXs !text-center text-red-600 font-bold">{formatCurrency(row.outstanding)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="py-20 text-TextColorMuted opacity-50 italic">
                        Belum ada data penjualan pada periode ini
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
          </>
        )}

      </div>
    </MainShell>
  );
};
