import React from 'react';
import { TrendingUp, ArrowUpRight, ArrowDownRight, LayoutGrid, Calendar, ChevronLeft, Edit2, Trash2 } from 'lucide-react';
import { PrimaryButton, DangerButton, SecondaryButton } from '../../elements/Button';
import { useGlobalState } from '../../../../logic/context/GlobalContext';
import { cn } from '../../../../logic/utils/cn';

/* Dashboard content will be provided by children */

interface DashboardShellProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onBack?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  actions?: React.ReactNode;
  id?: string;
}

export const DashboardShell: React.FC<DashboardShellProps> = ({ 
  title, 
  subtitle,
  children,
  onBack,
  onEdit,
  onDelete,
  actions,
  id = "dashboard-shell"
}) => {
  const { state } = useGlobalState();
  const isMobile = state.viewport.isMobile;
  const displaySubtitle = subtitle || "Analitik Global";

  return (
    <div id={id} className="space-y-SpacingMedium animate-in fade-in duration-DurationSlow">
      {/* Unified Shell Header */}
      <div 
        id={`${id}-header`} 
        className={cn(
          "flex items-center justify-between mb-SpacingMedium border-b border-ColorSidebarBorder/opacity-OpacitySubtle pb-SpacingBase",
          isMobile && "flex-col items-start gap-SpacingMedium"
        )}
      >
        <div id={`${id}-title-section`} className="flex items-center gap-SpacingBase text-left w-full">
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
          <div id={`${id}-brand`} className="flex items-center gap-SpacingBase">
            <div 
              id={`${id}-icon-wrapper`} 
              className={cn("rounded-RadiusLarge bg-ColorPrimary flex items-center justify-center text-White shadow-ElevationNormal", isMobile ? "w-spacing-SpacingHuge h-spacing-SpacingHuge" : "w-ContainerTiny h-ContainerTiny")}
            >
              <LayoutGrid id={`${id}-icon`} size={isMobile ? 20 : 24} />
            </div>
            <div id={`${id}-text`}>
              <h2 id={`${id}-title`} className={cn("text-TextColorBase leading-LineHeightTight font-bold", isMobile ? "text-FontSizeH4" : "text-FontSizeH3")}>
                {title}
              </h2>
              <p id={`${id}-subtitle`} className="text-FontSizeNano text-TextColorMuted mt-SpacingTiny leading-none font-medium">
                {displaySubtitle}
              </p>
            </div>
          </div>
        </div>
        
        <div id={`${id}-actions`} className={cn("flex items-center gap-SpacingTiny", isMobile && "w-full justify-between overflow-x-auto pb-SpacingTiny")}>
          <div className="flex items-center gap-SpacingTiny">
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
          </div>
          
          <div className="flex items-center gap-SpacingTiny">
            {actions}
            <SecondaryButton 
              id={`${id}-date-btn`} 
              size="sm" 
              icon={<Calendar id={`${id}-calendar-icon`} size="0.875rem" />}
              className="whitespace-nowrap rounded-RadiusMedium"
            >
              30 Hari Terakhir
            </SecondaryButton>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div id={`${id}-content`} className="flex-1 w-full relative min-h-fit animate-in fade-in slide-in-from-bottom-layout-TransformShort duration-DurationMid">
        {children}
      </div>
    </div>
  );
};
