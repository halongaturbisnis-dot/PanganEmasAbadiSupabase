import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

/**
 * NOTIFICATION SERVICE
 * Standardized notification engine following NotificationRule.md
 */

export const notify = {
  // 1. CRUD & Operational (Toast)
  success: (message: string) => {
    if (typeof window === 'undefined') {
      console.log('Toast SUCCESS (Server):', message);
      return;
    }
    toast.success(message, {
      duration: 3000,
      position: 'top-right',
    });
  },
  
  error: (message: string) => {
    if (typeof window === 'undefined') {
      console.error('Toast ERROR (Server):', message);
      return;
    }
    toast.error(message, {
      duration: 4000,
      position: 'top-right',
    });
  },

  info: (message: string) => {
    if (typeof window === 'undefined') {
      console.log('Toast INFO (Server):', message);
      return;
    }
    toast(message, {
      duration: 3000,
      position: 'top-right',
      icon: 'ℹ️',
    });
  },

  // 2. Warning & Crucial (SWAL)
  async alert(title: string, text: string, icon: 'warning' | 'error' | 'success' | 'info' = 'info') {
    if (typeof window === 'undefined') {
      console.log('SWAL ALERT (Server):', title, text);
      return;
    }
    return Swal.fire({
      title,
      text,
      icon,
      confirmButtonText: 'OK',
      confirmButtonColor: '#3085d6',
    });
  },

  async confirm(title: string, text: string) {
    if (typeof window === 'undefined') {
      console.log('SWAL CONFIRM (Server):', title, text);
      return true; // Assume true on server
    }
    const result = await Swal.fire({
      title,
      text,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Ya, Lanjutkan!',
      cancelButtonText: 'Batal'
    });
    return result.isConfirmed;
  }
};
