import React from 'react';
import { cn } from '../../../logic/utils/cn';
import { useGlobalState } from '../../../logic/context/GlobalContext';
import { DangerButton, SecondaryButton } from './Button'; 

type BulkButtonProps = {
  type: 'delete' | 'download';
  onClick: () => void;
  count: number;
  className?: string;
  id?: string;
};

export const BulkButton: React.FC<BulkButtonProps> = ({ type, onClick, count, className, id }) => {
  const { isMobile } = useGlobalState();
  
  const baseClasses = cn(
    "h-spacing-SpacingHuge !rounded-RadiusMedium px-SpacingSmall flex items-center justify-center gap-SpacingTiny shadow-ElevationMid transition-all",
    isMobile ? "w-full" : "min-w-spacing-SpacingMega",
    className
  );

  if (type === 'delete') {
    return (
      <DangerButton 
        id={id}
        onClick={onClick}
        className={cn(baseClasses, "shadow-FeedbackColorError/opacity-OpacitySubtle")}
      >
        <span className="lucide-icon text-white"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg></span>
        <span className="text-FontSizeSm font-medium">Hapus ({count})</span>
      </DangerButton>
    );
  }

  // Add download variant here in the future
  return null;
};
