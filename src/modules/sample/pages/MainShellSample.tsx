import React from 'react';
import { MainShell } from '../../../ui/components/common/shells/MainShell';

import { useGlobalState } from '../../../logic/context/GlobalContext';

export const MainShellSample: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const { t } = useGlobalState();

  return (
    <MainShell 
      title={t('shells.samples.mainTitle')}
      subtitle={t('shells.samples.mainSubtitle')}
      onBack={onBack}
      onEdit={() => alert(t('common.edit') + ' Clicked')}
      onDelete={() => alert(t('common.delete') + ' Clicked')}
      onAdd={() => alert(t('common.add') + ' Clicked')}
    >
      <div className="flex flex-col items-center justify-center h-full min-h-[300px] border-2 border-dashed border-[var(--ui-tertiary)] rounded-[2rem]">
        <p className="text-[var(--color-text-muted)] font-medium">{t('shells.mockContent.main')}</p>
        <p className="text-xs text-[var(--color-text-muted)] mt-2">{t('shells.mockContent.mainDesc')}</p>
      </div>
    </MainShell>
  );
};
