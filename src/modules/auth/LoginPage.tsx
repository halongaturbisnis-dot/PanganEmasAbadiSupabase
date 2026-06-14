import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TextInput, PasswordInput } from '../../ui/components/elements/Inputs';
import { PrimaryButton } from '../../ui/components/elements/Button';
import { useGlobalState } from '../../logic/context/GlobalContext';
import { authService } from '../../logic/services/authService';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, LogIn } from 'lucide-react';
import { cn } from '../../logic/utils/cn';
import { appAssets } from '../../ui/styles/assets';
import { APP_CONFIG } from '../../logic/constants/app';
import { getDefaultRoute } from '../../logic/utils/auth';

/**
 * LOGIN PAGE
 * Halaman masuk aplikasi dengan background gradasi bergerak.
 */
export const LoginPage: React.FC = () => {
  const { setIsLoading, state, setState } = useGlobalState();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ kode_akses: '', password: '' });
  const [error, setError] = useState<string | null>(null);

  const isMobile = state.viewport.isMobile;

  // Redirect if already logged in
  React.useEffect(() => {
    if (state.user || authService.isAuthenticated()) {
      navigate('/');
    }
  }, [state.user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.kode_akses || !formData.password) {
      setError('Harap isi kode akses dan password');
      return;
    }

    setIsLoading(true);
    try {
      const result = await authService.login({
        kode_akses: formData.kode_akses,
        password_plain: formData.password,
      });

      if (result.success) {
        // Update global state immediately for the redirect
        if (result.session) {
          setState(prev => ({ ...prev, user: result.session! }));
        }
        navigate('/');
      } else {
        setError(result.error || 'Autentikasi gagal');
      }
    } catch (err) {
      setError('Terjadi kesalahan sistem. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="login-page-root" className="relative min-h-screen w-full flex items-center justify-center overflow-hidden">
      {/* Dynamic Background */}
      <style>{`
        @keyframes gradient-animate {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .bg-animated-gradient {
          background: linear-gradient(-45deg, #4AC29A, #2D9B7C, #1B4D3E, #4AC29A);
          background-size: 400% 400%;
          animation: gradient-animate 10s ease infinite;
        }
      `}</style>
      
      <div id="login-background" className="absolute inset-0 z-ZBelow bg-animated-gradient" />
      
      {/* Decorative Circles */}
      <div className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] rounded-RadiusFull bg-White/opacity-OpacityMuted blur-[6.25rem] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40rem] h-[40rem] rounded-RadiusFull bg-ColorPrimary/opacity-OpacityMuted blur-[6.25rem] pointer-events-none" />

      {/* Login Card */}
      <motion.div 
        id="login-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className={cn(
          "relative z-ZFlat bg-White p-SpacingMedium rounded-RadiusLarge shadow-ElevationXl flex flex-col items-center",
          isMobile ? "w-[90%]" : "w-[24rem]"
        )}
      >
        <div id="login-header" className="flex flex-col items-center gap-2 mb-SpacingMedium text-center">
  <div className="w-32 h-16 rounded-RadiusMedium bg-White overflow-hidden flex items-center justify-center mb-SpacingTiny shadow-ElevationLow">
    <img 
      src={appAssets.devBrand} 
      alt="Logo" 
      className="w-full h-full object-contain" 
      referrerPolicy="no-referrer"
    />
  </div>
  <h1 className="text-FontSizeH4 font-bold text-TextColorBase">Selamat Datang</h1>
</div>

        <form id="login-form" onSubmit={handleLogin} className="w-full flex flex-col gap-SpacingSmall">
          {/* Feedback Error */}
          <AnimatePresence>
            {error && (
              <motion.div 
                id="login-error-container"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-FeedbackColorError/opacity-OpacityMuted border border-FeedbackColorError/opacity-OpacitySubtle p-SpacingSmall rounded-RadiusMedium flex items-center gap-SpacingSmall overflow-hidden"
              >
                <AlertCircle className="text-FeedbackColorError shrink-0" size="1.25rem" />
                <span className="text-FontSizeXs font-bold text-FeedbackColorError leading-LineHeightTight">{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex flex-col gap-SpacingTiny">
            <label htmlFor="kode-akses" className="text-FontSizeXs font-bold text-TextColorBase ml-SpacingTiny">Kode Akses</label>
            <TextInput 
              id="kode-akses"
              placeholder="Masukkan kode akses..."
              value={formData.kode_akses}
              onChange={(e) => setFormData({ ...formData, kode_akses: e.target.value })}
              className={error && error.includes('Kode akses') ? 'border-FeedbackColorError' : ''}
              autoComplete="username"
            />
          </div>

          <div className="flex flex-col gap-SpacingTiny">
            <label htmlFor="password" className="text-FontSizeXs font-bold text-TextColorBase ml-SpacingTiny">Kata Sandi</label>
            <PasswordInput 
              id="password"
              placeholder="Masukkan kata sandi..."
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className={error && error.includes('password') ? 'border-FeedbackColorError' : ''}
              autoComplete="current-password"
            />
          </div>

          <PrimaryButton 
            id="login-submit-btn"
            type="submit" 
            className="w-full mt-SpacingTiny"
            icon={<LogIn size={20} />}
            isLoading={state.isLoading}
          >
            Masuk Ke Sistem
          </PrimaryButton>
        </form>

        <div id="login-footer" className="mt-SpacingLarge text-center">
          <div className="text-FontSizeNano text-TextColorBase tracking-widest">
            &copy; 2026 {APP_CONFIG.name}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
