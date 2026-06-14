import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainShell } from '../../../../ui/components/common/shells/MainShell';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell, TableCheckbox, SortDirection } from '../../../../ui/components/common/Table';
import { Pagination } from '../../../../ui/components/common/Pagination';
import { getPageFetchLimit } from '../../../../logic/services/fetchingCenter';
import { penjualanService } from '../../../../logic/services/penjualanService';
import { ITs_Penjualan } from '../../../../logic/types/ITs_Penjualan';
import { Edit, Trash2, Calendar, User, ClipboardList, CheckCircle2, AlertCircle, ShoppingBag } from 'lucide-react';
import { GhostButton, DangerButton } from '../../../../ui/components/elements/Button';
import { SearchInput } from '../../../../ui/components/elements/Inputs';
import { DateRangePicker } from '../../../../ui/components/elements/DateRangePicker';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { Skeleton } from '../../../../ui/components/elements/Skeleton';
import { swalConfig, toast as swalToast } from '../../../../logic/utils/swalConfig';
import { tokens } from '../../../../ui/styles/tokens';
import { cn } from '../../../../logic/utils/cn';
import { useGlobalState } from '../../../../logic/context/GlobalContext';
import { formatCurrency } from '../../../../logic/utils/data';

/**
 * PENJUALAN PAGE
 * Halaman utama untuk manajemen data Penjualan.
 */
