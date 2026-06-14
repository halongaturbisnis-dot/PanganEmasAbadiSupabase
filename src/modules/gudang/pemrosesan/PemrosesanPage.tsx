import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainShell } from '../../../ui/components/common/shells/MainShell';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../../../ui/components/common/Table';
import { Pagination } from '../../../ui/components/common/Pagination';
import { Tabs } from '../../../ui/components/common/Tabs';
import { DateRangePicker } from '../../../ui/components/elements/DateRangePicker';
import { DateRange } from 'react-day-picker';
import { formatDateLocal } from '../../../logic/utils/date';
import { getPageFetchLimit } from '../../../logic/services/fetchingCenter';
import { pemrosesanService } from '../../../logic/services/pemrosesanService';
import { penerimaanService } from '../../../logic/services/penerimaanService';
import { ITs_Pemrosesan } from '../../../logic/types/ITs_Pemrosesan';
import { Package, Calendar, Search, ClipboardList, Timer, CheckCircle2 } from 'lucide-react';
import { Skeleton } from '../../../ui/components/elements/Skeleton';
import { useGlobalState } from '../../../logic/context/GlobalContext';
import { formatDate } from '../../../logic/utils/date';
import { cn } from '../../../logic/utils/cn';
import { swalConfig, toast as swalToast } from '../../../logic/utils/swalConfig';

/**
 * PEMROSESAN PAGE
 * Halaman utama untuk modul Pemrosesan (Processing).
 * Memiliki 3 tab: Belum Diproses, Dalam Pemrosesan, Selesai Diproses.
 */
