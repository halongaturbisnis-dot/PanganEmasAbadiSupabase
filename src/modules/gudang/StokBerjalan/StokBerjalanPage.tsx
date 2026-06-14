import React, { useState, useEffect } from 'react';
import { MainShell } from '../../../ui/components/common/shells/MainShell';
import { DataTablePlus } from '../../../ui/components/common/DataTablePlus';
import { stokBerjalanService } from '../../../logic/services/stokBerjalanService';
import { IStokBerjalan } from '../../../logic/types/ITs_StokBerjalan';
import { Badge } from '../../../ui/components/elements/Badge';
import { useGlobalState } from '../../../logic/context/GlobalContext';
import { formatNumber } from '../../../logic/utils/data';
import { formatDateFull } from '../../../logic/utils/date';
import { SearchInput } from '../../../ui/components/elements/Inputs';
import { 
  RefreshCcw,
  Trash2,
  Undo2
} from 'lucide-react';
import { cn } from '../../../logic/utils/cn';
import { InlineLoading } from '../../../ui/components/LoadingState/InlineLoading';
import { swalConfig, toast as swalToast } from '../../../logic/utils/swalConfig';
import { Tabs } from '../../../ui/components/common/Tabs';

/**
 * StokBerjalanPage Component
 * Halaman utama untuk pemantauan stok berjalan secara real-time.
 */
