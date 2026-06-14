import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainShell } from '../../../ui/components/common/shells/MainShell';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell, SortDirection } from '../../../ui/components/common/Table';
import { Pagination } from '../../../ui/components/common/Pagination';
import { Tabs } from '../../../ui/components/common/Tabs';
import { DateRangePicker } from '../../../ui/components/elements/DateRangePicker';
import { DateRange } from 'react-day-picker';
import { formatDateLocal } from '../../../logic/utils/date';
import { getPageFetchLimit } from '../../../logic/services/fetchingCenter';
import { penerimaanService } from '../../../logic/services/penerimaanService';
import { ITs_Penerimaan } from '../../../logic/types/ITs_Penerimaan';
import { Package, Calendar, User, Search, Store, Truck } from 'lucide-react';
import { Badge } from '../../../ui/components/elements/Badge';
import { SearchInput } from '../../../ui/components/elements/Inputs';
import { Skeleton } from '../../../ui/components/elements/Skeleton';
import { swalConfig, toast as swalToast } from '../../../logic/utils/swalConfig';
import { tokens } from '../../../ui/styles/tokens';
import { cn } from '../../../logic/utils/cn';
import { useGlobalState } from '../../../logic/context/GlobalContext';
import { formatDateFull as formatDateTime, formatDate } from '../../../logic/utils/date';

/**
 * PENERIMAAN PAGE
 * Halaman utama untuk manajemen data Penerimaan (Receipt).
 */
