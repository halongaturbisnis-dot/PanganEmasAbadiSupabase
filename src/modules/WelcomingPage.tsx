import React from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useGlobalState } from '../logic/context/GlobalContext';
import { APP_CONFIG } from '../logic/constants/app';
import { getDefaultRoute } from '../logic/utils/auth';
import { ArrowRight, Sparkles, Database } from 'lucide-react';
import { cn } from '../logic/utils/cn';
import { appAssets } from '../ui/styles/assets';
import { apiClient } from '../logic/api/client';
import { swalConfig } from '../logic/utils/swalConfig';
import { config } from '../logic/utils/config';

/**
 * WELCOMING PAGE (Seamless & Animated BG)
 * Background putih bersih dengan animasi grid gradasi halus.
 */
const WelcomingPage: React.FC = () => {
  const { state } = useGlobalState();
  const navigate = useNavigate();
  const user = state.user;
  const [isSyncing, setIsSyncing] = React.useState(false);

  const handleContinue = () => {
    const targetPath = getDefaultRoute(user);
    const finalPath = targetPath === '/' ? '/dashboard' : targetPath;
    navigate(finalPath);
  };

  const handleSyncDatabase = async () => {
    setIsSyncing(true);
    try {
      const response = await apiClient.post<{ success: boolean; message: string; details?: any[] }>('/api/db/sync', {});
      
      if (response.success) {
        const detailsList = response.details
          ? response.details
              .map((d: any) => `<li><strong class="text-emerald-700">${d.file}</strong>: ${d.message}</li>`)
              .join('')
          : 'Daftar rincian tidak tersedia.';

        await swalConfig.fire({
          icon: 'success',
          title: 'Sinkronisasi Sukses',
          html: `
            <div class="text-left max-h-[15rem] overflow-y-auto space-y-2 text-[0.875rem] text-slate-700 font-sans leading-relaxed">
              <p class="mb-3 font-medium text-slate-800">Database berhasil disinkronisasikan sepenuhnya dengan skema terbaru!</p>
              <ul class="list-disc pl-5 space-y-1 text-[0.75rem] text-slate-600">
                ${detailsList}
              </ul>
            </div>
          `,
          confirmButtonText: 'Tutup',
        });
      } else {
        const detailsList = response.details
          ? response.details
              .map((d: any) => `<li><strong class="${d.status === 'SUCCESS' ? 'text-emerald-700' : 'text-rose-700'}">${d.file}</strong>: ${d.message}</li>`)
              .join('')
          : 'Daftar rincian tidak tersedia.';

        await swalConfig.fire({
          icon: 'warning',
          title: 'Sinkronisasi Selesai dengan Catatan',
          html: `
            <div class="text-left max-h-[15rem] overflow-y-auto space-y-2 text-[0.875rem] text-slate-700 font-sans leading-relaxed">
              <p class="mb-3 font-medium text-amber-700">Beberapa skema gagal diselaraskan. Silakan periksa detailnya:</p>
              <ul class="list-disc pl-5 space-y-1 text-[0.75rem] text-slate-600">
                ${detailsList}
              </ul>
            </div>
          `,
          confirmButtonText: 'Tutup',
        });
      }
    } catch (err: any) {
      await swalConfig.fire({
        icon: 'error',
        title: 'Koneksi Gagal',
        text: err?.message || 'Terjadi kesalahan saat menyelaraskan database.',
        confirmButtonText: 'Tutup',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  if (!user) return null;

  return (
    // Container Background Utama: Putih Mutlak
    <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center relative bg-[#ffffff] overflow-hidden">
      
      {/* --- ANIMATED BACKGROUND ELEMENTS --- */}
      
      {/* 1. Moving Grid Pattern (Background Tekstur Modern) */}
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" 
           style={{
             backgroundImage: `linear-gradient(#013d13 1px, transparent 1px), linear-gradient(90deg, #013d13 1px, transparent 1px)`,
             backgroundSize: '40px 40px',
           }} 
      />


      {/* --- MAIN CONTENT (SEAMLESS / NO CARD) --- */}
      <div className="relative z-10 w-full max-w-[32rem] px-6 flex flex-col items-center text-center">
        
        {/* Profile Image Wrapper */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mb-8 relative"
        >
          {/* Foto Profil dengan Border Elegan */}
          <div className="w-28 h-28 md:w-36 md:h-36 rounded-full p-1 bg-gradient-to-b from-[#013d13] to-[#4ade80] shadow-[0_8px_30px_rgba(1,61,19,0.15)]">
            <div className="w-full h-full rounded-full p-[3px] bg-white">
              <img 
                src={user.foto_profil || appAssets.AccountPlaceholder} 
                alt={user.username} 
                className="w-full h-full rounded-full object-cover"
              />
            </div>
          </div>
          
          {/* Status Dot */}
          <div className="absolute bottom-2 right-2 w-6 h-6 bg-[#013d13] border-4 border-[#ffffff] rounded-full shadow-sm" />
        </motion.div>

        {/* Text Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-4 mb-10"
        >

          <h1 className="text-3xl md:text-4xl font-semibold text-slate-900 tracking-tight leading-[1.2]">
            Selamat Datang, <br />
            <span className="text-[#013d13] font-bold">{user.username}</span>
          </h1>
          
          <p className="text-Black text-base md:text-lg leading-none max-w-[26rem] mx-auto font-light">
            di Portal Bisnis <span className="font-semibold text-black">{appAssets.Company}</span>
          </p>
          <p className="text-sblack text-base md:text-lg leading-none max-w-[26rem] mx-auto font-light">
            Semoga pekerjaanmu lancar hari ini
          </p>
        </motion.div>

      </div>

      {/* Tombol Sinkronisasi Database Otomatis */}
      {config.showDbSyncButton && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="absolute bottom-20 z-20 flex flex-col items-center"
        >
          <button
            onClick={handleSyncDatabase}
            disabled={isSyncing}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
              isSyncing
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed animate-pulse'
                : 'bg-[#e6f4ea] text-[#137333] hover:bg-[#d2e3fc] border border-emerald-200/50 hover:border-emerald-300 shadow-sm hover:shadow active:scale-95 cursor-pointer'
            }`}
          >
            {isSyncing ? (
              <>
                <svg className="animate-spin h-4 w-4 text-[#137333]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Menyelaraskan Database...
              </>
            ) : (
              <>
                <Database className="w-4 h-4 text-[#137333]" />
                Sinkronisasikan Database
              </>
            )}
          </button>
        </motion.div>
      )}
      
      {/* Footer */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ delay: 0.6, duration: 1 }}
        className="absolute bottom-8 text-Black text-xs font-bold tracking-widest uppercase z-10"
      >
        {APP_CONFIG.name}
      </motion.div>
    </div>
  );
};

export default WelcomingPage;