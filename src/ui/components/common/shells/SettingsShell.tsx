import React from 'react';
import { ChevronLeft, Edit2, Trash2 } from 'lucide-react';
import { PrimaryButton, DangerButton } from '../../elements/Button';
import { useGlobalState } from '../../../../logic/context/GlobalContext';
import { cn } from '../../../../logic/utils/cn';

interface SettingsShellProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onBack?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  actions?: React.ReactNode;
  id?: string;
  className?: string;
}

export const SettingsShell: React.FC<SettingsShellProps> = ({ 
  title, 
  subtitle,
  children,
  onBack,
  onEdit,
  onDelete,
  actions,
  id = "settings-shell",
  className
}) => {
  const { state } = useGlobalState();
  const isMobile = state.viewport.isMobile;
  const displaySubtitle = subtitle || "Kelola Preferensi";

  return (
    <div id={id} className={cn("w-full space-y-SpacingMedium animate-in slide-in-from-right-layout-TransformShort duration-DurationMid", className)}>
      {/* Unified Shell Header */}
      <div 
        id={`${id}-header`} 
        className={cn(
          "flex items-center justify-between mb-SpacingMedium border-b border-ColorSidebarBorder/opacity-OpacitySubtle pb-SpacingBase",
          isMobile && "flex-col items-start gap-SpacingMedium"
        )}
      >
        <div id={`${id}-header-left`} className="flex items-center gap-SpacingBase text-left w-full">
          {onBack && (
            <PrimaryButton 
              id={`${id}-back-btn`}
              onClick={onBack}
              size="icon"
              className="w-spacing-SpacingHuge h-spacing-SpacingHuge rounded-RadiusMedium flex-shrink-0"
            >
              <ChevronLeft id={`${id}-back-icon`} size="1.25rem" />
            </PrimaryButton>
          )}
          <div id={`${id}-title-group`} className="flex-1 min-w-0">
            <h2 id={`${id}-title`} className={cn("text-TextColorBase leading-LineHeightTight font-bold", isMobile ? "text-FontSizeH4" : "text-FontSizeH3")}>
              {title}
            </h2>
            <p id={`${id}-subtitle`} className={cn("text-TextColorMuted mt-SpacingTiny leading-none font-medium truncate", isMobile ? "text-FontSizeNano" : "text-FontSizeXs")}>
              {displaySubtitle}
            </p>
          </div>
        </div>
        
        <div id={`${id}-header-right`} className={cn("flex items-center gap-SpacingTiny", isMobile && "w-full justify-end overflow-x-auto")}>
          {onEdit && (
            <PrimaryButton 
              id={`${id}-edit-btn`}
              onClick={onEdit}
              size="icon"
              className="w-spacing-SpacingHuge h-spacing-SpacingHuge rounded-RadiusMedium"
            >
              <Edit2 id={`${id}-edit-icon`} size="1.125rem" />
            </PrimaryButton>
          )}
          {onDelete && (
            <DangerButton 
              id={`${id}-delete-btn`}
              onClick={onDelete}
              size="icon"
              className="w-spacing-SpacingHuge h-spacing-SpacingHuge rounded-RadiusMedium"
            >
              <Trash2 id={`${id}-delete-icon`} size="1.125rem" />
            </DangerButton>
          )}
          {actions}
        </div>
      </div>

      {/* Main Content Area */}
      <div id={`${id}-content`} className="flex-1 w-full relative min-h-fit animate-in fade-in duration-DurationMid">
        {children}
      </div>
    </div>
  );
};

