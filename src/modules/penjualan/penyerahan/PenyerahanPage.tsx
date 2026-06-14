import React, { useState, useEffect } from 'react';
import { MainShell } from '../../../ui/components/common/shells/MainShell';
import { Tabs } from '../../../ui/components/common/Tabs';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../../../ui/components/common/Table';
import { Pagination } from '../../../ui/components/common/Pagination';
import { Badge } from '../../../ui/components/elements/Badge';
import { PrimaryButton, SecondaryButton } from '../../../ui/components/elements/Button';
import { SearchInput } from '../../../ui/components/elements/Inputs';
import { DateRangePicker } from '../../../ui/components/elements/DateRangePicker';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { Skeleton } from '../../../ui/components/elements/Skeleton';
import { useGlobalState } from '../../../logic/context/GlobalContext';
import { cn } from '../../../logic/utils/cn';
import { penyerahanService } from '../../../logic/services/penyerahanService';
import { getPageFetchLimit } from '../../../logic/services/fetchingCenter';
import { formatDateTimeWithPipe as formatDateTime } from '../../../logic/utils/date';
import { TPenyerahanStatus, TPenyerahanType } from '../../../logic/types/ITs_Penyerahan';
import { Eye, Truck, PackageCheck, AlertCircle, RefreshCw } from 'lucide-react';
import Swal from 'sweetalert2';

import { PenyerahanFormModal } from './PenyerahanFormModal';
import { PenyerahanDetailModal } from './PenyerahanDetailModal';

