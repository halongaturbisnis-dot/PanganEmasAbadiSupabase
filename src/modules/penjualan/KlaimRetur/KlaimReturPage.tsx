import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainShell } from '../../../ui/components/common/shells/MainShell';
import { Pagination } from '../../../ui/components/common/Pagination';
import { getPageFetchLimit } from '../../../logic/services/fetchingCenter';
import { klaimReturService } from '../../../logic/services/klaimReturService';
import { ITs_KlaimRetur } from '../../../logic/types/ITs_KlaimRetur';
import { Plus, ClipboardList, Edit, Trash2, ChevronDown, Check } from 'lucide-react';
import { Skeleton } from '../../../ui/components/elements/Skeleton';
import { GhostButton, PrimaryButton } from '../../../ui/components/elements/Button';
import { BulkButton } from '../../../ui/components/elements/BulkButton';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell, TableCheckbox } from '../../../ui/components/common/Table';
import { SearchInput } from '../../../ui/components/elements/Inputs';
import { DateRangePicker } from '../../../ui/components/elements/DateRangePicker';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { Modal } from '../../../ui/components/common/Modal';
import { swalConfig, toast as swalToast } from '../../../logic/utils/swalConfig';
import { tokens } from '../../../ui/styles/tokens';
import { cn } from '../../../logic/utils/cn';
import { useGlobalState } from '../../../logic/context/GlobalContext';
import { formatDateFull } from '../../../logic/utils/date';

/**
 * KLAIM RETUR PAGE
 * Halaman utama untuk daftar klaim retur pelanggan.
 */
