import React, { useRef, useState, useEffect, useCallback } from 'react';
import { cn } from '../../../logic/utils/cn';
import { Button } from './Button';
import { Eraser, Maximize, Minimize, X } from 'lucide-react';
import { useGlobalState } from '../../../logic/context/GlobalContext';
import { tokens } from '../../styles/tokens';

interface CanvasInputProps {
  className?: string;
  onChange?: (dataUrl: string) => void;
  height?: number;
}

export const SignatureInput = React.forwardRef<HTMLDivElement, CanvasInputProps>(({ className, onChange, height = 200 }, ref) => {
  const { state } = useGlobalState();
  const theme = state.theme;
  const isMobile = state.viewport.isMobile;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Initial and Resize Setup
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (rect) {
        // Save current content if any
        let currentData = "";
        try {
          currentData = canvas.toDataURL();
        } catch (e) {
          console.warn("Canvas is tainted or empty", e);
        }
        
        canvas.width = rect.width;
        canvas.height = isFullscreen ? rect.height : height;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = theme === 'dark' ? '#121212' : '#ffffff'; // Fallback for raw canvas drawing
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.lineWidth = 2;
          ctx.lineCap = 'round';
          ctx.strokeStyle = theme === 'dark' ? '#f5f5f5' : '#171717';
          
          // Restore content if it wasn't a clean canvas
          if (currentData && currentData !== "data:,") {
            const img = new Image();
            img.onload = () => ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            img.src = currentData;
          }
        }
      }
    }
  }, [isFullscreen, height, theme]);

  useEffect(() => {
    initCanvas();
    window.addEventListener('resize', initCanvas);
    return () => window.removeEventListener('resize', initCanvas);
  }, [initCanvas]);

  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
      window.scrollTo(0, 0);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isFullscreen]);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    }
    return {
      x: (e as React.MouseEvent).clientX - rect.left,
      y: (e as React.MouseEvent).clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDrawing(true);
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      const canvas = canvasRef.current;
      if (canvas && onChange) {
        onChange(canvas.toDataURL('image/png'));
      }
    }
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = theme === 'dark' ? '#121212' : '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      if (onChange) onChange('');
    }
  };

  return (
    <div ref={ref} className={cn("flex flex-col gap-SpacingTiny w-full", isFullscreen && "fixed inset-0 !z-[999999] bg-ColorBg p-SpacingBase", className)}>
      {isFullscreen && (
        <div className="flex justify-between items-center mb-SpacingTiny">
           <h3 className="font-bold text-FontSizeH4 text-TextColorBase">Input Tanda Tangan</h3>
           <Button id="signature-close-btn" variant="ghost" size="icon" onClick={() => setIsFullscreen(false)}>
              <X id="signature-close-icon" size={20} />
           </Button>
        </div>
      )}
      <div 
        id="signature-canvas-container"
        ref={containerRef}
        className={cn(
          "relative border border-ColorSidebarBorder/opacity-OpacityMuted rounded-RadiusSmall overflow-hidden bg-ColorBg touch-none shadow-ElevationLow transition-colors group",
          !isFullscreen && "hover:border-ColorPrimary",
          isFullscreen ? "flex-1" : ""
        )}
        style={!isFullscreen ? { height } : undefined}
      >
        {!isFullscreen && (
          <div 
            className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/5 hover:bg-black/10 transition-all cursor-pointer backdrop-blur-[1px]"
            onClick={() => setIsFullscreen(true)}
          >
             <div className="bg-white p-3 rounded-full shadow-md mb-2 group-hover:scale-110 transition-transform">
               <Maximize size={20} className="text-ColorPrimary" />
             </div>
             <span className="font-bold text-FontSizeSm text-TextColorBase">Klik untuk Tanda Tangan</span>
             <span className="text-FontSizeNano text-TextColorMuted mt-1">(Mode Layar Penuh)</span>
          </div>
        )}
        <canvas
          id="signature-canvas"
          ref={canvasRef}
          className="w-full h-full cursor-crosshair block"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        {isFullscreen && (
          <div className="absolute top-SpacingSmall right-SpacingSmall flex gap-SpacingTiny z-20">
            <button 
              id="signature-toggle-fullscreen"
              type="button"
              onClick={() => setIsFullscreen(false)}
              className="p-SpacingTiny bg-ColorBg/opacity-OpacityOpaque hover:bg-ColorBgSecondary rounded-RadiusSmall border border-ColorSidebarBorder/opacity-OpacitySubtle shadow-ElevationLow text-TextColorMuted hover:text-TextColorBase transition-all active:scale-TransformShrink"
            >
              <Minimize id="signature-minimize-icon" size={16} />
            </button>
          </div>
        )}
      </div>
      <div id="signature-actions" className="flex justify-end gap-SpacingTiny">
        <Button id="signature-clear-btn" variant="outline" size="sm" onClick={clear} className={cn("font-bold", isMobile ? "text-FontSizeNano" : "text-FontSizeSm")}>
          <Eraser id="signature-clear-icon" className="w-spacing-SpacingBase h-spacing-SpacingBase mr-SpacingTiny" /> Bersihkan
        </Button>
        {isFullscreen && (
          <Button id="signature-done-btn" variant="default" size="sm" onClick={() => setIsFullscreen(false)} className={cn("font-extrabold", isMobile ? "text-FontSizeNano" : "text-FontSizeSm")}>
            Selesai
          </Button>
        )}
      </div>
    </div>
  );
});
SignatureInput.displayName = "SignatureInput";

export const DrawingInput = SignatureInput; // For now they can be structurally identical, or drawing could add color/brush size.
