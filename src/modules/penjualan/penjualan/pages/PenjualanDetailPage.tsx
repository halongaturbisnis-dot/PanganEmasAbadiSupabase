import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { jsPDF } from "jspdf";
import { safeHtml2Canvas } from "../../../../logic/utils/pdf";
import { storageService } from '../../../../logic/services/storage';
import { dataURLtoFile } from '../../../../logic/utils/file';
import { DetailShell } from '../../../../ui/components/common/shells/DetailShell';
import { TextInput, PriceInput, LongTextInput, PhoneInput, EmailInput } from '../../../../ui/components/elements/Inputs';
import { DateTimeInput, DateInput } from '../../../../ui/components/elements/DateTimeInput';
import { Label } from '../../../../ui/components/elements/Label';
import { ToggleButton } from '../../../../ui/components/elements/ToggleButton';
import { 
  ITs_Penjualan 
} from '../../../../logic/types/ITs_Penjualan';
import { ICustomer } from '../../../../logic/types/ITs_Customer';
import { penjualanService } from '../../../../logic/services/penjualanService';
import { customerService } from '../../../../logic/services/customerService';
import { infoService } from '../../../../logic/services/infoService';
import { toast } from 'react-hot-toast';
import { useGlobalState } from '../../../../logic/context/GlobalContext';
import { cn } from '../../../../logic/utils/cn';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../../../../ui/components/common/Table';
import { AuditTrail } from '../../../../ui/components/elements/AuditTrail';
import { appAssets } from '../../../../ui/styles/assets';
import { swalConfig, toast as swalToast } from '../../../../logic/utils/swalConfig';
import { 
  PrimaryButton, 
  SecondaryButton, 
  DangerButton,
  GhostButton 
} from '../../../../ui/components/elements/Button';
import { tokens } from '../../../../ui/styles/tokens';
import { AttachmentDisplay } from '../../../../ui/components/elements/AttachmentDisplay';
import { MapViewer } from '../../../../ui/components/elements/MapViewer';
import { SignatureInput } from '../../../../ui/components/elements/AdvancedInputs';
import { formatCurrency } from '../../../../logic/utils/data';
import { 
  User as UserIcon, 
  Package, 
  DollarSign, 
  CreditCard, 
  Paperclip, 
  Calendar, 
  Hash, 
  Info,
  FileText,
  Download,
  Printer,
  X
} from 'lucide-react';
import { motion } from 'motion/react';

type TActiveTab = 'customer' | 'products' | 'costs' | 'payment' | 'attachment';

const suppressOklchWarnings = () => {
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  
  console.error = (...args: any[]) => {
    const msg = args.map(arg => String(arg)).join(' ');
    if (msg.includes('unsupported color function') || msg.includes('oklch') || msg.includes('Attempting to parse')) {
      return;
    }
    originalConsoleError(...args);
  };

  console.warn = (...args: any[]) => {
    const msg = args.map(arg => String(arg)).join(' ');
    if (msg.includes('unsupported color function') || msg.includes('oklch') || msg.includes('Attempting to parse')) {
      return;
    }
    originalConsoleWarn(...args);
  };

  // Convert OKLCH values to RGBA color strings (W3C standard algorithm)
  const oklchToRgb = (l: number, c: number, h: number, a: number = 1): string => {
    const hRad = (h * Math.PI) / 180;
    const L = l;
    const aVal = c * Math.cos(hRad);
    const bVal = c * Math.sin(hRad);
    
    const l_ = L + 0.3963377774 * aVal + 0.2118028117 * bVal;
    const m_ = L - 0.1055613458 * aVal - 0.0881400234 * bVal;
    const s_ = L - 0.0894841775 * aVal - 1.2914855480 * bVal;
    
    const l3 = l_ * l_ * l_;
    const m3 = m_ * m_ * m_;
    const s3 = s_ * s_ * s_;
    
    const rL = +4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
    const gL = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
    const bL = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.7076147010 * s3;
    
    const rVal = rL <= 0.0031308 ? 12.92 * rL : 1.055 * Math.pow(rL, 1 / 2.4) - 0.055;
    const gVal = gL <= 0.0031308 ? 12.92 * gL : 1.055 * Math.pow(gL, 1 / 2.4) - 0.055;
    const bVal2 = bL <= 0.0031308 ? 12.92 * bL : 1.055 * Math.pow(bL, 1 / 2.4) - 0.055;
    
    const R = Math.max(0, Math.min(255, Math.round(rVal * 255)));
    const G = Math.max(0, Math.min(255, Math.round(gVal * 255)));
    const B = Math.max(0, Math.min(255, Math.round(bVal2 * 255)));
    
    return `rgba(${R}, ${G}, ${B}, ${a})`;
  };

  const parseOklchAndReplace = (cssString: string): string => {
    if (typeof cssString !== 'string') return cssString;
    let res = cssString;
    
    // Pattern 1: oklch(0.6 0.1 250 / 0.8) or oklch(60% 0.1 250 / 80%) or oklch(0.6 0.1 250)
    res = res.replace(/oklch\(\s*([\d.]+%?)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+%?))?\s*\)/gi, (match, lStr, sChr, sHue, sAlpha) => {
      try {
        const l = lStr.endsWith('%') ? parseFloat(lStr) / 100 : parseFloat(lStr);
        const c = parseFloat(sChr);
        const h = parseFloat(sHue);
        let a = 1;
        if (sAlpha) {
          a = sAlpha.endsWith('%') ? parseFloat(sAlpha) / 100 : parseFloat(sAlpha);
        }
        return oklchToRgb(l, c, h, a);
      } catch (e) {
        return 'rgb(71, 85, 105)';
      }
    });

    // Pattern 2: oklch(0.6, 0.1, 250, 0.8) or oklch(0.6, 0.1, 250)
    res = res.replace(/oklch\(\s*([\d.]+%?)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+%?))?\s*\)/gi, (match, lStr, sChr, sHue, sAlpha) => {
      try {
        const l = lStr.endsWith('%') ? parseFloat(lStr) / 100 : parseFloat(lStr);
        const c = parseFloat(sChr);
        const h = parseFloat(sHue);
        let a = 1;
        if (sAlpha) {
          a = sAlpha.endsWith('%') ? parseFloat(sAlpha) / 100 : parseFloat(sAlpha);
        }
        return oklchToRgb(l, c, h, a);
      } catch (e) {
        return 'rgb(71, 85, 105)';
      }
    });

    return res;
  };

  // 1. Sanitize text content under style tags
  const styleElements = Array.from(document.querySelectorAll('style'));
  const originalContents = styleElements.map(el => el.textContent || '');
  styleElements.forEach(el => {
    if (el.textContent && /oklch/gi.test(el.textContent)) {
      el.textContent = parseOklchAndReplace(el.textContent);
    }
  });

  // 2. Intercept CSSRule.prototype.cssText
  let cssTextDescriptorRestorer: (() => void) | null = null;
  const originalCssTextDescriptor = Object.getOwnPropertyDescriptor(CSSRule.prototype, 'cssText');
  if (originalCssTextDescriptor && originalCssTextDescriptor.get) {
    Object.defineProperty(CSSRule.prototype, 'cssText', {
      get() {
        const originalText = originalCssTextDescriptor.get!.call(this);
        return typeof originalText === 'string' ? parseOklchAndReplace(originalText) : originalText;
      },
      configurable: true
    });
    cssTextDescriptorRestorer = () => {
      Object.defineProperty(CSSRule.prototype, 'cssText', originalCssTextDescriptor);
    };
  }

  // 3. Intercept CSSStyleDeclaration.prototype.getPropertyValue
  let getPropertyValueRestorer: (() => void) | null = null;
  const originalGetPropertyValue = CSSStyleDeclaration.prototype.getPropertyValue;
  CSSStyleDeclaration.prototype.getPropertyValue = function(prop) {
    const val = originalGetPropertyValue.call(this, prop);
    return typeof val === 'string' ? parseOklchAndReplace(val) : val;
  };
  getPropertyValueRestorer = () => {
    CSSStyleDeclaration.prototype.getPropertyValue = originalGetPropertyValue;
  };

  // 4. Intercept common CSSStyleDeclaration property getters to cover shorthand access (e.g. style.color, style.backgroundColor)
  const originalPropertyDescriptors: Record<string, PropertyDescriptor> = {};
  const colorProps = ['color', 'backgroundColor', 'borderColor', 'borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor', 'outlineColor', 'fill', 'stroke'];
  colorProps.forEach(prop => {
    const desc = Object.getOwnPropertyDescriptor(CSSStyleDeclaration.prototype, prop);
    if (desc && desc.get) {
      originalPropertyDescriptors[prop] = desc;
      Object.defineProperty(CSSStyleDeclaration.prototype, prop, {
        get() {
          const val = desc.get!.call(this);
          return typeof val === 'string' ? parseOklchAndReplace(val) : val;
        },
        configurable: true
      });
    }
  });

  return () => {
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
    
    // Restore style tag texts
    styleElements.forEach((el, index) => {
      el.textContent = originalContents[index];
    });

    // Restore CSSRule.prototype.cssText
    if (cssTextDescriptorRestorer) {
      cssTextDescriptorRestorer();
    }

    // Restore CSSStyleDeclaration.prototype.getPropertyValue
    if (getPropertyValueRestorer) {
      getPropertyValueRestorer();
    }

    // Restore CSSStyleDeclaration getters
    Object.keys(originalPropertyDescriptors).forEach(prop => {
      Object.defineProperty(CSSStyleDeclaration.prototype, prop, originalPropertyDescriptors[prop]);
    });
  };
};

// Helper to safely get signature image URL
// We append nocache to bypass the browser's non-CORS cache when loading in html2canvas
const getProxyImageUrl = (url?: string | null) => {
  if (!url) return undefined;
  if (url.startsWith('data:')) return url;
  return `${url}${url.includes('?') ? '&' : '?'}nocache=${Date.now()}`;
};

