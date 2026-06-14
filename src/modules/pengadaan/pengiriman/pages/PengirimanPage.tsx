import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainShell } from '../../../../ui/components/common/shells/MainShell';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell, SortDirection } from '../../../../ui/components/common/Table';
import { Pagination } from '../../../../ui/components/common/Pagination';
import { Tabs } from '../../../../ui/components/common/Tabs';
import { getPageFetchLimit } from '../../../../logic/services/fetchingCenter';
import { pengirimanService } from '../../../../logic/services/pengirimanService';
import { IPengiriman, TPengirimanStatus } from '../../../../logic/types/ITs_Pengiriman';
import { Truck, Calendar, PackageOpen, PackageCheck } from 'lucide-react';
import { Badge } from '../../../../ui/components/elements/Badge';
import { SearchInput } from '../../../../ui/components/elements/Inputs';
import { DateRangePicker } from '../../../../ui/components/elements/DateRangePicker';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { Skeleton } from '../../../../ui/components/elements/Skeleton';
import { swalConfig, toast as swalToast } from '../../../../logic/utils/swalConfig';
import { tokens } from '../../../../ui/styles/tokens';
import { cn } from '../../../../logic/utils/cn';
import { useGlobalState } from '../../../../logic/context/GlobalContext';
import { formatDateTimeWithPipe as formatDateTime } from '../../../../logic/utils/date';

/**
 * PENGIRIMAN PAGE
 * Halaman utama untuk manajemen data Pengiriman (Logistik).
 */
