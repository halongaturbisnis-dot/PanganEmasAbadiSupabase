import React from 'react';
import { MainShell } from '../../../ui/components/common/shells/MainShell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../ui/components/common/Card';
import { Button } from '../../../ui/components/elements/Button';
import { ThemeLanguageSwitcher } from '../../../ui/components/elements/ThemeLanguageSwitcher';
import { useGlobalState } from '../../../logic/context/GlobalContext';
import { Command } from 'lucide-react';

export const CommandPaletteSimulation: React.FC = () => {
  const { toggleCommandPalette } = useGlobalState();

  return (
    <MainShell 
      title="Showcase Command Palette"
      headerExtra={<ThemeLanguageSwitcher />}
    >
      <div className="max-w-4xl mx-auto space-y-SpacingLarge pb-SpacingHuge">
        <div className="text-center space-y-SpacingSmall">
          <h1 className="text-FontSizeH1 font-display font-bold text-TextColorBase">
            Showcase Command Palette
          </h1>
          <p className="text-TextColorMuted text-FontSizeBase max-w-2xl mx-auto">
            Mendemonstrasikan Command Palette (antarmuka pencarian cepat) yang digerakkan oleh keyboard, biasanya dipicu dengan pintasan CMD+K atau via tindakan manual.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-SpacingMedium max-w-xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              <Command className="w-12 h-12 mx-auto text-ColorPrimary mb-SpacingSmall opacity-OpacityHover" />
              <CardTitle>Buka Command Palette</CardTitle>
              <CardDescription>
                Anda dapat memanggil palet perintah menggunakan tombol di bawah ini atau melalui pintasan keyboard.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-SpacingMedium">
              <Button size="lg" onClick={() => toggleCommandPalette(true)} className="w-full sm:w-auto">
                Buka Palette Command
              </Button>
              
              <div className="flex items-center gap-SpacingSmall text-TextColorMuted bg-ColorSidebarAccent/OpacitySubtle px-SpacingBase py-SpacingSmall rounded-RadiusMedium">
                <span className="text-FontSizeSm">Atau tekan pintasan:</span>
                <kbd className="px-SpacingSmall py-SpacingTiny bg-ColorBg text-TextColorBase rounded-RadiusSmall border border-ColorSidebarBorder/OpacityMuted font-mono text-FontSizeSm font-semibold shadow-sm">
                  CMD + K
                </kbd>
                <span className="text-FontSizeSm">/</span>
                <kbd className="px-SpacingSmall py-SpacingTiny bg-ColorBg text-TextColorBase rounded-RadiusSmall border border-ColorSidebarBorder/OpacityMuted font-mono text-FontSizeSm font-semibold shadow-sm">
                  CTRL + K
                </kbd>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainShell>
  );
};
