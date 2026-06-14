import React, { useRef, useState, useEffect, useCallback } from 'react';
import { cn } from '../../../logic/utils/cn';
import { Button } from './Button';
import { 
  Pencil, 
  Paintbrush, 
  Eraser, 
  RotateCcw, 
  Save, 
  Maximize, 
  Minimize, 
  X, 
  Download,
  Trash2,
  Layers
} from 'lucide-react';
import { useGlobalState } from '../../../logic/context/GlobalContext';
import { tokens } from '../../styles/tokens';

interface ImageAnnotatorProps {
  className?: string;
  imageUrl?: string;
  onChange?: (dataUrl: string) => void;
  onSave?: (dataUrl: string) => void;
  height?: number;
}

export const ImageAnnotator = React.forwardRef<HTMLDivElement, ImageAnnotatorProps & { id?: string }>(({ 
  className, 
  imageUrl: initialImageUrl, 
  onChange, 
  onSave,
  height = 400,
  id = "image-annotator"
}, ref) => {
  const { state } = useGlobalState();
  const theme = state.theme;
  const isMobile = state.viewport.isMobile;
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  const drawCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [imageUrl, setImageUrl] = useState<string | null>(initialImageUrl || null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<'pen' | 'brush' | 'eraser'>('pen');
  const [color, setColor] = useState('#ff0000');
  const [size, setSize] = useState(3);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [history, setHistory] = useState<string[]>([]);

  // Sync body overflow when fullscreen
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

  // Initialize and handle image loading
  const initCanvases = useCallback(() => {
    const bgCanvas = bgCanvasRef.current;
    const drawCanvas = drawCanvasRef.current;
    if (!bgCanvas || !drawCanvas) return;
    const bgCtx = bgCanvas.getContext('2d');
    const drawCtx = drawCanvas.getContext('2d');
    if (!bgCtx || !drawCtx) return;

    if (imageUrl) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const containerWidth = bgCanvas.parentElement?.clientWidth || bgCanvas.width;
        const containerHeight = isFullscreen ? window.innerHeight - 120 : height;
        
        const scale = Math.min(containerWidth / img.width, containerHeight / img.height);
        const w = img.width * scale;
        const h = img.height * scale;

        bgCanvas.width = w;
        bgCanvas.height = h;
        drawCanvas.width = w;
        drawCanvas.height = h;
        
        bgCtx.drawImage(img, 0, 0, w, h);
        
        // Clear drawing canvas but keep dimensions
        drawCtx.clearRect(0, 0, w, h);
        saveHistory();
      };
      img.src = imageUrl;
    } else {
      const w = bgCanvas.parentElement?.clientWidth || 600;
      const h = height;
      bgCanvas.width = w;
      bgCanvas.height = h;
      drawCanvas.width = w;
      drawCanvas.height = h;
      
      bgCtx.fillStyle = theme === 'dark' ? '#121212' : '#ffffff';
      bgCtx.fillRect(0, 0, w, h);
      
      drawCtx.clearRect(0, 0, w, h);
      saveHistory();
    }
  }, [imageUrl, height, isFullscreen, theme]);

  useEffect(() => {
    initCanvases();
  }, [initCanvases]);

  const saveHistory = () => {
    const canvas = drawCanvasRef.current;
    if (canvas) {
      const data = canvas.toDataURL();
      setHistory(prev => [...prev.slice(-19), data]);
    }
  };

  const undo = () => {
    if (history.length <= 1) return;
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const newHistory = [...history];
    newHistory.pop();
    const prevState = newHistory[newHistory.length - 1];
    
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      setHistory(newHistory);
    };
    img.src = prevState;
  };

  const clear = () => {
    if (window.confirm("Apakah Anda yakin ingin menghapus semua coretan?")) {
      const drawCanvas = drawCanvasRef.current;
      if (drawCanvas) {
        const ctx = drawCanvas.getContext('2d');
        ctx?.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
        saveHistory();
      }
    }
  };

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (!imageUrl) return; // Prevent drawing if no image uploaded
    e.preventDefault();
    setIsDrawing(true);
    const { x, y } = getCoordinates(e);
    const ctx = drawCanvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineWidth = tool === 'brush' ? size * 2 : size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
      ctx.strokeStyle = color;
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const { x, y } = getCoordinates(e);
    const ctx = drawCanvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      saveHistory();
      if (onChange) {
        onChange(getMergedDataUrl());
      }
    }
  };

  const getMergedDataUrl = (): string => {
    const bgCanvas = bgCanvasRef.current;
    const drawCanvas = drawCanvasRef.current;
    if (!bgCanvas || !drawCanvas) return '';

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = bgCanvas.width;
    tempCanvas.height = bgCanvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return '';

    tempCtx.drawImage(bgCanvas, 0, 0);
    tempCtx.drawImage(drawCanvas, 0, 0);
    return tempCanvas.toDataURL('image/png');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImageUrl(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (onSave) {
      onSave(getMergedDataUrl());
    }
  };

  const download = () => {
    const link = document.createElement('a');
    link.download = 'annotation.png';
    link.href = getMergedDataUrl();
    link.click();
  };

  const containerClasses = cn(
    "flex flex-col bg-ColorBg border border-ColorSidebarBorder/opacity-OpacitySubtle rounded-RadiusSmall overflow-hidden transition-all shadow-ElevationLow",
    isFullscreen ? "fixed inset-0 z-ZTopmost rounded-none h-dvh w-screen" : "w-full",
    className
  );

  return (
    <div id={id} ref={ref} className={containerClasses}>
      {/* Toolbar */}
      <div id={`${id}-toolbar`} className={cn("flex flex-wrap items-center justify-between border-b border-ColorSidebarBorder/opacity-OpacitySubtle bg-ColorBgSecondary", isMobile ? "p-SpacingTiny gap-SpacingNano" : "p-SpacingSmall gap-SpacingTiny")}>
        <div id={`${id}-tools`} className={cn("flex items-center", isMobile ? "gap-SpacingNano" : "gap-SpacingTiny")}>
          <div id={`${id}-tool-group`} className="flex rounded-RadiusSmall border border-ColorSidebarBorder/opacity-OpacitySubtle overflow-hidden shadow-ElevationLow">
            <button 
              id={`${id}-tool-pen`}
              type="button"
              onClick={() => setTool('pen')}
              className={cn("p-SpacingTiny transition-all duration-DurationFast", tool === 'pen' ? "bg-ColorPrimary text-White font-bold" : "bg-ColorBg text-TextColorBase hover:bg-ColorSidebarAccent")}
              title="Pena"
            >
              <Pencil id={`${id}-pen-icon`} size="1.125rem" />
            </button>
            <button 
              id={`${id}-tool-brush`}
              type="button"
              onClick={() => setTool('brush')}
              className={cn("p-SpacingTiny border-l border-ColorSidebarBorder/opacity-OpacitySubtle transition-all duration-DurationFast", tool === 'brush' ? "bg-ColorPrimary text-White font-bold" : "bg-ColorBg text-TextColorBase hover:bg-ColorSidebarAccent")}
              title="Kuas"
            >
              <Paintbrush id={`${id}-brush-icon`} size="1.125rem" />
            </button>
            <button 
              id={`${id}-tool-eraser`}
              type="button"
              onClick={() => setTool('eraser')}
              className={cn("p-SpacingTiny border-l border-ColorSidebarBorder/opacity-OpacitySubtle transition-all duration-DurationFast", tool === 'eraser' ? "bg-ColorPrimary text-White font-bold" : "bg-ColorBg text-TextColorBase hover:bg-ColorSidebarAccent")}
              title="Penghapus"
            >
              <Eraser id={`${id}-eraser-icon`} size="1.125rem" />
            </button>
          </div>

          <div id={`${id}-settings`} className="flex items-center gap-SpacingSmall ml-SpacingTiny px-SpacingSmall border-l border-ColorSidebarBorder/opacity-OpacityMuted">
            <input 
              id={`${id}-color-input`}
              type="color" 
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-8 h-8 rounded-RadiusSmall cursor-pointer border-none p-0 bg-transparent flex-shrink-0 shadow-ElevationLow active:scale-TransformShrink transition-transform"
              title="Warna"
            />
            <div id={`${id}-size-wrapper`} className="flex items-center gap-SpacingNano">
              <input 
                id={`${id}-size-slider`}
                type="range" 
                min="1" 
                max="20" 
                value={size}
                onChange={(e) => setSize(parseInt(e.target.value))}
                className="w-20 accent-ColorPrimary cursor-pointer"
                title="Ukuran"
              />
            </div>
          </div>
        </div>

        <div id={`${id}-actions`} className="flex items-center gap-SpacingNano">
          <Button id={`${id}-undo-btn`} type="button" variant="ghost" size="icon" onClick={undo} disabled={history.length <= 1} title="Batal">
            <RotateCcw id={`${id}-undo-icon`} size="1.125rem" />
          </Button>
          <Button id={`${id}-clear-btn`} type="button" variant="ghost" size="icon" onClick={clear} className="text-FeedbackColorError hover:bg-FeedbackColorError/opacity-OpacitySubtle" title="Bersihkan">
            <Trash2 id={`${id}-clear-icon`} size="1.125rem" />
          </Button>
          <Button id={`${id}-fullscreen-btn`} type="button" variant="ghost" size="icon" onClick={() => setIsFullscreen(!isFullscreen)} title={isFullscreen ? "Kecilkan" : "Layar Penuh"}>
            {isFullscreen ? <Minimize id={`${id}-minimize-icon`} size="1.125rem" /> : <Maximize id={`${id}-maximize-icon`} size="1.125rem" />}
          </Button>
          <div id={`${id}-divider`} className="mx- spacing-SpacingTiny h-6 w-px bg-ColorSidebarBorder/opacity-OpacityMuted" />
          <Button id={`${id}-upload-btn`} type="button" variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} title="Unggah">
            <Layers id={`${id}-layers-icon`} size="1.125rem" />
          </Button>
          <Button id={`${id}-download-btn`} type="button" variant="ghost" size="icon" onClick={download} title="Unduh">
            <Download id={`${id}-download-icon`} size="1.125rem" />
          </Button>
          {onSave && (
            <Button id={`${id}-save-btn`} type="button" variant="default" size="icon" onClick={handleSave} className="ml-SpacingNano font-bold shadow-ElevationMid" title="Simpan">
              <Save id={`${id}-save-icon`} size="1rem" />
            </Button>
          )}
          {isFullscreen && (
             <Button id={`${id}-close-btn`} type="button" variant="ghost" size="icon" onClick={() => setIsFullscreen(false)} className="ml-SpacingNano">
                <X id={`${id}-close-icon`} size="1.125rem" />
             </Button>
          )}
        </div>
      </div>

      <div id={`${id}-viewport`} className="flex-1 relative bg-ColorBgSecondary flex items-center justify-center p-SpacingBase overflow-auto min-h-0">
        {!imageUrl && !isFullscreen && (
          <div 
            id={`${id}-upload-prompt`}
            onClick={() => fileInputRef.current?.click()}
            className="absolute inset-0 z-ZAbove flex flex-col items-center justify-center bg-TextColorBase/opacity-OpacitySubtle hover:bg-TextColorBase/opacity-OpacityMuted cursor-pointer transition-all duration-DurationMid group"
          >
            <div id={`${id}-upload-icon-wrapper`} className="p-SpacingBase rounded-RadiusFull bg-ColorBg shadow-ElevationLow mb-SpacingTiny text-ColorPrimary group-hover:scale-TransformGrow transition-transform">
              <Download id={`${id}-prompt-icon`} className="rotate-180" size="2rem" />
            </div>
            <span id={`${id}-prompt-text`} className="text-FontSizeSm font-extrabold text-TextColorBase">Klik atau Taruh Gambar di Sini</span>
            <span id={`${id}-prompt-subtext`} className="text-FontSizeNano text-TextColorMuted mt-SpacingNano font-bold">Mendukung PNG, JPG, GIF</span>
          </div>
        )}

        {imageUrl && (
          <button 
            id={`${id}-remove-img-btn`}
            type="button"
            onClick={() => {
              if (window.confirm("Hapus gambar ini?")) {
                setImageUrl(null);
                setHistory([]);
              }
            }}
            className="absolute top-SpacingLarge right-SpacingLarge z-ZTopmost p-SpacingTiny bg-ColorBg/opacity-OpacityOpaque hover:bg-ColorBg rounded-RadiusFull shadow-ElevationMid text-FeedbackColorError transition-all hover:scale-TransformGrow active:scale-TransformShrink"
            title="Hapus"
          >
            <X id={`${id}-remove-icon`} size="1.25rem" />
          </button>
        )}

        <div id={`${id}-canvas-container`} className="relative shadow-ElevationHigh bg-ColorBg rounded-RadiusSmall overflow-hidden">
          <canvas
            id={`${id}-bg-canvas`}
            ref={bgCanvasRef}
            className="block"
          />
          <canvas
            id={`${id}-draw-canvas`}
            ref={drawCanvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            onClick={() => {
              if (!imageUrl) fileInputRef.current?.click();
            }}
            className={cn(
              "absolute inset-0 z-ZAbove touch-none transition-opacity",
              imageUrl ? "cursor-crosshair" : "cursor-pointer"
            )}
          />
        </div>
        
        <input 
          id={`${id}-file-input`}
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*" 
          onChange={handleFileUpload} 
        />
      </div>
    </div>
  );
});
ImageAnnotator.displayName = "ImageAnnotator";