export const StokBerjalanPage: React.FC = () => {
  const { state } = useGlobalState();
  const [data, setData] = useState<IStokBerjalan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState<number>(1);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const result = await stokBerjalanService.getPaginated(page, 15, search, undefined, activeTab);
      setData(result.items);
      setTotalCount(result.total);
    } catch (error) {
      console.error('Error fetching stok berjalan:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const result = await swalConfig.fire({
      title: 'Hapus Data Stok?',
      text: `Apakah Anda yakin ingin menonaktifkan data master stok untuk "${name}"? Data masih dapat dikembalikan nanti.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Nonaktifkan',
      cancelButtonText: 'Batal',
      confirmButtonColor: 'var(--color-error)'
    });

    if (result.isConfirmed) {
      try {
        const success = await stokBerjalanService.delete(id);
        if (success) {
          swalToast.fire({
            icon: 'success',
            title: 'Data Berhasil Dinonaktifkan'
          });
          fetchData();
        } else {
          swalToast.fire({
            icon: 'error',
            title: 'Gagal Menonaktifkan Data'
          });
        }
      } catch (error) {
        console.error('Delete error:', error);
        swalToast.fire({
          icon: 'error',
          title: 'Terjadi Kesalahan'
        });
      }
    }
  };

  const handleRestore = async (id: string, name: string) => {
    const result = await swalConfig.fire({
      title: 'Pulihkan Data Stok?',
      text: `Apakah Anda yakin ingin memulihkan data master stok untuk "${name}"?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Ya, Pulihkan',
      cancelButtonText: 'Batal',
    });

    if (result.isConfirmed) {
      try {
        const success = await stokBerjalanService.update(id, { is_active: 1 } as any);
        if (success) {
          swalToast.fire({
            icon: 'success',
            title: 'Data Berhasil Dipulihkan'
          });
          fetchData();
        } else {
          swalToast.fire({
            icon: 'error',
            title: 'Gagal Memulihkan Data'
          });
        }
      } catch (error) {
        console.error('Restore error:', error);
        swalToast.fire({
          icon: 'error',
          title: 'Terjadi Kesalahan'
        });
      }
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, search, activeTab]);

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
      key: 'unit',
      label: 'Satuan',
      render: (row: IStokBerjalan) => <span className="!text-FontSizeXs">{row.unit}</span>
    },
    {
      key: 'last_so_datetime',
      label: 'Waktu SO Terakhir',
      render: (row: IStokBerjalan) => {
        if (!row.last_so_datetime) return <span className="!text-FontSizeXs text-TextColorMuted">-</span>;
        
        // Sesuai TimeRule.md, database menyimpan dalam UTC. 
        // Tambahkan 'Z' agar parser browser memperlakukannya sebagai UTC sebelum konversi ke lokal.
        const dateRaw = String(row.last_so_datetime);
        const dateStr = !dateRaw.includes('Z') && !dateRaw.includes('+') 
          ? `${dateRaw.replace(' ', 'T')}Z` 
          : dateRaw;

        return (
          <span className="!text-FontSizeXs text-TextColorMuted">
            {formatDateFull(dateStr)}
          </span>
        );
      }
    },
    {
      key: 'qty_so',
      label: 'Qty SO Terakhir',
      render: (row: IStokBerjalan) => <span className="!text-FontSizeXs">{formatNumber(row.qty_so)}</span>
    },
    {
      key: 'qty_in_after_so',
      label: 'Stok Masuk',
      render: (row: IStokBerjalan) => (
        <span className="text-green-600 font-semibold !text-FontSizeXs">+{formatNumber(row.qty_in_after_so)}</span>
      )
    },
    {
      key: 'qty_retur_after_so',
      label: 'Stok Retur',
      render: (row: IStokBerjalan) => (
        <span className="text-orange-500 !text-FontSizeXs">{formatNumber(row.qty_retur_after_so)}</span>
      )
    },
    {
      key: 'qty_terjual',
      label: 'Stok Terjual',
      render: (row: IStokBerjalan) => (
        <span className="text-blue-600 !text-FontSizeXs">-{formatNumber(row.qty_terjual)}</span>
      )
    },
    {
      key: 'qty_terbuang_only',
      label: 'Stok Terbuang',
      render: (row: IStokBerjalan) => (
        <span className="text-red-500 !text-FontSizeXs">-{formatNumber(row.qty_terbuang_only)}</span>
      )
    },
    {
      key: 'qty_current',
      label: 'Sisa Stok',
      render: (row: IStokBerjalan) => {
        const isLow = row.qty_current <= 5;
        return (
          <div className="flex flex-col gap-1 items-end !text-FontSizeXs">
            <span className={cn(
              "font-black !text-FontSizeXs",
              isLow ? "text-FeedbackColorError" : "text-TextColorBase"
            )}>
              {formatNumber(row.qty_current)}
            </span>
            {isLow && (
              <Badge variant="error" size="sm">Menipis</Badge>
            )}
          </div>
        );
      }
    },
    {
      key: 'actions',
      label: 'Aksi',
      render: (row: IStokBerjalan) => (
        <div className="flex items-center gap-2">
          {activeTab === 1 ? (
            <button
              onClick={() => handleDelete(row.id, row.name)}
              className="p-2 text-FeedbackColorError hover:bg-FeedbackColorError/10 rounded-full transition-colors"
              title="Nonaktifkan Produk"
            >
              <Trash2 size="0.75rem" />
            </button>
          ) : (
            <button
              onClick={() => handleRestore(row.id, row.name)}
              className="p-2 text-ColorPrimary hover:bg-ColorPrimary/10 rounded-full transition-colors"
              title="Pulihkan Produk"
            >
              <Undo2 size="0.75rem" />
            </button>
          )}
        </div>
      )
    }
  ];

  const tabItems = [
    { id: 1, label: 'Stok Aktif' },
    { id: 0, label: 'Stok Non Aktif' }
  ];

  return (
    <MainShell
      title="Pemantauan Stok Berjalan"
      subtitle="Monitoring status ketersediaan barang secara real-time"
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
      <div id="stok-berjalan-page-content" className="space-y-SpacingSmall">
        {/* Tabs Section */}
        <div className="bg-ColorBg overflow-x-auto rounded-RadiusLarge">
          <Tabs 
            tabs={tabItems} 
            activeTab={activeTab} 
            onChange={(id) => setActiveTab(id as number)} 
            variant="underline"
          />
        </div>

        {/* List Section */}
        <div id="stok-berjalan-table-wrapper" className="relative min-h-[300px]">
          {isLoading && (
            <div id="stok-berjalan-loading" className="absolute inset-0 z-10 bg-ColorBg/50 flex items-center justify-center backdrop-blur-[1px]">
              <InlineLoading id="stok-berjalan-spinner" />
            </div>
          )}
          <DataTablePlus
            id="stok-berjalan-minimal"
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

export default StokBerjalanPage;
