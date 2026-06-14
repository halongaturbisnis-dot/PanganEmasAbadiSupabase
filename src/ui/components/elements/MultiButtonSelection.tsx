import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '../../../logic/utils/cn';

interface Option {
  label: string;
  value: string | number;
}

interface MultiButtonSelectionProps {
  id?: string;
  options: Option[];
  value: (string | number)[];
  onChange: (value: (string | number)[]) => void;
  className?: string;
}

export const MultiButtonSelection: React.FC<MultiButtonSelectionProps> = ({
  id,
  options,
  value,
  onChange,
  className
}) => {
  const toggleOption = (val: string | number) => {
    if (value.includes(val)) {
      onChange(value.filter(item => item !== val));
    } else {
      onChange([...value, val]);
    }
  };

  return (
    <div id={id} className={cn("flex flex-wrap gap-SpacingTiny", className)}>
      {options.map((opt) => {
        const isSelected = value.includes(opt.value);
        return (
          <button
            key={opt.value}
            id={`${id}-opt-${opt.value}`}
            type="button"
            onClick={() => toggleOption(opt.value)}
            className={cn(
              "flex items-center gap-SpacingNano px-SpacingSmall py-SpacingTiny rounded-RadiusMedium border transition-all cursor-pointer font-semibold text-FontSizeXs group",
              isSelected 
                ? "bg-ColorPrimary border-ColorPrimary text-White shadow-ElevationSm" 
                : "bg-transparent border-ColorPrimary text-ColorPrimary hover:bg-ColorPrimary/5"
            )}
          >
            {isSelected && <Check size={14} className="shrink-0" />}
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
};
