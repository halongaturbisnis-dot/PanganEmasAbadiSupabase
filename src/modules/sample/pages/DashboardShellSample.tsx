import React from 'react';
import { DashboardShell } from '../../../ui/components/common/shells/DashboardShell';

import { useGlobalState } from '../../../logic/context/GlobalContext';

export const DashboardShellSample: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const { t } = useGlobalState();

  return (
    <DashboardShell 
      title={t('shells.samples.dashboardTitle')}
      subtitle={t('shells.samples.dashboardSubtitle')}
      onBack={onBack}
      onEdit={() => alert(t('common.edit') + ' Clicked')}
      onDelete={() => alert(t('common.delete') + ' Clicked')}
    >
      <div className="flex flex-col items-center justify-center h-full min-h-[300px] border-2 border-dashed border-[var(--ui-tertiary)] rounded-[2rem]">
        <p className="text-[var(--color-text-muted)] font-medium">{t('shells.mockContent.dashboard')}</p>
        <p className="text-xs text-[var(--color-text-muted)] mt-2">{t('shells.mockContent.dashboardDesc')}</p>
      </div>
    </DashboardShell>
  );
};
