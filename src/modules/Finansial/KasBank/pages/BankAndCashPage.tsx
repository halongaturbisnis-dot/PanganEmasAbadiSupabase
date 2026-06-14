import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainShell } from '../../../../ui/components/common/shells/MainShell';
import { Card, CardContent } from '../../../../ui/components/common/Card';
import { SortDirection } from '../../../../ui/components/common/Table';
import { Pagination } from '../../../../ui/components/common/Pagination';
import { getPageFetchLimit } from '../../../../logic/services/fetchingCenter';
import { bankAndCashService } from '../../../../logic/services/bankAndCashService';
import { IBankAndCash, TBankAndCashType } from '../../../../logic/types/ITs_BankAndCash';
import { Edit, Trash2, Eye, Banknote, Building2 } from 'lucide-react';
import { GhostButton, DangerButton } from '../../../../ui/components/elements/Button';
import { SearchInput } from '../../../../ui/components/elements/Inputs';
import { Skeleton } from '../../../../ui/components/elements/Skeleton';
import { swalConfig, toast as swalToast } from '../../../../logic/utils/swalConfig';
import { tokens } from '../../../../ui/styles/tokens';
import { cn } from '../../../../logic/utils/cn';
import { useGlobalState } from '../../../../logic/context/GlobalContext';

/**
 * BANK AND CASH PAGE
 * Halaman utama untuk manajemen data Kas & Bank.
 */
