import pica from 'pica';
import { PDFDocument } from 'pdf-lib';

/**
 * FILE PROCESSOR UTILS
 * Handles image and PDF compression before upload.
 */

const picaInstance = pica();

/**
 * Compresses an image file using Pica.
 * @param file The original image file.
 * @param quality Compression quality (0 to 1).
 * @param maxWidth Max width for resizing.
 * @returns Promise<File> Compressed file.
 */
export const compressImage = async (file: File, quality: number = 0.7, maxWidth: number = 1200): Promise<File> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = async () => {
      URL.revokeObjectURL(img.src);
      
      let width = img.width;
      let height = img.height;

      // Calculate new dimensions if width exceeds maxWidth
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      try {
        await picaInstance.resize(img, canvas);
        const blob = await picaInstance.toBlob(canvas, 'image/jpeg', quality);
        const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
          type: 'image/jpeg',
          lastModified: Date.now(),
        });
        resolve(compressedFile);
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = (err) => reject(err);
  });
};

/**
 * Compresses a PDF file using pdf-lib (by copying pages to a new document).
 * Note: pdf-lib doesn't have a direct "compress" method, but re-saving 
 * can sometimes reduce size if the original had overhead.
 * For significant compression, we'd need to downsample images inside PDF (complex).
 * We will at least ensure it's a valid PDF and re-saved.
 * @param file The original PDF file.
 * @returns Promise<File>
 */
export const compressPdf = async (file: File): Promise<File> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const pdfBytes = await pdfDoc.save();
    return new File([pdfBytes], file.name, { type: 'application/pdf' });
  } catch (error) {
    console.error("PDF Processing Error:", error);
    return file; // Fallback to original if processing fails
  }
};

/**
 * Main processor function to handle compression based on file type.
 */
export const processFileBeforeUpload = async (file: File): Promise<File> => {
  const isImage = file.type.startsWith('image/');
  const isPdf = file.type === 'application/pdf';

  if (isImage) {
    return await compressImage(file);
  } else if (isPdf) {
    return await compressPdf(file);
  }

  throw new Error("Hanya file Gambar (JPG/PNG) dan PDF yang diperbolehkan.");
};
