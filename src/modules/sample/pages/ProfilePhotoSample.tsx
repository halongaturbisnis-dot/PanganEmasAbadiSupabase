import React, { useState } from 'react';
import { FormShell } from '../../../ui/components/common/shells/FormShell';
import { Card, CardHeader, CardTitle, CardContent } from '../../../ui/components/common/Card';
import { ProfilePhotoInput } from '../../../ui/components/elements/ProfilePhotoInput';
import { useGlobalState } from '../../../logic/context/GlobalContext';

export const ProfilePhotoSample: React.FC = () => {
  const { t } = useGlobalState();
  const [photo, setPhoto] = useState<File | null>(null);

  return (
    <FormShell title="Profile Photo Sample">
      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Avatar & Photo Input</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center py-8">
            <ProfilePhotoInput 
              onChange={(file) => setPhoto(file)}
            />
            
            <div className="mt-8 p-4 w-full bg-[var(--color-bg-secondary)] border border-[var(--color-tertiary)]/20 rounded-xl">
              <h4 className="text-[var(--font-size-xs)] font-bold uppercase text-[var(--color-text-muted)] mb-2">Value Details</h4>
              <div className="font-mono text-[var(--font-size-xs)] text-[var(--color-text-base)] break-all">
                {photo ? (
                  <ul className="space-y-1">
                    <li>Name: {photo.name}</li>
                    <li>Size: {(photo.size / 1024).toFixed(2)} KB</li>
                    <li>Type: {photo.type}</li>
                  </ul>
                ) : (
                  <span className="italic text-[var(--color-text-muted)]">No photo selected</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Implementation Details</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none text-[var(--color-text-muted)]">
            <ul className="list-disc pl-5 space-y-2 text-[var(--font-size-sm)]">
              <li><strong>Minimalist UI:</strong> Clean circle frame with hover interactions.</li>
              <li><strong>Instant Preview:</strong> Shows the selected/cropped image immediately.</li>
              <li><strong>Manual Cropping:</strong> Integrated modal using <code>react-easy-crop</code> for precise user selection.</li>
              <li><strong>Validation:</strong> Restricts selection to static image formats.</li>
              <li><strong>Integration:</strong> Uses theme tokens and multi-language support (locales).</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </FormShell>
  );
};
