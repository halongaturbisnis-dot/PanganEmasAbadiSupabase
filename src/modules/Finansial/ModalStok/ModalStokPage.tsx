import React, { useState, useEffect } from 'react';
import { MainShell } from '../../../ui/components/common/shells/MainShell';
import { DataTablePlus } from '../../../ui/components/common/DataTablePlus';
import { stokBerjalanService } from '../../../logic/services/stokBerjalanService';
import { IStokBerjalan } from '../../../logic/types/ITs_StokBerjalan';
import { useGlobalState } from '../../../logic/context/GlobalContext';
import { formatNumber } from '../../../logic/utils/data';
import { RefreshCcw } from 'lucide-react';
import { cn } from '../../../logic/utils/cn';
import { InlineLoading } from '../../../ui/components/LoadingState/InlineLoading';

/**
 * ModalStokPage Component
 * Halaman untuk melihat harga modal stok produk.
 * Duplikasi dari StokBerjalanPage dengan penyesuaian kolom.
 */
export const ModalStokPage: React.FC = () => {
  const { state } = useGlobalState();
  const [data, setData] = useState<IStokBerjalan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const result = await stokBerjalanService.getPaginated(page, 15, search);
      setData(result.items);
      setTotalCount(result.total);
    } catch (error) {
      console.error('Error fetching modal stok:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, search]);

  const columns = [
    {
      key: 'sku',
      label: 'SKU',
      render: (row: IStokBerjalan) => <span className="!text-FontSizeXs">{row.sku}</span>
    },
    {
      key: 'category',
      label: 'Kategori',
      render: (row: IStokBerjalan) => <span className="!text-FontSizeXs">{row.category}</span>
    },
    {
      key: 'sub_category',
      label: 'Sub Kategori',
      render: (row: IStokBerjalan) => <span className="!text-FontSizeXs">{row.sub_category}</span>
    },
    {
      key: 'name',
      label: 'Nama Produk',
      render: (row: IStokBerjalan) => <span className="font-bold !text-FontSizeXs">{row.name}</span>
    },
    {
      key: 'price_per_unit_running',
      label: 'Harga Satuan',
      render: (row: IStokBerjalan) => (
        <span className="font-semibold !text-FontSizeXs">
          Rp {formatNumber(row.price_per_unit_running)}
        </span>
      )
    }
  ];

  return (
    <MainShell
      title="Harga Stok (Modal)"
      subtitle="Informasi harga modal per unit untuk penentuan harga jual"
      hideAdd
      hideSearch 
      hideDownload
      actions={
        <button 
          onClick={fetchData}
          className="group p-SpacingTiny transition-colors"
          title="Refresh Data"
        >
          <RefreshCcw 
            size="1.25rem" 
            className={cn(
              "transition-colors",
              "group-hover:text-ColorPrimary",
              isLoading && "animate-spin text-ColorPrimary"
            )} 
          />
        </button>
      }
    >
      <div id="modal-stok-page-content" className="space-y-SpacingSmall">
        {/* List Section */}
        <div id="modal-stok-table-wrapper" className="relative min-h-[300px]">
          {isLoading && (
            <div id="modal-stok-loading" className="absolute inset-0 z-10 bg-ColorBg/50 flex items-center justify-center backdrop-blur-[1px]">
              <InlineLoading id="modal-stok-spinner" />
            </div>
          )}
          <DataTablePlus
            id="modal-stok-minimal"
            columns={columns as any}
            data={data}
            onSearchChange={setSearch}
            searchValue={search}
            hideBorder
            hideSelection
          />
        </div>
      </div>
    </MainShell>
  );
};

export default ModalStokPage;
