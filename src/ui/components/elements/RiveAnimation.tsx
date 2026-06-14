import React from 'react';
import { useRive, Layout, Fit, Alignment } from '@rive-app/react-canvas';
import { cn } from '../../../logic/utils/cn';
import { useGlobalState } from '../../../logic/context/GlobalContext';

interface RiveAnimationProps {
  src: string;
  stateMachine?: string;
  artboard?: string;
  className?: string;
  fit?: Fit;
  alignment?: Alignment;
}

export const RiveAnimation: React.FC<RiveAnimationProps> = ({
  src,
  stateMachine,
  artboard,
  className,
  fit = Fit.Contain,
  alignment = Alignment.Center,
  id = "rive-animation"
}) => {
  const { RiveComponent } = useRive({
    src,
    stateMachines: stateMachine,
    artboard,
    layout: new Layout({ fit, alignment }),
    autoplay: true,
  });

  return (
    <div id={id} className={cn('relative w-full h-full overflow-hidden rounded-RadiusSmall', className)}>
      {RiveComponent ? (
        <RiveComponent id={`${id}-component`} />
      ) : (
        <div id={`${id}-loading`} className="w-full h-full bg-ColorBgSecondary/opacity-OpacityMuted animate-pulse flex items-center justify-center">
          <span id={`${id}-loading-text`} className="text-FontSizeXs text-TextColorMuted font-black tracking-tight">Memuat animasi...</span>
        </div>
      )}
    </div>
  );
};
