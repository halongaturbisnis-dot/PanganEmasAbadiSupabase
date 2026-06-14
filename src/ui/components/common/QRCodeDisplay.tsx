import React, { ComponentProps } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { cn } from '../../../logic/utils/cn';

interface QRCodeDisplayProps extends Omit<ComponentProps<typeof QRCodeSVG>, 'value'> {
  value: string;
  size?: number;
  className?: string;
  containerClassName?: string;
  id?: string;
}

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  value,
  size = 128,
  className,
  containerClassName,
  id = "qr-code-display",
  ...props
}) => {
  return (
    <div 
      id={id} 
      className={cn(
        "inline-flex items-center justify-center p-SpacingSmall bg-White rounded-RadiusLarge border border-ColorSidebarBorder/opacity-OpacitySubtle shadow-ElevationLow hover:shadow-ElevationMid transition-all duration-DurationMid animate-in fade-in zoom-in-layout-TransformShort", 
        containerClassName
      )}
    >
      <QRCodeSVG
        id={`${id}-svg`}
        value={value}
        size={size}
        className={cn("w-full h-full drop-shadow-sm", className)}
        {...props}
      />
    </div>
  );
};
