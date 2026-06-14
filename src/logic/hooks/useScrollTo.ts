import { useCallback } from 'react';
import { scrollToTop, scrollToId, scrollToElement } from '../utils/scroll';

/**
 * HOOKS/USESCROLLTO.TS
 * A convenient hook wrapper for common scroll actions.
 */

export const useScrollTo = () => {
  const toTop = useCallback((smooth = true) => {
    scrollToTop(smooth);
  }, []);

  const toId = useCallback((id: string, offset = 0, smooth = true) => {
    scrollToId(id, offset, smooth);
  }, []);

  const toElement = useCallback((element: HTMLElement | null, offset = 0, smooth = true) => {
    scrollToElement(element, offset, smooth);
  }, []);

  return { toTop, toId, toElement };
};