export const PenerimaanPage: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useGlobalState();
  const { isMobile } = state.viewport;
  
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'received'
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
  const limit = getPageFetchLimit('DaftarPenerimaan');

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'pending') {
        const items = await penerimaanService.getPending();
        // Filter search term client-side for pending
        const filtered = items.filter(item => 
          (item.nama_produk?.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (item.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (item.kode_pembelian?.toLowerCase().includes(searchTerm.toLowerCase()))
        );
        setTotalItems(filtered.length);
        // Client-side pagination for pending too if needed, but usually limited anyway
        const offset = (page - 1) * limit;
        setData(filtered.slice(offset, offset + limit));
      } else {
        const startDate = dateRange?.from ? formatDateLocal(dateRange.from) : undefined;
        const endDate = dateRange?.to ? formatDateLocal(dateRange.to) : (dateRange?.from ? formatDateLocal(dateRange.from) : undefined);
        
        const result = await penerimaanService.getPaginated(page, limit, searchTerm, sortConfig.key, sortConfig.direction, startDate, endDate);
        setData(result.items);
        setTotalItems(result.total);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, activeTab, page, limit, dateRange, sortConfig]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Reset ke halaman 1 jika mencari atau menyortir
  useEffect(() => {
    setPage(1);
  }, [searchTerm, sortConfig, activeTab, dateRange]);

  const tabs = [
    { id: 'pending', label: 'Belum Diterima' },
    { id: 'received', label: 'Sudah Diterima' },
  ];

  return (
    <MainShell 
      title="Penerimaan Barang" 
      subtitle="Kelola penerimaan produk dari pengiriman internal"
      onSearchChange={(val) => setSearchTerm(val)}
      hideDownload={true}
      hideHeaderDivider={true}
      id="penerimaan-main-page"
    >
      <div className="w-full space-y-[1.25rem]">
        <Tabs 
          id="penerimaan-tabs" 
          activeTab={activeTab} 
          tabs={tabs} 
          onChange={(id) => setActiveTab(String(id))}
          variant="underline"
        />

        <div className={cn("flex items-center gap-[0.75rem]", isMobile && "flex-col items-stretch")}>
          <div className={cn(isMobile ? "w-full" : "w-1/3")}>
            <SearchInput 
              id="penerimaan-search-input"
              value={searchTerm}
              onSearch={(val) => setSearchTerm(val)}
              placeholder={activeTab === 'pending' ? "Cari Produk, PO, atau Supplier..." : "Cari di histori penerimaan..."}
              className="bg-white !rounded-[0.75rem] !border-[#1e3a34]/25 hover:!border-[#1e3a34] focus:!border-[#1e3a34] focus-visible:!border-[#1e3a34] focus:!ring-0 focus-visible:!ring-0 transition-all shadow-sm"
            />
          </div>

          {activeTab === 'received' && (
            <div className={cn("flex-1", !isMobile && "flex justify-end")}>
              <DateRangePicker 
                date={dateRange}
                onDateChange={setDateRange}
                placeholder="Filter Waktu Diterima"
                className="w-full md:w-auto"
              />
            </div>
          )}
        </div>

        <Table id="penerimaan-table" noBorder={true}>
          <TableHeader>
            <TableRow noBorder={true} isHeader={true}>
              {activeTab === 'pending' ? (
                <>
                  <TableHead>Nama Produk</TableHead>
                  <TableHead>Satuan</TableHead>
                  <TableHead>Kuantitas</TableHead>
                  <TableHead>Kadar Air</TableHead>
                  <TableHead>No. PO / Tanggal</TableHead>
                  <TableHead>Jenis Pengiriman</TableHead>
                </>
              ) : (
                <>
                  <TableHead>Waktu Diterima</TableHead>
                  <TableHead>Nama Produk</TableHead>
                  <TableHead>Satuan</TableHead>
                  <TableHead>Qty Diterima</TableHead>
                  <TableHead>Qty Reject</TableHead>
                  <TableHead>Selisih Qty</TableHead>
                  <TableHead>No. PO / Tanggal</TableHead>
                </>
              )}
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
                  {activeTab === 'pending' && <TableCell noBorder={true}><Skeleton className="h-[2.5rem] w-full" /></TableCell>}
                </TableRow>
              ))
            ) : data.length > 0 ? (
              data.map((row) => (
                <TableRow 
                  key={row.id || `${row.shipping_id}-${row.purchase_product_id}`} 
                  noBorder={true} 
                  className="cursor-pointer select-none group hover:bg-[#f8fafc] transition-colors"
                  onClick={() => navigate(activeTab === 'pending' 
                    ? `/gudang/penerimaan/tambah?product_id=${row.purchase_product_id}&purchase_id=${row.purchase_id}&shipping_id=${row.shipping_id}` 
                    : `/gudang/penerimaan/detail/${row.id}`)}
                >
                  {activeTab === 'pending' ? (
                    <>
                      <TableCell noBorder={true} className="!text-left px-[1rem]">
                        <div className="flex flex-col">
                          <span className="text-[0.875rem] font-bold text-[#1e293b] leading-tight">
                            {row.nama_produk}
                          </span>
                          {(row.category || row.sub_category) && (
                            <span className="text-[#64748b] text-[0.7rem] leading-tight mt-0.5">
                              {row.category} {row.sub_category ? `> ${row.sub_category}` : ''}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell noBorder={true}>
                        <div className="text-[0.875rem] text-[#1e293b]">{row.unit}</div>
                      </TableCell>
                      <TableCell noBorder={true}>
                        <div className="text-[0.875rem] font-medium text-[#1e293b]">{row.purchase_qty}</div>
                      </TableCell>
                      <TableCell noBorder={true}>
                        <div className="text-[0.875rem] text-[#1e293b]">{row.kadar_air ? `${row.kadar_air}%` : '-'}</div>
                      </TableCell>
                      <TableCell noBorder={true} className="!text-left px-[1rem]">
                        <div className="flex flex-col">
                          <span className="text-[0.875rem] font-bold text-[#1e293b]">
                            {row.kode_pembelian || '-'}
                          </span>
                          <div className="flex items-center gap-1 text-[0.7rem] font-medium text-[#64748b] mt-0.5">
                            <Calendar size={12} />
                            {formatDate(row.po_date)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell noBorder={true} className="!text-left px-[1rem]">
                        <div className="flex items-center gap-1 text-[0.875rem] font-medium text-[#1e3a34]">
                          <Truck size={14} className="text-[#1e3a34]" />
                          {row.shipping_type}
                        </div>
                      </TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell noBorder={true} className="!text-left px-[1rem]">
                        <div className="flex flex-col">
                          <span className="text-[0.875rem] font-bold text-[#1e3a34]">{formatDate(row.datetime)}</span>
                          <span className="text-[0.7rem] text-[#64748b]">{row.datetime?.split(/[ T]/)[1]?.slice(0, 5) || ''}</span>
                        </div>
                      </TableCell>
                      <TableCell noBorder={true} className="!text-left px-[1rem]">
                        <div className="flex flex-col">
                          <span className="text-[0.875rem] font-bold text-[#1e293b] leading-tight">
                            {row.nama_produk}
                          </span>
                          {(row.category || row.sub_category) && (
                            <span className="text-[#64748b] text-[0.7rem] leading-tight mt-0.5">
                              {row.category} {row.sub_category ? `> ${row.sub_category}` : ''}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell noBorder={true}>
                        <div className="text-[0.875rem] text-[#1e293b]">{row.unit}</div>
                      </TableCell>
                      <TableCell noBorder={true}>
                        <div className="text-[0.875rem] font-bold text-[#1e293b]">{row.qty_received_actual}</div>
                      </TableCell>
                      <TableCell noBorder={true}>
                        <div className="text-[0.875rem] font-bold text-[#991b1b]">{row.qty_rejection}</div>
                      </TableCell>
                      <TableCell noBorder={true}>
                        <div className={cn("text-[0.875rem] font-bold", row.qty_diff > 0 ? "text-FeedbackColorWarning" : "text-gray-400")}>
                          {row.qty_diff}
                        </div>
                      </TableCell>
                      <TableCell noBorder={true} className="!text-left px-[1rem]">
                        <div className="flex flex-col">
                          <span className="text-[0.875rem] font-bold text-[#1e293b]">
                            {row.kode_pembelian || '-'}
                          </span>
                          <div className="flex items-center gap-1 text-[0.7rem] font-medium text-[#64748b] mt-0.5">
                            <Calendar size={12} />
                            {formatDate(row.po_date)}
                          </div>
                        </div>
                      </TableCell>
                    </>
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow noBorder={true}>
                <TableCell colSpan={activeTab === 'pending' ? 6 : 7} noBorder={true} className="h-[12rem] text-[#64748b] italic text-center">
                  Tidak ada data untuk ditampilkan
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <Pagination
          id="penerimaan-pagination"
          currentPage={page}
          totalPages={Math.ceil(totalItems / limit)}
          totalItems={totalItems}
          perPage={limit}
          onPageChange={(p) => setPage(p)}
          className="mt-[1.5rem]"
        />
      </div>
    </MainShell>
  );
};

export default PenerimaanPage;
