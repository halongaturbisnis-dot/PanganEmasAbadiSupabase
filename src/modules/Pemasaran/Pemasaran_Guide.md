# Panduan Pengembangan Modul Pemasaran (Marketing)

Dokumen ini berisi spesifikasi teknis dan panduan integrasi untuk pengembang yang akan mengimplementasikan antarmuka serta logika bisnis dari modul **Pemasaran**. Modul ini dirancang dengan gaya **Clean, Professional, dan Business** menggunakan mode tampilan **Light Mode**.

---

## 🏗️ 1. Arsitektur Data & Skema Database

Modul ini telah memiliki tabel terpasang pada SQLite/LibSQL bernama `pemasaran`. Struktur datanya wajib mengikuti kontrak interface TypeScript `IPemasaran` yang terletak di `/src/logic/types/ITs_Pemasaran.ts`.

### A. Detail Kolom Tabel
| Nama Kolom (DB) | Atribut Kode | Tipe Data | Keterangan / Aturan |
| :--- | :--- | :--- | :--- |
| `id` | `id` | `TEXT` (UUID v4) | Primary key yang digenerate otomatis di tingkat database. |
| `visit_date` | `visit_date` | `DATETIME` | Tanggal dan jam aktual kunjungan marketing. Diperoleh via `getActualTime()`. |
| `sales_username` | `sales_username` | `TEXT` | Username dari staf penjualan (sales) yang melakukan aktivitas. |
| `activity_type` | `activity_type` | `TEXT` | Jenis kegiatan pemasaran. Bernilai salah satu dari: `'client relation'`, `'selling'`, `'offering'`. |
| `customer_id` | `customer_id` | `TEXT` | ID foreign key merujuk ke tabel `customer`. |
| `description` | `description` | `TEXT` (Optional) | Catatan pelengkap hasil kunjungan. |
| `latlong_visiting` | `latlong_visiting` | `TEXT` | Koordinat GPS presisi saat beraktivitas (Format: `"lat,long"`). |
| `alamat` | `alamat` | `TEXT` | Alamat lengkap lokasi fisik saat dilakukan kunjungan. |
| `proof_url` | `proof_url` | `TEXT` | URL gambar/foto bukti kunjungan dari Tigris Storage. |

### B. Relasi Database & Aturan Bisnis Pemilihan Customer (PENTING)
Aplikasi mendukung alur ganda untuk input customer pada form pemasaran:
1. **Pilih dari database yang ada**: Sistem menampilkan daftar dropdown/modal pencarian customer berdasar data dari tabel `customer`.
2. **Tambah customer baru di tempat**: Jika customer belum terdaftar, tampilkan sub-form penambahan data customer baru di dalam modal/lapisan form pemasaran secara seamless.
   - Menyimpan data pemasaran akan secara otomatis memicu penyimpanan baris baru ke tabel `customer` terlebih dahulu sebelum menyimpan data rekaman `pemasaran` dengan `customer_id` yang baru dibuat tersebut.

---

## 🎨 2. Standar Frontend & Aturan Styling (Wajib Dipatuhi)

Untuk mematangkan konsistensi visual dan performa UI, setiap pengembang frontend wajib mengikuti kaidah ketat di bawah ini:

### A. Satuan Ukuran & Flexibilitas Layar
- **DILARANG KERAS** menggunakan satuan pixel (`px`) untuk mendesain layout maupun komponen custom (misal: padding, margin, width, height, border-radius). 
- **WAJIB** menggunakan satuan **`rem`** (contoh: `p-4` di Tailwind bernilai `1rem`, `rounded-lg` bernilai `0.5rem`). Hal ini menjamin fleksibilitas ukuran visual di berbagai resolusi layar.

### B. Batasan Utilitas Tailwind CSS
- Hanya diperbolehkan menggunakan **Utilitas Class Standar milik Tailwind CSS**.
- **SANGAT DILARANG** memakai *arbitrary values* (contoh: `h-[500px]`, `w-[80%]`, `bg-[#f0f0f0]`, `text-[var(--primary)]`). Semua pilihan ukuran dan warna harus merujuk pada standar token framework.
- **DILARANG** merujuk secara manual ke variabel objek token eksternal jika kelas utilitas bawaan Tailwind telah menyediakannya.

### C. Responsivitas Layar (Viewport Engine)
Sesuai dengan blueprint `AGENTS.md` sistem ini:
- **DILARANG** menggunakan penanda breakpoint responsif dari Tailwind (seperti prefiks `sm:`, `md:`, `lg:`, `xl:`) pada baris kode layout utama.
- **WAJIB** menggunakan **Viewport Engine** dari `useGlobalState()` (menyediakan booleans `isCompact`, `isMobile`, `isWide`) untuk melakukan conditional rendering atau pergantian kelas dinamis via utilitas `cn(...)`.
  *Contoh:*
  ```tsx
  const { isMobile } = useGlobalState();
  const containerClass = cn(
    "flex w-full gap-4",
    isMobile ? "flex-col" : "flex-row"
  );
  ```

