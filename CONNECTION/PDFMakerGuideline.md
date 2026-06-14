# PDF Maker System Guideline

Dokumen ini menjelaskan arsitektur, teknik matematika, dan skema pemrograman untuk menghasilkan cetak dokumen (Invoice, Kwitansi, atau Dokumen Keuangan lainnya) secara **sangat presisi (High-Fidelity PDF)** yang sinkron antara visual **Preview Layar** dengan **Hasil PDF Unduhan**.

---

## 💡 Latar Belakang Masalah
Metode pembuatan PDF tradisional di web sering kali mengalami beberapa kendala utama:
1. **Broken Layout**: Tabel terpotong di tengah baris ketika berganti halaman.
2. **Perbedaan Preview vs Download**: Tampilan di web rapi, namun saat di-download layout berubah/berantakan.
3. **html2canvas Crash karena Modern CSS**: Variabel Tailwind terbaru menggunakan warna berbasis `oklch()` atau `color-mix()` yang tidak dikenali oleh mesin rendering *html2canvas*, menyebabkan library tersebut error dan proses pembuatan PDF terhenti tanpa log kesalahan yang jelas.
4. **Halaman Kosong di PDF**: Penggunaan *one-big-canvas* untuk multi-halaman sering menyisakan celah kosong akibat kesalahan pembagian tinggi container.

---

## 🛠️ Arsitektur Solusi (The 4 Pillars)

Untuk mengatasi masalah di atas, sistem kita mengadopsi 4 pilar arsitektur utama:

```
┌─────────────────────────────────────────────────────────────┐
│ 1. DYNAMIC PREVIEW & SMART PAGINATION                       │
│    Membagi baris transaksi secara terhitung (rem-based)     │
└──────────────────────────────┬──────────────────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. ONE-CANVAS-PER-SHEET RENDERING                           │
│    Mengambil snapshot per halaman .invoice-page-sheet       │
└──────────────────────────────┬──────────────────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. COLOR ENGINE COMPATIBILITY WORKAROUND (OKLCH FIX)       │
│    Pembersihan runtime CSS modern ke format standar (HEX)   │
└──────────────────────────────┬──────────────────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. OFF-SCREEN CAPTURE FOR BACKEND FLOWS                     │
│    Melakukan render di luar viewport tanpa merusak DOM      │
└──────────────────────────────┬──────────────────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. DIRECT HIGH-FIDELITY PRINT METHOD                        │
│    Cetak langsung via overlay gambar resolusi tinggi        │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Pilar 1: Dynamic Preview & Smart Pagination

### 1. Prinsip Dasar
Kita **tidak membiarkan browser memotong halaman menggunakan CSS `page-break` secara asal**. Kita mendistribusikan data transaksi ke struktur halaman diskrit (**Sheets**) secara terprogram menggunakan pendekatan bobot tinggi (*high weighting system*).

### 2. Dimensi Lembar Kerja A4 (Standar Internasional) - Kunci Konsistensi
Untuk memastikan ukuran kanvas persis 1:1 antara render div dengan gambar pada berbagai perangkat (resolusi layar apa pun), kita **DILARANG menggunakan satuan relatif dan dinamis seperti `rem`** pada properti struktur dimensi utama invoice (`.invoice-page-sheet`). Kita **WAJIB** menggunakan *absolute pixel (`px`)*:
*   **Lebar**: `794px` (Standar A4 96 DPI)
*   **Tinggi**: `1123px` (Standar A4 96 DPI)
*   **Padding**: `50px` (Atas/Bawah) dan `60px` (Kiri/Kanan)
*   **Tinggi Kerja Efektif**: Diperlukan untuk logic pagination (jika perhitungannya manual via array list, sesuaikan bobot tinggi dari base px).

### 3. Tabel Bobot Tinggi Konten (*Height Weights*)
Setiap komponen visual diberi alokasi bobot tinggi statis dalam satuan `rem` untuk menghitung sisa kapasitas ruang halaman secara akurat:

```typescript
const heightWeights = {
  brandHeader: 12.0,     // Kop surat utama (Logo, Info Perusahaan) - Hanya hal 1
  customerInfo: 7.5,     // Informasi Klien & No Invoice - Hanya hal 1
  miniHeader: 3.5,       // Header ringkas di Halaman 2 ke atas
  tableTitle: 2.0,       // Judul tabel (contoh: "Daftar Barang & Jasa")
  tableHeader: 2.5,      // Header kolom tabel (Nama, Qty, Harga, Total)
  rowElement: 2.1,       // 1 baris baris transaksi (Item atau Biaya Tambahan)
  summaryBox: 15.5,      // Ringkasan Pembayaran & Total Tagihan (Subtotal, Diskon, dsb)
  signatureBox: 11.5,    // Kotak Tanda Tangan (Penerima, Hormat Kami)
  footerWatermark: 1.5,  // Watermark/nomor halaman di paling bawah
  maxPageHeight: 62.0,   // Ambang batas tinggi kerja dalam satu halaman
};
```

### 4. Skema Algoritma Paginasi (TypeScript)
Fungsi penentu halaman mendistribusikan data secara sekuensial. Jika kapasitas tinggi kerja terlampaui, sisa data akan dialihkan ke halaman berikutnya.

```typescript
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

