import { notify } from './notificationService.js';

/**
 * Standardized Error Service
 */

export const errorService = {
  handle: (error: any) => {
    const message = error?.message || 'An unexpected error occurred';
    console.error('[VibeApp Error]:', message);
    
    notify.error(message);
    
    return {
      success: false,
      message,
      code: error?.code || 500
    };
  }
};