interface InvoiceTemplateProps {
  data: ITs_Penjualan;
  signatureData?: string | null;
  id?: string;
}

interface PageItem {
  data: any;
  originalIndex: number;
}

interface PageCost {
  data: any;
  originalIndex: number;
}

interface InvoicePageData {
  pageNumber: number;
  showHeader: boolean;
  showCustomer: boolean;
  items: PageItem[];
  costs: PageCost[];
  showSummary: boolean;
  showSignature: boolean;
}

const heightWeights = {
  brandHeader: 12.0,     // rem
  customerInfo: 7.5,     // rem
  miniHeader: 3.5,       // rem
  tableTitle: 2.0,       // rem
  tableHeader: 2.5,      // rem
  rowElement: 2.1,       // rem
  summaryBox: 15.5,      // rem
  signatureBox: 11.5,    // rem
  footerWatermark: 1.5,  // rem
  maxPageHeight: 62.0,   // rem
};

const InvoiceTemplate: React.FC<InvoiceTemplateProps> = ({ data, signatureData, id = "invoice-print-container" }) => {
  const [infoInfo, setInfoInfo] = useState<{ alamat: string; no_telepon: string } | null>(null);

  useEffect(() => {
    infoService.getInfo().then(data => {
      if (data) setInfoInfo({ alamat: data.alamat, no_telepon: data.no_telepon });
    });
  }, []);

  const signatureSrc = signatureData || getProxyImageUrl(data.approval_signature_url);

  const getPages = (): InvoicePageData[] => {
    const pagesList: InvoicePageData[] = [];
    let currentPageNumber = 1;

    let itemsToPlace = (data.items || []).map((item, idx) => ({ data: item, originalIndex: idx }));
    let costsToPlace = (data.costs || []).map((cost, idx) => ({ data: cost, originalIndex: idx }));

    let summaryPlaced = false;
    let signaturePlaced = false;

    // Run pagination builder loop
    while (itemsToPlace.length > 0 || costsToPlace.length > 0 || !summaryPlaced || !signaturePlaced) {
      const page: InvoicePageData = {
        pageNumber: currentPageNumber,
        showHeader: currentPageNumber === 1,
        showCustomer: currentPageNumber === 1,
        items: [],
        costs: [],
        showSummary: false,
        showSignature: false,
      };

      let heightUsed = 0;
      if (currentPageNumber === 1) {
        heightUsed += heightWeights.brandHeader + heightWeights.customerInfo;
      } else {
        heightUsed += heightWeights.miniHeader;
      }
      heightUsed += heightWeights.footerWatermark;

      // Try placing item rows
      if (itemsToPlace.length > 0) {
        const minItemsTableHeight = heightWeights.tableTitle + heightWeights.tableHeader + heightWeights.rowElement;
        if (heightUsed + minItemsTableHeight <= heightWeights.maxPageHeight) {
          heightUsed += heightWeights.tableTitle + heightWeights.tableHeader;
          while (itemsToPlace.length > 0 && heightUsed + heightWeights.rowElement <= heightWeights.maxPageHeight) {
            const item = itemsToPlace.shift()!;
            page.items.push(item);
            heightUsed += heightWeights.rowElement;
          }
        }
      }

      // Try placing cost rows
      if (itemsToPlace.length === 0 && costsToPlace.length > 0) {
        const minCostsTableHeight = heightWeights.tableTitle + heightWeights.tableHeader + heightWeights.rowElement;
        if (heightUsed + minCostsTableHeight <= heightWeights.maxPageHeight) {
          heightUsed += heightWeights.tableTitle + heightWeights.tableHeader;
          while (costsToPlace.length > 0 && heightUsed + heightWeights.rowElement <= heightWeights.maxPageHeight) {
            const cost = costsToPlace.shift()!;
            page.costs.push(cost);
            heightUsed += heightWeights.rowElement;
          }
        }
      }

      // Try placing summary and signature
      if (itemsToPlace.length === 0 && costsToPlace.length === 0) {
        if (!summaryPlaced) {
          if (heightUsed + heightWeights.summaryBox <= heightWeights.maxPageHeight) {
            page.showSummary = true;
            summaryPlaced = true;
            heightUsed += heightWeights.summaryBox;

            if (heightUsed + heightWeights.signatureBox <= heightWeights.maxPageHeight) {
              page.showSignature = true;
              signaturePlaced = true;
              heightUsed += heightWeights.signatureBox;
            }
          }
        } else if (!signaturePlaced) {
          if (heightUsed + heightWeights.signatureBox <= heightWeights.maxPageHeight) {
            page.showSignature = true;
            signaturePlaced = true;
            heightUsed += heightWeights.signatureBox;
          }
        }
      }

      // If we literally couldn't place anything new and height is unchanged, force moving on to prevent infinite loops
      const pageHadContent = page.items.length > 0 || page.costs.length > 0 || page.showSummary || page.showSignature;
      if (!pageHadContent) {
        // Force summary or signature to fit if everything is already placed but heights are tight
        if (!summaryPlaced) {
          page.showSummary = true;
          summaryPlaced = true;
        } else if (!signaturePlaced) {
          page.showSignature = true;
          signaturePlaced = true;
        }
      }

      pagesList.push(page);
      currentPageNumber++;

      if (currentPageNumber > 50) {
        console.error("Pagination guard: generated too many pages. Forced break.");
        break;
      }
    }

    return pagesList;
  };

  const pages = getPages();
  const totalPages = pages.length;

  return (
    <div id={id} className="bg-slate-100 flex flex-col gap-6 select-none print:bg-white print:gap-0">
      {pages.map((page, idx) => {
        return (
          <div 
            key={idx}
            className="invoice-page-sheet bg-white text-black font-sans leading-relaxed relative flex flex-col justify-between border border-slate-200 shadow-sm print:border-0 print:shadow-none"
            style={{ 
              width: "794px", 
              height: "1123px", 
              padding: "50px 60px", 
              boxSizing: "border-box",
              backgroundColor: "#ffffff",
              pageBreakAfter: "always",
              breakAfter: "page",
              margin: "0 auto"
            }}
          >
            {/* CORE CONTENT CONTAINER */}
            <div className="flex-1 flex flex-col">
              {/* BRAND HEADER (Only on Page 1) */}
              {page.showHeader ? (
                <div className="mb-6 border-b-2 border-slate-800 pb-6">
                  {/* DevBrand Logo on its own row */}
                  {appAssets.devBrand && (
                    <div className="mb-4">
                      <img src={appAssets.devBrand} alt="Brand" className="h-8 w-auto object-contain" />
                    </div>
                  )}
                  <div className="flex justify-between items-start">
                    <div>
                      <h1 className="text-2xl font-black text-[#D4AF37] uppercase tracking-wide leading-tight mb-2">
                        {appAssets.Company}
                      </h1>
                    <p className="text-xs text-slate-600 max-w-[400px] leading-relaxed break-words">
                      {infoInfo?.alamat || appAssets.Alamat}
                    </p>
                    {infoInfo?.no_telepon && (
                      <p className="text-xs text-slate-600 mt-1">
                        Telp: {infoInfo.no_telepon}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <h2 className="text-3xl font-black tracking-wider uppercase text-slate-800 mb-2">
                      INVOICE
                    </h2>
                    <div className="text-xs text-slate-600 space-y-1">
                      <p><span className="font-semibold text-slate-800">No. Invoice:</span> {data.invoice_number}</p>
                        <p><span className="font-semibold text-slate-800">Tanggal:</span> {data.datetime ? new Date(data.datetime).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}</p>
                        {data.submission_number && <p><span className="font-semibold text-slate-800">No. Pengajuan:</span> {data.submission_number}</p>}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* MINI HEADER FOR SECOND+ PAGES */
                <div className="flex justify-between items-center mb-6 border-b border-slate-300 pb-3 text-xs text-slate-500">
                  <span className="font-bold uppercase tracking-wider text-slate-700">{appAssets.Company} &bull; INVOICE</span>
                  <span>No: {data.invoice_number}</span>
                </div>
              )}

              {/* CUSTOMER INFO (Only on Page 1) */}
              {page.showCustomer && (
                <div className="mb-6">
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 flex flex-col justify-start w-full">
                    <h3 className="font-bold text-slate-800 uppercase text-xs tracking-wider mb-2 border-b border-slate-200 pb-1">Kepada:</h3>
                    <p className="font-bold text-slate-950 text-base">Tn/Ny. {data.customer_name}</p>
                    {data.customer_company && <p className="font-semibold text-slate-700 text-xs mt-0.5">{data.customer_company}</p>}
                    {data.customer_address && <p className="text-xs text-slate-600 mt-1 leading-normal w-full break-words">{data.customer_address}</p>}
                    {data.customer_phone && <p className="text-xs text-slate-600 mt-1.5 font-mono"><span className="font-sans text-slate-500">Telp</span> {data.customer_phone}</p>}
                  </div>
                </div>
              )}

              {/* PAGINATED ITEMS TABLE */}
              {page.items.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2">Daftar Produk:</h3>
                  <table className="w-full table-fixed border-collapse border border-slate-300 text-xs">
                    <colgroup>
                      <col style={{ width: '8%' }} />
                      <col style={{ width: '49%' }} />
                      <col style={{ width: '18%' }} />
                      <col style={{ width: '25%' }} />
                    </colgroup>
                    <thead>
                      <tr className="bg-slate-100 text-slate-800 border-b border-slate-300">
                        <th className="border border-slate-300 px-3 py-2 font-bold text-center">No</th>
                        <th className="border border-slate-300 px-3 py-2 font-bold text-left">Nama Produk</th>
                        <th className="border border-slate-300 px-3 py-2 font-bold text-center">Jumlah</th>
                        <th className="border border-slate-300 px-3 py-2 font-bold text-right">Harga</th>
                      </tr>
                    </thead>
                    <tbody>
                      {page.items.map((row, rowIdx) => {
                        const item = row.data;
                        return (
                          <tr key={rowIdx} className="hover:bg-slate-50 border-b border-slate-200">
                            <td className="border border-slate-300 px-3 py-2 text-center text-slate-500 truncate">{row.originalIndex + 1}</td>
                            <td className="border border-slate-300 px-3 py-2 font-semibold text-slate-900 break-words">
                              {item.name}
                            </td>
                            <td className="border border-slate-300 px-3 py-2 text-center font-semibold text-slate-800 truncate">{item.qty} {item.unit}</td>
                            <td className="border border-slate-300 px-3 py-2 text-right font-bold text-slate-900 truncate">Rp {(item.total_selling_price || 0).toLocaleString('id-ID')}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* PAGINATED ADDITIONAL COSTS */}
              {page.costs.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2">Biaya Tambahan:</h3>
                  <table className="w-full table-fixed border-collapse border border-slate-300 text-xs text-slate-800">
                    <colgroup>
                      <col style={{ width: '8%' }} />
                      <col style={{ width: '32%' }} />
                      <col style={{ width: '35%' }} />
                      <col style={{ width: '25%' }} />
                    </colgroup>
                    <thead>
                      <tr className="bg-slate-100 text-slate-800 border-b border-slate-300">
                        <th className="border border-slate-300 px-3 py-2 font-bold text-center">No</th>
                        <th className="border border-slate-300 px-3 py-2 font-bold text-left">Nama Biaya</th>
                        <th className="border border-slate-300 px-3 py-2 font-bold text-left">Keterangan</th>
                        <th className="border border-slate-300 px-3 py-2 font-bold text-right">Nominal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {page.costs.map((row, rowIdx) => {
                        const cost = row.data;
                        return (
                          <tr key={rowIdx} className="hover:bg-slate-50 border-b border-slate-200">
                            <td className="border border-slate-300 px-3 py-2 text-center text-slate-500 truncate">{row.originalIndex + 1}</td>
                            <td className="border border-slate-300 px-3 py-2 font-semibold text-slate-900 break-words">{cost.nama_biaya}</td>
                            <td className="border border-slate-300 px-3 py-2 text-slate-600 italic text-[11px] break-words">{cost.keterangan || '-'}</td>
                            <td className="border border-slate-300 px-3 py-2 text-right font-bold text-slate-900 truncate">Rp {(cost.nominal || 0).toLocaleString('id-ID')}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* PAYMENT SUMMARY & TOTAL TAGIHAN */}
              {page.showSummary && (
                <div className="grid grid-cols-2 gap-8 mt-4">
                  <div className="border border-dashed border-slate-300 p-4 rounded-lg bg-slate-50/50">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 border-b border-slate-300 pb-1.5 mb-2 flex items-center gap-1.5">
                    
                      Detail Pembayaran
                    </h3>
                    <table className="w-full text-xs text-slate-700">
                      <tbody>
                        <tr>
                          <td className="py-1 text-slate-500">Tipe Pembayaran</td>
                          <td className="py-1 font-semibold text-right text-slate-800">{data.payment_type || '-'}</td>
                        </tr>
                        <tr>
                          <td className="py-1 text-slate-500">Metode Pembayaran</td>
                          <td className="py-1 font-semibold text-right text-slate-800">{data.payment_method || '-'}</td>
                        </tr>
                        <tr className="border-t border-slate-200/50">
                          <td className="py-1 text-slate-500">Uang Muka (Deposit)</td>
                          <td className="py-1 font-bold text-right text-slate-900">Rp {(data.deposit || 0).toLocaleString('id-ID')}</td>
                        </tr>
                        <tr>
                          <td className="py-1 text-slate-500">Sisa Piutang (Outstanding)</td>
                          <td className="py-1 font-bold text-right text-red-655">Rp {(data.outstanding || 0).toLocaleString('id-ID')}</td>
                        </tr>
                        {data.payment_type === 'Tempo' && data.sla_date && (
                          <tr className="border-t border-dashed border-slate-300">
                            <td className="py-1.5 font-bold text-slate-800">SLA Tanggal Jatuh Tempo</td>
                            <td className="py-1.5 font-bold text-right text-amber-700">
                              {new Date(data.sla_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex flex-col justify-between">
                    <table className="w-full border-collapse border border-slate-300 text-xs text-slate-800">
                      <tbody>
                        <tr className="border-b border-slate-300">
                          <td className="p-2.5 font-semibold bg-slate-50 text-slate-600">Subtotal Barang</td>
                          <td className="p-2.5 text-right font-bold text-slate-800">Rp {(data.sum_product_price || 0).toLocaleString('id-ID')}</td>
                        </tr>
                        <tr className="border-b border-slate-300">
                          <td className="p-2.5 font-semibold bg-slate-50 text-slate-600">Total Biaya Tambahan</td>
                          <td className="p-2.5 text-right font-bold text-slate-800">Rp {(data.sum_added_cost || 0).toLocaleString('id-ID')}</td>
                        </tr>
                        <tr className="border-b border-slate-300">
                          <td className="p-2.5 font-semibold bg-slate-50 text-slate-600">Diskon</td>
                          <td className="p-2.5 text-right font-bold text-emerald-600">- Rp {(data.discount_amount || 0).toLocaleString('id-ID')}</td>
                        </tr>
                        <tr className="border-b border-slate-300">
                          <td className="p-2.5 font-semibold bg-slate-50 text-slate-600">Grand Total</td>
                          <td className="p-2.5 text-right font-bold text-slate-800">Rp {(data.grand_total || 0).toLocaleString('id-ID')}</td>
                        </tr>
                        <tr className="bg-slate-100 border-t border-slate-300">
                          <td className="p-3 font-bold text-slate-800 uppercase text-xs">Total Tagihan</td>
                          <td className="p-3 text-right font-black text-slate-950 text-base">
                            Rp {(data.payment_type === 'Tempo' ? (data.deposit || 0) : (data.grand_total || 0)).toLocaleString('id-ID')}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* SIGNATURE BLOCK */}
              {page.showSignature && (
                <div className="flex justify-end mt-6">
                  <div className="text-center w-52">
                    <p className="text-xs text-slate-500 mb-1 leading-none">Hormat Kami,</p>
                    <p className="text-[10px] text-slate-400 font-bold mb-1 uppercase tracking-wider">{appAssets.Company}</p>
                    
                    <div className="h-20 w-full relative flex items-center justify-center border border-dashed border-slate-200 rounded my-2 bg-slate-50/30 overflow-hidden">
                      {signatureSrc ? (
                        <img 
                          src={signatureSrc} 
                          alt="Tanda Tangan" 
                          className="max-h-full max-w-full object-contain" 
                          referrerPolicy="no-referrer" 
                          crossOrigin="anonymous"
                        />
                      ) : (
                        <p className="text-[10px] text-slate-400 italic">Belum disetujui</p>
                      )}
                    </div>
                    
                    <p className="font-bold text-xs border-b border-slate-500 pb-1 text-slate-900 truncate">
                      {data.approver_name || '______________'}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1 uppercase font-semibold">
                      {data.approver_jabatan || 'Manager'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* WATERMARK WITH TOTAL PAGES */}
            <div className="mt-4 border-t border-slate-100 pt-2 flex justify-between items-center text-[10px] text-slate-400 font-mono">
              <span>{appAssets.Company}</span>
              <span className="font-bold">Halaman {page.pageNumber} dari {totalPages} &bull; ID: {data.invoice_number}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

interface InvoicePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ITs_Penjualan;
  signatureData?: string | null;
}

const InvoicePreviewModal: React.FC<InvoicePreviewModalProps> = ({ isOpen, onClose, data, signatureData }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { state } = useGlobalState();
  const isMobile = state.viewport.isMobile;

  if (!isOpen) return null;

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      const element = document.getElementById('preview-invoice-paper');
      if (!element) {
        toast.error('Gagal menemukan elemen invoice');
        return;
      }
      
      const sheets = element.querySelectorAll('.invoice-page-sheet');
      if (sheets.length === 0) {
        toast.error('Gagal menemukan halaman preview invoice');
        return;
      }

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      for (let i = 0; i < sheets.length; i++) {
        const sheet = sheets[i] as HTMLElement;
        const canvas = await safeHtml2Canvas(sheet, { 
          scale: 1.5,
          useCORS: true,
          allowTaint: false,
          backgroundColor: '#ffffff',
          onclone: (clonedDoc) => {
            // Force cloned root font size so rem units are 100% standard (16px)
            const rootEl = clonedDoc.documentElement;
            if (rootEl) {
              rootEl.style.fontSize = '16px';
            }

            // Un-squeeze potential responsive mobile shrinking inside the clone
            const clonedSheets = clonedDoc.querySelectorAll('.invoice-page-sheet');
            clonedSheets.forEach((sh) => {
              const el = sh as HTMLElement;
              el.style.width = '794px';
              el.style.height = '1123px';
              el.style.minWidth = '794px';
              el.style.maxWidth = '794px';
              el.style.minHeight = '1123px';
              el.style.maxHeight = '1123px';
              el.style.padding = '50px 60px';
              el.style.boxSizing = 'border-box';
              el.style.transform = 'none';
              el.style.margin = '0 auto';
            });

            const colorRegex = /(oklch|oklab|color-mix|display-p3|hwb)\([^)]+\)/g;
            const styleTags = clonedDoc.getElementsByTagName('style');
            for (let j = 0; j < styleTags.length; j++) {
              styleTags[j].innerHTML = styleTags[j].innerHTML.replace(colorRegex, '#475569');
            }
            const allElements = clonedDoc.getElementsByTagName('*');
            for (let j = 0; j < allElements.length; j++) {
              const el = allElements[j] as HTMLElement;
              if (el.style && el.style.cssText) {
                if (colorRegex.test(el.style.cssText)) {
                  el.style.cssText = el.style.cssText.replace(colorRegex, '#475569');
                }
              }
            }
          }
        });
        
        const imgData = canvas.toDataURL('image/jpeg', 0.8);
        if (i > 0) {
          pdf.addPage();
        }
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
      }
      
      pdf.save(`Invoice-${data.invoice_number}.pdf`);
      toast.success('Invoice berhasil diunduh sebagai PDF!');
    } catch (err) {
      console.error(err);
      toast.error('Gagal mengunduh PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = async () => {
    setIsGenerating(true);
    try {
      const element = document.getElementById('preview-invoice-paper');
      if (!element) {
        toast.error('Gagal menemukan elemen invoice');
        return;
      }
      
      const sheets = element.querySelectorAll('.invoice-page-sheet');
      if (sheets.length === 0) {
        toast.error('Gagal menemukan halaman preview invoice');
        return;
      }

      // Generate images of each sheet using high quality html2canvas (matching handleDownload perfectly)
      const images: string[] = [];
      for (let i = 0; i < sheets.length; i++) {
        const sheet = sheets[i] as HTMLElement;
        const canvas = await safeHtml2Canvas(sheet, { 
          scale: 1.5,
          useCORS: true,
          allowTaint: false,
          backgroundColor: '#ffffff',
          onclone: (clonedDoc) => {
            // Force cloned root font size so rem units are 100% standard (16px)
            const rootEl = clonedDoc.documentElement;
            if (rootEl) {
              rootEl.style.fontSize = '16px';
            }

            // Un-squeeze potential responsive mobile shrinking inside the clone
            const clonedSheets = clonedDoc.querySelectorAll('.invoice-page-sheet');
            clonedSheets.forEach((sh) => {
              const el = sh as HTMLElement;
              el.style.width = '794px';
              el.style.height = '1123px';
              el.style.minWidth = '794px';
              el.style.maxWidth = '794px';
              el.style.minHeight = '1123px';
              el.style.maxHeight = '1123px';
              el.style.padding = '50px 60px';
              el.style.boxSizing = 'border-box';
              el.style.transform = 'none';
              el.style.margin = '0 auto';
            });

            const colorRegex = /(oklch|oklab|color-mix|display-p3|hwb)\([^)]+\)/g;
            const styleTags = clonedDoc.getElementsByTagName('style');
            for (let j = 0; j < styleTags.length; j++) {
              styleTags[j].innerHTML = styleTags[j].innerHTML.replace(colorRegex, '#475569');
            }
            const allElements = clonedDoc.getElementsByTagName('*');
            for (let j = 0; j < allElements.length; j++) {
              const el = allElements[j] as HTMLElement;
              if (el.style && el.style.cssText) {
                if (colorRegex.test(el.style.cssText)) {
                  el.style.cssText = el.style.cssText.replace(colorRegex, '#475569');
                }
              }
            }
          }
        });
        const imgData = canvas.toDataURL('image/jpeg', 0.8);
        images.push(imgData);
      }

      if (isMobile) {
        // For mobile, retain the safe PDF viewer blob approach
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        for (let i = 0; i < images.length; i++) {
          if (i > 0) pdf.addPage();
          pdf.addImage(images[i], 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
        }
        const pdfBlob = pdf.output('blob');
        const pdfUrl = URL.createObjectURL(pdfBlob);
        window.open(pdfUrl, '_blank');
        toast.success('Membuka PDF untuk dicetak/disimpan');
      } else {
        // High fidelity pixel-perfect direct printing container for desktop
        const printContainer = document.createElement('div');
        printContainer.id = 'print-section';
        
        images.forEach((imgSrc) => {
          const wrapper = document.createElement('div');
          wrapper.className = 'print-page';
          wrapper.style.width = '100vw';
          wrapper.style.height = '100vh';
          wrapper.style.display = 'flex';
          wrapper.style.alignItems = 'center';
          wrapper.style.justifyContent = 'center';
          wrapper.style.pageBreakAfter = 'always';
          wrapper.style.breakAfter = 'page';
          wrapper.style.pageBreakInside = 'avoid';
          wrapper.style.breakInside = 'avoid';
          wrapper.style.boxSizing = 'border-box';
          wrapper.style.backgroundColor = '#ffffff';
          
          const img = document.createElement('img');
          img.src = imgSrc;
          img.style.maxWidth = '100%';
          img.style.maxHeight = '100%';
          img.style.objectFit = 'contain';
          img.style.display = 'block';
          wrapper.appendChild(img);
          printContainer.appendChild(wrapper);
        });

        // Add exclusive temporary print CSS to eliminate browser margin, header, footer messiness
        const printStyle = document.createElement('style');
        printStyle.id = 'print-section-style';
        printStyle.textContent = `
          @media print {
            /* Hide general layout */
            body > *:not(#print-section) {
              display: none !important;
            }
            #print-section, #print-section * {
              visibility: visible !important;
            }
            #print-section {
              display: block !important;
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100vw !important;
              height: 100vh !important;
              margin: 0 !important;
              padding: 0 !important;
              background-color: #ffffff !important;
            }
            @page {
              size: A4 portrait !important;
              margin: 0mm !important;
            }
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              width: 100vw !important;
              height: 100vh !important;
              overflow: visible !important;
              background-color: #ffffff !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .print-page {
              width: 100vw !important;
              height: 100vh !important;
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
              page-break-after: always !important;
              break-after: page !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              box-sizing: border-box !important;
              margin: 0 !important;
              padding: 0 !important;
              background-color: #ffffff !important;
            }
            .print-page img {
              max-width: 100% !important;
              max-height: 100% !important;
              object-fit: contain !important;
              display: block !important;
              margin: auto !important;
            }
          }
        `;

        document.body.appendChild(printContainer);
        document.head.appendChild(printStyle);
        
        // Wait minor delay to guarantee browser rendering thread registers DOM element
        setTimeout(() => {
          window.print();
          
          // Cleanup
          setTimeout(() => {
            if (document.body.contains(printContainer)) {
              document.body.removeChild(printContainer);
            }
            const existStyle = document.getElementById('print-section-style');
            if (existStyle) {
              existStyle.remove();
            }
          }, 1000);
        }, 300);
      }
    } catch (err) {
      console.error(err);
      toast.error('Gagal memproses cetak');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex flex-col bg-slate-900/80 backdrop-blur-sm select-none">
      <div className={cn(
        "flex flex-shrink-0 bg-white border-b border-slate-200 shadow-md",
        isMobile ? "flex-col p-SpacingMedium gap-SpacingBase" : "flex-row justify-between items-center px-6 py-4"
      )}>
        <div className="space-y-0.5">
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <FileText size={18} className="text-[#D4AF37]" />
            Pratinjau Dokumen Invoice
          </h2>
          <p className="text-[11px] text-slate-500 font-medium">
            Sistem Digitalisasi Invoice &bull; {data.invoice_number}
          </p>
        </div>
        
        <div className={cn("flex items-center gap-2", isMobile && "w-full justify-between")}>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleDownload}
              disabled={isGenerating || data.approval_status !== 'Approved'}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 rounded-lg active:scale-95 transition-all disabled:opacity-50",
                (isGenerating || data.approval_status !== 'Approved') ? "cursor-not-allowed" : "cursor-pointer",
                isMobile && "px-SpacingSmall"
              )}
            >
              <Download size={14} />
              {isMobile ? 'PDF' : 'Download PDF'}
            </button>
            
            <button 
              onClick={handlePrint}
              disabled={isGenerating || data.approval_status !== 'Approved'}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg active:scale-95 transition-all disabled:opacity-50",
                (isGenerating || data.approval_status !== 'Approved') ? "cursor-not-allowed" : "cursor-pointer",
                isMobile && "px-SpacingSmall"
              )}
            >
              <Printer size={14} />
              {isMobile ? 'Cetak' : (isMobile ? 'Buka / Cetak PDF' : 'Cetak PDF')}
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="w-px h-6 bg-slate-200 mx-1" />
            
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
              title="Tutup"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-auto p-6 flex justify-center items-start bg-slate-100">
        <div className="relative shadow-2xl rounded-sm my-4 bg-white">
          {isGenerating && (
            <div className="absolute inset-0 z-50 flex flex-col justify-center items-center bg-white/70 backdrop-blur-[1px] rounded-sm">
              <div className="w-10 h-10 border-4 border-slate-800 border-t-transparent rounded-full animate-spin mb-3"></div>
              <p className="text-xs font-bold text-slate-800">Menyusun Dokumen PDF...</p>
              <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wide">Harap Tunggu Sebentar</p>
            </div>
          )}
          
          <InvoiceTemplate 
            id="preview-invoice-paper"
            data={data}
            signatureData={signatureData}
          />
        </div>
      </div>
    </div>
  );
};

export const PenjualanDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { state, setIsLoading: setGlobalLoading, refreshNotifications } = useGlobalState();
  const isMobile = state.viewport.isMobile;

  const [infoInfo, setInfoInfo] = useState<{ alamat: string; no_telepon: string } | null>(null);

  useEffect(() => {
    infoService.getInfo().then(data => {
      if (data) setInfoInfo({ alamat: data.alamat, no_telepon: data.no_telepon });
    });
  }, []);

  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<TActiveTab>('customer');
  const [data, setData] = useState<ITs_Penjualan | null>(null);
  const [customerData, setCustomerData] = useState<ICustomer | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Approval State
  const [signatureData, setSignatureData] = useState<string>('');
  const [approvalNote, setApprovalNote] = useState<string>('');

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const detail = await penjualanService.getById(id);
        if (detail) {
          setData(detail);
          if (detail.customer_id) {
            const cust = await customerService.getById(detail.customer_id);
            setCustomerData(cust);
          }
        } else {
          toast.error('Data transaksi tidak ditemukan');
          navigate('/penjualan/penjualan');
        }
      } catch (error) {
        toast.error('Gagal memuat rincian transaksi');
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [id, navigate]);

  const handleDelete = async () => {
    if (!id || !data) return;
    swalConfig.fire({
      title: 'Hapus Transaksi?',
      text: `Anda yakin ingin menghapus invoice ${data.invoice_number}? Data rincian yang dihapus tidak dapat dikembalikan!`,
      icon: 'error',
      showCancelButton: true,
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal',
      confirmButtonColor: tokens.semantic.colors.light.FeedbackColorError,
    }).then(async (result) => {
      if (result.isConfirmed) {
        const success = await penjualanService.delete(id);
        if (success) {
          swalToast.fire({ icon: 'success', title: 'Transaksi berhasil dihapus' });
          navigate('/penjualan/penjualan');
        } else {
          swalToast.fire({ icon: 'error', title: 'Gagal menghapus transaksi' });
        }
      }
    });
  };

  const handleApprove = async (status: 'Approved' | 'Rejected') => {
    if (status === 'Approved' && !signatureData) {
      toast.error('Tanda tangan wajib diisi untuk menyetujui invoice');
      return;
    }

    const confirmRes = await swalConfig.fire({
      icon: 'warning',
      title: `Konfirmasi ${status}`,
      text: `Apakah Anda yakin ingin me-${status.toLowerCase()} invoice ini? Aksi ini tidak dapat dibatalkan.`,
      showCancelButton: true,
      confirmButtonText: 'Ya, Konfirmasi',
      cancelButtonText: 'Batal',
      confirmButtonColor: status === 'Approved' ? tokens.semantic.colors.light.ColorPrimary : '#EF4444',
      cancelButtonColor: '#6B7280',
    });

    if (!confirmRes.isConfirmed) return;

    setIsProcessing(true);
    setGlobalLoading(true);
    try {
      let signatureUrl = data?.approval_signature_url;
      // Upload signature to storage for efficiency
      if (status === 'Approved' && signatureData && signatureData.startsWith('data:')) {
        try {
          const file = dataURLtoFile(signatureData, `signature-${id || 'new'}-${Date.now()}.png`);
          const uploaded = await storageService.upload(file, 'signatures');
          signatureUrl = uploaded.url;
        } catch (error) {
          console.error("Gagal mengupload tanda tangan:", error);
          toast.error("Gagal menyimpan referensi tanda tangan.");
          setIsProcessing(false);
          setGlobalLoading(false);
          return;
        }
      }

      let invoicePdfUrl = data?.invoice_pdf_url;
      
      // Auto-generate invoice PDF if approved
      if (status === 'Approved') {
        const parentElement = document.getElementById('invoice-print-parent');
        const element = document.getElementById('invoice-print-container');
        if (parentElement && element) {
          // Temporarily show the element off-screen to capture it with correct layout dimensions
          parentElement.classList.remove('hidden');
          parentElement.style.position = 'fixed';
          parentElement.style.top = '-10000px';
          parentElement.style.left = '-10000px';
          parentElement.style.width = '1200px';
          parentElement.style.display = 'block';
          
          try {
            const canvas = await safeHtml2Canvas(element, { 
              scale: 2,
              useCORS: true,
              allowTaint: false,
              backgroundColor: '#ffffff',
              onclone: (clonedDoc) => {
                const colorRegex = /(oklch|oklab|color-mix|display-p3|hwb)\([^)]+\)/g;
                const styleTags = clonedDoc.getElementsByTagName('style');
                for (let j = 0; j < styleTags.length; j++) {
                  styleTags[j].innerHTML = styleTags[j].innerHTML.replace(colorRegex, '#475569');
                }
                const allElements = clonedDoc.getElementsByTagName('*');
                for (let j = 0; j < allElements.length; j++) {
                  const el = allElements[j] as HTMLElement;
                  if (el.style && el.style.cssText) {
                    if (colorRegex.test(el.style.cssText)) {
                      el.style.cssText = el.style.cssText.replace(colorRegex, '#475569');
                    }
                  }
                }
              }
            });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const imgHeight = (canvas.height * pdfWidth) / canvas.width;
            
            let position = 0;
            let currentPage = 1;
            const totalPages = Math.ceil(imgHeight / pageHeight);

            // Draw first page
            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
            
            // Draw Header Page 1
            pdf.setFillColor(255, 255, 255);
            pdf.rect(0, 0, pdfWidth, 15, 'F');
            pdf.setFontSize(9);
            pdf.setTextColor(100);
            pdf.text(`Halaman ${currentPage} dari ${totalPages} - Invoice ${data?.invoice_number}`, pdfWidth / 2, 10, { align: 'center' });

            let heightLeft = imgHeight - pageHeight;

            while (heightLeft > 0) {
              position = position - pageHeight;
              pdf.addPage();
              currentPage++;
              
              pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
              
              // Draw Header Page N
              pdf.setFillColor(255, 255, 255);
              pdf.rect(0, 0, pdfWidth, 15, 'F');
              pdf.setFontSize(9);
              pdf.setTextColor(100);
              pdf.text(`Halaman ${currentPage} dari ${totalPages} - Invoice ${data?.invoice_number}`, pdfWidth / 2, 10, { align: 'center' });
              
              heightLeft -= pageHeight;
            }
            
            const pdfBlob = pdf.output('blob');
            const pdfFile = new File([pdfBlob], `Invoice-${data?.invoice_number}.pdf`, { type: 'application/pdf' });
            
            const uploadRes = await storageService.upload(pdfFile, 'penjualan/invoices');
            invoicePdfUrl = uploadRes.url;
          } catch (pdfErr) {
            console.error("Failed to generate PDF automatically: ", pdfErr);
            // Non-blocking error, allow approval to continue
          } finally {
            parentElement.classList.add('hidden');
            parentElement.style.position = '';
            parentElement.style.top = '';
            parentElement.style.left = '';
            parentElement.style.width = '';
            parentElement.style.display = '';
          }
        }
      }

      const updated = await penjualanService.approve(id!, status, signatureUrl, approvalNote, invoicePdfUrl);
      if (updated) {
        setData(updated);
        swalToast.fire({
          icon: 'success',
          title: `Invoice berhasil di-${status === 'Approved' ? 'Approve' : 'Reject'}`,
          confirmButtonColor: tokens.semantic.colors.light.ColorPrimary
        });
        // Refresh notifications to update badges instantly!
        refreshNotifications();
      }
    } catch (error) {
      toast.error('Gagal memproses approval');
    } finally {
      setIsProcessing(false);
      setGlobalLoading(false);
    }
  };

  const handlePrint = () => {
    setIsPreviewOpen(true);
  };

  if (isLoading) return <div className="p-SpacingHuge text-center font-black animate-pulse">Memuat rincian transaksi...</div>;
  if (!data) return null;

  const isApprover = state.user?.user_id === data.approver_id;
  const isPending = data.approval_status === 'Pending';

  const tabs: { key: TActiveTab; label: string; icon: React.ComponentType<any> }[] = [
    { key: 'customer', label: 'Customer', icon: UserIcon },
    { key: 'products', label: 'Produk', icon: Package },
    { key: 'costs', label: 'Biaya', icon: DollarSign },
    { key: 'payment', label: 'Pembayaran', icon: CreditCard },
    { key: 'attachment', label: 'Keterangan', icon: FileText },
  ];

  return (
    <>
      <style>
        {`
          @page {
            margin: 0mm;
          }
          @media print {
            body {
              visibility: hidden;
              background-color: white !important;
            }
            #invoice-print-container, #invoice-print-container * {
              visibility: visible;
            }
            #invoice-print-container {
              position: relative !important;
              display: block !important;
              width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              background-color: white !important;
            }
            /* Override tailwind overflow hidden at root */
            #root, #root div, html, body {
               height: auto !important;
               overflow: visible !important;
            }
            .print-page-footer {
              display: block !important;
              position: fixed;
              bottom: 8mm;
              right: 15mm;
              font-size: 10px;
              color: #9ca3af;
              z-index: 9999;
            }
            /* Prevent orphan titles and break inside elements gracefully */
            tr {
              break-inside: avoid !important;
              page-break-inside: avoid !important;
            }
            .break-inside-avoid {
              break-inside: avoid !important;
              page-break-inside: avoid !important;
            }
          }
        `}
      </style>
      <div className="print:hidden">
        {new URLSearchParams(location.search).get('referrer') === '/finansial/pemasukan' && data.approval_status === 'Approved' && (
          <motion.div 
            className="fixed bottom-SpacingBase right-SpacingBase z-[90]"
            initial={{ scale: 0, opacity: 0, y: 20 }}
            animate={{ 
              scale: 1, 
              opacity: 1, 
              y: [0, -10, 0]
            }}
            transition={{
              y: {
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              },
              scale: { duration: 0.3 },
              opacity: { duration: 0.3 }
            }}
          >
            <PrimaryButton 
              className="shadow-[0_10px_25px_-5px_rgba(0,0,0,0.3)] shadow-ColorPrimary/40 flex items-center gap-3 hover:scale-105 active:scale-95 transition-transform !rounded-full py-4 px-8 border-2 border-white/20"
              onClick={() => navigate(`/finansial/pemasukan/tambah?sales_id=${data.id}`)}
              id="buat-pemasukan-btn"
            >
              <DollarSign size={20} className="animate-pulse" />
              <span className="font-black uppercase tracking-widest text-FontSizeSm">Konfirmasi</span>
            </PrimaryButton>
          </motion.div>
        )}
        <DetailShell
          id={`detail-${data.id}`}
          title={`Detail Penjualan: ${data.invoice_number}`}
          onBack={() => {
            const referrer = new URLSearchParams(location.search).get('referrer');
            if (referrer) {
              navigate(referrer);
            } else {
              navigate('/penjualan/penjualan');
            }
          }}
          onEdit={(data as any).is_dropship_locked || data.approval_status === 'Approved' || data.approval_status === 'Rejected' ? undefined : () => navigate(`/penjualan/penjualan/edit/${data.id}`)}
          onDelete={(data as any).is_dropship_locked || data.approval_status === 'Approved' || data.approval_status === 'Rejected' ? undefined : handleDelete}
        >
      <div className="w-full space-y-6">
        {/* ROW 1: Tanggal, Invoice No, and Summary Cards */}
        <div className={cn("grid gap-SpacingMedium bg-white p-SpacingMedium rounded-RadiusLarge border border-ColorSidebarBorder/10 shadow-sm items-stretch", isMobile ? "grid-cols-1" : "grid-cols-12")}>
          <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-4 h-full", isMobile ? "col-span-1" : "col-span-5")}>
            <div className="space-y-SpacingSmall flex-1 flex flex-col justify-center">
              <Label id="det-label-datetime" className="flex items-center gap-1.5 text-TextColorBase">
                <Calendar size={14} className="text-gray-500" />
                Tanggal Transaksi
              </Label>
              <DateTimeInput
                id="det-datetime"
                disabled
                value={data.datetime ? data.datetime.slice(0, 16) : ''}
              />
            </div>
            <div className="space-y-SpacingSmall flex-1 flex flex-col justify-center">
              <Label id="det-label-submission">Nama Approver</Label>
              <TextInput
                id="det-submission"
                disabled
                value={data.approver_name || '-'}
                placeholder="Nama Approver..."
              />
            </div>
            <div className="space-y-SpacingSmall flex-1 flex flex-col justify-center">
              <Label id="det-label-invoice" className="flex items-center gap-1.5 text-TextColorBase">
                <Hash size={14} className="text-gray-500" />
                No. Invoice
              </Label>
              <TextInput
                id="det-invoice"
                disabled
                value={data.invoice_number}
                className="bg-gray-50 font-semibold"
              />
            </div>
            <div className="space-y-SpacingSmall flex-1 flex flex-col justify-center">
              <Label id="det-label-sales-name">Nama Sales</Label>
              <TextInput
                id="det-sales-name"
                disabled
                value={data.sales_name || '-'}
                placeholder="Nama sales..."
              />
            </div>
          </div>

          <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-SpacingMedium items-stretch h-full", isMobile ? "col-span-1" : "col-span-7")}>
            <div className="bg-[linear-gradient(to_top,#93F9B9,#1D976C)] p-5 rounded-3xl justify-center flex flex-col shadow-sm h-32 md:h-full">
               <span className="text-Black text-[0.6875rem] font-bold uppercase opacity-60">Total Produk</span>
               <span className="text-Black text-[1.25rem] font-black tracking-tight leading-tight">
                 {formatCurrency(data.sum_product_price || 0)}
               </span>
            </div>
            <div className="bg-[linear-gradient(to_bottom,#f37335,#fdc830)] p-5 rounded-3xl flex flex-col justify-center shadow-sm h-32 md:h-full">
               <span className="text-Black text-[0.6875rem] font-bold uppercase opacity-60">Total Biaya</span>
               <span className="text-Black text-[1.25rem] font-black tracking-tight leading-tight">
                 {formatCurrency(data.sum_added_cost || 0)}
               </span>
            </div>
            <div className="bg-[linear-gradient(to_bottom,#155799,#159957)] text-white p-5 rounded-3xl flex flex-col justify-center shadow-md h-32 md:h-full">
               <span className="text-white text-[0.6875rem] font-bold uppercase opacity-80">GRAND TOTAL</span>
               <span className="text-white text-[1.25rem] font-black tracking-tight leading-none">
                 {formatCurrency(data.grand_total || 0)}
               </span>
            </div>
          </div>
        </div>

        {/* APPROVAL WORKFLOW SECTION */}
        {(isApprover || !isPending) && (
          <div className="bg-white p-SpacingMedium rounded-RadiusLarge border border-ColorSidebarBorder/10 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <div className="w-1.5 h-6 bg-ColorPrimary rounded-full" />
              <h3 className="font-extrabold text-FontSizeBase text-TextColorBase tracking-tight">Verifikasi & Approval Invoice</h3>
              {data.approval_status && (
                <span className={cn(
                  "ml-auto text-[0.625rem] font-black uppercase px-2.5 py-1 rounded-full",
                  data.approval_status === 'Pending' ? "bg-ColorSecondary/20 text-ColorSecondary" :
                  data.approval_status === 'Approved' ? "bg-green-100 text-green-700" :
                  "bg-red-100 text-red-700"
                )}>
                  Status: {data.approval_status}
                </span>
              )}
            </div>

            {isApprover && isPending ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-SpacingLarge items-start">
                <div className="space-y-4">
                  <div className="flex items-start gap-3 bg-ColorPrimary/5 p-4 rounded-RadiusMedium border border-ColorPrimary/10">
                    <Info size={18} className="text-ColorPrimary mt-0.5 flex-shrink-0" />
                    <div className="space-y-1">
                      <p className="text-FontSizeXs text-TextColorBase font-bold leading-tight">Petunjuk Approver:</p>
                      <p className="text-FontSizeNano text-TextColorMuted leading-relaxed">
                        Silakan periksa detail rincian produk, harga, dan syarat pembayaran pada tab di bawah. 
                        Wajib memberikan tanda tangan digital sebelum menekan tombol Approve.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-SpacingSmall">
                    <Label id="label-approval-note">Catatan Peninjauan (Opsional)</Label>
                    <LongTextInput
                      id="approval-note"
                      placeholder="Tambahkan catatan jika ada revisi atau alasan penolakan..."
                      value={approvalNote}
                      onChange={(e) => setApprovalNote(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-SpacingSmall pt-2">
                    <PrimaryButton 
                      className="flex-1 !bg-green-600 hover:!bg-green-700" 
                      onClick={() => handleApprove('Approved')}
                      isLoading={isProcessing}
                      disabled={isProcessing || !signatureData}
                    >
                      Approve Invoice
                    </PrimaryButton>
                    <DangerButton 
                      className="flex-1" 
                      onClick={() => handleApprove('Rejected')}
                      isLoading={isProcessing}
                      disabled={isProcessing}
                    >
                      Reject Invoice
                    </DangerButton>
                  </div>
                  
                  <SecondaryButton className="w-full" onClick={handlePrint} icon={<FileText size={18} />}>
                    Invoice
                  </SecondaryButton>
                </div>

                <div className="space-y-SpacingSmall">
                  <Label id="label-signature" required>Tanda Tangan Digital</Label>
                  <SignatureInput 
                    onChange={setSignatureData}
                    height={220}
                    className="border-ColorPrimary/20"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-SpacingLarge">
                <div className="space-y-2">
                  <Label id="view-approver-name">Approver</Label>
                  <div className="p-3 bg-gray-50 rounded-RadiusSmall border border-gray-100 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-ColorPrimary/10 flex items-center justify-center text-ColorPrimary font-bold text-xs">
                      {data.approver_name?.charAt(0)}
                    </div>
                    <div>
                      <p className="text-FontSizeXs font-bold text-TextColorBase">{data.approver_name || '-'}</p>
                      <p className="text-[0.625rem] text-TextColorMuted">Verifikator Invoice</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label id="view-approval-time">Waktu & Catatan</Label>
                  <div className="p-3 bg-gray-50 rounded-RadiusSmall border border-gray-100 space-y-1">
                    <p className="text-[0.6875rem] font-bold text-TextColorBase">
                      Diproses pada: <span className="font-normal">{data.approval_at ? new Date(data.approval_at).toLocaleString('id-ID') : '-'}</span>
                    </p>
                    <p className="text-[0.6875rem] font-bold text-TextColorBase">
                      Catatan: <span className="font-normal italic text-TextColorMuted">"{data.approval_note || 'Tidak ada catatan'}"</span>
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label id="view-signature">Bukti Tanda Tangan</Label>
                  {data.approval_signature_url ? (
                    <div className="border border-gray-100 rounded-RadiusSmall overflow-hidden bg-white h-24 flex items-center justify-center p-2 shadow-inner">
                      <img src={data.approval_signature_url} alt="Signature" className="max-h-full object-contain" referrerPolicy="no-referrer" />
                    </div>
                  ) : (
                    <div className="h-24 rounded-RadiusSmall flex items-center justify-center text-FontSizeNano text-TextColorMuted">
                      Belum ada tanda tangan
                    </div>
                  )}
                </div>
                
                {data.approval_status === 'Approved' && (
                  <div className="md:col-span-3">
                    <SecondaryButton onClick={handlePrint} icon={<FileText size={18} />}>
                      Invoice
                    </SecondaryButton>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Audit Trail */}
        <AuditTrail 
          createdAt={data.created_at}
          createdBy={data.created_by}
          createdTimezone={data.created_timezone}
          updatedAt={data.updated_at}
          updatedBy={data.updated_by}
          updatedTimezone={data.updated_timezone}
          className="bg-white p-4 rounded-RadiusLarge border border-ColorSidebarBorder/10 shadow-sm !pt-4"
        />

        {/* DETAILS TABS */}
        <div className="w-full bg-white rounded-RadiusLarge border border-ColorSidebarBorder/10 shadow-sm overflow-hidden">
          <div className="flex justify-center border-b border-gray-100 overflow-x-auto bg-gray-50 w-full">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 px-6 py-4 text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap",
                  activeTab === tab.key 
                    ? "border-ColorPrimary text-ColorPrimary bg-white" 
                    : "border-transparent text-TextColorBase opacity-60 hover:opacity-100 hover:bg-gray-100"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-SpacingBase min-h-[16rem]">
            {activeTab === 'customer' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="flex items-start gap-3 bg-ColorPrimary/5 p-SpacingBase rounded-RadiusMedium border border-ColorPrimary/20">
                  <Info size={18} className="text-ColorPrimary mt-0.5 flex-shrink-0" />
                  <p className="text-FontSizeXs text-TextColorBase font-medium leading-relaxed">
                    Informasi detail pelanggan yang tercatat pada transaksi penjualan ini.
                  </p>
                </div>

                <div className={cn(
                  "grid gap-SpacingLarge w-full",
                  isMobile ? "grid-cols-1" : "grid-cols-2"
                )}>
                  {/* Left Column: Form Inputs */}
                  <div className={cn(
                    "flex flex-col gap-y-SpacingMedium",
                    !isMobile ? "col-span-1" : "w-full"
                  )}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-SpacingMedium gap-y-SpacingSmall">
                      <div className="space-y-SpacingTiny md:col-span-2">
                        <Label id="det-label-customer-name">Nama Customer</Label>
                        <TextInput disabled value={customerData?.name || 'Loading...'} />
                      </div>
                      
                      <div className="space-y-SpacingTiny">
                        <Label id="det-label-cust-company">Perusahaan</Label>
                        <TextInput disabled value={customerData?.company || '-'} />
                      </div>

                      <div className="space-y-SpacingTiny">
                        <Label id="det-label-cust-bidang">Bidang Usaha</Label>
                        <TextInput disabled value={customerData?.bidang_usaha || '-'} />
                      </div>

                      <div className="space-y-SpacingTiny">
                        <Label id="det-label-cust-telepon">No. Telepon</Label>
                        <PhoneInput disabled value={customerData?.telepon || ''} />
                      </div>

                      <div className="space-y-SpacingTiny">
                        <Label id="det-label-cust-email">Email</Label>
                        <EmailInput disabled value={customerData?.email || ''} />
                      </div>

                      <div className="space-y-SpacingTiny md:col-span-2">
                        <Label id="det-label-cust-alamat">Alamat Pengiriman</Label>
                        <LongTextInput disabled value={customerData?.alamat || ''} rows={3} />
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Map Viewer */}
                  <div className={cn(
                    "h-[18rem] md:h-full relative rounded-RadiusLarge overflow-hidden border border-ColorSidebarBorder/OpacitySubtle shadow-inner",
                    !isMobile ? "col-span-1" : "w-full"
                  )}>
                    <MapViewer
                      id="penjualan-customer-map-viewer"
                      key={customerData?.latlong || 'default-map-viewer'}
                      latlong={customerData?.latlong || '-6.2088,106.8456'}
                      label={customerData?.name || 'Lokasi Customer'}
                      className="w-full h-full !border-none"
                      height="100%"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'products' && (
              <div className="space-y-6">
                <div className="overflow-x-auto w-full">
                  <Table id="det-products-table">
                    <TableHeader>
                      <TableRow isHeader>
                        <TableHead>Nama Produk</TableHead>
                        <TableHead>Satuan</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Harga Jual</TableHead>
                        <TableHead>HPP</TableHead>
                        <TableHead>Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {!data.items || data.items.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-TextColorMuted">Tidak ada produk.</TableCell>
                        </TableRow>
                      ) : (
                        data.items.map((item, index) => (
                          <React.Fragment key={index}>
                            <TableRow className={cn(item.is_mixing && "bg-ColorPrimary/5")}>
                              <TableCell className="font-semibold">
                                <div className="flex items-center gap-2">
                                  {item.is_mixing && <Package size={14} className="text-ColorPrimary" />}
                                  {item.name}
                                  {item.is_mixing && <span className="text-[0.625rem] bg-ColorPrimary/20 text-ColorPrimary px-1.5 rounded-full font-bold uppercase">Mixing</span>}
                                  {item.is_dropship && <span className="text-[0.625rem] bg-ColorSecondary/20 text-ColorSecondary px-1.5 rounded-full font-bold uppercase">Dropship</span>}
                                </div>
                              </TableCell>
                              <TableCell>{item.unit}</TableCell>
                              <TableCell>{item.qty}</TableCell>
                              <TableCell>{formatCurrency(item.unit_selling_price)}</TableCell>
                              <TableCell>{formatCurrency(item.unit_base_price || 0)}</TableCell>
                              <TableCell className="font-bold">{formatCurrency(item.total_selling_price)}</TableCell>
                            </TableRow>
                            {item.is_mixing && item.mixing_composition && item.mixing_composition.length > 0 && (
                              <TableRow noBorder className="bg-ColorPrimary/[0.02]">
                                <TableCell colSpan={6} className="!py-0">
                                  <div className="pl-6 pr-4 py-3 space-y-1">
                                    {item.mixing_composition.map((comp: any, cidx) => (
                                      <div key={cidx} className="text-[0.6875rem] text-left !font-bold text-TextColorBase">
                                        [{comp.sku}] - {comp.name} - {comp.qty_composition} {comp.unit}
                                      </div>
                                    ))}
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </React.Fragment>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {activeTab === 'costs' && (
              <div className="overflow-x-auto w-full">
                <Table id="det-costs-table">
                  <TableHeader>
                    <TableRow isHeader>
                      <TableHead>Nama Biaya</TableHead>
                      <TableHead>Nominal</TableHead>
                      <TableHead>Keterangan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!data.costs || data.costs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-8 text-TextColorMuted">Tidak ada biaya tambahan.</TableCell>
                      </TableRow>
                    ) : (
                      data.costs.map((cost, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-semibold">{cost.nama_biaya}</TableCell>
                          <TableCell>{formatCurrency(cost.nominal)}</TableCell>
                          <TableCell>{cost.keterangan || '-'}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}

            {activeTab === 'payment' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="flex items-start gap-3 bg-ColorPrimary/5 p-SpacingBase rounded-RadiusMedium border border-ColorPrimary/20 mb-2">
                  <Info size={18} className="text-ColorPrimary mt-0.5 flex-shrink-0" />
                  <p className="text-FontSizeXs text-TextColorBase font-medium leading-relaxed">
                    Informasi pembayaran, syarat cicilan, serta sumber dana transaksi.
                  </p>
                </div>

                <div className={cn("grid gap-SpacingMedium", isMobile ? "grid-cols-1" : "grid-cols-4")}>
                  {/* Row 1 / Col 1: Nominal Diskon */}
                  <div className="space-y-SpacingSmall">
                    <Label id="label-discount-value">Nominal Diskon (Rp)</Label>
                    <PriceInput disabled value={data.discount_amount || 0} />
                  </div>

                  {/* Row 1 / Col 2: Jenis Payment */}
                  <div className="space-y-SpacingSmall">
                    <Label id="label-payment-type">Jenis Payment</Label>
                    <ToggleButton disabled options={[{ label: 'Lunas', value: 'Lunas' }, { label: 'Tempo', value: 'Tempo' }]} value={data.payment_type} />
                  </div>

                  {/* Row 1 / Col 3: Metode Payment */}
                  <div className="space-y-SpacingSmall">
                    <Label id="label-payment-method">Metode Payment</Label>
                    <ToggleButton disabled options={[{ label: 'Tunai', value: 'Tunai' }, { label: 'Non Tunai', value: 'Non Tunai' }]} value={data.payment_method} />
                  </div>

                  {/* Row 1 / Col 4: Saluran Kas & Bank */}
                  <div className="space-y-SpacingSmall">
                    <Label id="label-bank-account-name">Saluran Kas & Bank</Label>
                    <TextInput disabled value={(data as any).bank_cash_source_name || '-'} />
                  </div>

                  {/* Row 2 / Col 1: Deposit */}
                  <div className="space-y-SpacingSmall">
                    <Label id="label-deposit">Deposit (Rp)</Label>
                    <PriceInput disabled value={data.deposit || 0} />
                  </div>

                  {/* Row 2 / Col 2: Outstanding */}
                  <div className="space-y-SpacingSmall">
                    <Label id="label-outstanding">Outstanding (Rp)</Label>
                    <PriceInput disabled value={data.outstanding || 0} />
                  </div>

                  {/* Row 2 / Col 3: SLA */}
                  <div className="space-y-SpacingSmall">
                    <Label id="label-sla">SLA</Label>
                    <DateInput disabled value={data.sla_date ? data.sla_date.slice(0, 10) : ''} />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'attachment' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="flex items-start gap-3 bg-ColorPrimary/5 p-SpacingBase rounded-RadiusMedium border border-ColorPrimary/20 mb-2">
                  <Info size={18} className="text-ColorPrimary mt-0.5 flex-shrink-0" />
                  <p className="text-FontSizeXs text-TextColorBase font-medium leading-relaxed">
                    Catatan tambahan terkait transaksi penjualan ini.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-SpacingSmall">
                    <Label id="det-label-keterangan">Keterangan Penjualan</Label>
                    <LongTextInput
                      id="det-keterangan"
                      disabled
                      value={data.keterangan || ''}
                      placeholder="Tidak ada keterangan."
                      className="min-h-[200px]"
                      rows={8}
                    />
                  </div>
                  
                  <div className="space-y-SpacingSmall">
                    <Label id="det-label-payment-proof">Lampiran Pendukung</Label>
                    <AttachmentDisplay
                      id="det-payment-proof"
                      files={data.payment_proof_fileurls?.map((url, idx) => ({ url, name: `Lampiran ${idx + 1}` })) || []}
                      emptyText="Tidak ada lampiran pendukung yang diunggah."
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DetailShell>
      </div>

      {/* Invisible print template for automated background approval capture */}
      <div id="invoice-print-parent" className="hidden">
        {data && (
          <InvoiceTemplate 
            id="invoice-print-container"
            data={data}
            signatureData={signatureData}
          />
        )}
      </div>

      {/* Render the unified InvoicePreviewModal */}
      {isPreviewOpen && data && (
        <InvoicePreviewModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          data={data}
          signatureData={signatureData}
        />
      )}

      {/* --- LEGACY INVOICE PRINT LAYOUT (ARCHIVED) --- */}
      <div className="hidden text-black font-sans bg-white w-full select-none">
        <table className="w-full border-0">
          <thead>
            <tr>
              <td>
                <div className="h-[15mm]"></div>
              </td>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <div className="px-[15mm]">
                  
                  {/* Header */}
                  {appAssets.devBrand && (
                    <div className="mb-4 text-left">
                      <img src={appAssets.devBrand} alt="Brand" className="h-10 w-auto object-contain" />
                    </div>
                  )}
                  <div className="flex justify-between items-start mb-8">
                    <div className="flex flex-col gap-1">
                      <h1 className="text-3xl font-extrabold text-[#D4AF37] uppercase tracking-wide">
                        {appAssets.Company}
                      </h1>
                      <p className="text-sm text-gray-800 break-words max-w-sm">
                        {infoInfo?.alamat || appAssets.Alamat}
                      </p>
                      {infoInfo?.no_telepon && (
                        <p className="text-sm text-gray-800 mt-1">
                          Telp: {infoInfo.no_telepon}
                        </p>
                      )}
                    </div>
                    <h2 className="text-4xl font-black tracking-widest uppercase mt-2">
                      INVOICE
                    </h2>
                  </div>

                  <hr className="border-t border-black mb-6" />

                  {/* Client Info & Document Info */}
                  <div className="flex justify-between items-start mb-8 text-sm">
                    <div className="w-[50%] text-left space-y-1">
                      <p className="font-bold">Kepada</p>
                      <p className="font-bold">Tn/Ny. {data.customer_name}</p>
                      <p className="font-semibold text-gray-700">{data.customer_company || '-'}</p>
                      <p>{data.customer_address || '-'}</p>
                      <p><span className="underline">Telp</span> {data.customer_phone || '-'}</p>
                    </div>
                    <div className="w-[40%]">
                      <table className="w-full text-left">
                        <tbody>
                          <tr>
                            <td className="py-1 font-bold w-32">No. Surat</td>
                            <td className="py-1 font-bold">: {data.invoice_number}</td>
                          </tr>
                          <tr>
                            <td className="py-1 font-bold w-32">Tanggal</td>
                            <td className="py-1 font-bold">: {data.datetime ? new Date(data.datetime).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Items Table */}
                  <table className="w-full border-collapse border border-gray-800 mb-6 text-sm">
                    <thead className="bg-gray-100">
                      <tr className="border-b border-gray-800 text-center">
                        <th className="border-r border-gray-800 p-2.5 font-bold w-1/2 uppercase tracking-wider text-xs">Nama Barang</th>
                        <th className="border-r border-gray-800 p-2.5 font-bold w-1/4 uppercase tracking-wider text-xs">Jumlah</th>
                        <th className="p-2.5 font-bold w-1/4 uppercase tracking-wider text-xs">Harga</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.items?.map((item, idx) => (
                        <tr key={idx} className="border-b border-gray-800 text-center hover:bg-gray-50">
                          <td className="border-r border-gray-800 p-2.5 text-left">{item.name}</td>
                          <td className="border-r border-gray-800 p-2.5">{item.qty} {item.unit}</td>
                          <td className="p-2.5 text-right">Rp {(item.total_selling_price || 0).toLocaleString('id-ID')}</td>
                        </tr>
                      ))}
                      {!data.items?.length && (
                        <tr>
                          <td colSpan={3} className="p-4 text-center text-gray-500 italic">Belum ada barang</td>
                        </tr>
                      )}
                    </tbody>
                  </table>

                  {/* Costs Table */}
                  <table className="w-full border-collapse border border-gray-800 mb-6 text-sm">
                    <thead className="bg-gray-100">
                      <tr className="border-b border-gray-800 text-center">
                        <th className="border-r border-gray-800 p-2.5 font-bold w-[30%] uppercase tracking-wider text-xs">Nama Biaya Tambahan</th>
                        <th className="border-r border-gray-800 p-2.5 font-bold w-[45%] uppercase tracking-wider text-xs">Keterangan</th>
                        <th className="p-2.5 font-bold w-[25%] uppercase tracking-wider text-xs">Nominal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.costs?.map((cost, idx) => (
                        <tr key={idx} className="border-b border-gray-800 text-center hover:bg-gray-50">
                          <td className="border-r border-gray-800 p-2.5 text-left">{cost.nama_biaya}</td>
                          <td className="border-r border-gray-800 p-2 text-left text-[0.6875rem] italic text-gray-600">{cost.keterangan || '-'}</td>
                          <td className="p-2.5 text-right">Rp {(cost.nominal || 0).toLocaleString('id-ID')}</td>
                        </tr>
                      ))}
                      {!data.costs?.length && (
                        <tr>
                          <td colSpan={3} className="p-4 text-center text-gray-500 italic">Tidak ada biaya tambahan</td>
                        </tr>
                      )}
                    </tbody>
                  </table>

                  {/* Bottom section split into separate break-inside-avoid divs */}
                  <div className="break-inside-avoid mb-6">
                    <div className="flex justify-between items-start text-sm gap-8">
                      {/* Payment Info */}
                      <div className="w-1/2 border border-gray-800 p-4 rounded-sm bg-gray-50/50 hidden print:block border-dashed">
                        <h3 className="font-bold font-sans mb-3 text-[0.6875rem] uppercase tracking-wider border-b border-gray-300 pb-2">Informasi Pembayaran</h3>
                        <table className="w-full text-left text-xs">
                          <tbody>
                            <tr>
                              <td className="py-1 font-semibold w-32">Jenis Payment</td>
                              <td className="py-1">: {data.payment_type || '-'}</td>
                            </tr>
                            <tr>
                              <td className="py-1 font-semibold">Metode Payment</td>
                              <td className="py-1">: {data.payment_method || '-'}</td>
                            </tr>
                            <tr>
                              <td className="py-1 font-semibold">Deposit</td>
                              <td className="py-1">: Rp {(data.deposit || 0).toLocaleString('id-ID')}</td>
                            </tr>
                            <tr>
                              <td className="py-1 font-semibold">Outstanding</td>
                              <td className="py-1">: Rp {(data.outstanding || 0).toLocaleString('id-ID')}</td>
                            </tr>
                            {data.payment_type === 'Tempo' && (
                              <tr>
                                <td className="py-1 font-bold text-gray-800">Batas Max (SLA)</td>
                                <td className="py-1 text-gray-800 font-bold">: {data.sla_date ? new Date(data.sla_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                      <div className="w-1/2 border border-gray-800 p-4 rounded-sm bg-gray-50/50 print:hidden block border-dashed">
                        <h3 className="font-bold font-sans mb-3 text-[0.6875rem] uppercase tracking-wider border-b border-gray-300 pb-2">Informasi Pembayaran</h3>
                        <table className="w-full text-left text-xs">
                          <tbody>
                            <tr>
                              <td className="py-1 font-semibold w-32">Jenis Payment</td>
                              <td className="py-1">: {data.payment_type || '-'}</td>
                            </tr>
                            <tr>
                              <td className="py-1 font-semibold">Metode Payment</td>
                              <td className="py-1">: {data.payment_method || '-'}</td>
                            </tr>
                            <tr>
                              <td className="py-1 font-semibold">Deposit</td>
                              <td className="py-1">: Rp {(data.deposit || 0).toLocaleString('id-ID')}</td>
                            </tr>
                            <tr>
                              <td className="py-1 font-semibold">Outstanding</td>
                              <td className="py-1">: Rp {(data.outstanding || 0).toLocaleString('id-ID')}</td>
                            </tr>
                            {data.payment_type === 'Tempo' && (
                              <tr>
                                <td className="py-1 font-bold text-gray-800">Batas Max (SLA)</td>
                                <td className="py-1 text-gray-800 font-bold">: {data.sla_date ? new Date(data.sla_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>

                      {/* Summary Totals */}
                      <table className="w-1/2 border-collapse border border-gray-800 text-right h-fit">
                        <tbody>
                          <tr className="border-b border-gray-800">
                            <td className="p-2.5 font-bold border-r border-gray-800 w-[50%] text-left bg-gray-50 text-[0.8125rem]">Tagihan</td>
                            <td className="p-2.5 text-[0.8125rem]">Rp {((data.sum_product_price || 0) + (data.sum_added_cost || 0)).toLocaleString('id-ID')}</td>
                          </tr>
                          <tr className="border-b border-gray-800">
                            <td className="p-2.5 font-bold border-r border-gray-800 text-left bg-gray-50 text-gray-700 text-[0.8125rem]">Diskon</td>
                            <td className="p-2.5 text-gray-700 font-medium text-[0.8125rem]">- Rp {(data.discount_amount || 0).toLocaleString('id-ID')}</td>
                          </tr>
                          <tr className="border-b border-gray-800">
                            <td className="p-2.5 font-bold border-r border-gray-800 text-left bg-gray-50 text-gray-700 text-[0.8125rem]">Grand Total</td>
                            <td className="p-2.5 text-gray-700 font-medium text-[0.8125rem]">Rp {(data.grand_total || 0).toLocaleString('id-ID')}</td>
                          </tr>
                          <tr className="bg-gray-100">
                            <td className="p-3 font-bold border-r border-gray-800 text-left text-sm uppercase tracking-wider">Total Tagihan</td>
                            <td className="p-3 font-black text-sm">Rp {(data.payment_type === 'Tempo' ? (data.deposit || 0) : (data.grand_total || 0)).toLocaleString('id-ID')}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Signature block is separate break-inside-avoid */}
                  <div className="break-inside-avoid flex justify-end text-sm mt-4 mr-8 pb-4">
                    <div className="text-center w-48">
                      <p className="mb-2">Hormat Kami,</p>
                      <div className="h-20 mb-2 mt-2 relative flex justify-center items-center overflow-hidden">
                        {(signatureData || data.approval_signature_url) && (
                          <img src={signatureData || getProxyImageUrl(data.approval_signature_url)} alt="Signature" className="max-h-full max-w-full object-contain" />
                        )}
                      </div>
                      <p className="font-bold border-b border-black mb-1">{data.approver_name || '______________'}</p>
                      <p>{data.approver_jabatan || 'Manager'}</p>
                    </div>
                  </div>

                </div>
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td>
                <div className="h-[20mm]"></div>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </>
  );
};

export default PenjualanDetailPage;
