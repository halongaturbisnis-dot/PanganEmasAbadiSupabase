import React from 'react';
import { cn } from '../../../logic/utils/cn';

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export const Label: React.FC<LabelProps> = ({ 
  children, 
  required, 
  className, 
  id,
  ...props 
}) => {
  return (
    <label
      id={id}
      className={cn(
        "!text-FontSizeNano font-black text-TextColorBase opacity-80 uppercase !leading-none tracking-widest pl-SpacingNano border-l-2 border-ColorPrimary flex items-center gap-SpacingNano",
        className
      )}
      {...props}
    >
      {children}
      {required && (
        <span id={`${id}-asterisk`} className="text-FeedbackColorError" aria-hidden="true">
          *
        </span>
      )}
    </label>
  );
};
