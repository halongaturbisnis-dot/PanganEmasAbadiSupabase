import React from 'react';
import { FormShell } from '../../../ui/components/common/shells/FormShell';

import { useGlobalState } from '../../../logic/context/GlobalContext';

export const FormShellSample: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const { t } = useGlobalState();

  return (
    <FormShell 
      title={t('shells.samples.formTitle')}
      subtitle={t('shells.samples.formSubtitle')}
      onBack={onBack}
      onEdit={() => alert(t('common.edit') + ' Clicked')}
      onDelete={() => alert(t('common.delete') + ' Clicked')}
      onSave={() => alert(t('common.save') + ' Clicked')}
      onCancel={onBack}
    >
      <div className="flex flex-col items-center justify-center h-full min-h-[300px] border-2 border-dashed border-[var(--ui-tertiary)] rounded-[2rem]">
        <p className="text-[var(--color-text-muted)] font-medium">{t('shells.mockContent.form')}</p>
        <p className="text-xs text-[var(--color-text-muted)] mt-2">{t('shells.mockContent.formDesc')}</p>
      </div>
    </FormShell>
  );
};
