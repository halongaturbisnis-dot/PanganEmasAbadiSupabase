import React from 'react';
import { Edit2, Trash2, Printer, Share2, MoreVertical, ChevronLeft, Plus } from 'lucide-react';
import { PrimaryButton, DangerButton, TertiaryButton } from '../../elements/Button';
import { useGlobalState } from '../../../../logic/context/GlobalContext';
import { cn } from '../../../../logic/utils/cn';
import { PageLoading } from '../../LoadingState/PageLoading';

interface DetailShellProps {
  title: string;
  id: string;
  onEdit?: () => void;
  onDelete?: () => void;
  onBack?: () => void;
  children: React.ReactNode;
  className?: string;
  isLoading?: boolean;
}

// Gaya tombol yang konsisten berdasarkan request
const actionButtonClass = "px-SpacingBase py-SpacingSmall !rounded-RadiusMedium shadow-ElevationMid shadow-ColorPrimary/opacity-OpacitySubtle whitespace-nowrap";

export const DetailShell: React.FC<DetailShellProps> = ({ 
  title, 
  id, 
  onEdit,
  onDelete,
  onBack,
  children,
  className,
  isLoading = false
}) => {
  const { state } = useGlobalState();
  const isMobile = state.viewport.isMobile;

  const hasActions = !!(onEdit || onDelete);

  return (
    <div id={id} className={cn("w-full flex flex-col min-h-[70vh] space-y-SpacingMedium animate-in fade-in zoom-in-layout-TransformShort duration-DurationMid", className)}>
      {/* Unified Shell Header */}
      <div 
        id={`${id}-header`} 
        className={cn(
          "flex items-center justify-between mb-SpacingMedium pb-SpacingBase",
          isMobile && "flex-col items-start",
          isMobile && hasActions && "gap-SpacingMedium",
          isMobile && !hasActions && "gap-0"
        )}
      >
        <div id={`${id}-left`} className="flex items-center gap-SpacingBase text-left w-full">
          {onBack && (
            <PrimaryButton 
              id={`${id}-back-btn`}
              onClick={onBack}
              className={actionButtonClass}
              icon={<ChevronLeft id={`${id}-back-icon`} size="1.125rem" />}
            >
              {/* Teks opsional jika ingin tombol "Kembali" memiliki teks */}
              {isMobile ? '' : ''} 
            </PrimaryButton>
          )}
          <div id={`${id}-title-group`} className="flex-1 min-w-0">
            <h2 id={`${id}-title`} className={cn("text-TextColorBase leading-LineHeightTight font-bold", isMobile ? "text-FontSizeH4" : "text-FontSizeH3")}>
              {title}
            </h2>
          </div>
        </div>
        
        {hasActions && (
          <div id={`${id}-actions`} className={cn("flex items-center gap-SpacingTiny", isMobile && "w-full justify-end overflow-x-auto pb-SpacingTiny")}>
            <div className="flex items-center gap-SpacingTiny">
              {onEdit && (
                <PrimaryButton 
                  id={`${id}-edit-btn`}
                  onClick={onEdit}
                  className={actionButtonClass}
                  icon={<Edit2 id={`${id}-edit-icon`} size="1.125rem" />}
                >
                </PrimaryButton>
              )}
              {onDelete && (
                <DangerButton 
                  id={`${id}-delete-btn`}
                  onClick={onDelete}
                  className={actionButtonClass}
                  icon={<Trash2 id={`${id}-delete-icon`} size="1.125rem" />}
                >
                </DangerButton>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div id={`${id}-content`} className="flex-1 w-full relative min-h-[10rem] flex flex-col animate-in fade-in slide-in-from-bottom-layout-TransformShort duration-DurationMid">
        {isLoading ? (
          <PageLoading variant="spinner" className="flex-1" />
        ) : (
          children
        )}
      </div>
    </div>
  );
};
