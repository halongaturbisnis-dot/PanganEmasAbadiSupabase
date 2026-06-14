import React, { useState } from 'react';
import { cn } from '../../../logic/utils/cn';
import { TextInput } from './Inputs';
import { useGlobalState } from '../../../logic/context/GlobalContext';

export const ColorPickerInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, value, onChange, id = "color-picker", ...props }, ref) => {
  const { state } = useGlobalState();
  const theme = state.theme;
  const isMobile = state.viewport.isMobile;
  const [color, setColor] = useState(value as string || (theme === 'dark' ? '#ffffff' : '#000000'));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setColor(e.target.value);
    if (onChange) onChange(e);
  };

  return (
    <div id={`${id}-container`} className={cn("flex items-center gap-SpacingTiny w-full animate-in fade-in duration-DurationMid", className)}>
      <div id={`${id}-preview-wrapper`} className="relative w-spacing-SpacingHuge h-spacing-SpacingHuge rounded-RadiusSmall overflow-hidden border border-ColorSidebarBorder/opacity-OpacityMuted shadow-ElevationLow shrink-0 transition-transform active:scale-TransformShrink">
        <input 
          id={`${id}-input`}
          type="color" 
          value={color} 
          onChange={handleChange} 
          className="absolute -top-spacing-SpacingSmall -left-spacing-SpacingSmall w-spacing-SpacingExtraHuge h-spacing-SpacingExtraHuge cursor-pointer bg-transparent border-none appearance-none"
        />
      </div>
      <TextInput 
        id={`${id}-text`}
        ref={ref}
        value={color}
        onChange={handleChange}
        placeholder="Pilih atau Ketik Kode Warna"
        className={cn("uppercase font-mono flex-1", isMobile ? "text-FontSizeNano" : "text-FontSizeSm")}
        {...props}
      />
    </div>
  );
});
ColorPickerInput.displayName = "ColorPickerInput";
