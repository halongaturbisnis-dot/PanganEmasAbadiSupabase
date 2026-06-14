/**
 * Global Application Constants
 * Use this file to manage core identity values to avoid hardcoding in pages or components.
 */

export const APP_CONFIG = {
  name: "Pangan Mas Abadi",
  version: "1.0.0",
  description: "Business Portal",
  baseUrl: typeof window !== 'undefined' ? window.location.origin : '',
  supportEmail: "support@example.com",
};

export const UI_CONSTANTS = {
  // Common z-index hierarchy
  zIndex: {
    base: 0,
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
    fullscreen: 9999,
  },
  // Animation durations (ms)
  animations: {
    fast: 150,
    normal: 300,
    slow: 500,
  }
};
