/**
 * UTILS/DATE.TS
 * Specialized utilities for date formatting and manipulation.
 */

/**
 * FORMAT DISPLAY DATE TIME
 * Converts database UTC string to localized Date and Time components.
 * Specifically handles Turso/SQLite "YYYY-MM-DD HH:mm:ss" format as UTC.
 */
export const formatDateDisplay = (dateStr: string | null | undefined): { date: string; time: string } => {
  if (!dateStr) return { date: '-', time: '-' };

  try {
    // Normalize to ISO-8601 with Z suffix to ensure UTC parsing
    let normalized = dateStr;
    if (!dateStr.includes('T') && !dateStr.includes('Z')) {
      normalized = dateStr.replace(' ', 'T') + 'Z';
    } else if (dateStr.includes('T') && !dateStr.includes('Z')) {
      normalized = dateStr + 'Z';
    }

    const d = new Date(normalized);
    if (isNaN(d.getTime())) return { date: '-', time: '-' };

    return {
      date: formatDate(d),
      time: `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    };
  } catch (e) {
    return { date: '-', time: '-' };
  }
};

// 1. Format Date (Indonesian Standard)
export const formatDate = (
  date: Date | string | number,
  options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'long', year: 'numeric' },
  locale: string = 'id-ID'
): string => {
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  return new Intl.DateTimeFormat(locale, options).format(d);
};

export const formatDateShort = (date: Date | string | number): string => {
  return formatDate(date, { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export const formatDateFull = (date: Date | string | number): string => {
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  
  const datePart = formatDate(d);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  
  return `${datePart} ${hours}:${minutes}`;
};

// 2. Relative Time (e.g., "5 menit yang lalu")
export const formatDateTimeWithPipe = (date: Date | string | number): string => {
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  
  const day = String(d.getDate()).padStart(2, '0');
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const month = monthNames[d.getMonth()];
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  
  return `${day} ${month} ${year}, ${hours}:${minutes}`;
};

// 3. Relative Time (e.g., "5 menit yang lalu")
export const getRelativeTime = (date: Date | string | number, locale: string = 'id-ID'): string => {
  const time = new Date(date).getTime();
  const now = Date.now();
  const diff = now - time;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 7) return formatDate(date);
  if (days > 0) return `${days} hari yang lalu`;
  if (hours > 0) return `${hours} jam yang lalu`;
  if (minutes > 0) return `${minutes} menit yang lalu`;
  return 'Baru saja';
};

// 4. Check if Date is Today
export const isToday = (date: Date | string | number): boolean => {
  const d = new Date(date);
  const today = new Date();
  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  );
};

// 5. Get Start and End of Month
export const getMonthRange = (date: Date = new Date()) => {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return { start, end };
};

// 5. Format for input type="datetime-local" (YYYY-MM-DDTHH:mm)
export const formatDateTimeLocal = (date: Date | string | number = new Date()): string => {
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

// 6. Format for input type="date" (YYYY-MM-DD)
export const formatDateLocal = (date: Date | string | number = new Date()): string => {
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};
