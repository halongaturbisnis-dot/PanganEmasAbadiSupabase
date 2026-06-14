import React, { useState, useEffect } from 'react';
import { DateRange } from 'react-day-picker';
import { MainShell } from '../../../../ui/components/common/shells/MainShell';
import { useGlobalState } from '../../../../logic/context/GlobalContext';
import { DateRangePicker } from '../../../../ui/components/elements/DateRangePicker';
import { tokens } from '../../../../ui/styles/tokens';
import { PageLoading } from '../../../../ui/components/LoadingState/PageLoading';
import { cn } from '../../../../logic/utils/cn';
import { Card } from '../../../../ui/components/common/Card';
import { ComposedChart } from '../../../../ui/components/common/ComposedChart';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../../../../ui/components/common/Table';
import { 
  laporanProdukService, 
  LaporanProdukData 
} from '../../../../logic/services/laporanProdukService';
import { getTimezoneIdentifier } from '../../../../logic/utils/time';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

export const LaporanProdukPage: React.FC = () => {
  const { state } = useGlobalState();
  const isMobile = state.viewport.isMobile;
  const navigate = useNavigate();

  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(new Date().setDate(new Date().getDate() - 14)),
    to: new Date()
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [reportData, setReportData] = useState<LaporanProdukData | null>(null);

  const fetchRealData = async () => {
    if (!date?.from || !date?.to) return;
    setIsLoading(true);

    try {
      const startStr = format(date.from, 'yyyy-MM-dd');
      const endStr = format(date.to, 'yyyy-MM-dd');
      const timezone = getTimezoneIdentifier();

      const data = await laporanProdukService.getProdukReport(startStr, endStr, timezone);
      setReportData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRealData();
  }, [date]);

  const dailyFlowData = reportData?.dailyFlowData || [];
  const qcData = reportData?.qcData || [];
  const agregatData = reportData?.agregatData || [];
  const opnameData = reportData?.opnameData || [];
  const suplierData = reportData?.suplierData || [];
  
  const topSalesDesc = reportData?.topSalesDesc || [];
  const topSalesAsc = reportData?.topSalesAsc || [];
  const topRetur = reportData?.topRetur || [];
  const topTerbuang = reportData?.topTerbuang || [];

  const getSubtitleFormat = () => {
    if (!date?.from || !date?.to) return '';
    return `${format(date.from, "dd MMM yyyy", { locale: localeId })} - ${format(date.to, "dd MMM yyyy", { locale: localeId })}`;
  };

  return (
    <MainShell 
      title="Laporan Produk"
      subtitle={getSubtitleFormat()}
      onBack={() => navigate('/')}
      actions={
        <div className="flex items-center gap-SpacingSmall">
          <div className={cn("flex flex-col gap-SpacingNano", isMobile ? "items-start" : "items-end")}>
            <div className="flex items-center gap-2 text-TextColorMuted">
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
          <PageLoading text="Mengolah data laporan produk..." />
        ) : (
          <>
        {/* 1. Area Chart (Smooth Line Chart requested for #1) Pembelian, Penerimaan, Reject, Selisih */}
        <Card className="p-SpacingSmall flex flex-col gap-SpacingSmall">
          <div className="flex flex-col gap-1">
            <h3 className="text-FontSizeSm font-bold text-TextColorBase">
              Perbandingan Pembelian, Penerimaan, Reject, & Selisih
            </h3>
          </div>
          <div className="w-full h-[18.75rem] pt-SpacingBase relative min-h-[18.75rem]">
            {dailyFlowData.length > 0 ? (
              <ComposedChart 
                data={dailyFlowData}
                xAxisDataKey="label"
                isMobile={isMobile}
                height="300px" 
                series={[
                  { type: 'line', dataKey: 'Pembelian', name: 'Total Pembelian', color: '#0A84FF' },
                  { type: 'line', dataKey: 'Penerimaan', name: 'Total Penerimaan', color: '#30D158' },
                  { type: 'line', dataKey: 'Reject', name: 'Total Reject', color: '#FF453A' },
                  { type: 'line', dataKey: 'Selisih', name: 'Selisih', color: '#FF9F0A' }
                ]}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-TextColorMuted opacity-50">Data tidak ditemukan</div>
            )}
          </div>
        </Card>

        <div className={cn("grid gap-SpacingSmall", isMobile ? "grid-cols-1" : "grid-cols-2")}>
            {/* 2. Single Line Chart: QC Penyusutan */}
            <Card className="p-SpacingSmall flex flex-col gap-SpacingSmall">
                <div className="flex flex-col gap-1">
                <h3 className="text-FontSizeSm font-bold text-TextColorBase">
                    Penyusutan QC Harian
                </h3>
                </div>
                <div className="w-full h-[15.625rem] pt-SpacingBase relative min-h-[15.625rem]">
                    <ComposedChart 
                    data={qcData}
                    xAxisDataKey="label"
                    isMobile={isMobile}
                    height="250px"
                    series={[
                        { type: 'line', dataKey: 'Penyusutan', name: 'Total Penyusutan', color: tokens.semantic.colors.light.ColorSecondary }
                    ]}
                    />
                </div>
            </Card>

            {/* 4. Single Line Chart: Selisih Stok Opname (Dual Y Axis behavior via ComposedChart natively supports negatives) */}
            <Card className="p-SpacingSmall flex flex-col gap-SpacingSmall">
                <div className="flex flex-col gap-1">
                <h3 className="text-FontSizeSm font-bold text-TextColorBase">
                    Selisih Stok Opname
                </h3>
                </div>
                <div className="w-full h-[15.625rem] pt-SpacingBase relative min-h-[15.625rem]">
                    <ComposedChart 
                    data={opnameData}
                    xAxisDataKey="label"
                    isMobile={isMobile}
                    height="250px"
                    series={[
                        { type: 'line', dataKey: 'Selisih', name: 'Selisih Opname', color: '#8E8E93', yAxisId: 'right' }
                    ]}
                    />
                </div>
            </Card>
        </div>

        {/* 3. Line Chart: Agregat Stok */}
        {/*<Card className="p-SpacingSmall flex flex-col gap-SpacingSmall">
          <div className="flex flex-col gap-1">
            <h3 className="text-FontSizeSm font-bold text-TextColorBase">
              Agregat Pergerakan Stok
            </h3>
          </div>
          <div className="w-full h-[18.75rem] pt-SpacingBase relative min-h-[18.75rem]">
              <ComposedChart 
                data={agregatData}
                xAxisDataKey="label"
                isMobile={isMobile}
                height="300px"
                series={[
                  { type: 'line', dataKey: 'StokMasuk', name: 'Stok Masuk', color: '#34C759' },
                  { type: 'line', dataKey: 'StokKeluar', name: 'Stok Keluar', color: '#FF9500' },
                  { type: 'line', dataKey: 'StokTerjual', name: 'Stok Terjual', color: '#007AFF' },
                  { type: 'line', dataKey: 'SisaStok', name: 'Sisa Stok', color: '#8E8E93' },
                  { type: 'line', dataKey: 'StokRetur', name: 'Stok Retur', color: '#FF3B30' },
                  { type: 'line', dataKey: 'StokTerbuang', name: 'Stok Terbuang', color: '#5856D6' },
                ]}
              />
          </div>
        </Card>*/}

        {/* 5. Composed Chart: Suplier (Frekuensi vs Total QTY) */}
        <Card className="p-SpacingSmall flex flex-col gap-SpacingSmall">
          <div className="flex flex-col gap-1">
            <h3 className="text-FontSizeSm font-bold text-TextColorBase">Statistik Pembelian berdasarkan Suplier</h3>
            <p className="text-FontSizeNano text-TextColorMuted">Total QTY vs Frekuensi Pembelian</p>
          </div>
          <div className="w-full h-[18.75rem] pt-SpacingBase relative min-h-[18.75rem]">
                <ComposedChart 
                    data={suplierData}
                    xAxisDataKey="name"
                    isMobile={isMobile}
                    height="300px"
                    series={[
                        { type: 'bar', dataKey: 'SumQty', name: 'Total QTY', color: '#0A84FF', yAxisId: 0 },
                        { type: 'line', dataKey: 'Frekuensi', name: 'Frekuensi', color: '#FF453A', yAxisId: 'right' }
                    ]}
                />
          </div>
        </Card>

        {/* Summary Cards: Top 5 Terlaris, 10 Retur & 10 Terbuang */}
        <div className={cn("grid gap-SpacingSmall", isMobile ? "grid-cols-1" : (state.viewport.isDesktop ? "grid-cols-3" : "grid-cols-2"))}>
            {/* 5 Produk Terlaris */}
            <Card className="p-SpacingSmall flex flex-col gap-SpacingSmall">
                <div className="flex flex-col gap-1 mb-2">
                    <h3 className="text-FontSizeSm font-bold text-TextColorBase">5 Produk Terlaris</h3>
                </div>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow isHeader>
                                <TableHead>Nama Produk</TableHead>
                                <TableHead className="text-right">QTY Terjual</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {topSalesDesc.map((item, idx) => (
                                <TableRow key={`desc-${idx}`}>
                                    <TableCell className="font-bold text-FontSizeXs">{item.name}</TableCell>
                                    <TableCell className="text-right font-medium text-green-600">{item.qty}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </Card>

            {/* 5 Produk Retur Terbanyak */}
            <Card className="p-SpacingSmall flex flex-col gap-SpacingSmall">
                <div className="flex flex-col gap-1 mb-2">
                    <h3 className="text-FontSizeSm font-bold text-TextColorBase">
                        5 Produk Retur Terbanyak
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow isHeader>
                                <TableHead>Nama Produk</TableHead>
                                <TableHead className="text-right">QTY Retur</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {topRetur.map((item, idx) => (
                                <TableRow key={`retur-${idx}`}>
                                    <TableCell className="font-medium text-FontSizeXs">{item.name}</TableCell>
                                    <TableCell className="text-right font-bold text-orange-500">{item.qty}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </Card>

            {/* 5 Produk Terbuang Terbanyak */}
            <Card className="p-SpacingSmall flex flex-col gap-SpacingSmall">
                <div className="flex flex-col gap-1 mb-2">
                    <h3 className="text-FontSizeSm font-bold text-TextColorBase">
                        5 Produk Terbuang Terbanyak
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow isHeader>
                                <TableHead>Nama Produk</TableHead>
                                <TableHead className="text-right">QTY Terbuang</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {topTerbuang.map((item, idx) => (
                                <TableRow key={`buang-${idx}`}>
                                    <TableCell className="font-medium text-FontSizeXs">{item.name}</TableCell>
                                    <TableCell className="text-right font-bold text-red-600">{item.qty}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </Card>
        </div>
          </>
        )}
      </div>
    </MainShell>
  );
};