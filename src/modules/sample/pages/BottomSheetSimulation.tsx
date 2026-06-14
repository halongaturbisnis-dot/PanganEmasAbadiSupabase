import React, { useState } from 'react';
import { MainShell } from '../../../ui/components/common/shells/MainShell';
import { BottomSheet } from '../../../ui/components/common/BottomSheet';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../ui/components/common/Card';
import { Button } from '../../../ui/components/elements/Button';
import { ThemeLanguageSwitcher } from '../../../ui/components/elements/ThemeLanguageSwitcher';
import { Share2, FileEdit, Trash2, Copy, Settings, CheckCircle } from 'lucide-react';

export const BottomSheetSimulation: React.FC = () => {
  const [isOpenDefault, setIsOpenDefault] = useState(false);
  const [isOpenAction, setIsOpenAction] = useState(false);

  return (
    <MainShell 
      title="Showcase Bottom Sheet"
      headerExtra={<ThemeLanguageSwitcher />}
    >
      <div className="max-w-4xl mx-auto space-y-SpacingLarge pb-SpacingHuge">
        <div className="text-center space-y-SpacingSmall">
          <h1 className="text-FontSizeH1 font-display font-bold text-TextColorBase">
            Showcase Bottom Sheet
          </h1>
          <p className="text-TextColorMuted text-FontSizeBase max-w-2xl mx-auto">
            Mendemonstrasikan komponen Bottom Sheet untuk menampilkan modal atau aksi yang muncul dari bawah (sangat berguna untuk antarmuka mobile).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-SpacingMedium">
          <Card>
            <CardHeader>
              <CardTitle>Bottom Sheet Standar</CardTitle>
              <CardDescription>Menampilkan sheet dengan konten informasi sederhana.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setIsOpenDefault(true)} className="w-full">
                Buka Informasi
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Bottom Sheet Aksi</CardTitle>
              <CardDescription>Menampilkan sheet dengan sekumpulan aksi atau menu.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="secondary" onClick={() => setIsOpenAction(true)} className="w-full">
                Buka Menu Aksi
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Default Bottom Sheet */}
        <BottomSheet 
          isOpen={isOpenDefault} 
          onClose={() => setIsOpenDefault(false)} 
          title="Tentang Versi Ini"
        >
          <div className="space-y-SpacingMedium">
            <div className="p-SpacingBase bg-ColorPrimary/OpacitySubtle rounded-RadiusMedium flex items-start gap-SpacingSmall">
              <CheckCircle className="text-ColorPrimary mt-1 flex-shrink-0" size="1.25rem" />
              <div>
                <h4 className="font-medium text-TextColorBase">Sistem Diperbarui</h4>
                <p className="text-FontSizeSm text-TextColorMuted mt-1">
                  Sistem telah diperbarui ke versi v2.4.1. Pembaruan ini mencakup peningkatan keamanan dan optimasi performa pada modul utama.
                </p>
              </div>
            </div>
            <p className="text-FontSizeSm text-TextColorBase">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla accumsan, metus ultrices eleifend gravida, nulla nunc varius lectus, nec rutrum justo nibh eu lectus.
            </p>
            <Button onClick={() => setIsOpenDefault(false)} className="w-full">
              Tutup
            </Button>
          </div>
        </BottomSheet>

        {/* Action Bottom Sheet */}
        <BottomSheet 
          isOpen={isOpenAction} 
          onClose={() => setIsOpenAction(false)} 
        >
          <div className="space-y-SpacingTiny pb-SpacingBase">
            <h3 className="text-FontSizeBase font-bold text-TextColorBase px-SpacingSmall mb-SpacingSmall">Pilihan Aksi</h3>
            
            {[
              { icon: Share2, label: 'Bagikan Tautan' },
              { icon: Copy, label: 'Salin URL' },
              { icon: FileEdit, label: 'Edit Properti' },
              { icon: Settings, label: 'Pengaturan Lanjutan' },
            ].map((action, i) => (
              <button 
                key={i} 
                className="w-full flex items-center gap-SpacingMedium p-SpacingSmall hover:bg-ColorSidebarAccent rounded-RadiusSmall transition-colors text-left"
                onClick={() => setIsOpenAction(false)}
              >
                <action.icon size="1.25rem" className="text-TextColorMuted" />
                <span className="text-FontSizeSm font-medium text-TextColorBase">{action.label}</span>
              </button>
            ))}
            
            <div className="h-px bg-ColorSidebarBorder/OpacitySubtle my-SpacingSmall"></div>
            
            <button 
              className="w-full flex items-center gap-SpacingMedium p-SpacingSmall hover:bg-FeedbackColorError/OpacitySubtle rounded-RadiusSmall transition-colors text-left"
              onClick={() => setIsOpenAction(false)}
            >
              <Trash2 size="1.25rem" className="text-FeedbackColorError" />
              <span className="text-FontSizeSm font-medium text-FeedbackColorError">Hapus Item</span>
            </button>
          </div>
        </BottomSheet>
      </div>
    </MainShell>
  );
};