### D. Penulisan Teks / Lokalisasi (Redational)
- **SANGAT JELAS**: Segala bentuk teks berbau redaksional frontend (label form, judul hal, placeholder, tombol, pesan sukses/gagal) **HURUS ditulis langsung secara hardcoded di file UI**.
- **DILARANG** menggunakan sistem integrasi file bahasa (`locales/` en/id JSON) untuk mempermudah pengerjaan dan mempercepat compile time demi performa aplikasi yang optimal.

---

## 💾 3. Panduan Pengelolaan Waktu & Penyimpanan Berkas

### A. Keamanan Waktu (TimeRule.md)
1. **Waktu Transaksi (`created_at`, `updated_at`)**: Dihasilkan secara real-time di sisi database menggunakan `CURRENT_TIMESTAMP` (server database UTC).
2. **Waktu Operasional Pemasaran (`visit_date`)**:
   - Dilarang keras menggunakan `new Date()` lokal milik perangkat klien secara langsung untuk menghindari manipulasi waktu oleh user.
   - Ambil waktu aktual terverifikasi menggunakan helper `getActualTime()` dari `src/logic/utils/time.ts`.
   - Gunakan `getTimezoneIdentifier()` untuk merekam zona waktu asli IANA user (misal: 'Asia/Makassar') ke dalam kolom `created_timezone`.

### B. Optimasi File Upload & Bukti Kunjungan (StorageRule.md)
- File foto bukti kunjungan (`proof_url`) wajib dikompresi di sisi client demi kecepatan upload dan penghematan bandwidth. Gunakan fungsi kompresi gambar berbasis library **Pica**.
- Proses pengunggahan dokumen ke Tigris Storage hanya boleh dieksekusi secara aktual ketika tombol **"Simpan"** utama ditekan. Selama proses pengisian form, cukup gunakan temporary Blob/Object URL untuk pratinjau instan gambar.

---

## 🛠️ 4. Langkah Pengujian & Validasi

Setelah mengintegrasikan interface serta form pemasaran, pastikan seluruh perubahan file lolos tahap pengecekan:
1. Lakukan validasi build dengan menjalankan perintah `npm run lint` atau memicu tool `lint_applet` untuk memastikan tidak ada kesalahan ketik ataupun kesalahan nama import (case sensitivity yang bermasalah di level compile).
2. Lakukan pengecekan akhir via `compile_applet`.

---

## ⚙️ 5. Integrasi Backend (Pemasaran Service)

Logika bisnis backend modul pemasaran didukung penuh oleh `pemasaranService` di `/src/logic/services/pemasaranService.ts`. Service ini mencakup operasi CRUD berbasis promise:

### A. Metode Pencarian & Paginasi (`getPaginated`)
Mengambil data secara efisien dengan paginasi (lazy-loading) terpusat, pengurutan, dan pencarian multi-kolom (nama sales, tipe kegiatan, deskripsi, alamat, nama customer, nama perusahaan customer).
```typescript
import { pemasaranService } from '@/logic/services/pemasaranService';

// Contoh memanggil data paginasi halaman 1 dengan pencarian "Apotek"
const { items, total } = await pemasaranService.getPaginated(1, 'Apotek');
```

### B. Otomatisasi Relasi Pembuatan Customer Baru (`create`)
Mendukung pembuatan kunjungan pemasaran baru dengan 2 skenario relasi customer:
1. **Customer Terdaftar**: Masukkan `customer_id` langsung ke payload pemasaran.
2. **Customer Baru**: Kirim `newCustomerData` inline. `pemasaranService` otomatis membuat data customer baru terlebih dahulu dan menghubungkan `id`-nya secara langsung ke records pemasaran.
```typescript
// Skenario 2: Menyimpan kunjungan sekaligus membuat Customer Baru otomatis
const newVisit = await pemasaranService.create(
  {
    visit_date: '2026-05-24T16:00:00.000Z',
    sales_username: 'budi_sales',
    activity_type: 'selling',
    alamat: 'Jl. Merdeka No. 10',
    latlong_visiting: '-6.200000,106.816666',
    description: 'Kunjungan perkenalan produk baru'
  },
  photoFile, // File bukti gambar dari input komputer/kamera
  {
    name: 'Klinik Prima Sehat',
    telepon: '08123456789',
    alamat: 'Jl. Merdeka No. 10',
    latlong: '-6.200000,106.816666',
    company: 'CV Prima Healthcare',
    bidang_usaha: 'Kesehatan'
  }
);
```

### C. Pembersihan Berkas secara Otomatis (`delete` & `update`)
- Saat memperbarui bukti foto kunjungan (`proof_url`), berkas lama yang tersimpan di Tigris Storage otomatis dihapus secara permanen untuk mencegah penumpukan berkas tak terpakai (orphan files).
- Menghapus record pemasaran menggunakan `pemasaranService.delete(id)` akan menghapus entri database, sekaligus menghapus seluruh berkas bukti kunjungan terkait dari Tigris Storage secara real-time.
