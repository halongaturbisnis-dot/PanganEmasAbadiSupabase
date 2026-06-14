import React from 'react';
import { cn } from '../../../logic/utils/cn';
import { Loader2 } from 'lucide-react';
import { useGlobalState } from '../../../logic/context/GlobalContext';

interface InlineLoadingProps extends React.HTMLAttributes<HTMLDivElement> {
  text?: string;
  variant?: 'spinner' | 'skeleton';
}

export const InlineLoading: React.FC<InlineLoadingProps> = ({ className, text, variant = 'spinner', ...props }) => {
  const { t } = useGlobalState();
  const loadingText = text || t('input.loading');
  return (
    <div className={cn("flex w-full items-center justify-center p-SpacingBase", className)} {...props}>
      {variant === 'spinner' ? (
        <div className="flex items-center gap-SpacingSmall">
          <Loader2 className="w-spacing-SpacingBase h-spacing-SpacingBase animate-spin text-ColorPrimary" />
          {loadingText && <span className="text-TextColorMuted text-FontSizeSm font-medium">{loadingText}</span>}
        </div>
      ) : (
        <div className="flex w-full items-center gap-SpacingSmall">
          <div className="w-spacing-SpacingLarge h-spacing-SpacingLarge bg-ColorTertiary/opacity-OpacityMuted animate-pulse rounded-RadiusFull" />
          <div className="flex-1 space-y-SpacingNano">
            <div className="h-spacing-SpacingBase bg-ColorTertiary/opacity-OpacityMuted animate-pulse rounded w-3/4" />
            <div className="h-spacing-SpacingSmall bg-ColorTertiary/opacity-OpacityMuted animate-pulse rounded w-1/2" />
          </div>
        </div>
      )}
    </div>
  );
};
