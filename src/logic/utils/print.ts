/**
 * UTILS/PRINT.TS
 * Specialized utilities for Printing and ESC/POS formatting.
 * Supports standard browser printing and thermal receipt formatting.
 */

// 1. Paper Configurations (Character counts per line)
export const PRINT_CONFIG = {
  PAPER_58MM: {
    width: 32,
    fontSize: '12px',
  },
  PAPER_80MM: {
    width: 48,
    fontSize: '14px',
  },
};

// 2. Simple POS Formatter (Creates text layout for receipt)
export const formatReceiptLine = (
  left: string,
  right: string,
  width: number = 32
): string => {
  const spaceCount = width - (left.length + right.length);
  if (spaceCount <= 0) return `${left} ${right}`;
  return left + ' '.repeat(spaceCount) + right;
};

// 3. Receipt Separator Line
export const getSeparator = (char: string = '-', width: number = 32): string => {
  return char.repeat(width);
};

// 4. Center Align Text
export const centerText = (text: string, width: number = 32): string => {
  if (text.length >= width) return text;
  const padding = Math.floor((width - text.length) / 2);
  return ' '.repeat(padding) + text;
};

// 5. Browser Print Layout Activator
export const triggerBrowserPrint = () => {
  window.print();
};

/**
 * Note: For Direct Bluetooth ESC/POS printing, 
 * this typically requires a Web Bluetooth API implementation 
 * or a native bridge. These helpers prepare the text strings correctly.
 */
