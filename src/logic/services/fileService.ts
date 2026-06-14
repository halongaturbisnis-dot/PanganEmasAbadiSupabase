import { PDFDocument } from 'pdf-lib';
import { picaInstance, pdfjsLib } from '../libs/fileProcessor';
import { triggerSmartDownload } from '../utils/file';

/**
 * SERVICES/FILESERVICE.TS
 * Business logic for file manipulation and processing.
 */

// 1. Pica: Image Compression
export const compressImageWithPica = async (
  file: File, 
  maxWidth: number = 1200, 
  quality: number = 0.85
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = async () => {
      URL.revokeObjectURL(img.src);
      
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      try {
        const resultCanvas = await picaInstance.resize(img, canvas);
        const blob = await picaInstance.toBlob(resultCanvas, 'image/jpeg', quality);
        resolve(blob);
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = reject;
  });
};

// 6. PDF Optimization
export const optimizePdf = async (file: File): Promise<Uint8Array> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  const pdfBytes = await pdfDoc.save({ useObjectStreams: true });
  return pdfBytes;
};

// 11. Get Image Dimensions
export const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      const dimensions = { width: img.width, height: img.height };
      URL.revokeObjectURL(img.src);
      resolve(dimensions);
    };
  });
};

// 12. Generate Small Base64 Thumbnail
export const generateImageThumbnail = async (file: File, size: number = 100): Promise<string> => {
  const blob = await compressImageWithPica(file, size, 0.7);
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
};

// 13. PDF Metadata & Encryption Check
export const getPdfInfo = async (file: File) => {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  return {
    pageCount: pdfDoc.getPageCount(),
    title: pdfDoc.getTitle(),
    author: pdfDoc.getAuthor(),
    isEncrypted: pdfDoc.isEncrypted,
  };
};

// 14. Merge PDF Files
export const mergePdfs = async (files: File[]): Promise<Uint8Array> => {
  const mergedPdf = await PDFDocument.create();
  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }
  return await mergedPdf.save();
};

// 15. Security: Calculate SHA-256 Hash
export const calculateFileHash = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// 22. Download File from URL
export const downloadFileFromUrl = async (url: string, filename: string) => {
  const response = await fetch(url);
  const blob = await response.blob();
  triggerSmartDownload(blob, filename);
};

// 26. Mock Upload File (Simulation with Progress)
export const mockUploadFile = async (
  file: File, 
  onProgress?: (progress: number) => void
): Promise<string> => {
  return new Promise((resolve) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 30) + 5;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        onProgress?.(100);
        resolve(URL.createObjectURL(file));
      } else {
        onProgress?.(progress);
      }
    }, 200);
  });
};

// 27. Batch Upload Processor
export const processBatchUpload = async (
  files: File[], 
  parallel: boolean = true
): Promise<string[]> => {
  if (parallel) {
    return Promise.all(files.map(file => mockUploadFile(file)));
  } else {
    const results: string[] = [];
    for (const file of files) {
      results.push(await mockUploadFile(file));
    }
    return results;
  }
};

// 24. Image Aspect Ratio Canvas
export const imageToAspectRatioCanvas = async (
  file: File, 
  targetWidth: number, 
  targetHeight: number
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = async () => {
      URL.revokeObjectURL(img.src);
      
      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) return reject(new Error('Canvas context failed'));

      const imgAspectRatio = img.width / img.height;
      const targetAspectRatio = targetWidth / targetHeight;
      
      let sourceX = 0;
      let sourceY = 0;
      let sourceWidth = img.width;
      let sourceHeight = img.height;

      if (imgAspectRatio > targetAspectRatio) {
        sourceWidth = img.height * targetAspectRatio;
        sourceX = (img.width - sourceWidth) / 2;
      } else {
        sourceHeight = img.width / targetAspectRatio;
        sourceY = (img.height - sourceHeight) / 2;
      }

      ctx.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, targetWidth, targetHeight);
      
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Cropping failed'));
      }, 'image/jpeg', 0.9);
    };
    img.onerror = reject;
  });
};

// 25. Extract PDF Preview
export const extractPDFPreview = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const page = await pdf.getPage(1);
  
  const viewport = page.getViewport({ scale: 1.5 });
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  
  canvas.height = viewport.height;
  canvas.width = viewport.width;

  if (!context) throw new Error('Canvas context failed');

  await (page as any).render({ canvasContext: context, viewport }).promise;
  return canvas.toDataURL('image/jpeg', 0.8);
};
