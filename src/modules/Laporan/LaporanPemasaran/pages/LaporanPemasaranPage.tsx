import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { MainShell } from '../../../../ui/components/common/shells/MainShell';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../../../../ui/components/common/Table';
import { DateRangePicker } from '../../../../ui/components/elements/DateRangePicker';
import { FixedMultiDropdown } from '../../../../ui/components/elements/Dropdown';
import { Card } from '../../../../ui/components/common/Card';
import { PieChart } from '../../../../ui/components/common/PieChart';
import { LaporanMap } from '../components/LaporanMap';
import { pemasaranService, IPemasaranWithCustomer } from '../../../../logic/services/pemasaranService';
import { DateRange } from 'react-day-picker';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { formatDateShort } from '../../../../logic/utils/date';
import { MapPin, Users, PieChart as PieChartIcon, Table as TableIcon, Calendar as CalendarIcon, ChevronLeft } from 'lucide-react';
import { PageLoading } from '../../../../ui/components/LoadingState/PageLoading';
import { cn } from '../../../../logic/utils/cn';
import { tokens } from '../../../../ui/styles/tokens';
import { useGlobalState } from '../../../../logic/context/GlobalContext';
import { useNavigate } from 'react-router-dom';

/**
 * LAPORAN PEMASARAN PAGE
 * Halaman modul Laporan Pemasaran dengan visualisasi peta, chart, dan tabel data harian.
 */
