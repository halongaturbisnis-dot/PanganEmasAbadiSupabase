import React, { useEffect, useState } from 'react';
import { IPenyerahanPayload } from '../../../../logic/types/ITs_Penyerahan';
import { appAssets } from '../../../../ui/styles/assets';
import { formatCurrency } from '../../../../logic/utils/data';
import { Eye, Truck, Package, User, FileText, Download, Printer, X } from 'lucide-react';
import { useGlobalState } from '../../../../logic/context/GlobalContext';
import { cn } from '../../../../logic/utils/cn';
import { safeHtml2Canvas } from '../../../../logic/utils/pdf';
import { jsPDF } from 'jspdf';
import { toast } from 'react-hot-toast';
import { infoService } from '../../../../logic/services/infoService';

interface PDFSuratJalanProps {
  data: IPenyerahanPayload;
  id?: string;
}

interface PageItem {
  data: any;
  originalIndex: number;
}

interface SJPageData {
  pageNumber: number;
  showHeader: boolean;
  showCustomer: boolean;
  items: PageItem[];
  showSignature: boolean;
}

const heightWeights = {
  brandHeader: 12.0,     // rem
  recipientInfo: 8.5,    // rem (Combined customer & delivery info)
  miniHeader: 3.5,       // rem
  tableTitle: 2.0,       // rem
  tableHeader: 2.5,      // rem
  rowElement: 2.1,       // rem
  signatureBox: 12.5,    // rem
  footerWatermark: 1.5,  // rem
  maxPageHeight: 62.0,   // rem
};

