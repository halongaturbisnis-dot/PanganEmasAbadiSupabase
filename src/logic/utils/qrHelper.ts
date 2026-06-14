/**
 * Utility functions for processing and validating data from QR Codes and Barcodes.
 */

/**
 * Checks if the scanned string is a valid URL.
 */
export const isValidURL = (text: string): boolean => {
  try {
    new URL(text);
    return true;
  } catch (_) {
    return false;
  }
};

/**
 * Parses the scanned string into a JSON object if possible.
 * Useful for QR codes that contain structured data.
 */
export const parseQRData = (text: string): Record<string, unknown> | null => {
  try {
    return JSON.parse(text);
  } catch (_) {
    return null; // Not valid JSON
  }
};

/**
 * Cleans up scanned barcode data (e.g., removing arbitrary trailing whitespaces).
 */
export const formatBarcodeData = (data: string): string => {
  return data.trim();
};

/**
 * Detects the data type of the scanned code.
 */
export const detectCodeType = (text: string): 'URL' | 'JSON' | 'TEXT' => {
  if (isValidURL(text)) return 'URL';
  if (parseQRData(text) !== null) return 'JSON';
  return 'TEXT';
};
