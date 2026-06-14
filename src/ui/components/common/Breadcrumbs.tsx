import React, { useId } from 'react';
import { cn } from '../../../logic/utils/cn';
import { ChevronRight } from 'lucide-react';

interface BreadcrumbsProps extends React.HTMLAttributes<HTMLElement> {
  separator?: React.ReactNode;
  id?: string;
}

/**
 * Breadcrumbs Component
 * Integrated with tokens.ts and global.css standards.
 */
export const Breadcrumbs = React.forwardRef<HTMLElement, BreadcrumbsProps>(
  ({ className, separator = <ChevronRight className="h-SpacingBase w-SpacingBase" />, children, id, ...props }, ref) => {
    const generatedId = useId();
    const finalId = id || `breadcrumbs-${generatedId.replace(/:/g, '')}`;
    const items = React.Children.toArray(children);

    return (
      <nav
        ref={ref}
        id={finalId}
        aria-label="Breadcrumb"
        className={cn("flex items-center flex-wrap gap-y-SpacingTiny", className)}
        {...props}
      >
        <ol id={`${finalId}-list`} className="flex items-center space-x-SpacingNano text-FontSizeSm text-TextColorMuted">
          {items.map((child, index) => (
            <li key={index} id={`${finalId}-item-${index}`} className="flex items-center">
              {child}
              {index < items.length - 1 && (
                <span className="mx-SpacingTiny opacity-OpacitySubtle flex items-center">
                  {separator}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    );
  }
);
Breadcrumbs.displayName = "Breadcrumbs";

export const BreadcrumbItem = React.forwardRef<
  HTMLLIElement,
  React.LiHTMLAttributes<HTMLLIElement> & { isCurrentPage?: boolean, id?: string }
>(({ className, isCurrentPage, id, ...props }, ref) => (
  <span
    ref={ref}
    id={id}
    aria-current={isCurrentPage ? "page" : undefined}
    className={cn(
      "inline-flex items-center font-medium",
      isCurrentPage ? "text-TextColorBase" : "hover:text-TextColorBase transition-colors",
      className
    )}
    {...props}
  />
));
BreadcrumbItem.displayName = "BreadcrumbItem";

export const BreadcrumbLink = React.forwardRef<
  HTMLAnchorElement,
  React.AnchorHTMLAttributes<HTMLAnchorElement> & { id?: string }
>(({ className, id, ...props }, ref) => (
  <a
    ref={ref}
    id={id}
    className={cn("hover:underline underline-offset-4 focus:outline-none focus:ring-2 focus:ring-ColorPrimary/OpacitySubtle rounded-RadiusSmall", className)}
    {...props}
  />
));
BreadcrumbLink.displayName = "BreadcrumbLink";
