import React from 'react';
import { cn } from '../../../logic/utils/cn';
import { baseInputClass } from './Inputs';
import { useGlobalState } from '../../../logic/context/GlobalContext';

export const DateInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, id = "date-input", ...props }, ref) => {
  const { state } = useGlobalState();
  const isMobile = state.viewport.isMobile;
  return (
    <input 
      id={id}
      ref={ref} 
      type="date" 
      onClick={(e) => (e.currentTarget as any).showPicker?.()}
      onFocus={(e) => (e.currentTarget as any).showPicker?.()}
      className={cn(
        baseInputClass, 
        isMobile ? "text-FontSizeXs" : "text-FontSizeSm",
        "w-full text-left relative animate-in fade-in duration-DurationMid cursor-pointer focus:ring-2 focus:ring-ColorPrimary/opacity-OpacitySubtle shadow-ElevationLow hover:shadow-ElevationMid transition-all", 
        className
      )} 
      {...props} 
    />
  );
});
DateInput.displayName = "DateInput";

export const TimeInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, id = "time-input", ...props }, ref) => {
  const { state } = useGlobalState();
  const isMobile = state.viewport.isMobile;
  return (
    <input 
      id={id}
      ref={ref} 
      type="time" 
      onClick={(e) => (e.currentTarget as any).showPicker?.()}
      onFocus={(e) => (e.currentTarget as any).showPicker?.()}
      className={cn(
        baseInputClass, 
        isMobile ? "text-FontSizeXs" : "text-FontSizeSm",
        "w-full text-left relative animate-in fade-in duration-DurationMid cursor-pointer focus:ring-2 focus:ring-ColorPrimary/opacity-OpacitySubtle shadow-ElevationLow hover:shadow-ElevationMid transition-all", 
        className
      )} 
      {...props} 
    />
  );
});
TimeInput.displayName = "TimeInput";

export const DateTimeInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, id = "datetime-input", ...props }, ref) => {
  const { state } = useGlobalState();
  const isMobile = state.viewport.isMobile;
  return (
    <input 
      id={id}
      ref={ref} 
      type="datetime-local" 
      onClick={(e) => (e.currentTarget as any).showPicker?.()}
      onFocus={(e) => (e.currentTarget as any).showPicker?.()}
      className={cn(
        baseInputClass, 
        isMobile ? "text-FontSizeXs" : "text-FontSizeSm",
        "w-full text-left relative animate-in fade-in duration-DurationMid cursor-pointer focus:ring-2 focus:ring-ColorPrimary/opacity-OpacitySubtle shadow-ElevationLow hover:shadow-ElevationMid transition-all", 
        className
      )} 
      {...props} 
    />
  );
});
DateTimeInput.displayName = "DateTimeInput";