export const SuratJalanTemplate: React.FC<PDFSuratJalanProps> = ({ data, id = "surat-jalan-render-container" }) => {
  const [infoInfo, setInfoInfo] = useState<{ alamat: string; no_telepon: string } | null>(null);

  useEffect(() => {
    infoService.getInfo().then(data => {
      if (data) setInfoInfo({ alamat: data.alamat, no_telepon: data.no_telepon });
    });
  }, []);

  const getPages = (): SJPageData[] => {
    const pagesList: SJPageData[] = [];
    let currentPageNumber = 1;

    // Use items from penjualan_data
    const itemsRaw = data.penjualan_data?.items || [];
    let itemsToPlace = itemsRaw.map((item, idx) => ({ data: item, originalIndex: idx }));

    let signaturePlaced = false;

    while (itemsToPlace.length > 0 || !signaturePlaced) {
      const page: SJPageData = {
        pageNumber: currentPageNumber,
        showHeader: currentPageNumber === 1,
        showCustomer: currentPageNumber === 1,
        items: [],
        showSignature: false,
      };

      let heightUsed = 0;
      if (currentPageNumber === 1) {
        heightUsed += heightWeights.brandHeader + heightWeights.recipientInfo;
      } else {
        heightUsed += heightWeights.miniHeader;
      }
      heightUsed += heightWeights.footerWatermark;

      // Place items
      if (itemsToPlace.length > 0) {
        const minTableHeight = heightWeights.tableTitle + heightWeights.tableHeader + heightWeights.rowElement;
        if (heightUsed + minTableHeight <= heightWeights.maxPageHeight) {
          heightUsed += heightWeights.tableTitle + heightWeights.tableHeader;
          while (itemsToPlace.length > 0 && heightUsed + heightWeights.rowElement <= heightWeights.maxPageHeight) {
            page.items.push(itemsToPlace.shift()!);
            heightUsed += heightWeights.rowElement;
          }
        }
      }

      // Place signature
      if (itemsToPlace.length === 0) {
        if (!signaturePlaced) {
          if (heightUsed + heightWeights.signatureBox <= heightWeights.maxPageHeight) {
            page.showSignature = true;
            signaturePlaced = true;
            heightUsed += heightWeights.signatureBox;
          }
        }
      }

      // Safeguard
      const pageHadContent = page.items.length > 0 || page.showSignature;
      if (!pageHadContent && !signaturePlaced) {
        page.showSignature = true;
        signaturePlaced = true;
      }

      pagesList.push(page);
      currentPageNumber++;

      if (currentPageNumber > 20) break; // Defensive limit
    }

    return pagesList;
  };

  const pages = getPages();
  const totalPages = pages.length;

  return (
    <div id={id} className="bg-slate-100 flex flex-col gap-6 select-none print:bg-white print:gap-0">
      {pages.map((page, idx) => (
        <div 
          key={idx}
          className="surat-jalan-page-sheet bg-white text-black font-sans leading-relaxed relative flex flex-col justify-between border border-slate-200 shadow-sm print:border-0 print:shadow-none"
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
          <div className="flex-1 flex flex-col">
            {/* Header */}
            {page.showHeader ? (
              <div className="mb-6 border-b-2 pb-6" style={{ borderBottomColor: '#1E293B' }}>
                {/* DevBrand Logo on its own row */}
                {appAssets.devBrand && (
                  <div className="mb-4">
                    <img src={appAssets.devBrand} alt="Brand" className="h-8 w-auto object-contain" />
                  </div>
                )}
                <div className="flex justify-between items-start">
                  <div>
                    <h1 className="text-2xl font-black uppercase tracking-wide leading-tight mb-2" style={{ color: '#D4AF37' }}>
                      {appAssets.Company}
                    </h1>
                    <p className="text-xs max-w-[400px] leading-relaxed break-words" style={{ color: '#475569' }}>
                      {infoInfo?.alamat || appAssets.Alamat}
                    </p>
                    {infoInfo?.no_telepon && (
                      <p className="text-xs mt-1" style={{ color: '#475569' }}>
                        Telp: {infoInfo.no_telepon}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <h2 className="text-3xl font-black tracking-wider uppercase mb-2" style={{ color: '#1E293B' }}>
                      SURAT JALAN
                    </h2>
                    <div className="text-xs space-y-1" style={{ color: '#475569' }}>
                      <p><span className="font-semibold" style={{ color: '#1E293B' }}>No. Surat Jalan:</span> {data.surat_jalan_number || '-'}</p>
                      <p><span className="font-semibold" style={{ color: '#1E293B' }}>No. Invoice:</span> {data.penjualan_data?.invoice_number || '-'}</p>
                      <p><span className="font-semibold" style={{ color: '#1E293B' }}>Tanggal:</span> {data.datetime ? new Date(data.datetime).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div 
                className="flex justify-between items-center mb-6 border-b pb-3 text-xs"
                style={{ borderBottomColor: '#CBD5E1', color: '#64748B' }}
              >
                <span className="font-bold uppercase tracking-wider" style={{ color: '#334155' }}>{appAssets.Company} &bull; SURAT JALAN</span>
                <span>No SJ: {data.surat_jalan_number || '-'}</span>
              </div>
            )}

            {/* Recipient & Delivery Info */}
            {page.showCustomer && (
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div 
                  className="p-4 rounded-lg border flex flex-col justify-start"
                  style={{ backgroundColor: '#F8FAFC', borderColor: '#F1F5F9' }}
                >
                  <h3 className="font-bold uppercase text-[10px] tracking-wider mb-2 border-b pb-1" style={{ color: '#1E293B', borderBottomColor: '#E2E8F0' }}>Tujuan Pengiriman:</h3>
                  <p className="font-bold text-sm" style={{ color: '#0F172A' }}>Tn/Ny. {data.penjualan_data?.customer_name}</p>
                  {data.penjualan_data?.customer_company && <p className="font-semibold text-[11px] mt-0.5" style={{ color: '#334155' }}>{data.penjualan_data.customer_company}</p>}
                  {data.penjualan_data?.customer_address && <p className="text-[11px] mt-1 leading-normal break-words" style={{ color: '#475569' }}>{data.penjualan_data.customer_address}</p>}
                </div>
                
                <div 
                  className="p-4 rounded-lg border flex flex-col justify-start"
                  style={{ backgroundColor: '#F8FAFC', borderColor: '#F1F5F9' }}
                >
                  <h3 className="font-bold uppercase text-[10px] tracking-wider mb-2 border-b pb-1" style={{ color: '#1E293B', borderBottomColor: '#E2E8F0' }}>Informasi Kendaraan:</h3>
                  <div className="grid grid-cols-[80px_1fr] gap-x-2 gap-y-1 text-[11px]">
                    <span style={{ color: '#64748B' }}>Ekspedisi:</span>
                    <span className="font-bold uppercase" style={{ color: '#1E293B' }}>{data.shipping_method || '-'}</span>
                    
                    <span style={{ color: '#64748B' }}>No. Polisi:</span>
                    <span className="font-bold uppercase" style={{ color: '#1E293B' }}>{data.vehicle_number || '-'}</span>
                    
                    <span style={{ color: '#64748B' }}>Pengemudi:</span>
                    <span className="font-bold uppercase" style={{ color: '#1E293B' }}>{data.driver_name || '-'}</span>

                    {data.driver_phone && (
                      <>
                        <span style={{ color: '#64748B' }}>Telp Supir:</span>
                        <span className="font-mono text-slate-800" style={{ color: '#1E293B' }}>{data.driver_phone}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Items Table */}
            {page.items.length > 0 && (
              <div className="mb-4">
                <h3 className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: '#1E293B' }}>Daftar Barang:</h3>
                <table className="w-full table-fixed border-collapse border text-xs" style={{ borderColor: '#CBD5E1' }}>
                  <colgroup>
                    <col style={{ width: '8%' }} />
                    <col style={{ width: '70%' }} />
                    <col style={{ width: '22%' }} />
                  </colgroup>
                  <thead>
                    <tr className="border-b" style={{ backgroundColor: '#F1F5F9', color: '#1E293B', borderBottomColor: '#CBD5E1' }}>
                      <th className="border px-3 py-2 font-bold text-center" style={{ borderColor: '#CBD5E1' }}>No</th>
                      <th className="border px-3 py-2 font-bold text-left" style={{ borderColor: '#CBD5E1' }}>Nama Produk / Deskripsi</th>
                      <th className="border px-3 py-2 font-bold text-center" style={{ borderColor: '#CBD5E1' }}>Jumlah</th>
                    </tr>
                  </thead>
                  <tbody>
                    {page.items.map((row, rowIdx) => {
                      const item = row.data;
                      return (
                        <tr key={rowIdx} className="border-b" style={{ borderBottomColor: '#E2E8F0' }}>
                          <td className="border px-3 py-2 text-center" style={{ borderColor: '#CBD5E1', color: '#64748B' }}>{row.originalIndex + 1}</td>
                          <td className="border px-3 py-2 font-semibold break-words" style={{ borderColor: '#CBD5E1', color: '#0F172A' }}>{item.name}</td>
                          <td className="border px-3 py-2 text-center font-bold" style={{ borderColor: '#CBD5E1', color: '#1E293B' }}>{item.qty} {item.unit}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <p className="text-[10px] mt-2 italic" style={{ color: '#94A3B8' }}>* Mohon periksa kembali kondisi barang saat diterima.</p>
              </div>
            )}

            {/* Signature Block */}
            {page.showSignature && (
              <div className="mt-8 pt-6 flex justify-between gap-10">
                 <div className="text-center flex-1 max-w-[140px]">
                  <p className="text-[11px] font-bold mb-10" style={{ color: '#334155' }}>Admin,</p>
                  <p className="text-[10px] font-bold uppercase px-1 border-b pb-1" style={{ color: '#0F172A', borderBottomColor: '#334155' }}>
                    ________________
                  </p>
                </div>

                <div className="text-center flex-1 max-w-[140px]">
                  <p className="text-[11px] font-bold mb-10" style={{ color: '#334155' }}>Sopir,</p>
                  <p className="text-[10px] font-bold uppercase px-1 border-b pb-1" style={{ color: '#0F172A', borderBottomColor: '#334155' }}>
                    {data.driver_name || '________________'}
                  </p>
                </div>

                <div className="text-center flex-1 max-w-[140px]">
                  <p className="text-[11px] font-bold mb-10" style={{ color: '#334155' }}>Penerima,</p>
                  <p className="text-[10px] font-bold uppercase px-1 border-b pb-1" style={{ color: '#0F172A', borderBottomColor: '#334155' }}>
                    ________________
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div 
            className="mt-4 border-t pt-2 flex justify-between items-center text-[10px] font-mono"
            style={{ borderTopColor: '#F1F5F9', color: '#94A3B8' }}
          >
            <span>Dicetak secara otomatis oleh Sistem {appAssets.Company}</span>
            <span className="font-bold">Halaman {page.pageNumber} dari {totalPages} &bull; Ref: {data.surat_jalan_number}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export const SuratJalanPreviewModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  data: IPenyerahanPayload;
}> = ({ isOpen, onClose, data }) => {
  const [isGenerating, setIsGenerating] = React.useState(false);
  const { state } = useGlobalState();
  const isMobile = state.viewport.isMobile;

  if (!isOpen) return null;

  const fixHtml2CanvasOklch = (clonedDoc: Document) => {
    // OKLCH Fix - html2canvas cannot parse oklch/oklab/color-mix
    const colorRegex = /(oklch|oklab|color-mix|display-p3|hwb)\([^)]+\)/g;
    
    // 1. Fix Style Tags
    const styleTags = clonedDoc.getElementsByTagName('style');
    for (let j = 0; j < styleTags.length; j++) {
      styleTags[j].innerHTML = styleTags[j].innerHTML.replace(colorRegex, '#475569');
    }
    
    // 2. Fix Inline Styles on all elements
    const allElements = clonedDoc.getElementsByTagName('*');
    for (let j = 0; j < allElements.length; j++) {
      const el = allElements[j] as HTMLElement;
      if (el.style && el.style.cssText && colorRegex.test(el.style.cssText)) {
          el.style.cssText = el.style.cssText.replace(colorRegex, '#475569');
      }
      
      // Also check computed styles if possible, but onclone should be enough for inline/style tags
    }
  };

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      const element = document.getElementById('preview-sj-paper');
      if (!element) return;
      
      const sheets = element.querySelectorAll('.surat-jalan-page-sheet');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      for (let i = 0; i < sheets.length; i++) {
        const sheet = sheets[i] as HTMLElement;
        const canvas = await safeHtml2Canvas(sheet, { 
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          onclone: fixHtml2CanvasOklch
        });
        const imgData = canvas.toDataURL('image/jpeg', 0.9);
        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
      }
      
      pdf.save(`SuratJalan-${data.surat_jalan_number}.pdf`);
      toast.success('Surat Jalan berhasil diunduh!');
    } catch (err) {
      console.error(err);
      toast.error('Gagal mengunduh Surat Jalan');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = async () => {
    setIsGenerating(true);
    try {
      const element = document.getElementById('preview-sj-paper');
      if (!element) return;
      
      const sheets = element.querySelectorAll('.surat-jalan-page-sheet');
      const images: string[] = [];
      for (let i = 0; i < sheets.length; i++) {
        const canvas = await safeHtml2Canvas(sheets[i] as HTMLElement, { 
          scale: 2, 
          useCORS: true, 
          backgroundColor: '#ffffff',
          onclone: fixHtml2CanvasOklch
        });
        images.push(canvas.toDataURL('image/jpeg', 0.9));
      }

      const printContainer = document.createElement('div');
      printContainer.id = 'print-section-sj';
      images.forEach((imgSrc) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'print-page';
        wrapper.style.cssText = 'width:100vw; height:100vh; display:flex; align-items:center; justify-content:center; page-break-after:always;';
        const img = document.createElement('img');
        img.src = imgSrc;
        img.style.cssText = 'max-width:100%; max-height:100%; object-fit:contain;';
        wrapper.appendChild(img);
        printContainer.appendChild(wrapper);
      });

      const style = document.createElement('style');
      style.textContent = `
        @media print {
          body > *:not(#print-section-sj) { display: none !important; }
          #print-section-sj { display: block !important; position: absolute; left: 0; top: 0; width: 100vw; height: 100vh; }
          @page { size: A4 portrait; margin: 0mm; }
          html, body { margin: 0; padding: 0; }
        }
      `;
      document.head.appendChild(style);
      document.body.appendChild(printContainer);
      
      setTimeout(() => {
        window.print();
        setTimeout(() => {
          document.body.removeChild(printContainer);
          style.remove();
        }, 1000);
      }, 300);
    } catch (err) {
      console.error(err);
      toast.error('Gagal memproses cetak');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-slate-900/80 backdrop-blur-sm select-none">
      <div className={cn(
        "flex bg-white border-b",
        isMobile ? "flex-col p-SpacingMedium gap-SpacingBase" : "flex-row justify-between items-center px-6 py-4"
      )}>
        <div className="flex items-center gap-3">
          <FileText className="text-[#D4AF37]" size={20} />
          <div>
            <h2 className="font-black text-slate-900 text-sm">Pratinjau Surat Jalan</h2>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">{data.surat_jalan_number}</p>
          </div>
        </div>
        <div className={cn("flex items-center gap-2", isMobile && "w-full justify-between")}>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleDownload} 
              disabled={isGenerating} 
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-slate-800 rounded-lg hover:bg-slate-900 disabled:opacity-50 transition-all",
                isMobile && "px-SpacingSmall"
              )}
            >
              <Download size={14} /> {isMobile ? 'PDF' : 'Download'}
            </button>
            <button 
              onClick={handlePrint} 
              disabled={isGenerating} 
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-ColorPrimary rounded-lg hover:bg-ColorPrimary/90 disabled:opacity-50 transition-all",
                isMobile && "px-SpacingSmall"
              )}
            >
              <Printer size={14} /> {isMobile ? 'Cetak' : 'Cetak'}
            </button>
          </div>
          
          <div className="flex items-center gap-2">
             <div className="w-px h-6 bg-slate-200 mx-1" />
             <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all">
               <X size={20} />
             </button>
          </div>
        </div>
      </div>
      <div className={cn(
        "flex-1 overflow-auto flex justify-center bg-slate-100",
        isMobile ? "p-SpacingSmall" : "p-8"
      )}>
        <div className="relative shadow-2xl bg-white h-fit">
          {isGenerating && (
             <div className="absolute inset-0 z-50 flex flex-col justify-center items-center bg-white/70 backdrop-blur-sm">
                <div className="w-8 h-8 border-3 border-slate-800 border-t-transparent rounded-full animate-spin mb-2"></div>
                <p className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">Menyiapkan PDF...</p>
             </div>
          )}
          <SuratJalanTemplate id="preview-sj-paper" data={data} />
        </div>
      </div>
    </div>
  );
};
