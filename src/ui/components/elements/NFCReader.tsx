import React from 'react';
import { cn } from '../../../logic/utils/cn';
import { Button } from './Button';
import { Nfc, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useNFC } from '../../../logic/hooks/useNFC';
import { useGlobalState } from '../../../logic/context/GlobalContext';

interface NFCReaderProps {
  className?: string;
  onRead?: (data: any) => void;
}

export const NFCReader: React.FC<NFCReaderProps> = ({ className, onRead }) => {
  const { t } = useGlobalState();
  const { isScanning, error, lastResult, startScan, isSupported } = useNFC();

  React.useEffect(() => {
    if (lastResult && onRead) {
      onRead(lastResult);
    }
  }, [lastResult, onRead]);

  if (!isSupported) {
    return (
      <div 
        id="nfc-unsupported-error"
        className={cn("p-SpacingBase border border-FeedbackColorWarning/opacity-OpacitySubtle bg-FeedbackColorWarning/opacity-OpacityMuted rounded-RadiusMedium flex items-center gap-SpacingSmall text-FeedbackColorWarning", className)}
      >
        <AlertCircle id="nfc-alert-icon" size="1.25rem" />
        <span id="nfc-unsupported-text" className="text-FontSizeSm font-black">Fitur NFC tidak didukung oleh perangkat atau browser ini.</span>
      </div>
    );
  }

  return (
    <div id="nfc-reader-container" className={cn("flex flex-col gap-SpacingSmall", className)}>
      <Button 
        id="nfc-scan-button"
        variant={isScanning ? "outline" : "default"}
        onClick={startScan}
        disabled={isScanning}
        className="w-full h-12 flex items-center justify-center gap-SpacingTiny"
      >
        {isScanning ? (
          <>
            <Loader2 id="nfc-scanning-icon" className="w-5 h-5 animate-spin" />
            Mencari Sinyal NFC...
          </>
        ) : (
          <>
            <Nfc id="nfc-prompt-icon" className="w-5 h-5" />
            Ketuk Kartu NFC Anda
          </>
        )}
      </Button>

      {error && (
        <div id="nfc-error-info" className="text-FontSizeXs text-FeedbackColorError font-bold flex items-center gap-SpacingNano px-SpacingNano animate-in fade-in duration-DurationFast">
          <AlertCircle id="nfc-error-icon" size="0.875rem" />
          Terjadi kesalahan saat memindai NFC.
        </div>
      )}

      {lastResult && !isScanning && (
        <div id="nfc-result-card" className="p-SpacingSmall bg-FeedbackColorSuccess/opacity-OpacitySubtle border border-FeedbackColorSuccess/opacity-OpacityMuted rounded-RadiusSmall animate-in fade-in zoom-in duration-DurationMid shadow-ElevationLow">
          <div id="nfc-success-header" className="flex items-center gap-SpacingTiny text-FeedbackColorSuccess font-black text-FontSizeXs mb-SpacingNano">
            <CheckCircle2 id="nfc-success-icon" size="0.875rem" />
            Data NFC Berhasil Terbaca
          </div>
          <div id="nfc-data-display" className="text-FontSizeNano text-TextColorMuted break-all font-mono font-bold">
            Serial: {lastResult.serialNumber}
            {lastResult.records.map((r, i) => (
              <div key={i} id={`nfc-record-${i}`} className="mt-SpacingNano border-t border-ColorSidebarBorder/opacity-OpacityMuted pt-1">
                [{r.recordType}] {r.data}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