export const PenyerahanPage: React.FC = () => {
  const { state } = useGlobalState();
  const isMobile = state.viewport.isMobile;

  const [activeTab, setActiveTab] = useState<string>('antrian');
  const [searchValue, setSearchValue] = useState<string>('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  
  // States Modal
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  // Data State
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [page, setPage] = useState(1);
  const limit = getPageFetchLimit('DaftarPenyerahan');

  const fetchData = async () => {
    setLoading(true);
    try {
      const startDate = dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined;
      const endDate = dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined;

      if (activeTab === 'antrian') {
        const res = await penyerahanService.getAntrianPenjualanPaginated(page, searchValue, { 
          limit,
          startDate,
          endDate
        });
        setData(res.items);
        setTotalItems(res.total);
      } else if (activeTab === 'pengiriman') {
        const res = await penyerahanService.getPaginated(page, searchValue, { 
          limit,
          status: TPenyerahanStatus.ON_DELIVERY, 
          penyerahan_type: TPenyerahanType.FRANCO,
          startDate,
          endDate
        });
        setData(res.items);
        setTotalItems(res.total);
      } else if (activeTab === 'selesai') {
        const res = await penyerahanService.getPaginated(page, searchValue, { 
          limit,
          status: TPenyerahanStatus.COMPLETED,
          startDate,
          endDate
        });
        setData(res.items);
        setTotalItems(res.total);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab, searchValue, page, dateRange]);

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
    setSearchValue(''); // Reset search input on date range change
    setPage(1);
  };

  const handleCreate = (penjualanId: string) => {
    setSelectedId(penjualanId);
    setIsFormOpen(true);
  };

  const handleDetail = (penyerahanId: string) => {
    setSelectedId(penyerahanId);
    setIsDetailOpen(true);
  };

  const TABS = [
    { id: 'antrian', label: 'Antrian Penyerahan' },
    { id: 'pengiriman', label: 'Dalam Pengiriman' },
    { id: 'selesai', label: 'Selesai' },
  ];

  const renderData = () => {
    return (
      <div className="w-full space-y-4">
        <Table id={`table-${activeTab}`} noBorder={true}>
          <TableHeader>
            <TableRow noBorder={true} isHeader={true}>
              {activeTab === 'antrian' ? (
                <>
                  <TableHead>Waktu</TableHead>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Customer</TableHead>
                </>
              ) : activeTab === 'pengiriman' ? (
                <>
                  <TableHead>Waktu Pengiriman</TableHead>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Customer</TableHead>
                </>
              ) : (
                <>
                  <TableHead>Waktu Penyerahan</TableHead>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Customer</TableHead>
                </>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: limit }).map((_, idx) => (
                <TableRow key={`skeleton-${idx}`} noBorder={true}>
                  <TableCell noBorder={true}><Skeleton className="h-10 w-full" /></TableCell>
                  <TableCell noBorder={true}><Skeleton className="h-10 w-full" /></TableCell>
                  <TableCell noBorder={true}><Skeleton className="h-10 w-full" /></TableCell>
                </TableRow>
              ))
            ) : data.length > 0 ? (
              data.map((row) => (
                <TableRow 
                  key={row.id} 
                  noBorder={true}
                  className="cursor-pointer select-none group hover:bg-Slate50 transition-colors"
                  onClick={() => {
                    if (activeTab === 'antrian') {
                      handleCreate(row.id);
                    } else {
                      handleDetail(row.id);
                    }
                  }}
                >
                  {activeTab === 'antrian' ? (
                    <>
                      <TableCell noBorder={true}>
                        <div className="text-FontSizeXs font-medium text-TextColorBase">
                          {formatDateTime(row.datetime)}
                        </div>
                      </TableCell>
                      <TableCell noBorder={true}>
                        <div className="text-FontSizeXs font-bold text-Slate900">
                          {row.invoice_number || '-'}
                        </div>
                      </TableCell>
                      <TableCell noBorder={true}>
                        <div className="text-FontSizeXs font-medium text-ColorPrimary">
                          {row.customer_name || '-'}
                        </div>
                      </TableCell>
                    </>
                  ) : activeTab === 'pengiriman' ? (
                    <>
                      <TableCell noBorder={true}>
                        <div className="text-FontSizeXs font-bold text-ColorPrimary">
                          {formatDateTime(row.datetime)}
                        </div>
                      </TableCell>
                      <TableCell noBorder={true}>
                        <div className="text-FontSizeXs font-bold text-Slate900">
                          {row.invoice_number || '-'}
                        </div>
                      </TableCell>
                      <TableCell noBorder={true}>
                        <div className="text-FontSizeXs font-medium text-ColorPrimary">
                          {row.customer_name || '-'}
                        </div>
                      </TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell noBorder={true}>
                        <div className="text-FontSizeXs font-bold text-ColorPrimary">
                          {formatDateTime(row.handover_datetime || row.datetime)}
                        </div>
                      </TableCell>
                      <TableCell noBorder={true}>
                        <div className="text-FontSizeXs font-bold text-Slate900">
                          {row.invoice_number || '-'}
                        </div>
                      </TableCell>
                      <TableCell noBorder={true}>
                        <div className="text-FontSizeXs font-medium text-ColorPrimary">
                          {row.customer_name || '-'}
                        </div>
                      </TableCell>
                    </>
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow noBorder={true}>
                <TableCell colSpan={3} noBorder={true} className="h-48 text-TextColorMuted italic">
                  Data tidak ditemukan
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <Pagination
          id={`pagination-${activeTab}`}
          currentPage={page}
          totalPages={Math.ceil(totalItems / limit)}
          totalItems={totalItems}
          perPage={limit}
          onPageChange={setPage}
          className="mt-4"
        />
      </div>
    );
  };

  return (
    <MainShell
      title="Penyerahan Barang"
      id="penyerahan-page"
      hideDownload
    >
      <div className="flex flex-col gap-4">
        <Tabs 
          tabs={TABS} 
          activeTab={activeTab} 
          onChange={(tab) => {
            setActiveTab(tab as string);
            setSearchValue('');
            setDateRange(undefined);
            setPage(1);
          }} 
          variant="underline" 
        />

        <div className={cn("flex items-center justify-between gap-3", isMobile && "flex-col items-stretch")}>
          <div className={cn(isMobile ? "w-full" : "w-1/3")}>
            <SearchInput 
              id="penyerahan-search-input"
              value={searchValue}
              onSearch={(val) => setSearchValue(val)}
              placeholder="Cari surat jalan, invoice, atau customer..."
              className="bg-ColorBg !rounded-RadiusMedium !border-ColorPrimary/25 hover:!border-ColorPrimary focus:!border-ColorPrimary focus-visible:!border-ColorPrimary focus:!ring-0 focus-visible:!ring-0 transition-all shadow-sm"
            />
          </div>

          <div className={cn(isMobile ? "w-full" : "flex-shrink-0")}>
            {activeTab === 'selesai' && (
              <DateRangePicker
                date={dateRange}
                onDateChange={handleDateRangeChange}
                placeholder="Filter Tanggal..."
                className="w-full"
              />
            )}
          </div>
        </div>
        
        {renderData()}
      </div>

      {isFormOpen && selectedId && (
        <PenyerahanFormModal
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setSelectedId(null);
            fetchData();
          }}
          penjualanId={selectedId}
        />
      )}

      {isDetailOpen && selectedId && (
        <PenyerahanDetailModal
          isOpen={isDetailOpen}
          onClose={() => {
            setIsDetailOpen(false);
            setSelectedId(null);
            fetchData();
          }}
          penyerahanId={selectedId}
        />
      )}
    </MainShell>
  );
};
