import { useCallback } from 'react';
import { toast, swalConfig } from '../utils/swalConfig';
import { useGlobalState } from '../context/GlobalContext';

/**
 * HOOKS/USENOTIFICATION.TS
 * A clean bridge to trigger SweetAlert2 notifications.
 */

export const useNotification = () => {
  const { t } = useGlobalState();
  const successToast = useCallback((message: string) => {
    toast.fire({
      icon: 'success',
      title: message,
    });
  }, []);

  const errorToast = useCallback((message: string) => {
    toast.fire({
      icon: 'error',
      title: message,
    });
  }, []);

  const infoToast = useCallback((message: string) => {
    toast.fire({
      icon: 'info',
      title: message,
    });
  }, []);

  const confirmAction = useCallback(async (options: {
    title: string;
    text: string;
    confirmText?: string;
    cancelText?: string;
    icon?: 'warning' | 'error' | 'success' | 'info' | 'question';
  }) => {
    const result = await swalConfig.fire({
      title: options.title,
      text: options.text,
      icon: options.icon || 'warning',
      showCancelButton: true,
      confirmButtonText: options.confirmText || t('common.yes'),
      cancelButtonText: options.cancelText || t('common.no'),
    });
    
    return result.isConfirmed;
  }, [t]);

  return { successToast, errorToast, infoToast, confirmAction };
};
