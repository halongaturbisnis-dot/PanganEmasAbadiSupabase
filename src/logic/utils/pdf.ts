import { toCanvas } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { tokens } from '../../ui/styles/tokens';

export const safeHtml2Canvas = async (element: HTMLElement, options: any = {}): Promise<HTMLCanvasElement> => {
  const { scale = 2.5, backgroundColor, onclone, ...rest } = options;
  
  // Clone the node in-memory
  const clone = element.cloneNode(true) as HTMLElement;
  
  // Sembunyikan kloning agar tidak terlihat secara visual di layar tapi tetap ter-render di DOM
  const offscreenContainer = document.createElement('div');
  offscreenContainer.style.position = 'fixed';
  offscreenContainer.style.top = '-10000px';
  offscreenContainer.style.left = '-10000px';
  offscreenContainer.style.width = element.offsetWidth ? `${element.offsetWidth}px` : '794px';
  offscreenContainer.style.height = element.offsetHeight ? `${element.offsetHeight}px` : '1123px';
  offscreenContainer.style.overflow = 'hidden';
  offscreenContainer.appendChild(clone);
  document.body.appendChild(offscreenContainer);

  try {
    // Jalankan modifikasi kloning jika disediakan callback onclone
    if (onclone) {
      // Buat mock Document minimal agar callback onclone bawaan tetap berjalan mulus
      const mockDoc = {
        documentElement: clone,
        body: clone,
        getElementsByTagName: (tagName: string) => {
          return clone.getElementsByTagName(tagName);
        },
        querySelectorAll: (selector: string) => {
          return clone.querySelectorAll(selector);
        },
        getElementById: (id: string) => {
          return clone.id === id ? clone : clone.querySelector(`#${id}`);
        }
      } as unknown as Document;
      
      onclone(mockDoc);
    }

    // Render kloning menggunakan html-to-image
    const canvas = await toCanvas(clone, {
      pixelRatio: scale,
      backgroundColor: backgroundColor || '#ffffff',
      ...rest
    });
    
    return canvas;
  } finally {
    // Pastikan kita selalu membersihkan DOM
    if (document.body.contains(offscreenContainer)) {
      document.body.removeChild(offscreenContainer);
    }
  }
};

/**
 * Helper to get CSS variable strings for light mode
 */
const getLightModeVariables = () => {
  let vars = '';
  const lightColors = tokens.colors.light;
  const lightText = tokens.textColors.light;
  const lightFeedback = tokens.feedbackColors.light;

  Object.entries(lightColors).forEach(([key, value]) => {
    vars += `--${key}: ${value}; `;
  });
  Object.entries(lightText).forEach(([key, value]) => {
    vars += `--${key}: ${value}; `;
  });
  Object.entries(lightFeedback).forEach(([key, value]) => {
    vars += `--${key}: ${value}; `;
  });

  return vars;
};

