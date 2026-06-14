import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../../../logic/utils/cn';
import { useGlobalState } from '../../../logic/context/GlobalContext';

export interface GridMenuItem {
  id: string | number;
  label: string;
  icon: React.ReactNode;
  onClick?: () => void;
  color?: string;
  badge?: string | number;
}

interface GridMenuProps {
  items: GridMenuItem[];
  columns?: 2 | 3 | 4 | 5;
  className?: string;
  id?: string;
}

export const GridMenu: React.FC<GridMenuProps> = ({ 
  items, 
  columns = 4, 
  className,
  id = "grid-menu"
}) => {
  const { state } = useGlobalState();
  const isMobile = state.viewport.isMobile;

  const gridCols = isMobile ? {
    2: 'grid-cols-2',
    3: 'grid-cols-2',
    4: 'grid-cols-3',
    5: 'grid-cols-3',
  } : {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
  };

  return (
    <div id={id} className={cn("grid", isMobile ? "gap-SpacingMedium" : "gap-SpacingLarge", gridCols[columns], className)}>
      {items.map((item) => (
        <motion.button
          key={item.id}
          id={`${id}-item-${item.id}`}
          whileHover={{ y: -4 }}
          whileTap={{ scale: 0.96 }}
          onClick={item.onClick}
          className="flex flex-col items-center gap-SpacingTiny group text-center"
        >
          <div 
             id={`${id}-item-${item.id}-icon-wrapper`}
             className={cn(
               "relative flex items-center justify-center rounded-RadiusLarge bg-ColorBg border border-ColorSidebarBorder/opacity-OpacityMuted shadow-ElevationSm group-hover:shadow-ElevationNormal group-hover:border-ColorPrimary/opacity-OpacitySubtle transition-all duration-DurationMid overflow-hidden",
               isMobile ? "w-spacing-SpacingLarge h-spacing-SpacingLarge" : "w-16 h-16"
             )}
          >
            {/* Background Accent */}
            <div id={`${id}-item-${item.id}-accent`} className={cn(
              "absolute inset-0 opacity-0 group-hover:opacity-opacity-OpacitySubtle transition-opacity duration-DurationMid",
              item.color || "bg-ColorPrimary"
            )} />
            
            <div id={`${id}-item-${item.id}-icon`} className={cn(
              "relative z-ZRaised transition-transform duration-DurationMid group-hover:scale-110",
              item.color ? `text-${item.color.replace('bg-', '')}` : "text-ColorPrimary"
            )}>
              {item.icon}
            </div>

            {/* Badge */}
            {item.badge !== undefined && (
              <div id={`${id}-item-${item.id}-badge`} className="absolute top-SpacingNano right-SpacingNano px-SpacingTiny py-SpacingNano rounded-RadiusFull bg-FeedbackColorError text-White text-FontSizeNano font-bold min-w-5 shadow-ElevationSm">
                {item.badge}
              </div>
            )}
          </div>
          
          <span id={`${id}-item-${item.id}-label`} className={cn("font-medium text-TextColorBase group-hover:text-ColorPrimary transition-colors line-clamp-2 px-SpacingNano leading-LineHeightTight", isMobile ? "text-FontSizeXs" : "text-FontSizeSm")}>
            {item.label}
          </span>
        </motion.button>
      ))}
    </div>
  );
};
