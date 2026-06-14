import React, { useState } from 'react';
import { MainShell } from '../../../ui/components/common/shells/MainShell';
import { Tabs } from '../../../ui/components/common/Tabs';
import { BottomSheet } from '../../../ui/components/common/BottomSheet';
import { Card, CardHeader, CardTitle, CardContent } from '../../../ui/components/common/Card';
import { Button, GhostButton, TertiaryButton } from '../../../ui/components/elements/Button';
import { ThemeLanguageSwitcher } from '../../../ui/components/elements/ThemeLanguageSwitcher';
import { GridMenu } from '../../../ui/components/common/GridMenu';
import { SlideshowBanner } from '../../../ui/components/common/SlideshowBanner';
import { useGlobalState } from '../../../logic/context/GlobalContext';
import { Layout, Smartphone, Tablet, Monitor, Info, CreditCard, User, Settings, LogOut, Search, Star, MessageCircle, Heart, Bell } from 'lucide-react';
import { cn } from '../../../logic/utils/cn';

export const VersatileComponentsSample: React.FC = () => {
  const { confirm, toggleCommandPalette } = useGlobalState();
  const [activeTab, setActiveTab] = useState<string | number>('pills');
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [shouldCrash, setShouldCrash] = useState(false);

  if (shouldCrash) {
    throw new Error("Contoh Kegagalan UI untuk Pengetesan Boundary");
  }

  const tabs = [
    { id: 'pills', label: "Tab Pil", icon: <Layout size="1rem" /> },
    { id: 'underline', label: "Garis Bawah", icon: <Info size="1rem" /> },
    { id: 'segmented', label: "Tersegmentasi", icon: <Smartphone size="1rem" /> },
  ];

  const handleConfirmAction = () => {
    confirm({
      title: "Konfirmasi Tindakan",
      message: "Apakah Anda yakin ingin melanjutkan tindakan simulasi ini?",
      variant: 'default',
      onConfirm: () => alert("Tindakan Berhasil Dikonfirmasi"),
      onCancel: () => console.log('Action Cancelled')
    });
  };

  const handleDangerAction = () => {
    confirm({
      title: "Tindakan Berbahaya",
      message: "Data ini akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.",
      variant: 'danger',
      confirmLabel: "Hapus Sekarang",
      onConfirm: () => alert("Data Berhasil Dihapus")
    });
  };

  const menuItems = [
    { id: 1, label: "Acara", icon: <Star size="1.5rem" />, onClick: () => alert("Acara") },
    { id: 2, label: "Pesanan Saya", icon: <CreditCard size="1.5rem" />, onClick: () => alert("Pesanan Saya"), badge: 3 },
    { id: 3, label: "E-Learning", icon: <Monitor size="1.5rem" />, onClick: () => alert("E-Learning") },
    { id: 4, label: "Pencapaian", icon: <Star size="1.5rem" />, onClick: () => alert("Pencapaian"), color: 'bg-yellow-500' },
    { id: 5, label: "Pesan", icon: <MessageCircle size="1.5rem" />, onClick: () => alert("Pesan"), badge: '9+' },
    { id: 6, label: "Wishlist", icon: <Heart size="1.5rem" />, onClick: () => alert("Wishlist") },
    { id: 7, label: "Notifikasi", icon: <Bell size="1.5rem" />, onClick: () => alert("Notifikasi") },
    { id: 8, label: "Pengaturan", icon: <Settings size="1.5rem" />, onClick: () => alert("Pengaturan") },
  ];

  const slides = [
    { 
      id: 1, 
      title: "Inovasi Tanpa Batas", 
      subtitle: "Membangun masa depan digital dengan teknologi terbaru dan solusi yang efisien.", 
      image: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=1200',
      buttonText: "Pelajari Lebih Lanjut"
    },
    { 
      id: 2, 
      title: "Efisiensi Perusahaan", 
      subtitle: "Optimalkan alur kerja tim Anda dengan alat kolaborasi yang cerdas.", 
      image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=1200',
      buttonText: "Coba Sekarang"
    },
  ];

  return (
    <MainShell 
      title="Komponen Serbaguna"
      headerExtra={<ThemeLanguageSwitcher />}
    >
      <div className="space-y-SpacingLarge pb-SpacingHuge">
        {/* Tabs Section */}
        <Card>
          <CardHeader>
            <CardTitle>Varian Tab Modular</CardTitle>
          </CardHeader>
          <CardContent className="space-y-SpacingLarge">
            <div className="space-y-SpacingSmall">
              <p className="text-FontSizeXs text-TextColorMuted uppercase font-bold">Gaya Pil</p>
              <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} variant="pills" />
            </div>

            <div className="space-y-SpacingSmall">
              <p className="text-FontSizeXs text-TextColorMuted uppercase font-bold">Gaya Garis Bawah</p>
              <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} variant="underline" />
            </div>

            <div className="space-y-SpacingSmall">
              <p className="text-FontSizeXs text-TextColorMuted uppercase font-bold">Gaya Tersegmentasi</p>
              <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} variant="segmented" className="max-w-md" />
            </div>
          </CardContent>
        </Card>

        {/* Slideshow Section */}
        <div className="space-y-SpacingSmall">
          <div className="flex flex-col">
            <h3 className="text-FontSizeBase font-bold">Banner Slideshow</h3>
            <p className="text-FontSizeXs text-TextColorMuted">Banner responsif dengan transisi yang halus dan teks overlay.</p>
          </div>
          <SlideshowBanner slides={slides} />
        </div>

        {/* Grid Menu Section */}
        <Card>
          <CardHeader>
            <CardTitle>Grid Menu Dinamis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-SpacingMedium">
            <p className="text-FontSizeSm text-TextColorMuted">
              Menu navigasi bergaya grid yang sering digunakan pada aplikasi mobile.
            </p>
            <div className="p-SpacingMedium rounded-RadiusLarge bg-ColorTertiary/OpacityMuted border border-ColorTertiary/OpacityMuted">
              <GridMenu items={menuItems} columns={4} />
            </div>
          </CardContent>
        </Card>

        {/* Bottom Sheet Section */}
        <Card>
          <CardHeader>
            <CardTitle>Bottom Sheet (Panel Bawah)</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-SpacingSmall py-SpacingLarge">
            <p className="text-FontSizeSm text-TextColorMuted text-center max-w-sm">
              Komponen modal yang muncul dari bawah layar, ideal untuk interaksi mobile-first.
            </p>
            <Button variant="outline" onClick={() => setIsSheetOpen(true)} className="flex items-center gap-2">
              <Smartphone size="1.125rem" />
              Buka Panel Bawah
            </Button>
          </CardContent>
        </Card>

        {/* Command Palette Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Palet Perintah (Search)</CardTitle>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-RadiusSmall bg-ColorTertiary/OpacityMuted text-TextColorMuted border border-ColorTertiary/OpacityMuted">
              <span className="text-FontSizeNano font-bold">CMD + K</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-SpacingSmall">
            <p className="text-FontSizeSm text-TextColorMuted">
              Navigasi cepat dan eksekusi perintah melalui keyboard.
            </p>
            <Button 
              variant="outline" 
              onClick={() => toggleCommandPalette(true)}
              className="w-full flex items-center justify-between border-dashed py-SpacingMedium"
            >
              <div className="flex items-center gap-3">
                <Search size="1.125rem" className="opacity-40" />
                <span>Ketik perintah atau cari...</span>
              </div>
              <Layout size="1.125rem" className="opacity-40" />
            </Button>
          </CardContent>
        </Card>

        {/* Confirmation Section */}
        <Card>
          <CardHeader>
            <CardTitle>Dialog Konfirmasi Global</CardTitle>
          </CardHeader>
          <CardContent className="space-y-SpacingMedium">
            <p className="text-FontSizeSm text-TextColorMuted">
              Trigger konfirmasi sistem yang terintegrasi dengan Global Context.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button variant="default" onClick={handleConfirmAction} className="bg-ColorPrimary text-white">
                Konfirmasi Standar
              </Button>
              <Button variant="destructive" onClick={handleDangerAction}>
                Tindakan Bahaya
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Error Boundary Section */}
        <Card>
          <CardHeader>
            <CardTitle>Boundary Kesalahan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-SpacingSmall">
            <p className="text-FontSizeSm text-TextColorMuted">
              Menangkap kegagalan runtime UI dan menampilkan fallback yang ramah pengguna.
            </p>
            <Button 
              variant="tertiary" 
              onClick={() => setShouldCrash(true)}
              className="w-full border-dashed"
            >
              Simulasikan Crash Sistem
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Sheet Content */}
      <BottomSheet 
        id="versatile-actions-sheet"
        isOpen={isSheetOpen} 
        onClose={() => setIsSheetOpen(false)}
        title="Tindakan Cepat"
      >
        <div className="space-y-SpacingNano">
          {[
            { label: "Profil Pengguna", icon: <User size="1.125rem" /> },
            { label: "Tagihan & Pembayaran", icon: <CreditCard size="1.125rem" /> },
            { label: "Konfigurasi Sistem", icon: <Settings size="1.125rem" /> },
            { label: "Keluar Aplikasi", icon: <LogOut size="1.125rem" />, danger: true },
          ].map((item, idx) => (
            <GhostButton
              key={idx}
              id={`sheet-action-${idx}`}
              className={cn(
                "w-full flex items-center gap-4 p-SpacingMedium rounded-RadiusBase transition-colors text-left",
                item.danger ? "text-FeedbackColorError hover:bg-FeedbackColorError/OpacityMuted" : "text-TextColorBase"
              )}
              onClick={() => setIsSheetOpen(false)}
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </GhostButton>
          ))}
        </div>
      </BottomSheet>
    </MainShell>
  );
};