export const printPdf = (
  elementId: string, 
  customTitle: string = 'Document'
) => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id ${elementId} not found.`);
    return;
  }

  const printContents = element.outerHTML;
  // Sanitize contents to remove any "dark" classes and force "light"
  const sanitizedContents = printContents
    .replace(/\sdark\b/g, ' ')
    .replace(/"dark\b/g, '" ')
    .replace(/<([a-z0-9-]+)/i, '<$1 class="light" style="color-scheme: light !important;"');
  const lightVars = getLightModeVariables();

  let stylesHtml = '';
  // Clone all styles (Tailwind, imported CSS, etc)
  for (const node of Array.from(document.head.childNodes)) {
    if (node.nodeName === 'STYLE' || (node.nodeName === 'LINK' && (node as HTMLLinkElement).rel === 'stylesheet')) {
      stylesHtml += (node as Element).outerHTML;
    }
  }

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert("Please allow popups for this site to preview the PDF.");
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="en" class="light">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <title>${customTitle}</title>
        ${stylesHtml}
        <style>
          /* Deep forced light mode reset */
          :root {
            ${lightVars}
            color-scheme: light !important;
          }
          
          /* Prevent dark mode media queries from affecting the print window */
          @media (prefers-color-scheme: dark) {
            :root {
              ${lightVars}
              color-scheme: light !important;
            }
          }

          /* Ensure all dark: class variants are reset */
          .dark {
            background-color: var(--ColorBg) !important;
            color: var(--TextColorBase) !important;
          }
          
          /* Base print styles for robustness */
          @media print {
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body { 
              margin: 0;
            }
            @page {
              margin: 1.5cm;
              size: auto;
            }
            .no-print {
              display: none !important;
            }
          }
          
          /* Ensure light appearance */
          body {
            background-color: var(--ColorBg) !important;
            color: var(--TextColorBase) !important;
            padding: 2.5rem;
            max-width: 100%;
            min-height: 100vh;
          }

          #${elementId} {
            width: 100% !important;
            max-width: 800px !important; /* Slightly narrower for better A4-like flow */
            margin: 0 auto;
            display: block !important;
            background-color: var(--ColorBg) !important;
            color: var(--TextColorBase) !important;
            box-shadow: none !important;
            border: none !important;
          }
        </style>
      </head>
      <body class="light" style="background-color: var(--ColorBg) !important; color: var(--TextColorBase) !important;">
        <div id="print-wrapper" class="light" style="background-color: var(--ColorBg) !important; color: var(--TextColorBase) !important;">
          ${sanitizedContents}
        </div>
        <script>
          window.onload = function() {
            // Slight delay to ensure custom fonts and complex SVGs render
            setTimeout(() => {
               window.print();
            }, 800);
          }
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
};

export interface PdfExportOptions {
  filename?: string;
  multiPage?: boolean;
}

export const downloadPdf = async (elementId: string, options: PdfExportOptions = {}) => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id ${elementId} not found.`);
    return;
  }

  const { filename = 'document.pdf', multiPage = false } = options;

  try {
    const canvas = await safeHtml2Canvas(element, { 
      scale: 2.5, // Increased scale for crispiness
      useCORS: true, 
      backgroundColor: tokens.colors.light.ColorBg,
      windowWidth: 800, // Balanced width to match print styles
      onclone: (clonedDoc) => {
        // Force light mode variables and classes on the cloned document
        const root = clonedDoc.documentElement;
        root.classList.remove('dark');
        root.classList.add('light');
        root.style.colorScheme = 'light';
        root.style.backgroundColor = tokens.colors.light.ColorBg;
        root.style.color = tokens.textColors.light.TextColorBase;
        
        // Explicitly inject light mode variables into the cloned document
        const lightColors = tokens.colors.light;
        const lightText = tokens.textColors.light;
        const lightFeedback = tokens.feedbackColors.light;

        const allInjectedVars: Record<string, string> = {
          ...lightColors,
          ...lightText,
          ...lightFeedback
        };

        Object.entries(allInjectedVars).forEach(([key, value]) => {
          root.style.setProperty(`--${key}`, value as string, 'important');
        });
        
        // Force base background color on body of the clone
        const body = clonedDoc.body;
        body.style.backgroundColor = tokens.colors.light.ColorBg;
        body.style.color = tokens.textColors.light.TextColorBase;
        body.classList.remove('dark');
        body.classList.add('light');

        // More comprehensive color stripping regex for unsupported functions in html2canvas
        const colorRegex = /(oklch|oklab|color-mix|display-p3|hwb)\([^)]+\)/g;
        
        // 1. Strip from all style tags
        const styleTags = clonedDoc.getElementsByTagName('style');
        for (let i = 0; i < styleTags.length; i++) {
          styleTags[i].innerHTML = styleTags[i].innerHTML.replace(colorRegex, tokens.textColors.light.TextColorBase);
        }

        // 2. Strip from all inline styles and remove dark classes
        const allElements = clonedDoc.getElementsByTagName('*');
        for (let i = 0; i < allElements.length; i++) {
          const el = allElements[i] as HTMLElement;
          if (el.style && el.style.cssText) {
            if (colorRegex.test(el.style.cssText)) {
              el.style.cssText = el.style.cssText.replace(colorRegex, tokens.textColors.light.TextColorBase);
            }
          }
          
          if (el.classList.contains('dark')) {
            el.classList.remove('dark');
            el.classList.add('light');
          }
        }
      }
    });
    const imgData = canvas.toDataURL('image/png');
    
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;

    if (multiPage) {
      // Standar kertas A4 (dalam pt/px, perbandingan resolusi).
      // Menggunakan unit px sehingga kompatibel dengan dimensi canvas.
      const A4_WIDTH = 595.28;
      const A4_HEIGHT = 841.89;
      
      // Hitung skala agar gambar pas di A4 width
      const ratio = A4_WIDTH / imgWidth;
      const scaledHeight = imgHeight * ratio;

      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'pt',
        format: 'a4'
      });

      let heightLeft = scaledHeight;
      let position = 0;

      // Halaman pertama
      pdf.addImage(imgData, 'PNG', 0, position, A4_WIDTH, scaledHeight);
      heightLeft -= A4_HEIGHT;

      // Halaman tambahan
      while (heightLeft > 0) {
        position = heightLeft - scaledHeight; // Geser gambar ke atas
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, A4_WIDTH, scaledHeight);
        heightLeft -= A4_HEIGHT;
      }

      pdf.save(filename);
    } else {
      // PDF fleksibel, 1 halaman mengikuti dimensi konten
      const pdf = new jsPDF({
        orientation: imgWidth > imgHeight ? 'l' : 'p',
        unit: 'px',
        format: [imgWidth, imgHeight]
      });
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(filename);
    }
  } catch (err) {
    console.error("Error generating PDF", err);
    alert('Gagal membuat file PDF.');
  }
};
