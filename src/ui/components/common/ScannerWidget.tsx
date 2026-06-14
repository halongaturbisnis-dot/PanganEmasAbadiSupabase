import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { cn } from '../../../logic/utils/cn';
import { AlertCircle, Camera } from 'lucide-react';
import { useGlobalState } from '../../../logic/context/GlobalContext';

interface ScannerWidgetProps {
  onScanSuccess: (decodedText: string, decodedResult: any) => void;
  onScanFailure?: (errorMessage: string, error: any) => void;
  className?: string;
  fps?: number;
  qrbox?: number | { width: number; height: number };
  formatsToSupport?: Html5QrcodeSupportedFormats[];
  id?: string;
}

export const ScannerWidget: React.FC<ScannerWidgetProps> = ({
  onScanSuccess,
  onScanFailure,
  className,
  fps = 10,
  qrbox = 250,
  formatsToSupport,
  id = "scanner-widget"
}) => {
  const { state } = useGlobalState();
  const isMobile = state.viewport.isMobile;
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerId = `${id}-internal-region`;

  // Automatically start requesting permission when the component mounts
  // if we want to auto-start. Or we can tie it to a "Start Scanner" button.
  // The user says "otomatis membuka kamera kalau scanner dipakai/diklik".
  // Let's assume when they click "Scanner" in the menu, the modal opens and this component mounts.
  
  useEffect(() => {
    let html5QrCode: Html5Qrcode;
    let isMounted = true;

    const startCamera = async () => {
      try {
        const cameras = await Html5Qrcode.getCameras();
        if (!isMounted) return;

        if (cameras && cameras.length > 0) {
          setHasPermission(true);
          
          html5QrCode = new Html5Qrcode(containerId, {
            formatsToSupport: formatsToSupport
          } as any);
          scannerRef.current = html5QrCode;

          await html5QrCode.start(
            { facingMode: 'environment' },
            {
              fps: fps,
              qrbox: qrbox,
            },
            (decodedText, decodedResult) => {
              if (isMounted) onScanSuccess(decodedText, decodedResult);
            },
            (errorMessage, error) => {
              if (isMounted && onScanFailure) {
                onScanFailure(errorMessage, error);
              }
            }
          );
          
          if (isMounted) {
            setIsScanning(true);
          } else {
            // Unmounted while starting
            html5QrCode.stop().then(() => html5QrCode.clear()).catch(console.error);
          }
        } else {
          if (isMounted) {
            setHasPermission(false);
            setErrorMsg("Tidak ditemukan kamera di perangkat ini.");
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setHasPermission(false);
          setErrorMsg(err?.message || "Gagal mengakses kamera. Pastikan izin telah diberikan.");
        }
      }
    };

    // We wait for the DOM element to be ready
    const timerId = setTimeout(() => {
      if (isMounted) startCamera();
    }, 100);

    return () => {
      isMounted = false;
      clearTimeout(timerId);
      if (scannerRef.current) {
        try {
          // Attempt to stop first, if it fails (not scanning), fallback to clear
          scannerRef.current.stop().then(() => {
            scannerRef.current?.clear();
          }).catch(() => {
            try {
              scannerRef.current?.clear();
            } catch (e) {
              // Ignore clear errors
            }
          });
        } catch (e) {
          console.error("Error during scanner cleanup", e);
        }
      }
    };
  }, [fps, qrbox, formatsToSupport, onScanSuccess, onScanFailure]);

  return (
    <div id={`${id}-wrapper`} className={cn("flex flex-col items-center w-full animate-in fade-in duration-DurationMid", className)}>
      <div 
        id={`${id}-container-outer`}
        className={cn(
          "w-full max-w-ContainerXs rounded-RadiusLarge overflow-hidden shadow-ElevationMid relative min-h-height-ContainerXs border border-ColorTertiary/opacity-OpacitySubtle",
          hasPermission === false ? "bg-ColorBgSecondary" : "bg-TextColorBase"
        )}
      >
        {/* Empty container for html5-qrcode. */}
        <div id={containerId} className="w-full h-full absolute inset-0" />

        {/* Overlays */}
        {!isScanning && hasPermission !== false && (
          <div 
            id={`${id}-requesting-overlay`} 
            className="absolute inset-0 flex flex-col items-center justify-center text-White p-SpacingBase text-center pointer-events-none z-ZRaised bg-TextColorBase/opacity-OpacityMid backdrop-blur-md"
          >
            <Camera id={`${id}-camera-icon`} className="w-spacing-SpacingHuge h-spacing-SpacingHuge mb-SpacingBase animate-pulse text-ColorPrimary" />
            <p id={`${id}-requesting-text`} className="text-FontSizeBase font-bold tracking-tight">Meminta Akses Kamera...</p>
            <p id={`${id}-requesting-desc`} className="text-FontSizeNano text-White/opacity-OpacitySubtle mt-SpacingNano">Harap izinkan akses kamera pada peramban Anda</p>
          </div>
        )}
        
        {hasPermission === false && (
          <div id={`${id}-denied-overlay`} className="absolute inset-0 flex flex-col items-center justify-center text-TextColorMuted p-SpacingLarge text-center z-ZRaised bg-ColorBg">
            <AlertCircle id={`${id}-error-icon`} className="w-12 h-12 mb-SpacingMedium text-FeedbackColorError animate-bounce" />
            <h3 id={`${id}-denied-title`} className="font-bold text-TextColorBase text-FontSizeBase mb-SpacingTiny">Akses Kamera Ditolak</h3>
            <p id={`${id}-denied-desc`} className="text-FontSizeSm leading-LineHeightRelaxed mb-SpacingMedium">{errorMsg}</p>
            <div className="w-full px-SpacingLarge">
              <p className="text-FontSizeNano text-TextColorMuted bg-ColorBgSecondary p-SpacingSmall rounded-RadiusMedium border border-ColorSidebarBorder/opacity-OpacitySubtle">
                Pastikan Anda telah memberikan izin kamera dan kamera tidak digunakan oleh aplikasi lain.
              </p>
            </div>
          </div>
        )}

        {/* Framing Guide for the user */}
        {isScanning && (
          <div id={`${id}-frame-guide`} className="absolute inset-0 pointer-events-none border-spacing-SpacingExtraHuge border-TextColorBase/opacity-OpacityMid flex items-center justify-center">
            <div className="w-48 h-48 border-BorderMedium border-ColorPrimary rounded-RadiusLarge animate-pulse shadow-ElevationHigh" />
          </div>
        )}
      </div>
      <div id={`${id}-footer-info`} className="mt-SpacingSmall text-center">
        <p className="text-FontSizeNano text-TextColorMuted font-medium">
          Arahkan kamera ke Kode QR atau Barcode
        </p>
      </div>
    </div>
  );
};
