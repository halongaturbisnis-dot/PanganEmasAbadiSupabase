import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * HOOKS/USEINFINITESCROLL.TS
 * A hook for handling infinite scrolling logic based on Intersection Observer.
 */

interface InfiniteScrollOptions {
  threshold?: number;
  rootMargin?: string;
  disabled?: boolean;
}

export function useInfiniteScroll(
  onLoadMore: () => Promise<void> | void,
  options: InfiniteScrollOptions = {}
) {
  const [isIntersecting, setIntersecting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const observerTarget = useRef<HTMLDivElement | null>(null);

  const handleIntersect = useCallback(
    async (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && !isLoading && !options.disabled) {
        setIsLoading(true);
        try {
          await onLoadMore();
        } finally {
          setIsLoading(false);
        }
      }
      setIntersecting(entry.isIntersecting);
    },
    [onLoadMore, isLoading, options.disabled]
  );

  useEffect(() => {
    const observer = new IntersectionObserver(handleIntersect, {
      threshold: options.threshold || 0.1,
      rootMargin: options.rootMargin || '20px',
    });

    const currentTarget = observerTarget.current;

    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [handleIntersect, options.threshold, options.rootMargin]);

  return {
    observerTarget,
    isIntersecting,
    isLoading
  };
}
