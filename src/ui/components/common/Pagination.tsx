import React from 'react';
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { cn } from '../../../logic/utils/cn';
import { useGlobalState } from '../../../logic/context/GlobalContext';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  perPage: number;
  onPageChange: (page: number) => void;
  className?: string;
  id?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  perPage,
  onPageChange,
  className,
  id = "pagination"
}) => {
  const { state, t } = useGlobalState();
  const isMobile = state.viewport.isMobile;

  if (totalPages <= 0) return null;

  const startIdx = totalItems === 0 ? 0 : (currentPage - 1) * perPage + 1;
  const endIdx = Math.min(currentPage * perPage, totalItems);

  // Helper to generate page numbers with ellipses
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const showMax = isMobile ? 3 : 5;

    if (totalPages <= showMax) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      
      if (currentPage > (isMobile ? 2 : 3)) {
        pages.push('...');
      }

      const offset = isMobile ? 0 : 1;
      const start = Math.max(2, currentPage - offset);
      const end = Math.min(totalPages - 1, currentPage + offset);

      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }

      if (currentPage < totalPages - (isMobile ? 1 : 2)) {
        pages.push('...');
      }

      if (!pages.includes(totalPages)) pages.push(totalPages);
    }
    return pages;
  };

  const infoText = t('pagination.info')
    .replace('{start}', startIdx.toString())
    .replace('{end}', endIdx.toString())
    .replace('{total}', totalItems.toString());

  return (
    <div id={id} className={cn("flex flex-row items-center justify-between gap-SpacingBase py-SpacingSmall w-full animate-in fade-in duration-DurationMid", className)}>
      {/* Status Text - Left Aligned */}
      <div id={`${id}-status`} className="text-FontSizeXs text-TextColorBase whitespace-nowrap">
        {infoText}
      </div>

      <div id={`${id}-controls`} className="flex items-center gap-SpacingTiny">
        {/* Nav & Page Buttons */}
        <div id={`${id}-buttons-wrapper`} className="flex items-center gap-SpacingNano">
          {/* Previous Button */}
          <button
            id={`${id}-prev`}
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={cn(
              "flex items-center justify-center w-6 h-6 rounded-RadiusFull border border-ColorPrimary/30 transition-all duration-DurationFast active:scale-TransformShrink disabled:opacity-OpacitySubtle disabled:cursor-not-allowed",
              "text-ColorPrimary hover:bg-ColorPrimary hover:text-White"
            )}
            title={t('pagination.prev')}
          >
            <ChevronLeft id={`${id}-prev-icon`} size="0.75rem" />
          </button>

          {/* Page Numbers */}
          <div id={`${id}-pages`} className="flex items-center mx-SpacingTiny gap-SpacingNano">
            {getPageNumbers().map((p, i) => (
              <React.Fragment key={i}>
                {p === '...' ? (
                  <span id={`${id}-ellipsis-${i}`} className="px-SpacingTiny text-TextColorMuted font-medium text-FontSizeXs">...</span>
                ) : (
                  <button
                    id={`${id}-page-${p}`}
                    onClick={() => onPageChange(p as number)}
                    className={cn(
                      "w-6 h-6 flex items-center justify-center !text-FontSizeXs font-medium transition-all duration-DurationFast rounded-RadiusFull",
                      currentPage === p 
                        ? "bg-ColorPrimary text-White shadow-ElevationLow" 
                        : "text-TextColorBase hover:bg-ColorPrimary/opacity-OpacityMuted hover:text-ColorPrimary font-normal"
                    )}
                  >
                    {p}
                  </button>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Next Button */}
          <button
            id={`${id}-next`}
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={cn(
              "flex items-center justify-center w-6 h-6 rounded-RadiusFull border border-ColorPrimary/30 transition-all duration-DurationFast active:scale-TransformShrink disabled:opacity-OpacitySubtle disabled:cursor-not-allowed",
              "text-ColorPrimary hover:bg-ColorPrimary hover:text-White"
            )}
            title={t('pagination.next')}
          >
            <ChevronRight id={`${id}-next-icon`} size="0.75rem" />
          </button>
        </div>
      </div>
    </div>
  );
};
