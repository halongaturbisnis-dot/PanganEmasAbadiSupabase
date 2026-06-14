import React from 'react';
import { cn } from '../../../logic/utils/cn';
import { Loader2 } from 'lucide-react';
import { useGlobalState } from '../../../logic/context/GlobalContext';

interface GlobalLoadingProps {
  isLoading: boolean;
  text?: string;
  variant?: 'spinner' | 'skeleton';
}

export const GlobalLoading: React.FC<GlobalLoadingProps> = ({ isLoading, text, variant = 'spinner' }) => {
  const { t } = useGlobalState();
  const loadingText = text || t('input.loading');
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-ZTopmost bg-ColorBg/opacity-OpacityHigh backdrop-blur-sm flex flex-col items-center justify-center">
      {variant === 'spinner' ? (
        <div className="flex flex-col items-center">
          <Loader2 className="w-spacing-SpacingExtraHuge h-spacing-SpacingExtraHuge animate-spin text-ColorPrimary" />
          {loadingText && <p className="mt-SpacingBase text-TextColorBase font-medium">{loadingText}</p>}
        </div>
      ) : (
        <div className="flex flex-col items-center w-full max-w-md p-SpacingLarge gap-SpacingBase">
          <div className="w-full h-spacing-SpacingHuge bg-ColorTertiary/opacity-OpacitySubtle animate-pulse rounded-RadiusSmall" />
          <div className="w-3/4 h-spacing-SpacingHuge bg-ColorTertiary/opacity-OpacitySubtle animate-pulse rounded-RadiusSmall" />
          <div className="w-1/2 h-spacing-SpacingHuge bg-ColorTertiary/opacity-OpacitySubtle animate-pulse rounded-RadiusSmall" />
        </div>
      )}
    </div>
  );
};
