import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainShell } from '../../../../ui/components/common/shells/MainShell';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell, TableCheckbox, SortDirection } from '../../../../ui/components/common/Table';
import { Pagination } from '../../../../ui/components/common/Pagination';
import { getPageFetchLimit } from '../../../../logic/services/fetchingCenter';
import { customerService } from '../../../../logic/services/customerService';
import { ICustomer } from '../../../../logic/types/ITs_Customer';
import { BulkButton } from '../../../../ui/components/elements/BulkButton';
import { Edit, Trash2 } from 'lucide-react';
import { GhostButton } from '../../../../ui/components/elements/Button';
import { SearchInput } from '../../../../ui/components/elements/Inputs';
import { Skeleton } from '../../../../ui/components/elements/Skeleton';
import { swalConfig, toast as swalToast } from '../../../../logic/utils/swalConfig';
import { tokens } from '../../../../ui/styles/tokens';
import { cn } from '../../../../logic/utils/cn';
import { useGlobalState } from '../../../../logic/context/GlobalContext';

/**
 * CUSTOMER PAGE
 * Halaman utama untuk manajemen data Customer.
 * Mengikuti TableDataUI.md.
 */
export const CustomerPage: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useGlobalState();
  const { isMobile } = state.viewport;
  
  const [data, setData] = useState<ICustomer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: keyof ICustomer; direction: SortDirection }>({ 
    key: 'name', 
    direction: 'asc' 
  });
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = getPageFetchLimit('DaftarCustomer');

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    const { items, total } = await customerService.getPaginated(
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

  const handleDelete = async (id: string, name: string) => {
    swalConfig.fire({
      title: 'Hapus Customer?',
      text: `Data customer "${name}" akan dihapus permanen! Semua data berkaitan dengan data yg dihapus tersebut berpotensi akan ikut terhapus.`,
      icon: 'error',
      showCancelButton: true,
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal',
      confirmButtonColor: tokens.semantic.colors.light.FeedbackColorError,
    }).then(async (result) => {
      if (result.isConfirmed) {
        const success = await customerService.delete(id);
        if (success) {
          swalToast.fire({ icon: 'success', title: 'Customer berhasil dihapus' });
          fetchData();
          setSelectedIds(prev => prev.filter(selId => selId !== id));
        } else {
          swalToast.fire({ icon: 'error', title: 'Gagal menghapus customer' });
        }
      }
    });
  };

  const handleBulkDelete = async () => {
    swalConfig.fire({
      title: 'Hapus Customer Terpilih?',
      text: `Data ${selectedIds.length} customer akan dihapus permanen! Semua data berkaitan dengan data yg dihapus tersebut berpotensi akan ikut terhapus.`,
      icon: 'error',
      showCancelButton: true,
      confirmButtonText: 'Ya, Hapus Semua',
      cancelButtonText: 'Batal',
      confirmButtonColor: tokens.semantic.colors.light.FeedbackColorError,
    }).then(async (result) => {
      if (result.isConfirmed) {
        const results = await Promise.all(selectedIds.map(id => customerService.delete(id)));
        const successCount = results.filter(Boolean).length;
        if (successCount === selectedIds.length) {
          swalToast.fire({ icon: 'success', title: `${successCount} customer berhasil dihapus` });
        } else {
          swalToast.fire({ icon: 'warning', title: `${successCount} berhasil dihapus, ${selectedIds.length - successCount} gagal` });
        }
        setSelectedIds([]);
        fetchData();
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

  const handleSort = (key: keyof ICustomer, direction: SortDirection) => {
    if (direction === null) {
      setSortConfig({ key: 'name', direction: 'asc' });
    } else {
      setSortConfig({ key, direction });
    }
  };

  return (
    <MainShell 
      title="Daftar Customer" 
      subtitle="Manajemen data pelanggan dan lokasi pengiriman"
      onAdd={() => navigate('/penjualan/customer/tambah')}
      onSearchChange={(val) => setSearchTerm(val)}
      hideDownload={true}
      id="customer-main-page"
    >
      <div className="w-full space-y-SpacingBase">
        <div className={cn("flex items-center gap-SpacingSmall", isMobile && "flex-col items-stretch")}>
          <div className={cn(isMobile ? "w-full" : "w-1/3")}>
            <SearchInput 
              id="customer-search-input"
              value={searchTerm}
              onSearch={(val) => setSearchTerm(val)}
              placeholder="Cari nama, perusahaan, atau telepon..."
              className="bg-ColorBg !rounded-RadiusMedium !border-ColorPrimary/25 hover:!border-ColorPrimary focus:!border-ColorPrimary shadow-sm"
            />
          </div>
          {selectedIds.length > 0 && (
            <BulkButton 
              type="delete" 
              onClick={handleBulkDelete} 
              count={selectedIds.length} 
              id="customer-bulk-delete"
            />
          )}
        </div>

        <Table id="customer-table" noBorder={true}>
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
                Pelanggan
              </TableHead>
              <TableHead 
                isSortable={true} 
                sortDirection={sortConfig.key === 'telepon' ? sortConfig.direction : null}
                onSort={(dir) => handleSort('telepon', dir)}
              >
                Kontak
              </TableHead>
              {!isMobile && (
                <>
                  <TableHead className="!text-left px-SpacingSmall">Bidang Usaha</TableHead>
                  <TableHead className="!text-left px-SpacingSmall">Alamat</TableHead>
                </>
              )}
              <TableHead className="w-24">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: limit }).map((_, idx) => (
                <TableRow key={`skeleton-${idx}`} noBorder={true}>
                  <TableCell noBorder={true}><Skeleton className="w-6 h-6 mx-auto" /></TableCell>
                  <TableCell noBorder={true} className="!text-left px-SpacingBase">
                    <div className="flex items-center gap-SpacingSmall">
                      <Skeleton variant="circle" className="w-8 h-8 flex-shrink-0" />
                      <div className="flex flex-col gap-1 w-full">
                        <Skeleton className="h-3 w-3/4" />
                        <Skeleton className="h-2 w-1/2" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell noBorder={true}><Skeleton className="h-3 w-3/4 mx-auto" /></TableCell>
                  {!isMobile && (
                    <>
                      <TableCell noBorder={true}><Skeleton className="h-3 w-1/2 mx-auto" /></TableCell>
                      <TableCell noBorder={true}><Skeleton className="h-3 w-3/4 mx-auto" /></TableCell>
                    </>
                  )}
                  <TableCell noBorder={true}>
                    <div className="flex justify-center gap-2">
                      <Skeleton className="w-8 h-8 rounded" />
                      <Skeleton className="w-8 h-8 rounded" />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : data.length > 0 ? (
              data.map((row) => (
                <TableRow 
                  key={row.id} 
                  noBorder={true} 
                  className="cursor-pointer select-none"
                  onClick={() => navigate(`/penjualan/customer/detail/${row.id}`)}
                >
                  <TableCell noBorder={true} onClick={(e) => e.stopPropagation()}>
                    <TableCheckbox 
                      checked={selectedIds.includes(row.id)}
                      onChange={(e) => handleSelectRow(row.id, e.target.checked)}
                    />
                  </TableCell>
                  <TableCell noBorder={true} className="!text-left px-SpacingBase">
                    <div className="flex items-center gap-SpacingSmall">
                      <div className="flex flex-col min-w-0">
                        <span className="text-FontSizeXs font-semibold text-TextColorBase leading-tight truncate">
                          {row.name}
                        </span>
                        <span className="text-FontSizeNano text-TextColorBase leading-tight mt-0.5 truncate">
                          {row.company || '-'}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell noBorder={true}>
                    <div className="flex flex-col">
                      <span className="text-FontSizeXs text-TextColorBase">{row.telepon}</span>
                      <span className="text-FontSizeNano text-TextColorBase">{row.email || '-'}</span>
                    </div>
                  </TableCell>
                  {!isMobile && (
                    <>
                      <TableCell noBorder={true} className="!text-center !text-FontSizeXs text-TextColorBase">
                        <div className="line-clamp-2 max-w-xs truncate">
                          {row.bidang_usaha || '-'}
                        </div>
                      </TableCell>
                      <TableCell noBorder={true} className="!text-left !text-FontSizeNano text-TextColorBase">
                        <div className="line-clamp-2 max-w-xs truncate]">
                          {row.alamat}
                        </div>
                      </TableCell>
                    </>
                  )}
                  <TableCell noBorder={true} onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-SpacingTiny">
                      <GhostButton size="sm" onClick={() => navigate(`/penjualan/customer/edit/${row.id}`)} title="Edit">
                        <Edit size="1rem" className="text-ColorSecondary" />
                      </GhostButton>
                      <GhostButton size="sm" onClick={() => handleDelete(row.id, row.name)} title="Hapus">
                        <Trash2 size="1rem" className="text-FeedbackColorError" />
                      </GhostButton>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow noBorder={true}>
                <TableCell colSpan={isMobile ? 4 : 6} noBorder={true} className="h-48 text-TextColorMuted italic">
                  Data customer tidak ditemukan
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
          id="customer-pagination"
        />
      </div>
    </MainShell>
  );
};

export default CustomerPage;