export const PenjualanPage: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useGlobalState();
  const { isMobile } = state.viewport;

  const [data, setData] = useState<(ITs_Penjualan & { customer_name?: string; is_dropship_locked?: boolean })[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: SortDirection }>({
    key: 'datetime',
    direction: 'desc'
  });
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = getPageFetchLimit('DaftarPenjualan') || 15;

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    const { items, total } = await penjualanService.getPaginated(
      page,
      limit,
      searchTerm,
      undefined,
      dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
      dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined
    );
    setData(items);
    setTotalItems(total);
    setIsLoading(false);
  }, [page, limit, searchTerm, dateRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle Date Range Change
  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
    setSearchTerm(''); // MANDATORY: Reset search input when date range is used
    setPage(1);
  };

  // Reset page when search or dateRange changes
  useEffect(() => {
    setPage(1);
  }, [searchTerm, dateRange]);

  const handleDelete = async (id: string, invoiceNumber: string) => {
    swalConfig.fire({
      title: 'Hapus Transaksi Penjualan?',
      text: `Transaksi ${invoiceNumber} beserta rincian produk dan biaya di dalamnya akan dihapus permanen!`,
      icon: 'error',
      showCancelButton: true,
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal',
      confirmButtonColor: tokens.semantic.colors.light.FeedbackColorError,
    }).then(async (result) => {
      if (result.isConfirmed) {
        const success = await penjualanService.delete(id);
        if (success) {
          swalToast.fire({ icon: 'success', title: 'Transaksi berhasil dihapus' });
          fetchData();
        } else {
          swalToast.fire({ icon: 'error', title: 'Gagal menghapus transaksi' });
        }
      }
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(data.map(row => row.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(item => item !== id));
    }
  };

  const formatTanggal = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  const getStatusBadge = (status: ITs_Penjualan['status']) => {
    switch (status) {
      case 'Draft':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
            <ClipboardList size={12} />
            Draft
          </span>
        );
      case 'Confirmed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
            <ShoppingBag size={12} />
            Dikonfirmasi
          </span>
        );
      case 'Completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
            <CheckCircle2 size={12} />
            Selesai
          </span>
        );
      case 'Cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">
            <AlertCircle size={12} />
            Batal
          </span>
        );
      default:
        return status;
    }
  };

  const getApprovalBadge = (status: ITs_Penjualan['approval_status']) => {
    switch (status) {
      case 'Approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-FontSizeNano font-bold uppercase bg-ColorPrimary text-White">
            Approved
          </span>
        );
      case 'Rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-FontSizeNano font-bold uppercase bg-FeedbackColorError text-White">
            Reject
          </span>
        );
      default:
        // Assume 'Pending' if null/undefined or other cases
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-FontSizeNano font-bold uppercase bg-ColorSecondary text-White">
            Pending
          </span>
        );
    }
  };

  return (
    <MainShell
      title="Manajemen Penjualan"
      subtitle="Kelola invoice penjualan dan transaksi pelanggan"
      onAdd={() => navigate('/penjualan/penjualan/tambah')}
      onSearchChange={(val) => setSearchTerm(val)}
      hideDownload={true}
      hideHeaderDivider={true}
      id="penjualan-main-page"
    >
      <div className="w-full space-y-4">
        {/* Search & Date Filter Section */}
        <div className={cn("flex items-center justify-between gap-3", isMobile && "flex-col items-stretch")}>
          <div className={cn(isMobile ? "w-full" : "w-1/3")}>
            <SearchInput
              id="penjualan-search-input"
              value={searchTerm}
              onSearch={(val) => setSearchTerm(val)}
              placeholder="Cari Invoice atau sales..."
              className="bg-ColorBg !rounded-RadiusMedium !border-ColorPrimary/25 hover:!border-ColorPrimary focus:!border-ColorPrimary focus-visible:!border-ColorPrimary focus:!ring-0 focus-visible:!ring-0 transition-all shadow-sm"
            />
          </div>

          <div className={cn(isMobile ? "w-full" : "flex-shrink-0")}>
            <DateRangePicker
              date={dateRange}
              onDateChange={handleDateRangeChange}
              placeholder="Filter Tanggal..."
              className="w-full"
            />
          </div>
        </div>

        {/* Responsive Table Grid */}
        <Table id="penjualan-table" noBorder={true}>
          <TableHeader>
            <TableRow noBorder={true} isHeader={true}>
              <TableHead>No. Invoice / Tanggal</TableHead>
              <TableHead>Customer / Sales</TableHead>
              <TableHead>Grand Total</TableHead>
              <TableHead>Pembayaran</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-24">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: limit }).map((_, idx) => (
                <TableRow key={`skeleton-${idx}`} noBorder={true}>
                  <TableCell noBorder={true} className="!text-left px-SpacingBase">
                    <div className="flex flex-col gap-1 w-32 py-1">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </TableCell>
                  <TableCell noBorder={true} className="!text-left px-SpacingBase">
                    <div className="flex flex-col gap-1 w-36">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </TableCell>
                  <TableCell noBorder={true}>
                    <Skeleton className="h-4 w-24 mx-auto" />
                  </TableCell>
                  <TableCell noBorder={true}>
                    <Skeleton className="h-4 w-20 mx-auto" />
                  </TableCell>
                  <TableCell noBorder={true}>
                    <Skeleton className="h-5 w-16 mx-auto rounded-full" />
                  </TableCell>
                  <TableCell noBorder={true}>
                    <div className="flex items-center justify-center gap-SpacingTiny">
                      <Skeleton className="w-[1.5rem] h-[1.5rem] rounded-RadiusSmall" />
                      <Skeleton className="w-[1.5rem] h-[1.5rem] rounded-RadiusSmall" />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : data.length > 0 ? (
              data.map((row) => (
                <TableRow
                  key={row.id}
                  noBorder={true}
                  className="cursor-pointer select-none hover:bg-ColorBgSecondary/OpacitySubtle transition-colors"
                  onClick={() => navigate(`/penjualan/penjualan/detail/${row.id}`)}
                >
                  <TableCell noBorder={true} className="!text-left px-SpacingBase py-3">
                    <div className="flex flex-col">
                      <span className="font-semibold !text-FontSizeXs text-TextColorBase leading-tight">
                        {row.invoice_number}
                      </span>
                      <span className="!text-FontSizeNano text-TextColorMuted flex items-center gap-1 mt-1">
                        <Calendar size={10} className="text-gray-400" />
                        {formatTanggal(row.datetime)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell noBorder={true} className="!text-left px-SpacingBase">
                    <div className="flex flex-col">
                      <span className="!text-FontSizeXs text-TextColorBase font-medium">
                        {row.customer_name || 'Tanpa Customer'}
                      </span>
                      <span className="!text-FontSizeNano text-TextColorMuted mt-0.5">
                        Sales: {row.sales_name || '-'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell noBorder={true} className="text-center font-semibold !text-FontSizeXs text-TextColorBase">
                    {formatCurrency(row.grand_total)}
                  </TableCell>
                  <TableCell noBorder={true} className="text-center">
                    <div className="flex flex-col items-center">
                      <span className={cn(
                         "!text-FontSizeNano px-2 py-0.5 rounded-full font-bold uppercase",
                         row.payment_type === 'Lunas' ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                      )}>
                        {row.payment_type}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell noBorder={true} className="text-center">
                    <div className="flex flex-col items-center gap-1">
                      {getApprovalBadge(row.approval_status)}
                    </div>
                  </TableCell>
                  <TableCell noBorder={true} onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-SpacingTiny">
                      {(row.approval_status !== 'Approved' && row.approval_status !== 'Rejected') && (
                        <>
                          <GhostButton 
                            size="sm" 
                            onClick={() => navigate(`/penjualan/penjualan/edit/${row.id}`)} 
                            title={row.is_dropship_locked ? "Terkunci: Sudah diproses dropship" : "Edit"}
                            disabled={!!row.is_dropship_locked}
                          >
                            <Edit size="1rem" className={cn(row.is_dropship_locked ? "text-gray-300" : "text-ColorSecondary")} />
                          </GhostButton>
                          <GhostButton 
                            size="sm" 
                            onClick={() => handleDelete(row.id, row.invoice_number)} 
                            title={row.is_dropship_locked ? "Terkunci: Sudah diproses dropship" : "Hapus"}
                            disabled={!!row.is_dropship_locked}
                          >
                            <Trash2 size="1rem" className={cn(row.is_dropship_locked ? "text-gray-300" : "text-FeedbackColorError")} />
                          </GhostButton>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow noBorder={true}>
                <TableCell colSpan={6} noBorder={true} className="h-48 text-TextColorMuted italic">
                  Data transaksi penjualan tidak ditemukan
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <Pagination
          currentPage={page}
          totalPages={Math.ceil(totalItems / limit) || 1}
          totalItems={totalItems}
          perPage={limit}
          onPageChange={(p) => setPage(p)}
          className="mt-SpacingMedium"
          id="penjualan-pagination"
        />
      </div>
    </MainShell>
  );
};

export default PenjualanPage;
