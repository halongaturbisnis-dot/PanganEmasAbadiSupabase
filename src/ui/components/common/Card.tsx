import React, { useId } from 'react';
import { cn } from '../../../logic/utils/cn';
import { useGlobalState } from '../../../logic/context/GlobalContext';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

/**
 * Card Component
 * Integrated with tokens.ts, global.css, and responsive viewport standards.
 */
export const Card = React.forwardRef<HTMLDivElement, CardProps & { id?: string }>(
  ({ className, id, ...props }, ref) => {
    const generatedId = useId();
    const finalId = id || `card-${generatedId.replace(/:/g, '')}`;

    return (
      <div
        ref={ref}
        id={finalId}
        className={cn(
          "rounded-RadiusLarge bg-ColorBg text-TextColorBase shadow-ElevationNormal transition-all duration-DurationFast hover:shadow-ElevationHigh",
          className
        )}
        {...props}
      />
    );
  }
);
Card.displayName = "Card";

export const CardHeader = React.forwardRef<HTMLDivElement, CardProps & { id?: string }>(
  ({ className, id, ...props }, ref) => {
    const generatedId = useId();
    const { state } = useGlobalState();
    const isMobile = state.viewport.isMobile;
    const finalId = id || `card-header-${generatedId.replace(/:/g, '')}`;

    return (
      <div
        ref={ref}
        id={finalId}
        className={cn("flex flex-col space-y-SpacingNano", isMobile ? "p-SpacingBase" : "p-SpacingMedium", className)}
        {...props}
      />
    );
  }
);
CardHeader.displayName = "CardHeader";

export const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement> & { id?: string }>(
  ({ className, id, ...props }, ref) => {
    const generatedId = useId();
    const finalId = id || `card-title-${generatedId.replace(/:/g, '')}`;

    return (
      <h3
        ref={ref}
        id={finalId}
        className={cn(
          "text-FontSizeH4 font-semibold leading-none tracking-tight text-TextColorBase",
          className
        )}
        {...props}
      />
    );
  }
);
CardTitle.displayName = "CardTitle";

export const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement> & { id?: string }>(
  ({ className, id, ...props }, ref) => {
    const generatedId = useId();
    const finalId = id || `card-desc-${generatedId.replace(/:/g, '')}`;

    return (
      <p
        ref={ref}
        id={finalId}
        className={cn("text-FontSizeSm text-TextColorBase opacity-80", className)}
        {...props}
      />
    );
  }
);
CardDescription.displayName = "CardDescription";

export const CardContent = React.forwardRef<HTMLDivElement, CardProps & { id?: string }>(
  ({ className, id, ...props }, ref) => {
    const generatedId = useId();
    const { state } = useGlobalState();
    const isMobile = state.viewport.isMobile;
    const finalId = id || `card-content-${generatedId.replace(/:/g, '')}`;

    return (
      <div ref={ref} id={finalId} className={cn("pt-0", isMobile ? "p-SpacingBase" : "p-SpacingMedium", className)} {...props} />
    );
  }
);
CardContent.displayName = "CardContent";

export const CardFooter = React.forwardRef<HTMLDivElement, CardProps & { id?: string }>(
  ({ className, id, ...props }, ref) => {
    const generatedId = useId();
    const { state } = useGlobalState();
    const isMobile = state.viewport.isMobile;
    const finalId = id || `card-footer-${generatedId.replace(/:/g, '')}`;

    return (
      <div
        ref={ref}
        id={finalId}
        className={cn("flex items-center pt-0", isMobile ? "p-SpacingBase" : "p-SpacingMedium", className)}
        {...props}
      />
    );
  }
);
CardFooter.displayName = "CardFooter";
