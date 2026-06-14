import React from 'react';
import { Search, Filter, Plus, MoreHorizontal, Download, ChevronLeft, Edit2, Trash2 } from 'lucide-react';
import { PrimaryButton, TertiaryButton, DangerButton } from '../../elements/Button';
import { useGlobalState } from '../../../../logic/context/GlobalContext';
import { cn } from '../../../../logic/utils/cn';
import { PageLoading } from '../../LoadingState/PageLoading';

interface MainShellProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onAdd?: () => void;
  onBack?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  actions?: React.ReactNode;
  hideDownload?: boolean;
  hideFilter?: boolean;
  hideMore?: boolean;
  hideSearch?: boolean;
  hideHeaderDivider?: boolean;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchInHeader?: boolean;
  id?: string;
  className?: string;
  isLoading?: boolean;
}

export const MainShell: React.FC<MainShellProps> = ({ 
  title, 
  subtitle, 
  children, 
  onAdd, 
  onBack,
  onEdit,
  onDelete,
  actions,
  hideDownload = false,
  hideFilter = false,
  hideMore = false,
  hideSearch = false,
  hideHeaderDivider = false,
  searchPlaceholder,
  searchValue,
  onSearchChange,
  searchInHeader = false,
  id = "main-shell",
  className,
  isLoading = false
}) => {
  const { state } = useGlobalState();
  const isMobile = state.viewport.isMobile;

  const hasActions = !!(actions || onAdd);

  return (
    <div id={id} className={cn("space-y-SpacingMedium flex flex-col min-h-[70vh] animate-in fade-in duration-DurationSlow", className)}>
      {/* Unified Shell Header */}
      <div 
        id={`${id}-header`} 
        className={cn(
          "flex items-center justify-between mb-SpacingBase pb-SpacingSmall",
          !hideHeaderDivider && "border-b border-ColorSidebarBorder/0",
          isMobile && "flex-col items-start",
          isMobile && hasActions && "gap-SpacingMedium",
          isMobile && !hasActions && "gap-0"
        )}
      >
        <div id={`${id}-header-left`} className="flex items-center gap-SpacingBase text-left w-full">
                    <div id={`${id}-title-group`} className="flex-1 min-w-0">
            <h2 id={`${id}-title`} className={cn("text-TextColorBase leading-LineHeightTight font-bold", isMobile ? "text-FontSizeH4" : "text-FontSizeH3")}>
              {title}
            </h2>
            
          </div>
        </div>
        
        {hasActions && (
          <div id={`${id}-header-right`} className={cn("flex items-center gap-SpacingTiny", isMobile && "w-full justify-between overflow-x-auto pb-SpacingTiny")}>
            <div className="flex items-center gap-SpacingTiny">
              {actions}
              
              {onAdd && (
                <PrimaryButton 
                  id={`${id}-add-btn`}
                  onClick={onAdd}
                  className="px-SpacingBase py-SpacingSmall !rounded-RadiusMedium shadow-ElevationMid shadow-ColorPrimary/opacity-OpacitySubtle whitespace-nowrap"
                  icon={<Plus id={`${id}-add-icon`} size="1.125rem" />}
                >
                  Tambah
                </PrimaryButton>
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

