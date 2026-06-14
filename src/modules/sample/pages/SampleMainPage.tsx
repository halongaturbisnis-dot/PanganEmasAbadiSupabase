import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SampleLayout } from '../../../ui/wrapper/SampleLayout';
import { Card } from '../../../ui/components/common/Card';
import { Button, GhostButton, TertiaryButton } from '../../../ui/components/elements/Button';

import { useGlobalState } from '../../../logic/context/GlobalContext';
import { LanguageList } from '../../../ui/styles/LanguageList';

export const SampleMainPage: React.FC = () => {
  const navigate = useNavigate();
  const { state, setState, t } = useGlobalState();
  const { viewport } = state;

  return (
    <SampleLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Controls: Language & Theme */}
        <div className={`flex ${viewport.isCompact ? 'flex-col items-stretch' : 'flex-row justify-between items-center'} gap-4`}>
          {/* Theme Switcher */}
          <div className="flex gap-2">
            {[
              { mode: 'light', label: t('switcher.light'), icon: '☀️' },
              { mode: 'dark', label: t('switcher.dark'), icon: '🌙' },
              { mode: 'system', label: t('viewport.device'), icon: '📱' }
            ].map((tMode) => (
              <Button
                key={tMode.mode}
                variant={state.themeMode === tMode.mode ? "default" : "outline"}
                size="sm"
                onClick={() => setState(prev => ({ ...prev, themeMode: tMode.mode as any }))}
                className="rounded-full px-4"
              >
                <span>{tMode.icon}</span>
                <span>{tMode.label}</span>
              </Button>
            ))}
          </div>

          {/* Language Switcher */}
          <div className="flex gap-2 justify-end">
            {LanguageList.map((lang) => (
              <Button
                key={lang.code}
                variant={state.language === lang.code ? "default" : "outline"}
                size="sm"
                onClick={() => setState(prev => ({ ...prev, language: lang.code }))}
                className="rounded-full px-4"
              >
                <span>{lang.flag}</span>
                <span>{lang.label}</span>
              </Button>
            ))}
          </div>
        </div>

        <section className={`text-center space-y-4 ${viewport.isCompact ? 'py-10' : 'py-20'}`}>
          <h1 className={`${viewport.isCompact ? 'text-[3rem]' : 'text-[var(--font-size-display)]'} font-black tracking-tighter uppercase transition-all duration-500`}>
            {t('home.title')}
          </h1>
          <p className={`${viewport.isCompact ? 'text-[var(--font-size-sm)]' : 'text-[var(--font-size-base)]'} text-[var(--color-text-muted)] max-w-lg mx-auto`}>
            {t('home.subtitle')}
          </p>
          <div className="flex flex-col items-center gap-4">
            <Button size="lg" onClick={() => navigate('/app')}>{t('common.getStarted')}</Button>
            <TertiaryButton 
              onClick={() => navigate('/sample')}
              size="lg"
              className="rounded-full"
              id="btn-navigate-sample"
            >
              {t('common.explore')}
            </TertiaryButton>
          </div>
        </section>

        <div className={`grid gap-6 ${viewport.isCompact ? 'grid-cols-1' : 'grid-cols-2'}`}>
          <Card title={t('home.modularTitle')}>
            <p className="text-[var(--font-size-sm)] text-[var(--color-text-muted)]">{t('home.modularDesc')}</p>
          </Card>
          <Card title={t('home.themeTitle')}>
            <p className="text-[var(--font-size-sm)] text-[var(--color-text-muted)]">{t('home.themeDesc')}</p>
          </Card>
        </div>

        {/* Viewport Info Floating Badge */}
        <div className="fixed bottom-4 right-4 bg-black/80 text-white text-[10px] p-2 rounded-lg font-mono z-50 backdrop-blur-sm border border-white/10 pointer-events-none">
          {viewport.width}x{viewport.height} | {viewport.isMobile ? t('viewport.mobile') : viewport.isTablet ? t('viewport.tablet') : t('viewport.desktop')}
          {viewport.isCompact && ` (${t('viewport.compact')})`}
        </div>
      </div>
    </SampleLayout>
  );
};
