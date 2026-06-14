import React, { useId } from 'react';
import { cn } from '../../../logic/utils/cn';
import { useGlobalState } from '../../../logic/context/GlobalContext';

interface DeckProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  orientation?: 'horizontal' | 'vertical';
  children: React.ReactNode;
  id?: string;
}

/**
 * Deck Component
 * A flexible container for grouped elements with responsive layout support.
 * Integrated with tokens.ts and global.css standards.
 */
export const Deck = React.forwardRef<HTMLDivElement, DeckProps>(
  ({ className, orientation = 'horizontal', children, id, ...props }, ref) => {
    const generatedId = useId();
    const { state } = useGlobalState();
    const isMobile = state.viewport.isMobile;
    const finalId = id || `deck-${generatedId.replace(/:/g, '')}`;

    return (
      <div
        ref={ref}
        id={finalId}
        className={cn(
          "flex flex-col gap-SpacingMedium rounded-RadiusSmall bg-ColorBg border border-ColorSidebarBorder/OpacitySubtle w-full overflow-hidden shadow-ElevationLow transition-shadow hover:shadow-ElevationNormal",
          isMobile ? "p-SpacingBase" : "p-SpacingMedium",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Deck.displayName = "Deck";

export const DeckHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { id?: string }>(
  ({ className, id, ...props }, ref) => {
    const generatedId = useId();
    const finalId = id || `deck-header-${generatedId.replace(/:/g, '')}`;

    return (
      <div
        ref={ref}
        id={finalId}
        className={cn("flex items-center justify-between border-b border-ColorSidebarBorder/OpacityMuted pb-SpacingSmall", className)}
        {...props}
      />
    );
  }
);
DeckHeader.displayName = "DeckHeader";

export const DeckTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement> & { id?: string }>(
  ({ className, id, ...props }, ref) => {
    const generatedId = useId();
    const finalId = id || `deck-title-${generatedId.replace(/:/g, '')}`;

    return (
      <h2
        ref={ref}
        id={finalId}
        className={cn("text-FontSizeH3 font-bold text-TextColorBase", className)}
        {...props}
      />
    );
  }
);
DeckTitle.displayName = "DeckTitle";

interface DeckContentProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical';
  id?: string;
}

export const DeckContent = React.forwardRef<HTMLDivElement, DeckContentProps>(
  ({ className, orientation = 'horizontal', id, ...props }, ref) => {
    const generatedId = useId();
    const { state } = useGlobalState();
    const isMobile = state.viewport.isMobile;
    const finalId = id || `deck-content-${generatedId.replace(/:/g, '')}`;

    return (
      <div
        ref={ref}
        id={finalId}
        className={cn(
          "flex overflow-auto custom-scrollbar py-SpacingTiny",
          isMobile ? "gap-SpacingBase" : "gap-SpacingMedium",
          orientation === 'horizontal' ? isMobile ? "flex-wrap overflow-x-auto" : "flex-nowrap overflow-x-auto" : "flex-col overflow-y-auto max-h-ContainerSm",
          className
        )}
        {...props}
      />
    );
  }
);
DeckContent.displayName = "DeckContent";
