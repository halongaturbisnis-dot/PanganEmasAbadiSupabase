import React, { useState } from 'react';
import { Mail, Calendar, User, Shield, MapPin, Briefcase, Zap, Sparkles, Wand2 } from 'lucide-react';
import { useGlobalState } from '../../../logic/context/GlobalContext';
import { EnhancedButton } from '../../../ui/components/elements/EnhancedButton';
import { RiveAnimation } from '../../../ui/components/elements/RiveAnimation';
import { DashboardShellSample } from './DashboardShellSample';
import { MainShellSample } from './MainShellSample';
import { FormShellSample } from './FormShellSample';
import { DetailShellSample } from './DetailShellSample';
import { SettingsShellSample } from './SettingsShellSample';

export const ShellShowcase: React.FC = () => {
  const { t } = useGlobalState();
  const [activeShell, setActiveShell] = useState<'main' | 'form' | 'detail' | 'dashboard' | 'settings' | 'enhancements'>('enhancements');

  const handleBack = () => {
    setActiveShell('enhancements');
  };

  const renderContent = () => {
    switch (activeShell) {
      case 'enhancements':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="bg-[var(--color-primary)] p-12 rounded-[3rem] text-white overflow-hidden relative">
               <div className="relative z-10">
                  <h2 className="text-4xl font-black mb-4 tracking-tighter">{t('shells.showcase.masterUI')}</h2>
                  <p className="text-white/70 max-w-lg mb-8 leading-relaxed">
                    {t('shells.showcase.masterUIDesc')}
                  </p>
                  <EnhancedButton size="lg" className="bg-white text-[var(--color-primary)]">
                    {t('common.getStarted')} <Zap size="1.25rem" className="ml-2" />
                  </EnhancedButton>
               </div>
               
               {/* Background Glow */}
               <div className="absolute top-0 right-0 w-96 h-96 bg-white/20 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/3" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Whirl Demo */}
              <div className="bg-[var(--color-surface)] sm:p-8 p-6 rounded-[2.5rem] border border-[var(--color-border)] shadow-sm transition-all hover:shadow-xl hover:-translate-y-1">
                 <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-amber-50 dark:bg-amber-500/10 text-amber-500 rounded-2xl"><Sparkles size="1.5rem" /></div>
                    <h3 className="font-black text-[var(--color-text-base)]">Whirl CSS</h3>
                 </div>
                 <p className="text-[var(--color-text-muted)] text-sm mb-8 leading-relaxed">
                    {t('shells.showcase.whirlDesc')}
                 </p>
                 <div className="flex items-center gap-8 justify-center py-4 bg-[var(--color-bg-secondary)] rounded-2xl">
                    <div className="whirl blade text-[var(--color-primary)]" />
                    <div className="whirl dual text-emerald-500" />
                    <div className="whirl blade text-red-500" style={{ width: '3em', height: '3em' }} />
                 </div>
              </div>

              {/* Hover.dev Demo */}
              <div className="bg-[var(--color-surface)] sm:p-8 p-6 rounded-[2.5rem] border border-[var(--color-border)] shadow-sm transition-all hover:shadow-xl hover:-translate-y-1">
                 <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-blue-50 dark:bg-blue-500/10 text-blue-500 rounded-2xl"><Zap size="1.5rem" /></div>
                    <h3 className="font-black text-[var(--color-text-base)]">Spring Motion</h3>
                 </div>
                 <p className="text-[var(--color-text-muted)] text-sm mb-8 leading-relaxed">
                    {t('shells.showcase.springDesc')}
                 </p>
                 <div className="flex flex-col gap-4">
                    <EnhancedButton variant="primary" className="w-full">{t('shells.showcase.primaryAction')}</EnhancedButton>
                    <div className="flex gap-4">
                      <EnhancedButton variant="secondary" className="flex-1">{t('shells.showcase.secondary')}</EnhancedButton>
                      <EnhancedButton variant="ghost" className="flex-1">{t('shells.showcase.ghost')}</EnhancedButton>
                    </div>
                 </div>
              </div>

              {/* Rive Demo */}
              <div className="bg-[var(--color-surface)] sm:p-8 p-6 rounded-[2.5rem] border border-[var(--color-border)] shadow-sm transition-all hover:shadow-xl hover:-translate-y-1">
                 <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 rounded-2xl"><Wand2 size="1.5rem" /></div>
                    <h3 className="font-black text-[var(--color-text-base)]">Rive Assets</h3>
                 </div>
                 <p className="text-[var(--color-text-muted)] text-sm mb-8 leading-relaxed">
                    {t('shells.showcase.riveDesc')}
                 </p>
                 <div className="h-32 border-2 border-dashed border-[var(--color-border)] rounded-2xl flex items-center justify-center bg-[var(--color-bg-secondary)] overflow-hidden">
                    {/* Fallback demo since we don't have a specific .riv file yet */}
                    <RiveAnimation src="https://cdn.rive.app/animations/vehicles.riv" />
                 </div>
              </div>
            </div>
          </div>
        );
      case 'dashboard':
        return <DashboardShellSample onBack={handleBack} />;
      case 'main':
        return <MainShellSample onBack={handleBack} />;
      case 'form':
        return <FormShellSample onBack={handleBack} />;
      case 'detail':
        return <DetailShellSample onBack={handleBack} />;
      case 'settings':
        return <SettingsShellSample onBack={handleBack} />;
    }
  };

  return (
    <div className="p-4 space-y-8">
      <div className="mb-12 flex flex-wrap gap-2">
        {(['enhancements', 'dashboard', 'main', 'form', 'detail', 'settings'] as const).map(shell => (
          <button
            key={shell}
            onClick={() => setActiveShell(shell)}
            className={`px-5 py-2.5 rounded-xl text-xs transition-all ${
              activeShell === shell
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xl shadow-black/10'
                : 'bg-white dark:bg-slate-900 text-slate-500 hover:text-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm'
            }`}
          >
            {t(`shells.shellNames.${shell}`)}
          </button>
        ))}
      </div>

      <div className="min-h-[700px]">
        {renderContent()}
      </div>
    </div>
  );
};