export const KlaimReturPage: React.FC = () => {
  const { state } = useGlobalState();
  const navigate = useNavigate();
  const { isMobile, isCompact } = state.viewport;
  
  const [data, setData] = useState<(ITs_KlaimRetur & { customer_name?: string })[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [sortConfig, setSortConfig] = useState<{ key: keyof ITs_KlaimRetur; direction: 'asc' | 'desc' }>({
    key: 'datetime',
    direction: 'desc'
  });
  const [statusModal, setStatusModal] = useState<{ isOpen: boolean; rowId: string; currentStatus: string }>({
    isOpen: false,
    rowId: '',
    currentStatus: ''
  });
  const limit = getPageFetchLimit('DaftarKlaimRetur') || 15;

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const { items, total } = await klaimReturService.getPaginated(
        page,
        limit,
        searchTerm,
        undefined,
        sortConfig.key,
        sortConfig.direction,
        dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
        dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined
      );
      setData(items);
      setTotalItems(total);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, page, limit, sortConfig, dateRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle Date Range Change
  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
    setSearchTerm(''); // Reset search input on date range change
    setPage(1);
  };

  // Reset page when search or dateRange changes
  useEffect(() => {
    setPage(1);
  }, [searchTerm, dateRange]);

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

  const handleDelete = async (id: string) => {
    swalConfig.fire({
      title: 'Hapus Klaim Retur?',
      text: 'Data yang dihapus tidak dapat dikembalikan!',
      icon: 'error',
      showCancelButton: true,
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal',
      confirmButtonColor: tokens.semantic.colors.light.FeedbackColorError,
    }).then(async (result) => {
      if (result.isConfirmed) {
        const success = await klaimReturService.delete(id);
        if (success) {
          swalToast.fire({ icon: 'success', title: 'Klaim Retur berhasil dihapus' });
          fetchData();
        } else {
          swalToast.fire({ icon: 'error', title: 'Gagal menghapus data' });
        }
      }
    });
  };

  const handleMassDelete = () => {
    swalConfig.fire({
      title: 'Hapus Klaim Dipilih?',
      text: `Hapus ${selectedIds.length} data klaim retur? Tindakan ini tidak dapat dibatalkan!`,
      icon: 'error',
      showCancelButton: true,
      confirmButtonText: 'Ya, Hapus Semua',
      cancelButtonText: 'Batal',
      confirmButtonColor: tokens.semantic.colors.light.FeedbackColorError,
    }).then(async (result) => {
      if (result.isConfirmed) {
        const success = await klaimReturService.deleteMany(selectedIds);
        if (success) {
          swalToast.fire({ icon: 'success', title: `${selectedIds.length} Data berhasil dihapus` });
          setSelectedIds([]);
          fetchData();
        } else {
          swalToast.fire({ icon: 'error', title: 'Gagal menghapus beberapa data' });
        }
      }
    });
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    const success = await klaimReturService.update(id, { status: newStatus as any });
    if (success) {
      swalToast.fire({ icon: 'success', title: 'Status berhasil diperbarui' });
      fetchData();
      setStatusModal({ isOpen: false, rowId: '', currentStatus: '' });
    } else {
      swalToast.fire({ icon: 'error', title: 'Gagal memperbarui status' });
    }
  };

  return (
    <MainShell 
      title="Klaim Retur" 
      subtitle="Manajemen dan monitoring pengajuan pengembalian barang dari pelanggan"
      onSearchChange={(val) => setSearchTerm(val)}
      hideDownload={true}
      id="klaim-retur-page"
    >
      <div className={cn("w-full", isCompact ? "space-y-[0.75rem]" : "space-y-SpacingBase")}>
        <div className={cn("flex items-center justify-between gap-3", isCompact ? "flex-col items-stretch" : "flex-row")}>
          {/* Left: Search input & Bulk Button */}
          <div className={cn("flex items-center gap-2 flex-grow", isCompact ? "w-full" : "max-w-lg")}>
            <div className={cn(isCompact ? "flex-1" : "w-64 flex-shrink-0")}>
              <SearchInput 
                id="klaim-retur-search-input"
                value={searchTerm}
                onSearch={(val) => setSearchTerm(val)}
                placeholder="Cari klaim retur..."
                className="bg-ColorBg !rounded-RadiusMedium !border-ColorPrimary/25 hover:!border-ColorPrimary focus:!border-ColorPrimary focus-visible:!border-ColorPrimary focus:!ring-0 focus-visible:!ring-0 transition-all shadow-sm"
              />
            </div>
            {selectedIds.length > 0 && (
              <div className="flex-shrink-0">
                <BulkButton 
                  type="delete"
                  id="mass-delete-btn"
                  onClick={handleMassDelete}
                  count={selectedIds.length}
                />
              </div>
            )}
          </div>
          
          {/* Right: DateRangePicker & Create Button */}
          <div className={cn("flex items-center gap-[0.5rem]", isCompact ? "flex-col items-stretch" : "flex-1 justify-end")}>
            <div className={cn(isCompact ? "w-full" : "w-auto min-w-[200px]")}>
              <DateRangePicker
                date={dateRange}
                onDateChange={handleDateRangeChange}
                placeholder="Filter Tanggal..."
                className="w-full"
              />
            </div>
            <PrimaryButton
              id="tambah-klaim-retur-btn"
              onClick={() => navigate('/penjualan/klaim-retur/tambah')}
              icon={<Plus size={16} />}
              className={cn("!rounded-RadiusMedium whitespace-nowrap", isCompact ? "w-full" : "sm:w-auto")}
            >
              {isCompact ? "Klaim Baru" : "Buat Klaim Baru"}
            </PrimaryButton>
          </div>
        </div>

        {!isCompact ? (
          <Table id="klaim-retur-table" noBorder={true}>
            <TableHeader>
              <TableRow noBorder={true} isHeader={true}>
                <TableHead className="w-12">
                  <TableCheckbox 
                    checked={data.length > 0 && selectedIds.length === data.length}
                    indeterminate={selectedIds.length > 0 && selectedIds.length < data.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => setSortConfig(prev => ({ key: 'datetime', direction: prev.key === 'datetime' && prev.direction === 'desc' ? 'asc' : 'desc' }))}
                >
                  Tanggal {sortConfig.key === 'datetime' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead>No. Invoice</TableHead>
                <TableHead>Pelanggan</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="w-24 text-center">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <TableRow key={`skeleton-${idx}`} noBorder={true}>
                    <TableCell noBorder={true}><Skeleton className="h-[2.5rem] w-full" /></TableCell>
                    <TableCell noBorder={true}><Skeleton className="h-[2.5rem] w-full" /></TableCell>
                    <TableCell noBorder={true}><Skeleton className="h-[2.5rem] w-full" /></TableCell>
                    <TableCell noBorder={true}><Skeleton className="h-[2.5rem] w-full" /></TableCell>
                    <TableCell noBorder={true}><Skeleton className="h-[2.5rem] w-full" /></TableCell>
                    <TableCell noBorder={true}><Skeleton className="h-[2.5rem] w-full" /></TableCell>
                  </TableRow>
                ))
              ) : data.length > 0 ? (
                data.map((row) => (
                  <TableRow 
                    key={row.id} 
                    noBorder={true} 
                    className="cursor-pointer select-none group hover:bg-[#f8fafc] transition-colors"
                    onClick={() => navigate(`/penjualan/klaim-retur/detail/${row.id}`)}
                  >
                    <TableCell noBorder={true} onClick={(e) => e.stopPropagation()}>
                      <TableCheckbox 
                        checked={selectedIds.includes(row.id)}
                        onChange={(e) => handleSelectRow(row.id, e.target.checked)}
                      />
                    </TableCell>
                    <TableCell noBorder={true}>
                      <span className="text-[0.875rem] font-bold text-[#1e3a34]">{formatDateFull(row.datetime)}</span>
                    </TableCell>
                    <TableCell noBorder={true}>
                      <span className="text-[0.875rem] font-bold text-[#1e293b] font-mono">
                        {row.invoice_number}
                      </span>
                    </TableCell>
                    <TableCell noBorder={true}>
                      <span className="text-[0.875rem] font-medium text-[#1e293b]">
                        {row.customer_name || '-'}
                      </span>
                    </TableCell>
                    <TableCell noBorder={true} onClick={(e) => e.stopPropagation()} className="text-center">
                      <button
                        onClick={() => setStatusModal({ isOpen: true, rowId: row.id, currentStatus: row.status })}
                        className={cn(
                          "h-[2rem] px-[1rem] rounded-RadiusFull text-White text-[0.75rem] font-bold min-w-[7rem] transition-all active:scale-95 border-none shadow-ElevationLow hover:opacity-90",
                          row.status === 'Pending' ? "bg-FeedbackColorError" : "bg-ColorPrimary"
                        )}
                      >
                        {row.status === 'Pending' ? 'Menunggu' : 'Selesai'}
                      </button>
                    </TableCell>
                    <TableCell noBorder={true} onClick={(e) => e.stopPropagation()} className="text-center">
                      <div className="flex items-center justify-center gap-SpacingTiny">
                        <GhostButton size="sm" onClick={() => navigate(`/penjualan/klaim-retur/edit/${row.id}`)} title="Edit">
                          <Edit size="1rem" className="text-ColorSecondary" />
                        </GhostButton>
                        <GhostButton size="sm" onClick={() => handleDelete(row.id)} title="Hapus">
                          <Trash2 size="1rem" className="text-FeedbackColorError" />
                        </GhostButton>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow noBorder={true}>
                  <TableCell colSpan={6} noBorder={true} className="h-[12rem] text-[#64748b] italic text-center">
                    <div className="flex flex-col items-center justify-center gap-2 opacity-60">
                      <ClipboardList size={48} className="text-[#cbd5e1]" />
                      <p>Belum ada data klaim retur</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        ) : (
          <div className="grid grid-cols-1 gap-[0.75rem]">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <Skeleton key={`skeleton-mobile-${idx}`} className="h-[7.5rem] w-full rounded-RadiusMedium" />
              ))
            ) : data.length > 0 ? (
              data.map((row) => (
                <div 
                  key={row.id}
                  className="p-[1rem] bg-ColorBg border border-slate-100 rounded-RadiusMedium shadow-ElevationSm active:scale-[0.98] transition-all"
                >
                  <div 
                    onClick={() => navigate(`/penjualan/klaim-retur/detail/${row.id}`)}
                    className="flex justify-between items-start mb-[0.75rem]"
                  >
                    <div className="flex flex-col">
                      <span className="text-[0.75rem] text-TextColorMuted">{formatDateFull(row.datetime)}</span>
                      <span className="text-[0.875rem] font-bold text-TextColorBase">{row.customer_name || 'Pelanggan Anonim'}</span>
                      <span className="text-[0.75rem] font-mono text-TextColorMuted mt-[0.1rem]">{row.invoice_number}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setStatusModal({ isOpen: true, rowId: row.id, currentStatus: row.status });
                      }}
                      className={cn(
                        "px-[0.75rem] py-[0.25rem] rounded-RadiusFull text-White text-[0.65rem] font-bold transition-all shadow-sm",
                        row.status === 'Pending' ? "bg-FeedbackColorError" : "bg-ColorPrimary"
                      )}
                    >
                      {row.status === 'Pending' ? 'Menunggu' : 'Selesai'}
                    </button>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-50 pt-[0.75rem]">
                    <div className="flex items-center gap-[0.5rem]">
                      <TableCheckbox 
                        checked={selectedIds.includes(row.id)}
                        onChange={(e) => handleSelectRow(row.id, e.target.checked)}
                      />
                      <span className="text-[0.7rem] text-TextColorMuted font-medium">Pilih Data</span>
                    </div>
                    <div className="flex items-center gap-[0.25rem]">
                      <GhostButton size="sm" onClick={() => navigate(`/penjualan/klaim-retur/edit/${row.id}`)} className="h-[2rem] w-[2rem] !p-0">
                        <Edit size="0.9rem" className="text-ColorSecondary" />
                      </GhostButton>
                      <GhostButton size="sm" onClick={() => handleDelete(row.id)} className="h-[2rem] w-[2rem] !p-0">
                        <Trash2 size="0.9rem" className="text-FeedbackColorError" />
                      </GhostButton>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-[12rem] flex flex-col items-center justify-center gap-[0.5rem] bg-slate-50/50 rounded-RadiusMedium border border-dashed border-slate-200 opacity-60">
                <ClipboardList size={32} className="text-[#cbd5e1]" />
                <p className="text-[0.875rem] italic text-TextColorMuted text-center">Belum ada data klaim retur.</p>
              </div>
            )}
          </div>
        )}

        <Pagination
          currentPage={page}
          totalPages={Math.ceil(totalItems / limit) || 1}
          totalItems={totalItems}
          perPage={limit}
          onPageChange={(p) => setPage(p)}
          className={cn(isCompact ? "mt-[1rem]" : "mt-[1.5rem]")}
          id="klaim-retur-pagination"
        />
      </div>

      {/* Status Selection Modal */}
      <Modal
        isOpen={statusModal.isOpen}
        onClose={() => setStatusModal({ ...statusModal, isOpen: false })}
        title="Ubah Status Klaim"
        id="status-update-modal"
        maxWidth="sm"
      >
        <div className="p-[0.5rem] space-y-[1rem]">
          <p className="text-[0.875rem] text-TextColorMuted text-center px-[1rem]">
            Pilih status pemrosesan baru untuk klaim retur ini:
          </p>
          <div className="grid grid-cols-1 gap-[0.75rem]">
            <button
              onClick={() => handleUpdateStatus(statusModal.rowId, 'Pending')}
              className={cn(
                "w-full p-[1rem] rounded-RadiusLarge border-[2px] transition-all flex items-center justify-between group",
                statusModal.currentStatus === 'Pending' 
                  ? "border-FeedbackColorError bg-FeedbackColorError/5" 
                  : "border-slate-100 hover:border-FeedbackColorError/30 hover:bg-slate-50"
              )}
            >
              <div className="text-left">
                <p className={cn("font-bold", statusModal.currentStatus === 'Pending' ? "text-FeedbackColorError" : "text-slate-700")}>
                  Menunggu
                </p>
                <p className="text-[0.7rem] text-slate-500">Klaim sedang dalam antrian atau pengecekan.</p>
              </div>
              {statusModal.currentStatus === 'Pending' && <Check className="text-FeedbackColorError" size={20} />}
            </button>

            <button
              onClick={() => handleUpdateStatus(statusModal.rowId, 'Completed')}
              className={cn(
                "w-full p-[1rem] rounded-RadiusLarge border-[2px] transition-all flex items-center justify-between group",
                statusModal.currentStatus === 'Completed' 
                  ? "border-ColorPrimary bg-ColorPrimary/5" 
                  : "border-slate-100 hover:border-ColorPrimary/30 hover:bg-slate-50"
              )}
            >
              <div className="text-left">
                <p className={cn("font-bold", statusModal.currentStatus === 'Completed' ? "text-ColorPrimary" : "text-slate-700")}>
                  Selesai
                </p>
                <p className="text-[0.7rem] text-slate-500">Klaim telah berhasil diproses sepenuhnya.</p>
              </div>
              {statusModal.currentStatus === 'Completed' && <Check className="text-ColorPrimary" size={20} />}
            </button>
          </div>
          
          <div className="pt-[0.5rem]">
            <GhostButton 
              className="w-full" 
              onClick={() => setStatusModal({ ...statusModal, isOpen: false })}
            >
              Batal
            </GhostButton>
          </div>
        </div>
      </Modal>
    </MainShell>
  );
};

export default KlaimReturPage;
