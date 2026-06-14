import React from 'react';
import { cn } from '../../../logic/utils/cn';
import { useGlobalState } from '../../../logic/context/GlobalContext';

interface ListFeedProps extends React.HTMLAttributes<HTMLUListElement> {
  className?: string;
  id?: string;
}

export const ListFeed = React.forwardRef<HTMLUListElement, ListFeedProps>(
  ({ className, id = "list-feed", ...props }, ref) => (
    <ul
      ref={ref}
      id={id}
      className={cn("flex flex-col space-y-SpacingSmall animate-in fade-in duration-DurationMid", className)}
      {...props}
    />
  )
);
ListFeed.displayName = "ListFeed";

interface ListFeedItemProps extends React.HTMLAttributes<HTMLLIElement> {
  className?: string;
  id?: string;
}

export const ListFeedItem = React.forwardRef<HTMLLIElement, ListFeedItemProps>(
  ({ className, children, id, ...props }, ref) => (
    <li
      ref={ref}
      id={id || "list-feed-item"}
      className={cn(
        "flex gap-SpacingMedium p-SpacingMedium rounded-RadiusSmall border border-ColorSidebarBorder/opacity-OpacitySubtle bg-ColorBg shadow-ElevationLow hover:shadow-ElevationNormal transition-all duration-DurationFast items-start",
        className
      )}
      {...props}
    >
      {children}
    </li>
  )
);
ListFeedItem.displayName = "ListFeedItem";

export const ListFeedAvatar = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { id?: string }>(
  ({ className, children, id, ...props }, ref) => (
    <div
      ref={ref}
      id={id || "list-feed-avatar"}
      className={cn(
        "w-10 h-10 shrink-0 rounded-RadiusFull bg-ColorPrimary/opacity-OpacityMuted flex items-center justify-center text-ColorPrimary font-semibold shadow-ElevationLow",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);
ListFeedAvatar.displayName = "ListFeedAvatar";

export const ListFeedContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { id?: string }>(
  ({ className, children, id, ...props }, ref) => (
    <div ref={ref} id={id || "list-feed-content"} className={cn("flex flex-col flex-1 min-w-0 transition-opacity", className)} {...props}>
      {children}
    </div>
  )
);
ListFeedContent.displayName = "ListFeedContent";