export const BankAndCashPage: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useGlobalState();
  const { isMobile } = state.viewport;
  const [data, setData] = useState<IBankAndCash[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof IBankAndCash; direction: SortDirection }>({ 
    key: 'nama_akun', 
    direction: 'asc' 
  });
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = getPageFetchLimit('DaftarBankAndCash');

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    const { items, total } = await bankAndCashService.getPaginated(
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
      title: 'Hapus Akun Kas/Bank?',
      text: 'Data yang dihapus tidak dapat dikembalikan! Semua data berkaitan dengan data yg dihapus tersebut berpotensi akan ikut terhapus.',
      icon: 'error',
      showCancelButton: true,
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal',
      confirmButtonColor: tokens.semantic.colors.light.FeedbackColorError,
    }).then(async (result) => {
      if (result.isConfirmed) {
        const success = await bankAndCashService.delete(id);
        if (success) {
          swalToast.fire({ icon: 'success', title: 'Data berhasil dihapus' });
          fetchData();
        } else {
          swalToast.fire({ icon: 'error', title: 'Gagal menghapus data' });
        }
      }
    });
  };

  return (
    <MainShell 
      title="Manajemen Kas & Bank" 
      subtitle="Kelola rekening bank dan saldo kas operasional"
      onAdd={() => navigate('/finansial/kas-bank/tambah')}
      onSearchChange={(val) => setSearchTerm(val)}
      hideDownload={true}
      hideHeaderDivider={true}
      id="kas-bank-main-page"
    >
      <div className="w-full space-y-SpacingBase">
        <div className={cn("flex items-center gap-SpacingSmall", isMobile && "flex-col items-stretch")}>
          <div className={cn(isMobile ? "w-full" : "w-1/3")}>
            <SearchInput 
              id="kas-bank-search-input"
              value={searchTerm}
              onSearch={(val) => setSearchTerm(val)}
              placeholder="Cari nama akun atau bank..."
              className="bg-ColorBg !rounded-RadiusMedium !border-ColorPrimary/25 hover:!border-ColorPrimary focus:!border-ColorPrimary focus-visible:!border-ColorPrimary focus:!ring-0 focus-visible:!ring-0 transition-all shadow-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-SpacingBase">
          {isLoading ? (
            Array.from({ length: limit }).map((_, idx) => (
              <Card key={`skeleton-${idx}`} className="aspect-[1.6/1]">
                <CardContent className="p-SpacingBase flex flex-col gap-SpacingSmall h-full">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2 mt-auto" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))
          ) : data.length > 0 ? (
            data.map((row) => (
              <Card 
                key={row.id} 
                className="group relative transition-all duration-300 hover:-translate-y-1 bg-White overflow-hidden border-none cursor-pointer h-full flex flex-col min-h-[14rem]"
                onClick={() => navigate(`/finansial/kas-bank/detail/${row.id}`)}
              >
                {/* Decorative Gradient Header */}
                <div className={cn(
                  "h-16 w-full relative overflow-hidden",
                  row.tipe === TBankAndCashType.KAS 
                    ? "bg-linear-to-r from-orange-400 to-amber-300" 
                    : "bg-linear-to-r from-teal-500 to-cyan-400"
                )}>
                  {/* Subtle Wave SVG */}
                  <svg className="absolute bottom-0 left-0 w-full opacity-20" viewBox="0 0 1440 320" preserveAspectRatio="none">
                    <path fill="#ffffff" fillOpacity="1" d="M0,192L48,197.3C96,203,192,213,288,192C384,171,480,117,576,112C672,107,768,149,864,165.3C960,181,1056,171,1152,144C1248,117,1344,75,1392,53.3L1440,32L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
                  </svg>
                  
                  {/* Status & Actions Overlay */}
                  <div className="absolute top-2 right-2 flex items-center gap-SpacingNano" onClick={(e) => e.stopPropagation()}>
                    {row.is_default === 1 && (
                      <span className="bg-FeedbackColorError backdrop-blur-md text-White px-SpacingSmall py-0.5 rounded-RadiusFull text-[0.6rem] font-black uppercase tracking-widest border border-White/30 mr-SpacingTiny">
                        DEFAULT
                      </span>
                    )}
                    {row.tipe !== TBankAndCashType.KAS && (
                      <button 
                        onClick={() => navigate(`/finansial/kas-bank/edit/${row.id}`)}
                        className="p-1.5 rounded-RadiusSmall bg-White/20 hover:bg-White/40 text-White transition-colors"
                      >
                        <Edit size={14} />
                      </button>
                    )}
                    <button 
                      onClick={() => row.is_deletable !== 0 && handleDelete(row.id)}
                      disabled={row.is_deletable === 0}
                      className={cn(
                        "p-1.5 rounded-RadiusSmall transition-colors",
                        row.is_deletable === 0 ? "opacity-30 text-White/50 cursor-not-allowed" : "bg-White/20 hover:bg-FeedbackColorError text-White"
                      )}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <CardContent className="pt-0 px-SpacingBase pb-SpacingBase flex-1 flex flex-col relative">
                  {/* Floating Icon Container */}
                  <div className="absolute -top-7 left-SpacingBase">
                    <div className="w-14 h-14 bg-White rounded-2xl shadow-ElevationNormal flex items-center justify-center border border-ColorBgSecondary/10 group-hover:shadow-ElevationHigh transition-shadow">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center",
                        row.tipe === TBankAndCashType.KAS ? "bg-orange-50 text-orange-500" : "bg-teal-50 text-teal-600"
                      )}>
                        {row.tipe === TBankAndCashType.KAS ? <Banknote size={24} strokeWidth={1.5} /> : <Building2 size={24} strokeWidth={1.5} />}
                      </div>
                    </div>
                  </div>

                  {/* Main Content Areas */}
                  <div className="mt-9 flex flex-col flex-1">
                    <h3 className="font-extrabold text-FontSizeBase text-TextColorBase leading-tight tracking-tight uppercase line-clamp-1 group-hover:text-ColorPrimary transition-colors">
                      {row.nama_akun}
                    </h3>
                    
                    <div className={cn(
                      "text-[0.65rem] font-black uppercase tracking-[0.25em] mt-1 opacity-60",
                      row.tipe === TBankAndCashType.KAS ? "text-orange-600" : "text-teal-700"
                    )}>
                      {row.tipe}
                    </div>

                    <div className="mt-auto pt-SpacingSmall border-t border-ColorSidebarBorder/5">
                      {row.tipe === TBankAndCashType.BANK ? (
                        <div className="space-y-0.5">
                          <div className="text-FontSizeSm font-bold text-TextColorBase opacity-90 truncate">{row.nama_bank}</div>
                          <div className="text-[0.7rem] font-mono text-TextColorBase opacity-60 tracking-wider">
                            {row.nomor_rekening}
                          </div>
                          <div className="text-[0.55rem] font-bold text-TextColorBase opacity-40 uppercase tracking-tight truncate mt-1">
                            {row.nama_pemilik}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-SpacingSmall h-10">
                          <div className="h-1.5 w-1.5 rounded-full bg-orange-400 animate-pulse" />
                          <span className="text-FontSizeNano font-bold text-orange-600/50 uppercase tracking-[0.2em] italic">
                            Internal Kas Tunai
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full h-64 flex items-center justify-center text-TextColorBase opacity-30 italic bg-ColorBgSecondary/5 rounded-RadiusLarge border border-dashed border-ColorSidebarBorder/OpacityMuted">
              Data tidak ditemukan
            </div>
          )}
        </div>

        <Pagination
          currentPage={page}
          totalPages={Math.ceil(totalItems / limit)}
          totalItems={totalItems}
          perPage={limit}
          onPageChange={(p) => setPage(p)}
          className="mt-SpacingMedium"
          id="kas-bank-pagination"
        />
      </div>
    </MainShell>
  );
};

export default BankAndCashPage;
