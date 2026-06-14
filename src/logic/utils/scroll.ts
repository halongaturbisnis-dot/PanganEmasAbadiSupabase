/**
 * UTILS/SCROLL.TS
 * Shared utility functions for viewport and element scrolling management.
 */

// 1. Scroll to Top
export const scrollToTop = (smooth: boolean = true) => {
  window.scrollTo({
    top: 0,
    behavior: smooth ? 'smooth' : 'auto',
  });
};

// 2. Scroll to Element by ID
export const scrollToId = (id: string, offset: number = 0, smooth: boolean = true) => {
  const element = document.getElementById(id);
  if (!element) return;

  const bodyRect = document.body.getBoundingClientRect().top;
  const elementRect = element.getBoundingClientRect().top;
  const elementPosition = elementRect - bodyRect;
  const offsetPosition = elementPosition - offset;

  window.scrollTo({
    top: offsetPosition,
    behavior: smooth ? 'smooth' : 'auto',
  });
};

// 3. Scroll to Specific Element
export const scrollToElement = (
  element: HTMLElement | null, 
  offset: number = 0, 
  smooth: boolean = true
) => {
  if (!element) return;

  const bodyRect = document.body.getBoundingClientRect().top;
  const elementRect = element.getBoundingClientRect().top;
  const elementPosition = elementRect - bodyRect;
  const offsetPosition = elementPosition - offset;

  window.scrollTo({
    top: offsetPosition,
    behavior: smooth ? 'smooth' : 'auto',
  });
};
