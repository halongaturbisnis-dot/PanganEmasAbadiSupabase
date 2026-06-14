import React, { useState } from 'react';
import { MainShell } from '../../../ui/components/common/shells/MainShell';
import { BarcodeDisplay } from '../../../ui/components/common/BarcodeDisplay';
import { Card, CardHeader, CardTitle, CardContent } from '../../../ui/components/common/Card';
import { ThemeLanguageSwitcher } from '../../../ui/components/elements/ThemeLanguageSwitcher';
import { TextInput } from '../../../ui/components/elements/Inputs';
import { FixedDropdown } from '../../../ui/components/elements/Dropdown';
import { Barcode, Settings2, Package, ShoppingCart, Tag } from 'lucide-react';

export const BarcodeDisplaySimulation: React.FC = () => {
  const [dynamicValue, setDynamicValue] = useState('PROD-12345');
  const [format, setFormat] = useState<'CODE128' | 'CODE39' | 'EAN13' | 'UPC'>('CODE128');

  return (
    <MainShell 
      title="Showcase Barcode Display"
      headerExtra={<ThemeLanguageSwitcher />}
    >
      <div className="max-w-4xl mx-auto space-y-SpacingLarge pb-SpacingHuge">
        {/* Intro */}
        <div className="text-center space-y-SpacingSmall">
          <h1 className="text-FontSizeH1 font-display font-bold text-TextColorBase">
            Showcase Barcode Display
          </h1>
          <p className="text-TextColorMuted text-FontSizeBase max-w-2xl mx-auto">
            Halaman ini mendemonstrasikan kapabilitas komponen BarcodeDisplay dengan berbagai format dan kustomisasi menggunakan Tailwind CSS dan token desain aplikasi.
          </p>
        </div>

        {/* Interactive Playground */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-SpacingSmall">
              <Settings2 className="text-ColorPrimary" size="1.25rem" />
              <CardTitle>Generator Interaktif</CardTitle>
            </div>
            <p className="text-FontSizeXs text-TextColorMuted">Ubah nilai dan format secara langsung untuk melihat perubahan.</p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-SpacingMedium items-center">
              <div className="flex-1 w-full space-y-4">
                <div>
                  <label className="block text-FontSizeSm font-medium text-TextColorBase mb-1">Nilai Barcode</label>
                  <TextInput 
                    value={dynamicValue} 
                    onChange={(e) => setDynamicValue(e.target.value)} 
                    placeholder="Masukkan kode..." 
                  />
                  {/* Warning if EAN13 or UPC format is selected but value is invalid length/format */}
                  {(format === 'EAN13' || format === 'UPC') && (
                    <p className="text-FeedbackColorWarning text-FontSizeXs mt-1">
                      Catatan: EAN-13 membutuhkan 12 atau 13 angka, UPC membutuhkan 11 atau 12 angka. Jika nilai yang dimasukkan tidak sesuai, barcode EAN13/UPC tidak akan dender.
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-FontSizeSm font-medium text-TextColorBase mb-1">Format Barcode</label>
                  <FixedDropdown 
                    value={format}
                    onChange={(val) => setFormat(val as any)}
                    options={[
                      { label: 'CODE128 (Universal)', value: 'CODE128' },
                      { label: 'CODE39 (Standar Lama)', value: 'CODE39' },
                      { label: 'EAN13 (Retail Global)', value: 'EAN13' },
                      { label: 'UPC (Retail US)', value: 'UPC' },
                    ]} 
                  />
                </div>
              </div>
              
              <div className="flex-1 w-full flex flex-col items-center justify-center p-SpacingMedium bg-ColorBgSecondary rounded-RadiusMedium border border-ColorSidebarBorder/OpacitySubtle">
                <BarcodeDisplay 
                  value={dynamicValue || ' '} 
                  format={format} 
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Real World Use Cases */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-SpacingMedium">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-SpacingSmall">
                <Package className="text-ColorSecondary" size="1.25rem" />
                <CardTitle>Inventaris Gudang (CODE128)</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <BarcodeDisplay 
                value="WH-B-SECTION-99" 
                format="CODE128" 
                height={60} 
                className="bg-ColorSurface shadow-none border-dashed"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-SpacingSmall">
                <ShoppingCart className="text-FeedbackColorWarning" size="1.25rem" />
                <CardTitle>Retail EAN-13</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <BarcodeDisplay 
                value="123456789012" 
                format="EAN13" 
                height={60}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-SpacingSmall">
                <Tag className="text-FeedbackColorError" size="1.25rem" />
                <CardTitle>Tanpa Teks (Minimalis)</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col items-center relative gap-4">
              <BarcodeDisplay 
                value="MinimalistBarcode" 
                format="CODE128" 
                displayValue={false} 
                height={40}
              />
              <p className="text-FontSizeSm text-TextColorMuted">
                Berguna untuk antarmuka yang sangat padat.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <div className="flex items-center gap-SpacingSmall">
                <Barcode className="text-FeedbackColorSuccess" size="1.25rem" />
                <CardTitle>Warna Kostum (Brand)</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col items-center bg-ColorSidebarAccent rounded-RadiusMedium mt-2">
              <BarcodeDisplay 
                value="BRANDED-TAG-XYZ" 
                format="CODE128" 
                lineColor="var(--ui-primary)" 
                background="transparent"
                height={50}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </MainShell>
  );
};
