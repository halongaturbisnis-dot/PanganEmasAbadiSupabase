import React, { useState, useEffect, useCallback } from 'react';
import { MainShell } from '../../../ui/components/common/shells/MainShell';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../../../ui/components/common/Table';
import { Pagination } from '../../../ui/components/common/Pagination';
import { Tabs } from '../../../ui/components/common/Tabs';
import { getPageFetchLimit } from '../../../logic/services/fetchingCenter';
import { daftarHargaService } from '../../../logic/services/daftarHargaService';
import { stokBerjalanService } from '../../../logic/services/stokBerjalanService';
import { IDaftarHarga } from '../../../logic/types/ITs_DaftarHarga';
import { IStokBerjalan } from '../../../logic/types/ITs_StokBerjalan';
import { Edit, Trash2, Package, Tag } from 'lucide-react';
import { SearchInput } from '../../../ui/components/elements/Inputs';
import { Skeleton } from '../../../ui/components/elements/Skeleton';
import { Badge } from '../../../ui/components/elements/Badge';
import { IconButton, GhostButton } from '../../../ui/components/elements/Button';
import { cn } from '../../../logic/utils/cn';
import { useGlobalState } from '../../../logic/context/GlobalContext';
import { formatCurrency } from '../../../logic/utils/data';
import { DaftarHargaFormModal } from './DaftarHargaFormModal';
import { DaftarHargaDetailModal } from './DaftarHargaDetailModal';
import { swalConfig, toast as swalToast } from '../../../logic/utils/swalConfig';

/**
 * DAFTAR HARGA PAGE
 * Halaman utama modul Katalog Harga.
 * Tab 'Belum Diatur': Menampilkan SKU dari Stok Berjalan yang belum memiliki katalog harga.
 * Tab 'Katalog Harga': Menampilkan produk yang sudah memiliki pengaturan harga bertingkat.
 */
