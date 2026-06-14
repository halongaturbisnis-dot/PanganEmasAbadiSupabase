import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { cn } from '../../../logic/utils/cn';
import { useGlobalState } from '../../../logic/context/GlobalContext';

import { Button, PrimaryButton, SecondaryButton } from '../elements/Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  onSubmit?: () => void;
  onCancel?: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  isSubmitDisabled?: boolean;
  variant?: 'popup' | 'slideside';
  className?: string;
  id?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  onSubmit,
  onCancel,
  submitLabel,
  cancelLabel,
  isSubmitDisabled,
  variant = 'popup',
  className,
  id = "modal"
}) => {
  const { state } = useGlobalState();
  const isMobile = state.viewport.isMobile;

  // Render standardized footer if submit/cancel props are provided and no custom footer is passed
  const renderDefaultFooter = () => {
    if (footer) return footer;
    if (!onSubmit && !onCancel && !submitLabel && !cancelLabel) return null;

    return (
      <div className="flex items-center gap-[0.75rem]">
        {(onCancel || cancelLabel) && (
          <SecondaryButton
            id={`${id}-cancel-btn`}
            onClick={onCancel || onClose}
          >
            {cancelLabel || 'Batal'}
          </SecondaryButton>
        )}
        {(onSubmit || submitLabel) && (
          <PrimaryButton
            id={`${id}-submit-btn`}
            onClick={onSubmit}
            className={cn(isSubmitDisabled && "opacity-50 cursor-not-allowed")}
            disabled={isSubmitDisabled}
          >
            {submitLabel || 'Simpan'}
          </PrimaryButton>
        )}
      </div>
    );
  };

  // Prevent scrolling on body when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const popupVariants = {
    hidden: { opacity: 0, y: 50, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { type: 'spring', damping: 25, stiffness: 300 }
    },
    exit: { 
      opacity: 0, 
      y: 20, 
      scale: 0.95, 
      transition: { duration: 0.2, ease: "easeOut" } 
    }
  };

  const slidesideVariants = {
    hidden: { opacity: 0, x: '100%' },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { type: 'spring', damping: 30, stiffness: 200 }
    },
    exit: { 
      opacity: 0, 
      x: isMobile ? '100%' : '50%', 
      transition: { duration: 0.2, ease: "easeIn" } 
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* PERBAIKAN Z-INDEX MUTLAK: Memaksa overlay berada di lapisan teratas absolut menggunakan z-[99998] */}
          <motion.div
            id={`${id}-overlay`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[99998] bg-ColorBgInverse/opacity-OpacityMuted backdrop-blur-sm"
            aria-hidden="true"
          />
          
          {/* PERBAIKAN Z-INDEX MUTLAK: Mengunci container utama di level tertinggi z-[99999] agar input field lain tidak melompat ke depan */}
          <div id={`${id}-container`} className={cn(
            "fixed z-[99999] flex outline-none",
            variant === 'popup' 
              ? cn("inset-0 items-center justify-center", isMobile ? "p-SpacingMedium" : "p-SpacingLarge") 
              : "top-0 right-0 bottom-0 max-w-full"
          )}>
            <motion.div
              id={`${id}-content`}
              variants={variant === 'popup' ? popupVariants : slidesideVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className={cn(
                "bg-ColorBg shadow-ElevationHigh overflow-hidden flex flex-col transition-colors",
                variant === 'popup' 
                  ? cn("w-full max-w-ContainerMd min-w-min-width-ContainerXs rounded-RadiusLarge", isMobile ? "max-h-[85dvh]" : "max-h-[90dvh]") 
                  : cn("h-full", isMobile ? "w-full" : "w-full max-w-ContainerSm"),
                isMobile && variant === 'popup' && "rounded-RadiusMedium",
                className
              )}
            >
              {/* PERBAIKAN HEADER MODAL: Menghilangkan class 'border-b border-ColorSidebarBorder/opacity-OpacitySubtle' */}
<div id={`${id}-header`} className="flex items-center justify-between px-SpacingMedium py-SpacingBase bg-ColorBg/80 backdrop-blur-md sticky top-0 z-ZRaised">
  {title && (
    <h3 id={`${id}-title`} className="text-FontSizeH4 font-bold text-TextColorBase leading-LineHeightTight uppercase tracking-tight">{title}</h3>
  )}
  <button
    id={`${id}-close-button`}
    onClick={onClose}
    aria-label="Tutup"
    className="p-SpacingTiny ml-auto text-TextColorMuted transition-all rounded-RadiusFull hover:text-FeedbackColorWarning focus:outline-none focus:ring-2 focus:ring-ColorPrimary/opacity-OpacitySubtle active:scale-95"
  >
    <X id={`${id}-close-icon`} className="w-5 h-5" />
  </button>
</div>
              <div id={`${id}-body`} className="flex-1 p-SpacingMedium overflow-y-auto custom-scrollbar bg-ColorBg">
                {children}
              </div>
              {renderDefaultFooter() && (
                <div id={`${id}-footer`} className="p-SpacingMedium bg-ColorBg/80 backdrop-blur-md flex items-center justify-end gap-SpacingSmall sticky bottom-0 z-ZRaised">
                  {renderDefaultFooter()}
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default Modal;