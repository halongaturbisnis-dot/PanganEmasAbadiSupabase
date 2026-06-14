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
import { stokMasukService } from '../../../logic/services/stokMasukService';
import { IStokMasuk } from '../../../logic/types/ITs_StokMasuk';
import { Package, Calendar, Search, ArrowDownCircle, History, Info, Layers, Beaker, Plus } from 'lucide-react';
import { SearchInput } from '../../../ui/components/elements/Inputs';
import { Skeleton } from '../../../ui/components/elements/Skeleton';
import { Badge } from '../../../ui/components/elements/Badge';
import { PrimaryButton } from '../../../ui/components/elements/Button';
import { NotificationBadge } from '../../../ui/components/elements/NotificationBadge';
import { cn } from '../../../logic/utils/cn';
import { useGlobalState } from '../../../logic/context/GlobalContext';
import { formatDate, formatDateDisplay } from '../../../logic/utils/date';
import { formatCurrency } from '../../../logic/utils/data';
import { StokMasukFormModal } from './StokMasukFormModal';
import { StokMasukDetailModal } from './StokMasukDetailModal';

/**
 * STOK MASUK PAGE
 * Halaman utama untuk manajemen Stok Masuk.
 * Memiliki dua tab: Antrian Masuk (dari Penerimaan) dan Daftar Masuk (History).
 */
