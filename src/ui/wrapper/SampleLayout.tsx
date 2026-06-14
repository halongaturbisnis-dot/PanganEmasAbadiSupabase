import React from 'react';
import { Header } from '../components/layout/Header';
import { APP_CONFIG } from '../../logic/constants/app';
import { useGlobalState } from '../../logic/context/GlobalContext';

export const SampleLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t } = useGlobalState();

  return (
    <div className="min-h-screen flex flex-col bg-ColorBg">
      <Header />
      <main className="flex-1 p-SpacingLarge">
        {children}
      </main>
      <footer className="p-SpacingLarge border-t border-ColorSidebarBorder/opacity-OpacitySubtle text-center text-FontSizeNano text-TextColorMuted bg-ColorBg">
        &copy; {new Date().getFullYear()} {APP_CONFIG.name} {t('common.architecture')}
      </footer>
    </div>
  );
};
