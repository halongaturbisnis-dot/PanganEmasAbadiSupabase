import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../../../logic/utils/cn';

export interface ToggleOption {
  label: string;
  value: string;
}

export interface ToggleButtonProps {
  options: [ToggleOption, ToggleOption];
  value: string;
  onChange: (value: string) => void;
  id?: string;
  className?: string;
  labelClassName?: string;
  disabled?: boolean;
}

export const ToggleButton: React.FC<ToggleButtonProps> = ({
  options,
  value,
  onChange,
  id = "toggle-button",
  className,
  labelClassName,
  disabled
}) => {
  const activeIndex = options.findIndex(opt => opt.value === value);

  return (
    <div 
      id={id}
      className={cn(
        "relative flex h-SpacingMedium w-full bg-Black/5 rounded-RadiusMedium p-SpacingNano cursor-pointer select-none border border-ColorSidebarBorder/10",
        disabled && "cursor-not-allowed opacity-80 pointer-events-none",
        className
      )}
    >
      {/* Active Indicator Background */}
      <motion.div
        id={`${id}-indicator`}
        className={cn(
          "absolute top-SpacingNano bottom-SpacingNano left-SpacingNano rounded-RadiusMedium shadow-ElevationLow z-ZFlat",
          disabled ? "bg-gray-400" : "bg-ColorPrimary"
        )}
        initial={false}
        animate={{
          x: activeIndex === 0 ? '0%' : '100%',
          width: 'calc(50% - 0.25rem)' // Adjusting for padding
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      />

      {options.map((option) => (
        <div
          key={option.value}
          id={`${id}-option-${option.value}`}
          onClick={() => !disabled && onChange(option.value)}
          className={cn(
            "relative flex-1 flex items-center justify-center text-FontSizeXs font-normal z-ZRaised transition-colors duration-DurationMid",
            labelClassName,
            value === option.value 
              ? (disabled ? "text-White" : "text-White") 
              : "text-TextColorMuted hover:text-TextColorBase"
          )}
        >
          {option.label}
        </div>
      ))}
    </div>
  );
};
