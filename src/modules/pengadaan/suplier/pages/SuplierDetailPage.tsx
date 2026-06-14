import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DetailShell } from '../../../../ui/components/common/shells/DetailShell';
import { suplierService } from '../../../../logic/services/suplierService';
import { ISuplier } from '../../../../logic/types/ITs_Suplier';
import { toast } from 'react-hot-toast';
import { PageLoading } from '../../../../ui/components/LoadingState/PageLoading';
import { Label } from '../../../../ui/components/elements/Label';
import { AuditTrail } from '../../../../ui/components/elements/AuditTrail';
import { cn } from '../../../../logic/utils/cn';
import { swalConfig, toast as swalToast } from '../../../../logic/utils/swalConfig';
import { tokens } from '../../../../ui/styles/tokens';
import { useGlobalState } from '../../../../logic/context/GlobalContext';
import { MapViewer } from '../../../../ui/components/elements/MapViewer';
import { PhoneDisplay } from '../../../../ui/components/elements/PhoneDisplay';
import { pembelianService } from '../../../../logic/services/pembelianService';
import { IPembelian, TPembelianStatus } from '../../../../logic/types/ITs_Pembelian';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../../../../ui/components/common/Table';
import { Pagination } from '../../../../ui/components/common/Pagination';
import { formatCurrency } from '../../../../logic/utils/data';
import { Skeleton } from '../../../../ui/components/elements/Skeleton';
import { ShoppingBag, Box, AlertCircle, CheckCircle2, PackageOpen, PackageCheck, ShoppingCart, Truck } from 'lucide-react';

/**
 * SUPLIER DETAIL PAGE
 * Halaman rincian data Suplier (Read-only).
 * Layout sinkron dengan FormPage (Split Panel).
 */
