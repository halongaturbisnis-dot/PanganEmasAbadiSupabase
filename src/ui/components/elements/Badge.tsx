import React from 'react';
import { cn } from '../../../logic/utils/cn';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'outline';
  size?: 'default' | 'sm';
}

export const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const variantClasses = {
      default: "bg-ColorPrimary text-White hover:opacity-OpacityOpaque shadow-ElevationLow active:scale-TransformShrink",
      success: "bg-FeedbackColorSuccess/opacity-OpacitySubtle text-FeedbackColorSuccess border border-FeedbackColorSuccess/opacity-OpacityMuted",
      warning: "bg-FeedbackColorWarning/opacity-OpacitySubtle text-FeedbackColorWarning border border-FeedbackColorWarning/opacity-OpacityMuted",
      error: "bg-FeedbackColorError/opacity-OpacitySubtle text-FeedbackColorError border border-FeedbackColorError/opacity-OpacityMuted",
      info: "bg-FeedbackColorInfo/opacity-OpacitySubtle text-FeedbackColorInfo border border-FeedbackColorInfo/opacity-OpacityMuted",
      outline: "border border-ColorSidebarBorder/opacity-OpacitySubtle text-TextColorMuted hover:text-TextColorBase hover:bg-ColorBgSecondary",
    };

    const sizeClasses = {
      default: "px-SpacingSmall py-SpacingNano text-FontSizeXs leading-LineHeightTight",
      sm: "px-SpacingTiny py-SpacingNano text-FontSizeNano leading-none",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center rounded-RadiusFull font-bold transition-all duration-DurationFast focus:outline-none focus:ring-2 focus:ring-ColorPrimary/opacity-OpacitySubtle",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      />
    );
  }
);
Badge.displayName = "Badge";
