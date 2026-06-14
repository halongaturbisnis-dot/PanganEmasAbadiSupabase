import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../../logic/utils/cn';
import { useGlobalState } from '../../../logic/context/GlobalContext';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  delay?: number;
  direction?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  id?: string;
  trigger?: 'hover' | 'click';
}

export const Tooltip: React.FC<TooltipProps> = ({ 
  content, 
  children, 
  delay = 0.2, 
  direction = 'top',
  className,
  id = "tooltip",
  trigger = 'hover'
}) => {
  const { state } = useGlobalState();
  const isMobile = state.viewport.isMobile;
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  let timeout: ReturnType<typeof setTimeout>;

  React.useEffect(() => {
    if (trigger === 'click' && isVisible) {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsVisible(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isVisible, trigger]);

  // Tooltips are often problematic on touch devices, so we can tune behavior
  const showTip = () => {
    if (isMobile || trigger === 'click') return;
    timeout = setTimeout(() => {
      setIsVisible(true);
    }, delay * 1000);
  };

  const hideTip = () => {
    if (timeout) clearTimeout(timeout);
    if (trigger !== 'click') setIsVisible(false);
  };

  const toggleTip = () => {
    if (trigger === 'click') {
      setIsVisible(!isVisible);
    }
  };

  const getPositionClasses = () => {
    switch (direction) {
      case 'bottom': return 'top-full left-1/2 -translate-x-1/2 mt-SpacingTiny';
      case 'left': return 'right-full top-1/2 -translate-y-1/2 mr-SpacingTiny';
      case 'right': return 'left-full top-1/2 -translate-y-1/2 ml-SpacingTiny';
      case 'top': 
      default: return 'bottom-full left-1/2 -translate-x-1/2 mb-SpacingTiny';
    }
  };

  return (
    <div 
      ref={containerRef}
      id={id}
      className="relative inline-block"
      onMouseEnter={showTip}
      onMouseLeave={hideTip}
      onClick={toggleTip}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            id={`${id}-content`}
            initial={{ opacity: 0, y: direction === 'bottom' ? -4 : direction === 'top' ? 4 : 0, x: direction === 'left' ? 4 : direction === 'right' ? -4 : 0, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={cn(
              "absolute z-ZTooltip px-SpacingSmall py-SpacingTiny text-FontSizeNano font-bold text-White bg-TextColorBase rounded-RadiusSmall shadow-ElevationHigh w-max whitespace-normal break-words text-center",
              trigger === 'hover' ? "pointer-events-none" : "pointer-events-auto",
              isMobile ? "max-w-ContainerXs" : "max-w-ContainerSm",
              getPositionClasses(),
              className
            )}
          >
            {content}
            <div 
              id={`${id}-arrow`}
              className={cn(
                "absolute w-SpacingTiny h-SpacingTiny bg-TextColorBase rotate-45",
                direction === 'top' ? "-bottom-SpacingNano left-1/2 -translate-x-1/2" : "",
                direction === 'bottom' ? "-top-SpacingNano left-1/2 -translate-x-1/2" : "",
                direction === 'left' ? "-right-SpacingNano top-1/2 -translate-y-1/2" : "",
                direction === 'right' ? "-left-SpacingNano top-1/2 -translate-y-1/2" : ""
              )} 
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
