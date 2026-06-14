import pica from 'pica';
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';

/**
 * LIBS/FILEPROCESSOR.TS
 * Client-side file processing engine (Compression & Optimization).
 */

// Initialize Pica
export const picaInstance = pica();

// Configure PDF.js worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

export { pdfjsLib };

export const fileProcessor = {
  /**
   * Compresses an image using Pica for high-quality downscaling.
   */
  async compressImage(file: File | Blob, quality: number = 0.8, maxWidth: number = 1200): Promise<Blob> {
    const img = document.createElement('img');
    img.src = URL.createObjectURL(file);
    await new Promise((resolve) => (img.onload = resolve));

    let width = img.width;
    let height = img.height;

    if (width > maxWidth) {
      height = (maxWidth / width) * height;
      width = maxWidth;
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const resultCanvas = await picaInstance.resize(img, canvas, {
      unsharpAmount: 80,
      unsharpRadius: 0.6,
      unsharpThreshold: 2,
    });

    const blob = await picaInstance.toBlob(resultCanvas, file.type || 'image/jpeg', quality);
    URL.revokeObjectURL(img.src);
    return blob;
  },

  /**
   * Optimizes a PDF file using pdf-lib.
   */
  async compressPdf(file: File): Promise<Blob> {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    
    // For pdf-lib, "compression" is primarily about optimizing the structure
    // and removing non-essential metadata/objects during save.
    const pdfBytes = await pdfDoc.save({ useObjectStreams: true });
    return new Blob([pdfBytes], { type: 'application/pdf' });
  },

  /**
   * Process file based on its type as per StorageRule.md
   */
  async process(file: File): Promise<File | Blob> {
    const type = file.type;

    if (type.startsWith('image/') && type !== 'image/gif') {
      return this.compressImage(file);
    }

    if (type === 'application/pdf') {
      return this.compressPdf(file);
    }

    // Docs and other allowed types are returned as is (no compression)
    return file;
  }
};
