import React from 'react';
import { cn } from '../../../logic/utils/cn';
import { Check } from 'lucide-react';
import { useGlobalState } from '../../../logic/context/GlobalContext';

export interface Step {
  title: string;
  description?: string;
}

interface StepperProps extends React.HTMLAttributes<HTMLDivElement> {
  steps: Step[];
  currentStep: number;
  id?: string;
}

export const Stepper = React.forwardRef<HTMLDivElement, StepperProps>(
  ({ className, steps, currentStep, id = "stepper", ...props }, ref) => {
    const { state } = useGlobalState();
    const isMobile = state.viewport.isMobile;

    return (
      <div ref={ref} id={id} className={cn("w-full animate-in fade-in duration-DurationMid", className)} {...props}>
        <div id={`${id}-items`} className={cn("flex justify-between", isMobile && "gap-SpacingTiny")}>
          {steps.map((step, index) => {
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;
            const stepId = `${id}-step-${index}`;

            return (
              <div key={index} id={stepId} className="flex flex-col items-center relative flex-1">
                {/* Connecting Line */}
                {index < steps.length - 1 && (
                  <div
                    id={`${stepId}-connector`}
                    className={cn(
                      "absolute top-SpacingBase left-1/2 w-full h-BorderMedium -translate-y-1/2",
                      isCompleted ? "bg-ColorPrimary" : "bg-ColorTertiary/opacity-OpacitySubtle"
                    )}
                  />
                )}
                
                {/* Circle */}
                <div
                  id={`${stepId}-circle`}
                  className={cn(
                    "w-SpacingHuge h-SpacingHuge rounded-RadiusFull flex items-center justify-center z-ZRaised border-2 transition-all duration-DurationMid shadow-ElevationSm",
                    isCompleted
                      ? "bg-ColorPrimary border-ColorPrimary text-White"
                      : isActive
                      ? "bg-ColorPrimary/opacity-OpacityMuted border-ColorPrimary text-ColorPrimary scale-110 shadow-ElevationMid"
                      : "bg-ColorBg border-ColorTertiary/opacity-OpacitySubtle text-TextColorMuted"
                  )}
                >
                  {isCompleted ? <Check id={`${stepId}-check`} className="w-4 h-4" /> : <span id={`${stepId}-number`} className={cn("font-bold", isMobile ? "text-FontSizeXs" : "text-FontSizeSm")}>{index + 1}</span>}
                </div>
                
                {/* Text */}
                <div id={`${stepId}-text-group`} className="mt-SpacingSmall text-center px-SpacingTiny">
                  <p
                    id={`${stepId}-title`}
                    className={cn(
                      "font-bold leading-LineHeightTight",
                      isMobile ? "text-FontSizeNano" : "text-FontSizeSm",
                      (isCompleted || isActive) ? "text-TextColorBase" : "text-TextColorMuted"
                    )}
                  >
                    {step.title}
                  </p>
                  {step.description && !isMobile && (
                    <p id={`${stepId}-desc`} className="text-FontSizeXs text-TextColorMuted mt-SpacingTiny max-w-24 mx-auto line-clamp-2">
                      {step.description}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
);
Stepper.displayName = "Stepper";
