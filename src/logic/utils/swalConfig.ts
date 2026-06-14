import Swal from 'sweetalert2';
import { tokens } from '../../ui/styles/tokens';

/**
 * UTILS/SWALCONFIG.TS
 * Global SweetAlert2 configuration synchronized with design tokens.
 */

export const swalConfig = Swal.mixin({
  customClass: {
    confirmButton: 'px-6 py-2 bg-[var(--color-primary)] text-[var(--color-bg)] rounded-[var(--radius-small)] font-medium transition-all active:scale-95 cursor-pointer hover:bg-black/10',
    cancelButton: 'px-6 py-2 bg-[var(--color-tertiary)] text-[var(--color-text-base)] rounded-[var(--radius-small)] font-medium transition-all active:scale-95 ml-3 cursor-pointer hover:bg-black/10',
    popup: 'rounded-[var(--radius-medium)] p-6 shadow-[var(--shadow-high)] border border-[var(--color-border)]/20 bg-[var(--color-bg)]',
    title: 'text-[var(--font-size-h4)] font-bold text-[var(--color-text)]',
    htmlContainer: 'text-[var(--font-size-sm)] text-[var(--color-text-muted)]',
  },
  buttonsStyling: false,
  showClass: {
    popup: 'animate__animated animate__fadeInDown animate__faster'
  },
  hideClass: {
    popup: 'animate__animated animate__fadeOutUp animate__faster'
  }
});

// Helper for quick alerts
export const toast = swalConfig.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.addEventListener('mouseenter', Swal.stopTimer);
    toast.addEventListener('mouseleave', Swal.resumeTimer);
  }
});
