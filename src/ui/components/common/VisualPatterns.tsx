import React from 'react';
import { cn } from '../../../logic/utils/cn';
import { useGlobalState } from '../../../logic/context/GlobalContext';

interface WaveProps {
  fill?: string;
  className?: string;
  flip?: boolean;
  id?: string;
}

/**
 * Modern SVG Wave Component (Inspired by GetWaves.io)
 */
export const Wave: React.FC<WaveProps> = ({ 
  fill = 'currentColor', 
  className, 
  flip,
  id = "visual-wave"
}) => {
  return (
    <div id={id} className={cn("w-full leading-none", flip && "rotate-180", className)}>
      <svg id={`${id}-svg`} viewBox="0 0 1440 320" xmlns="http://www.w3.org/2000/svg">
        <path 
          id={`${id}-path`}
          fill={fill} 
          fillOpacity="1" 
          d="M0,160L48,176C96,192,192,224,288,213.3C384,203,480,149,576,144C672,139,768,181,864,186.7C960,192,1056,160,1152,144C1248,128,1344,128,1392,128L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
        ></path>
      </svg>
    </div>
  );
};

interface BlobProps {
  fill?: string;
  className?: string;
  id?: string;
}

/**
 * Modern SVG Blob Component (Inspired by Haikei.app)
 */
export const Blob: React.FC<BlobProps> = ({ 
  fill = 'currentColor', 
  className,
  id = "visual-blob"
}) => {
  const { state } = useGlobalState();
  const isMobile = state.viewport.isMobile;

  return (
    <div id={id} className={cn(isMobile ? "w-spacing-ContainerXs h-spacing-ContainerXs" : "w-spacing-ContainerSm h-spacing-ContainerSm", className)}>
      <svg id={`${id}-svg`} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <path 
          id={`${id}-path`}
          fill={fill} 
          d="M44.7,-76.4C58.2,-69.2,70.1,-57.9,78.7,-44.5C87.3,-31.1,92.6,-15.5,91.8,-0.5C91,14.6,84.1,29.1,75.1,42C66.1,54.9,55.1,66.2,42,73.8C28.9,81.4,14.5,85.3,0.3,84.8C-13.9,84.3,-27.9,79.4,-40.8,71.7C-53.7,64.1,-65.4,53.6,-73.4,40.8C-81.4,28,-85.7,14,-86.1,-0.2C-86.5,-14.4,-83,-28.8,-75,-41.6C-67,-54.3,-54.5,-65.4,-40.8,-72.5C-27.1,-79.6,-13.5,-82.6,0.3,-83.1C14.1,-83.6,28.2,-81.5,44.7,-76.4Z" 
          transform="translate(100 100)" 
        />
      </svg>
    </div>
  );
};
