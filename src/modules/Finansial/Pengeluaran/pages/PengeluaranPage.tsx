import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainShell } from '../../../../ui/components/common/shells/MainShell';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell, TableCheckbox, SortDirection } from '../../../../ui/components/common/Table';
import { Pagination } from '../../../../ui/components/common/Pagination';
import { getPageFetchLimit } from '../../../../logic/services/fetchingCenter';
import { pengeluaranService, helperParsePengeluaranType } from '../../../../logic/services/pengeluaranService';
import { IPengeluaran, TPengeluaranStatus } from '../../../../logic/types/ITs_Pengeluaran';
import { Edit, Trash2, Eye, Plus } from 'lucide-react';
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
import { formatDateShort, formatDateFull, formatDateLocal } from '../../../../logic/utils/date';
import { Tabs } from '../../../../ui/components/common/Tabs';
import { Badge } from '../../../../ui/components/elements/Badge';
import { NotificationBadge } from '../../../../ui/components/elements/NotificationBadge';
import { bankAndCashService } from '../../../../logic/services/bankAndCashService';
import { ClipboardList, Wallet } from 'lucide-react';
import { akunService } from '../../../../logic/services/akunService';
import { IAkun } from '../../../../logic/types/ITs_Akun';

/**
 * PENGELUARAN PAGE
 * Halaman utama untuk manajemen data Pengeluaran (Expenses).
 */
