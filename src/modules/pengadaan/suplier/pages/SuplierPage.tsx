import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainShell } from '../../../../ui/components/common/shells/MainShell';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell, TableCheckbox, SortDirection } from '../../../../ui/components/common/Table';
import { Pagination } from '../../../../ui/components/common/Pagination';
import { getPageFetchLimit } from '../../../../logic/services/fetchingCenter';
import { suplierService } from '../../../../logic/services/suplierService';
import { ISuplier } from '../../../../logic/types/ITs_Suplier';
import { Edit, Trash2, MapPin } from 'lucide-react';
import { BulkButton } from '../../../../ui/components/elements/BulkButton';
import { GhostButton } from '../../../../ui/components/elements/Button';
import { SearchInput } from '../../../../ui/components/elements/Inputs';
import { Skeleton } from '../../../../ui/components/elements/Skeleton';
import { PageLoading } from '../../../../ui/components/LoadingState/PageLoading';
import { swalConfig, toast as swalToast } from '../../../../logic/utils/swalConfig';
import { tokens } from '../../../../ui/styles/tokens';
import { cn } from '../../../../logic/utils/cn';
import { useGlobalState } from '../../../../logic/context/GlobalContext';

/**
 * SUPLIER PAGE
 * Halaman utama untuk manajemen data Suplier.
 */
