import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainShell } from '../../../ui/components/common/shells/MainShell';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../../../ui/components/common/Table';
import { Pagination } from '../../../ui/components/common/Pagination';
import { Tabs } from '../../../ui/components/common/Tabs';
import { getPageFetchLimit } from '../../../logic/services/fetchingCenter';
import { pemrosesanService } from '../../../logic/services/pemrosesanService';
import { ITs_Pemrosesan } from '../../../logic/types/ITs_Pemrosesan';
import { Package, Calendar, Search, ClipboardList, Timer, CheckCircle2 } from 'lucide-react';
import { Skeleton } from '../../../ui/components/elements/Skeleton';
import { useGlobalState } from '../../../logic/context/GlobalContext';
import { formatDate } from '../../../logic/utils/date';
import { cn } from '../../../logic/utils/cn';
import { swalConfig, toast as swalToast } from '../../../logic/utils/swalConfig';

/**
 * TUGAS PEMROSESAN PAGE (OPERATOR)
 * Halaman utama untuk operator Pemrosesan.
 * Memiliki 2 tab: Dalam Pemrosesan, Selesai Diproses.
 */
export const TugasPemrosesanPage: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useGlobalState();
  const { isMobile } = state.viewport;
  
  const [activeTab, setActiveTab] = useState('processing'); // 'processing' | 'completed'
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = getPageFetchLimit('DaftarPemrosesan');

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Ambil dari pemrosesanService berdasarkan status
      const statusMap: Record<string, ITs_Pemrosesan['status']> = {
        'processing': 'processing',
        'completed': 'completed'
      };
      const result = await pemrosesanService.getPaginated(page, {
        limit,
        status: statusMap[activeTab]
      });
      
      // Filter search term (Jika service mendukung search ini lebih baik, tapi di sini kita simulasikan)
      // Karena pemrosesanService.getPaginated belum mendukung search term, kita ambil semua dulu atau filter client-side 
      // Untuk demo, kita gunakan data dari service
      setData(result.items);
      setTotalItems(result.total);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, activeTab, page, limit]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, activeTab]);

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
      id="tugas-pemrosesan-main-page"
    >
      <div className="w-full space-y-[1.25rem]">
        <Tabs 
          id="pemrosesan-tabs" 
          activeTab={activeTab} 
          tabs={tabs} 
          onChange={(id) => setActiveTab(String(id))}
          variant="underline"
        />

        <Table id="pemrosesan-table" noBorder={true}>
          <TableHeader>
            <TableRow noBorder={true} isHeader={true}>
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
                  {activeTab === 'completed' && <TableCell noBorder={true}><Skeleton className="h-[2.5rem] w-full" /></TableCell>}
                </TableRow>
              ))
            ) : data.length > 0 ? (
              data.map((row) => (
                <TableRow 
                  key={row.id} 
                  noBorder={true} 
                  className="cursor-pointer select-none group hover:bg-[#f8fafc] transition-colors"
                  onClick={() => navigate(`/tugas-pemrosesan/detail/${row.id}`)}
                >
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
            id="tugas-pemrosesan-pagination"
          />
        )}
      </div>
    </MainShell>
  );
};

export default TugasPemrosesanPage;
