import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainShell } from '../../../../ui/components/common/shells/MainShell';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell, TableCheckbox, SortDirection } from '../../../../ui/components/common/Table';
import { Pagination } from '../../../../ui/components/common/Pagination';
import { Tabs } from '../../../../ui/components/common/Tabs';
import { getPageFetchLimit } from '../../../../logic/services/fetchingCenter';
import { pembelianService } from '../../../../logic/services/pembelianService';
import { penjualanService } from '../../../../logic/services/penjualanService';
import { IPembelian, TPembelianStatus } from '../../../../logic/types/ITs_Pembelian';
import { Edit, Trash2, ClipboardList, CheckCircle2, AlertCircle, ShoppingBag, User, Calendar, ArrowRight, Box, Truck, PackageOpen, PackageCheck } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../../../ui/components/common/Card';
import { Modal } from '../../../../ui/components/common/Modal';
import { Badge } from '../../../../ui/components/elements/Badge';
import { NotificationBadge } from '../../../../ui/components/elements/NotificationBadge';
import { GhostButton, DangerButton, PrimaryButton, SecondaryButton } from '../../../../ui/components/elements/Button';
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
 * PEMBELIAN PAGE
 * Halaman utama untuk manajemen data Pembelian (Procurement).
 */
export const PembelianPage: React.FC = () => {
  const navigate = useNavigate();
  const { state, refreshNotifications } = useGlobalState();
  const { isMobile } = state.viewport;

  const [activeTab, setActiveTab] = useState('Biasa');
  const [data, setData] = useState<(IPembelian & { 
    supplier_name?: string; 
    customer_name?: string; 
    bank_and_cash_nama?: string; 
    is_processed_pengeluaran?: boolean; 
    has_paid_liabilitas?: boolean;
    total_produk_pembelian?: number;
    total_produk_diterima?: number;
  })[]>([]);
  const [dropshipData, setDropshipData] = useState<any[]>([]);
  const [dropshipCount, setDropshipCount] = useState(0);
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
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
  const limit = getPageFetchLimit('DaftarPembelian') || 15;

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    refreshNotifications();
    
    // Always fetch dropship count for badge
    const allDropshipItems = await penjualanService.getApprovedDropshipItems();
    const allPembelianFull = (await pembelianService.getPaginated(1, '', { limit: 5000 })).items;

    // Filter out those already in pembelian
    const pendingDropshipItems = allDropshipItems.filter(ds => 
      !allPembelianFull.some(p => p.additional_description && p.additional_description.includes(ds.invoice_number))
    );

    // Count unique invoices for the badge
    const uniqueInvoicesCount = new Set(pendingDropshipItems.map(item => item.invoice_number)).size;
    setDropshipCount(uniqueInvoicesCount);

    if (activeTab === 'Biasa') {
      const { items, total } = await pembelianService.getPaginated(
        page,
        searchTerm,
        {
          limit,
          sortKey: sortConfig.key,
          sortDir: sortConfig.direction === 'asc' ? 'asc' : 'desc',
          startDate: dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
          endDate: dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
        }
      );
      setData(items);
      setTotalItems(total);
    } else {
      // Dropship tab
      setDropshipData(pendingDropshipItems);
      setTotalItems(uniqueInvoicesCount);
    }
    setIsLoading(false);
  }, [activeTab, page, limit, searchTerm, sortConfig, dateRange]);

  // Grouping dropship data by invoice number
  const groupedDropship = React.useMemo(() => {
    const groups: Record<string, {
      invoice_number: string;
      customer_name: string;
      customer_id: string;
      penjualan_id: string;
      datetime: string;
      items: any[];
    }> = {};

    const filtered = dropshipData;

    filtered.forEach(item => {
      const invNum = item.invoice_number;
      if (!invNum) return;
      
      if (!groups[invNum]) {
        groups[invNum] = {
          invoice_number: invNum,
          customer_name: item.customer_name || 'Umum',
          customer_id: item.customer_id,
          penjualan_id: item.penjualan_id,
          datetime: item.datetime || '',
          items: []
        };
      }
      groups[invNum].items.push(item);
    });

    // Apply search filter on the grouped results
    return Object.values(groups).filter(invoice => 
        invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.items.some(it => it.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [dropshipData, searchTerm]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle Date Range Change
  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
    setSearchTerm(''); // Reset search input when date range is used
    setPage(1);
  };

  // Reset page when search or sort configuration changes
  useEffect(() => {
    setPage(1);
  }, [searchTerm, sortConfig]);

  const handleDelete = async (id: string, poNumber: string) => {
    swalConfig.fire({
      title: 'Hapus Transaksi Pembelian?',
      text: `Transaksi ${poNumber} beserta rincian produk dan biaya di dalamnya akan dihapus permanen!`,
      icon: 'error',
      showCancelButton: true,
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal',
      confirmButtonColor: tokens.semantic.colors.light.FeedbackColorError,
    }).then(async (result) => {
      if (result.isConfirmed) {
        const success = await pembelianService.delete(id);
        if (success) {
          swalToast.fire({ icon: 'success', title: 'Transaksi berhasil dihapus' });
          fetchData();
        } else {
          swalToast.fire({ icon: 'error', title: 'Gagal menghapus transaksi' });
        }
      }
    });
  };

  const handleMassDelete = () => {
    swalConfig.fire({
      title: 'Hapus Transaksi Terpilih?',
      text: `Anda akan menghapus ${selectedIds.length} transaksi secara massal beserta rinciannya. Tindakan ini tidak dapat dibatalkan!`,
      icon: 'error',
      showCancelButton: true,
      confirmButtonText: 'Ya, Hapus Semua',
      cancelButtonText: 'Batal',
      confirmButtonColor: tokens.semantic.colors.light.FeedbackColorError,
    }).then(async (result) => {
      if (result.isConfirmed) {
        const success = await pembelianService.deleteMany(selectedIds);
        if (success) {
          swalToast.fire({ icon: 'success', title: `${selectedIds.length} Transaksi berhasil dihapus` });
          setSelectedIds([]);
          fetchData();
        } else {
          swalToast.fire({ icon: 'error', title: 'Gagal menghapus beberapa transaksi' });
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

  const handleSort = (key: string, direction: SortDirection) => {
    if (direction === null) {
      setSortConfig({ key: 'datetime', direction: 'desc' });
    } else {
      setSortConfig({ key, direction });
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

  const getStatusBadge = (row: (IPembelian & { 
    has_internal_shipping?: boolean;
    total_produk_pembelian?: number;
    total_produk_diterima?: number;
  })) => {
    const totalProduk = row.total_produk_pembelian || 0;
    const totalDiterima = row.total_produk_diterima || 0;

    // 1. Logic Penerimaan (Receipt Status) - Highest Priority
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

    // 2. Logic Dropship (Priority 2)
    if (row.penjualan_id) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 border border-purple-200">
          <ShoppingBag size={12} />
          Dropship
        </span>
      );
    }

    // 3. Logic Kirim (Internal shipping detected)
    if (row.has_internal_shipping && row.shipping_type === 'Internal') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200">
          <Truck size={12} />
          Kirim
        </span>
      );
    }

    // 4. Base Status
    switch (row.status) {
      case TPembelianStatus.DRAFT:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
            <Box size={12} />
            Muat
          </span>
        );
      case TPembelianStatus.PENDING:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <AlertCircle size={12} />
            Pending
          </span>
        );
      case TPembelianStatus.COMPLETED:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 size={12} />
            Selesai
          </span>
        );
      case TPembelianStatus.CANCELLED:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            <AlertCircle size={12} />
            Batal
          </span>
        );
      default:
        return row.status;
    }
  };

  return (
    <MainShell
      title="Manajemen Pembelian"
      subtitle="Kelola pesanan pembelian (PO) dan pengadaan bahan baku"
      onAdd={() => navigate('/pengadaan/pembelian/tambah')}
      onSearchChange={(val) => setSearchTerm(val)}
      hideDownload={true}
      hideHeaderDivider={true}
      id="pembelian-main-page"
      isLoading={isLoading && data.length === 0}
    >
      <div className="w-full space-y-4">
        {/* Search & Bulk Action Section */}
        <Tabs
          tabs={[
            { id: 'Biasa', label: 'Riwayat Pembelian' },
            { 
              id: 'Dropship', 
              label: (
                <div className="flex items-center gap-2">
                  <span>Permintaan Dropship</span>
                  <NotificationBadge count={dropshipCount} />
                </div>
              ) 
            }
          ]}
          activeTab={activeTab}
          onChange={(id) => { setActiveTab(id as string); setPage(1); }}
          variant="underline"
          className="mb-4"
        />

        {/* Search Section */}
        <div className={cn("flex items-center justify-between gap-3", isMobile && "flex-col items-stretch")}>
          <div className={cn(isMobile ? "w-full" : "w-1/3")}>
            <SearchInput
              id="pembelian-search-input"
              value={searchTerm}
              onSearch={(val) => setSearchTerm(val)}
              placeholder={`Cari ${activeTab === 'Biasa' ? 'PO' : 'Invoice'}...`}
              className="bg-ColorBg !rounded-RadiusMedium !border-ColorPrimary/25 hover:!border-ColorPrimary focus:!border-ColorPrimary focus-visible:!border-ColorPrimary focus:!ring-0 focus-visible:!ring-0 transition-all shadow-sm"
            />
          </div>

          <div className={cn(isMobile ? "w-full" : "flex-shrink-0")}>
            {activeTab === 'Biasa' && (
              <DateRangePicker
                date={dateRange}
                onDateChange={handleDateRangeChange}
                placeholder="Filter Tanggal..."
                className="w-full"
              />
            )}
          </div>
        </div>

        {/* Responsive Content Section */}
        {activeTab === 'Biasa' ? (
          <>
            <Table id="pembelian-table" noBorder={true}>
              <TableHeader>
                <TableRow noBorder={true} isHeader={true}>
                  <TableHead
                    isSortable={true}
                    sortDirection={sortConfig.key === 'datetime' ? sortConfig.direction : null}
                    onSort={(dir) => handleSort('datetime', dir)}
                  >
                    Tanggal
                  </TableHead>
                  <TableHead
                    isSortable={true}
                    sortDirection={sortConfig.key === 'po_number' ? sortConfig.direction : null}
                    onSort={(dir) => handleSort('po_number', dir)}
                  >
                    No PO
                  </TableHead>
                  <TableHead
                    isSortable={true}
                    sortDirection={sortConfig.key === 'supplier_name' ? sortConfig.direction : null}
                    onSort={(dir) => handleSort('supplier_name', dir)}
                  >
                    Supplier
                  </TableHead>
                  <TableHead
                    isSortable={true}
                    sortDirection={sortConfig.key === 'customer_name' ? sortConfig.direction : null}
                    onSort={(dir) => handleSort('customer_name', dir)}
                  >
                    Tujuan
                  </TableHead>
                  <TableHead
                    isSortable={true}
                    sortDirection={sortConfig.key === 'grand_total_price' ? sortConfig.direction : null}
                    onSort={(dir) => handleSort('grand_total_price', dir)}
                  >
                    Total Belanja
                  </TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="w-24 text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, idx) => (
                    <TableRow key={`skeleton-${idx}`} noBorder={true}>
                      <TableCell noBorder={true} className="px-SpacingBase py-4"><Skeleton className="h-4 w-28" /></TableCell>
                      <TableCell noBorder={true} className="px-SpacingBase py-4"><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell noBorder={true} className="px-SpacingBase py-4"><Skeleton className="h-4 w-40" /></TableCell>
                      <TableCell noBorder={true} className="px-SpacingBase py-4"><Skeleton className="h-4 w-36" /></TableCell>
                      <TableCell noBorder={true} className="px-SpacingBase py-4"><Skeleton className="h-4 w-24 mx-auto" /></TableCell>
                      <TableCell noBorder={true} className="px-SpacingBase py-4"><Skeleton className="h-6 w-16 mx-auto rounded-full" /></TableCell>
                      <TableCell noBorder={true} className="px-SpacingBase py-4"><Skeleton className="h-8 w-8 mx-auto rounded-md" /></TableCell>
                    </TableRow>
                  ))
                ) : data.length > 0 ? (
                  data.map((row) => (
                    <TableRow
                      key={row.id}
                      noBorder={true}
                      className="cursor-pointer select-none hover:bg-ColorBgSecondary/OpacitySubtle transition-colors"
                      onClick={() => navigate(`/pengadaan/pembelian/detail/${row.id}?referrer=/pengadaan/pembelian`)}
                    >
                      <TableCell noBorder={true} className="!text-left px-SpacingBase py-3 text-FontSizeXs">
                        {formatTanggal(row.datetime)}
                      </TableCell>
                      <TableCell noBorder={true} className="!text-left px-SpacingBase py-3">
                        <span className="font-semibold text-FontSizeXs text-TextColorBase">
                          {row.po_number}
                        </span>
                      </TableCell>
                      <TableCell noBorder={true} className="!text-left px-SpacingBase text-FontSizeXs">
                        {row.supplier_name || 'Tidak Ada Suplier'}
                      </TableCell>
                      <TableCell noBorder={true} className="!text-left px-SpacingBase text-FontSizeXs">
                        {row.customer_name || 'Internal'}
                      </TableCell>
                      <TableCell noBorder={true} className="text-center font-semibold !text-FontSizeXs text-TextColorBase">
                        {formatCurrency(row.grand_total_price)}
                      </TableCell>
                      <TableCell noBorder={true} className="text-center text-FontSizeXs">
                        {getStatusBadge(row)}
                      </TableCell>
                      <TableCell noBorder={true} onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-SpacingTiny">
                          {!(row.is_processed_pengeluaran || row.has_paid_liabilitas || (row.has_internal_shipping && row.shipping_type === 'Internal')) && (
                            <>
                              <GhostButton size="sm" onClick={() => navigate(`/pengadaan/pembelian/edit/${row.id}`)} title="Edit">
                                <Edit size="1rem" className="text-ColorSecondary" />
                              </GhostButton>
                              <GhostButton size="sm" onClick={() => handleDelete(row.id, row.po_number)} title="Hapus">
                                <Trash2 size="1rem" className="text-FeedbackColorError" />
                              </GhostButton>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow noBorder={true}>
                    <TableCell colSpan={7} noBorder={true} className="h-48 text-TextColorMuted italic text-center">
                      Data transaksi pembelian tidak ditemukan
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
              id="pembelian-pagination"
            />
          </>
        ) : (
          <div className="space-y-6">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-SpacingMedium">
                {[1, 2, 3].map(i => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-20 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : groupedDropship.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-SpacingMedium">
                {groupedDropship.map((invoice) => (
                  <Card 
                    key={invoice.invoice_number} 
                    className="hover:border-ColorPrimary/50 cursor-pointer overflow-hidden border border-transparent"
                    onClick={() => setSelectedInvoice(invoice)}
                  >
                    <CardHeader className="bg-ColorPrimary/5 pb-SpacingSmall">
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col">
                          <CardTitle className="text-FontSizeBase text-ColorPrimary flex items-center gap-2">
                            {invoice.invoice_number}
                          </CardTitle>
                          <CardDescription className="flex items-center !text-FontSizeXs gap-1 mt-1">
                            <Calendar size={12} />
                            {formatTanggal(invoice.datetime)}
                          </CardDescription>
                        </div>
   
                      </div>
                    </CardHeader>
                    <div className="p-SpacingMedium pt-0 flex justify-end">
                      <GhostButton size="sm" className="text-ColorPrimary font-bold text-FontSizeNano uppercase tracking-widest flex items-center gap-1">
                        Proses Pembelian <ArrowRight size={12} />
                      </GhostButton>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="bg-ColorBgSecondary/opacity-OpacitySubtle border border-dashed border-ColorSidebarBorder/30 rounded-RadiusLarge p-SpacingHuge flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-ColorBg rounded-RadiusFull flex items-center justify-center shadow-ElevationLow mb-SpacingMedium">
                  <ShoppingBag size={32} className="text-TextColorMuted" />
                </div>
                <h3 className="text-FontSizeH4 font-bold text-TextColorBase mb-SpacingNano">Belum Ada Dropship</h3>
                <p className="text-TextColorMuted max-w-xs mx-auto">Tidak ada data dropship yang disetujui (Approved) dan belum diproses di modul Pembelian.</p>
              </div>
            )}
          </div>
        )}

        {/* Modal Detail Dropship */}
        {selectedInvoice && (
          <Modal
            isOpen={!!selectedInvoice}
            onClose={() => setSelectedInvoice(null)}
            title={`DETAIL PESANAN DROPSHIP - ${selectedInvoice.invoice_number}`}
            id="dropship-detail-modal"
            footer={
              <div className={cn("flex w-full items-center justify-end", isMobile ? "gap-SpacingSmall" : "gap-SpacingSmall")}>
                <div className="flex gap-SpacingSmall">
                  <SecondaryButton onClick={() => setSelectedInvoice(null)}>Tutup</SecondaryButton>
                  <PrimaryButton onClick={() => navigate(`/pengadaan/pembelian/tambah?source_invoice=${selectedInvoice.invoice_number}&source_id=${selectedInvoice.penjualan_id}`)}>
                    Buat Pembelian
                  </PrimaryButton>
                </div>
              </div>
            }
          >
            <div className={cn(isMobile ? "space-y-SpacingBase" : "space-y-SpacingMedium")}>
              <div className={cn("grid grid-cols-1 md:grid-cols-2 bg-ColorBgSecondary/OpacitySubtle rounded-RadiusMedium", isMobile ? "gap-SpacingSmall p-SpacingBase" : "gap-SpacingMedium p-SpacingBase")}>
                <div className="flex items-start gap-3">
                  <User size={18} className="text-ColorPrimary mt-1" />
                  <div>
                    <label className="text-FontSizeNano uppercase font-bold text-TextColorMuted block">Customer</label>
                    <span className={cn("font-medium", isMobile ? "text-FontSizeSm" : "text-FontSizeBase")}>{selectedInvoice.customer_name}</span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar size={18} className="text-ColorPrimary mt-1" />
                  <div>
                    <label className="text-FontSizeNano uppercase font-bold text-TextColorMuted block">Tanggal Transaksi</label>
                    <span className={cn(isMobile ? "text-FontSizeSm" : "text-FontSizeBase")}>{formatTanggal(selectedInvoice.datetime)}</span>
                  </div>
                </div>
              </div>

              <div className={isMobile ? "space-y-SpacingBase" : "space-y-3"}>
                <h4 className={cn("font-bold uppercase tracking-wider text-TextColorMuted", isMobile ? "text-[0.65rem]" : "text-FontSizeSm")}>Daftar Produk yang Harus Dibeli</h4>
                <div className="rounded-RadiusMedium overflow-hidden border border-ColorSidebarBorder/20">
                  <Table id="modal-dropship-items" noBorder={true}>
                    <TableHeader className="bg-ColorPrimary">
                      <TableRow isHeader={true} noBorder={true}>
                        <TableHead className={cn("!text-TextColorBase", isMobile ? "text-FontSizeNano py-2 px-SpacingTiny" : "py-3 px-SpacingMedium")}>Produk</TableHead>
                        <TableHead className={cn("!text-TextColorBase text-center", isMobile ? "text-FontSizeNano py-2 px-SpacingTiny" : "py-3 px-SpacingMedium")}>Satuan</TableHead>
                        <TableHead className={cn("!text-TextColorBase text-center", isMobile ? "text-FontSizeNano py-2 px-SpacingTiny" : "py-3 px-SpacingMedium")}>Qty</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedInvoice.items.map((item: any, idx: number) => (
                        <TableRow key={idx} noBorder={idx === selectedInvoice.items.length - 1}>
                          <TableCell className={cn("!text-left", isMobile ? "px-SpacingBase py-SpacingSmall" : "px-SpacingMedium py-3")}>
                            <div className="flex flex-col">
                              <span className={cn("font-bold text-TextColorBase", isMobile ? "text-FontSizeXs leading-tight" : "text-FontSizeSm")}>{item.name}</span>
                              {(item.kategori || item.sub_kategori) && (
                                <span className="text-[0.6rem] text-TextColorMuted leading-tight mt-0.5">
                                  {item.kategori || '-'}{item.sub_kategori ? ` > ${item.sub_kategori}` : ''}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className={cn("text-center font-medium", isMobile ? "text-FontSizeXs px-SpacingSmall" : "text-FontSizeSm")}>{item.unit}</TableCell>
                          <TableCell className={cn("text-center font-bold text-TextColorBase", isMobile ? "text-FontSizeXs px-SpacingSmall" : "text-FontSizeSm")}>{item.qty}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </MainShell>
  );
};

export default PembelianPage;