export const PengirimanPage: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useGlobalState();
  const { isMobile } = state.viewport;
  
  const [activeTab, setActiveTab] = useState('unprocessed'); // 'unprocessed' | 'shipped' | 'done'
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: SortDirection }>({ 
    key: 'datetime', 
    direction: 'desc' 
  });
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = getPageFetchLimit(activeTab === 'unprocessed' ? 'DaftarPembelian' : 'DaftarPengiriman');

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'unprocessed') {
        const { items, total } = await pengirimanService.getUnprocessedPurchases(page, searchTerm, { 
          limit,
          sortKey: sortConfig.key,
          sortDir: sortConfig.direction as 'asc' | 'desc',
          startDate: dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
          endDate: dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
        });
        setData(items);
        setTotalItems(total);
      } else {
        const { items, total } = await pengirimanService.getPaginated(
          page, 
          searchTerm, 
          {
            limit,
            sortKey: sortConfig.key,
            sortDir: sortConfig.direction as 'asc' | 'desc',
            mode: activeTab as 'shipped' | 'done',
            startDate: dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
            endDate: dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
          }
        );
        setData(items);
        setTotalItems(total);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, searchTerm, sortConfig, activeTab, dateRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle Date Range Change
  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
    setSearchTerm(''); // Reset search input when date range is used
    setPage(1);
  };

  // Reset ke halaman 1 jika mencari atau menyortir
  useEffect(() => {
    setPage(1);
  }, [searchTerm, sortConfig, activeTab]);

  const handleDelete = async (id: string) => {
    swalConfig.fire({
      title: 'Hapus Data Pengiriman?',
      text: 'Data yang dihapus tidak dapat dikembalikan!',
      icon: 'error',
      showCancelButton: true,
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal',
      confirmButtonColor: tokens.semantic.colors.light.FeedbackColorError,
    }).then(async (result) => {
      if (result.isConfirmed) {
        const success = await pengirimanService.delete(id);
        if (success) {
          swalToast.fire({ icon: 'success', title: 'Data pengiriman berhasil dihapus' });
          fetchData();
        } else {
          swalToast.fire({ icon: 'error', title: 'Gagal menghapus data pengiriman' });
        }
      }
    });
  };

  const getStatusBadgeVariant = (status: TPengirimanStatus) => {
    switch (status) {
      case TPengirimanStatus.DELIVERED: return 'success';
      case TPengirimanStatus.SHIPPED: return 'info';
      case TPengirimanStatus.PENDING: return 'warning';
      case TPengirimanStatus.CANCELLED: return 'error';
      default: return 'secondary';
    }
  };

  const getStatusBadge = (row: any) => {
    const totalProduk = row.total_produk_pembelian || 0;
    const totalDiterima = row.total_produk_diterima || 0;

    if (totalDiterima > 0) {
      if (totalDiterima < totalProduk) {
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-ColorSecondary/10 text-ColorSecondary border border-ColorSecondary/20">
            <PackageOpen size={12} />
            Parsial
          </span>
        );
      } else {
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-ColorPrimary/10 text-ColorPrimary border border-ColorPrimary/20">
            <PackageCheck size={12} />
            Lengkap
          </span>
        );
      }
    }

    // Jika belum ada penerimaan sama sekali
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200">
        <Truck size={12} />
        Kirim
      </span>
    );
  };

  const tabs = [
    { id: 'unprocessed', label: 'Belum Dikirim' },
    { id: 'shipped', label: 'Dalam Pengiriman' },
    { id: 'done', label: 'Selesai' },
  ];

  return (
    <MainShell 
      title="Manajemen Pengiriman" 
      subtitle="Kelola logistik dan pengiriman barang dari pembelian"
      onSearchChange={(val) => setSearchTerm(val)}
      hideDownload={true}
      hideHeaderDivider={true}
      id="pengiriman-main-page"
    >
      <div className="w-full space-y-SpacingBase">
        <Tabs 
          id="pengiriman-tabs" 
          activeTab={activeTab} 
          tabs={tabs} 
          onChange={(id) => {
            setActiveTab(String(id));
            if (id !== 'done') setDateRange(undefined);
          }} 
          variant="underline"
          className="mb-SpacingMedium"
        />

        <div className={cn("flex items-center justify-between gap-SpacingSmall", isMobile && "flex-col items-stretch")}>
          <div className={cn(isMobile ? "w-full" : "w-1/3")}>
            <SearchInput 
              id="pengiriman-search-input"
              value={searchTerm}
              onSearch={(val) => setSearchTerm(val)}
              placeholder={activeTab === 'unprocessed' ? "Cari PO atau Supplier..." : "Cari PO, Driver, atau Nopol..."}
              className="bg-ColorBg !rounded-RadiusMedium !border-ColorPrimary/25 hover:!border-ColorPrimary focus:!border-ColorPrimary focus-visible:!border-ColorPrimary focus:!ring-0 focus-visible:!ring-0 transition-all shadow-sm"
            />
          </div>

          <div className={cn(isMobile ? "w-full" : "flex-shrink-0")}>
            {activeTab === 'done' && (
              <DateRangePicker
                date={dateRange}
                onDateChange={handleDateRangeChange}
                placeholder="Filter Tanggal..."
                className="w-full"
              />
            )}
          </div>
        </div>

        <Table id="pengiriman-table" noBorder={true}>
          <TableHeader>
            <TableRow noBorder={true} isHeader={true}>
              {activeTab === 'unprocessed' ? (
                <>
                  <TableHead 
                    isSortable={true} 
                    sortDirection={sortConfig.key === 'datetime' ? sortConfig.direction : null}
                    onSort={(dir) => setSortConfig({ key: 'datetime', direction: dir })}
                  >
                    Tanggal
                  </TableHead>
                  <TableHead 
                    isSortable={true} 
                    sortDirection={sortConfig.key === 'po_number' ? sortConfig.direction : null}
                    onSort={(dir) => setSortConfig({ key: 'po_number', direction: dir })}
                  >
                    No. PO
                  </TableHead>
                  <TableHead 
                    isSortable={true} 
                    sortDirection={sortConfig.key === 'supplier_name' ? sortConfig.direction : null}
                    onSort={(dir) => setSortConfig({ key: 'supplier_name', direction: dir })}
                  >
                    Suplier
                  </TableHead>
                  <TableHead 
                    isSortable={true} 
                    sortDirection={sortConfig.key === 'customer_name' ? sortConfig.direction : null}
                    onSort={(dir) => setSortConfig({ key: 'customer_name', direction: dir })}
                  >
                    Customer
                  </TableHead>
                </>
              ) : (
                <>
                  <TableHead 
                    isSortable={true} 
                    sortDirection={sortConfig.key === 'datetime' ? sortConfig.direction : null}
                    onSort={(dir) => setSortConfig({ key: 'datetime', direction: dir })}
                  >
                    Waktu Pengiriman
                  </TableHead>
                  <TableHead>Jenis Pengiriman</TableHead>
                  <TableHead 
                    isSortable={true} 
                    sortDirection={sortConfig.key === 'po_number' ? sortConfig.direction : null}
                    onSort={(dir) => setSortConfig({ key: 'po_number', direction: dir })}
                  >
                    No. PO
                  </TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead 
                    isSortable={true} 
                    sortDirection={sortConfig.key === 'supplier_name' ? sortConfig.direction : null}
                    onSort={(dir) => setSortConfig({ key: 'supplier_name', direction: dir })}
                  >
                    Suplier
                  </TableHead>
                  <TableHead 
                    isSortable={true} 
                    sortDirection={sortConfig.key === 'customer_name' ? sortConfig.direction : null}
                    onSort={(dir) => setSortConfig({ key: 'customer_name', direction: dir })}
                  >
                    Customer
                  </TableHead>
                  <TableHead>Status</TableHead>
                </>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, idx) => (
                <TableRow key={`skeleton-${idx}`} noBorder={true}>
                  {activeTab === 'unprocessed' ? (
                    <>
                      <TableCell noBorder={true} className="px-SpacingBase py-4"><Skeleton className="h-4 w-28 mx-auto" /></TableCell>
                      <TableCell noBorder={true} className="px-SpacingBase py-4"><Skeleton className="h-4 w-32 mx-auto" /></TableCell>
                      <TableCell noBorder={true} className="px-SpacingBase py-4"><Skeleton className="h-4 w-40 mx-auto" /></TableCell>
                      <TableCell noBorder={true} className="px-SpacingBase py-4"><Skeleton className="h-4 w-36 mx-auto" /></TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell noBorder={true} className="px-SpacingBase py-4"><Skeleton className="h-4 w-28" /></TableCell>
                      <TableCell noBorder={true} className="px-SpacingBase py-4"><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell noBorder={true} className="px-SpacingBase py-4"><Skeleton className="h-4 w-24 mx-auto" /></TableCell>
                      <TableCell noBorder={true} className="px-SpacingBase py-4"><Skeleton className="h-4 w-28 mx-auto" /></TableCell>
                      <TableCell noBorder={true} className="px-SpacingBase py-4"><Skeleton className="h-4 w-36" /></TableCell>
                      <TableCell noBorder={true} className="px-SpacingBase py-4"><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell noBorder={true} className="px-SpacingBase py-4"><Skeleton className="h-6 w-16 mx-auto rounded-full" /></TableCell>
                    </>
                  )}
                </TableRow>
              ))
            ) : data.length > 0 ? (
              data.map((row) => (
                <TableRow 
                  key={row.id} 
                  noBorder={true} 
                  className="cursor-pointer select-none group hover:bg-Slate50 transition-colors"
                  onClick={() => navigate(activeTab === 'unprocessed' ? `/pengadaan/pengiriman/tambah?purchase_id=${row.id}` : `/pengadaan/pengiriman/detail/${row.id}`)}
                >
                  {activeTab === 'unprocessed' ? (
                    <>
                      <TableCell noBorder={true} className="!text-center font-normal px-SpacingBase">
                        <div className="text-FontSizeXs font-medium text-TextColorBase">
                          {formatDateTime(row.datetime)}
                        </div>
                      </TableCell>
                      <TableCell noBorder={true} className="!text-center px-SpacingBase">
                        <div className="text-FontSizeXs font-bold text-Slate900">
                          {row.po_number || '-'}
                        </div>
                      </TableCell>
                      <TableCell noBorder={true} className="!text-center px-SpacingBase">
                        <div className="text-FontSizeXs font-bold text-Slate900 text-center">
                          {row.supplier_name || '-'}
                        </div>
                      </TableCell>
                      <TableCell noBorder={true} className="!text-center px-SpacingBase">
                        <div className="text-FontSizeXs font-medium text-ColorPrimary">
                          {row.customer_name || 'Internal'}
                        </div>
                      </TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell noBorder={true} className="!text-justify font-normal px-SpacingBase">
                        <div className="text-FontSizeXs font-bold text-ColorPrimary">
                          {formatDateTime(row.datetime)}
                        </div>
                      </TableCell>
                      <TableCell noBorder={true} className="!text-left px-SpacingBase">
                        <div className="flex items-center gap-1 text-FontSizeSm font-medium text-TextColorBase">
                          <Truck size={12} className="text-TextColorMuted" />
                          {row.shipping_type}
                        </div>
                      </TableCell>
                      <TableCell noBorder={true} className="!text-left px-SpacingBase">
                        <div className="text-FontSizeSm font-bold text-Slate900">
                          {row.po_number || '-'}
                        </div>
                      </TableCell>
                      <TableCell noBorder={true} className="!text-center px-SpacingBase">
                        <div className="text-FontSizeSm font-medium text-TextColorBase">
                          {formatDateTime(row.purchase_date || row.datetime)}
                        </div>
                      </TableCell>
                      <TableCell noBorder={true} className="!text-left px-SpacingBase">
                        <div className="text-FontSizeSm font-bold text-Slate900">
                          {row.supplier_name || '-'}
                        </div>
                      </TableCell>
                      <TableCell noBorder={true} className="!text-left px-SpacingBase">
                        <div className="text-FontSizeSm font-medium text-ColorPrimary">
                          {row.customer_name || 'Internal'}
                        </div>
                      </TableCell>
                      <TableCell noBorder={true} className="!text-center px-SpacingBase">
                        {getStatusBadge(row)}
                      </TableCell>
                    </>
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow noBorder={true}>
                <TableCell colSpan={activeTab === 'unprocessed' ? 4 : 7} noBorder={true} className="h-48 text-TextColorMuted italic">
                  Data tidak ditemukan
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <Pagination
          currentPage={page}
          totalPages={Math.ceil(totalItems / limit)}
          totalItems={totalItems}
          perPage={limit}
          onPageChange={(p) => setPage(p)}
          className="mt-SpacingMedium"
          id="pengiriman-pagination"
        />
      </div>
    </MainShell>
  );
};

export default PengirimanPage;
