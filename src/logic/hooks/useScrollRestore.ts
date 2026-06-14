import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { scrollToTop } from '../utils/scroll';

/**
 * HOOKS/USESCROLLRESTORE.TS
 * Automatically scrolls the window to the top on every route change.
 * Should be used at the top-level App or page layouts.
 */

export const useScrollRestore = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    scrollToTop(false); // Snap to top instantly on route change for better UX
  }, [pathname]);
};
