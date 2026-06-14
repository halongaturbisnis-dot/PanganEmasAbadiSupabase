import React from 'react';
import Lottie from 'lottie-react';

interface LottieWrapperProps {
  animationData: any;
  loop?: boolean;
  autoplay?: boolean;
  className?: string;
}

/**
 * Standard Lottie Wrapper for the Boilerplate
 */
export const LottieWrapper: React.FC<LottieWrapperProps> = ({ 
  animationData, 
  loop = true, 
  autoplay = true,
  className = "w-full h-full"
}) => {
  return (
    <div className={className}>
      <Lottie 
        animationData={animationData} 
        loop={loop} 
        autoplay={autoplay} 
      />
    </div>
  );
};