export const PemrosesanPage: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useGlobalState();
  const { isMobile } = state.viewport;
  
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'processing' | 'completed'
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = getPageFetchLimit('DaftarPemrosesan');

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'pending') {
        // Ambil data dari Penerimaan yang sudah diterima dan perlu diproses
        const items = await penerimaanService.getReadyForProcessing();
        // Filter search term client-side
        const filtered = items.filter(item => 
          (item.nama_produk?.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (item.kode_pembelian?.toLowerCase().includes(searchTerm.toLowerCase()))
        );
        setTotalItems(filtered.length);
        const offset = (page - 1) * limit;
        setData(filtered.slice(offset, offset + limit));
      } else {
        // Ambil dari pemrosesanService berdasarkan status
        const statusMap: Record<string, ITs_Pemrosesan['status']> = {
          'processing': 'processing',
          'completed': 'completed'
        };

        const startDate = dateRange?.from ? formatDateLocal(dateRange.from) : undefined;
        const endDate = dateRange?.to ? formatDateLocal(dateRange.to) : (dateRange?.from ? formatDateLocal(dateRange.from) : undefined);

        const result = await pemrosesanService.getPaginated(page, {
          limit,
          status: statusMap[activeTab],
          search: searchTerm,
          startDate,
          endDate
        });
        
        setData(result.items);
        setTotalItems(result.total);
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

  const handleStartProcess = async (row: any) => {
    const result = await swalConfig.fire({
      title: 'Mulai Pemrosesan?',
      text: `Produk ${row.nama_produk} akan dipindahkan ke daftar pemrosesan aktif.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Ya, Mulai',
      cancelButtonText: 'Batal'
    });

    if (result.isConfirmed) {
      setIsLoading(true);
      try {
        const payload = {
          pembelian_id: row.purchase_id,
          pembelian_produk_id: row.purchase_product_id,
          receiving_id: row.id,
          initial_valuation: row.accepted_valuation || 0,
          initial_qty: row.qty_received_actual || 0,
          initial_moisture: row.actual_moisture || 0,
          datetime: new Date().toISOString().slice(0, 16),
          jenis_pemrosesan: 'Batch Awal'
        };

        const newProcess = await pemrosesanService.create(payload as any);
        if (newProcess) {
          swalToast.fire({ icon: 'success', title: 'Batch Pemrosesan Dimulai' });
          setActiveTab('processing');
          fetchData();
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const formatLocalTime = (dateStr?: string) => {
    if (!dateStr) return '-';
    // Database stores as UTC. Append 'Z' to treat as UTC before browser conversion to local.
    const normalized = !dateStr.includes('Z') && !dateStr.includes('+') 
      ? `${dateStr.replace(' ', 'T')}Z` 
      : dateStr;
    return formatDate(normalized);
  };

  const formatLocalHours = (dateStr?: string) => {
    if (!dateStr) return '';
    const normalized = !dateStr.includes('Z') && !dateStr.includes('+') 
      ? `${dateStr.replace(' ', 'T')}Z` 
      : dateStr;
    const d = new Date(normalized);
    return isNaN(d.getTime()) ? '' : `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const tabs = [
    { id: 'pending', label: 'Belum Diproses' },
    { id: 'processing', label: 'Dalam Pemrosesan' },
    { id: 'completed', label: 'Selesai Diproses' },
  ];

  return (
    <MainShell 
      title="Pemrosesan Barang" 
      subtitle="Kelola aktivitas pengolahan dan penyusutan produk"
      onSearchChange={(val) => setSearchTerm(val)}
      hideDownload={true}
      hideHeaderDivider={true}
      id="pemrosesan-main-page"
    >
      <div className="w-full space-y-[1.25rem]">
        <Tabs 
          id="pemrosesan-tabs" 
          activeTab={activeTab} 
          tabs={tabs} 
          onChange={(id) => setActiveTab(String(id))}
          variant="underline"
        />

        {activeTab === 'completed' && (
          <div className={cn("w-full flex justify-end", isMobile && "justify-stretch")}>
            <DateRangePicker 
              date={dateRange}
              onDateChange={setDateRange}
              placeholder="Filter Waktu Selesai"
              className="w-full md:w-auto"
            />
          </div>
        )}

        <Table id="pemrosesan-table" noBorder={true}>
          <TableHeader>
            <TableRow noBorder={true} isHeader={true}>
              {activeTab === 'pending' && (
                <>
                  <TableHead className="!text-FontSizeXs">Nama Produk</TableHead>
                  <TableHead className="!text-FontSizeXs">Unit</TableHead>
                  <TableHead className="!text-FontSizeXs">Kuantiti Penerimaan</TableHead>
                  <TableHead className="!text-FontSizeXs">Kadar Air</TableHead>
                </>
              )}
              {activeTab === 'processing' && (
                <>
                  <TableHead className="!text-FontSizeXs">Waktu Mulai Pemrosesan</TableHead>
                  <TableHead className="!text-FontSizeXs">Nama Produk</TableHead>
                  <TableHead className="!text-FontSizeXs">Unit</TableHead>
                  <TableHead className="!text-FontSizeXs">Qty Penerimaan</TableHead>
                  <TableHead className="!text-FontSizeXs">Penyusutan</TableHead>
                  <TableHead className="!text-FontSizeXs">Qty Pasca Proses</TableHead>
                  <TableHead className="!text-FontSizeXs">Qty Masuk Stok</TableHead>
                  <TableHead className="!text-FontSizeXs">Qty Akhir Terkini</TableHead>
                </>
              )}
              {activeTab === 'completed' && (
                <>
                  <TableHead className="!text-FontSizeXs">Waktu Selesai Pemrosesan</TableHead>
                  <TableHead className="!text-FontSizeXs">Nama Produk</TableHead>
                  <TableHead className="!text-FontSizeXs">Unit</TableHead>
                  <TableHead className="!text-FontSizeXs">Qty Penerimaan</TableHead>
                  <TableHead className="!text-FontSizeXs">Penyusutan</TableHead>
                  <TableHead className="!text-FontSizeXs">Qty Pasca Proses</TableHead>
                  <TableHead className="!text-FontSizeXs">Qty Masuk Stok</TableHead>
                  <TableHead className="!text-FontSizeXs">Qty Akhir Terkini</TableHead>
                  <TableHead className="!text-FontSizeXs">Status</TableHead>
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
                  onClick={() => activeTab === 'pending' ? handleStartProcess(row) : navigate(`/gudang/pemrosesan/detail/${row.id}`)}
                >
                  {activeTab === 'pending' && (
                    <>
                      <TableCell noBorder={true} className="!text-left px-[1rem]">
                        <div className="flex flex-col">
                          <span className="!text-FontSizeXs font-bold text-TextColorBase leading-tight">
                            {row.nama_produk}
                          </span>
                          <span className="text-TextColorMuted !text-FontSizeNano leading-tight mt-0.5">
                            {row.category} {row.sub_category ? `> ${row.sub_category}` : ''}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell noBorder={true}>
                        <div className="!text-FontSizeXs text-TextColorBase">{row.unit}</div>
                      </TableCell>
                      <TableCell noBorder={true}>
                        <div className="!text-FontSizeXs font-medium text-TextColorBase">{row.qty_received_actual}</div>
                      </TableCell>
                      <TableCell noBorder={true}>
                        <div className="!text-FontSizeXs text-TextColorBase">{row.actual_moisture ? `${row.actual_moisture}%` : '-'}</div>
                      </TableCell>
                    </>
                  )}

                  {activeTab === 'processing' && (
                    <>
                      <TableCell noBorder={true} className="!text-left px-[1rem]">
                        <div className="flex flex-col">
                          <span className="!text-FontSizeXs font-bold text-TextColorBase">{formatLocalTime(row.datetime)}</span>
                          <span className="!text-FontSizeNano text-TextColorMuted">{formatLocalHours(row.datetime)}</span>
                        </div>
                      </TableCell>
                      <TableCell noBorder={true}>
                        <div className="flex flex-col">
                          <span className="!text-FontSizeXs font-bold text-TextColorBase leading-tight">
                            {row.nama_produk || '-'}
                          </span>
                          <span className="!text-FontSizeNano text-TextColorMuted">
                            {row.category} {row.sub_category ? `> ${row.sub_category}` : ''}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell noBorder={true}>
                        <div className="!text-FontSizeXs text-TextColorBase">{row.unit || '-'}</div>
                      </TableCell>
                      <TableCell noBorder={true}>
                        <div className="!text-FontSizeXs text-TextColorBase">{row.qty_sebelum || 0}</div>
                      </TableCell>
                      <TableCell noBorder={true}>
                        <div className="!text-FontSizeXs font-bold text-FeedbackColorError">{row.qty_penyusutan || 0}</div>
                      </TableCell>
                      <TableCell noBorder={true}>
                        <div className="!text-FontSizeXs font-semibold text-TextColorBase">
                          {(row.qty_sebelum || 0) - (row.qty_penyusutan || 0)}
                        </div>
                      </TableCell>
                      <TableCell noBorder={true}>
                        <div className="!text-FontSizeXs text-TextColorBase">
                          {row.qty_masuk_stok || 0}
                        </div>
                      </TableCell>
                      <TableCell noBorder={true}>
                        <div className="!text-FontSizeXs font-bold text-primary-700">
                          {Math.max(0, ((row.qty_sebelum || 0) - (row.qty_penyusutan || 0)) - (row.qty_masuk_stok || 0))}
                        </div>
                      </TableCell>
                    </>
                  )}

                  {activeTab === 'completed' && (
                    <>
                      <TableCell noBorder={true} className="!text-left px-[1rem]">
                        <div className="flex flex-col">
                          <span className="!text-FontSizeXs font-bold text-TextColorBase">{formatLocalTime(row.updated_at || row.datetime)}</span>
                          <span className="!text-FontSizeNano text-TextColorMuted">{formatLocalHours(row.updated_at || row.datetime)}</span>
                        </div>
                      </TableCell>
                      <TableCell noBorder={true}>
                        <div className="flex flex-col">
                          <span className="!text-FontSizeXs font-bold text-TextColorBase leading-tight">
                            {row.nama_produk || '-'}
                          </span>
                          <span className="!text-FontSizeNano text-TextColorMuted">
                            {row.category} {row.sub_category ? `> ${row.sub_category}` : ''}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell noBorder={true}>
                        <div className="!text-FontSizeXs text-TextColorBase">{row.unit || '-'}</div>
                      </TableCell>
                      <TableCell noBorder={true}>
                        <div className="!text-FontSizeXs text-TextColorBase">{row.qty_sebelum || 0}</div>
                      </TableCell>
                      <TableCell noBorder={true}>
                        <div className="!text-FontSizeXs font-bold text-FeedbackColorError">{row.qty_penyusutan || 0}</div>
                      </TableCell>
                      <TableCell noBorder={true}>
                        <div className="!text-FontSizeXs font-semibold text-TextColorBase">
                          {(row.qty_sebelum || 0) - (row.qty_penyusutan || 0)}
                        </div>
                      </TableCell>
                      <TableCell noBorder={true}>
                        <div className="!text-FontSizeXs text-TextColorBase">
                          {row.qty_masuk_stok || 0}
                        </div>
                      </TableCell>
                      <TableCell noBorder={true}>
                        <div className="!text-FontSizeXs font-bold text-primary-700">
                          {Math.max(0, ((row.qty_sebelum || 0) - (row.qty_penyusutan || 0)) - (row.qty_masuk_stok || 0))}
                        </div>
                      </TableCell>
                      <TableCell noBorder={true}>
                        <div className="inline-flex items-center px-2 py-0.5 rounded !text-FontSizeNano font-bold bg-[#dcfce7] text-[#166534]">
                          SELESAI
                        </div>
                      </TableCell>
                    </>
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow noBorder={true}>
                <TableCell colSpan={9} noBorder={true} className="h-[12rem] text-TextColorMuted italic text-center">
                  Tidak ada data untuk ditampilkan
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {activeTab !== 'pending' && (
          <Pagination
            currentPage={page}
            totalPages={Math.ceil(totalItems / limit)}
            totalItems={totalItems}
            perPage={limit}
            onPageChange={(p) => setPage(p)}
            className="mt-[1.5rem]"
            id="pemrosesan-pagination"
          />
        )}
      </div>
    </MainShell>
  );
};

export default PemrosesanPage;
