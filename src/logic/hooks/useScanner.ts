import { useState, useCallback } from 'react';
import { Html5QrcodeSupportedFormats } from 'html5-qrcode';

export interface UseScannerOptions {
  onScanSuccess: (decodedText: string, decodedResult: unknown) => void;
  onScanFailure?: (errorMessage: string, error: unknown) => void;
  fps?: number;
  qrbox?: number | { width: number; height: number };
  formatsToSupport?: Html5QrcodeSupportedFormats[];
}

export const useScanner = (options: UseScannerOptions) => {
  const [isScanning, setIsScanning] = useState(false);

  const startScan = useCallback(() => setIsScanning(true), []);
  const stopScan = useCallback(() => setIsScanning(false), []);
  const toggleScan = useCallback(() => setIsScanning(prev => !prev), []);

  return {
    isScanning,
    startScan,
    stopScan,
    toggleScan,
    scannerOptions: options,
  };
};
