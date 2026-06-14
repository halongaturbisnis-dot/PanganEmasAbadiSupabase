import { tokens } from '../../ui/styles/tokens';

/**
 * UTILS/FILE.TS
 * A refined suite of pure utility functions for file validation and formatting.
 */

// 2. MaxSize: Check if file size is below limit (in MB)
export const isWithinMaxSize = (file: File, maxSizeMB: number): boolean => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
};

// 3. Extension: Check if file extension is allowed
export const isValidExtension = (file: File, allowedExtensions: string[]): boolean => {
  const fileName = file.name.toLowerCase();
  return allowedExtensions.some(ext => {
    const periodExt = ext.startsWith('.') ? ext.toLowerCase() : `.${ext.toLowerCase()}`;
    return fileName.endsWith(periodExt);
  });
};

// 4. Filename Sanitizer: Clean up characters to avoid storage/URL errors (Kebab-case)
export const sanitizeFilename = (filename: string): string => {
  const parts = filename.split('.');
  const ext = parts.pop();
  const base = parts.join('.');
  
  const sanitized = base
    .toLowerCase()
    .replace(/[^\w\s-]/gi, '') // Remove symbols and emojis
    .trim()
    .replace(/\s+/g, '-')     // Spaces to hyphens
    .replace(/-+/g, '-')      // Multiple hyphens to single
    .replace(/^-|-$/g, '');   // Trim hyphens from ends
    
  return `${sanitized}.${ext}`;
};

// 5. File Signature/Magic Number Checker: Hardware-level type verification
export const checkFileSignature = async (file: File, expectedType: 'pdf' | 'jpeg' | 'png'): Promise<boolean> => {
  const signatures: Record<string, string> = {
    pdf: '25504446',   // %PDF
    jpeg: 'ffd8ff',     // JPEG start
    png: '89504e47'    // PNG start
  };

  const buffer = await file.slice(0, 4).arrayBuffer();
  const arr = new Uint8Array(buffer);
  let header = '';
  for (let i = 0; i < arr.length; i++) {
    header += arr[i].toString(16).padStart(2, '0');
  }

  const expected = signatures[expectedType];
  if (!expected) return false;
  
  return header.startsWith(expected);
};

// 7. ImageInstantThumbnail: Preview via local Blob URL
export const getImageInstantThumbnail = (file: File): string => {
  return URL.createObjectURL(file);
};

// 8. PDFInstantThumbnail: Visual identifier for PDFs
export const getPdfInstantThumbnail = (): string => {
  const errorColor = tokens.feedbackColors.light.FeedbackColorError;
  return `data:image/svg+xml;base64,${btoa(`
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="${errorColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M14 2V8H20" stroke="${errorColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="7" y="18" fill="${errorColor}" font-family="sans-serif" font-size="5" font-weight="bold">PDF</text>
    </svg>
  `)}`;
};

// 10. File Size Formatter: Human-readable bytes
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const formatted = (bytes / Math.pow(k, i));
  return `${parseFloat(formatted.toFixed(2))} ${sizes[i]}`;
};

// 17. Safe Object URL with Auto-Revoke
export const createSafeObjectUrl = (file: File, delay: number = 60000): string => {
  const url = URL.createObjectURL(file);
  setTimeout(() => URL.revokeObjectURL(url), delay);
  return url;
};

// 18. iOS Smart Download Detection
export const triggerSmartDownload = (blob: Blob, filename: string) => {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
               (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const url = URL.createObjectURL(blob);
  if (isIOS) {
    window.location.href = url;
  } else {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

// 19. Office Document Thumbnails
export const getDocThumbnail = (extension: string): string => {
  const ext = extension.toLowerCase().replace('.', '');
  // Blue/Green/Red/Slate from tokens or close variants
  const colors: Record<string, string> = {
    doc: '#2B579A', docx: '#2B579A', // Office Blue
    xls: '#217346', xlsx: '#217346', // Excel Green
    ppt: '#D24726', pptx: '#D24726', // PPT Orange
  };
  const label: Record<string, string> = {
    doc: 'DOC', docx: 'DOC',
    xls: 'XLS', xlsx: 'XLS',
    ppt: 'PPT', pptx: 'PPT',
  };
  const color = colors[ext] || tokens.colors.light.ColorTertiary;
  const text = label[ext] || ext.toUpperCase();
  return `data:image/svg+xml;base64,${btoa(`
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" fill="${color}20" stroke="${color}" stroke-width="2"/>
      <path d="M14 2V8H20" stroke="${color}" stroke-width="2"/>
      <text x="50%" y="16" fill="${color}" font-family="sans-serif" font-size="5" font-weight="bold" text-anchor="middle">${text}</text>
    </svg>
  `)}`;
};

// 20. Data URL to File Object
export const dataURLtoFile = (dataurl: string, filename: string): File => {
  const arr = dataurl.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
  const bstr = atob(arr[1] || arr[0]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
};

// 21. Validate File by MIME Type
export const validateFileType = (file: File, allowedMimeTypes: string[]): boolean => {
  return allowedMimeTypes.includes(file.type);
};

// 21b. Strict File Type Check (Handles wildcards like "image/*")
export const isValidFileType = (file: File, patterns: string[]): boolean => {
  if (!patterns.length) return true;
  return patterns.some(pattern => {
    if (pattern.endsWith('/*')) {
      return file.type.startsWith(pattern.replace('/*', ''));
    }
    return file.type === pattern;
  });
};

// 23. Base64 to iOS Safe Blob
export const base64ToIOSBlob = (base64: string, mime: string): Blob => {
  const parts = base64.split(',');
  const data = parts.length > 1 ? parts[1] : parts[0];
  const bstr = atob(data);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
};

// 24. Progress Tracker: Calculate percentage for progress bars
export const calculateProgress = (loaded: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((loaded / total) * 100);
};

// 25. Conflict Handler: Handle filename collisions (e.g., "file.pdf" -> "file-v2.pdf")
export const handleFileNameConflict = (filename: string, existingNames: string[]): string => {
  if (!existingNames.includes(filename)) return filename;

  const dotIndex = filename.lastIndexOf('.');
  const name = dotIndex !== -1 ? filename.slice(0, dotIndex) : filename;
  const ext = dotIndex !== -1 ? filename.slice(dotIndex) : '';
  
  let version = 2;
  let newName = `${name}-v${version}${ext}`;
  
  while (existingNames.includes(newName)) {
    version++;
    newName = `${name}-v${version}${ext}`;
  }
  
  return newName;
};

// 27. Filter: Allowed types as per StorageRule.md
export const ALLOWED_STORAGE_EXTENSIONS = [
  '.jpg', '.jpeg', '.png', '.webp',
  '.pdf',
  '.txt', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'
];

export const ALLOWED_STORAGE_MIME_TYPES = [
  'image/jpeg', 'image/png', 'image/webp',
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation'
];

