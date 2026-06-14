import React from 'react';
import { SettingsShell } from '../../../ui/components/common/shells/SettingsShell';

import { useGlobalState } from '../../../logic/context/GlobalContext';

export const SettingsShellSample: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const { t } = useGlobalState();

  return (
    <SettingsShell 
      title={t('shells.samples.settingsTitle')}
      onBack={onBack}
      onEdit={() => alert(t('common.edit') + ' Clicked')}
      onDelete={() => alert(t('common.delete') + ' Clicked')}
    >
      <div className="flex flex-col items-center justify-center h-full min-h-[300px] border-2 border-dashed border-[var(--ui-tertiary)] rounded-[2rem]">
        <p className="text-[var(--color-text-muted)] font-medium">{t('shells.mockContent.settings')}</p>
        <p className="text-xs text-[var(--color-text-muted)] mt-2">{t('shells.mockContent.settingsDesc')}</p>
      </div>
    </SettingsShell>
  );
};
