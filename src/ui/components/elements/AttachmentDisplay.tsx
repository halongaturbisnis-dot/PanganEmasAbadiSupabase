import React from 'react';
import { FileText, Paperclip, ExternalLink, Eye } from 'lucide-react';
import { cn } from '../../../logic/utils/cn';

interface AttachmentFile {
  url: string;
  name?: string;
}

interface AttachmentDisplayProps {
  files?: AttachmentFile[];
  id?: string;
  className?: string;
  emptyText?: string;
}

/**
 * ATTACHMENT DISPLAY
 * Reusable component for displaying read-only file attachments.
 * Pair this with MultipleUploadInput for a consistent UI/UX.
 */
export const AttachmentDisplay: React.FC<AttachmentDisplayProps> = ({
  files = [],
  id = 'attachment-display',
  className,
  emptyText = 'Tidak ada data'
}) => {
  if (!files || files.length === 0) {
    return (
      <div 
        id={`${id}-empty`}
        className={cn(
          "flex flex-col items-center justify-center p-8 border border-dashed border-ColorSidebarBorder/20 rounded-RadiusLarge bg-Slate50/30 text-TextColorMuted w-full",
          className
        )}
      >
        <Paperclip size={32} className="opacity-20 mb-2" />
        <p className="text-FontSizeNano font-bold uppercase tracking-wider">{emptyText}</p>
      </div>
    );
  }

  return (
    <div id={id} className={cn("grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4", className)}>
      {files.map((file, idx) => {
        const isImage = file.url.toLowerCase().match(/\.(jpeg|jpg|gif|png|webp)/i) || file.url.includes('data:image');
        
        return (
          <div 
            key={`${id}-item-${idx}`}
            className="group relative bg-white border border-ColorSidebarBorder/10 rounded-RadiusSmall overflow-hidden hover:shadow-md transition-all aspect-square flex flex-col cursor-pointer"
            onClick={() => window.open(file.url, '_blank')}
          >
            <div className="flex-1 bg-Slate50 flex items-center justify-center overflow-hidden">
              {isImage ? (
                <img 
                  src={file.url} 
                  alt={file.name || `Lampiran ${idx + 1}`} 
                  className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-200" 
                />
              ) : (
                <FileText size={40} className="text-ColorPrimary/40" />
              )}
              
              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-Black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="bg-White/20 p-2 rounded-full backdrop-blur-sm">
                  <Eye size={20} className="text-White" />
                </div>
              </div>
            </div>
            
            <div className="p-1 px-2 flex items-center justify-between bg-White border-t border-Slate100">
              <span className="text-[10px] font-bold text-TextColorBase truncate pr-1">
                {file.name || `Berkas ${idx + 1}`}
              </span>
              <ExternalLink size={10} className="text-ColorPrimary shrink-0" />
            </div>
          </div>
        );
      })}
    </div>
  );
};
