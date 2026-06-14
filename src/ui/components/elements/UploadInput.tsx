import React, { useRef, useState, useEffect } from 'react';
import { cn } from '../../../logic/utils/cn';
import { UploadCloud, File as FileIcon, Trash2, Eye, Image as ImageIcon, Loader2, Plus, X } from 'lucide-react';
import { Button, GhostButton } from './Button';
import { getPdfInstantThumbnail, getDocThumbnail, formatFileSize } from '../../../logic/utils/file';
import { processFileBeforeUpload } from '../../../logic/utils/fileProcessor';
import { useGlobalState } from '../../../logic/context/GlobalContext';
import { toast } from 'react-hot-toast';

export interface UploadInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onFileSelect?: (file: File | null) => void;
  accept?: string;
  label?: string;
}

export const UploadFileImageInput = React.forwardRef<HTMLDivElement, UploadInputProps>(({ className, onFileSelect, accept, label, id = "upload-input", ...props }, ref) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    if (onFileSelect) onFileSelect(selectedFile);

    if (selectedFile) {
      if (selectedFile.type.startsWith('image/')) {
        const url = URL.createObjectURL(selectedFile);
        setPreview(url);
      } else if (selectedFile.type === 'application/pdf') {
        setPreview(getPdfInstantThumbnail());
      } else {
        const ext = selectedFile.name.split('.').pop() || '';
        setPreview(getDocThumbnail(ext));
      }
    } else {
      setPreview(null);
    }
  };

  const clearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFile(null);
    setPreview(null);
    if (inputRef.current) inputRef.current.value = '';
    if (onFileSelect) onFileSelect(null);
  };

  return (
    <div ref={ref} id={id} className={cn("w-full", className)}>
      <input 
        id={`${id}-file-native`}
        type="file" 
        ref={inputRef} 
        onChange={handleFileChange} 
        className="hidden" 
        accept={accept}
        {...props} 
      />
      {!file ? (
        <div 
          id={`${id}-dropzone`}
          onClick={() => inputRef.current?.click()}
          className="w-full flex flex-col items-center justify-center p-SpacingLarge border-2 border-dashed border-ColorSidebarBorder/opacity-OpacityMuted rounded-RadiusMedium bg-ColorPrimary/opacity-OpacitySubtle hover:bg-ColorPrimary/opacity-OpacityMuted cursor-pointer transition-all"
        >
          <UploadCloud id={`${id}-upload-icon`} className="w-8 h-8 text-ColorPrimary mb-SpacingTiny" />
          <p id={`${id}-prompt`} className="text-FontSizeSm text-TextColorMuted font-black">{label || "Klik atau Seret Berkas ke Sini"}</p>
        </div>
      ) : (
        <div id={`${id}-preview-card`} className="relative w-full p-SpacingSmall border border-ColorSidebarBorder/opacity-OpacitySubtle rounded-RadiusSmall bg-ColorBg flex items-center gap-SpacingBase shadow-ElevationLow group animate-in slide-in-from-top-1 duration-DurationMid">
          <div id={`${id}-info-group`} className="flex items-center gap-SpacingBase flex-1 min-w-0">
            {preview ? (
              <div className="relative w-14 h-14 shrink-0 rounded-RadiusSmall overflow-hidden border border-Slate200 shadow-sm">
                <img id={`${id}-preview-img`} src={preview} alt="Preview" className="w-full h-full object-cover" />
                <div className="absolute bottom-0 left-0 right-0 bg-Black/60 flex items-center justify-center gap-2 py-0.5 animate-in fade-in duration-DurationSlow">
                  <button 
                    type="button"
                    onClick={(e) => { e.stopPropagation(); if (file) window.open(URL.createObjectURL(file), '_blank'); }}
                    className="text-White hover:scale-110 transition-all p-0.5"
                  >
                    <Eye size={12} />
                  </button>
                  <div className="w-px h-3 bg-White/20" />
                  <button 
                    type="button"
                    onClick={clearFile}
                    className="text-White hover:text-FeedbackColorError hover:scale-110 transition-all p-0.5"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ) : (
              <div id={`${id}-file-icon-box`} className="w-14 h-14 shrink-0 rounded-RadiusSmall bg-ColorPrimary/opacity-OpacitySubtle flex items-center justify-center text-ColorPrimary border border-ColorPrimary/20">
                <FileIcon id={`${id}-file-icon`} className="w-6 h-6" />
              </div>
            )}
            <div id={`${id}-text-info`} className="flex-1 min-w-0">
              <p id={`${id}-file-name`} className="text-FontSizeSm font-black text-TextColorBase truncate">{file.name}</p>
              <p id={`${id}-file-size`} className="text-FontSizeXs text-TextColorMuted font-bold">{formatFileSize(file.size)}</p>
            </div>
          </div>
          
          <button 
            type="button"
            onClick={clearFile}
            className="absolute top-1 right-1 p-1 text-TextColorMuted hover:text-FeedbackColorError transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
});
UploadFileImageInput.displayName = "UploadFileImageInput";

interface MultipleUploadInputProps {
  onFilesChange: (files: File[]) => void;
  onRemoveInitialUrl?: (url: string) => void;
  id?: string;
  initialUrls?: string[];
  maxFiles?: number;
  disabled?: boolean;
}

interface FileWithMetadata {
  id: string;
  file?: File;
  preview: string;
  isProcessing: boolean;
  isExisting?: boolean;
}

/**
 * MULTIPLE UPLOAD INPUT
 * Component for handling multiple file uploads with compression and preview.
 * Companion: Use AttachmentDisplay.tsx for read-only display of these attachments.
 */
export const MultipleUploadInput: React.FC<MultipleUploadInputProps> = ({ 
  onFilesChange, 
  onRemoveInitialUrl,
  id = "multi-upload", 
  initialUrls = [],
  maxFiles = 5,
  disabled = false
}) => {
  const [items, setItems] = useState<FileWithMetadata[]>([]);
  const initializedRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialUrls.length > 0 && !initializedRef.current) {
      const initialItems: FileWithMetadata[] = initialUrls.map((url, idx) => ({
        id: `existing-${idx}-${url}`,
        preview: url,
        isProcessing: false,
        isExisting: true
      }));
      setItems(initialItems);
      initializedRef.current = true;
    }
  }, [initialUrls]);

  // Sync back to parent
  const onFilesChangeRef = useRef(onFilesChange);
  useEffect(() => {
    onFilesChangeRef.current = onFilesChange;
  }, [onFilesChange]);

  useEffect(() => {
    const readyFiles = items
      .filter(f => !f.isProcessing && !f.isExisting)
      .map(f => f.file!);
    
    // Only call if we have processing finished items
    if (items.some(i => i.isProcessing)) return;
    
    onFilesChangeRef.current(readyFiles);
  }, [items]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const selectedFiles = Array.from(e.target.files || []) as File[];
    if (selectedFiles.length === 0) return;

    if (items.length + selectedFiles.length > maxFiles) {
      toast.error(`Maksimal ${maxFiles} file diperbolehkan`);
      return;
    }

    const newItems: FileWithMetadata[] = selectedFiles.map(f => ({
      id: Math.random().toString(36).substr(2, 9),
      file: f,
      preview: '',
      isProcessing: true
    }));

    setItems(prev => [...prev, ...newItems]);

    // Process files in background
    const processedItems = await Promise.all(newItems.map(async (item) => {
      try {
        const processedFile = await processFileBeforeUpload(item.file!);
        let preview = '';
        if (processedFile.type.startsWith('image/')) {
          preview = URL.createObjectURL(processedFile);
        } else if (processedFile.type === 'application/pdf') {
          preview = getPdfInstantThumbnail();
        } else {
          const ext = processedFile.name.split('.').pop() || '';
          preview = getDocThumbnail(ext);
        }

        return {
          ...item,
          file: processedFile,
          preview,
          isProcessing: false
        } as FileWithMetadata;
      } catch (err: any) {
        toast.error(err.message || 'Gagal memproses file');
        return null;
      }
    }));

    setItems(prev => {
      const updated = prev.map(p => {
        const found = (processedItems.filter(i => i !== null) as FileWithMetadata[]).find(f => f.id === p.id);
        return found ? found : p;
      });
      
      return updated.filter(u => !u.isProcessing || newItems.find(n => n.id === u.id));
    });
    
    if (inputRef.current) inputRef.current.value = '';
  };

  const removeItem = (itemId: string) => {
    if (disabled) return;
    const itemToRemove = items.find(i => i.id === itemId);
    if (itemToRemove?.isExisting && onRemoveInitialUrl) {
      onRemoveInitialUrl(itemToRemove.preview);
    }

    setItems(prev => prev.filter(i => i.id !== itemId));
  };

  const hasItems = items.length > 0;

  return (
    <div id={id} className={cn("w-full space-y-SpacingSmall h-full flex flex-col", disabled && "opacity-50 cursor-not-allowed")}>
      <input 
        type="file" 
        multiple 
        ref={inputRef} 
        onChange={handleFileChange} 
        className="hidden" 
        accept="image/*,application/pdf"
        disabled={disabled}
      />

      {!hasItems ? (
        <div 
          id={`${id}-trigger`}
          onClick={() => !disabled && items.length < maxFiles && inputRef.current?.click()}
          className={cn(
            "w-full flex-1 min-h-[5.5rem] flex flex-col items-center justify-center p-SpacingMedium border-2 border-dashed rounded-RadiusMedium transition-all",
            disabled ? "border-Slate200 bg-transparent cursor-not-allowed" : 
            items.length < maxFiles 
              ? "border-ColorSidebarBorder/opacity-OpacityMuted bg-transparent hover:bg-ColorPrimary/5 cursor-pointer" 
              : "border-Slate200 bg-transparent opacity-50 cursor-not-allowed"
          )}
        >
          <UploadCloud className="w-8 h-8 text-ColorPrimary mb-SpacingTiny" />
          <p className="text-FontSizeSm text-TextColorMuted font-bold">
            {disabled ? "Input Dinonaktifkan" : items.length >= maxFiles ? `Limit ${maxFiles} file tercapai` : "Tambah Bukti"}
          </p>
          {!disabled && <p className="text-FontSizeNano text-TextColorMuted/70 mt-1">Hanya JPG, PNG, atau PDF</p>}
        </div>
      ) : (
        <div className={cn(
          "relative w-full min-h-[5.5rem] flex-1 p-SpacingSmall bg-transparent border border-ColorSidebarBorder/opacity-OpacitySubtle border-dashed rounded-RadiusMedium animate-in fade-in duration-DurationMid",
          disabled && "border-solid"
        )}>
          {items.length < maxFiles && !disabled && (
            <div className="absolute right-SpacingSmall top-SpacingSmall z-ZRaised">
              <GhostButton 
                id={`${id}-add-more`}
                size="icon" 
                className="h-8 w-8 rounded-RadiusFull shadow-ElevationLow bg-White hover:bg-ColorPrimary hover:text-White transition-all"
                onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
              >
                <Plus size={16} />
              </GhostButton>
            </div>
          )}

          <div id={`${id}-grid`} className="flex flex-wrap gap-SpacingTiny content-start">
            {items.map((item) => (
              <div 
                key={item.id} 
                className="relative w-16 h-16 group rounded-RadiusSmall overflow-hidden transition-all shrink-0 flex items-center justify-center"
              >
                {item.isProcessing ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-White/80">
                    <Loader2 className="w-5 h-5 text-ColorPrimary animate-spin" />
                  </div>
                ) : (
                  <>
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100/30 text-TextColorMuted p-SpacingTiny text-center overflow-hidden">
                       {(item.preview.includes('data:image') || (item.preview.includes('http') && !item.preview.toLowerCase().includes('.pdf') && !item.preview.toLowerCase().includes('/pdf'))) ? (
                         <img src={item.preview} alt="Thumbnail" className="w-full h-full object-cover" />
                       ) : (
                         <div className="flex flex-col items-center">
                           <FileIcon size={24} className="mb-0.5 text-ColorPrimary opacity-60" />
                           <span className="text-[0.4rem] font-bold truncate max-w-full uppercase opacity-40">
                             Berkas {items.indexOf(item) + 1}
                           </span>
                         </div>
                       )}
                    </div>

                    <div className={cn(
                      "absolute inset-0 bg-Black/40 opacity-0 transition-opacity flex items-center justify-center gap-2",
                      !disabled && "group-hover:opacity-100"
                    )}>
                       <button 
                         type="button"
                         onClick={() => {
                           if (item.isExisting) {
                             window.open(item.preview, '_blank');
                           } else if (item.file) {
                             window.open(URL.createObjectURL(item.file), '_blank');
                           }
                         }}
                         className="text-White hover:scale-125 transition-transform p-1"
                       >
                         <Eye size={16} />
                       </button>
                       {!disabled && (
                         <>
                           <div className="w-px h-4 bg-White/40" />
                           <button 
                             type="button"
                             onClick={() => removeItem(item.id)}
                             className="text-White hover:text-FeedbackColorError hover:scale-125 transition-transform p-1"
                           >
                             <Trash2 size={16} />
                           </button>
                         </>
                       )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
          
          <div className="mt-SpacingSmall px-1 flex items-center justify-between">
             <span className="text-[0.65rem] font-bold text-TextColorMuted opacity-60">
               {items.length} file terlampir
             </span>
          </div>
        </div>
      )}
    </div>
  );
};


