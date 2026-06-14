import React from 'react';
import { cn } from '../../../logic/utils/cn';
import { useGlobalState } from '../../../logic/context/GlobalContext';

interface GalleryProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  columns?: 2 | 3 | 4 | 5 | 6;
}

export const Gallery = React.forwardRef<HTMLDivElement, GalleryProps>(
  ({ className, columns = 3, id = "gallery", ...props }, ref) => {
    const { state } = useGlobalState();
    const isMobile = state.viewport.isMobile;

    // We map column numbers to grid classes based on viewport state
    const columnClass = isMobile 
      ? {
          2: "grid-cols-1",
          3: "grid-cols-1",
          4: "grid-cols-1",
          5: "grid-cols-2",
          6: "grid-cols-2",
        }[columns] 
      : {
          2: "grid-cols-2",
          3: "grid-cols-3",
          4: "grid-cols-4",
          5: "grid-cols-5",
          6: "grid-cols-6",
        }[columns];

    return (
      <div
        ref={ref}
        id={id}
        className={cn(
          "grid gap-SpacingMedium rounded-RadiusSmall bg-ColorBg animate-in fade-in duration-DurationMid",
          columnClass,
          className
        )}
        {...props}
      />
    );
  }
);
Gallery.displayName = "Gallery";

export const GalleryItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, id, ...props }, ref) => (
    <div
      ref={ref}
      id={id}
      className={cn(
        "relative rounded-RadiusSmall overflow-hidden shadow-ElevationLow group border border-ColorTertiary/opacity-OpacityMuted transition-all duration-DurationMid hover:shadow-ElevationNormal",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);
GalleryItem.displayName = "GalleryItem";

export const GalleryImage = React.forwardRef<HTMLImageElement, React.ImgHTMLAttributes<HTMLImageElement>>(
  ({ className, alt = "", id, ...props }, ref) => (
    <img
      ref={ref}
      id={id}
      alt={alt}
      referrerPolicy="no-referrer"
      className={cn(
        "w-full h-auto object-cover transition-transform duration-DurationMid group-hover:scale-105",
        className
      )}
      {...props}
    />
  )
);
GalleryImage.displayName = "GalleryImage";

export const GalleryCaption = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, id, ...props }, ref) => (
    <div
      ref={ref}
      id={id}
      className={cn(
        "absolute bottom-0 left-0 right-0 p-SpacingSmall bg-TextColorBase/opacity-OpacityOpaque text-White translate-y-full transition-transform duration-DurationFast group-hover:translate-y-px text-FontSizeSm backdrop-blur-sm",
        className
      )}
      {...props}
    />
  )
);
GalleryCaption.displayName = "GalleryCaption";
