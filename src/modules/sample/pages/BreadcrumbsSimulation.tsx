import React from 'react';
import { MainShell } from '../../../ui/components/common/shells/MainShell';
import { Breadcrumbs, BreadcrumbItem, BreadcrumbLink } from '../../../ui/components/common/Breadcrumbs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../ui/components/common/Card';
import { ThemeLanguageSwitcher } from '../../../ui/components/elements/ThemeLanguageSwitcher';
import { Slash, ChevronRight, ArrowRight } from 'lucide-react';

export const BreadcrumbsSimulation: React.FC = () => {
  return (
    <MainShell 
      title="Showcase Breadcrumbs"
      headerExtra={<ThemeLanguageSwitcher />}
    >
      <div className="max-w-4xl mx-auto space-y-SpacingLarge pb-SpacingHuge">
        <div className="text-center space-y-SpacingSmall">
          <h1 className="text-FontSizeH1 font-display font-bold text-TextColorBase">
            Showcase Breadcrumbs
          </h1>
          <p className="text-TextColorMuted text-FontSizeBase max-w-2xl mx-auto">
            Mendemonstrasikan navigasi hierarki dengan komponen Breadcrumbs untuk memudahkan pelacakan lokasi antarmuka pengguna dalam aplikasi.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-SpacingMedium">
          <Card>
            <CardHeader>
              <CardTitle>Breadcrumb Standar</CardTitle>
              <CardDescription>Pemisah default menggunakan ChevronRight. Mengindikasikan lokasi berurutan.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-ColorSidebarAccent/OpacitySubtle p-SpacingMedium rounded-RadiusMedium">
                <Breadcrumbs>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="#">Home</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="#">Produk</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="#">Elektronik</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbItem isCurrentPage>
                    Laptop Gaming X1
                  </BreadcrumbItem>
                </Breadcrumbs>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pemisah Kustom (Slash)</CardTitle>
              <CardDescription>Dapat disesuaikan menggunakan pemisah garis miring (slash) melalui props 'separator'.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-ColorSidebarAccent/OpacitySubtle p-SpacingMedium rounded-RadiusMedium">
                <Breadcrumbs separator={<Slash className="h-SpacingBase w-SpacingBase" />}>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="#">Dashboard</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="#">Pengaturan</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbItem isCurrentPage>
                    Profil Akun
                  </BreadcrumbItem>
                </Breadcrumbs>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pemisah Kustom (Panah Buntut)</CardTitle>
              <CardDescription>Menggunakan ArrowRight sebagai ganti pemisah default.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-ColorSidebarAccent/OpacitySubtle p-SpacingMedium rounded-RadiusMedium">
                <Breadcrumbs separator={<ArrowRight className="h-4 w-4" />}>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="#">Aplikasi</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="#">Laporan</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="#">Keuangan</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbItem isCurrentPage>
                    Q3 2023
                  </BreadcrumbItem>
                </Breadcrumbs>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainShell>
  );
};
