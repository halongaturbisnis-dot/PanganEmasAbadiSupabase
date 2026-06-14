import React, { useId } from 'react';
import Barcode from 'react-barcode';
import { cn } from '../../../logic/utils/cn';
import { useGlobalState } from '../../../logic/context/GlobalContext';

interface BarcodeDisplayProps {
  value: string;
  format?: 'CODE128' | 'EAN13' | 'UPC' | 'CODE39';
  width?: number;
  height?: number;
  displayValue?: boolean;
  lineColor?: string;
  background?: string;
  className?: string;
  containerClassName?: string;
  id?: string;
}

/**
 * BarcodeDisplay Component
 * Perfectly integrated with tokens.ts and global.css standards.
 */
export const BarcodeDisplay: React.FC<BarcodeDisplayProps> = ({
  value,
  format = 'CODE128',
  width = 2,
  height = 100,
  displayValue = true,
  lineColor,
  background,
  className,
  containerClassName,
  id,
}) => {
  const generatedId = useId();
  const { state } = useGlobalState();
  const isMobile = state.viewport.isMobile;
  const finalId = id || `barcode-${generatedId.replace(/:/g, '')}`;
  
  return (
    <div 
      className={cn(
        "inline-flex items-center justify-center bg-ColorBg rounded-RadiusMedium border border-ColorSidebarBorder/OpacitySubtle shadow-ElevationLow text-TextColorBase transition-all hover:shadow-ElevationNormal",
        isMobile ? "p-SpacingTiny" : "p-SpacingSmall",
        className,
        containerClassName
      )}
      aria-label={`Barcode: ${value}`}
      id={finalId}
    >
      <Barcode
        value={value}
        format={format}
        width={width}
        height={height}
        displayValue={displayValue}
        lineColor={lineColor || "currentColor"}
        background={background || "transparent"}
      />
    </div>
  );
};
