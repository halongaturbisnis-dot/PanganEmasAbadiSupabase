import React from 'react';
import { ChevronLeft, Save, Edit2, Trash2 } from 'lucide-react';
import { PrimaryButton, SecondaryButton, DangerButton } from '../../elements/Button';
import { useGlobalState } from '../../../../logic/context/GlobalContext';
import { cn } from '../../../../logic/utils/cn';
import { PageLoading } from '../../LoadingState/PageLoading';

interface FormShellProps {
  title: string;
  id?: string;
  subtitle?: string;
  onSave?: () => void;
  onCancel?: () => void;
  onBack?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  children: React.ReactNode;
  isLoading?: boolean;
  isPageLoading?: boolean;
  isSaveDisabled?: boolean;
  actions?: React.ReactNode;
  className?: string;
  saveLabel?: string;
  cancelLabel?: string;
}

export const FormShell: React.FC<FormShellProps> = ({ 
  title, 
  id = "form-shell",
  subtitle,
  onSave, 
  onCancel, 
  onBack,
  onEdit,
  onDelete,
  children, 
  isLoading,
  isPageLoading = false,
  isSaveDisabled,
  actions,
  className,
  saveLabel = "Simpan Perubahan",
  cancelLabel = "Batal"
}) => {
  const { state } = useGlobalState();
  const isMobile = state.viewport.isMobile;
  const displaySubtitle = subtitle || "Manajemen Resource";

  const hasActions = !!(onEdit || onDelete || actions);

  // Menggunakan onBack untuk header, jika tidak ada gunakan onCancel (fallback)
  const handleBackClick = onBack || onCancel;

  // Kelas tombol dasar sesuai referensi Anda
  const baseButtonClass = "px-SpacingBase py-SpacingSmall !rounded-RadiusMedium shadow-ElevationMid shadow-ColorPrimary/opacity-OpacitySubtle whitespace-nowrap transition-all active:scale-95 font-medium";

  return (
    <div id={id} className={cn("w-full flex flex-col min-h-[70vh] animate-in slide-in-from-bottom-layout-TransformShort duration-DurationMid", className)}>
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
          {handleBackClick && (
            <PrimaryButton 
              id={`${id}-back-btn`}
              onClick={handleBackClick}
              className={baseButtonClass}
              icon={<ChevronLeft id={`${id}-back-icon`} size="1.125rem" />}
            >
            </PrimaryButton>
          )}
          <div id={`${id}-title-group`} className="flex-1 min-w-0">
            <h2 id={`${id}-title`} className={cn("text-TextColorBase font-bold leading-LineHeightTight", isMobile ? "text-FontSizeH4" : "text-FontSizeH3")}>
              {title}
            </h2>
          </div>
        </div>
        
        {hasActions && (
          <div id={`${id}-header-actions`} className={cn("flex items-center gap-SpacingTiny", isMobile && "w-full justify-end overflow-x-auto")}>
            {onEdit && (
              <PrimaryButton 
                id={`${id}-header-edit-btn`}
                onClick={onEdit}
                className={baseButtonClass}
                icon={<Edit2 id={`${id}-edit-icon`} size="1.125rem" />}
              >
                Ubah
              </PrimaryButton>
            )}
            {onDelete && (
              <DangerButton 
                id={`${id}-header-delete-btn`}
                onClick={onDelete}
                className={baseButtonClass}
                icon={<Trash2 id={`${id}-delete-icon`} size="1.125rem" />}
              >
                Hapus
              </DangerButton>
            )}
            {actions}
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div id={`${id}-content`} className="flex-1 w-full relative min-h-[10rem] flex flex-col animate-in fade-in duration-DurationMid">
        {isPageLoading ? (
          <PageLoading variant="spinner" className="flex-1" />
        ) : (
          children
        )}
      </div>

      {/* Footer Actions */}
      <div 
        id={`${id}-footer`} 
        className={cn(
          "mt-SpacingLarge bg-white border-t border-ColorSidebarBorder/10 py-SpacingBase flex items-center justify-between gap-SpacingMedium",
          isMobile ? "flex-row px-0" : "px-0"
        )}
      >
        <div id={`${id}-footer-left`} className={cn(isMobile ? "w-[40%] sm:w-auto" : "")}>
          {onCancel && (
            <SecondaryButton 
              id={`${id}-cancel-btn`}
              onClick={onCancel}
              className={cn(baseButtonClass, isMobile && "w-full justify-center")}
            >
              <span className="truncate">{cancelLabel}</span>
            </SecondaryButton>
          )}
        </div>
        <div id={`${id}-footer-actions-right`} className={cn("flex items-center gap-SpacingSmall", isMobile ? "w-[60%] sm:w-auto justify-end" : "")}>
          {onSave && (
            <PrimaryButton 
              id={`${id}-save-btn`}
              onClick={onSave}
              isLoading={isLoading}
              disabled={isSaveDisabled}
              className={cn(baseButtonClass, isMobile ? "w-full justify-center" : "flex-none", "font-bold", isLoading && "opacity-opacity-OpacityMid")}
              icon={<Save id={`${id}-save-icon`} size="1.125rem" className="shrink-0" />}
            >
              <span className="truncate">{isLoading ? "Memproses..." : saveLabel}</span>
            </PrimaryButton>
          )}
        </div>
      </div>
      </div>
  );
};