import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../../logic/utils/cn';
import { useGlobalState } from '../../../logic/context/GlobalContext';

export interface BannerSlide {
  id: string | number;
  title: string;
  subtitle?: string;
  image: string;
  link?: string;
  buttonText?: string;
  className?: string;
}

interface SlideshowBannerProps {
  slides: BannerSlide[];
  autoPlay?: boolean;
  interval?: number;
  className?: string;
}

export const SlideshowBanner: React.FC<SlideshowBannerProps> = ({
  slides,
  autoPlay = true,
  interval = 5000,
  className,
  id = "slideshow-banner"
}) => {
  const { state } = useGlobalState();
  const isMobile = state.viewport.isMobile;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0); // -1 for left, 1 for right

  const nextSlide = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  useEffect(() => {
    if (!autoPlay) return;
    const timer = setInterval(nextSlide, interval);
    return () => clearInterval(timer);
  }, [autoPlay, interval, nextSlide]);

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? '100%' : '-100%',
      opacity: 0,
    }),
  };

  return (
    <div id={id} className={cn("relative w-full rounded-RadiusLarge overflow-hidden group shadow-ElevationNormal animate-in fade-in duration-DurationSlow", isMobile ? "aspect-square" : "aspect-video", className)}>
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={currentIndex}
          id={`${id}-slide-${slides[currentIndex].id}`}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 }
          }}
          className="absolute inset-0 w-full h-full"
        >
          <div id={`${id}-overlay`} className="absolute inset-0 bg-gradient-to-r from-Black/opacity-OpacitySubtle via-Black/opacity-OpacityMuted to-transparent z-ZAbove" />
          <img
            id={`${id}-image-${slides[currentIndex].id}`}
            src={slides[currentIndex].image}
            alt={slides[currentIndex].title}
            className="w-full h-full object-cover"
          />
          
          <div id={`${id}-body-${slides[currentIndex].id}`} className={cn("absolute inset-x-0 bottom-0 top-0 z-ZRaised flex flex-col justify-center max-w-ContainerLg", isMobile ? "p-SpacingLarge" : "p-SpacingHuge")}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h2 id={`${id}-title-${slides[currentIndex].id}`} className={cn("font-bold text-White leading-LineHeightTight", isMobile ? "text-FontSizeH4 mb-SpacingTiny" : "text-FontSizeH2 mb-SpacingBase")}>
                {slides[currentIndex].title}
              </h2>
              {slides[currentIndex].subtitle && (
                <p id={`${id}-subtitle-${slides[currentIndex].id}`} className={cn("text-White/opacity-OpacitySubtle line-clamp-2 mb-SpacingLarge max-w-ContainerMd", isMobile ? "text-FontSizeNano" : "text-FontSizeBase")}>
                  {slides[currentIndex].subtitle}
                </p>
              )}
              
              {slides[currentIndex].buttonText && (
                <button 
                  id={`${id}-action-${slides[currentIndex].id}`}
                  className="px-SpacingMedium py-SpacingSmall rounded-RadiusFull bg-ColorBg text-ColorPrimary font-bold text-FontSizeSm hover:scale-TransformGrow transition-all shadow-ElevationMid active:scale-TransformShrink"
                >
                  {slides[currentIndex].buttonText}
                </button>
              )}
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Buttons */}
      {slides.length > 1 && (
        <>
          <button
            id={`${id}-prev`}
            onClick={prevSlide}
            aria-label="Slide Sebelumnya"
            className="absolute left-SpacingBase top-1/2 -translate-y-1/2 z-ZRaised w-spacing-SpacingHuge h-spacing-SpacingHuge rounded-RadiusFull bg-Black/opacity-OpacityMuted backdrop-blur-md border border-White/opacity-OpacityMuted flex items-center justify-center text-White opacity-0 group-hover:opacity-OpacityOpaque transition-all hover:bg-Black/opacity-OpacitySubtle active:scale-TransformShrink"
          >
            <ChevronLeft id={`${id}-prev-icon`} size={isMobile ? 18 : 24} />
          </button>
          <button
            id={`${id}-next`}
            onClick={nextSlide}
            aria-label="Slide Berikutnya"
            className="absolute right-SpacingBase top-1/2 -translate-y-1/2 z-ZRaised w-spacing-SpacingHuge h-spacing-SpacingHuge rounded-RadiusFull bg-Black/opacity-OpacityMuted backdrop-blur-md border border-White/opacity-OpacityMuted flex items-center justify-center text-White opacity-0 group-hover:opacity-OpacityOpaque transition-all hover:bg-Black/opacity-OpacitySubtle active:scale-TransformShrink"
          >
            <ChevronRight id={`${id}-next-icon`} size={isMobile ? 18 : 24} />
          </button>

          {/* Dots Indicator */}
          <div id={`${id}-indicators`} className="absolute bottom-SpacingBase left-1/2 -translate-x-1/2 z-ZRaised flex items-center gap-SpacingTiny">
            {slides.map((_, idx) => (
              <button
                key={idx}
                id={`${id}-dot-${idx}`}
                onClick={() => {
                  setDirection(idx > currentIndex ? 1 : -1);
                  setCurrentIndex(idx);
                }}
                className={cn(
                  "w-SpacingNano h-SpacingNano rounded-RadiusFull transition-all duration-DurationMid",
                  currentIndex === idx ? "w-SpacingMedium bg-White" : "bg-White/opacity-OpacitySubtle hover:bg-White/opacity-OpacityOpaque"
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};
