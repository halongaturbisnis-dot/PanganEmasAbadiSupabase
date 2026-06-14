import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DetailShell } from '../../../../ui/components/common/shells/DetailShell';
import { Label } from '../../../../ui/components/elements/Label';
import { Badge } from '../../../../ui/components/elements/Badge';
import { AuditTrail } from '../../../../ui/components/elements/AuditTrail';
import { pengirimanService } from '../../../../logic/services/pengirimanService';
import { IPengirimanPayload, TPengirimanStatus } from '../../../../logic/types/ITs_Pengiriman';
import { toast } from 'react-hot-toast';
import { cn } from '../../../../logic/utils/cn';
import { formatDateFull as formatDateTime } from '../../../../logic/utils/date';
import { swalConfig, toast as swalToast } from '../../../../logic/utils/swalConfig';
import { tokens } from '../../../../ui/styles/tokens';
import { AttachmentDisplay } from '../../../../ui/components/elements/AttachmentDisplay';
import { PhoneDisplay } from '../../../../ui/components/elements/PhoneDisplay';
import { FileText, Truck, User, Phone, MapPin, Calendar, CheckCircle2 } from 'lucide-react';

export const PengirimanDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<(IPengirimanPayload & { po_number?: string; supplier_name?: string }) | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (id) {
      loadData(id);
    }
  }, [id]);

  const loadData = async (pengirimanId: string) => {
    setIsLoading(true);
    try {
      const result = await pengirimanService.getById(pengirimanId);
      if (result) {
        setData(result as any);
      } else {
        toast.error('Data pengiriman tidak ditemukan');
        navigate('/pengadaan/pengiriman');
      }
    } catch (error) {
      toast.error('Gagal memuat data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    swalConfig.fire({
      title: 'Hapus Pengiriman?',
      text: 'Data yang dihapus tidak dapat dikembalikan!',
      icon: 'error',
      showCancelButton: true,
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal',
      confirmButtonColor: tokens.semantic.colors.light.FeedbackColorError,
    }).then(async (result) => {
      if (result.isConfirmed) {
        const success = await pengirimanService.delete(id);
        if (success) {
          swalToast.fire({ icon: 'success', title: 'Data berhasil dihapus' });
          navigate('/pengadaan/pengiriman');
        }
      }
    });
  };

  if (isLoading) return <div className="p-SpacingHuge text-center">Memuat data...</div>;
  if (!data) return null;

  const totalDiterima = (data as any).total_produk_diterima || 0;
  const totalProduk = (data as any).total_produk_pembelian || 0;
  const isLocked = totalDiterima > 0;
  const isComplete = totalDiterima >= totalProduk && totalProduk > 0;

  const ValueBox: React.FC<{ children: React.ReactNode; icon?: React.ReactNode }> = ({ children, icon }) => (
    <div className="w-full px-SpacingBase py-SpacingSmall rounded-RadiusMedium border border-Slate200 bg-Slate50 min-h-[2.75rem] flex items-center gap-SpacingSmall text-FontSizeSm font-medium text-TextColorBase">
      {icon && <div className="text-ColorPrimary opacity-70">{icon}</div>}
      <div className="flex-1">{children || '-'}</div>
    </div>
  );

  return (
    <DetailShell
      id={data.id}
      title={`Pengiriman: ${data.po_number || 'Tanpa PO'}`}
      onBack={() => navigate('/pengadaan/pengiriman')}
      onEdit={isLocked ? undefined : () => navigate(`/pengadaan/pengiriman/edit/${data.id}`)}
      onDelete={isLocked ? undefined : handleDelete}
    >
      <div className="flex flex-col gap-SpacingLarge w-full">
        {/* Status Alert if Locked */}
        {isLocked && (
          <div className={cn(
            "p-SpacingBase rounded-RadiusMedium border flex items-center gap-SpacingBase animate-in fade-in slide-in-from-top-4 duration-DurationSlow",
            isComplete ? "bg-Emerald50 border-Emerald200 text-Emerald900" : "bg-Amber50 border-Amber200 text-Amber900"
          )}>
            <div className={cn("p-SpacingSmall rounded-full", isComplete ? "bg-Emerald100" : "bg-Amber100")}>
              {isComplete ? <CheckCircle2 size={24} className="text-Emerald600" /> : <Truck size={24} className="text-Amber600" />}
            </div>
            <div className="flex-1">
              <p className="text-FontSizeSm font-bold">Data Pengiriman Terkunci</p>
              <p className="text-FontSizeXs opacity-80 leading-tight">
                Penerimaan barang sudah dilakukan berstatus <span className="font-bold underline">{isComplete ? 'Lengkap' : 'Parsial'}</span>. 
                Data ini tidak lagi dapat diubah atau dihapus untuk menjaga integritas riwayat logistik.
              </p>
            </div>
            <Badge variant={isComplete ? "success" : "info"} className="capitalize">
              {isComplete ? 'Lengkap' : 'Parsial'}
            </Badge>
          </div>
        )}

        {/* TOP SECTION: 3 Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-SpacingMedium">
          <div className="space-y-SpacingSmall">
            <Label id="det-po">No. PO</Label>
            <ValueBox icon={<FileText size={18} />}>
              <div className="flex flex-col">
                <span className="font-bold text-Slate900">{data.po_number || '-'}</span>
                <span className="text-[10px] text-TextColorMuted font-medium italic">{data.supplier_name}</span>
              </div>
            </ValueBox>
          </div>
          
          <div className="space-y-SpacingSmall">
            <Label id="det-datetime">Waktu Pengiriman</Label>
            <ValueBox icon={<Calendar size={18} />}>
              {formatDateTime(data.datetime)}
            </ValueBox>
          </div>

          <div className="space-y-SpacingSmall">
            <Label id="det-shipping-type">Jenis Pengiriman</Label>
            <ValueBox icon={<Truck size={18} />}>
              {data.shipping_type}
            </ValueBox>
          </div>
        </div>

        {/* MIDDLE SECTION: 3 Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-SpacingMedium">
          <div className="space-y-SpacingSmall">
            <Label id="det-vehicle">NoPol</Label>
            <ValueBox icon={<CheckCircle2 size={18} />}>
              <span className="font-mono tracking-tight font-bold">{data.vehicle_number}</span>
            </ValueBox>
          </div>

          <div className="space-y-SpacingSmall">
            <Label id="det-vehicle-type">Jenis Kendaraan</Label>
            <ValueBox icon={<Truck size={18} />}>
              {data.vehicle_type}
            </ValueBox>
          </div>

          <div className="space-y-SpacingSmall">
            <Label id="det-phone">No Telp Sopir</Label>
            <ValueBox icon={<Phone size={18} />}>
              <PhoneDisplay value={data.driver_phone} />
            </ValueBox>
          </div>
        </div>

        {/* BOTTOM SECTION: 2 Large Boxes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-SpacingLarge">
          <div className="space-y-SpacingSmall flex flex-col h-full">
            <Label id="det-desc">Deskripsi</Label>
            <div className="flex-1 px-SpacingBase py-SpacingSmall rounded-RadiusMedium border border-Slate200 bg-Slate50 min-h-[150px] text-FontSizeSm">
              <div 
                className="prose prose-slate max-w-none"
                dangerouslySetInnerHTML={{ __html: data.description || '<em class="text-TextColorMuted">Tidak ada catatan tambahan.</em>' }}
              />
            </div>
          </div>

          <div className="space-y-SpacingSmall flex flex-col h-full">
            <Label id="det-proof">Lampiran Bukti Pengiriman</Label>
            <div className="flex-1 min-h-[150px] border border-ColorSidebarBorder/10 rounded-RadiusMedium p-SpacingSmall bg-Slate50/50">
              <AttachmentDisplay files={data.proof_fileurl} />
            </div>
          </div>
        </div>

        {/* Audit Trail */}
        <AuditTrail 
          createdAt={data.created_at} 
          createdBy={data.created_by} 
          createdTimezone={data.created_timezone}
          updatedAt={data.updated_at}
          updatedBy={data.updated_by}
          updatedTimezone={data.updated_timezone}
        />
      </div>
    </DetailShell>
  );
};

export default PengirimanDetailPage;
