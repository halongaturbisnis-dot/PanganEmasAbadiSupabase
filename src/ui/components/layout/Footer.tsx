import React, { useEffect, useState } from 'react';
import { useGlobalState } from '../../../logic/context/GlobalContext';
import { APP_CONFIG } from '../../../logic/constants/app';
import { linkService } from '../../../logic/services/linkService';

/**
 * Footer
 * Simple polosan footer for development.
 */
export const Footer: React.FC = () => {
  const { state: { viewport } } = useGlobalState();
  const currentYear = new Date().getFullYear();
  const [footerLink, setFooterLink] = useState('https://maindi.id');

  useEffect(() => {
    // Fetch dynamic link on mount
    linkService.fetchDynamicFooterLink().then(link => setFooterLink(link));
  }, []);

  if (viewport.isCompact) return null;

  return (
    <footer className="h-12 flex items-center justify-between text-FontSizeXs text-TextColorBase">
      <div>
        &copy; 2026 {APP_CONFIG.name}
      </div>
      <div className="flex gap-1 items-center">
        <span className="text-FontSizeXs text-TextColorBase">
          dikembangkan oleh 
          <span className="text-[#0b00a1] font-bold px-1">
            Maindi.id
          </span>
        </span>
        
        <a href={footerLink} target="_blank" rel="noopener noreferrer" className="block">
          <img 
            src="https://lh3.googleusercontent.com/d/1tB94UtNJkbdoTfd9IdcPVcVZyVSM4Txv" 
            alt="Logo Maindi" 
            // Kita pasang style inline untuk definisi animasi
            style={{
              // Memastikan animasi berjalan mulus dan mempertahankan tinggi layout
              display: 'block',
              height: '1.25rem', // setara h-5
              width: 'auto',
              animation: 'bounceAndFlipY 3s ease-in-out infinite',
              // Penting untuk 3D Flip: Berikan 'depth' agar flip terlihat 3D
              transformStyle: 'preserve-3d',
              // Agar saat dibalik tidak terlihat hilang (opsional, tergantung logo)
              backfaceVisibility: 'hidden', 
            }}
          />
          
          {/* Definisi Animasi Kustom */}
          <style>{`
            @keyframes bounceAndFlipY {
              /* Fase 1: Naik (0% - 40%) */
              0% {
                transform: translateY(0) rotateY(0deg);
              }
              40% {
                transform: translateY(-6px) rotateY(0deg);
              }

              /* Fase 2: Turun (40% - 50%) */
              50% {
                transform: translateY(0) rotateY(0deg);
              }

              /* Fase 3: Flip Horizontal 360 derajat (50% - 100%) */
              100% {
                /* rotateY(360deg) = Berputar seperti kartu/pintu (Horizontal Flip) */
                transform: translateY(0) rotateY(360deg);
              }
            }
          `}</style>
        </a>
      </div>
    </footer>
  );
};

export default Footer;