export const DaftarHargaPage: React.FC = () => {
  const { state } = useGlobalState();
  const { isMobile } = state.viewport;
  
  const [activeTab, setActiveTab] = useState('unset'); // 'unset' | 'catalog'
  const [unsetItems, setUnsetItems] = useState<IStokBerjalan[]>([]);
  const [catalogItems, setCatalogItems] = useState<IDaftarHarga[]>([]);
  const [skuToPriceMap, setSkuToPriceMap] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | null>(null);
  const limit = getPageFetchLimit('DaftarHargaPage');

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedSku, setSelectedSku] = useState<string | null>(null);
  const [editData, setEditData] = useState<IDaftarHarga | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const allStock = await stokBerjalanService.getAll();
      const priceMap: Record<string, number> = {};
      allStock.forEach(item => {
        priceMap[item.sku] = item.base_price || 0;
      });
      setSkuToPriceMap(priceMap);

      if (activeTab === 'unset') {
        const currentCatalog = await daftarHargaService.getAll();
        
        // Filter SKU yang belum ada di katalog
        const catalogSkus = new Set(currentCatalog.map(c => c.sku));
        let filtered = allStock.filter(item => 
          !catalogSkus.has(item.sku) && 
          (item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
           item.sku.toLowerCase().includes(searchTerm.toLowerCase()) || 
           item.category?.toLowerCase()?.includes(searchTerm.toLowerCase()))
        );

        // Sorting
        if (sortField && sortOrder) {
          filtered = [...filtered].sort((a, b) => {
            const valA = (a as any)[sortField] || '';
            const valB = (b as any)[sortField] || '';
            if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
            if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
            return 0;
          });
        }

        setTotalItems(filtered.length);
        const offset = (page - 1) * limit;
        setUnsetItems(filtered.slice(offset, offset + limit));
      } else {
        const { items, total } = await daftarHargaService.getPaginated(1, 9999, searchTerm); // Get all for client side sorting
        let sorted = items;
        
        if (sortField && sortOrder) {
          sorted = [...items].sort((a, b) => {
            let valA, valB;
            if (sortField === 'range_harga') {
              valA = Math.min(...a.tiered_pricing.map(t => t.price));
              valB = Math.min(...b.tiered_pricing.map(t => t.price));
            } else {
              valA = (a as any)[sortField] || '';
              valB = (b as any)[sortField] || '';
            }
            if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
            if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
            return 0;
          });
        }

        setTotalItems(total);
        const offset = (page - 1) * limit;
        setCatalogItems(sorted.slice(offset, offset + limit));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, activeTab, page, limit, sortField, sortOrder]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, activeTab]);

  const handleDelete = async (id: string, name: string) => {
    const confirm = await swalConfig.fire({
      title: 'Hapus Katalog Harga?',
      text: `Anda akan menghapus data harga untuk ${name}. Produk ini akan kembali ke antrian 'Belum Diatur'.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal'
    });

    if (confirm.isConfirmed) {
      const ok = await daftarHargaService.delete(id);
      if (ok) {
        swalToast.fire({ icon: 'success', title: 'Katalog harga berhasil dihapus' });
        fetchData();
      }
    }
  };

  const handleSort = (field: string, direction: 'asc' | 'desc' | null) => {
    setSortField(field);
    setSortOrder(direction);
  };

  const tabs = [
    { id: 'unset', label: 'Belum Diatur' },
    { id: 'catalog', label: 'Katalog Harga' },
  ];

  return (
    <MainShell 
      title="Daftar Harga" 
      subtitle="Manajemen katalog harga produk dan pengaturan harga grosir bertingkat"
      hideAdd
      hideSearch
      hideDownload
      id="daftar-harga-main-page"
    >
      <div className="w-full space-y-[1.25rem]">
        <div className={cn("flex items-center justify-between gap-[1rem]", isMobile && "flex-col items-stretch")}>
          <Tabs 
            id="daftar-harga-tabs" 
            activeTab={activeTab} 
            tabs={tabs} 
            onChange={(id) => setActiveTab(String(id))}
            variant="underline"
          />
        </div>

        <div className={cn("flex flex-wrap items-center gap-[0.75rem]", isMobile && "flex-col items-stretch")}>
          <div className={cn(isMobile ? "w-full" : "w-1/3")}>
            <SearchInput 
              id="daftar-harga-search"
              value={searchTerm}
              onSearch={(val) => setSearchTerm(val)}
              placeholder="Cari Produk atau SKU..."
              className="bg-white !rounded-[0.75rem] shadow-sm"
            />
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-[0.5rem] bg-[#f0fdf4] px-[0.75rem] py-[0.5rem] rounded-[0.75rem] border border-[#dcfce7]">
            <Package size={16} className="text-[#166534]" />
            <span className="text-[0.8125rem] font-bold text-[#166534] uppercase tracking-wider">
              {totalItems} Item {activeTab === 'unset' ? 'Perlu Diatur' : 'Sudah Aktif'}
            </span>
          </div>
        </div>

        <Table id="daftar-harga-table" noBorder={true} className="!text-FontSizeXs">
          <TableHeader>
            <TableRow noBorder={true} isHeader={true}>
              <TableHead 
                isSortable 
                sortDirection={sortField === 'sku' ? sortOrder : null} 
                onSort={(dir) => handleSort('sku', dir)}
              >
                SKU
              </TableHead>
              <TableHead 
                isSortable 
                sortDirection={sortField === 'category' ? sortOrder : null} 
                onSort={(dir) => handleSort('category', dir)}
              >
                Kategori
              </TableHead>
              <TableHead 
                isSortable 
                sortDirection={sortField === 'sub_category' ? sortOrder : null} 
                onSort={(dir) => handleSort('sub_category', dir)}
              >
                Sub Kategori
              </TableHead>
              <TableHead 
                isSortable 
                sortDirection={sortField === 'name' ? sortOrder : null} 
                onSort={(dir) => handleSort('name', dir)}
              >
                Nama Produk
              </TableHead>
              <TableHead 
                isSortable 
                sortDirection={sortField === 'unit' ? sortOrder : null} 
                onSort={(dir) => handleSort('unit', dir)}
              >
                Satuan
              </TableHead>
              <TableHead>
                Harga Satuan
              </TableHead>
              {activeTab === 'catalog' && (
                <>
                  <TableHead 
                    isSortable 
                    sortDirection={sortField === 'range_harga' ? sortOrder : null} 
                    onSort={(dir) => handleSort('range_harga', dir)}
                  >
                    Range Harga
                  </TableHead>
                  <TableHead className="text-right w-24">Aksi</TableHead>
                </>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <TableRow key={`skeleton-${idx}`} noBorder={true}>
                  <TableCell noBorder={true}><Skeleton className="h-[2rem] w-full" /></TableCell>
                  <TableCell noBorder={true}><Skeleton className="h-[2rem] w-full" /></TableCell>
                  <TableCell noBorder={true}><Skeleton className="h-[2rem] w-full" /></TableCell>
                  <TableCell noBorder={true}><Skeleton className="h-[2rem] w-full" /></TableCell>
                  <TableCell noBorder={true}><Skeleton className="h-[2rem] w-full" /></TableCell>
                  <TableCell noBorder={true}><Skeleton className="h-[2rem] w-full" /></TableCell>
                  {activeTab === 'catalog' && (
                    <>
                      <TableCell noBorder={true}><Skeleton className="h-[2rem] w-full" /></TableCell>
                      <TableCell noBorder={true}><Skeleton className="h-[2rem] w-full" /></TableCell>
                    </>
                  )}
                </TableRow>
              ))
            ) : activeTab === 'unset' ? (
               unsetItems.length > 0 ? unsetItems.map((item) => (
                <TableRow 
                  key={item.id} 
                  noBorder={true} 
                  className="group hover:bg-ColorPrimary/opacity-OpacityMuted cursor-pointer transition-colors"
                  onClick={() => {
                    setSelectedSku(item.sku);
                    setEditData(null);
                    setIsFormOpen(true);
                  }}
                >
                  <TableCell noBorder={true} className="!text-left !text-FontSizeXs">
                    <span className="text-FontSizeXs text-TextColorMuted font-bold">{item.sku}</span>
                  </TableCell>
                  <TableCell noBorder={true} className="!text-FontSizeXs">
                    <div className="inline-flex px-SpacingSmall py-SpacingNano rounded-RadiusFull bg-ColorPrimary/10 text-FontSizeXs font-semibold text-ColorPrimary border border-transparent">
                      {item.category}
                    </div>
                  </TableCell>
                  <TableCell noBorder={true} className="!text-FontSizeXs">
                    <span className="text-FontSizeXs text-TextColorMuted">{item.sub_category || '-'}</span>
                  </TableCell>
                  <TableCell noBorder={true} className="!text-FontSizeXs">
                    <span className="text-FontSizeXs font-bold text-TextColorBase">{item.name}</span>
                  </TableCell>
                  <TableCell noBorder={true} className="!text-FontSizeXs">
                    <span className="text-FontSizeXs text-TextColorMuted font-medium">{item.unit}</span>
                  </TableCell>
                  <TableCell noBorder={true} className="!text-FontSizeXs">
                    <span className="text-FontSizeXs text-TextColorBase">{formatCurrency(item.base_price || 0)}</span>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow noBorder={true}>
                  <TableCell colSpan={6} noBorder={true} className="h-[12rem] text-TextColorMuted italic text-center text-FontSizeXs">
                    Semua produk sudah memiliki katalog harga
                  </TableCell>
                </TableRow>
              )
            ) : (
              catalogItems.length > 0 ? catalogItems.map((item) => {
                const minPrice = Math.min(...item.tiered_pricing.map(t => t.price));
                const maxPrice = Math.max(...item.tiered_pricing.map(t => t.price));
                
                return (
                  <TableRow 
                    key={item.id} 
                    noBorder={true} 
                    className="cursor-pointer group hover:bg-ColorPrimary/opacity-OpacityMuted transition-colors text-FontSizeXs"
                    onClick={() => {
                      setSelectedId(item.id);
                      setIsDetailOpen(true);
                    }}
                  >
                    <TableCell noBorder={true} className="!text-left !text-FontSizeXs">
                      <span className="text-FontSizeXs text-TextColorMuted font-bold">{item.sku}</span>
                    </TableCell>
                    <TableCell noBorder={true} className="!text-FontSizeXs">
                      <div className="inline-flex px-SpacingSmall py-SpacingNano rounded-RadiusFull bg-ColorPrimary/10 text-FontSizeXs font-semibold text-ColorPrimary border border-transparent">
                        {item.category}
                      </div>
                    </TableCell>
                    <TableCell noBorder={true} className="!text-FontSizeXs">
                      <span className="text-FontSizeXs text-TextColorMuted">{item.sub_category || '-'}</span>
                    </TableCell>
                    <TableCell noBorder={true} className="!text-FontSizeXs">
                      <span className="text-FontSizeXs font-bold text-TextColorBase">{item.name}</span>
                    </TableCell>
                    <TableCell noBorder={true} className="!text-FontSizeXs">
                      <span className="text-FontSizeXs text-TextColorMuted font-medium">{item.unit}</span>
                    </TableCell>
                    <TableCell noBorder={true} className="!text-FontSizeXs">
                      <span className="text-FontSizeXs text-TextColorBase">{formatCurrency(skuToPriceMap[item.sku] || 0)}</span>
                    </TableCell>
                    <TableCell noBorder={true} className="!text-FontSizeXs">
                      <div className="flex flex-col items-center">
                        <span className="text-FontSizeXs font-bold text-ColorPrimary">
                          {minPrice === maxPrice ? formatCurrency(minPrice) : `${formatCurrency(minPrice)} - ${formatCurrency(maxPrice)}`}
                        </span>
                        <span className="text-FontSizeNano text-TextColorMuted font-bold uppercase tracking-wider">
                          {item.tiered_pricing.length} Level Harga
                        </span>
                      </div>
                    </TableCell>
                    <TableCell noBorder={true} onClick={(e) => e.stopPropagation()} className="!text-FontSizeXs">
                      <div className="flex items-center justify-end gap-SpacingNano">
                        <GhostButton
                          id={`edit-price-${item.id}`}
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditData(item);
                            setSelectedSku(item.sku);
                            setIsFormOpen(true);
                          }}
                          className="!p-1"
                        >
                          <Edit size="1rem" className="text-ColorSecondary" />
                        </GhostButton>
                        <GhostButton
                          id={`delete-price-${item.id}`}
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(item.id, item.name);
                          }}
                          className="!p-1"
                        >
                          <Trash2 size="1rem" className="text-FeedbackColorError" />
                        </GhostButton>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              }) : (
                <TableRow noBorder={true}>
                  <TableCell colSpan={8} noBorder={true} className="h-[12rem] text-TextColorMuted italic text-center text-FontSizeXs">
                    Belum ada katalog harga aktif
                  </TableCell>
                </TableRow>
              )
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
          id="daftar-harga-pagination"
        />
      </div>

      <DaftarHargaFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={fetchData}
        editData={editData}
        skuInitial={selectedSku || undefined}
      />

      <DaftarHargaDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        id={selectedId || undefined}
      />
    </MainShell>
  );
};

export default DaftarHargaPage;
