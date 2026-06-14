import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainShell } from '../../../../ui/components/common/shells/MainShell';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell, SortDirection } from '../../../../ui/components/common/Table';
import { Pagination } from '../../../../ui/components/common/Pagination';
import { Tabs } from '../../../../ui/components/common/Tabs';
import { getPageFetchLimit } from '../../../../logic/services/fetchingCenter';
import { liabilitasService } from '../../../../logic/services/liabilitasService';
import { ILiabilitas, TLiabilitasStatus, TLiabilitasCategory } from '../../../../logic/types/ITs_Liabilitas';
import { Edit, Trash2 } from 'lucide-react';
import { PageLoading } from '../../../../ui/components/LoadingState/PageLoading';
import { GhostButton } from '../../../../ui/components/elements/Button';
import { SearchInput } from '../../../../ui/components/elements/Inputs';
import { Skeleton } from '../../../../ui/components/elements/Skeleton';
import { swalConfig, toast as swalToast } from '../../../../logic/utils/swalConfig';
import { tokens } from '../../../../ui/styles/tokens';
import { cn } from '../../../../logic/utils/cn';
import { useGlobalState } from '../../../../logic/context/GlobalContext';
import { formatCurrency } from '../../../../logic/utils/data';
import { formatDateShort, formatDateFull } from '../../../../logic/utils/date';

