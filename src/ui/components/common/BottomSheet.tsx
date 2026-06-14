import React, { useEffect, useRef, useId } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { cn } from '../../../logic/utils/cn';
import { useGlobalState } from '../../../logic/context/GlobalContext';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  showClose?: boolean;
  id?: string;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  children,
  className,
  showClose = true,
  id
}) => {
  const generatedId = useId();
  const { state } = useGlobalState();
  const isMobile = state.viewport.isMobile;
  const finalId = id || `bottom-sheet-${generatedId.replace(/:/g, '')}`;
  const sheetRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            id={`${finalId}-backdrop`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-Black opacity-OpacitySubtle z-ZModal backdrop-blur-sm"
          />

          {/* Sheet */}
          <motion.div
            ref={sheetRef}
            id={finalId}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={cn(
              "fixed bottom-0 left-0 right-0 z-ZModal bg-ColorBg rounded-t-RadiusLarge shadow-ElevationHigh flex flex-col max-h-full transition-transform",
              isMobile ? "" : "max-w-ContainerSm mx-auto",
              className
            )}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? `${finalId}-title` : undefined}
          >
            {/* Header / Handle */}
            <div id={`${finalId}-header`} className={cn("flex flex-col items-center pt-SpacingTiny pb-SpacingSmall border-b border-ColorSidebarBorder/OpacityMuted", isMobile ? "px-SpacingBase" : "px-SpacingLarge")}>
              <div id={`${finalId}-handle`} className="w-SpacingLarge h-SpacingNano bg-ColorSidebarBorder/OpacitySubtle rounded-RadiusFull mb-SpacingSmall cursor-grab active:cursor-grabbing" />
              
              <div className="w-full flex items-center justify-between">
                {title && (
                  <h3 id={`${finalId}-title`} className="text-FontSizeBase font-bold text-TextColorBase">
                    {title}
                  </h3>
                )}
                {showClose && (
                  <button
                    id={`${finalId}-close`}
                    onClick={onClose}
                    aria-label="Close"
                    className="p-SpacingTiny -mr-SpacingTiny rounded-RadiusFull hover:bg-ColorSidebarAccent text-TextColorMuted transition-colors"
                  >
                    <X size="1.25rem" />
                  </button>
                )}
              </div>
            </div>

            {/* Content */}
            <div id={`${finalId}-content`} className={cn("flex-1 overflow-y-auto custom-scrollbar", isMobile ? "p-SpacingBase" : "p-SpacingLarge")}>
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
