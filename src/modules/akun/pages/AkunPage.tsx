import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainShell } from '../../../ui/components/common/shells/MainShell';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell, TableCheckbox, SortDirection } from '../../../ui/components/common/Table';
import { Pagination } from '../../../ui/components/common/Pagination';
import { Tabs } from '../../../ui/components/common/Tabs';
import { getPageFetchLimit } from '../../../logic/services/fetchingCenter';
import { akunService } from '../../../logic/services/akunService';
import { IAkun, TPeran } from '../../../logic/types/ITs_Akun';
import { Edit, Trash2 } from 'lucide-react';
import { BulkButton } from '../../../ui/components/elements/BulkButton';
import { GhostButton, PrimaryButton } from '../../../ui/components/elements/Button';
import { Badge } from '../../../ui/components/elements/Badge';
import { SearchInput } from '../../../ui/components/elements/Inputs';
import { Skeleton } from '../../../ui/components/elements/Skeleton';
import { swalConfig, toast as swalToast } from '../../../logic/utils/swalConfig';
import { tokens } from '../../../ui/styles/tokens';
import { cn } from '../../../logic/utils/cn';
import { useGlobalState } from '../../../logic/context/GlobalContext';
import { appAssets } from '../../../ui/styles/assets';

/**
 * AKUN PAGE
 * Halaman utama untuk manajemen data Akun.
 */
