import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DetailShell } from '../../../ui/components/common/shells/DetailShell';
import { akunService } from '../../../logic/services/akunService';
import { IAkun, TPeran } from '../../../logic/types/ITs_Akun';
import { toast } from 'react-hot-toast';
import { Badge } from '../../../ui/components/elements/Badge';
import { Label } from '../../../ui/components/elements/Label';
import { AuditTrail } from '../../../ui/components/elements/AuditTrail';
import { useGlobalState } from '../../../logic/context/GlobalContext';
import { cn } from '../../../logic/utils/cn';
import { appAssets } from '../../../ui/styles/assets';
import { swalConfig, toast as swalToast } from '../../../logic/utils/swalConfig';
import { tokens } from '../../../ui/styles/tokens';
import { PhoneDisplay } from '../../../ui/components/elements/PhoneDisplay';

/**
 * AKUN DETAIL PAGE
 * Halaman detail untuk melihat data Akun secara lengkap.
 * Layout disesuaikan dengan AkunFormPage (Read-only).
 */
export const AkunDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<IAkun | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { state } = useGlobalState();
  const isMobile = state.viewport.isMobile;

  useEffect(() => {
    loadAccount();
  }, [id]);

  const loadAccount = async () => {
    if (!id) return;
    setIsLoading(true);
    const result = await akunService.getById(id);
    if (result) {
      setData(result);
    } else {
      toast.error('Akun tidak ditemukan');
      navigate('/akun');
    }
    setIsLoading(false);
  };

  const handleDelete = async () => {
    if (!id) return;

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
          navigate('/akun');
        } else {
          swalToast.fire({ icon: 'error', title: 'Gagal menghapus akun' });
        }
      }
    });
  };

  // Cek apakah user yang login adalah pemilik akun ini
  const isOwner = state.user?.id === data?.id || state.user?.user_id === data?.id;

  const ValueBox: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
    <div className={cn(
      "w-full px-SpacingBase py-SpacingSmall rounded-RadiusMedium border border-Slate200 bg-Slate50 min-h-[2.5rem] flex items-center text-FontSizeSm font-medium text-TextColorBase",
      className
    )}>
      {children}
    </div>
  );

  return (
    <DetailShell
      id={data?.id || "akun-detail"}
      title="Detail Akun"
      onBack={() => navigate('/akun')}
      onEdit={data ? () => navigate(`/akun/edit/${data.id}`) : undefined}
      onDelete={data ? handleDelete : undefined}
      isLoading={isLoading}
    >
      {!data ? null : (
        <div className="flex flex-col md:flex-row gap-SpacingLarge items-start w-full">
          {/* Kolom Kiri: Foto Profil (Match AkunFormPage) */}
          <div className="w-full md:w-1/3 flex flex-col items-center justify-start space-y-SpacingSmall">
            <div className="w-48 h-48 rounded-RadiusFull overflow-hidden bg-Slate100 border border-Slate200 shadow-ElevationLow">
              <img 
                src={data.foto_profil || appAssets.AccountPlaceholder} 
                alt={data.username} 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="mt-SpacingSmall">
              <Badge 
                className={cn(
                  "px-SpacingMedium py-SpacingTiny rounded-RadiusFull font-semibold text-FontSizeXs border-none",
                  data.is_active ? "bg-ColorPrimary text-White" : "bg-[#EF4444] text-White"
                )}
              >
                {data.is_active ? 'Aktif' : 'Non-Aktif'}
              </Badge>
            </div>
                            {/* Special Permissions Status */}
                {data.peran === TPeran.ADMIN && (
                  <div className="mt-SpacingMedium pt-SpacingSmall border-t border-Slate200">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-4 h-4 rounded border flex items-center justify-center",
                        data.has_invoice_approval ? "bg-ColorPrimary border-ColorPrimary" : "bg-white border-Slate300"
                      )}>
                        {data.has_invoice_approval && <div className="w-2 h-2 bg-white rounded-full" />}
                      </div>
                      <span className="text-FontSizeSm font-bold text-TextColorBase">
                        Persetujuan Invoice: {data.has_invoice_approval ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </div>
                  </div>
                )}
          </div>

          {/* Kolom Kanan: Detail Informasi (Match AkunFormPage Grid) */}
          <div className="w-full md:w-2/3 space-y-SpacingLarge flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-SpacingLarge gap-y-SpacingMedium">
              
              {/* Row 1: Username & Kode Akses */}
              <div className="space-y-SpacingSmall">
                <Label id="detail-username">Username</Label>
                <ValueBox>{data.username}</ValueBox>
              </div>
              
              <div className="space-y-SpacingSmall">
                <Label id="detail-kode-akses">Kode Akses</Label>
                <ValueBox>{isOwner ? data.kode_akses : '********'}</ValueBox>
              </div>

              {/* Row 2: Phone & Password */}
              <div className="space-y-SpacingSmall">
                <Label id="detail-telepon">Telepon</Label>
                <ValueBox>
                  <PhoneDisplay value={data.telepon} />
                </ValueBox>
              </div>

              <div className="space-y-SpacingSmall">
                <Label id="detail-password">Kata Sandi</Label>
                <ValueBox>{data.password ? '********' : '-'}</ValueBox>
              </div>

              {/* Row 3: Jabatan & Peran */}
              <div className="space-y-SpacingSmall">
                <Label id="detail-jabatan">Jabatan</Label>
                <ValueBox>{data.jabatan}</ValueBox>
              </div>

              <div className="space-y-SpacingSmall">
                <Label id="detail-peran">Peran</Label>
                <ValueBox>{data.peran}</ValueBox>
              </div>
              
              {/* Row 5: Modul Akses */}
              <div className="space-y-SpacingSmall md:col-span-2">
                <Label id="detail-modul-akses">Modul Akses</Label>
                <div className="flex flex-wrap gap-SpacingTiny mt-SpacingNano">
                  {data.akses_modul && data.akses_modul.length > 0 ? (
                    data.akses_modul.map(modul => (
                      <Badge key={modul} variant="secondary" className="px-SpacingMedium py-SpacingTiny">
                        {modul}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-FontSizeXs text-TextColorMuted italic">Tidak ada akses modul spesifik</p>
                  )}
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
        </div>
      )}
    </DetailShell>
  );
};

export default AkunDetailPage;
