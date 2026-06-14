import React from 'react';
import { MainShell } from '../../../ui/components/common/shells/MainShell';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../../ui/components/common/Card';
import { Button } from '../../../ui/components/elements/Button';
import { ThemeLanguageSwitcher } from '../../../ui/components/elements/ThemeLanguageSwitcher';

export const CardSimulation: React.FC = () => {
  return (
    <MainShell 
      title="Showcase Card"
      headerExtra={<ThemeLanguageSwitcher />}
    >
      <div className="max-w-4xl mx-auto space-y-SpacingLarge pb-SpacingHuge">
        <div className="text-center space-y-SpacingSmall">
          <h1 className="text-FontSizeH1 font-display font-bold text-TextColorBase">
            Showcase Card
          </h1>
          <p className="text-TextColorMuted text-FontSizeBase max-w-2xl mx-auto">
            Mendemonstrasikan komponen Card beserta bagian pembentuknya (Header, Title, Description, Content, Footer) yang sering digunakan pada User Interface.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-SpacingMedium">
          {/* Complete Card */}
          <Card>
            <CardHeader>
              <CardTitle>Laporan Ringkas</CardTitle>
              <CardDescription>Menampilkan sekilas tentang operasional hari ini.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-ColorSidebarAccent/OpacitySubtle rounded-RadiusSmall p-SpacingBase text-FontSizeSm">
                <ul className="space-y-SpacingTiny">
                  <li className="flex justify-between">
                    <span className="text-TextColorMuted">Total Penjualan:</span>
                    <span className="font-semibold text-ColorPrimary">Rp 12.500.000</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-TextColorMuted">Transkasi Aktif:</span>
                    <span className="font-medium text-TextColorBase">48 Pesanan</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-TextColorMuted">Retur Barang:</span>
                    <span className="font-medium text-FeedbackColorError">2 Pesanan</span>
                  </li>
                </ul>
              </div>
            </CardContent>
            <CardFooter className="justify-end gap-SpacingSmall">
              <Button variant="outline">Tutup</Button>
              <Button>Detail Lengkap</Button>
            </CardFooter>
          </Card>

          {/* Minimal Card */}
          <Card className="flex flex-col justify-center text-center p-SpacingLarge">
            <h3 className="text-FontSizeH3 font-bold text-TextColorBase mb-SpacingTiny">100+ Fitur</h3>
            <p className="text-FontSizeSm text-TextColorMuted mb-SpacingMedium">
              Dapat dieksplorasi secara mendalam.
            </p>
            <Button className="w-full">Eksplor Sekarang</Button>
          </Card>

          {/* Card Without Footer */}
          <Card>
            <CardHeader>
              <CardTitle>Profil Pengguna</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-SpacingMedium">
                <div className="w-16 h-16 rounded-RadiusFull bg-ColorPrimary flex items-center justify-center text-White flex-shrink-0">
                  ADM
                </div>
                <div>
                  <h4 className="font-semibold text-TextColorBase">Administrator</h4>
                  <p className="text-FontSizeSm text-TextColorMuted">admin@system.local</p>
                  <p className="text-FontSizeXs bg-ColorSidebarAccent inline-block px-1.5 py-0.5 rounded mt-1 text-ColorPrimary">Akses Master</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card Without Header */}
          <Card>
            <CardContent className="pt-SpacingMedium">
              <p className="italic text-TextColorMuted whitespace-pre-wrap">
                "Desain bukan hanya tentang bagaimana bentuknya terlihat dan dirasakan. Desain adalah tentang bagaimana bentuknya berfungsi."
              </p>
            </CardContent>
            <CardFooter className="border-t border-ColorSidebarBorder/OpacitySubtle pt-SpacingMedium flex justify-between items-center text-FontSizeSm">
              <span className="font-semibold text-TextColorBase">Steve Jobs</span>
              <span className="text-TextColorMuted">1997</span>
            </CardFooter>
          </Card>
        </div>
      </div>
    </MainShell>
  );
};
