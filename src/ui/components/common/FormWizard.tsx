import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { Stepper } from './Steppers';
import { Button } from '../elements/Button';
import { useGlobalState } from '../../../logic/context/GlobalContext';
import { cn } from '../../../logic/utils/cn';

interface Step {
  id: string | number;
  label: string;
  component: React.ReactNode;
  isValid?: boolean;
}

interface FormWizardProps {
  steps: Step[];
  onComplete: (data: any) => void;
  className?: string;
  id?: string;
  initialStep?: number;
}

export const FormWizard: React.FC<FormWizardProps> = ({
  steps,
  onComplete,
  className,
  id = "form-wizard",
  initialStep = 0
}) => {
  const { state } = useGlobalState();
  const [currentStepIdx, setCurrentStepIdx] = useState(initialStep);

  const isLastStep = currentStepIdx === steps.length - 1;
  const isFirstStep = currentStepIdx === 0;
  const isMobile = state.viewport.isMobile;

  const handleNext = () => {
    if (steps[currentStepIdx].isValid === false) return;
    
    if (isLastStep) {
      onComplete({});
    } else {
      setCurrentStepIdx(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (!isFirstStep) {
      setCurrentStepIdx(prev => prev - 1);
    }
  };

  return (
    <div id={id} className={cn("space-y-SpacingLarge animate-in fade-in duration-DurationMid", className)}>
      {/* Visual Progress */}
      <div id={`${id}-stepper-wrapper`} className={cn("px-SpacingMedium", isMobile && "px-SpacingTiny")}>
        <Stepper 
          id={`${id}-stepper`}
          steps={steps.map(s => ({
            title: s.label
          }))}
          currentStep={currentStepIdx}
        />
      </div>

      {/* Current Step Content */}
      <div 
        id={`${id}-content-card`} 
        className="bg-ColorBg border border-ColorTertiary/opacity-OpacitySubtle rounded-RadiusLarge p-SpacingLarge shadow-ElevationLow min-h-height-ContainerXs"
      >
        <div id={`${id}-header`} className="mb-SpacingMedium">
          <span id={`${id}-step-indicator`} className="text-FontSizeNano uppercase font-bold text-ColorPrimary tracking-widest">
            LANGKAH {currentStepIdx + 1}
          </span>
          <h3 id={`${id}-step-title`} className="text-FontSizeH3 font-bold text-TextColorBase leading-LineHeightTight mt-SpacingNano">
            {steps[currentStepIdx].label}
          </h3>
        </div>
        
        <div id={`${id}-step-body`} className="animate-in fade-in slide-in-from-bottom-layout-TransformShort duration-DurationMid">
          {steps[currentStepIdx].component}
        </div>
      </div>

      {/* Actions */}
      <div id={`${id}-actions`} className="flex items-center justify-between gap-SpacingMedium pt-SpacingMedium">
        <Button
          id={`${id}-prev-btn`}
          variant="ghost"
          onClick={handleBack}
          disabled={isFirstStep}
          className="px-SpacingLarge text-TextColorMuted hover:text-TextColorBase transition-colors"
        >
          <ChevronLeft size="1.125rem" className="mr-SpacingTiny" />
          Sebelumnya
        </Button>

        <Button
          id={`${id}-next-btn`}
          onClick={handleNext}
          disabled={steps[currentStepIdx].isValid === false}
          className={cn(
            "px-SpacingHuge shadow-ElevationNormal transition-all",
            isLastStep ? "bg-FeedbackColorSuccess text-White" : "bg-ColorPrimary text-White"
          )}
        >
          {isLastStep ? (
            <>
              Selesai
              <Check size="1.125rem" className="ml-SpacingSmall" />
            </>
          ) : (
            <>
              Lanjutkan
              <ChevronRight size="1.125rem" className="ml-SpacingSmall" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
