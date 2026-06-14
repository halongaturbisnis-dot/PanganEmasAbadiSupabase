import React from 'react';
import { MainShell } from '../../../ui/components/common/shells/MainShell';
import { Accordion, AccordionItem } from '../../../ui/components/common/Accordion';
import { Card, CardHeader, CardTitle, CardContent } from '../../../ui/components/common/Card';
import { useGlobalState } from '../../../logic/context/GlobalContext';
import { ThemeLanguageSwitcher } from '../../../ui/components/elements/ThemeLanguageSwitcher';
import { HelpCircle, Info, BookOpen, Layers } from 'lucide-react';

export const AccordionSimulation: React.FC = () => {
  const faqItems = [
    { 
      title: "Apa itu Arsitektur Modular Vibe?", 
      content: "Arsitektur Modular Vibe adalah pendekatan monolit dengan modularitas tinggi yang memisahkan komponen UI, logika bisnis, dan modul fitur untuk pemeliharaan dan skala maksimum.", 
      icon: <HelpCircle size="1.125rem" /> 
    },
    { 
      title: "Apakah boilerplate ini siap untuk produksi?", 
      content: "Ya, ini mengikuti standar industri untuk performa, keamanan, dan aksesibilitas, termasuk teks terlokalisasi dan token desain dinamis.", 
      icon: <Info size="1.125rem" /> 
    },
    { 
      title: "Bagaimana cara menambah modul baru?", 
      content: "Cukup buat direktori baru di /src/modules, tambahkan logika Anda ke /src/logic, dan daftarkan rute Anda di App.tsx.", 
      icon: <BookOpen size="1.125rem" /> 
    },
  ];

  return (
    <MainShell 
      title="Showcase Master Accordion"
      headerExtra={<ThemeLanguageSwitcher />}
    >
      <div className="max-w-4xl mx-auto space-y-SpacingLarge pb-SpacingHuge">
        {/* Intro */}
        <div className="text-center space-y-SpacingSmall">
          <h1 className="text-FontSizeH1 font-display font-bold text-TextColorBase">
            Showcase Master Accordion
          </h1>
          <p className="text-TextColorMuted text-FontSizeBase max-w-2xl mx-auto">
            Implementasi accordion modular dan responsif dengan animasi yang halus.
          </p>
        </div>

        {/* Standard Usage */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-SpacingSmall">
              <Layers className="text-ColorPrimary" size="1.25rem" />
              <CardTitle>Accordion Data Dinamis</CardTitle>
            </div>
            <p className="text-FontSizeXs text-TextColorMuted">Bagian ini mendemonstrasikan cara menangani beberapa item yang terbuka dan perpindahan konten dinamis.</p>
          </CardHeader>
          <CardContent>
            <Accordion id="main-faq-accordion">
              {faqItems.map((item, index) => (
                <AccordionItem 
                  key={index} 
                  title={item.title}
                  id={`faq-item-${index}`}
                >
                  <div className="flex items-start gap-SpacingSmall">
                    <div className="mt-1 text-ColorPrimary opacity-40">
                      {item.icon}
                    </div>
                    <p className="leading-LineHeightRelaxed">
                      {item.content}
                    </p>
                  </div>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        {/* Dense / Dark themed simulation hint */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-SpacingMedium">
          <Card className="bg-ColorBgSecondary">
            <CardHeader>
              <CardTitle className="text-FontSizeBase">Compact Variant</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion className="space-y-SpacingNano">
                <AccordionItem title="System Health" className="rounded-RadiusTiny">
                  <div className="py-SpacingSmall">All systems operational in Asia-Southeast region.</div>
                </AccordionItem>
                <AccordionItem title="Security Log" className="rounded-RadiusTiny">
                  <div className="py-SpacingSmall">Last login attempt from recognized IP: 192.168.1.1</div>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          <Card className="border-ColorPrimary/20">
            <CardHeader>
              <CardTitle className="text-FontSizeBase text-ColorPrimary">Accented Variant</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion>
                <AccordionItem title="Billing Statement" className="border-ColorPrimary/20">
                  <div className="py-SpacingSmall font-mono text-FontSizeXs">
                    INV-2023-001: $1,200.00<br/>
                    INV-2023-002: $450.00
                  </div>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainShell>
  );
};
