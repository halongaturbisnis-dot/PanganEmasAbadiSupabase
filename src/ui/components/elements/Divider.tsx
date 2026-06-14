import React from 'react';
import { cn } from '../../../logic/utils/cn';

interface DividerProps extends React.HTMLAttributes<HTMLHRElement> {
  orientation?: 'horizontal' | 'vertical';
}

export const Divider = React.forwardRef<HTMLHRElement, DividerProps>(
  ({ className, orientation = 'horizontal', id = "divider", ...props }, ref) => {
    return (
      <hr
        ref={ref}
        id={id}
        className={cn(
          "shrink-0 bg-ColorSidebarBorder/opacity-OpacitySubtle border-none",
          orientation === 'horizontal' ? "h-spacing-SpacingNano w-full my-SpacingMedium" : "h-full w-spacing-SpacingNano mx-SpacingMedium",
          className
        )}
        {...props}
      />
    );
  }
);
Divider.displayName = "Divider";