const getPages = (data: ITs_Penjualan): InvoicePageData[] => {
  const pagesList: InvoicePageData[] = [];
  let currentPageNumber = 1;

  let itemsToPlace = (data.items || []).map((item, idx) => ({ data: item, originalIndex: idx }));
  let costsToPlace = (data.costs || []).map((cost, idx) => ({ data: cost, originalIndex: idx }));

  let summaryPlaced = false;
  let signaturePlaced = false;

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
    
    // 1. Tentukan Header & Padding Watermark
    if (currentPageNumber === 1) {
      heightUsed += heightWeights.brandHeader + heightWeights.customerInfo;
    } else {
      heightUsed += heightWeights.miniHeader;
    }
    heightUsed += heightWeights.footerWatermark;

    // 2. Tempatkan Baris Barang/Jasa
    if (itemsToPlace.length > 0) {
      const minItemsTableHeight = heightWeights.tableTitle + heightWeights.tableHeader + heightWeights.rowElement;
      if (heightUsed + minItemsTableHeight <= heightWeights.maxPageHeight) {
        heightUsed += heightWeights.tableTitle + heightWeights.tableHeader;
        while (itemsToPlace.length > 0 && heightUsed + heightWeights.rowElement <= heightWeights.maxPageHeight) {
          page.items.push(itemsToPlace.shift()!);
          heightUsed += heightWeights.rowElement;
        }
      }
    }

    // 3. Tempatkan Baris Biaya Tambahan
    if (itemsToPlace.length === 0 && costsToPlace.length > 0) {
      const minCostsTableHeight = heightWeights.tableTitle + heightWeights.tableHeader + heightWeights.rowElement;
      if (heightUsed + minCostsTableHeight <= heightWeights.maxPageHeight) {
        heightUsed += heightWeights.tableTitle + heightWeights.tableHeader;
        while (costsToPlace.length > 0 && heightUsed + heightWeights.rowElement <= heightWeights.maxPageHeight) {
          page.costs.push(costsToPlace.shift()!);
          heightUsed += heightWeights.rowElement;
        }
      }
    }

    // 4. Tempatkan Blok Summary & Signature
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

    // 5. Pencegah Loop Tak Terhingga (Fallback Guard)
    const pageHadContent = page.items.length > 0 || page.costs.length > 0 || page.showSummary || page.showSignature;
    if (!pageHadContent) {
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
      console.error("Pagination guard: Lembar melebihi batas 50 halaman.");
      break;
    }
  }

  return pagesList;
};
```

---

## 🎨 Pilar 2: One-Canvas-Per-Sheet Rendering

Kesalahan umum adalah merekam seluruh container panjang ke dalam satu canvas raksasa, lalu memotong-motongnya saat diimpor ke PDF. Hal ini menyebabkan kualitas teks menurun dan posisi halaman tidak simetris.

**Solusi Terbaik**: Ambil snapshot canvas untuk setiap lembar `.invoice-page-sheet` secara mandiri, lalu masukkan masing-masing lembar sebagai halaman baru di jsPDF.

```typescript
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