export const StokMasukPage: React.FC = () => {
  const navigate = useNavigate();
  const { state, refreshNotifications } = useGlobalState();
  const { isMobile } = state.viewport;
  const { queueStokMasukCount } = state.notifications;
  
  const [activeTab, setActiveTab] = useState('queue'); // 'queue' | 'history'
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const limit = getPageFetchLimit('DaftarStokMasuk');

  // Modal integration states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedQueueItem, setSelectedQueueItem] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedStokMasukId, setSelectedStokMasukId] = useState<string | undefined>(undefined);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'queue') {
        const items = await stokMasukService.getQueue();
        const filtered = items.filter(item => 
          (item.name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (item.sku?.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (item.kode_pembelian?.toLowerCase().includes(searchTerm.toLowerCase()))
        );
        setTotalItems(filtered.length);
        const offset = (page - 1) * limit;
        setData(filtered.slice(offset, offset + limit));
      } else {
        const startDate = dateRange?.from ? formatDateLocal(dateRange.from) : undefined;
        const endDate = dateRange?.to ? formatDateLocal(dateRange.to) : (dateRange?.from ? formatDateLocal(dateRange.from) : undefined);
        
        const { items, total } = await stokMasukService.getPaginated(page, limit, searchTerm, startDate, endDate);
        setData(items);
        setTotalItems(total);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, activeTab, page, limit, dateRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, activeTab, dateRange]);

  const tabs = [
    { 
      id: 'queue', 
      label: (
        <div className="flex items-center gap-2">
          <span>Antrian Masuk</span>
          <NotificationBadge count={queueStokMasukCount} id="stok-masuk-queue-badge" />
        </div>
      )
    },
    { id: 'history', label: 'Daftar Masuk' },
  ];

  return (
    <MainShell 
      title="Stok Masuk" 
      subtitle="Manajemen aliran stok barang masuk dan pembaruan valuasi rata-rata"
      onSearchChange={(val) => setSearchTerm(val)}
      hideDownload={true}
      hideHeaderDivider={true}
      id="stok-masuk-main-page"
    >
      <div className="w-full space-y-[1.25rem]">
        <div className={cn("flex items-center justify-between gap-[1rem]", isMobile && "flex-col items-stretch")}>
          <Tabs 
            id="stok-masuk-tabs" 
            activeTab={activeTab} 
            tabs={tabs} 
            onChange={(id) => setActiveTab(String(id))}
            variant="underline"
          />
          
          <div className={cn("flex flex-1 items-center gap-[0.75rem]", !isMobile && "justify-end")}>
            {activeTab === 'history' && (
              <div className={cn(isMobile ? "w-full" : "w-auto min-w-[200px]")}>
                <DateRangePicker
                  date={dateRange}
                  onDateChange={setDateRange}
                  placeholder="Filter Waktu Masuk..."
                  className="w-full"
                />
              </div>
            )}
            
            {activeTab === 'queue' && (
              <PrimaryButton
                id="stok-masuk-tambah-btn"
                onClick={() => {
                  setSelectedQueueItem(null);
                  setIsModalOpen(true);
                }}
                icon={<Plus size={16} />}
                className="whitespace-nowrap"
              >
                Tambah
              </PrimaryButton>
            )}
          </div>
        </div>

        <div className={cn("flex items-center gap-[0.75rem]", isMobile && "flex-col items-stretch")}>
          <div className={cn(isMobile ? "w-full" : "w-1/3")}>
            <SearchInput 
              id="stok-masuk-search-input"
              value={searchTerm}
              onSearch={(val) => setSearchTerm(val)}
              placeholder={activeTab === 'queue' ? "Cari Produk, SKU, atau PO..." : "Cari di histori stok masuk..."}
              className="bg-white !rounded-[0.75rem] !border-[#1e3a34]/25 hover:!border-[#1e3a34] focus:!border-[#1e3a34] focus-visible:!border-[#1e3a34] focus:!ring-0 focus-visible:!ring-0 transition-all shadow-sm"
            />
          </div>
        </div>

        <Table id="stok-masuk-table" noBorder={true}>
          <TableHeader>
            <TableRow noBorder={true} isHeader={true}>
              {activeTab === 'queue' ? (
                <>
                  <TableHead>Nama Produk</TableHead>
                  <TableHead>Satuan</TableHead>
                  <TableHead>Kuanititi</TableHead>
                  <TableHead>No PO</TableHead>
                  <TableHead>Sumber</TableHead>
                </>
              ) : (
                <>
                  <TableHead>Waktu Pencatatan</TableHead>
                  <TableHead>Nama Produk</TableHead>
                  <TableHead>Satuan</TableHead>
                  <TableHead>Kuanititi</TableHead>
                  <TableHead>No PO</TableHead>
                  <TableHead>Sumber</TableHead>
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
                </TableRow>
              ))
            ) : data.length > 0 ? (
              data.map((row, idx) => (
                <TableRow 
                  key={row.id || `${row.receiving_id}-${row.processing_id || 'null'}-${row.purchase_product_id}-${idx}`} 
                  noBorder={true} 
                  className="cursor-pointer select-none group hover:bg-[#f8fafc] transition-colors"
                  onClick={() => {
                    if (activeTab === 'queue') {
                      setSelectedQueueItem(row);
                      setIsModalOpen(true);
                    } else {
                      setSelectedStokMasukId(row.id);
                      setIsDetailModalOpen(true);
                    }
                  }}
                >
                  {activeTab === 'queue' ? (
                    <>
                      <TableCell noBorder={true} className="!text-left px-[1rem]">
                        <div className="flex flex-col">
                          <span className="text-[0.875rem] font-bold text-[#1e293b] leading-tight">
                            {row.name}
                          </span>
                          <span className="text-[#64748b] text-[0.7rem] mt-[0.25rem]">
                            {row.category}{row.sub_category ? ` > ${row.sub_category}` : ''}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell noBorder={true} className="!text-left px-[1rem]">
                        <span className="text-[0.875rem] font-medium text-[#1e293b]">{row.unit || '-'}</span>
                      </TableCell>
                      <TableCell noBorder={true} className="!text-left px-[1rem]">
                        <span className="text-[0.875rem] font-bold text-[#1e293b]">
                          {(Number(row.qty_max) || 0) - (Number(row.qty_already_in) || 0)}
                        </span>
                      </TableCell>
                      <TableCell noBorder={true} className="!text-left px-[1rem]">
                        <div className="flex flex-col gap-[0.25rem]">
                          <span className="text-[0.875rem] font-bold text-[#1e293b]">{row.kode_pembelian || '-'}</span>
                          <div className="flex items-center gap-[0.375rem] text-[0.7rem] text-[#64748b]">
                            <Calendar size={12} className="shrink-0" />
                            <span>{formatDate(row.receipt_date)}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell noBorder={true} className="!text-left px-[1rem]">
                        <Badge className={cn(
                          "text-[0.625rem] px-[0.5rem] py-[0.125rem] font-bold tracking-wider rounded-full",
                          row.source_type === 'penerimaan' 
                            ? "bg-amber-100 text-amber-800 border-amber-200" 
                            : "bg-purple-100 text-purple-800 border-purple-200"
                        )}>
                          {row.source_type === 'penerimaan' ? 'PENERIMAAN' : 'PEMROSESAN'}
                        </Badge>
                      </TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell noBorder={true} className="!text-left px-[1rem]">
                        {(() => {
                          const { date, time } = formatDateDisplay(row.created_at);
                          return (
                            <div className="flex flex-col">
                              <span className="text-[0.875rem] font-bold text-[#1e3a34]">{date}</span>
                              <span className="text-[0.7rem] text-[#64748b]">{time}</span>
                            </div>
                          );
                        })()}
                      </TableCell>
                      <TableCell noBorder={true} className="!text-left px-[1rem]">
                        <div className="flex flex-col">
                          <span className="text-[0.875rem] font-bold text-[#1e293b] leading-tight">
                            {row.name}
                          </span>
                          <span className="text-[#64748b] text-[0.7rem] mt-[0.25rem]">
                            {row.category}{row.sub_category ? ` > ${row.sub_category}` : ''}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell noBorder={true} className="!text-left px-[1rem]">
                        <span className="text-[0.875rem] font-medium text-[#1e293b]">{row.unit || '-'}</span>
                      </TableCell>
                      <TableCell noBorder={true} className="!text-left px-[1rem]">
                        <span className="text-[0.875rem] font-bold text-[#1e293b]">
                          {Number(row.qty_in) || 0}
                        </span>
                      </TableCell>
                      <TableCell noBorder={true} className="!text-left px-[1rem]">
                        <span className="text-[0.875rem] font-bold text-[#1e293b]">{row.kode_pembelian || '-'}</span>
                      </TableCell>
                      <TableCell noBorder={true} className="!text-left px-[1rem]">
                        <Badge className={cn(
                          "text-[0.625rem] px-[0.5rem] py-[0.125rem] font-bold tracking-wider rounded-full",
                          !row.processing_id 
                            ? "bg-amber-100 text-amber-800 border-amber-200" 
                            : "bg-purple-100 text-purple-800 border-purple-200"
                        )}>
                          {!row.processing_id ? 'PENERIMAAN' : 'PEMROSESAN'}
                        </Badge>
                      </TableCell>
                    </>
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow noBorder={true}>
                <TableCell colSpan={activeTab === 'queue' ? 5 : 6} noBorder={true} className="h-[12rem] text-[#64748b] italic text-center">
                  <div className="flex flex-col items-center justify-center gap-2 opacity-60">
                    <History size={48} className="text-[#cbd5e1]" />
                    <p>Tidak ada data {activeTab === 'queue' ? 'antrian' : 'histori'} untuk ditampilkan</p>
                  </div>
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
          className="mt-[1.5rem]"
          id="stok-masuk-pagination"
        />

        <StokMasukFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            fetchData();
            refreshNotifications();
          }}
          queueItem={selectedQueueItem}
        />

        <StokMasukDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          stokMasukId={selectedStokMasukId}
        />
      </div>
    </MainShell>
  );
};

export default StokMasukPage;
