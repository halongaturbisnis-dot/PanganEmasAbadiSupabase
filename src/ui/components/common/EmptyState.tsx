import React, { useId } from 'react';
import { Inbox } from 'lucide-react';
import { cn } from '../../../logic/utils/cn';
import { Button } from '../elements/Button';
import { useGlobalState } from '../../../logic/context/GlobalContext';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  id?: string;
}

/**
 * EmptyState Component
 * Displays a placeholder for empty data states.
 * Fully integrated with tokens.ts and responsive standards.
 * All editorial text is hardcoded as per standard.
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className,
  id
}) => {
  const generatedId = useId();
  const { state } = useGlobalState();
  const isMobile = state.viewport.isMobile;
  const finalId = id || `empty-state-${generatedId.replace(/:/g, '')}`;

  return (
    <div 
      id={finalId}
      className={cn(
        "flex flex-col items-center justify-center py-SpacingHuge text-center border-BorderMedium border-dashed border-ColorSidebarBorder/OpacitySubtle rounded-RadiusLarge bg-ColorBgSecondary/OpacityMuted",
        isMobile ? "px-SpacingBase" : "px-SpacingLarge",
        className
      )}
    >
      <div id={`${finalId}-icon-wrapper`} className="w-SpacingHuge h-SpacingHuge rounded-RadiusLarge bg-ColorSidebarBorder/OpacitySubtle flex items-center justify-center text-TextColorMuted mb-SpacingMedium">
        {icon || <Inbox size="2rem" id={`${finalId}-default-icon`} />}
      </div>
      
      <h3 id={`${finalId}-title`} className="text-FontSizeBase font-bold text-TextColorBase mb-SpacingTiny">
        {title || "Belum ada data"}
      </h3>
      
      <p id={`${finalId}-description`} className="text-FontSizeSm text-TextColorMuted max-w-ContainerXs mb-SpacingLarge text-balance">
        {description || "Hasil tidak ditemukan. Silakan tambahkan data atau periksa filter pencarian Anda."}
      </p>

      {action && (
        <Button 
          id={`${finalId}-action-button`}
          variant="default" 
          onClick={action.onClick}
          className={cn("shadow-ElevationNormal", isMobile ? "w-full" : "w-auto")}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
};