export const LaporanPemasaranPage: React.FC = () => {
  const { state } = useGlobalState();
  const { isMobile } = state.viewport;
  const navigate = useNavigate();

  // Filters State
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date()
  });
  const [selectedSales, setSelectedSales] = useState<string[]>(['all']);
  const [salesOptions, setSalesOptions] = useState<{ label: string; value: string }[]>([]);

  // Data State
  const [reportData, setReportData] = useState<IPemasaranWithCustomer[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 1. Fetch Unique Usernames for Filter
  useEffect(() => {
    const fetchUsernames = async () => {
      const usernames = await pemasaranService.getUniqueSalesUsernames();
      const options = [
        { label: 'Pilih Semua', value: 'all' },
        ...usernames.map(u => ({ label: u, value: u }))
      ];
      setSalesOptions(options);
    };
    fetchUsernames();
  }, []);

  // 2. Fetch Report Data based on filters
  const fetchReportData = useCallback(async () => {
    if (!dateRange?.from || !dateRange?.to) return;
    
    setIsLoading(true);
    const startDate = startOfDay(dateRange.from).toISOString();
    const endDate = endOfDay(dateRange.to).toISOString();
    
    const data = await pemasaranService.getReportData(
      selectedSales,
      startDate,
      endDate
    );
    
    setReportData(data);
    setIsLoading(false);
  }, [dateRange, selectedSales]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  // Handle MultiDropdown Change with "Pilih Semua" logic
  const handleSalesChange = (values: string[]) => {
    if (values.includes('all') && !selectedSales.includes('all')) {
      setSelectedSales(['all']);
    } else if (values.length > 1 && values.includes('all')) {
      setSelectedSales(values.filter(v => v !== 'all'));
    } else if (values.length === 0) {
      setSelectedSales(['all']);
    } else {
      setSelectedSales(values);
    }
  };

  // Process data for Chart
  const pieChartData = useMemo(() => {
    const selling = reportData.filter(d => d.activity_type === 'selling').length;
    const relation = reportData.filter(d => d.activity_type === 'client relation').length;
    const offering = reportData.filter(d => d.activity_type === 'offering').length;
    
    return [
      { label: 'Selling', value: selling },
      { label: 'Client Relation', value: relation },
      { label: 'Offering', value: offering }
    ].filter(d => d.value > 0);
  }, [reportData]);

  const activityColors = [
    '#FF2D55', // Selling (Red)
    '#3B82F6', // Client Relation (Blue-500)
    '#30D158'  // Offering (Green)
  ];

  const getSubtitleFormat = () => {
    if (!dateRange?.from || !dateRange?.to) return '';
    return `${format(dateRange.from, "dd MMM yyyy", { locale: localeId })} - ${format(dateRange.to, "dd MMM yyyy", { locale: localeId })}`;
  };

  return (
    <MainShell
      title="Laporan Pemasaran"
      subtitle={getSubtitleFormat()}
      onBack={() => navigate('/')}
      actions={
        <div className="flex items-center gap-SpacingSmall">
          <div className={cn("flex gap-SpacingSmall", isMobile ? "flex-col w-full" : "flex-row items-end")}>
            {/* Nama Sales Filter */}
            <div className="flex flex-col gap-SpacingNano">
              <div className="flex items-center gap-2 text-TextColorMuted">
                <span className="text-[0.625rem] font-bold uppercase tracking-widest text-Slate400">Sales</span>
              </div>
              <FixedMultiDropdown
                options={salesOptions}
                value={selectedSales}
                onChange={handleSalesChange}
                placeholder="Filter Sales..."
                id="sales-filter-dropdown"
                className={isMobile ? "w-full" : "w-48"}
              />
            </div>

            {/* Date Range Filter */}
            <div className="flex flex-col gap-SpacingNano">
              <div className="flex items-center gap-2 text-TextColorMuted">
                <span className="text-[0.625rem] font-bold uppercase tracking-widest text-Slate400">Rentang Waktu</span>
              </div>
              <DateRangePicker 
                date={dateRange} 
                onDateChange={setDateRange} 
              />
            </div>
          </div>
        </div>
      }
      id="laporan-pemasaran-page"
      hideDownload={true}
      hideSearch={true}
    >
      <div className="w-full space-y-6">
        {isLoading ? (
          <PageLoading text="Mengolah data laporan pemasaran..." />
        ) : (
          <>
        {/* Visualizations Grid */}
        <div className={cn("grid gap-6", isMobile ? "grid-cols-1" : "grid-cols-3")}>
          {/* Map Column */}
          <Card 
            id="laporan-map-card"
            className="col-span-1 lg:col-span-2 p-0 overflow-hidden border-none shadow-ElevationMid"
          >
            <div className="p-4 border-b border-ColorSidebarBorder/opacity-OpacitySubtle flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-TextColorBase">Sebaran Titik Kunjungan</h3>
              </div>
              
              {/* Horizontal Legend */}
              <div className="flex items-center gap-SpacingSmall">
                <div className="flex items-center gap-1.5 group">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FF2D55] shadow-sm group-hover:scale-110 transition-transform" />
                  <span className="text-FontSizeNano font-bold text-TextColorMuted uppercase tracking-widest">Selling</span>
                </div>
                <div className="flex items-center gap-1.5 group">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#3B82F6] shadow-sm group-hover:scale-110 transition-transform" />
                  <span className="text-FontSizeNano font-bold text-TextColorMuted uppercase tracking-widest">Client Relation</span>
                </div>
                <div className="flex items-center gap-1.5 group">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#30D158] shadow-sm group-hover:scale-110 transition-transform" />
                  <span className="text-FontSizeNano font-bold text-TextColorMuted uppercase tracking-widest">Offering</span>
                </div>
              </div>
            </div>
            <LaporanMap data={reportData} className="h-full min-h-[400px] rounded-none border-none" />
          </Card>

          {/* Chart Column */}
          <Card 
            id="laporan-chart-card"
            className="p-4 flex flex-col shadow-ElevationMid border-none"
          >
            <div className="flex items-center gap-2 mb-6">
              <h3 className="font-bold text-TextColorBase">Aktivitas</h3>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center">
              <PieChart 
                data={pieChartData} 
                colors={activityColors} 
                valueFormatter={(val) => `${val} Kunjungan`}
              />
              
              <div className="w-full mt-6 space-y-2">
                {pieChartData.map((item, idx) => {
                  const total = reportData.length;
                  const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;
                  return (
                    <div key={item.label} className="flex items-center justify-between p-2 rounded-RadiusSmall bg-ColorBgSecondary/OpacitySubtle">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: activityColors[idx] }} />
                        <span className="text-FontSizeXs font-bold text-TextColorBase">{item.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-FontSizeXs font-black text-TextColorBase">{item.value}</span>
                        <span className="text-FontSizeNano font-bold text-TextColorMuted">({percentage}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        </div>

        {/* Data Table Section - CARD REMOVED */}
        <div className="flex flex-col gap-4">
          {/* Table Header */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-TextColorBase">Data Kunjungan</h3>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-ColorPrimary/OpacitySubtle rounded-full">
              <span className="text-FontSizeNano font-black text-Black">TOTAL {reportData.length} DATA</span>
            </div>
          </div>
          
          {/* Table */}
          <div className="rounded-lg shadow-ElevationMid bg-white overflow-hidden">
            <Table id="laporan-pemasaran-table" noBorder={true} className="w-full">
              <TableHeader>
                <TableRow noBorder={true} isHeader={true}>
                  <TableHead className="w-32">Tanggal</TableHead>
                  <TableHead className="w-40">Nama Sales</TableHead>
                  <TableHead className="w-48">Pelanggan / Perusahaan</TableHead>
                  <TableHead className="w-32">Kegiatan</TableHead>
                  <TableHead>Alamat Kunjungan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.length > 0 ? (
                  reportData.map((row) => (
                    <TableRow 
                      key={row.id} 
                      noBorder={true} 
                      className="hover:bg-teal-50/50 transition-colors"
                    >
                      <TableCell noBorder={true} className="text-gray-900 text-sm font-normal">
                        {formatDateShort(row.visit_date)}
                      </TableCell>
                      <TableCell noBorder={true} className="text-gray-900 text-sm font-semibold text-left">
                        {row.sales_username}
                      </TableCell>
                      <TableCell noBorder={true} className="text-gray-900 text-sm font-normal text-left">
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900">{row.customer_name}</span>
                          {row.customer_company && (
                            <span className="text-xs text-gray-500">{row.customer_company}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell noBorder={true} className="text-gray-900 text-sm font-normal text-left">
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-xs font-semibold inline-block uppercase",
                          row.activity_type === 'client relation' ? "bg-blue-100 text-blue-700" :
                          row.activity_type === 'selling' ? "bg-red-100 text-red-700" :
                          "bg-green-100 text-green-700"
                        )}>
                          {row.activity_type}
                        </span>
                      </TableCell>
                      <TableCell noBorder={true} className="text-gray-900 text-xs font-normal text-left">
                        <div className="flex items-center gap-1">
                          <MapPin size={14} className="text-gray-400 shrink-0" />
                          <span className="truncate max-w-xs">{row.alamat}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow noBorder={true}>
                    <TableCell colSpan={5} noBorder={true} className="h-48 text-gray-400 italic text-center text-sm font-medium">
                      Tidak ada data kunjungan untuk filter yang dipilih
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

export default LaporanPemasaranPage;