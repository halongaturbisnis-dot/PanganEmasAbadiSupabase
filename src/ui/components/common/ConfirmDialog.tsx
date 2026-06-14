import React, { useId } from 'react';
import { Modal } from './Modal';
import { Button } from '../elements/Button';
import { useGlobalState } from '../../../logic/context/GlobalContext';
import { AlertCircle, AlertTriangle, HelpCircle } from 'lucide-react';
import { cn } from '../../../logic/utils/cn';

/**
 * ConfirmDialog Component
 * Integrated with tokens.ts, global.css, and GlobalContext.
 * Hardcoded editorial for Indonesian/English as per standards.
 */
export const ConfirmDialog: React.FC = () => {
  const { state, setState } = useGlobalState();
  const options = state.confirmDialog;
  const isMobile = state.viewport.isMobile;
  const generatedId = useId();

  if (!options) return null;

  const handleClose = () => {
    setState(prev => ({ ...prev, confirmDialog: null }));
  };

  const handleConfirm = () => {
    if (options.onConfirm) options.onConfirm();
    handleClose();
  };

  const handleCancel = () => {
    if (options.onCancel) options.onCancel();
    handleClose();
  };

  const dialogId = options.id || `global-confirm-${generatedId.replace(/:/g, '')}`;

  const Icon = options.variant === 'danger' 
    ? AlertCircle 
    : options.variant === 'warning' 
    ? AlertTriangle 
    : HelpCircle;

  const colorClass = options.variant === 'danger'
    ? "text-FeedbackColorError"
    : options.variant === 'warning'
    ? "text-FeedbackColorWarning"
    : "text-ColorPrimary";

  return (
    <Modal
      id={dialogId}
      isOpen={!!options}
      onClose={handleCancel}
      title={options.title || "Konfirmasi"}
      showClose={false}
      className="max-w-ContainerSm"
    >
      <div id={`${dialogId}-content-wrapper`} className={cn("flex flex-col items-center text-center gap-SpacingMedium", isMobile ? "py-SpacingBase" : "py-SpacingMedium")}>
        <div id={`${dialogId}-icon-bg-wrapper`} className="relative flex items-center justify-center">
          <div 
            id={`${dialogId}-icon-bg`} 
            className={cn(
              "w-SpacingHuge h-SpacingHuge rounded-RadiusFull bg-current opacity-OpacityMuted absolute", 
              colorClass
            )} 
          />
          <Icon id={`${dialogId}-icon`} size="2rem" className={cn("relative z-ZBase", colorClass)} />
        </div>
        
        <div id={`${dialogId}-message-container`} className="space-y-SpacingTiny mt-SpacingTiny px-SpacingBase">
          <p id={`${dialogId}-message`} className={cn("text-TextColorBase font-medium leading-relaxed", isMobile ? "text-FontSizeBase" : "text-FontSizeSm")}>
            {options.message}
          </p>
        </div>

        <div id={`${dialogId}-actions`} className={cn("flex items-center gap-SpacingSmall w-full mt-SpacingLarge", isMobile ? "flex-col px-SpacingBase" : "flex-row px-0")}>
          <Button
            id={`${dialogId}-cancel`}
            variant="ghost"
            onClick={handleCancel}
            className={cn("w-full transition-colors", isMobile ? "order-2" : "flex-1 order-1")}
          >
            {options.cancelLabel || "Batal"}
          </Button>
          <Button
            id={`${dialogId}-confirm`}
            variant={options.variant === 'danger' ? 'destructive' : 'default'}
            onClick={handleConfirm}
            className={cn(
              isMobile ? "w-full order-1" : "flex-1 order-2",
              options.variant === 'danger' ? "" : "bg-ColorPrimary text-ColorBg hover:opacity-OpacityMuted transition-opacity"
            )}
          >
            {options.confirmLabel || "Lanjutkan"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