export const LiabilitasPage: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useGlobalState();
  const { isMobile } = state.viewport;
  const [activeTab, setActiveTab] = useState<TLiabilitasStatus>(TLiabilitasStatus.ACTIVE);
  const [data, setData] = useState<ILiabilitas[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: SortDirection }>({ 
    key: 'datetime', 
    direction: 'desc' 
  });
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const limit = getPageFetchLimit('DaftarLiabilitas');

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    const result = await liabilitasService.getPaginated(
      page, 
      searchTerm, 
      {
        limit,
        status: activeTab,
        sortKey: sortConfig.key,
        sortDir: sortConfig.direction === 'asc' ? 'asc' : 'desc'
      }
    );
    setData(result.items);
    setTotalItems(result.total);
    setIsLoading(false);
  }, [page, limit, searchTerm, sortConfig, activeTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, sortConfig]);

  const handleDelete = async (id: string) => {
    swalConfig.fire({
      title: 'Hapus Liabilitas?',
      text: 'Seluruh riwayat pembayaran terkait juga akan terhapus!',
      icon: 'error',
      showCancelButton: true,
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal',
      confirmButtonColor: tokens.semantic.colors.light.FeedbackColorError,
    }).then(async (result) => {
      if (result.isConfirmed) {
        setIsLoading(true);
        const success = await liabilitasService.delete(id);
        if (success) {
          swalToast.fire({ icon: 'success', title: 'Data berhasil dihapus' });
          fetchData();
        } else {
          swalToast.fire({ icon: 'error', title: 'Gagal menghapus data' });
          setIsLoading(false);
        }
      }
    });
  };

  return (
    <MainShell 
      title="Manajemen Liabilitas" 
      subtitle="Pantau hutang dan kewajiban pembayaran bisnis Anda"
      onAdd={() => navigate('/finansial/liabilitas/tambah')}
      onSearchChange={(val) => setSearchTerm(val)}
      hideDownload={true}
      hideHeaderDivider={true}
      id="liabilitas-main-page"
    >
      <div className="w-full space-y-SpacingBase">
        

        <Tabs
          activeTab={activeTab}
          onChange={(id) => { setActiveTab(id as TLiabilitasStatus); setPage(1); }}
          variant="underline"
          tabs={[
            { id: TLiabilitasStatus.ACTIVE, label: 'Belum Lunas' },
            { id: TLiabilitasStatus.SETTLED, label: 'Sudah Lunas' },
          ]}
          id="liabilitas-tabs"
        />
        <div className={cn("flex items-center gap-SpacingSmall", isMobile && "flex-col items-stretch")}>
          <div className={cn(isMobile ? "w-full" : "w-1/3")}>
            <SearchInput 
              id="liabilitas-search-input"
              value={searchTerm}
              onSearch={(val) => setSearchTerm(val)}
              placeholder="Cari deskripsi, kategori atau pihak terkait..."
              className="bg-ColorBg !rounded-RadiusMedium !border-ColorPrimary/25 hover:!border-ColorPrimary focus:!border-ColorPrimary focus-visible:!border-ColorPrimary focus:!ring-0 focus-visible:!ring-0 transition-all shadow-sm"
            />
          </div>
        </div>

        <Table id="liabilitas-table" noBorder={true}>
          <TableHeader>
            <TableRow noBorder={true} isHeader={true}>
              <TableHead className="!text-center whitespace-nowrap">Tanggal</TableHead>
              <TableHead className="!text-center whitespace-nowrap">Pihak Terkait</TableHead>
              <TableHead className="!text-center whitespace-nowrap">Kategori</TableHead>
              <TableHead className="!text-center whitespace-nowrap">Pokok</TableHead>
              <TableHead className="!text-center whitespace-nowrap">Pembayaran</TableHead>
              <TableHead className="!text-center whitespace-nowrap">Sisa Hutang</TableHead>
              {activeTab !== TLiabilitasStatus.SETTLED && <TableHead className="w-32 !text-center">Aksi</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow noBorder={true}>
                <TableCell colSpan={activeTab !== TLiabilitasStatus.SETTLED ? 7 : 6} noBorder={true}>
                  <div className="flex h-[300px] items-center justify-center">
                    <PageLoading />
                  </div>
                </TableCell>
              </TableRow>
            ) : data.length > 0 ? (
              data.map((row) => (
                <TableRow 
                  key={row.id} 
                  noBorder={true} 
                  className="cursor-pointer select-none group"
                  onClick={() => navigate(`/finansial/liabilitas/detail/${row.id}`)}
                >
                  <TableCell noBorder={true} className="!text-center text-FontSizeXs">
                    {formatDateFull(row.datetime)}
                  </TableCell>
                  <TableCell noBorder={true} className="!text-center text-FontSizeXs font-medium">
                    {row.entity_name}
                  </TableCell>
                  <TableCell noBorder={true} className="!text-center text-FontSizeXs">
                    {row.category}
                  </TableCell>
                  <TableCell noBorder={true} className="!text-center text-FontSizeXs">
                    {formatCurrency(row.principal_amount)}
                  </TableCell>
                  <TableCell noBorder={true} className="!text-center text-FontSizeXs">
                    {formatCurrency(row.paid_amount)}
                  </TableCell>
                  <TableCell noBorder={true} className="!text-center !text-FontSizeXs font-bold text-FeedbackColorError">
                    {formatCurrency(row.outstanding_amount)}
                  </TableCell>
                  {activeTab !== TLiabilitasStatus.SETTLED && (
                    <TableCell noBorder={true} onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-SpacingTiny">
                        {row.category !== TLiabilitasCategory.PEMBELIAN && !row.purchase_id && (
                          <>
                            <GhostButton 
                              size="sm" 
                              onClick={(e) => { e.stopPropagation(); navigate(`/finansial/liabilitas/edit/${row.id}`); }} 
                              className="h-8 w-8 p-0"
                            >
                              <Edit size="1rem" className="text-ColorSecondary" />
                            </GhostButton>
                            <GhostButton 
                              size="sm" 
                              onClick={(e) => { e.stopPropagation(); handleDelete(row.id); }} 
                              className="h-8 w-8 p-0"
                            >
                              <Trash2 size="1rem" className="text-FeedbackColorError" />
                            </GhostButton>
                          </>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow noBorder={true}>
                <TableCell colSpan={activeTab !== TLiabilitasStatus.SETTLED ? 7 : 6} noBorder={true} className="h-48 text-TextColorMuted italic text-center">
                  Data liabilitas tidak ditemukan
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
          id="liabilitas-pagination"
        />
      </div>
    </MainShell>
  );
};

export default LiabilitasPage;
