import React, { useState, useId } from 'react';
import { cn } from '../../../logic/utils/cn';
import { useGlobalState } from '../../../logic/context/GlobalContext';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AccordionProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

/**
 * Accordion Component
 * Integrated with tokens.ts, global.css, and responsive viewport standards.
 */
export const Accordion = React.forwardRef<HTMLDivElement, AccordionProps>(
  ({ className, children, id, ...props }, ref) => {
    const generatedId = useId();
    const finalId = id || `accordion-${generatedId.replace(/:/g, '')}`;

    return (
      <div 
        ref={ref} 
        id={finalId}
        className={cn("w-full space-y-SpacingSmall", className)} 
        {...props}
      >
        {children}
      </div>
    );
  }
);
Accordion.displayName = "Accordion";

interface AccordionItemProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  isOpen?: boolean;
  onToggle?: () => void;
}

export const AccordionItem = React.forwardRef<HTMLDivElement, AccordionItemProps>(
  ({ className, title, children, isOpen: propIsOpen, onToggle, id, ...props }, ref) => {
    const [internalIsOpen, setInternalIsOpen] = useState(false);
    const { state } = useGlobalState();
    const isMobile = state.viewport.isMobile;
    const generatedId = useId();
    
    const isControlled = propIsOpen !== undefined;
    const isOpen = isControlled ? propIsOpen : internalIsOpen;
    
    const toggle = () => {
      if (onToggle) onToggle();
      if (!isControlled) setInternalIsOpen(!internalIsOpen);
    };

    const itemId = id || `accordion-item-${generatedId.replace(/:/g, '')}`;

    return (
      <div
        ref={ref}
        id={itemId}
        className={cn(
          "border border-ColorSidebarBorder/OpacitySubtle rounded-RadiusSmall bg-ColorBg overflow-hidden transition-all",
          className
        )}
        {...props}
      >
        <button
          id={`${itemId}-trigger`}
          type="button"
          onClick={toggle}
          aria-expanded={isOpen}
          aria-controls={`${itemId}-content`}
          className={cn("flex w-full items-center justify-between text-left focus:outline-none focus:bg-ColorSidebarAccent hover:bg-ColorSidebarAccent transition-colors", isMobile ? "p-SpacingBase" : "p-SpacingMedium")}
        >
          <span className="font-medium text-TextColorBase">{title}</span>
          <ChevronDown
            className={cn(
              "h-SpacingBase w-SpacingBase text-TextColorMuted transition-transform duration-DurationFast",
              isOpen && "transform rotate-180"
            )}
          />
        </button>
        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              id={`${itemId}-content`}
              role="region"
              aria-labelledby={`${itemId}-trigger`}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className={cn("pt-0 text-TextColorBase text-FontSizeSm border-t border-ColorSidebarBorder/OpacityMuted mt-SpacingTiny", isMobile ? "p-SpacingBase" : "p-SpacingMedium")}>
                {children}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
);
AccordionItem.displayName = "AccordionItem";