export const AkunPage: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useGlobalState();
  const { isMobile } = state.viewport;
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'inactive'
  const [data, setData] = useState<IAkun[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: keyof IAkun; direction: SortDirection }>({ 
    key: 'username', 
    direction: 'asc' 
  });
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = getPageFetchLimit('DaftarAkun');

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    const { items, total } = await akunService.getPaginated(
      page, 
      limit, 
      searchTerm, 
      sortConfig.key as string, 
      sortConfig.direction,
      activeTab === 'active'
    );
    setData(items);
    setTotalItems(total);
    setIsLoading(false);
  }, [page, limit, searchTerm, sortConfig, activeTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Reset ke halaman 1 jika mencari atau menyortir
  useEffect(() => {
    setPage(1);
  }, [searchTerm, sortConfig, activeTab]);

  const handleDelete = async (id: string) => {
    swalConfig.fire({
      title: 'Hapus Akun?',
      text: 'Data yang dihapus tidak dapat dikembalikan!',
      icon: 'error',
      showCancelButton: true,
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal',
      confirmButtonColor: tokens.semantic.colors.light.FeedbackColorError,
    }).then(async (result) => {
      if (result.isConfirmed) {
        const success = await akunService.delete(id);
        if (success) {
          swalToast.fire({ icon: 'success', title: 'Akun berhasil dihapus' });
          fetchData();
        } else {
          swalToast.fire({ icon: 'error', title: 'Gagal menghapus akun' });
        }
      }
    });
  };

  const handleMassDelete = () => {
    swalConfig.fire({
      title: 'Hapus Akun Terpilih?',
      text: `Anda akan menghapus ${selectedIds.length} data akun yang dipilih. Tindakan ini tidak dapat dibatalkan!`,
      icon: 'error',
      showCancelButton: true,
      confirmButtonText: 'Ya, Hapus Semua',
      cancelButtonText: 'Batal',
      confirmButtonColor: tokens.semantic.colors.light.FeedbackColorError,
    }).then(async (result) => {
      if (result.isConfirmed) {
        const success = await akunService.deleteMany(selectedIds);
        if (success) {
          swalToast.fire({ icon: 'success', title: `${selectedIds.length} Akun berhasil dihapus` });
          setSelectedIds([]);
          fetchData();
        } else {
          swalToast.fire({ icon: 'error', title: 'Gagal menghapus beberapa akun' });
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

  const tabs = [
    { id: 'active', label: 'Aktif' },
    { id: 'inactive', label: 'Non-Aktif' },
  ];

  return (
    <MainShell 
      title="Manajemen Akun" 
      subtitle="Kelola pengguna dan hak akses sistem"
      onAdd={() => navigate('/akun/tambah')}
      onSearchChange={(val) => setSearchTerm(val)}
      hideDownload={true}
      hideHeaderDivider={true}
      id="akun-main-page"
      isLoading={isLoading && data.length === 0} // Only show page loader on initial load
    >
      <div className="w-full space-y-SpacingBase">
        <Tabs 
          id="akun-status-tabs" 
          activeTab={activeTab} 
          tabs={tabs} 
          onChange={(id) => setActiveTab(String(id))} 
          variant="underline"
          className="mb-SpacingMedium"
        />

        <div className={cn("flex items-center gap-SpacingSmall", isMobile && "flex-col items-stretch")}>
          <div className={cn(isMobile ? "w-full" : "w-1/3")}>
            <SearchInput 
              id="akun-search-input"
              value={searchTerm}
              onSearch={(val) => setSearchTerm(val)}
              placeholder="Cari akun..."
              className="bg-ColorBg !rounded-RadiusMedium !border-ColorPrimary/25 hover:!border-ColorPrimary focus:!border-ColorPrimary focus-visible:!border-ColorPrimary focus:!ring-0 focus-visible:!ring-0 transition-all shadow-sm"
            />
          </div>
          {selectedIds.length > 0 && (
            <BulkButton 
              type="delete"
              id="mass-delete-btn"
              onClick={handleMassDelete}
              count={selectedIds.length}
            />
          )}
        </div>

        <Table id="akun-table" noBorder={true}>
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
                sortDirection={sortConfig.key === 'username' ? sortConfig.direction : null}
                onSort={(dir) => setSortConfig({ key: 'username', direction: dir })}
              >
                Akun
              </TableHead>
              <TableHead>No Telepon</TableHead>
              <TableHead 
                isSortable={true} 
                sortDirection={sortConfig.key === 'peran' ? sortConfig.direction : null}
                onSort={(dir) => setSortConfig({ key: 'peran', direction: dir })}
              >
                Peran
              </TableHead>
              <TableHead>Hak Akses</TableHead>
              <TableHead className="w-24">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length > 0 ? (
              data.map((row) => (
                <TableRow 
                  key={row.id} 
                  noBorder={true} 
                  className="cursor-pointer select-none"
                  onClick={() => navigate(`/akun/detail/${row.id}`)}
                >
                  <TableCell noBorder={true} onClick={(e) => e.stopPropagation()}>
                    <TableCheckbox 
                      checked={selectedIds.includes(row.id)}
                      onChange={(e) => handleSelectRow(row.id, e.target.checked)}
                    />
                  </TableCell>
                  <TableCell noBorder={true} className="!text-left px-SpacingBase">
                    <div className="flex items-center gap-SpacingSmall">
                      <div className="w-8 h-8 rounded-RadiusFull overflow-hidden bg-ColorPrimary/0 flex-shrink-0">
                        <img 
                          src={row.foto_profil || appAssets.AccountPlaceholder} 
                          alt={row.username} 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer" 
                        />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-normal text-FontSizeXs font-semibold text-TextColorBase leading-tight truncate">
                          {row.username}
                        </span>
                        <span className="font-normal text-FontSizeNano text-TextColorBase leading-tight mt-0.5 truncate">
                          {row.jabatan}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell noBorder={true}>{row.telepon || '-'}</TableCell>
                  <TableCell noBorder={true}>
                    <span className={cn(
                      "px-SpacingSmall py-SpacingNano rounded-RadiusFull font-normal !text-FontSizeNano inline-block",
                      row.peran === TPeran.USER && "bg-ColorSecondary text-White",
                      row.peran === TPeran.ADMIN && "bg-FeedbackColorSuccess text-White",
                      row.peran === TPeran.GUEST && "bg-FeedbackColorInfo text-White"
                    )}>
                      {row.peran}
                    </span>
                  </TableCell>
                  <TableCell noBorder={true} className="!text-left px-SpacingBase">
                    <span className="!text-center text-FontSizeNano bg-black/5 px-SpacingSmall py-SpacingNano rounded-RadiusFull font-medium text-TextColorMuted">
                      {row.akses_modul.length} Modul
                    </span>
                  </TableCell>
                  <TableCell noBorder={true} onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-SpacingTiny">
                      <GhostButton size="sm" onClick={() => navigate(`/akun/edit/${row.id}`)} title="Edit">
                        <Edit size="1rem" className="text-ColorSecondary" />
                      </GhostButton>
                      <GhostButton size="sm" onClick={() => handleDelete(row.id)} title="Hapus">
                        <Trash2 size="1rem" className="text-FeedbackColorError" />
                      </GhostButton>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : !isLoading ? (
              <TableRow noBorder={true}>
                <TableCell colSpan={6} noBorder={true} className="h-48 text-TextColorMuted italic">
                  Data tidak ditemukan
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>

        <Pagination
          currentPage={page}
          totalPages={Math.ceil(totalItems / limit)}
          totalItems={totalItems}
          perPage={limit}
          onPageChange={(p) => setPage(p)}
          className="mt-SpacingMedium"
          id="akun-pagination"
        />
      </div>
    </MainShell>
  );
};

export default AkunPage;
