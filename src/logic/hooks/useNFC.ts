import { useState, useCallback } from 'react';

export interface NFCReadResult {
  serialNumber: string;
  records: {
    recordType: string;
    mediaType?: string;
    id?: string;
    data?: any;
  }[];
}

export function useNFC() {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<NFCReadResult | null>(null);

  const startScan = useCallback(async () => {
    if (!('NDEFReader' in window)) {
      setError('nfc.unsupported');
      return;
    }

    try {
      setIsScanning(true);
      setError(null);
      
      // @ts-ignore - Web NFC is still experimental in some TS versions
      const reader = new NDEFReader();
      await reader.scan();
      
      reader.onreadingerror = () => {
        setError('nfc.error');
      };

      reader.onreading = (event: any) => {
        const result: NFCReadResult = {
          serialNumber: event.serialNumber,
          records: event.message.records.map((record: any) => ({
            recordType: record.recordType,
            mediaType: record.mediaType,
            id: record.id,
            data: record.data ? new TextDecoder().decode(record.data) : null,
          })),
        };
        setLastResult(result);
        setIsScanning(false);
      };
    } catch (err) {
      console.error('NFC Scan Error:', err);
      setError('nfc.error');
      setIsScanning(false);
    }
  }, []);

  const stopScan = useCallback(() => {
    setIsScanning(false);
    // Note: NDEFReader doesn't have an explicit stop method in all versions, 
    // it usually stops when the component unmounts or by closing the reader if supported.
  }, []);

  return {
    isScanning,
    error,
    lastResult,
    startScan,
    stopScan,
    isSupported: typeof window !== 'undefined' && 'NDEFReader' in window,
  };
}
