import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DetailShell } from '../../../../ui/components/common/shells/DetailShell';
import { customerService } from '../../../../logic/services/customerService';
import { ICustomer } from '../../../../logic/types/ITs_Customer';
import { toast } from 'react-hot-toast';
import { Label } from '../../../../ui/components/elements/Label';
import { AuditTrail } from '../../../../ui/components/elements/AuditTrail';
import { MapViewer } from '../../../../ui/components/elements/MapViewer';
import { useGlobalState } from '../../../../logic/context/GlobalContext';
import { cn } from '../../../../logic/utils/cn';
import { swalConfig, toast as swalToast } from '../../../../logic/utils/swalConfig';
import { tokens } from '../../../../ui/styles/tokens';
import { PhoneDisplay } from '../../../../ui/components/elements/PhoneDisplay';

/**
 * CUSTOMER DETAIL PAGE
 * Halaman detail untuk melihat data Customer secara lengkap.
 * Layout sesuai DetailPageUIGuideline.md (Mirroring Form Skema).
 */
export const CustomerDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<ICustomer | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { state } = useGlobalState();
  const isMobile = state.viewport.isMobile;

  useEffect(() => {
    loadCustomer();
  }, [id]);

  const loadCustomer = async () => {
    if (!id) return;
    setIsLoading(true);
    const result = await customerService.getById(id);
    if (result) {
      setData(result);
    } else {
      toast.error('Data customer tidak ditemukan');
      navigate('/penjualan/customer');
    }
    setIsLoading(false);
  };

  const handleDelete = async () => {
    if (!id || !data) return;

    swalConfig.fire({
      title: 'Hapus Customer?',
      text: `Data customer "${data.name}" akan dihapus permanen! Semua data berkaitan dengan data yg dihapus tersebut berpotensi akan ikut terhapus.`,
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
          navigate('/penjualan/customer');
        } else {
          swalToast.fire({ icon: 'error', title: 'Gagal menghapus customer' });
        }
      }
    });
  };

  if (isLoading) return <div className="p-SpacingHuge text-center">Memuat data customer...</div>;
  if (!data) return null;

  const ValueBox: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
    <div className={cn(
      "w-full px-SpacingBase py-SpacingSmall rounded-RadiusMedium border border-ColorSidebarBorder/OpacitySubtle bg-ColorBgSecondary/OpacitySubtle min-h-[2.5rem] flex items-center text-FontSizeSm font-medium text-TextColorBase shadow-sm transition-all",
      className
    )}>
      {children || <span className="italic text-TextColorMuted font-normal">Tidak ada data</span>}
    </div>
  );

  return (
    <DetailShell
      id={data.id}
      title={data.name}
      subtitle={data.company || "Personal Customer"}
      onBack={() => navigate('/penjualan/customer')}
      onEdit={() => navigate(`/penjualan/customer/edit/${data.id}`)}
      onDelete={handleDelete}
    >
      <div className="flex flex-col lg:flex-row gap-SpacingLarge items-start w-full">
        {/* KOLOM KIRI: INFORMASI UTAMA (Mirror Form) */}
        <div className="w-full lg:w-1/2 space-y-SpacingLarge">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-SpacingLarge gap-y-SpacingMedium">
            <div className="space-y-SpacingTiny md:col-span-2">
              <Label id="detail-name">Nama Customer</Label>
              <ValueBox>{data.name}</ValueBox>
            </div>

            <div className="space-y-SpacingTiny">
              <Label id="detail-company">Perusahaan</Label>
              <ValueBox>{data.company}</ValueBox>
            </div>

            <div className="space-y-SpacingTiny">
              <Label id="detail-bidang">Bidang Usaha</Label>
              <ValueBox>{data.bidang_usaha}</ValueBox>
            </div>

            <div className="space-y-SpacingTiny">
              <Label id="detail-telepon">No. Telepon</Label>
              <ValueBox>
                <PhoneDisplay value={data.telepon} />
              </ValueBox>
            </div>

            <div className="space-y-SpacingTiny">
              <Label id="detail-email">Email</Label>
              <ValueBox>{data.email}</ValueBox>
            </div>

            <div className="space-y-SpacingTiny md:col-span-2">
              <Label id="detail-alamat">Alamat Lengkap</Label>
              <div className="w-full px-SpacingBase py-SpacingSmall rounded-RadiusMedium border border-ColorSidebarBorder/OpacitySubtle bg-ColorBgSecondary/OpacitySubtle min-h-[5rem] flex items-start text-FontSizeSm font-medium text-TextColorBase shadow-sm leading-relaxed">
                {data.alamat}
              </div>
            </div>
          </div>
        </div>

        {/* KOLOM KANAN: MAP VIEWER (Mirror MapPicker Position) */}
        <div className="w-full lg:w-1/2 space-y-SpacingTiny">
          <div className="rounded-RadiusLarge overflow-hidden border border-ColorSidebarBorder/OpacitySubtle shadow-inner bg-ColorBgSecondary/OpacitySubtle">
            <MapViewer 
              latlong={data.latlong} 
              label={data.name}
              height={isMobile ? "300px" : "415px"}
            />
          </div>
          <AuditTrail 
            createdAt={data.created_at}
            createdBy={data.created_by}
            createdTimezone={data.created_timezone}
            updatedAt={data.updated_at}
            updatedBy={data.updated_by}
            updatedTimezone={data.updated_timezone}
          />
        </div>
      </div>
    </DetailShell>
  );
};

export default CustomerDetailPage;
