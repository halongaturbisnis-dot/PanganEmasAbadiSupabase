import React from 'react';
import { DetailShell } from '../../../ui/components/common/shells/DetailShell';

import { useGlobalState } from '../../../logic/context/GlobalContext';

export const DetailShellSample: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const { t } = useGlobalState();
  
  return (
    <DetailShell 
      title={t('shells.samples.detailTitle')}
      id="USR-9982X"
      onEdit={() => alert(t('common.edit') + ' Clicked')}
      onDelete={() => alert(t('common.delete') + ' Clicked')}
      onBack={onBack}
    >
      <div className="flex flex-col items-center justify-center h-full min-h-[300px] border-2 border-dashed border-[var(--ui-tertiary)] rounded-[2rem]">
        <p className="text-[var(--color-text-muted)] font-medium">{t('shells.mockContent.detail')}</p>
        <p className="text-xs text-[var(--color-text-muted)] mt-2">{t('shells.mockContent.detailDesc')}</p>
      </div>
    </DetailShell>
  );
};
