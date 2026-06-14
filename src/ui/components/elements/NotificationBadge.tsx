import React from 'react';
import { cn } from '../../../logic/utils/cn';

interface NotificationBadgeProps {
  count: number;
  className?: string;
  id?: string;
}

/**
 * Element component for red circle notification badge
 * Commonly used in Tabs or Icons to show pending task counts.
 */
export const NotificationBadge: React.FC<NotificationBadgeProps> = ({ count, className, id }) => {
  if (count <= 0) return null;

  return (
    <span 
      id={id}
      className={cn(
        "flex items-center justify-center min-w-[1.25rem] h-5 px-1 bg-FeedbackColorError text-white text-[0.625rem] font-bold rounded-full border border-white shadow-sm",
        className
      )}
    >
      {count}
    </span>
  );
};

export default NotificationBadge;