export const PengeluaranPage: React.FC = () => {
  const navigate = useNavigate();
  const { state, refreshNotifications } = useGlobalState();
  const { isMobile } = state.viewport;
  const [data, setData] = useState<IPengeluaran[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'DAFTAR' | 'PERMINTAAN'>('DAFTAR');
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: SortDirection }>({ 
    key: 'transaction_date', 
    direction: 'desc' 
  });
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalReqBadge, setTotalReqBadge] = useState(0);
  
  const [users, setUsers] = useState<IAkun[]>([]);
  const [bankMap, setBankMap] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchUsers = async () => {
      const allUsers = await akunService.getAll();
      setUsers(allUsers);
    };
    const fetchBanks = async () => {
      const banks = await bankAndCashService.getAll();
      const map: Record<string, string> = {};
      banks.forEach(b => map[b.id] = b.nama_akun);
      setBankMap(map);
    };
    fetchUsers();
    fetchBanks();
  }, []);
  
  // Helper to find username
  const getUserName = (id: string) => {
    const user = users.find(u => u.id === id);
    return user ? user.username : id;
  };

  const limit = activeTab === 'DAFTAR' 
    ? getPageFetchLimit('DaftarPengeluaran') 
    : getPageFetchLimit('PermintaanPengeluaran');

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    refreshNotifications();
    
    // Fetch Requests Count for badge
    const resultReqCount = await pengeluaranService.getRequestsPaginated(1, '', { limit: 1 });
    setTotalReqBadge(resultReqCount.total);

    if (activeTab === 'DAFTAR') {
      const result = await pengeluaranService.getPaginated(
        page, 
        searchTerm, 
        {
          limit,
          sortKey: sortConfig.key,
          sortDir: sortConfig.direction === 'asc' ? 'asc' : 'desc',
          startDate: dateRange?.from ? formatDateLocal(dateRange.from) : undefined,
          endDate: dateRange?.to ? formatDateLocal(dateRange.to) : (dateRange?.from ? formatDateLocal(dateRange.from) : undefined)
        }
      );
      setData(result.items);
      setTotalItems(result.total);
    } else {
      const result = await pengeluaranService.getRequestsPaginated(
        page,
        searchTerm,
        { limit }
      );
      setRequests(result.items);
      setTotalItems(result.total);
    }
    setIsLoading(false);
  }, [page, limit, searchTerm, sortConfig, activeTab, dateRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
    setSearchTerm(''); // MANDATORY: Reset search input when date range is changed
    setPage(1);
  };

  const handleTabChange = (tabId: 'DAFTAR' | 'PERMINTAAN') => {
    setActiveTab(tabId);
    setDateRange(undefined);
    setSearchTerm('');
    setPage(1);
  };

  // Reset ke halaman 1 jika mencari, menyortir, mengubah tab, atau mengubah filter tanggal
  useEffect(() => {
    setPage(1);
    setSelectedIds([]);
  }, [searchTerm, sortConfig, activeTab, dateRange]);

  const handleDelete = async (id: string) => {
    swalConfig.fire({
      title: 'Hapus Pengeluaran?',
      text: 'Data dan bukti file yang dihapus tidak dapat dikembalikan!',
      icon: 'error',
      showCancelButton: true,
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal',
      confirmButtonColor: tokens.semantic.colors.light.FeedbackColorError,
    }).then(async (result) => {
      if (result.isConfirmed) {
        const success = await pengeluaranService.delete(id);
        if (success) {
          swalToast.fire({ icon: 'success', title: 'Data berhasil dihapus' });
          fetchData();
        } else {
          swalToast.fire({ icon: 'error', title: 'Gagal menghapus data' });
        }
      }
    });
  };

  const handleMassDelete = () => {
    swalConfig.fire({
      title: 'Hapus Data Terpilih?',
      text: `Anda akan menghapus ${selectedIds.length} data pengeluaran. Tindakan ini tidak dapat dibatalkan!`,
      icon: 'error',
      showCancelButton: true,
      confirmButtonText: 'Ya, Hapus Semua',
      cancelButtonText: 'Batal',
      confirmButtonColor: tokens.semantic.colors.light.FeedbackColorError,
    }).then(async (result) => {
      if (result.isConfirmed) {
        const success = await pengeluaranService.deleteMany(selectedIds);
        if (success) {
          swalToast.fire({ icon: 'success', title: 'Data berhasil dihapus' });
          setSelectedIds([]);
          fetchData();
        } else {
          swalToast.fire({ icon: 'error', title: 'Gagal menghapus beberapa data' });
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

  return (
    <MainShell 
      title="Manajemen Pengeluaran" 
      subtitle="Catat dan pantau transaksi pengeluaran operasional"
      onAdd={() => navigate('/finansial/pengeluaran/tambah')}
      onSearchChange={(val) => setSearchTerm(val)}
      hideDownload={true}
      hideHeaderDivider={true}
      id="pengeluaran-main-page"
    >
      <div className="w-full space-y-SpacingBase">
        {/* TABS CONFIGURATION */}
        <Tabs 
          id="pengeluaran-tabs"
          activeTab={activeTab}
          onChange={(id) => handleTabChange(id as any)}
          variant="underline"
          tabs={[
            { id: 'DAFTAR', label: 'Daftar Pengeluaran', icon: <ClipboardList size={18} /> },
            { 
              id: 'PERMINTAAN', 
              label: (
                <div className="flex items-center gap-SpacingNano">
                  <span>Permintaan Pengeluaran</span>
                  <NotificationBadge count={totalReqBadge} />
                </div>
              ), 
              icon: <Wallet size={18} /> 
            }
          ]}
        />

        <div className={cn("flex items-center justify-between gap-SpacingSmall", isMobile && "flex-col items-stretch")}>
          <div className={cn(isMobile ? "w-full" : "w-1/3")}>
            <SearchInput 
              id="pengeluaran-search-input"
              value={searchTerm}
              onSearch={(val) => setSearchTerm(val)}
              placeholder={activeTab === 'DAFTAR' ? "Cari deskripsi atau tipe..." : "Cari Supplier atau PO..."}
              className="bg-ColorBg !rounded-RadiusMedium !border-ColorPrimary/25 hover:!border-ColorPrimary focus:!border-ColorPrimary focus-visible:!border-ColorPrimary focus:!ring-0 focus-visible:!ring-0 transition-all shadow-sm"
            />
          </div>
          
          <div className={cn("flex items-center gap-[0.75rem]", !isMobile && "flex-1 justify-end")}>
            {activeTab === 'DAFTAR' && (
              <div className={cn(isMobile ? "w-full" : "w-auto min-w-[200px]")}>
                <DateRangePicker
                  date={dateRange}
                  onDateChange={handleDateRangeChange}
                  placeholder="Filter Tanggal..."
                  className="w-full"
                />
              </div>
            )}
            
            <Plus 
              className="hidden" // Placeholder for alignment if needed or just use consistent gap
            />
          </div>
        </div>

        {activeTab === 'DAFTAR' ? (
          <Table id="pengeluaran-table" noBorder={true}>
            <TableHeader>
              <TableRow noBorder={true} isHeader={true}>
                <TableHead 
                  isSortable={true} 
                  sortDirection={sortConfig.key === 'transaction_date' ? sortConfig.direction : null}
                  onSort={(dir) => setSortConfig({ key: 'transaction_date', direction: dir })}
                  className="w-40"
                >
                  Tanggal
                </TableHead>
                <TableHead 
                  isSortable={true} 
                  sortDirection={sortConfig.key === 'type' ? sortConfig.direction : null}
                  onSort={(dir) => setSortConfig({ key: 'type', direction: dir })}
                >
                  Tipe
                </TableHead>
                <TableHead>Deskripsi</TableHead>
                <TableHead 
                  isSortable={true} 
                  sortDirection={sortConfig.key === 'amount' ? sortConfig.direction : null}
                  onSort={(dir) => setSortConfig({ key: 'amount', direction: dir })}
                  className="text-center"
                >
                  Nominal
                </TableHead>
                <TableHead className="w-32 text-center">Sumber Transaksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <TableRow key={`skeleton-${idx}`} noBorder={true}>
                    <TableCell noBorder={true}><Skeleton className="w-spacing-SpacingBase h-spacing-SpacingBase mx-auto" /></TableCell>
                    <TableCell noBorder={true}><Skeleton className="h-[1.25rem] w-3/4" /></TableCell>
                    <TableCell noBorder={true}><Skeleton className="h-[1.25rem] w-full" /></TableCell>
                    <TableCell noBorder={true}><Skeleton className="h-[1.25rem] w-full" /></TableCell>
                    <TableCell noBorder={true}><Skeleton className="h-[1.25rem] w-1/2 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : data.length > 0 ? (
                data.map((row) => (
                  <TableRow 
                    key={row.id} 
                    noBorder={true} 
                    className={cn("cursor-pointer select-none group")}
                    onClick={() => navigate(`/finansial/pengeluaran/detail/${row.id}`)}
                  >
                    <TableCell noBorder={true} className="text-TextColorBase text-FontSizeXs font-normal">
                      {formatDateFull(row.transaction_date)}
                    </TableCell>
                    <TableCell noBorder={true} className="text-TextColorBase text-FontSizeXs font-normal">
                      <div className="flex flex-col gap-1 items-start">
                        <span>{helperParsePengeluaranType(row.type).name}</span>
                        <Badge variant={helperParsePengeluaranType(row.type).classification === 'Operasional' ? 'neutral' : 'info'}
                        className="border border-White">
                          {helperParsePengeluaranType(row.type).classification}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell noBorder={true} className="text-TextColorBase text-FontSizeNano font-normal max-w-xs truncate">
                      {row.description}
                    </TableCell>
                    <TableCell noBorder={true} className="text-right text-TextColorBase text-FontSizeXs font-normal">
                      {formatCurrency(row.amount)}
                    </TableCell>
                    <TableCell noBorder={true} className="text-center text-TextColorBase text-FontSizeXs font-normal">
                      {bankMap[row.bank_and_cash_id] || '-'}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow noBorder={true}>
                  <TableCell colSpan={7} noBorder={true} className="h-48 text-TextColorMuted italic text-center">
                    Data pengeluaran tidak ditemukan
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        ) : (
          /* TABLE PERMINTAAN PENGELUARAN */
          <Table id="permintaan-pengeluaran-table" noBorder={true}>
            <TableHeader>
              <TableRow noBorder={true} isHeader={true}>
                <TableHead className="w-48">Tanggal & Waktu</TableHead>
                <TableHead>Sumber</TableHead>
                <TableHead className="text-right">Nominal Permintaan</TableHead>
                <TableHead>Penanggung Jawab</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <TableRow key={`skeleton-req-${idx}`} noBorder={true}>
                    <TableCell noBorder={true}><Skeleton className="h-[1.25rem] w-full" /></TableCell>
                    <TableCell noBorder={true}><Skeleton className="h-[1.25rem] w-full" /></TableCell>
                    <TableCell noBorder={true}><Skeleton className="h-[1.25rem] w-1/2 ml-auto" /></TableCell>
                    <TableCell noBorder={true}><Skeleton className="h-[1.25rem] w-3/4" /></TableCell>
                  </TableRow>
                ))
              ) : requests.length > 0 ? (
                requests.map((row) => (
                  <TableRow 
                    key={row.id} 
                    noBorder={true} 
                    className="cursor-pointer select-none group"
                    onClick={() => navigate(`/pengadaan/pembelian/detail/${row.id}?referrer=/finansial/pengeluaran`)}
                  >
                    <TableCell noBorder={true} className="text-TextColorBase text-FontSizeXs font-normal">
                      {formatDateFull(row.datetime)}
                    </TableCell>
                    <TableCell noBorder={true}>
                      <div className="flex flex-col">
                        <span className="text-TextColorBase text-FontSizeXs font-medium">Pembelian</span>
                        <span className="text-TextColorMuted text-[10px] uppercase tracking-wider">{row.po_number || '-'}</span>
                      </div>
                    </TableCell>
                    <TableCell noBorder={true} className="text-center text-ColorPrimary text-FontSizeSm font-bold">
                      {formatCurrency(row.payment_type === 'lunas' ? row.grand_total_price : row.deposit)}
                    </TableCell>
                    <TableCell noBorder={true} className="text-TextColorMuted text-FontSizeXs font-normal">
                      <div className="flex flex-col">
                        <span>Dibuat oleh <span className="font-bold">{row.created_by ? getUserName(row.created_by) : '-'}</span></span>
                        <span>Diperbarui oleh <span className="font-bold">{row.updated_by ? getUserName(row.updated_by) : '-'}</span></span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow noBorder={true}>
                  <TableCell colSpan={4} noBorder={true} className="h-48 text-TextColorMuted italic text-center">
                    Tidak ada permintaan pengeluaran baru dari pembelian
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}

        <Pagination
          currentPage={page}
          totalPages={Math.ceil(totalItems / limit)}
          totalItems={totalItems}
          perPage={limit}
          onPageChange={(p) => setPage(p)}
          className="mt-SpacingMedium"
          id="pengeluaran-pagination"
        />
      </div>
    </MainShell>
  );
};

export default PengeluaranPage;