const exportPDF = async () => {
  const element = document.getElementById('preview-invoice-container');
  if (!element) return;

  // Cari semua lembaran independen hasil paginasi kita
  const sheets = element.querySelectorAll('.invoice-page-sheet');
  if (sheets.length === 0) return;

  // Inisialisasi jsPDF dengan format potret (P), milimeter (mm), dan ukuran A4
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();

  for (let i = 0; i < sheets.length; i++) {
    const sheet = sheets[i] as HTMLElement;
    
    const canvas = await html2canvas(sheet, {
      scale: 2.5, // Resolusi tinggi agar teks sangat tajam (tidak pecah saat diunduh)
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');
    
    // Jika halaman ke-2, ke-3, dst, tambahkan halaman baru terlebih dahulu
    if (i > 0) {
      pdf.addPage();
    }
    
    // Tulis data gambar secara presisi menutupi dimensi halaman tanpa margin sisa
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
  }

  pdf.save(`Invoice-${invoiceNumber}.pdf`);
};
```

---

## ⚡ Pilar 3: Color Engine Compatibility Workaround (The OKLCH Fix)

Ini adalah kendala krusial yang paling sering membuat fungsi cetak gagal total di browser modern (Chrome/Safari baru) tanpa memunculkan error eksplisit di console log.

### Penyebab Kegagalan
Tailwind v4+ menggunakan skema warna modern berbasis format `oklch` (misal: `oklch(0.627 0.265 303.9)`) untuk warna bawaan. Saat *html2canvas* melakukan kloning dokumen ke dalam virtual sandbox untuk digambar sebagai canvas bitmap, ia gagal menafsirkan fungsi CSS `oklch` dan menghentikan eksekusi (*silent crash*).

### Cara Mengatasinya
Gunakan callback parameter `onclone` yang disediakan oleh `html2canvas` untuk mematung dokumen kloningan secara aman sebelum proses render bitmap dimulai. Kita mengganti semua fungsi warna `oklch`, `display-p3`, `oklab`, dll, menggunakan ekspresi reguler (*regex*) menjadi warna fallback heksadesimal berbasis aman (misalnya abu-abu pekat `#475569`).

```typescript
const canvas = await html2canvas(sheet, { 
  scale: 2.5,
  useCORS: true,
  allowTaint: false,
  backgroundColor: '#ffffff',
  onclone: (clonedDoc) => {
    // Regex global untuk mendeteksi skema warna modern berbahaya yang tidak didukung
    const colorRegex = /(oklch|oklab|color-mix|display-p3|hwb)\([^)]+\)/g;
    
    // 1. Bersihkan semua tag style bawaan dalam header halaman clone
    const styleTags = clonedDoc.getElementsByTagName('style');
    for (let j = 0; j < styleTags.length; j++) {
      styleTags[j].innerHTML = styleTags[j].innerHTML.replace(colorRegex, '#475569');
    }
    
    // 2. Bersihkan inline style pada semua elemen dokumen kloningan jika ada
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
```

---

## 👁️ Pilar 4: Off-Screen Capture for Automated Background Approval

Pada alur sistem transaksi otomatis (misalnya: saat Admin menekan tombol *"Setujui"* atau *"Approve"*, sistem secara otomatis menghasilkan dokumen PDF invoice di latar belakang lalu menyimpannya atau mengirimkannya ke storage tanpa melibatkan interaksi visual tombol unduh).

### Tantangan
Mengambil snapshot elemen yang memiliki properti `display: none` atau `hidden` akan menghasilkan gambar kosong berukuran 0x0 piksel.

### Metode Rekayasa (Off-Screen Placement)
Letakkan elemen penampung cetak di dalam wrapper raksasa yang tidak terlihat oleh pengguna (*invisible*), namun tetap terarsitektur dalam aliran DOM yang utuh menggunakan trik pemindahan koordinat absolut ke luar layar (*off-screen absolute positioning*).

```tsx
{/* Wrapper Tersembunyi di DOM bawah */}
<div id="invoice-print-parent" className="hidden">
  {data && (
    <InvoiceTemplate 
      id="invoice-print-container"
      data={data}
      signatureData={signatureData}
    />
  )}
</div>
```

Saat alur persetujuan dipicu, ubah tata letak DOM parent pembantu secara temporer lewat skrip sebelum melakukan render gambar:

```typescript
const parentElement = document.getElementById('invoice-print-parent');
const element = document.getElementById('invoice-print-container');

if (parentElement && element) {
  // Pindahkan parent kontainer ke koordinat ekstrem luar layar agar terbaca oleh DOM renderer
  parentElement.classList.remove('hidden');
  parentElement.style.position = 'fixed';
  parentElement.style.top = '-10000px';
  parentElement.style.left = '-10000px';
  parentElement.style.width = '1200px'; // Set lebar ideal dokumen
  parentElement.style.display = 'block';

  try {
    const canvas = await html2canvas(element, {
      scale: 2.0,
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#ffffff',
      onclone: (clonedDoc) => {
        // Terapkan penanganan oklch/modern CSS di sini...
      }
    });

    const imgData = canvas.toDataURL('image/png');
    // Integrasikan ke jsPDF sesuai alur pengiriman...
  } finally {
    // Selalu kembalikan keadaan DOM ke posisi sembunyi semula agar aman dari visual pengguna
    parentElement.classList.add('hidden');
    parentElement.style.position = '';
    parentElement.style.top = '';
    parentElement.style.left = '';
    parentElement.style.width = '';
    parentElement.style.display = '';
  }
}
```

---

## 🖨️ Pilar 5: Direct High-Fidelity Print Method (Penyelamat Cetak Desktop)

### Masalahan Umum pada Printing PDF blob
Ketika mencetak file PDF secara langsung menggunakan trik `iframe` + `.print()`, web browser sering kali merender dokumen dengan margin default yang memotong bagian bawah tabel, memperkecil skala (*downscale*), atau bahkan memicu crash/silent error pada browser karena pembatasan sandbox di web modern.

### Solusi Terbaik dan Paling Kuat (Direct Printing)
Di desktop, alih-alih merujuk file PDF kasar, kita dapat membangun ulang dokumen cetak secara dinamis dalam DOM. Menggunakan kumpulan **gambar beresolusi super tinggi** hasil tangkapan `html2canvas` 1:1, kita menyusun blok gambar tersebut di dalam elemen kontainer temporary `#print-section` yang hanya terlihat ketika mode cetak browser diaktifkan, sementara elemen visual utama disembunyikan menggunakan `@media print`.

```typescript
const handlePrint = async () => {
  setIsGenerating(true);
  try {
    const element = document.getElementById('preview-invoice-paper');
    const sheets = element.querySelectorAll('.invoice-page-sheet');
    const images: string[] = [];

    // Capture seluruh halaman sebagai image resolusi tinggi
    for (let i = 0; i < sheets.length; i++) {
      const sheet = sheets[i] as HTMLElement;
      const canvas = await html2canvas(sheet, { 
        scale: 2.5,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc) => {
          // Tetap lakukan filter oklch colors...
        }
      });
      images.push(canvas.toDataURL('image/png'));
    }

    // Bangun kontainer cetak temporer di DOM
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
      
      const img = document.createElement('img');
      img.src = imgSrc;
      img.style.maxWidth = '100%';
      img.style.maxHeight = '100%';
      img.style.objectFit = 'contain';
      wrapper.appendChild(img);
      printContainer.appendChild(wrapper);
    });

    // Masukkan CSS rules cetak yang sangat ketat untuk memaksa layout menutupi lembar A4 secara sempurna
    const printStyle = document.createElement('style');
    printStyle.id = 'print-section-style';
    printStyle.textContent = `
      @media print {
        body > *:not(#print-section) {
          display: none !important;
        }
        #print-section {
          display: block !important;
          position: absolute !important;
          left: 0 !important;
          top: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
          background-color: #ffffff !important;
        }
        @page {
          size: A4 portrait !important;
          margin: 0mm !important; /* Hilangkan margin sisa */
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
        }
        .print-page img {
          max-width: 100% !important;
          max-height: 100% !important;
          object-fit: contain !important;
        }
      }
    `;

    document.body.appendChild(printContainer);
    document.head.appendChild(printStyle);
    
    // Pusingkan eksekusi print asli bawaan browser
    setTimeout(() => {
      window.print();
      
      // Bersihkan DOM tepat setelah pengguna menutup dialog cetak
      setTimeout(() => {
        if (document.body.contains(printContainer)) {
          document.body.removeChild(printContainer);
        }
        const styleNode = document.getElementById('print-section-style');
        if (styleNode) styleNode.remove();
      }, 1000);
    }, 300);

  } catch (err) {
    console.error(err);
  }
};
```

---

## 📋 Checklist untuk Developer di Masa Depan

Ketika Anda ingin menguji atau membuat halaman cetak baru di modul lain:
1.  **WAJIB Gunakan Satuan Absolut (`px`) untuk Kontainer Cetak**: Jangan gunakan satuan adaptif seperti `rem` atau utility width berbasis layar (misal: `w-full`) untuk dimensi fisik `.invoice-page-sheet`. Gunakan patokan lebar absolut `width: 794px`, `height: 1123px` sebagai style statis. Hal ini krusial dan WAJIB untuk mencegah renderer *html2canvas* memproduksi hasil melenceng dan scaling ganda akibat fluktuasi root font-size bawaan saat tereksekusi secara asinkron di viewport berbeda.
2.  **Tabel Kolom dan Layout Width Percentage**: Untuk style kolom yang menuntut keseimbangan pembagian lebar tabel ke persentase statis, selalu gunakan inline styling seperti `<col style={{ width: '8%' }} />`, dan BUKAN utility tailwind (seperti `<col className="w-[8%]" />`).
3.  **Siapkan Paginator**: Rancang data dalam struktur list datar (*flat list*), lalu lewatkan ke fungsi kalkulator tinggi kerja seperti `getPages`.
4.  **Gunakan OKLCH Cleaner**: Selalu pasang fungsi pembersihan ekspresi reguler `onclone` pada callback `html2canvas` demi ketahanan aplikasi di browser-browser modern.
5.  **Uji Multi-Halaman**: Selalu coba cetak data dengan variasi jumlah baris ekstrim (misal: 1 baris, 8 baris, 9 baris, hingga 30 baris) untuk memverifikasi keandalan pengurai letak halaman yang telah Anda rancang.
6.  **Optimasi Penyimpanan Gambar (Storage)**: JANGAN PERNAH menyimpan string base64 gambar / tanda tangan (*Canvas Output*) secara langsung ke kolom database (kecuali ukurannya < 2KB). Ukuran base64 canvas umumnya ~200KB yang akan membebani bandwidth dan query. **WAJIB** konversi string base64 menjadi `File` (gunakan `dataURLtoFile`), unggah ke layanan *Storage / CDN*, lalu simpan **URL Publiknya** saja di database.
