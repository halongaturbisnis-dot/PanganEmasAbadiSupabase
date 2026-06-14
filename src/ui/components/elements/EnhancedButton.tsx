import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../../../logic/utils/cn';

interface EnhancedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const EnhancedButton: React.FC<EnhancedButtonProps & { id?: string }> = ({
  variant = 'primary',
  size = 'md',
  className,
  children,
  id = "enhanced-button",
  ...props
}) => {
  const variants = {
    primary: "bg-ColorPrimary text-White shadow-ElevationMid hover:shadow-ElevationHigh",
    secondary: "bg-ColorSecondary text-White shadow-ElevationMid hover:shadow-ElevationHigh",
    outline: "border-2 border-ColorPrimary text-ColorPrimary bg-transparent hover:bg-ColorPrimary/opacity-OpacitySubtle",
    ghost: "text-TextColorMuted hover:text-ColorPrimary hover:bg-ColorPrimary/opacity-OpacitySubtle"
  };

  const sizes = {
    sm: "px-SpacingSmall py-SpacingTiny text-FontSizeXs font-bold",
    md: "px-SpacingBase py-SpacingSmall text-FontSizeSm font-extrabold",
    lg: "px-SpacingLarge py-SpacingBase text-FontSizeBase font-black"
  };

  return (
    <motion.button
      id={id}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98, y: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className={cn(
        "relative inline-flex items-center justify-center rounded-RadiusMedium transition-all cursor-pointer",
        variants[variant],
        sizes[size],
        className
      )}
      {...props as any}
    >
      <span id={`${id}-content`} className="relative z-ZAbove">
        {children}
      </span>
    </motion.button>
  );
};