export const SuplierDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state } = useGlobalState();
  const { isMobile, isTablet, isWide } = state.viewport;
  const [data, setData] = useState<ISuplier | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Pembelian History State
  const [pembelianData, setPembelianData] = useState<(IPembelian & { 
    supplier_name?: string; 
    customer_name?: string; 
    total_produk_pembelian?: number;
    total_produk_diterima?: number;
  })[]>([]);
  const [pembelianPage, setPembelianPage] = useState(1);
  const [totalPembelian, setTotalPembelian] = useState(0);
  const [isPembelianLoading, setIsPembelianLoading] = useState(false);
  const pembelianLimit = 10;

  useEffect(() => {
    loadData();
    fetchPembelian();
  }, [id, pembelianPage]);

  const loadData = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
        const result = await suplierService.getById(id);
        if (result) {
          setData(result);
        } else {
          toast.error('Suplier tidak ditemukan');
          navigate('/pengadaan/suplier');
        }
    } catch (err) {
        toast.error('Gagal memuat detail suplier');
    } finally {
        setIsLoading(false);
    }
  };

  const fetchPembelian = useCallback(async () => {
    if (!id) return;
    setIsPembelianLoading(true);
    try {
      const { items, total } = await pembelianService.getPaginated(pembelianPage, '', {
        supplier_id: id,
        limit: pembelianLimit
      });
      setPembelianData(items);
      setTotalPembelian(total);
    } catch (err) {
      console.error('Gagal fetch pembelian suplier', err);
    } finally {
      setIsPembelianLoading(false);
    }
  }, [id, pembelianPage]);

  const handleDelete = async () => {
    if (!id) return;
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
          navigate('/pengadaan/suplier');
        } else {
          swalToast.fire({ icon: 'error', title: 'Gagal menghapus suplier' });
        }
      }
    });
  };

  const formatTanggal = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  const getStatusBadge = (row: (IPembelian & { 
    has_internal_shipping?: boolean;
    total_produk_pembelian?: number;
    total_produk_diterima?: number;
  })) => {
    const totalProduk = row.total_produk_pembelian || 0;
    const totalDiterima = row.total_produk_diterima || 0;

    if (totalDiterima > 0) {
      if (totalDiterima < totalProduk) {
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-ColorSecondary/10 text-ColorSecondary border border-ColorSecondary/20">
            <PackageOpen size={12} />
            Parsial
          </span>
        );
      } else {
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-ColorPrimary/10 text-ColorPrimary border border-ColorPrimary/20">
            <PackageCheck size={12} />
            Lengkap
          </span>
        );
      }
    }

    if (row.penjualan_id) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 border border-purple-200">
          <ShoppingBag size={12} />
          Dropship
        </span>
      );
    }

    if (row.has_internal_shipping && row.shipping_type === 'Internal') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200">
          <Truck size={12} />
          Kirim
        </span>
      );
    }

    switch (row.status) {
      case TPembelianStatus.DRAFT:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
            <Box size={12} />
            Muat
          </span>
        );
      case TPembelianStatus.PENDING:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <AlertCircle size={12} />
            Pending
          </span>
        );
      case TPembelianStatus.COMPLETED:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 size={12} />
            Selesai
          </span>
        );
      case TPembelianStatus.CANCELLED:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            <AlertCircle size={12} />
            Batal
          </span>
        );
      default:
        return row.status;
    }
  };

  if (!data && !isLoading) return null;

  const ValueBox: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
    <div className={cn(
      "flex h-[2.5rem] w-full rounded-RadiusMedium border border-ColorPrimary/30 bg-ColorBg px-SpacingSmall py-SpacingTiny text-FontSizeSm text-TextColorBase items-center font-bold",
      className
    )}>
      <span className="truncate w-full">{children}</span>
    </div>
  );

  return (
    <DetailShell
      id={data?.id || "loading"}
      title={data?.name || "Memuat Rincian..."}
      isLoading={isLoading}
      onBack={() => navigate('/pengadaan/suplier')}
      onEdit={data ? () => navigate(`/pengadaan/suplier/edit/${data.id}`) : undefined}
      onDelete={data ? handleDelete : undefined}
    >
      {data && (
        <div className="flex flex-col gap-SpacingLarge w-full">
        
        {/* Statistics Summary Card */}
        <div className={cn(
          "grid gap-SpacingMedium",
          isMobile ? "grid-cols-1" : "grid-cols-4"
        )}>
           <div className={cn(
              "p-5 rounded-3xl justify-center flex flex-col shadow-sm relative overflow-hidden bg-[linear-gradient(to_top,#1D976C,#93F9B9)] text-white",
              isMobile ? "h-32" : "h-36"
            )}>
              <div className="absolute top-2 right-2 opacity-20 transform scale-150 p-2">
                <ShoppingCart size={48} />
              </div>
              <div className="space-y-1 relative z-10">
                <span className="text-white text-[0.6875rem] font-bold uppercase tracking-wider block opacity-80">Total Transaksi Pembelian</span>
                <span className="text-white text-[1.5rem] font-black tracking-tight block break-all leading-tight">
                  {totalPembelian} <span className="text-FontSizeBase font-medium opacity-80 uppercase tracking-widest ml-1">KALI</span>
                </span>
              </div>
            </div>
            
            {/* Can add more cards here if needed, like total value bought from this supplier */}
        </div>

        {/* Main Content: Split Layout */}
        <div className={cn(
          "grid gap-SpacingLarge w-full h-full",
          isWide ? "lg:grid-cols-12" : "grid-cols-1"
        )}>
          {/* Left Column: Information (6 cols) */}
          <div className={cn(
            "flex flex-col gap-y-SpacingMedium",
            isWide ? "lg:col-span-6" : "w-full"
          )}>
            <div className={cn(
               "grid gap-x-SpacingBase gap-y-SpacingMedium",
               isMobile ? "grid-cols-1" : "grid-cols-2"
            )}>
              <div className="space-y-SpacingSmall">
                <Label id="detail-name">Nama Suplier</Label>
                <ValueBox>{data.name}</ValueBox>
              </div>
              
              <div className="space-y-SpacingSmall">
                <Label id="detail-bank_name">Nama Bank</Label>
                <ValueBox>{data.bank_name || '-'}</ValueBox>
              </div>

              <div className="space-y-SpacingSmall">
                <Label id="detail-telepon">Telepon</Label>
                <ValueBox>
                  <PhoneDisplay value={data.telepon} />
                </ValueBox>
              </div>

              <div className="space-y-SpacingSmall">
                <Label id="detail-no_rekening">Nomor Rekening</Label>
                <ValueBox>{data.no_rekening || '-'}</ValueBox>
              </div>

              <div className="space-y-SpacingSmall">
                <Label id="detail-email">Email</Label>
                <ValueBox title={data.email || '-'}>
                  {data.email || '-'}
                </ValueBox>
              </div>

              <div className="space-y-SpacingSmall">
                <Label id="detail-nama_pemilik_rekening">Nama Pemilik Rekening</Label>
                <ValueBox>{data.nama_pemilik_rekening || '-'}</ValueBox>
              </div>

              <div className={cn(
                "space-y-SpacingSmall",
                !isMobile && "col-span-2"
              )}>
                <Label id="detail-alamat">Alamat Lengkap</Label>
                <ValueBox className="items-start h-auto min-h-[100px] py-SpacingTiny leading-relaxed font-medium">
                  {data.alamat}
                </ValueBox>
              </div>
            </div>
          </div>

          {/* Right Column: Visualization (6 cols) */}
          <div className={cn(
            "relative rounded-RadiusLarge overflow-hidden border border-ColorSidebarBorder/OpacitySubtle shadow-inner min-h-[300px]",
            isWide ? "lg:col-span-6 h-full" : "w-full h-[300px]"
          )}>
            <MapViewer 
              id="suplier-detail-map"
              latlong={data.latlong}
              label={data.name}
              zoom={16}
              height="100%"
              className="w-full h-full !border-none"
            />
          </div>
        </div>

        {/* Purchase History Section */}
        <div className="space-y-SpacingMedium">
          <div className="flex items-center gap-2 border-l-4 border-ColorPrimary pl-3">
             <h3 className="text-FontSizeBase font-bold text-TextColorBase uppercase tracking-wider">Riwayat Transaksi Pembelian</h3>
          </div>
          
          <Table id="suplier-pembelian-table" noBorder={true}>
            <TableHeader>
              <TableRow noBorder={true} isHeader={true}>
                <TableHead>Tanggal</TableHead>
                <TableHead>No PO</TableHead>
                <TableHead>Tujuan</TableHead>
                <TableHead>Total Belanja</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isPembelianLoading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <TableRow key={`skeleton-${idx}`} noBorder={true}>
                    <TableCell noBorder={true} className="px-SpacingBase py-4"><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell noBorder={true} className="px-SpacingBase py-4"><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell noBorder={true} className="px-SpacingBase py-4"><Skeleton className="h-4 w-36" /></TableCell>
                    <TableCell noBorder={true} className="px-SpacingBase py-4"><Skeleton className="h-4 w-24 mx-auto" /></TableCell>
                    <TableCell noBorder={true} className="px-SpacingBase py-4"><Skeleton className="h-6 w-16 mx-auto rounded-full" /></TableCell>
                  </TableRow>
                ))
              ) : pembelianData.length > 0 ? (
                pembelianData.map((row) => (
                  <TableRow
                    key={row.id}
                    noBorder={true}
                    className="cursor-pointer select-none hover:bg-ColorBgSecondary/OpacitySubtle transition-colors"
                    onClick={() => navigate(`/pengadaan/pembelian/detail/${row.id}?referrer=/pengadaan/suplier/detail/${id}`)}
                  >
                    <TableCell noBorder={true} className="!text-left px-SpacingBase py-3 text-FontSizeXs">
                      {formatTanggal(row.datetime)}
                    </TableCell>
                    <TableCell noBorder={true} className="!text-left px-SpacingBase py-3">
                      <span className="font-semibold text-FontSizeXs text-TextColorBase">
                        {row.po_number}
                      </span>
                    </TableCell>
                    <TableCell noBorder={true} className="!text-left px-SpacingBase text-FontSizeXs">
                      {row.customer_name || 'Internal'}
                    </TableCell>
                    <TableCell noBorder={true} className="text-center font-semibold !text-FontSizeXs text-TextColorBase">
                      {formatCurrency(row.grand_total_price)}
                    </TableCell>
                    <TableCell noBorder={true} className="text-center text-FontSizeXs">
                      {getStatusBadge(row)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow noBorder={true}>
                  <TableCell colSpan={5} noBorder={true} className="h-32 text-TextColorMuted italic text-center">
                    Belum ada riwayat transaksi pembelian dengan suplier ini
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {totalPembelian > pembelianLimit && (
            <Pagination
              id="suplier-pembelian-pagination"
              currentPage={pembelianPage}
              totalPages={Math.ceil(totalPembelian / pembelianLimit)}
              totalItems={totalPembelian}
              perPage={pembelianLimit}
              onPageChange={(p) => setPembelianPage(p)}
              className="mt-SpacingSmall"
            />
          )}
        </div>

        {/* Bottom Section: Audit Trail */}
        <AuditTrail 
          createdAt={data.created_at}
          createdBy={data.created_by}
          createdTimezone={data.created_timezone}
          updatedAt={data.updated_at}
          updatedBy={data.updated_by}
          updatedTimezone={data.updated_timezone}
          className="pt-SpacingLarge "
        />
      </div>
      )}
    </DetailShell>
  );
};

export default SuplierDetailPage;
