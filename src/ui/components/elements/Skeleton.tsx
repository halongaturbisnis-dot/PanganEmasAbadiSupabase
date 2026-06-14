import React from 'react';
import { cn } from '../../../logic/utils/cn';

interface SkeletonProps {
  className?: string;
  variant?: 'rectangle' | 'circle';
  animation?: 'pulse' | 'wave' | 'none';
}

export const Skeleton: React.FC<SkeletonProps & { id?: string }> = ({
  className,
  variant = 'rectangle',
  animation = 'pulse',
  id = "skeleton"
}) => {
  return (
    <div
      id={id}
      className={cn(
        "bg-ColorSidebarBorder/opacity-OpacitySubtle",
        variant === 'circle' ? "rounded-RadiusFull" : "rounded-RadiusSmall",
        animation === 'pulse' && "animate-pulse",
        animation === 'wave' && "animate-pulse",
        className
      )}
    />
  );
};
