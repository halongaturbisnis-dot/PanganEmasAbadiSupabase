/**
 * UTILS/VALIDATORS.TS
 * Common input validation logic.
 */

export const validators = {
  isEmpty: (value: any): boolean => {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim().length === 0;
    if (Array.isArray(value)) return value.length === 0;
    return false;
  },

  isValidEmail: (email: string): boolean => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  },

  isValidPhone: (phone: string): boolean => {
    const re = /^[0-9+() -]{10,15}$/;
    return re.test(phone);
  },

  isNumber: (value: any): boolean => {
    return !isNaN(parseFloat(value)) && isFinite(value);
  },

  minLength: (value: string, min: number): boolean => {
    return value.length >= min;
  },

  maxLength: (value: string, max: number): boolean => {
    return value.length <= max;
  }
};
