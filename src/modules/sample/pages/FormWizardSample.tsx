import React, { useState } from 'react';
import { MainShell } from '../../../ui/components/common/shells/MainShell';
import { FormWizard } from '../../../ui/components/common/FormWizard';
import { Card, CardHeader, CardTitle, CardContent } from '../../../ui/components/common/Card';
import { TextInput, EmailInput, LongTextInput } from '../../../ui/components/elements/Inputs';
import { useGlobalState } from '../../../logic/context/GlobalContext';

export const FormWizardSample: React.FC = () => {
  const { t } = useGlobalState();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    address: '',
    preference: ''
  });

  const updateForm = (key: string, val: string) => {
    setFormData(prev => ({ ...prev, [key]: val }));
  };

  const steps = [
    {
      id: 1,
      label: t('wizard.personalInfo'),
      isValid: !!formData.name && !!formData.email,
      component: (
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-[var(--font-size-xs)] font-medium text-[var(--color-text-base)]">{t('wizard.fullName')}</label>
            <TextInput 
              value={formData.name} 
              onChange={(e) => updateForm('name', e.target.value)} 
              placeholder={t('wizard.namePlaceholder')}
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-[var(--font-size-xs)] font-medium text-[var(--color-text-base)]">{t('wizard.emailAddress')}</label>
            <EmailInput 
              value={formData.email} 
              onChange={(e) => updateForm('email', e.target.value)} 
              placeholder={t('wizard.emailPlaceholder')}
              required
            />
          </div>
        </div>
      )
    },
    {
      id: 2,
      label: t('wizard.addressDetails'),
      isValid: !!formData.address,
      component: (
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-[var(--font-size-xs)] font-medium text-[var(--color-text-base)]">{t('wizard.shippingAddress')}</label>
            <LongTextInput 
              value={formData.address} 
              onChange={(e) => updateForm('address', e.target.value)} 
              placeholder={t('wizard.addressPlaceholder')}
              required
            />
          </div>
        </div>
      )
    },
    {
      id: 3,
      label: t('wizard.preferences'),
      isValid: true,
      component: (
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-[var(--font-size-xs)] font-medium text-[var(--color-text-base)]">{t('wizard.notes')}</label>
            <LongTextInput 
              value={formData.preference} 
              onChange={(e) => updateForm('preference', e.target.value)} 
              placeholder={t('wizard.notesPlaceholder')}
            />
          </div>
        </div>
      )
    }
  ];

  return (
    <MainShell title={t('shells.samples.formTitle')}>
      <div className="max-w-3xl mx-auto py-8">
        <FormWizard 
          steps={steps}
          onComplete={() => alert(t('wizard.completeAlert', { data: JSON.stringify(formData) }))}
        />
      </div>
    </MainShell>
  );
};
