import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { MainShell } from '../../../../ui/components/common/shells/MainShell';
import { useGlobalState } from '../../../../logic/context/GlobalContext';
import { laporanCustomerService, CustomerReportData } from '../../../../logic/services/laporanCustomerService';
import { tokens } from '../../../../ui/styles/tokens';
import { formatCurrency } from '../../../../logic/utils/data';
import { PageLoading } from '../../../../ui/components/LoadingState/PageLoading';
import { cn } from '../../../../logic/utils/cn';
import { Card } from '../../../../ui/components/common/Card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../../../../ui/components/common/Table';
import { CustomerMap } from '../components/CustomerMap';

export const LaporanCustomerPage: React.FC = () => {
  const { state } = useGlobalState();
  const isMobile = state.viewport.isMobile;
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [reportData, setReportData] = useState<CustomerReportData | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    const data = await laporanCustomerService.getCustomerReport();
    setReportData(data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <MainShell title="Laporan Customer" subtitle="Analisis data pelanggan dan sebaran lokasi" hideSearch hideDownload>
          <PageLoading text="Menyusun data customer..." />
      </MainShell>
    );
  }

  return (
    <MainShell 
      title="Laporan Customer" 
      subtitle="Semua data pelanggan dan sebaran lokasi" 
      onBack={() => navigate('/')}
      hideSearch 
      hideDownload
    >
      <div className="flex flex-col gap-SpacingMedium">
        
        {/* ROW 1: Customer Aktif */}
        <div className="flex flex-col gap-SpacingSmall">
          <div className="flex items-center gap-2 px-SpacingTiny">
            <h3 className="text-FontSizeSm font-bold text-TextColorBase">Daftar Customer</h3>
          </div>
          
          <div className={cn("grid gap-SpacingSmall w-full", isMobile ? "grid-cols-1" : "grid-cols-2")}>
            <Card className="p-0 overflow-hidden border-none shadow-sm h-[400px] flex flex-col">
              <div className="flex-1 overflow-auto scrollbar-hide">
                <Table id="purchased-customers-table" className="w-full">
                  <TableHeader>
                    <TableRow isHeader>
                      <TableHead className="!text-FontSizeXs">Nama Customer</TableHead>
                      <TableHead className="!text-FontSizeXs">Perusahaan</TableHead>
                      <TableHead className="!text-FontSizeXs text-center">Trx</TableHead>
                      <TableHead className="!text-FontSizeXs text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData?.purchasedCustomers && reportData.purchasedCustomers.length > 0 ? (
                      reportData.purchasedCustomers.map((customer) => (
                        <TableRow key={customer.id}>
                          <TableCell className="!text-FontSizeXs font-bold">{customer.name}</TableCell>
                          <TableCell className="!text-FontSizeXs opacity-70">{customer.company || '-'}</TableCell>
                          <TableCell className="!text-FontSizeXs font-bold text-center text-ColorPrimary">{customer.total_trx}</TableCell>
                          <TableCell className="text-right">
                            <button 
                              onClick={() => navigate(`/penjualan/customer/detail/${customer.id}?referrer=/laporan/customer`)}
                              className="p-1 hover:bg-ColorPrimary/OpacityMuted rounded-RadiusTiny text-ColorPrimary transition-colors"
                            >
                              <ChevronRight size={14} />
                            </button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="py-10 text-center text-TextColorMuted italic text-FontSizeXs">
                          Tidak ada data customer aktif
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>

            <Card className="p-0 overflow-hidden border-none shadow-sm h-[400px]">
              <CustomerMap 
                data={reportData?.purchasedCustomers || []} 
                markerColor={tokens.semantic.colors.light.ColorPrimary} 
              />
            </Card>
          </div>
        </div>

        {/* ROW 2: Database Pipeline */}
        <div className="flex flex-col gap-SpacingSmall">
          <div className="flex items-center gap-2 px-SpacingTiny">
            <h3 className="text-FontSizeSm font-bold text-TextColorBase">Daftar Pipeline</h3>
          </div>
          
          <div className={cn("grid gap-SpacingSmall w-full", isMobile ? "grid-cols-1" : "grid-cols-2")}>
            <Card className="p-0 overflow-hidden border-none shadow-sm h-[400px] flex flex-col">
              <div className="flex-1 overflow-auto scrollbar-hide">
                <Table id="pipeline-customers-table" className="w-full">
                  <TableHeader>
                    <TableRow isHeader>
                      <TableHead className="!text-FontSizeXs">Nama Customer</TableHead>
                      <TableHead className="!text-FontSizeXs">Perusahaan</TableHead>
                      <TableHead className="!text-FontSizeXs">Telepon</TableHead>
                      <TableHead className="!text-FontSizeXs text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData?.pipelineCustomers && reportData.pipelineCustomers.length > 0 ? (
                      reportData.pipelineCustomers.map((customer) => (
                        <TableRow key={customer.id}>
                          <TableCell className="!text-FontSizeXs font-bold">{customer.name}</TableCell>
                          <TableCell className="!text-FontSizeXs opacity-70">{customer.company || '-'}</TableCell>
                          <TableCell className="!text-FontSizeXs">{customer.telepon}</TableCell>
                          <TableCell className="text-right">
                            <button 
                              onClick={() => navigate(`/penjualan/customer/detail/${customer.id}?referrer=/laporan/customer`)}
                              className="p-1 hover:bg-ColorSecondary/OpacityMuted rounded-RadiusTiny text-ColorSecondary transition-colors"
                            >
                              <ChevronRight size={14} />
                            </button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="py-10 text-center text-TextColorMuted italic text-FontSizeXs">
                          Tidak ada data pipeline
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>

            <Card className="p-0 overflow-hidden border-none shadow-sm h-[400px]">
              <CustomerMap 
                data={reportData?.pipelineCustomers || []} 
                markerColor={tokens.semantic.colors.light.ColorSecondary} 
              />
            </Card>
          </div>
        </div>

        {/* ROW 3: Top Analytics */}
        <div className={cn("grid gap-SpacingSmall w-full", isMobile ? "grid-cols-1" : "grid-cols-2")}>
          {/* Top 5 Frequency */}
          <div className="flex flex-col gap-SpacingSmall">
            <div className="flex items-center gap-2 px-SpacingTiny">
              <h3 className="text-FontSizeSm font-bold text-TextColorBase">Top 5 Frekuensi Pembelian</h3>
            </div>
            <Card className="p-0 overflow-hidden border-none shadow-sm flex flex-col">
              <Table id="top-freq-table" className="w-full">
                <TableHeader>
                  <TableRow isHeader>
                    <TableHead className="!text-FontSizeXs">Nama Customer</TableHead>
                    <TableHead className="!text-FontSizeXs text-right">Total Transaksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData?.topFrequency && reportData.topFrequency.length > 0 ? (
                    reportData.topFrequency.map((row, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="!text-FontSizeXs font-medium">{row.name}</TableCell>
                        <TableCell className="!text-FontSizeXs font-bold text-right text-blue-600">{row.freq} Kali</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={2} className="py-6 text-center text-TextColorMuted italic text-FontSizeXs">Belum ada data</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </div>

          {/* Top 5 Nominal */}
          <div className="flex flex-col gap-SpacingSmall">
            <div className="flex items-center gap-2 px-SpacingTiny">
              <h3 className="text-FontSizeSm font-bold text-TextColorBase">Top 5 Nominal Pembelian Produk</h3>
            </div>
            <Card className="p-0 overflow-hidden border-none shadow-sm flex flex-col">
              <Table id="top-nominal-table" className="w-full">
                <TableHeader>
                  <TableRow isHeader>
                    <TableHead className="!text-FontSizeXs">Nama Customer</TableHead>
                    <TableHead className="!text-FontSizeXs text-center">Total Nominal Pembelian</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData?.topNominal && reportData.topNominal.length > 0 ? (
                    reportData.topNominal.map((row, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="!text-FontSizeXs font-medium">{row.name}</TableCell>
                        <TableCell className="!text-FontSizeXs font-bold text-center text-green-600">{formatCurrency(row.total_nominal)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={2} className="py-6 text-center text-TextColorMuted italic text-FontSizeXs">Belum ada data</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </div>
        </div>

      </div>
    </MainShell>
  );
};
