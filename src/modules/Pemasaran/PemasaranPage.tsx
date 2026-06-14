import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainShell } from '../../ui/components/common/shells/MainShell';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell, TableCheckbox, SortDirection } from '../../ui/components/common/Table';
import { Pagination } from '../../ui/components/common/Pagination';
import { getPageFetchLimit } from '../../logic/services/fetchingCenter';
import { pemasaranService, IPemasaranWithCustomer } from '../../logic/services/pemasaranService';
import { akunService } from '../../logic/services/akunService';
import { Edit, Trash2, Eye, MapPin } from 'lucide-react';
import { GhostButton } from '../../ui/components/elements/Button';
import { SearchInput } from '../../ui/components/elements/Inputs';
import { Skeleton } from '../../ui/components/elements/Skeleton';
import { swalConfig, toast as swalToast } from '../../logic/utils/swalConfig';
import { tokens } from '../../ui/styles/tokens';
import { cn } from '../../logic/utils/cn';
import { useGlobalState } from '../../logic/context/GlobalContext';
import { formatDateShort } from '../../logic/utils/date';

/**
 * PEMASARAN PAGE
 * Halaman utama untuk manajemen data Kunjungan Pemasaran (Marketing).
 */
export const PemasaranPage: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useGlobalState();
  const { isMobile } = state.viewport;

  const [data, setData] = useState<IPemasaranWithCustomer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: SortDirection }>({ 
    key: 'visit_date', 
    direction: 'desc' 
  });
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = getPageFetchLimit('DaftarPemasaran');

  const currentSession = akunService.getCurrentSession();
  const currentUserId = currentSession?.user_id;

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    const result = await pemasaranService.getPaginated(
      page, 
      searchTerm, 
      limit,
      sortConfig.key,
      sortConfig.direction === 'asc' ? 'asc' : 'desc'
    );
    setData(result.items);
    setTotalItems(result.total);
    setIsLoading(false);
  }, [page, limit, searchTerm, sortConfig]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Reset ke halaman 1 jika mencari atau menyortir
  useEffect(() => {
    setPage(1);
  }, [searchTerm, sortConfig]);

  const handleDelete = async (id: string) => {
    swalConfig.fire({
      title: 'Hapus Kunjungan Pemasaran?',
      text: 'Data kunjungan serta foto bukti di cloud storage akan dihapus permanen!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal',
      confirmButtonColor: tokens.semantic.colors.light.FeedbackColorError,
    }).then(async (result) => {
      if (result.isConfirmed) {
        setIsLoading(true);
        const success = await pemasaranService.delete(id);
        setIsLoading(false);
        if (success) {
          swalToast.fire({ icon: 'success', title: 'Data kunjungan pemasaran berhasil dihapus' });
          fetchData();
        } else {
          swalToast.fire({ icon: 'error', title: 'Gagal menghapus data kunjungan' });
        }
      }
    });
  };

  return (
    <MainShell 
      title="Kunjungan Pemasaran" 
      subtitle="Kelola laporan harian kunjungan pemasaran sales ke pelanggan"
      onAdd={() => navigate('/pemasaran/tambah')}
      hideDownload={true}
      hideHeaderDivider={true}
      id="pemasaran-main-page"
    >
      <div className="w-full space-y-4">
        <div className={cn("flex items-center gap-2", isMobile ? "flex-col items-stretch" : "")}>
          <div className={cn(isMobile ? "w-full" : "w-96")}>
            <SearchInput 
              id="pemasaran-search-input"
              value={searchTerm}
              onSearch={(val) => setSearchTerm(val)}
              placeholder="Cari sales, tipe, customer, atau alamat..."
              className="bg-white rounded-lg border border-teal-500/25 hover:border-teal-500 focus:border-teal-500 transition-all shadow-sm"
            />
          </div>
        </div>

        <Table id="pemasaran-table" noBorder={true}>
          <TableHeader>
            <TableRow noBorder={true} isHeader={true}>
              <TableHead 
                isSortable={true} 
                sortDirection={sortConfig.key === 'visit_date' ? sortConfig.direction : null}
                onSort={(dir) => setSortConfig({ key: 'visit_date', direction: dir })}
                className="w-40"
              >
                Tanggal
              </TableHead>
              <TableHead 
                isSortable={true} 
                sortDirection={sortConfig.key === 'sales_username' ? sortConfig.direction : null}
                onSort={(dir) => setSortConfig({ key: 'sales_username', direction: dir })}
                className="w-40"
              >
                Nama Sales
              </TableHead>
              <TableHead 
                isSortable={true} 
                sortDirection={sortConfig.key === 'customer_name' ? sortConfig.direction : null}
                onSort={(dir) => setSortConfig({ key: 'customer_name', direction: dir })}
                className="w-48"
              >
                Pelanggan / Perusahaan
              </TableHead>
              <TableHead 
                isSortable={true} 
                sortDirection={sortConfig.key === 'activity_type' ? sortConfig.direction : null}
                onSort={(dir) => setSortConfig({ key: 'activity_type', direction: dir })}
                className="w-32"
              >
                Kegiatan
              </TableHead>
              <TableHead>
                Alamat Kunjungan
              </TableHead>
              <TableHead className="w-32 text-center">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: limit }).map((_, idx) => (
                <TableRow key={`skeleton-${idx}`} noBorder={true}>
                  <TableCell noBorder={true}><Skeleton className="h-5 w-full" /></TableCell>
                  <TableCell noBorder={true}><Skeleton className="h-5 w-full" /></TableCell>
                  <TableCell noBorder={true}><Skeleton className="h-5 w-full" /></TableCell>
                  <TableCell noBorder={true}><Skeleton className="h-5 w-full" /></TableCell>
                  <TableCell noBorder={true}><Skeleton className="h-5 w-full" /></TableCell>
                  <TableCell noBorder={true}><Skeleton className="h-6 w-16 mx-auto rounded-md" /></TableCell>
                </TableRow>
              ))
            ) : data.length > 0 ? (
              data.map((row) => (
                <TableRow 
                  key={row.id} 
                  noBorder={true} 
                  className="cursor-pointer select-none group hover:bg-teal-50"
                  onClick={() => navigate(`/pemasaran/detail/${row.id}`)}
                >
                  <TableCell noBorder={true} className="text-gray-900 text-sm font-normal">
                    {formatDateShort(row.visit_date)}
                  </TableCell>
                  <TableCell noBorder={true} className="text-gray-900 text-sm font-semibold text-left">
                    {row.sales_username}
                  </TableCell>
                  <TableCell noBorder={true} className="text-gray-900 text-sm font-normal text-left">
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-900">{row.customer_name}</span>
                      {row.customer_company && (
                        <span className="text-xs text-gray-500">{row.customer_company}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell noBorder={true} className="text-gray-900 text-sm font-normal text-left">
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-xs font-semibold inline-block uppercase",
                      row.activity_type === 'client relation' ? "bg-blue-100 text-blue-700" :
                      row.activity_type === 'selling' ? "bg-green-100 text-green-700" :
                      "bg-amber-100 text-amber-700"
                    )}>
                      {row.activity_type}
                    </span>
                  </TableCell>
                  <TableCell noBorder={true} className="text-gray-900 text-xs font-normal max-w-xs truncate text-left">
                    <div className="flex items-center gap-1">
                      <MapPin size={14} className="text-gray-400 shrink-0" />
                      <span className="truncate">{row.alamat}</span>
                    </div>
                  </TableCell>
                  <TableCell noBorder={true} onClick={(e) => e.stopPropagation()}>
                    {row.created_by === currentUserId && (
                      <div className="flex items-center justify-center gap-1">
                        <GhostButton 
                          size="sm" 
                          onClick={() => navigate(`/pemasaran/edit/${row.id}`)} 
                          title="Edit"
                          className="h-8 w-8 p-0"
                        >
                          <Edit size="1rem" className="text-orange-500" />
                        </GhostButton>
                        <GhostButton 
                          size="sm" 
                          onClick={() => handleDelete(row.id)} 
                          title="Hapus"
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 size="1rem" className="text-red-500" />
                        </GhostButton>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow noBorder={true}>
                <TableCell colSpan={6} noBorder={true} className="h-48 text-gray-400 italic text-center">
                  Data kunjungan pemasaran tidak ditemukan
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
          className="mt-4"
          id="pemasaran-pagination"
        />
      </div>
    </MainShell>
  );
};

export default PemasaranPage;
