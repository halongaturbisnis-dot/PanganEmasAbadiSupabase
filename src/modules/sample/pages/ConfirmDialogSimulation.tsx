import React, { useState } from 'react';
import { MainShell } from '../../../ui/components/common/shells/MainShell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../ui/components/common/Card';
import { Button } from '../../../ui/components/elements/Button';
import { ThemeLanguageSwitcher } from '../../../ui/components/elements/ThemeLanguageSwitcher';
import { useGlobalState } from '../../../logic/context/GlobalContext';
import { CheckCircle2, ShieldAlert, Trash2 } from 'lucide-react';

export const ConfirmDialogSimulation: React.FC = () => {
  const { confirm } = useGlobalState();
  const [lastAction, setLastAction] = useState<string | null>(null);

  const handleStandardConfirm = () => {
    confirm({
      title: 'Simpan Perubahan',
      message: 'Apakah Anda yakin ingin menyimpan semua perubahan yang telah diedit?',
      variant: 'info',
      confirmLabel: 'Ya, Simpan',
      cancelLabel: 'Batal',
      onConfirm: () => setLastAction('Disimpan (Standar)'),
      onCancel: () => setLastAction('Dibatalkan (Standar)'),
    });
  };

  const handleWarningConfirm = () => {
    confirm({
      title: 'Peringatan Sistem',
      message: 'Anda akan keluar dari halaman ini. Data yang belum tersimpan mungkin akan hilang. Lanjutkan?',
      variant: 'warning',
      confirmLabel: 'Keluar',
      cancelLabel: 'Tetap Disini',
      onConfirm: () => setLastAction('Dikonfirmasi (Peringatan)'),
      onCancel: () => setLastAction('Dibatalkan (Peringatan)'),
    });
  };

  const handleDangerConfirm = () => {
    confirm({
      title: 'Hapus Data Permanen',
      message: 'Tindakan ini tidak dapat dibatalkan. Apakah Anda benar-benar yakin ingin menghapus data pengguna ini secara permanen dari basis data?',
      variant: 'danger',
      confirmLabel: 'Hapus Permanen',
      cancelLabel: 'Batal',
      onConfirm: () => setLastAction('Dihapus (Berbahaya)'),
      onCancel: () => setLastAction('Dibatalkan (Berbahaya)'),
    });
  };

  return (
    <MainShell 
      title="Showcase Confirm Dialog"
      headerExtra={<ThemeLanguageSwitcher />}
    >
      <div className="max-w-4xl mx-auto space-y-SpacingLarge pb-SpacingHuge">
        <div className="text-center space-y-SpacingSmall">
          <h1 className="text-FontSizeH1 font-display font-bold text-TextColorBase">
            Showcase Confirm Dialog
          </h1>
          <p className="text-TextColorMuted text-FontSizeBase max-w-2xl mx-auto">
            Mendemonstrasikan komponen Dialog Konfirmasi global dengan berbagai varian indikasi (Info, Warning, Danger) untuk memvalidasi tindakan kritis dari pengguna.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-SpacingMedium">
          <Card>
            <CardHeader>
              <div className="h-10 w-10 bg-ColorPrimary/OpacitySubtle rounded-RadiusFull flex items-center justify-center mb-SpacingSmall text-ColorPrimary">
                <CheckCircle2 size="1.25rem" />
              </div>
              <CardTitle>Info Standar</CardTitle>
              <CardDescription>Digunakan untuk mengonfirmasi tindakan standar yang tidak merusak data dasar.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={handleStandardConfirm}>Picu Info</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="h-10 w-10 bg-FeedbackColorWarning/OpacitySubtle rounded-RadiusFull flex items-center justify-center mb-SpacingSmall text-FeedbackColorWarning">
                <ShieldAlert size="1.25rem" />
              </div>
              <CardTitle>Peringatan (Warning)</CardTitle>
              <CardDescription>Menandakan tindakan yang perlu diperhatian khusus, meskipun mungkin dapat dibalikkan.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full !border-FeedbackColorWarning !text-FeedbackColorWarning hover:bg-FeedbackColorWarning/OpacitySubtle" onClick={handleWarningConfirm}>Picu Peringatan</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="h-10 w-10 bg-FeedbackColorError/OpacitySubtle rounded-RadiusFull flex items-center justify-center mb-SpacingSmall text-FeedbackColorError">
                <Trash2 size="1.25rem" />
              </div>
              <CardTitle>Berbahaya (Danger)</CardTitle>
              <CardDescription>Sangat destruktif. Digunakan untuk tindakan yang tidak bisa dikembalikan seperti menghapus.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" className="w-full" onClick={handleDangerConfirm}>Picu Berbahaya</Button>
            </CardContent>
          </Card>
        </div>

        {lastAction && (
          <div className="mt-SpacingLarge p-SpacingMedium bg-ColorSidebarAccent/OpacitySubtle border border-ColorSidebarBorder/OpacityMuted rounded-RadiusMedium text-center max-w-md mx-auto animate-in fade-in zoom-in-95">
            <h4 className="text-FontSizeSm font-bold text-TextColorBase mb-SpacingTiny">Status Tindakan Terakhir:</h4>
            <p className="text-ColorPrimary font-mono font-medium">{lastAction}</p>
          </div>
        )}
      </div>
    </MainShell>
  );
};
