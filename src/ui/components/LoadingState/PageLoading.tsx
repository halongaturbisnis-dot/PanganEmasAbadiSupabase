import React from 'react';
import { cn } from '../../../logic/utils/cn';
import { useGlobalState } from '../../../logic/context/GlobalContext';
import { motion } from 'motion/react';

interface PageLoadingProps extends React.HTMLAttributes<HTMLDivElement> {
  text?: string;
  variant?: 'spinner' | 'skeleton';
}

export const PageLoading: React.FC<PageLoadingProps> = ({ className, text, variant = 'spinner', ...props }) => {
  const { state, t } = useGlobalState();
  const isMobile = state.viewport.isMobile;
  const loadingText = text || t('input.loadingContent');

  return (
    <div className={cn("w-full flex-1 flex flex-col items-center justify-center p-SpacingLarge min-h-[50vh]", className)} {...props}>
      {variant === 'spinner' ? (
        <div className="flex flex-col items-center justify-center gap-SpacingMedium">
          <div className="flex items-center justify-center gap-SpacingNano h-10 w-full">
            {[
              { size: '0.4rem', opacity: 0.2 },
              { size: '0.5rem', opacity: 0.4 },
              { size: '0.65rem', opacity: 0.7 },
              { size: '0.9rem', opacity: 1 },
            ].map((dot, index) => (
              <motion.div
                key={index}
                className="rounded-full bg-ColorPrimary"
                style={{ 
                  width: dot.size, 
                  height: dot.size,
                  opacity: dot.opacity 
                }}
                animate={{
                  y: [0, -8, 0],
                  opacity: [dot.opacity, 1, dot.opacity]
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: index * 0.15,
                  ease: "easeInOut"
                }}
              />
            ))}
          </div>
          {loadingText && (
            <motion.p 
              initial={{ opacity: 0.5 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, repeat: Infinity, repeatType: 'reverse' }}
              className="text-TextColorMuted text-FontSizeSm font-medium"
            >
              {loadingText}
            </motion.p>
          )}
        </div>
      ) : (
        <div className="flex flex-col w-full max-w-4xl gap-SpacingBase">
          <div className="w-1/3 h-spacing-SpacingLarge bg-ColorTertiary/opacity-OpacityMuted animate-pulse rounded-RadiusSmall mb-SpacingBase" />
          <div className="w-full h-spacing-SpacingMega bg-ColorTertiary/opacity-OpacityMuted animate-pulse rounded-RadiusBase" />
          <div className={cn("grid gap-SpacingBase", isMobile ? "grid-cols-1" : "grid-cols-2")}>
            <div className="w-full h-spacing-SpacingHuge bg-ColorTertiary/opacity-OpacityMuted animate-pulse rounded-RadiusBase" />
            <div className="w-full h-spacing-SpacingHuge bg-ColorTertiary/opacity-OpacityMuted animate-pulse rounded-RadiusBase" />
          </div>
        </div>
      )}
    </div>
  );
};