export const SuplierPage: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useGlobalState();
  const { isMobile } = state.viewport;
  const [data, setData] = useState<ISuplier[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: keyof ISuplier; direction: SortDirection }>({ 
    key: 'name', 
    direction: 'asc' 
  });
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = getPageFetchLimit('DaftarSuplier');

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    const { items, total } = await suplierService.getPaginated(
      page, 
      searchTerm, 
      limit, 
      sortConfig.key as string, 
      sortConfig.direction
    );
    setData(items);
    setTotalItems(total);
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
      title: 'Hapus Suplier?',
      text: 'Data yang dihapus tidak dapat dikembalikan! Semua data berkaitan dengan data yg dihapus tersebut berpotensi akan ikut terhapus.',
      icon: 'error',
      showCancelButton: true,
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal',
      confirmButtonColor: tokens.semantic.colors.light.FeedbackColorError,
    }).then(async (result) => {
      if (result.isConfirmed) {
        const success = await suplierService.delete(id);
        if (success) {
          swalToast.fire({ icon: 'success', title: 'Suplier berhasil dihapus' });
          fetchData();
        } else {
          swalToast.fire({ icon: 'error', title: 'Gagal menghapus suplier' });
        }
      }
    });
  };

  const handleBulkDelete = async () => {
    swalConfig.fire({
      title: `Hapus ${selectedIds.length} Suplier?`,
      text: 'Data yang dipilih tidak dapat dikembalikan! Semua data berkaitan dengan data yg dihapus tersebut berpotensi akan ikut terhapus.',
      icon: 'error',
      showCancelButton: true,
      confirmButtonText: 'Ya, Hapus Masal',
      cancelButtonText: 'Batal',
      confirmButtonColor: tokens.semantic.colors.light.FeedbackColorError,
    }).then(async (result) => {
      if (result.isConfirmed) {
        let successCount = 0;
        let failCount = 0;

        for (const id of selectedIds) {
          const success = await suplierService.delete(id);
          if (success) successCount++;
          else failCount++;
        }

        if (successCount > 0) {
          swalToast.fire({ 
            icon: 'success', 
            title: `${successCount} suplier berhasil dihapus` 
          });
          setSelectedIds([]);
          fetchData();
        }
        if (failCount > 0) {
          swalToast.fire({ 
            icon: 'error', 
            title: `${failCount} suplier gagal dihapus` 
          });
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

  const handleSort = (key: keyof ISuplier, direction: SortDirection) => {
    if (direction === null) {
      setSortConfig({ key: 'name', direction: 'asc' });
    } else {
      setSortConfig({ key, direction });
    }
  };

  return (
    <MainShell 
      title="Manajemen Suplier" 
      subtitle="Kelola mitra pengadaan barang"
      onAdd={() => navigate('/pengadaan/suplier/tambah')}
      onSearchChange={(val) => setSearchTerm(val)}
      hideDownload={true}
      hideHeaderDivider={true}
      id="suplier-main-page"
      isLoading={isLoading && data.length === 0}
    >
      <div className="w-full space-y-SpacingBase">
        <div className={cn("flex items-center gap-SpacingSmall", isMobile && "flex-col items-stretch")}>
          <div className={cn(isMobile ? "w-full" : "w-1/3")}>
            <SearchInput 
              id="suplier-search-input"
              value={searchTerm}
              onSearch={(val) => setSearchTerm(val)}
              placeholder="Cari suplier..."
              className="bg-ColorBg !rounded-RadiusMedium !border-ColorPrimary/25 hover:!border-ColorPrimary focus:!border-ColorPrimary focus-visible:!border-ColorPrimary focus:!ring-0 focus-visible:!ring-0 transition-all shadow-sm"
            />
          </div>
          {selectedIds.length > 0 && (
            <BulkButton 
              type="delete"
              id="mass-delete-btn"
              onClick={handleBulkDelete}
              count={selectedIds.length}
            />
          )}
        </div>

        <Table id="suplier-table" noBorder={true}>
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
                isSortable={true} 
                sortDirection={sortConfig.key === 'name' ? sortConfig.direction : null}
                onSort={(dir) => handleSort('name', dir)}
              >
                Nama Suplier
              </TableHead>
              <TableHead>Kontak</TableHead>
              <TableHead>Alamat</TableHead>
              <TableHead className="w-24">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: limit }).map((_, idx) => (
                <TableRow key={`skeleton-${idx}`} noBorder={true}>
                  <TableCell noBorder={true}>
                    <Skeleton className="w-spacing-SpacingBase h-spacing-SpacingBase mx-auto" />
                  </TableCell>
                  <TableCell noBorder={true} className="!text-left px-SpacingBase">
                    <Skeleton className="h-[0.75rem] w-3/4" />
                  </TableCell>
                  <TableCell noBorder={true}>
                    <Skeleton className="h-[0.875rem] w-3/4 mx-auto" />
                  </TableCell>
                  <TableCell noBorder={true} className="!text-left px-SpacingBase">
                    <Skeleton className="h-[0.875rem] w-full" />
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
                  onClick={() => navigate(`/pengadaan/suplier/detail/${row.id}`)}
                >
                  <TableCell noBorder={true} onClick={(e) => e.stopPropagation()}>
                    <TableCheckbox 
                      checked={selectedIds.includes(row.id)}
                      onChange={(e) => handleSelectRow(row.id, e.target.checked)}
                    />
                  </TableCell>
              <TableCell noBorder={true} className="!text-left px-SpacingBase">
                <span className="font-semibold text-FontSizeXs text-TextColorBase leading-tight">
                  {row.name}
                </span>
              </TableCell>
                  <TableCell noBorder={true} className="text-center">
                    <div className="flex flex-col">
                      <span className="text-FontSizeXs text-TextColorBase">{row.telepon}</span>
                      <span className="text-FontSizeNano text-TextColorBase">{row.email || '-'}</span>
                    </div>
                  </TableCell>
                  <TableCell noBorder={true} className="!text-left px-SpacingBase">
                    <span className="text-FontSizeNano line-clamp-2 max-w-xs truncate">{row.alamat}</span>
                  </TableCell>
                  <TableCell noBorder={true} onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-SpacingTiny">
                      <GhostButton size="sm" onClick={() => navigate(`/pengadaan/suplier/edit/${row.id}`)} title="Edit">
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
                <TableCell colSpan={5} noBorder={true} className="h-48 text-TextColorMuted italic">
                  Data suplier tidak ditemukan
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
          id="suplier-pagination"
        />
      </div>
    </MainShell>
  );
};

export default SuplierPage;
